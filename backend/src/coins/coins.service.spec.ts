import { Test, TestingModule } from '@nestjs/testing';
import { CoinsService } from './coins.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UserRole } from '@prisma/client';

describe('CoinsService', () => {
  let service: CoinsService;

  const mockPrisma = {
    coinTransaction: {
      aggregate: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockAudit = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  const mockNotifications = {
    createNotification: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoinsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get<CoinsService>(CoinsService);

    jest.clearAllMocks();
  });

  describe('getBalance', () => {
    it('should return the sum of coin transactions for a user', async () => {
      mockPrisma.coinTransaction.aggregate.mockResolvedValue({
        _sum: { amount: 150 },
      });

      const result = await service.getBalance('user-1');

      expect(result).toEqual({ balance: 150 });
      expect(mockPrisma.coinTransaction.aggregate).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        _sum: { amount: true },
      });
    });

    it('should return 0 when no transactions exist', async () => {
      mockPrisma.coinTransaction.aggregate.mockResolvedValue({
        _sum: { amount: null },
      });

      const result = await service.getBalance('user-2');

      expect(result).toEqual({ balance: 0 });
    });
  });

  describe('awardCoins', () => {
    it('should create a transaction and notify the user', async () => {
      const actor = {
        id: 'staff-1',
        username: 'staffuser',
        role: UserRole.ROOT,
        staffAssignments: [],
      };
      const dto = { userId: 'student-1', amount: 50, reason: 'Great work' };
      const user = {
        id: 'student-1',
        role: UserRole.STUDENT,
        studentProfile: null,
      };
      const transaction = {
        id: 'tx-1',
        userId: 'student-1',
        amount: 50,
        type: 'EARN',
        reason: 'Great work',
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.coinTransaction.create.mockResolvedValue(transaction);

      const result = await service.awardCoins(actor, dto);

      expect(result).toEqual(transaction);
      expect(mockPrisma.coinTransaction.create).toHaveBeenCalledWith({
        data: {
          userId: 'student-1',
          amount: 50,
          type: 'EARN',
          reason: 'Great work',
        },
      });
      expect(mockAudit.log).toHaveBeenCalledWith(
        'staff-1',
        'coins.awarded',
        'CoinTransaction',
        'tx-1',
        null,
        { amount: 50, userId: 'student-1' },
      );
      expect(mockNotifications.createNotification).toHaveBeenCalled();
    });
  });
});
