import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useI18n } from '../../i18n';
import { AdminStats } from '../../types';

export default function AdminDashboardPage() {
  const { t } = useI18n();
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    void apiClient.get<AdminStats>('/api/admin/stats').then(setStats);
  }, []);

  return (
    <section>
      <h1>{t('admin.dashboard.title')}</h1>
      <ul style={{ marginTop: 16 }}>
        <li>{t('admin.dashboard.totalUsers', { count: stats?.users ?? 0 })}</li>
        <li>{t('admin.dashboard.studentsPending', { count: stats?.studentsPending ?? 0 })}</li>
        <li>{t('admin.dashboard.activeOrders', { count: stats?.activeOrders ?? 0 })}</li>
        <li>{t('admin.dashboard.coinsAwarded', { count: stats?.coinsAwarded ?? 0 })}</li>
      </ul>
    </section>
  );
}
