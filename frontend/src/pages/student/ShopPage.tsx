import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { ShopItem } from '../../types';

export default function ShopPage() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [message, setMessage] = useState<string>('');

  const loadItems = async () => {
    const data = await apiClient.get<ShopItem[]>('/api/shop/items');
    setItems(data);
  };

  useEffect(() => {
    void loadItems();
  }, []);

  const reserveItem = async (itemId: string) => {
    await apiClient.post('/api/shop/orders', { itemId, quantity: 1 });
    setMessage('Order created and coins reserved.');
  };

  return (
    <section>
      <h1>Reward Shop</h1>
      {message ? <p style={{ color: '#0f766e' }}>{message}</p> : null}
      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        {items.map((item) => (
          <article key={item.id} style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
            <strong>{item.name}</strong>
            <p>{item.description}</p>
            <p>{item.coinCost} coins</p>
            <button onClick={() => void reserveItem(item.id)}>Reserve</button>
          </article>
        ))}
      </div>
    </section>
  );
}
