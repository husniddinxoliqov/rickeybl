import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useI18n } from '../../i18n';
import { ShopItem } from '../../types';

export default function ShopPage() {
  const { t, localize } = useI18n();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [messageKey, setMessageKey] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadItems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<ShopItem[]>('/api/shop/items');
      setItems(data);
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
    </section>
  );
}
