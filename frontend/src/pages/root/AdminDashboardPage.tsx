import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { AdminStats } from '../../types';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    void apiClient.get<AdminStats>('/api/admin/stats').then(setStats);
  }, []);

  return (
    <section>
      <h1>Admin Dashboard</h1>
      <ul style={{ marginTop: 16 }}>
        <li>Total users: {stats?.users ?? 0}</li>
        <li>Students pending: {stats?.studentsPending ?? 0}</li>
        <li>Active orders: {stats?.activeOrders ?? 0}</li>
        <li>Coins awarded: {stats?.coinsAwarded ?? 0}</li>
      </ul>
    </section>
  );
}
