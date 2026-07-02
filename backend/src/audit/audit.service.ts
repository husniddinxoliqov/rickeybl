import { Injectable } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { resolveStaffScope } from '../common/utils/staff-scope.util';
import { publicUserBaseSelect } from '../common/selects/public-user.select';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(
    actorId: string | null | undefined,
    action: string,
    entity: string,
    entityId?: string | null,
    oldValue: Prisma.InputJsonValue | null = null,
    newValue: Prisma.InputJsonValue | null = null,
    ipAddress?: string | null,
  ) {
    const toNullableJson = (value: Prisma.InputJsonValue | null) =>
      value === null ? Prisma.JsonNull : value;

    return this.prisma.auditLog.create({
      data: {
        actorId: actorId ?? null,
        action,
        entity,
        entityId: entityId ?? null,
        oldValue: toNullableJson(oldValue),
        newValue: toNullableJson(newValue),
        ipAddress: ipAddress ?? null,
      },
    });
  }

  async listLogsForActor(actor: AuthenticatedUser) {
    if (actor.role === UserRole.ROOT) {
      return this.prisma.auditLog.findMany({
        include: {
          actor: { select: publicUserBaseSelect },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    }

    const scope = resolveStaffScope(actor);
    if (!scope) {
      return this.prisma.auditLog.findMany({
        include: {
          actor: { select: publicUserBaseSelect },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    }

    const profiles = await this.prisma.studentProfile.findMany({
      where: {
        OR: [
          {
            facultyId: { in: scope.facultyWideIds },
          },
          {
            groupId: { in: scope.groupSpecificIds },
          },
        ],
      },
      select: {
        id: true,
        userId: true,
      },
    });

    const profileIds = profiles.map((item) => item.id);
    const userIds = profiles.map((item) => item.userId);
    if (profileIds.length === 0 && userIds.length === 0) {
      return [];
    }

    return this.prisma.auditLog.findMany({
      where: {
        OR: [
          { actorId: actor.id },
          { actorId: { in: userIds } },
          { entity: 'StudentProfile', entityId: { in: profileIds } },
          { entity: 'User', entityId: { in: userIds } },
        ],
      },
      include: {
        actor: { select: publicUserBaseSelect },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
