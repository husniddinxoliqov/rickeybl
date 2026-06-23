import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useI18n } from '../../i18n';
import { ShopOrder, StudentProfile } from '../../types';

export default function StaffDashboardPage() {
  const { t } = useI18n();
  const [pendingProfiles, setPendingProfiles] = useState<StudentProfile[]>([]);
  const [pendingOrders, setPendingOrders] = useState<ShopOrder[]>([]);

  useEffect(() => {
    const load = async () => {
      const [profiles, orders] = await Promise.all([
        apiClient.get<StudentProfile[]>('/api/students/pending'),
        apiClient.get<ShopOrder[]>('/api/shop/orders/pending'),
      ]);
      setPendingProfiles(profiles);
      setPendingOrders(orders);
    };
    void load();
  }, []);

  return (
    <section>
      <h1>{t('staff.dashboard.title')}</h1>
      <p>{t('staff.dashboard.pendingApprovals', { count: pendingProfiles.length })}</p>
      <p>{t('staff.dashboard.pendingOrders', { count: pendingOrders.length })}</p>
    </section>
  );
}
