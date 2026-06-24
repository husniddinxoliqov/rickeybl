import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useI18n } from '../../i18n';
import { ShopOrder } from '../../types';

export default function OrdersPage() {
  const { t, localize } = useI18n();
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<ShopOrder[]>('/api/shop/orders/pending');
      setOrders(data);
    } catch {
      setError(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const approve = async (id: string) => {
    try {
      await apiClient.post(`/api/shop/orders/${id}/approve`);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('common.error'));
    }
  };

  if (isLoading) {
    return (
      <section>
        <h1>{t('staff.orders.title')}</h1>
        <p>{t('common.loading')}</p>
      </section>
    );
  }

  return (
    <section>
      <h1>{t('staff.orders.title')}</h1>
      {error ? <p style={{ color: '#dc2626', marginTop: 8 }}>{error}</p> : null}
      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        {orders.length ? (
          orders.map((order) => (
            <article key={order.id} style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
              <strong>{localize(order.item.nameI18n, order.item.name)}</strong>
              <p style={{ margin: '4px 0', fontSize: 14, color: '#6b7280' }}>
                {order.user?.studentProfile?.fullName ?? order.user?.username}
              </p>
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
