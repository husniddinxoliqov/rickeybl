import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useI18n } from '../../i18n';
import { UserBadge } from '../../types';

export default function BadgesPage() {
  const { t, formatDate, localize } = useI18n();
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<UserBadge[]>('/api/badges/mine');
      setBadges(data);
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
        <h1>{t('student.badges.title')}</h1>
        <p>{t('common.loading')}</p>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h1>{t('student.badges.title')}</h1>
        <p style={{ color: '#dc2626' }}>{error}</p>
        <button onClick={() => void load()}>{t('common.retry')}</button>
      </section>
    );
  }

  return (
    <section>
      <h1>{t('student.badges.title')}</h1>
      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        {badges.length ? (
          badges.map((badge) => (
            <article key={badge.id} style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
              <strong>{localize(badge.badge.nameI18n, badge.badge.name)}</strong>
              <p>{localize(badge.badge.descriptionI18n, badge.badge.description)}</p>
              <small>{formatDate(badge.awardedAt)}</small>
            </article>
          ))
        ) : (
          <p>{t('student.badges.empty')}</p>
        )}
      </div>
    </section>
  );
}
