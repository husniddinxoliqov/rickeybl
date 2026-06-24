import { UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

export interface ResolvedStaffScope {
  /** Faculty IDs where the staff has unrestricted (all-groups) access */
  facultyWideIds: string[];
  /** Group IDs where the staff has group-level access */
  groupSpecificIds: string[];
}

/**
 * Resolves the staff scope for the given actor.
 *
 * Returns `null` when the actor has unrestricted access (ROOT or STAFF with no
 * assignments — MVP fallback that preserves existing behaviour).
 */
export function resolveStaffScope(actor: AuthenticatedUser): ResolvedStaffScope | null {
  if (actor.role === UserRole.ROOT) {
    return null;
  }

  const assignments = actor.staffAssignments ?? [];
  if (assignments.length === 0) {
    return null;
  }

  const facultyWideIds = assignments
    .filter((a) => !a.groupId)
    .map((a) => a.facultyId);

  const groupSpecificIds = assignments
    .filter((a) => Boolean(a.groupId))
    .map((a) => a.groupId as string);

  return { facultyWideIds, groupSpecificIds };
}

/**
 * Returns `true` when a student identified by `facultyId`/`groupId` falls
 * within the given `scope`.  Always returns `true` when `scope` is `null`.
 */
export function isStudentInScope(
  scope: ResolvedStaffScope | null,
  facultyId: string,
  groupId: string,
): boolean {
  if (!scope) {
    return true;
  }

  return scope.facultyWideIds.includes(facultyId) || scope.groupSpecificIds.includes(groupId);
}
