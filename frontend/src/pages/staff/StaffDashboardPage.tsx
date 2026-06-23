import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { ShopOrder, StudentProfile } from '../../types';

export default function StaffDashboardPage() {
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
      <h1>Staff Dashboard</h1>
      <p>Pending approvals: {pendingProfiles.length}</p>
      <p>Pending orders: {pendingOrders.length}</p>
    </section>
  );
}
