import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async createGroup(actorId: string, dto: CreateGroupDto) {
    const faculty = await this.prisma.faculty.findUnique({ where: { id: dto.facultyId } });
    if (!faculty) {
      throw new NotFoundException('Faculty not found');
    }

    const group = await this.prisma.group.create({
      data: {
        facultyId: dto.facultyId,
        name: dto.name.trim(),
        code: dto.code.trim().toUpperCase(),
        joinCode: this.generateJoinCode(),
      },
      include: {
        faculty: true,
      },
    });

    await this.auditService.log(actorId, 'group.created', 'Group', group.id, null, {
      code: group.code,
      facultyId: group.facultyId,
    });

    return group;
  }

  listGroups() {
    return this.prisma.group.findMany({
      where: { isActive: true },
      include: { faculty: true },
      orderBy: [{ facultyId: 'asc' }, { name: 'asc' }],
    });
  }

  async getGroupById(id: string) {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: { faculty: true },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return group;
  }

  async regenerateJoinCode(actorId: string, id: string) {
    const existing = await this.getGroupById(id);
    const updated = await this.prisma.group.update({
      where: { id },
      data: {
        joinCode: this.generateJoinCode(),
      },
      include: { faculty: true },
    });

    await this.auditService.log(
      actorId,
      'group.join_code_regenerated',
      'Group',
      updated.id,
      { joinCode: existing.joinCode },
      { joinCode: updated.joinCode },
    );

    return updated;
  }

  async updateGroup(actorId: string, id: string, dto: UpdateGroupDto) {
    const existing = await this.prisma.group.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Group not found');
    }

    const group = await this.prisma.group.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.code !== undefined ? { code: dto.code.trim().toUpperCase() } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
      include: { faculty: true },
    });

    await this.auditService.log(actorId, 'group.updated', 'Group', group.id, {
      name: existing.name,
      code: existing.code,
    }, {
      name: group.name,
      code: group.code,
    });

    return group;
  }

  async deleteGroup(actorId: string, id: string) {
    const existing = await this.prisma.group.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Group not found');
    }

    const group = await this.prisma.group.update({
      where: { id },
      data: { isActive: false },
      include: { faculty: true },
    });

    await this.auditService.log(actorId, 'group.deleted', 'Group', group.id, { isActive: true }, {
      isActive: false,
    });

    return group;
  }

  private generateJoinCode() {
    return `SAMDU-${randomBytes(4).toString('hex').toUpperCase()}`;
  }
}
