import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useI18n } from '../../i18n';
import { PaginatedTransactions } from '../../types';

export default function HistoryPage() {
  const { t } = useI18n();
  const [history, setHistory] = useState<PaginatedTransactions | null>(null);

  useEffect(() => {
    void apiClient.get<PaginatedTransactions>('/api/coins/history').then(setHistory);
  }, []);

  return (
    <section>
      <h1>{t('student.history.title')}</h1>
      {history?.items.length ? (
        <ul style={{ marginTop: 16 }}>
          {history.items.map((item) => (
            <li key={item.id} style={{ marginBottom: 12 }}>
              <strong>{item.amount}</strong> — {item.reason}
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ marginTop: 16 }}>{t('student.history.empty')}</p>
      )}
    </section>
  );
}
