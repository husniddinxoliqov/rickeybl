import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { publicUserBaseSelect } from '../common/selects/public-user.select';
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
    const badge = await this.prisma.badge.create({
      data: {
        name: dto.name.trim(),
        description: dto.description.trim(),
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

  async awardBadge(actorId: string, dto: AwardBadgeDto) {
    const [user, badge] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: dto.userId } }),
      this.prisma.badge.findUnique({ where: { id: dto.badgeId } }),
    ]);

    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!badge) {
      throw new NotFoundException('Badge not found');
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
        awardedBy: actorId,
        note: dto.note,
      },
      include: {
        badge: true,
        awarder: {
          select: publicUserBaseSelect,
        },
      },
    });

    await this.auditService.log(actorId, 'badge.awarded', 'UserBadge', award.id, null, {
      userId: dto.userId,
      badgeId: dto.badgeId,
    });

    await this.notificationsService.createNotification(
      dto.userId,
      'New badge awarded',
      `You received the ${badge.name} badge.`,
      NotificationType.REWARD,
    );

    return award;
  }
}
