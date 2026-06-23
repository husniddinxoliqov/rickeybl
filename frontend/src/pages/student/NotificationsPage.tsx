import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { Notification } from '../../types';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const load = async () => {
    const data = await apiClient.get<Notification[]>('/api/notifications');
    setNotifications(data);
  };

  useEffect(() => {
    void load();
  }, []);

  const markRead = async (id: string) => {
    await apiClient.post(`/api/notifications/${id}/read`);
    await load();
  };

  return (
    <section>
      <h1>Notifications</h1>
      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        {notifications.map((notification) => (
          <article key={notification.id} style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
            <strong>{notification.title}</strong>
            <p>{notification.body}</p>
            {!notification.isRead ? (
              <button onClick={() => void markRead(notification.id)}>Mark read</button>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
