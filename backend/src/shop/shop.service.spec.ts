import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ShopService } from './shop.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('ShopService', () => {
  let service: ShopService;

  const mockTransaction = jest.fn();

  const mockPrisma = {
    shopItem: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    shopOrder: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    coinTransaction: {
      aggregate: jest.fn(),
      create: jest.fn(),
    },
    $transaction: mockTransaction,
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
        ShopService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get<ShopService>(ShopService);

    jest.clearAllMocks();
  });

  describe('createItem', () => {
    it('should create a shop item and log the audit', async () => {
      const dto = {
        name: 'Test Item',
        description: 'A test item',
        coinCost: 100,
        stock: 10,
      };
      const createdItem = {
        id: 'item-1',
        name: 'Test Item',
        description: 'A test item',
        coinCost: 100,
        stock: 10,
        isActive: true,
      };

      mockPrisma.shopItem.create.mockResolvedValue(createdItem);

      const result = await service.createItem('actor-1', dto);

      expect(result).toEqual(createdItem);
      expect(mockPrisma.shopItem.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Item',
          description: 'A test item',
          imageUrl: undefined,
          coinCost: 100,
          stock: 10,
          isActive: true,
        },
      });
      expect(mockAudit.log).toHaveBeenCalledWith(
        'actor-1',
        'shop.item_created',
        'ShopItem',
        'item-1',
        null,
        { name: 'Test Item' },
      );
    });
  });

  describe('createOrder', () => {
    it('should create an order with transaction', async () => {
      const dto = { itemId: 'item-1', quantity: 2, notes: 'Please hurry' };
      const order = {
        id: 'order-1',
        userId: 'user-1',
        itemId: 'item-1',
        quantity: 2,
        totalCost: 200,
        status: 'PENDING',
        item: { id: 'item-1', name: 'Test Item', nameI18n: null },
      };

      mockTransaction.mockImplementation(async (fn) => {
        const txClient = {
          shopItem: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'item-1',
              name: 'Test Item',
              coinCost: 100,
              stock: 10,
              isActive: true,
            }),
            update: jest.fn(),
          },
          coinTransaction: {
            aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 500 } }),
            create: jest.fn(),
          },
          shopOrder: {
            create: jest.fn().mockResolvedValue(order),
          },
        };
        return fn(txClient);
      });

      const result = await service.createOrder('user-1', dto);

      expect(result).toEqual(order);
      expect(mockAudit.log).toHaveBeenCalledWith(
        'user-1',
        'shop.order_created',
        'ShopOrder',
        'order-1',
        null,
        { totalCost: 200, quantity: 2 },
      );
      expect(mockNotifications.createNotification).toHaveBeenCalled();
    });

    it('should throw NotFoundException when item is not available', async () => {
      const dto = { itemId: 'nonexistent', quantity: 1 };

      mockTransaction.mockImplementation(async (fn) => {
        const txClient = {
          shopItem: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        };
        return fn(txClient);
      });

      await expect(service.createOrder('user-1', dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
