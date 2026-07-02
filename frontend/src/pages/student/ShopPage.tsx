import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useI18n } from '../../i18n';
import { ShopItem, ShopOrder } from '../../types';

export default function ShopPage() {
  const { t, localize } = useI18n();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [messageKey, setMessageKey] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadItems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<ShopItem[]>('/api/shop/items');
      setItems(data);
      const myOrders = await apiClient.get<ShopOrder[]>('/api/shop/orders/me');
      setOrders(myOrders);
    } catch {
      setError(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, []);

  const reserveItem = async (itemId: string) => {
    setError(null);
    setMessageKey('');
    try {
      await apiClient.post('/api/shop/orders', { itemId, quantity: 1 });
      setMessageKey('student.shop.reserveSuccess');
      await loadItems();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('common.error'));
    }
  };

  const markReceived = async (orderId: string) => {
    setError(null);
    try {
      await apiClient.post(`/api/shop/orders/${orderId}/received`);
      await loadItems();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('common.error'));
    }
  };

  const cancelOrder = async (orderId: string) => {
    setError(null);
    try {
      await apiClient.post(`/api/shop/orders/${orderId}/cancel`);
      await loadItems();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('common.error'));
    }
  };

  if (isLoading) {
    return (
      <section>
        <h1>{t('student.shop.title')}</h1>
        <p>{t('common.loading')}</p>
      </section>
    );
  }

  if (error && !items.length) {
    return (
      <section>
        <h1>{t('student.shop.title')}</h1>
        <p style={{ color: '#dc2626' }}>{error}</p>
        <button onClick={() => void loadItems()}>{t('common.retry')}</button>
      </section>
    );
  }

  return (
    <section>
      <h1>{t('student.shop.title')}</h1>
      {messageKey ? <p style={{ color: '#0f766e' }}>{t(messageKey)}</p> : null}
      {error ? <p style={{ color: '#dc2626' }}>{error}</p> : null}
      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        {items.length ? (
          items.map((item) => (
            <article key={item.id} style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
              <strong>{localize(item.nameI18n, item.name)}</strong>
              <p>{localize(item.descriptionI18n, item.description)}</p>
              <p>{t('student.shop.price', { count: item.coinCost })}</p>
              <button onClick={() => void reserveItem(item.id)}>{t('student.shop.reserve')}</button>
            </article>
          ))
        ) : (
          <p>{t('student.shop.empty')}</p>
        )}
      </div>
      <h2 style={{ marginTop: 24 }}>{t('student.shop.orders')}</h2>
      <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
        {orders.length ? (
          orders.map((order) => (
            <article key={order.id} style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
              <strong>{localize(order.item.nameI18n, order.item.name)}</strong>
              <p style={{ marginTop: 6 }}>{order.status}</p>
              {order.status === 'APPROVED' ? (
                <button onClick={() => void markReceived(order.id)}>{t('student.shop.received')}</button>
              ) : null}
              {order.status === 'PENDING' || order.status === 'APPROVED' ? (
                <button onClick={() => void cancelOrder(order.id)} style={{ marginLeft: 8 }}>
                  {t('student.shop.cancel')}
                </button>
              ) : null}
            </article>
          ))
        ) : (
          <p>{t('student.shop.ordersEmpty')}</p>
        )}
      </div>
    </section>
  );
}
