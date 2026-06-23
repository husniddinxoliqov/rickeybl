import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useI18n } from '../../i18n';
import { UserBadge } from '../../types';

export default function BadgesPage() {
  const { t, formatDate } = useI18n();
  const [badges, setBadges] = useState<UserBadge[]>([]);

  useEffect(() => {
    void apiClient.get<UserBadge[]>('/api/badges/mine').then(setBadges);
  }, []);

  return (
    <section>
      <h1>{t('student.badges.title')}</h1>
      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        {badges.length ? (
          badges.map((badge) => (
            <article key={badge.id} style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
              <strong>{badge.badge.name}</strong>
              <p>{badge.badge.description}</p>
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
