import { FormEvent, useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useI18n } from '../../i18n';
import { Announcement } from '../../types';

interface ManageAnnouncementsPageProps {
  titleKey: string;
}

export default function ManageAnnouncementsPage({ titleKey }: ManageAnnouncementsPageProps) {
  const { t } = useI18n();
  const [items, setItems] = useState<Announcement[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const data = await apiClient.get<Announcement[]>('/api/announcements');
    setItems(data);
  };

  useEffect(() => {
    void load();
  }, []);

  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      await apiClient.post('/api/announcements', { title, body, isPublished: true });
      setTitle('');
      setBody('');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('common.error'));
    }
  };

  const togglePublish = async (item: Announcement) => {
    try {
      await apiClient.put(`/api/announcements/${item.id}`, { isPublished: !item.isPublished });
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('common.error'));
    }
  };

  return (
    <section>
      <h1>{t(titleKey)}</h1>
      <form onSubmit={create} style={{ display: 'grid', gap: 8, marginTop: 16 }}>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={t('admin.announcements.formTitle')}
          required
          style={{ padding: 10, border: '1px solid #e5e7eb', borderRadius: 8 }}
        />
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={t('admin.announcements.formBody')}
          required
          style={{ padding: 10, border: '1px solid #e5e7eb', borderRadius: 8, minHeight: 100 }}
        />
        <button type="submit">{t('admin.announcements.create')}</button>
      </form>
      {error ? <p style={{ color: '#dc2626' }}>{error}</p> : null}
      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        {items.map((item) => (
          <article key={item.id} style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
            <strong>{item.title}</strong>
            <p style={{ marginTop: 8 }}>{item.body}</p>
            <button onClick={() => void togglePublish(item)} style={{ marginTop: 8 }}>
              {item.isPublished ? t('admin.announcements.unpublish') : t('admin.announcements.publish')}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
