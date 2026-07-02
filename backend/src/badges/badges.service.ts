import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { localizedText, normalizeLocalizedText } from '../common/i18n/localized-content';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { publicUserBaseSelect } from '../common/selects/public-user.select';
import { isStudentInScope, resolveStaffScope } from '../common/utils/staff-scope.util';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { AwardBadgeDto } from './dto/award-badge.dto';
import { CreateBadgeDto } from './dto/create-badge.dto';

@Injectable()
export class BadgesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  listBadges() {
    return this.prisma.badge.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  getMyBadges(userId: string) {
    return this.prisma.userBadge.findMany({
      where: { userId },
      include: {
        badge: true,
        awarder: {
          select: publicUserBaseSelect,
        },
      },
      orderBy: { awardedAt: 'desc' },
    });
  }

  async createBadge(actorId: string, dto: CreateBadgeDto) {
    const nameI18n = normalizeLocalizedText(dto.nameI18n);
    const descriptionI18n = normalizeLocalizedText(dto.descriptionI18n);
    const badge = await this.prisma.badge.create({
      data: {
        name: dto.name.trim(),
        description: dto.description.trim(),
        ...(nameI18n ? { nameI18n } : {}),
        ...(descriptionI18n ? { descriptionI18n } : {}),
        iconUrl: dto.iconUrl,
        requiredCoins: dto.requiredCoins ?? 0,
        isActive: dto.isActive ?? true,
      },
    });

    await this.auditService.log(actorId, 'badge.created', 'Badge', badge.id, null, {
      name: badge.name,
    });

    return badge;
  }

  async awardBadge(actor: AuthenticatedUser, dto: AwardBadgeDto) {
    const [user, badge] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: dto.userId },
        include: { studentProfile: true },
      }),
      this.prisma.badge.findUnique({ where: { id: dto.badgeId } }),
    ]);

    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!badge) {
      throw new NotFoundException('Badge not found');
    }

    const scope = resolveStaffScope(actor);
    if (scope && user.studentProfile) {
      if (!isStudentInScope(scope, user.studentProfile.facultyId, user.studentProfile.groupId)) {
        throw new ForbiddenException('Target user is not in your assigned scope');
      }
    }

    const existing = await this.prisma.userBadge.findFirst({
      where: {
        userId: dto.userId,
        badgeId: dto.badgeId,
      },
    });
    if (existing) {
      throw new ConflictException('Badge already awarded to this user');
    }

    const award = await this.prisma.userBadge.create({
      data: {
        userId: dto.userId,
        badgeId: dto.badgeId,
        awardedBy: actor.id,
        note: dto.note,
      },
      include: {
        badge: true,
        awarder: {
          select: publicUserBaseSelect,
        },
      },
    });

    await this.auditService.log(actor.id, 'badge.awarded', 'UserBadge', award.id, null, {
      userId: dto.userId,
      badgeId: dto.badgeId,
    });

    await this.notificationsService.createNotification(
      dto.userId,
      'New badge awarded',
      `You received the ${badge.name} badge.`,
      NotificationType.REWARD,
      {
        titleI18n: localizedText('Yangi badge berildi', 'Выдан новый badge', 'New badge awarded'),
        bodyI18n: localizedText(
          `Siz ${badge.name} badge'ini oldingiz.`,
          `Вы получили badge ${badge.name}.`,
          `You received the ${badge.name} badge.`,
        ),
      },
    );

    return award;
  }
}
