import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
    return this.prisma.auditLog.create({
      data: {
        actorId: actorId ?? null,
        action,
        entity,
        entityId: entityId ?? null,
        oldValue,
        newValue,
        ipAddress: ipAddress ?? null,
      },
    });
  }
}
