import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useI18n } from '../../i18n';
import { ShopItem } from '../../types';

export default function ShopPage() {
  const { t } = useI18n();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [messageKey, setMessageKey] = useState<string>('');

  const loadItems = async () => {
    const data = await apiClient.get<ShopItem[]>('/api/shop/items');
    setItems(data);
  };

  useEffect(() => {
    void loadItems();
  }, []);

  const reserveItem = async (itemId: string) => {
    await apiClient.post('/api/shop/orders', { itemId, quantity: 1 });
    setMessageKey('student.shop.reserveSuccess');
  };

  return (
    <section>
      <h1>{t('student.shop.title')}</h1>
      {messageKey ? <p style={{ color: '#0f766e' }}>{t(messageKey)}</p> : null}
      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        {items.length ? (
          items.map((item) => (
            <article key={item.id} style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
              <strong>{item.name}</strong>
              <p>{item.description}</p>
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
