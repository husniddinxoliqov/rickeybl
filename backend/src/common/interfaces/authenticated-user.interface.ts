import { StaffAssignment, StudentProfile, UserRole } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  username: string;
  role: UserRole;
  telegramId?: string | null;
  studentProfile?: StudentProfile | null;
  staffAssignments?: Pick<StaffAssignment, 'facultyId' | 'groupId'>[];
}
