import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    authSession: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const mockJwt = {
    sign: jest.fn().mockReturnValue('mock-access-token'),
  };

  const mockConfig = {
    get: jest.fn().mockReturnValue('test-bot-token'),
  };

  const mockAudit = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return user profile with student profile included', async () => {
      const user = {
        id: 'user-1',
        telegramId: '12345',
        username: 'testuser',
        email: null,
        role: 'STUDENT',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        studentProfile: null,
      };
      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = await service.getProfile('user-1');

      expect(result).toEqual(user);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: expect.objectContaining({
          id: true,
          username: true,
          role: true,
        }),
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('nonexistent')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should revoke the session and return success', async () => {
      mockPrisma.authSession.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.logout('user-1', 'refresh-token');

      expect(result).toEqual({ success: true });
      expect(mockPrisma.authSession.updateMany).toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(
        'user-1',
        'auth.logout',
        'AuthSession',
      );
    });
  });

  describe('logoutAll', () => {
    it('should revoke all sessions for the user', async () => {
      mockPrisma.authSession.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.logoutAll('user-1');

      expect(result).toEqual({ success: true });
      expect(mockPrisma.authSession.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          revokedAt: null,
        },
        data: {
          revokedAt: expect.any(Date),
        },
      });
    });
  });
});
