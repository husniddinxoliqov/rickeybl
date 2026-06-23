import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useI18n } from '../../i18n';
import { User } from '../../types';

export default function AdminUsersPage() {
  const { t } = useI18n();
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    void apiClient.get<User[]>('/api/admin/users').then(setUsers);
  }, []);

  return (
    <section>
      <h1>{t('admin.users.title')}</h1>
      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        {users.length ? (
          users.map((user) => (
            <article key={user.id} style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
              <strong>{user.username}</strong>
              <p>{t(`role.${user.role}`)}</p>
              <p>{user.studentProfile?.fullName ?? t('admin.users.noProfile')}</p>
            </article>
          ))
        ) : (
          <p>{t('admin.users.empty')}</p>
        )}
      </div>
    </section>
  );
}
