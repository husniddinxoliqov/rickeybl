import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { Notification, UserBadge } from '../../types';

export default function DashboardPage() {
  const [balance, setBalance] = useState<number>(0);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const load = async () => {
      const [balanceResponse, badgeResponse, notificationResponse] = await Promise.all([
        apiClient.get<{ balance: number }>('/api/coins/balance'),
        apiClient.get<UserBadge[]>('/api/badges/mine'),
        apiClient.get<Notification[]>('/api/notifications'),
      ]);
      setBalance(balanceResponse.balance);
      setBadges(badgeResponse.slice(0, 3));
      setNotifications(notificationResponse.slice(0, 3));
    };

    void load();
  }, []);

  return (
    <section>
      <h1>Student Dashboard</h1>
      <div style={{ padding: 16, borderRadius: 12, background: '#ecfeff', marginTop: 16 }}>
        <strong>{balance}</strong> coins available
      </div>
      <div style={{ marginTop: 24 }}>
        <h2>Recent badges</h2>
        <ul>
          {badges.map((badge) => (
            <li key={badge.id}>{badge.badge.name}</li>
          ))}
        </ul>
      </div>
      <div style={{ marginTop: 24 }}>
        <h2>Latest notifications</h2>
        <ul>
          {notifications.map((notification) => (
            <li key={notification.id}>{notification.title}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
