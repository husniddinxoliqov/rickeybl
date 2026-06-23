import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useI18n } from '../../i18n';
import { EventEntity } from '../../types';

export default function EventsPage() {
  const { t, formatDate } = useI18n();
  const [events, setEvents] = useState<EventEntity[]>([]);
  const [messageKey, setMessageKey] = useState<string>('');

  const loadEvents = async () => {
    const items = await apiClient.get<EventEntity[]>('/api/events');
    setEvents(items);
  };

  useEffect(() => {
    void loadEvents();
  }, []);

  const register = async (eventId: string) => {
    await apiClient.post(`/api/events/${eventId}/register`);
    setMessageKey('student.events.registerSuccess');
  };

  return (
    <section>
      <h1>{t('student.events.title')}</h1>
      {messageKey ? <p style={{ color: '#0f766e' }}>{t(messageKey)}</p> : null}
      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        {events.length ? (
          events.map((event) => (
            <article key={event.id} style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
              <strong>{event.title}</strong>
              <p>{event.description}</p>
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
