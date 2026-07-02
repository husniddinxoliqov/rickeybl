import { Test, TestingModule } from '@nestjs/testing';
import { BadgesService } from './badges.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('BadgesService', () => {
  let service: BadgesService;
  let prisma: jest.Mocked<PrismaService>;
  let audit: jest.Mocked<AuditService>;

  const mockPrisma = {
    badge: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    userBadge: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
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
        BadgesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get<BadgesService>(BadgesService);
    prisma = module.get(PrismaService);
    audit = module.get(AuditService);

    jest.clearAllMocks();
  });

  describe('listBadges', () => {
    it('should return active badges ordered by createdAt desc', async () => {
      const badges = [
        { id: '1', name: 'Badge A', isActive: true },
        { id: '2', name: 'Badge B', isActive: true },
      ];
      mockPrisma.badge.findMany.mockResolvedValue(badges);

      const result = await service.listBadges();

      expect(result).toEqual(badges);
      expect(mockPrisma.badge.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('createBadge', () => {
    it('should create a badge and log the audit', async () => {
      const dto = {
        name: 'Test Badge',
        description: 'A test badge',
        requiredCoins: 10,
      };
      const createdBadge = {
        id: 'badge-1',
        name: 'Test Badge',
        description: 'A test badge',
        requiredCoins: 10,
        isActive: true,
      };

      mockPrisma.badge.create.mockResolvedValue(createdBadge);

      const result = await service.createBadge('actor-1', dto);

      expect(result).toEqual(createdBadge);
      expect(mockPrisma.badge.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Badge',
          description: 'A test badge',
          iconUrl: undefined,
          requiredCoins: 10,
          isActive: true,
        },
      });
      expect(mockAudit.log).toHaveBeenCalledWith(
        'actor-1',
        'badge.created',
        'Badge',
        'badge-1',
        null,
        { name: 'Test Badge' },
      );
    });

    it('should handle optional i18n fields', async () => {
      const dto = {
        name: 'Badge',
        description: 'Desc',
        nameI18n: { uz: 'Nishon', ru: 'Значок', en: 'Badge' },
      };
      const createdBadge = { id: 'badge-2', name: 'Badge', description: 'Desc' };

      mockPrisma.badge.create.mockResolvedValue(createdBadge);

      const result = await service.createBadge('actor-1', dto);

      expect(result).toEqual(createdBadge);
    });
  });
});
