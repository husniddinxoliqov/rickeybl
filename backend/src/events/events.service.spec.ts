import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UserRole } from '@prisma/client';

describe('EventsService', () => {
  let service: EventsService;

  const mockPrisma = {
    event: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    eventRegistration: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    faculty: {
      findUnique: jest.fn(),
    },
  };

  const mockAudit = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);

    jest.clearAllMocks();
  });

  describe('listEvents', () => {
    it('should return published events ordered by startAt', async () => {
      const events = [
        { id: '1', title: 'Event A', isPublished: true },
        { id: '2', title: 'Event B', isPublished: true },
      ];
      mockPrisma.event.findMany.mockResolvedValue(events);

      const result = await service.listEvents();

      expect(result).toEqual(events);
      expect(mockPrisma.event.findMany).toHaveBeenCalledWith({
        where: { isPublished: true },
        include: {
          faculty: true,
          creator: { select: expect.any(Object) },
        },
        orderBy: { startAt: 'asc' },
      });
    });
  });

  describe('createEvent', () => {
    it('should create an event and log the audit', async () => {
      const actor = {
        id: 'staff-1',
        username: 'staffuser',
        role: UserRole.ROOT,
        staffAssignments: [],
      };
      const dto = {
        title: 'Test Event',
        description: 'Event description',
        startAt: '2024-06-01T10:00:00Z',
        isPublished: true,
        coinsReward: 25,
      };
      const createdEvent = {
        id: 'event-1',
        title: 'Test Event',
        description: 'Event description',
        startAt: new Date('2024-06-01T10:00:00Z'),
        isPublished: true,
        coinsReward: 25,
        createdBy: 'staff-1',
      };

      mockPrisma.event.create.mockResolvedValue(createdEvent);

      const result = await service.createEvent(actor, dto);

      expect(result).toEqual(createdEvent);
      expect(mockPrisma.event.create).toHaveBeenCalledWith({
        data: {
          title: 'Test Event',
          description: 'Event description',
          facultyId: undefined,
          startAt: new Date('2024-06-01T10:00:00Z'),
          endAt: null,
          createdBy: 'staff-1',
          isPublished: true,
          coinsReward: 25,
        },
        include: {
          faculty: true,
          creator: { select: expect.any(Object) },
        },
      });
      expect(mockAudit.log).toHaveBeenCalledWith(
        'staff-1',
        'event.created',
        'Event',
        'event-1',
        null,
        { title: 'Test Event' },
      );
    });
  });
});
