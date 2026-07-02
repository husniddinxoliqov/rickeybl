import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useI18n } from '../../i18n';
import { User } from '../../types';

export default function AdminUsersPage() {
  const { t } = useI18n();
  const [users, setUsers] = useState<User[]>([]);
  const [facultyIdByUser, setFacultyIdByUser] = useState<Record<string, string>>({});
  const [groupIdByUser, setGroupIdByUser] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [emailByUser, setEmailByUser] = useState<Record<string, string>>({});
  const [passwordByUser, setPasswordByUser] = useState<Record<string, string>>({});

  const load = async () => {
    const data = await apiClient.get<User[]>('/api/admin/users');
    setUsers(data);
  };

  useEffect(() => {
    void load();
  }, []);

  const createAssignment = async (userId: string) => {
    setError(null);
    try {
      await apiClient.post(`/api/admin/staff/${userId}/assignments`, {
        facultyId: facultyIdByUser[userId],
        groupId: groupIdByUser[userId] || undefined,
      });
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('common.error'));
    }
  };

  const deleteAssignment = async (assignmentId: string) => {
    setError(null);
    try {
      await apiClient.delete(`/api/admin/staff/assignments/${assignmentId}`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('common.error'));
    }
  };

  const setCredentials = async (userId: string) => {
    setError(null);
    try {
      await apiClient.post(`/api/admin/staff/${userId}/credentials`, {
        email: emailByUser[userId],
        password: passwordByUser[userId],
      });
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('common.error'));
    }
  };

  return (
    <section>
      <h1>{t('admin.users.title')}</h1>
      {error ? <p style={{ color: '#dc2626' }}>{error}</p> : null}
      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        {users.length ? (
          users.map((user) => (
            <article key={user.id} style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
              <strong>{user.username}</strong>
              <p>{t(`role.${user.role}`)}</p>
              <p>{user.studentProfile?.fullName ?? t('admin.users.noProfile')}</p>
              {user.role === 'STAFF' ? (
                <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
                  <p>{t('admin.users.assignments')}</p>
                  {user.staffAssignments?.map((assignment) => (
                    <div key={assignment.id} style={{ fontSize: 13 }}>
                      {assignment.faculty?.name ?? assignment.facultyId}
                      {assignment.groupId ? ` / ${assignment.group?.name ?? assignment.groupId}` : ''}
                      <button onClick={() => void deleteAssignment(assignment.id)} style={{ marginLeft: 8 }}>
                        {t('admin.users.removeAssignment')}
                      </button>
                    </div>
                  ))}
                  <input
                    placeholder={t('admin.users.facultyId')}
                    value={facultyIdByUser[user.id] ?? ''}
                    onChange={(event) =>
                      setFacultyIdByUser((prev) => ({ ...prev, [user.id]: event.target.value }))
                    }
                    style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 8 }}
                  />
                  <input
                    placeholder={t('admin.users.groupId')}
                    value={groupIdByUser[user.id] ?? ''}
                    onChange={(event) =>
                      setGroupIdByUser((prev) => ({ ...prev, [user.id]: event.target.value }))
                    }
                    style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 8 }}
                  />
                  <button onClick={() => void createAssignment(user.id)}>
                    {t('admin.users.addAssignment')}
                  </button>
                  <input
                    placeholder={t('admin.users.staffEmail')}
                    value={emailByUser[user.id] ?? ''}
                    onChange={(event) =>
                      setEmailByUser((prev) => ({ ...prev, [user.id]: event.target.value }))
                    }
                    style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 8 }}
                  />
                  <input
                    placeholder={t('admin.users.staffPassword')}
                    value={passwordByUser[user.id] ?? ''}
                    type="password"
                    onChange={(event) =>
                      setPasswordByUser((prev) => ({ ...prev, [user.id]: event.target.value }))
                    }
                    style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 8 }}
                  />
                  <button onClick={() => void setCredentials(user.id)}>
                    {t('admin.users.setCredentials')}
                  </button>
                </div>
              ) : null}
            </article>
          ))
        ) : (
          <p>{t('admin.users.empty')}</p>
        )}
      </div>
    </section>
  );
}
