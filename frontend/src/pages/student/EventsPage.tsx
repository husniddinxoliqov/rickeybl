import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { EventEntity } from '../../types';

export default function EventsPage() {
  const [events, setEvents] = useState<EventEntity[]>([]);
  const [message, setMessage] = useState<string>('');

  const loadEvents = async () => {
    const items = await apiClient.get<EventEntity[]>('/api/events');
    setEvents(items);
  };

  useEffect(() => {
    void loadEvents();
  }, []);

  const register = async (eventId: string) => {
    await apiClient.post(`/api/events/${eventId}/register`);
    setMessage('Registration successful.');
  };

  return (
    <section>
      <h1>Events</h1>
      {message ? <p style={{ color: '#0f766e' }}>{message}</p> : null}
      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        {events.map((event) => (
          <article key={event.id} style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
            <strong>{event.title}</strong>
            <p>{event.description}</p>
            <small>{new Date(event.startAt).toLocaleString()}</small>
            <div style={{ marginTop: 12 }}>
              <button onClick={() => void register(event.id)}>Register</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
