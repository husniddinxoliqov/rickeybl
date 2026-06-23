import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useI18n } from '../../i18n';
import { ShopOrder } from '../../types';

export default function OrdersPage() {
  const { t } = useI18n();
  const [orders, setOrders] = useState<ShopOrder[]>([]);

  const load = async () => {
    const data = await apiClient.get<ShopOrder[]>('/api/shop/orders/pending');
    setOrders(data);
  };

  useEffect(() => {
    void load();
  }, []);

  const approve = async (id: string) => {
    await apiClient.post(`/api/shop/orders/${id}/approve`);
    await load();
  };

  return (
    <section>
      <h1>{t('staff.orders.title')}</h1>
      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        {orders.length ? (
          orders.map((order) => (
            <article key={order.id} style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
              <strong>{order.item.name}</strong>
              <p>{order.user?.studentProfile?.fullName ?? order.user?.username}</p>
              <button onClick={() => void approve(order.id)}>{t('staff.orders.approve')}</button>
            </article>
          ))
        ) : (
          <p>{t('staff.orders.empty')}</p>
        )}
      </div>
    </section>
  );
}
