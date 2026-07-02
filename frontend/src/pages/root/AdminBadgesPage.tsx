import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useI18n } from '../../i18n';
import { Badge } from '../../types';

export default function AdminBadgesPage() {
  const { t, localize } = useI18n();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [requiredCoins, setRequiredCoins] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Award form
  const [awardUserId, setAwardUserId] = useState('');
  const [awardBadgeId, setAwardBadgeId] = useState('');
  const [awardNote, setAwardNote] = useState('');

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

  const resetForm = () => {
    setName('');
    setDescription('');
    setIconUrl('');
    setRequiredCoins(0);
    setIsActive(true);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (badge: Badge) => {
    setName(badge.name);
    setDescription(badge.description);
    setIconUrl(badge.iconUrl || '');
    setRequiredCoins(badge.requiredCoins);
    setIsActive(badge.isActive);
    setEditingId(badge.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);
    try {
      if (editingId) {
        await apiClient.put(`/api/badges/${editingId}`, {
          name: name.trim(),
          description: description.trim(),
          iconUrl: iconUrl.trim() || undefined,
          requiredCoins,
          isActive,
        });
      } else {
        await apiClient.post('/api/badges', {
          name: name.trim(),
          description: description.trim(),
          iconUrl: iconUrl.trim() || undefined,
          requiredCoins,
          isActive,
        });
      }
      setSuccess(t('admin.badges.createSuccess'));
      resetForm();
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteBadge = async (id: string) => {
    if (!confirm(t('admin.badges.deleteConfirm'))) return;
    setError(null);
    try {
      await apiClient.delete(`/api/badges/${id}`);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('common.error'));
    }
  };

  const awardBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await apiClient.post('/api/badges/award', {
        userId: awardUserId.trim(),
        badgeId: awardBadgeId,
        note: awardNote.trim() || undefined,
      });
      setSuccess(t('staff.badges.awardSuccess'));
      setAwardUserId('');
      setAwardBadgeId('');
      setAwardNote('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('common.error'));
    }
  };

  if (isLoading) {
    return (
      <section>
        <h1>{t('admin.badges.title')}</h1>
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
      <h1>{t('admin.badges.title')}</h1>

      {success && <p style={{ color: '#0f766e', marginTop: 8 }}>{success}</p>}
      {error && <p style={{ color: '#dc2626', marginTop: 8 }}>{error}</p>}

      <button
        onClick={() => { resetForm(); setShowForm(!showForm); }}
        style={{
          marginTop: 12,
          padding: '10px 20px',
          background: '#0f766e',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {showForm ? t('common.cancel') : t('admin.badges.create')}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, marginTop: 16, padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('admin.badges.name')} required style={inputStyle} />
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('admin.badges.description')} required style={inputStyle} />
          <input type="text" value={iconUrl} onChange={(e) => setIconUrl(e.target.value)} placeholder={t('admin.badges.iconUrl')} style={inputStyle} />
          <div>
            <label style={{ fontSize: 13, color: '#6b7280' }}>{t('admin.badges.requiredCoins')}</label>
            <input type="number" value={requiredCoins} onChange={(e) => setRequiredCoins(Number(e.target.value))} min={0} style={inputStyle} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            {t('admin.badges.isActive')}
          </label>
          <button type="submit" disabled={isSubmitting} style={{ padding: '10px 20px', background: '#0f766e', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
            {isSubmitting ? t('common.loading') : editingId ? t('common.save') : t('admin.badges.create')}
          </button>
        </form>
      )}

      {/* Award Form */}
      <div style={{ marginTop: 20, padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
        <h3 style={{ marginBottom: 12 }}>{t('staff.badges.award')}</h3>
        <form onSubmit={awardBadge} style={{ display: 'grid', gap: 12 }}>
          <select value={awardBadgeId} onChange={(e) => setAwardBadgeId(e.target.value)} required style={inputStyle}>
            <option value="">{t('staff.badges.selectBadge')}</option>
            {badges.map((b) => (<option key={b.id} value={b.id}>{localize(b.nameI18n, b.name)}</option>))}
          </select>
          <input type="text" value={awardUserId} onChange={(e) => setAwardUserId(e.target.value)} placeholder={t('staff.badges.userId')} required style={inputStyle} />
          <input type="text" value={awardNote} onChange={(e) => setAwardNote(e.target.value)} placeholder={t('staff.badges.note')} style={inputStyle} />
          <button type="submit" style={{ padding: '10px 20px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
            {t('staff.badges.award')}
          </button>
        </form>
      </div>

      {/* Badge List */}
      <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
        {badges.map((badge) => (
          <article key={badge.id} style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12, opacity: badge.isActive ? 1 : 0.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <strong>{localize(badge.nameI18n, badge.name)}</strong>
                <p style={{ margin: '4px 0', color: '#6b7280', fontSize: 14 }}>{localize(badge.descriptionI18n, badge.description)}</p>
                <small style={{ color: '#9ca3af' }}>{t('admin.badges.requiredCoins')}: {badge.requiredCoins}</small>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => startEdit(badge)} style={{ padding: '6px 12px', background: '#e5e7eb', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                  {t('admin.badges.edit')}
                </button>
                <button onClick={() => void deleteBadge(badge.id)} style={{ padding: '6px 12px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                  {t('admin.badges.delete')}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
