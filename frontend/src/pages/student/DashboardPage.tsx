import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useI18n } from '../../i18n';
import { Notification, UserBadge } from '../../types';

export default function DashboardPage() {
  const { t, localize } = useI18n();
  const [balance, setBalance] = useState<number>(0);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [balanceResponse, badgeResponse, notificationResponse] = await Promise.all([
        apiClient.get<{ balance: number }>('/api/coins/balance'),
        apiClient.get<UserBadge[]>('/api/badges/mine'),
        apiClient.get<Notification[]>('/api/notifications'),
      ]);
      setBalance(balanceResponse.balance);
      setBadges(badgeResponse.slice(0, 3));
      setNotifications(notificationResponse.slice(0, 3));
    } catch {
      setError(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  if (isLoading) {
    return (
      <section>
        <h1>{t('student.dashboard.title')}</h1>
        <p>{t('common.loading')}</p>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h1>{t('student.dashboard.title')}</h1>
        <p style={{ color: '#dc2626' }}>{error}</p>
        <button onClick={() => void load()}>{t('common.retry')}</button>
      </section>
    );
  }

  return (
    <section>
      <h1>{t('student.dashboard.title')}</h1>
      <div style={{ padding: 16, borderRadius: 12, background: '#ecfeff', marginTop: 16 }}>
        {t('student.dashboard.balance', { count: balance })}
      </div>
      <div style={{ marginTop: 24 }}>
        <h2>{t('student.dashboard.badges')}</h2>
        {badges.length ? (
          <ul>
            {badges.map((badge) => (
              <li key={badge.id}>{localize(badge.badge.nameI18n, badge.badge.name)}</li>
            ))}
          </ul>
        ) : (
          <p>{t('student.dashboard.emptyBadges')}</p>
        )}
      </div>
      <div style={{ marginTop: 24 }}>
        <h2>{t('student.dashboard.notifications')}</h2>
        {notifications.length ? (
          <ul>
            {notifications.map((notification) => (
              <li key={notification.id}>{localize(notification.titleI18n, notification.title)}</li>
            ))}
          </ul>
        ) : (
          <p>{t('student.dashboard.emptyNotifications')}</p>
        )}
      </div>
    </section>
  );
}
