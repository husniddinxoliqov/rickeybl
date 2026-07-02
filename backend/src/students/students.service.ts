import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, Prisma, StudentStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { localizedText } from '../common/i18n/localized-content';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { publicUserBaseSelect } from '../common/selects/public-user.select';
import { isStudentInScope, resolveStaffScope } from '../common/utils/staff-scope.util';
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
      shouldAutoApprove
        ? {
            titleI18n: localizedText('Profil tasdiqlandi', 'Профиль подтверждён', 'Profile approved'),
            bodyI18n: localizedText(
              'SamDU profilingiz avtomatik tasdiqlandi.',
              'Ваш профиль SamDU был подтверждён автоматически.',
              'Your SamDU profile has been approved automatically.',
            ),
          }
        : {
            titleI18n: localizedText(
              "Profil ko'rib chiqilmoqda",
              'Профиль ожидает проверки',
              'Profile pending review',
            ),
            bodyI18n: localizedText(
              'SamDU profilingiz xodimlar ko‘rib chiqishi uchun yuborildi.',
              'Ваш профиль SamDU отправлен на проверку сотрудникам.',
              'Your SamDU profile has been submitted for staff review.',
            ),
          },
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

  async approvePending(actor: AuthenticatedUser, id: string) {
    const profile = await this.getStudentById(id);
    if (profile.status !== StudentStatus.PENDING) {
      throw new ConflictException('Only pending profiles can be approved');
    }

    const scope = resolveStaffScope(actor);
    if (scope && !isStudentInScope(scope, profile.facultyId, profile.groupId)) {
      throw new ForbiddenException('Student is not in your assigned scope');
    }

    const updated = await this.prisma.studentProfile.update({
      where: { id },
      data: {
        status: StudentStatus.ACTIVE,
        approvedBy: actor.id,
        approvedAt: new Date(),
      },
      include: profileInclude,
    });

    await this.auditService.log(
      actor.id,
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
      {
        titleI18n: localizedText('Profil tasdiqlandi', 'Профиль подтверждён', 'Profile approved'),
        bodyI18n: localizedText(
          'Talaba profilingiz SamDU xodimlari tomonidan tasdiqlandi.',
          'Ваш студенческий профиль подтверждён сотрудниками SamDU.',
          'Your student profile has been approved by SamDU staff.',
        ),
      },
    );

    return updated;
  }

  async rejectPending(actor: AuthenticatedUser, id: string) {
    const profile = await this.getStudentById(id);
    if (profile.status !== StudentStatus.PENDING) {
      throw new ConflictException('Only pending profiles can be rejected');
    }

    const scope = resolveStaffScope(actor);
    if (scope && !isStudentInScope(scope, profile.facultyId, profile.groupId)) {
      throw new ForbiddenException('Student is not in your assigned scope');
    }

    const updated = await this.prisma.studentProfile.update({
      where: { id },
      data: {
        status: StudentStatus.REJECTED,
        approvedBy: actor.id,
        approvedAt: new Date(),
      },
      include: profileInclude,
    });

    await this.auditService.log(
      actor.id,
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
      {
        titleI18n: localizedText('Profil rad etildi', 'Профиль отклонён', 'Profile rejected'),
        bodyI18n: localizedText(
          'Talaba profilingiz tasdiqlanishidan oldin qo‘lda tuzatishni talab qiladi.',
          'Ваш студенческий профиль требует ручной корректировки перед подтверждением.',
          'Your student profile needs manual correction before approval.',
        ),
      },
    );

    return updated;
  }

  async listPending(actor: AuthenticatedUser) {
    const scope = resolveStaffScope(actor);

    const where: Prisma.StudentProfileWhereInput = { status: StudentStatus.PENDING };

    if (scope) {
      const conditions: Prisma.StudentProfileWhereInput[] = [];
      if (scope.facultyWideIds.length) {
        conditions.push({ facultyId: { in: scope.facultyWideIds } });
      }
      if (scope.groupSpecificIds.length) {
        conditions.push({ groupId: { in: scope.groupSpecificIds } });
      }
      if (conditions.length) {
        where.OR = conditions;
      } else {
        // Staff has assignments record but no resolved scope entries — deny all
        return [];
      }
    }

    return this.prisma.studentProfile.findMany({
      where,
      include: profileInclude,
      orderBy: { joinedAt: 'asc' },
    });
  }
}
