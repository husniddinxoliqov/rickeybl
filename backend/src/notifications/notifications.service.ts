import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { LocalizedText, normalizeLocalizedText } from '../common/i18n/localized-content';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  getMyNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async markRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { success: true };
  }

  createNotification(
    userId: string,
    title: string,
    body: string,
    type: NotificationType,
    localized?: {
      titleI18n?: LocalizedText;
      bodyI18n?: LocalizedText;
    },
  ) {
    const titleI18n = normalizeLocalizedText(localized?.titleI18n);
    const bodyI18n = normalizeLocalizedText(localized?.bodyI18n);

    return this.prisma.notification.create({
      data: {
        userId,
        title,
        ...(titleI18n ? { titleI18n } : {}),
        body,
        ...(bodyI18n ? { bodyI18n } : {}),
        type,
      },
    });
  }
}
