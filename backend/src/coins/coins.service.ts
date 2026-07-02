import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CoinTransactionType, NotificationType } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { isStudentInScope, resolveStaffScope } from '../common/utils/staff-scope.util';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { AwardCoinsDto } from './dto/award-coins.dto';

@Injectable()
export class CoinsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getBalance(userId: string) {
    const aggregate = await this.prisma.coinTransaction.aggregate({
      where: { userId },
      _sum: { amount: true },
    });

    return {
      balance: aggregate._sum.amount ?? 0,
    };
  }

  async getHistory(userId: string, page = 1, limit = 20) {
    const safePage = Math.max(page, 1);
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const [items, total] = await Promise.all([
      this.prisma.coinTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
      }),
      this.prisma.coinTransaction.count({ where: { userId } }),
    ]);

    return {
      items,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
      },
    };
  }

  async awardCoins(actor: AuthenticatedUser, dto: AwardCoinsDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      include: { studentProfile: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const scope = resolveStaffScope(actor);
    if (scope && user.studentProfile) {
      if (!isStudentInScope(scope, user.studentProfile.facultyId, user.studentProfile.groupId)) {
        throw new ForbiddenException('Target user is not in your assigned scope');
      }
    }

    const transaction = await this.prisma.coinTransaction.create({
      data: {
        userId: dto.userId,
        amount: dto.amount,
        type: CoinTransactionType.EARN,
        reason: dto.reason.trim(),
      },
    });

    await this.auditService.log(actor.id, 'coins.awarded', 'CoinTransaction', transaction.id, null, {
      amount: transaction.amount,
      userId: transaction.userId,
    });

    await this.notificationsService.createNotification(
      dto.userId,
      'Coins awarded',
      `You received ${dto.amount} coins: ${dto.reason}`,
      NotificationType.REWARD,
    );

    return transaction;
  }

  async deductCoins(
    userId: string,
    amount: number,
    reason: string,
    refId?: string,
    type: CoinTransactionType = CoinTransactionType.DEDUCT,
  ) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { balance } = await this.getBalance(userId);
    if (balance < amount) {
      throw new BadRequestException('Insufficient coin balance');
    }

    const transaction = await this.prisma.coinTransaction.create({
      data: {
        userId,
        amount: -Math.abs(amount),
        type,
        reason: reason.trim(),
        referenceId: refId,
      },
    });

    await this.auditService.log(userId, 'coins.deducted', 'CoinTransaction', transaction.id, null, {
      amount: transaction.amount,
      type,
      referenceId: refId,
    });

    return transaction;
  }
}
