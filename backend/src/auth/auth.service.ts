import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { StudentStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHmac, timingSafeEqual } from 'crypto';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { AdminLoginDto } from './dto/admin-login.dto';

interface TelegramUserPayload {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
}

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

    return {
      accessToken: this.signToken(user.id, user.role, user.telegramId ?? undefined),
      user: safeUser,
    };
  }

  async adminLogin(dto: AdminLoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username.toLowerCase() },
      include: {
        studentProfile: true,
      },
    });

    if (!user || user.role !== UserRole.ROOT || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.auditService.log(user.id, 'auth.admin_login', 'User', user.id);

    return {
      accessToken: this.signToken(user.id, user.role, user.telegramId ?? undefined),
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
