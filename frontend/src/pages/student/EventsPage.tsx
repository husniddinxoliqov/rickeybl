import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useI18n } from '../../i18n';
import { EventEntity } from '../../types';

export default function EventsPage() {
  const { t, formatDate, localize } = useI18n();
  const [events, setEvents] = useState<EventEntity[]>([]);
  const [messageKey, setMessageKey] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await apiClient.get<EventEntity[]>('/api/events');
      setEvents(items);
    } catch {
      setError(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadEvents();
  }, []);

  const register = async (eventId: string) => {
    try {
      await apiClient.post(`/api/events/${eventId}/register`);
      setMessageKey('student.events.registerSuccess');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('common.error');
      setMessageKey('');
      setError(msg);
    }
  };

  if (isLoading) {
    return (
      <section>
        <h1>{t('student.events.title')}</h1>
        <p>{t('common.loading')}</p>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h1>{t('student.events.title')}</h1>
        <p style={{ color: '#dc2626' }}>{error}</p>
        <button onClick={() => void loadEvents()}>{t('common.retry')}</button>
      </section>
    );
  }

  return (
    <section>
      <h1>{t('student.events.title')}</h1>
      {messageKey ? <p style={{ color: '#0f766e' }}>{t(messageKey)}</p> : null}
      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        {events.length ? (
          events.map((event) => (
            <article key={event.id} style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
              <strong>{localize(event.titleI18n, event.title)}</strong>
              <p>{localize(event.descriptionI18n, event.description)}</p>
              <small>{formatDate(event.startAt)}</small>
              <div style={{ marginTop: 12 }}>
                <button onClick={() => void register(event.id)}>{t('student.events.register')}</button>
              </div>
            </article>
          ))
        ) : (
          <p>{t('student.events.empty')}</p>
        )}
      </div>
    </section>
  );
}
