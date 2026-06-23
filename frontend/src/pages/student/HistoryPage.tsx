import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { PaginatedTransactions } from '../../types';

export default function HistoryPage() {
  const [history, setHistory] = useState<PaginatedTransactions | null>(null);

  useEffect(() => {
    void apiClient.get<PaginatedTransactions>('/api/coins/history').then(setHistory);
  }, []);

  return (
    <section>
      <h1>Coin History</h1>
      <ul style={{ marginTop: 16 }}>
        {history?.items.map((item) => (
          <li key={item.id} style={{ marginBottom: 12 }}>
            <strong>{item.amount}</strong> — {item.reason}
          </li>
        ))}
      </ul>
    </section>
  );
}
