import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useI18n } from '../../i18n';
import { Announcement } from '../../types';

export default function AnnouncementsPage() {
  const { t, localize } = useI18n();
  const [items, setItems] = useState<Announcement[]>([]);

  useEffect(() => {
    void apiClient.get<Announcement[]>('/api/announcements').then(setItems);
  }, []);

  return (
    <section>
      <h1>{t('student.announcements.title')}</h1>
      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        {items.length ? (
          items.map((item) => (
            <article key={item.id} style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
              <strong>{localize(item.titleI18n, item.title)}</strong>
              <p style={{ marginTop: 8 }}>{localize(item.bodyI18n, item.body)}</p>
            </article>
          ))
        ) : (
          <p>{t('student.announcements.empty')}</p>
        )}
      </div>
    </section>
  );
}
