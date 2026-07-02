import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { normalizeLocalizedText } from '../common/i18n/localized-content';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { resolveStaffScope } from '../common/utils/staff-scope.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async list(actor: AuthenticatedUser) {
    const where: Prisma.AnnouncementWhereInput = {};

    if (actor.role === UserRole.STUDENT) {
      const profile = actor.studentProfile;
      where.isPublished = true;
      if (profile) {
        where.OR = [
          { facultyId: null, groupId: null },
          { facultyId: profile.facultyId, groupId: null },
          { groupId: profile.groupId },
        ];
      } else {
        where.facultyId = null;
        where.groupId = null;
      }
    }

    if (actor.role === UserRole.STAFF) {
      const scope = resolveStaffScope(actor);
      if (scope) {
        const scoped: Prisma.AnnouncementWhereInput[] = [
          { facultyId: null, groupId: null },
          { createdBy: actor.id },
        ];
        if (scope.facultyWideIds.length) {
          scoped.push({ facultyId: { in: scope.facultyWideIds } });
        }
        if (scope.groupSpecificIds.length) {
          scoped.push({ groupId: { in: scope.groupSpecificIds } });
        }
        where.OR = scoped;
      }
    }

    return this.prisma.announcement.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
        faculty: true,
        group: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(actor: AuthenticatedUser, dto: CreateAnnouncementDto) {
    this.assertCanWrite(actor, dto.facultyId, dto.groupId);
    const announcement = await this.prisma.announcement.create({
      data: {
        title: dto.title.trim(),
        body: dto.body.trim(),
        ...(dto.titleI18n ? { titleI18n: normalizeLocalizedText(dto.titleI18n) } : {}),
        ...(dto.bodyI18n ? { bodyI18n: normalizeLocalizedText(dto.bodyI18n) } : {}),
        facultyId: dto.facultyId ?? null,
        groupId: dto.groupId ?? null,
        createdBy: actor.id,
        isPublished: dto.isPublished ?? true,
      },
    });

    await this.auditService.log(actor.id, 'announcement.created', 'Announcement', announcement.id);
    return announcement;
  }

  async update(actor: AuthenticatedUser, id: string, dto: UpdateAnnouncementDto) {
    const existing = await this.prisma.announcement.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Announcement not found');
    }
    if (actor.role === UserRole.STAFF && existing.createdBy !== actor.id) {
      // Editing another staff member's announcement is allowed only when the
      // current announcement is already inside the actor scope.
      this.assertCanWrite(actor, existing.facultyId ?? undefined, existing.groupId ?? undefined);
    }
    this.assertCanWrite(
      actor,
      dto.facultyId ?? existing.facultyId ?? undefined,
      dto.groupId ?? existing.groupId ?? undefined,
    );

    const updated = await this.prisma.announcement.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.body !== undefined ? { body: dto.body.trim() } : {}),
        ...(dto.titleI18n !== undefined ? { titleI18n: normalizeLocalizedText(dto.titleI18n) || Prisma.JsonNull } : {}),
        ...(dto.bodyI18n !== undefined ? { bodyI18n: normalizeLocalizedText(dto.bodyI18n) || Prisma.JsonNull } : {}),
        ...(dto.facultyId !== undefined ? { facultyId: dto.facultyId || null } : {}),
        ...(dto.groupId !== undefined ? { groupId: dto.groupId || null } : {}),
        ...(dto.isPublished !== undefined ? { isPublished: dto.isPublished } : {}),
      },
    });

    await this.auditService.log(actor.id, 'announcement.updated', 'Announcement', updated.id);
    return updated;
  }

  async delete(actor: AuthenticatedUser, id: string) {
    const existing = await this.prisma.announcement.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Announcement not found');
    }

    // STAFF can only delete their own announcements, ROOT can delete any
    if (actor.role === UserRole.STAFF && existing.createdBy !== actor.id) {
      throw new ForbiddenException('You can only delete your own announcements');
    }

    await this.prisma.announcement.delete({ where: { id } });

    await this.auditService.log(actor.id, 'announcement.deleted', 'Announcement', id);
    return { success: true };
  }

  private assertCanWrite(actor: AuthenticatedUser, facultyId?: string, groupId?: string) {
    if (actor.role === UserRole.ROOT) {
      return;
    }

    const scope = resolveStaffScope(actor);
    if (!scope) {
      return;
    }

    if (!facultyId && !groupId) {
      return;
    }

    const allowed =
      (facultyId ? scope.facultyWideIds.includes(facultyId) : false) ||
      (groupId ? scope.groupSpecificIds.includes(groupId) : false);

    if (!allowed) {
      throw new ForbiddenException('Announcement is outside your assigned scope');
    }
  }
}
