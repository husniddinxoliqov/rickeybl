import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { StudentStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { CredentialLoginDto } from './dto/credential-login.dto';

interface TelegramUserPayload {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
}

const MAX_FAILED_LOGINS = 5;
const LOCKOUT_MINUTES = 15;
const REFRESH_TTL_DAYS = 30;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  async telegramAuth(initData: string) {
    const telegramUser = this.verifyTelegramInitData(initData);
    const telegramId = String(telegramUser.id);
    const safeUsername = await this.resolveTelegramUsername(
      telegramUser.username,
      telegramId,
    );

    const user = await this.prisma.user.upsert({
      where: { telegramId },
      update: {
        username: safeUsername,
        isActive: true,
      },
      create: {
        telegramId,
        username: safeUsername,
        role: UserRole.STUDENT,
      },
    });

    const safeUser = await this.getProfile(user.id);

    await this.auditService.log(
      user.id,
      'auth.telegram',
      'User',
      user.id,
      null,
      {
        telegramId,
        username: safeUser.username,
        studentStatus: safeUser.studentProfile?.status ?? StudentStatus.PENDING,
      },
    );

    const authPayload = await this.issueSessionTokens(user.id, user.role, user.telegramId ?? undefined);

    return { ...authPayload, user: safeUser };
  }

  async adminLogin(dto: AdminLoginDto) {
    const username = dto.username.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: { studentProfile: true },
    });
    if (!user || user.role !== UserRole.ROOT) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.completeCredentialLogin(user.id, dto.password, [UserRole.ROOT]);
  }

  async credentialLogin(dto: CredentialLoginDto, allowedRoles: UserRole[]) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        studentProfile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.completeCredentialLogin(user.id, dto.password, allowedRoles);
  }

  async refresh(refreshToken: string) {
    const tokenHash = this.hashRefreshToken(refreshToken);
    const now = new Date();
    const session = await this.prisma.authSession.findFirst({
      where: {
        refreshTokenHash: tokenHash,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      include: {
        user: {
          select: {
            id: true,
            role: true,
            telegramId: true,
            isActive: true,
          },
        },
      },
    });

    if (!session || !session.user.isActive) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.authSession.update({
      where: { id: session.id },
      data: { revokedAt: now },
    });

    const payload = await this.issueSessionTokens(
      session.user.id,
      session.user.role,
      session.user.telegramId ?? undefined,
    );
    await this.auditService.log(session.user.id, 'auth.session_refreshed', 'AuthSession', payload.sessionId);

    return payload;
  }

  async logout(userId: string, refreshToken: string) {
    const tokenHash = this.hashRefreshToken(refreshToken);
    await this.prisma.authSession.updateMany({
      where: {
        userId,
        refreshTokenHash: tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
    await this.auditService.log(userId, 'auth.logout', 'AuthSession');
    return { success: true };
  }

  async logoutAll(userId: string) {
    await this.prisma.authSession.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
    await this.auditService.log(userId, 'auth.logout_all', 'AuthSession');
    return { success: true };
  }

  private async completeCredentialLogin(
    userId: string,
    password: string,
    allowedRoles: UserRole[],
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { studentProfile: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const now = new Date();
    if (user.lockedUntil && user.lockedUntil > now) {
      await this.auditService.log(user.id, 'auth.login_locked', 'User', user.id, null, {
        lockedUntil: user.lockedUntil.toISOString(),
      });
      throw new HttpException(
        'Account temporarily locked. Try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenException('This account role is not allowed for this login endpoint');
    }
    if (!user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      const failedLoginCount = user.failedLoginCount + 1;
      const lock = failedLoginCount >= MAX_FAILED_LOGINS;
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount,
          lockedUntil: lock ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000) : null,
        },
      });
      await this.auditService.log(user.id, 'auth.login_failed', 'User', user.id, null, {
        failedLoginCount,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
      },
    });

    const authPayload = await this.issueSessionTokens(user.id, user.role, user.telegramId ?? undefined);
    await this.auditService.log(user.id, 'auth.credential_login', 'User', user.id);

    return {
      ...authPayload,
      user: await this.getProfile(user.id),
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        telegramId: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        studentProfile: {
          include: {
            faculty: true,
            group: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  private signToken(userId: string, role: UserRole, telegramId?: string) {
    return this.jwtService.sign(
      {
        sub: userId,
        role,
        tgId: telegramId,
      },
      {
        expiresIn: role === UserRole.STUDENT ? '7d' : '1d',
      },
    );
  }

  private async issueSessionTokens(userId: string, role: UserRole, telegramId?: string) {
    const refreshToken = randomBytes(48).toString('hex');
    const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
    const session = await this.prisma.authSession.create({
      data: {
        userId,
        refreshTokenHash: this.hashRefreshToken(refreshToken),
        expiresAt,
      },
    });

    return {
      accessToken: this.signToken(userId, role, telegramId),
      refreshToken,
      sessionId: session.id,
    };
  }

  private hashRefreshToken(refreshToken: string) {
    return createHash('sha256').update(refreshToken).digest('hex');
  }

  private async resolveTelegramUsername(
    username: string | undefined,
    telegramId: string,
  ) {
    const base = (username?.trim().toLowerCase() || `tg_${telegramId}`)
      .replace(/[^a-z0-9_]/g, '_')
      .slice(0, 32);
    const preferred = base || `tg_${telegramId}`;
    const existing = await this.prisma.user.findFirst({
      where: {
        username: preferred,
        telegramId: {
          not: telegramId,
        },
      },
    });

    return existing ? `${preferred}_${telegramId}`.slice(0, 48) : preferred;
  }

  private verifyTelegramInitData(initData: string): TelegramUserPayload {
    const botToken = this.configService.get<string>('BOT_TOKEN');
    if (!botToken) {
      throw new UnauthorizedException('BOT_TOKEN is not configured');
    }

    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    const authDate = params.get('auth_date');
    const userValue = params.get('user');

    if (!hash || !authDate || !userValue) {
      throw new BadRequestException('Invalid Telegram init data payload');
    }

    const authTimestamp = Number(authDate);
    if (!Number.isFinite(authTimestamp)) {
      throw new BadRequestException('Invalid auth_date in Telegram payload');
    }

    const ageSeconds = Math.floor(Date.now() / 1000) - authTimestamp;
    if (ageSeconds < 0 || ageSeconds > 300) {
      throw new UnauthorizedException('Telegram authentication payload expired');
    }

    const dataCheckString = [...params.entries()]
      .filter(([key]) => key !== 'hash')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
    const computedHash = createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest();
    const receivedHash = Buffer.from(hash, 'hex');

    if (
      computedHash.length !== receivedHash.length ||
      !timingSafeEqual(computedHash, receivedHash)
    ) {
      throw new UnauthorizedException('Telegram init data signature is invalid');
    }

    try {
      return JSON.parse(userValue) as TelegramUserPayload;
    } catch {
      throw new BadRequestException('Telegram user payload is malformed');
    }
  }
}
