import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { User } from '../../types';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    void apiClient.get<User[]>('/api/admin/users').then(setUsers);
  }, []);

  return (
    <section>
      <h1>Users</h1>
      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        {users.map((user) => (
          <article key={user.id} style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
            <strong>{user.username}</strong>
            <p>{user.role}</p>
            <p>{user.studentProfile?.fullName ?? 'No student profile'}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
