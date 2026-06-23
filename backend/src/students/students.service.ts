import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, Prisma, StudentStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { publicUserBaseSelect } from '../common/selects/public-user.select';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentProfileDto } from './dto/create-student-profile.dto';

const profileInclude = {
  user: {
    select: publicUserBaseSelect,
  },
  faculty: true,
  group: true,
  approver: {
    select: publicUserBaseSelect,
  },
} satisfies Prisma.StudentProfileInclude;

@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createProfile(userId: string, dto: CreateStudentProfileDto) {
    const existingUserProfile = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });
    if (existingUserProfile) {
      throw new ConflictException('Student profile already exists for this user');
    }

    const existingStudentId = await this.prisma.studentProfile.findUnique({
      where: { studentId: dto.studentId },
    });
    if (existingStudentId) {
      throw new ConflictException('Student ID is already registered');
    }

    const faculty = await this.prisma.faculty.findUnique({ where: { id: dto.facultyId } });
    if (!faculty) {
      throw new NotFoundException('Faculty not found');
    }

    const group = await this.prisma.group.findUnique({ where: { id: dto.groupId } });
    if (!group || group.facultyId !== faculty.id) {
      throw new BadRequestException('Invalid group for selected faculty');
    }

    const shouldAutoApprove = group.joinCode === dto.joinCode.trim();
    const profile = await this.prisma.studentProfile.create({
      data: {
        userId,
        studentId: dto.studentId.trim(),
        fullName: dto.fullName.trim(),
        facultyId: faculty.id,
        groupId: group.id,
        status: shouldAutoApprove ? StudentStatus.ACTIVE : StudentStatus.PENDING,
        approvedAt: shouldAutoApprove ? new Date() : null,
      },
      include: profileInclude,
    });

    await this.auditService.log(
      userId,
      shouldAutoApprove ? 'student.auto_approved' : 'student.profile_submitted',
      'StudentProfile',
      profile.id,
      null,
      {
        studentId: profile.studentId,
        status: profile.status,
        groupId: profile.groupId,
      },
    );

    await this.notificationsService.createNotification(
      userId,
      shouldAutoApprove ? 'Profile approved' : 'Profile pending review',
      shouldAutoApprove
        ? 'Your SamDU profile has been approved automatically.'
        : 'Your SamDU profile has been submitted for staff review.',
      shouldAutoApprove ? NotificationType.INFO : NotificationType.WARNING,
    );

    return profile;
  }

  async getMyProfile(userId: string) {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { userId },
      include: profileInclude,
    });

    if (!profile) {
      throw new NotFoundException('Student profile not found');
    }

    return profile;
  }

  async getStudentById(id: string) {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { id },
      include: profileInclude,
    });

    if (!profile) {
      throw new NotFoundException('Student profile not found');
    }

    return profile;
  }

  async approvePending(actorId: string, id: string) {
    const profile = await this.getStudentById(id);
    if (profile.status !== StudentStatus.PENDING) {
      throw new ConflictException('Only pending profiles can be approved');
    }

    const updated = await this.prisma.studentProfile.update({
      where: { id },
      data: {
        status: StudentStatus.ACTIVE,
        approvedBy: actorId,
        approvedAt: new Date(),
      },
      include: profileInclude,
    });

    await this.auditService.log(
      actorId,
      'student.approved',
      'StudentProfile',
      updated.id,
      { status: profile.status },
      { status: updated.status },
    );

    await this.notificationsService.createNotification(
      updated.userId,
      'Profile approved',
      'Your student profile has been approved by SamDU staff.',
      NotificationType.INFO,
    );

    return updated;
  }

  async rejectPending(actorId: string, id: string) {
    const profile = await this.getStudentById(id);
    if (profile.status !== StudentStatus.PENDING) {
      throw new ConflictException('Only pending profiles can be rejected');
    }

    const updated = await this.prisma.studentProfile.update({
      where: { id },
      data: {
        status: StudentStatus.REJECTED,
        approvedBy: actorId,
        approvedAt: new Date(),
      },
      include: profileInclude,
    });

    await this.auditService.log(
      actorId,
      'student.rejected',
      'StudentProfile',
      updated.id,
      { status: profile.status },
      { status: updated.status },
    );

    await this.notificationsService.createNotification(
      updated.userId,
      'Profile rejected',
      'Your student profile needs manual correction before approval.',
      NotificationType.WARNING,
    );

    return updated;
  }

  async listPending() {
    return this.prisma.studentProfile.findMany({
      where: { status: StudentStatus.PENDING },
      include: profileInclude,
      orderBy: { joinedAt: 'asc' },
    });
  }
}
