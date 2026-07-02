import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useI18n } from '../../i18n';
import { Badge } from '../../types';

export default function StaffBadgesPage() {
  const { t, localize } = useI18n();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Award form
  const [userId, setUserId] = useState('');
  const [badgeId, setBadgeId] = useState('');
  const [note, setNote] = useState('');
  const [isAwarding, setIsAwarding] = useState(false);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<Badge[]>('/api/badges');
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

  const awardBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsAwarding(true);
    try {
      await apiClient.post('/api/badges/award', {
        userId: userId.trim(),
        badgeId,
        note: note.trim() || undefined,
      });
      setSuccess(t('staff.badges.awardSuccess'));
      setUserId('');
      setBadgeId('');
      setNote('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setIsAwarding(false);
    }
  };

  if (isLoading) {
    return (
      <section>
        <h1>{t('staff.badges.title')}</h1>
        <p>{t('common.loading')}</p>
      </section>
    );
  }

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 14,
    boxSizing: 'border-box' as const,
  };

  return (
    <section>
      <h1>{t('staff.badges.title')}</h1>

      {success && <p style={{ color: '#0f766e', marginTop: 8 }}>{success}</p>}
      {error && <p style={{ color: '#dc2626', marginTop: 8 }}>{error}</p>}

      {/* Award Badge Form */}
      <div style={{ marginTop: 20, padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
        <h2 style={{ marginBottom: 12, fontSize: 16 }}>{t('staff.badges.award')}</h2>
        <form onSubmit={awardBadge} style={{ display: 'grid', gap: 12 }}>
          <select
            value={badgeId}
            onChange={(e) => setBadgeId(e.target.value)}
            required
            style={inputStyle}
          >
            <option value="">{t('staff.badges.selectBadge')}</option>
            {badges.map((b) => (
              <option key={b.id} value={b.id}>{localize(b.nameI18n, b.name)}</option>
            ))}
          </select>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder={t('staff.badges.userId')}
            required
            style={inputStyle}
          />
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('staff.badges.note')}
            style={inputStyle}
          />
          <button
            type="submit"
            disabled={isAwarding}
            style={{
              padding: '10px 20px',
              background: '#0f766e',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              cursor: isAwarding ? 'not-allowed' : 'pointer',
            }}
          >
            {isAwarding ? t('common.loading') : t('staff.badges.award')}
          </button>
        </form>
      </div>

      {/* Badge List */}
      <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
        {badges.map((badge) => (
          <article key={badge.id} style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
            <strong>{localize(badge.nameI18n, badge.name)}</strong>
            <p style={{ margin: '4px 0', color: '#6b7280', fontSize: 14 }}>
              {localize(badge.descriptionI18n, badge.description)}
            </p>
            {badge.iconUrl && <small>Icon: {badge.iconUrl}</small>}
          </article>
        ))}
      </div>
    </section>
  );
}
