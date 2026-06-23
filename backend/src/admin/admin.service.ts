import { Injectable } from '@nestjs/common';
import { CoinTransactionType, ShopOrderStatus, StudentStatus } from '@prisma/client';
import { publicUserBaseSelect } from '../common/selects/public-user.select';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [users, studentsPending, activeOrders, awardedCoins] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.studentProfile.count({ where: { status: StudentStatus.PENDING } }),
      this.prisma.shopOrder.count({
        where: { status: { in: [ShopOrderStatus.PENDING, ShopOrderStatus.APPROVED] } },
      }),
      this.prisma.coinTransaction.aggregate({
        where: { type: CoinTransactionType.EARN },
        _sum: { amount: true },
      }),
    ]);

    return {
      users,
      studentsPending,
      activeOrders,
      coinsAwarded: awardedCoins._sum.amount ?? 0,
    };
  }

  listUsers() {
    return this.prisma.user.findMany({
      select: {
        ...publicUserBaseSelect,
        studentProfile: {
          include: {
            faculty: true,
            group: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  listAuditLogs() {
    return this.prisma.auditLog.findMany({
      include: {
        actor: {
          select: publicUserBaseSelect,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
