import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { publicUserBaseSelect } from '../common/selects/public-user.select';
import { AuditService } from '../audit/audit.service';
import { normalizeLocalizedText } from '../common/i18n/localized-content';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { resolveStaffScope } from '../common/utils/staff-scope.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

const eventCreatorSelect = {
  select: publicUserBaseSelect,
};

const registrationUserSelect = {
  select: {
    ...publicUserBaseSelect,
    studentProfile: true,
  },
};

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  listEvents() {
    return this.prisma.event.findMany({
      where: { isPublished: true },
      include: {
        faculty: true,
        creator: eventCreatorSelect,
      },
      orderBy: { startAt: 'asc' },
    });
  }

  async getEventById(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        faculty: true,
        creator: eventCreatorSelect,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  async createEvent(actor: AuthenticatedUser, dto: CreateEventDto) {
    if (dto.facultyId) {
      const faculty = await this.prisma.faculty.findUnique({ where: { id: dto.facultyId } });
      if (!faculty) {
        throw new NotFoundException('Faculty not found');
      }

      const scope = resolveStaffScope(actor);
      if (scope) {
        // Allow access if the staff has ANY assignment (faculty-wide OR
        // group-specific) for this faculty, so a staff member scoped to
        // a specific group within the faculty can still create faculty events.
        const accessibleFacultyIds = (actor.staffAssignments ?? []).map((a) => a.facultyId);
        if (!accessibleFacultyIds.includes(dto.facultyId)) {
          throw new ForbiddenException('Faculty is not in your assigned scope');
        }
      }
    }

    const titleI18n = normalizeLocalizedText(dto.titleI18n);
    const descriptionI18n = normalizeLocalizedText(dto.descriptionI18n);
    const event = await this.prisma.event.create({
      data: {
        title: dto.title.trim(),
        description: dto.description.trim(),
        ...(titleI18n ? { titleI18n } : {}),
        ...(descriptionI18n ? { descriptionI18n } : {}),
        facultyId: dto.facultyId,
        startAt: new Date(dto.startAt),
        endAt: dto.endAt ? new Date(dto.endAt) : null,
        createdBy: actor.id,
        isPublished: dto.isPublished ?? false,
        coinsReward: dto.coinsReward ?? 0,
      },
      include: {
        faculty: true,
        creator: eventCreatorSelect,
      },
    });

    await this.auditService.log(actor.id, 'event.created', 'Event', event.id, null, {
      title: event.title,
    });

    return event;
  }

  async updateEvent(actor: AuthenticatedUser, id: string, dto: UpdateEventDto) {
    const existing = await this.prisma.event.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Event not found');
    }

    // Check permission: creator or scope check
    if (existing.createdBy !== actor.id) {
      const scope = resolveStaffScope(actor);
      if (scope && existing.facultyId) {
        const accessibleFacultyIds = (actor.staffAssignments ?? []).map((a) => a.facultyId);
        if (!accessibleFacultyIds.includes(existing.facultyId)) {
          throw new ForbiddenException('Event is not in your assigned scope');
        }
      }
    }

    if (dto.facultyId) {
      const faculty = await this.prisma.faculty.findUnique({ where: { id: dto.facultyId } });
      if (!faculty) {
        throw new NotFoundException('Faculty not found');
      }
    }

    const titleI18n = dto.titleI18n !== undefined ? normalizeLocalizedText(dto.titleI18n) : undefined;
    const descriptionI18n = dto.descriptionI18n !== undefined ? normalizeLocalizedText(dto.descriptionI18n) : undefined;

    const event = await this.prisma.event.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description.trim() } : {}),
        ...(titleI18n !== undefined ? { titleI18n: titleI18n || undefined } : {}),
        ...(descriptionI18n !== undefined ? { descriptionI18n: descriptionI18n || undefined } : {}),
        ...(dto.facultyId !== undefined ? { facultyId: dto.facultyId } : {}),
        ...(dto.startAt !== undefined ? { startAt: new Date(dto.startAt) } : {}),
        ...(dto.endAt !== undefined ? { endAt: dto.endAt ? new Date(dto.endAt) : null } : {}),
        ...(dto.isPublished !== undefined ? { isPublished: dto.isPublished } : {}),
        ...(dto.coinsReward !== undefined ? { coinsReward: dto.coinsReward } : {}),
      },
      include: {
        faculty: true,
        creator: eventCreatorSelect,
      },
    });

    await this.auditService.log(actor.id, 'event.updated', 'Event', event.id, {
      title: existing.title,
    }, {
      title: event.title,
    });

    return event;
  }

  async deleteEvent(actorId: string, id: string) {
    const existing = await this.prisma.event.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Event not found');
    }

    const event = await this.prisma.event.update({
      where: { id },
      data: { isPublished: false },
      include: {
        faculty: true,
        creator: eventCreatorSelect,
      },
    });

    await this.auditService.log(actorId, 'event.deleted', 'Event', event.id, { isPublished: true }, {
      isPublished: false,
    });

    return event;
  }

  async registerForEvent(userId: string, eventId: string) {
    await this.getEventById(eventId);
    const existing = await this.prisma.eventRegistration.findFirst({
      where: { userId, eventId },
    });
    if (existing) {
      throw new ConflictException('You are already registered for this event');
    }

    return this.prisma.eventRegistration.create({
      data: {
        userId,
        eventId,
      },
      include: {
        event: true,
      },
    });
  }

  async listRegistrations(eventId: string) {
    await this.getEventById(eventId);
    return this.prisma.eventRegistration.findMany({
      where: { eventId },
      include: {
        user: registrationUserSelect,
      },
      orderBy: { registeredAt: 'asc' },
    });
  }
}
