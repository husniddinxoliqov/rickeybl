import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CoinTransactionType, ShopOrderStatus, StudentStatus, UserRole } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { publicUserBaseSelect } from '../common/selects/public-user.select';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffAssignmentDto } from './dto/create-staff-assignment.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getStats() {
    const [users, studentsPending, activeOrders, awardedCoins] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.studentProfile.count({ where: { status: StudentStatus.PENDING } }),
      this.prisma.shopOrder.count({
        where: { status: { in: [ShopOrderStatus.PENDING, ShopOrderStatus.APPROVED] } },
      }),
      this.prisma.coinTransaction.aggregate({
        where: { type: CoinTransactionType.EARN },
        _sum: { amount: true },
      }),
    ]);

    return {
      users,
      studentsPending,
      activeOrders,
      coinsAwarded: awardedCoins._sum.amount ?? 0,
    };
  }

  listUsers() {
    return this.prisma.user.findMany({
      select: {
        ...publicUserBaseSelect,
        studentProfile: {
          include: {
            faculty: true,
            group: true,
          },
        },
        staffAssignments: {
          include: { faculty: true, group: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  listAuditLogs() {
    return this.prisma.auditLog.findMany({
      include: {
        actor: {
          select: publicUserBaseSelect,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async listStaffAssignments(staffUserId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: staffUserId } });
    if (!user || user.role !== UserRole.STAFF) {
      throw new NotFoundException('Staff user not found');
    }

    return this.prisma.staffAssignment.findMany({
      where: { userId: staffUserId },
      include: { faculty: true, group: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createStaffAssignment(
    actorId: string,
    staffUserId: string,
    dto: CreateStaffAssignmentDto,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: staffUserId } });
    if (!user || user.role !== UserRole.STAFF) {
      throw new NotFoundException('Staff user not found');
    }

    const faculty = await this.prisma.faculty.findUnique({ where: { id: dto.facultyId } });
    if (!faculty) {
      throw new NotFoundException('Faculty not found');
    }

    if (dto.groupId) {
      const group = await this.prisma.group.findUnique({ where: { id: dto.groupId } });
      if (!group || group.facultyId !== dto.facultyId) {
        throw new NotFoundException('Group not found or does not belong to the given faculty');
      }
    }

    const existing = await this.prisma.staffAssignment.findFirst({
      where: {
        userId: staffUserId,
        facultyId: dto.facultyId,
        groupId: dto.groupId ?? null,
      },
    });
    if (existing) {
      throw new ConflictException('Staff assignment already exists');
    }

    const assignment = await this.prisma.staffAssignment.create({
      data: {
        userId: staffUserId,
        facultyId: dto.facultyId,
        groupId: dto.groupId ?? null,
      },
      include: { faculty: true, group: true },
    });

    await this.auditService.log(actorId, 'admin.staff_assignment_created', 'StaffAssignment', assignment.id, null, {
      staffUserId,
      facultyId: dto.facultyId,
      groupId: dto.groupId ?? null,
    });

    return assignment;
  }

  async deleteStaffAssignment(actorId: string, assignmentId: string) {
    const assignment = await this.prisma.staffAssignment.findUnique({
      where: { id: assignmentId },
    });
    if (!assignment) {
      throw new NotFoundException('Staff assignment not found');
    }

    await this.prisma.staffAssignment.delete({ where: { id: assignmentId } });

    await this.auditService.log(actorId, 'admin.staff_assignment_deleted', 'StaffAssignment', assignmentId, {
      facultyId: assignment.facultyId,
      groupId: assignment.groupId,
    }, null);
  }
}
