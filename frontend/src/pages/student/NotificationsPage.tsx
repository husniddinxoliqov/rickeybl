import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useI18n } from '../../i18n';
import { Notification } from '../../types';

export default function NotificationsPage() {
  const { t, localize } = useI18n();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<Notification[]>('/api/notifications');
      setNotifications(data);
    } catch {
      setError(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const markRead = async (id: string) => {
    try {
      await apiClient.post(`/api/notifications/${id}/read`);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('common.error'));
    }
  };

  if (isLoading) {
    return (
      <section>
        <h1>{t('student.notifications.title')}</h1>
        <p>{t('common.loading')}</p>
      </section>
    );
  }

  if (error && !notifications.length) {
    return (
      <section>
        <h1>{t('student.notifications.title')}</h1>
        <p style={{ color: '#dc2626' }}>{error}</p>
        <button onClick={() => void load()}>{t('common.retry')}</button>
      </section>
    );
  }

  return (
    <section>
      <h1>{t('student.notifications.title')}</h1>
      {error ? <p style={{ color: '#dc2626', marginTop: 8 }}>{error}</p> : null}
      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        {notifications.length ? (
          notifications.map((notification) => (
            <article key={notification.id} style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
              <strong>{localize(notification.titleI18n, notification.title)}</strong>
              <p>{localize(notification.bodyI18n, notification.body)}</p>
              {!notification.isRead ? (
                <button onClick={() => void markRead(notification.id)}>
                  {t('student.notifications.markRead')}
                </button>
              ) : null}
            </article>
          ))
        ) : (
          <p>{t('student.notifications.empty')}</p>
        )}
      </div>
    </section>
  );
}
