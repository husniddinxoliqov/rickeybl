import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useI18n } from '../../i18n';
import { EventEntity, Group, Faculty } from '../../types';

export default function StaffEventsPage() {
  const { t, localize, formatDate } = useI18n();
  const [events, setEvents] = useState<EventEntity[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [coinsReward, setCoinsReward] = useState(0);
  const [isPublished, setIsPublished] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [eventsData, groupsData] = await Promise.all([
        apiClient.get<EventEntity[]>('/api/events'),
        apiClient.get<Group[]>('/api/groups'),
      ]);
      setEvents(eventsData);
      const uniqueFaculties = new Map<string, Faculty>();
      for (const g of groupsData) {
        if (g.faculty && !uniqueFaculties.has(g.faculty.id)) {
          uniqueFaculties.set(g.faculty.id, g.faculty);
        }
      }
      setFaculties(Array.from(uniqueFaculties.values()));
    } catch {
      setError(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const createEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);
    try {
      await apiClient.post('/api/events', {
        title: title.trim(),
        description: description.trim(),
        startAt,
        endAt: endAt || undefined,
        facultyId: facultyId || undefined,
        coinsReward,
        isPublished,
      });
      setSuccess(t('staff.events.createSuccess'));
      setTitle('');
      setDescription('');
      setStartAt('');
      setEndAt('');
      setFacultyId('');
      setCoinsReward(0);
      setIsPublished(true);
      setShowForm(false);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <section>
        <h1>{t('staff.events.title')}</h1>
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
      <h1>{t('staff.events.title')}</h1>

      {success && <p style={{ color: '#0f766e', marginTop: 8 }}>{success}</p>}
      {error && <p style={{ color: '#dc2626', marginTop: 8 }}>{error}</p>}

      <button
        onClick={() => setShowForm(!showForm)}
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
        {showForm ? t('common.cancel') : t('staff.events.create')}
      </button>

      {showForm && (
        <form onSubmit={createEvent} style={{ display: 'grid', gap: 12, marginTop: 16, padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('staff.events.eventTitle')}
            required
            style={inputStyle}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('staff.events.description')}
            required
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
          />
          <div>
            <label style={{ fontSize: 13, color: '#6b7280' }}>{t('staff.events.startAt')}</label>
            <input
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, color: '#6b7280' }}>{t('staff.events.endAt')}</label>
            <input
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              style={inputStyle}
            />
          </div>
          <select
            value={facultyId}
            onChange={(e) => setFacultyId(e.target.value)}
            style={inputStyle}
          >
            <option value="">{t('staff.events.faculty')}</option>
            {faculties.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
          <div>
            <label style={{ fontSize: 13, color: '#6b7280' }}>{t('staff.events.coinsReward')}</label>
            <input
              type="number"
              value={coinsReward}
              onChange={(e) => setCoinsReward(Number(e.target.value))}
              min={0}
              style={inputStyle}
            />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
            />
            {t('staff.events.publish')}
          </label>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '10px 20px',
              background: '#0f766e',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting ? t('common.loading') : t('staff.events.create')}
          </button>
        </form>
      )}

      {/* Events List */}
      <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
        {events.length ? (
          events.map((event) => (
            <article key={event.id} style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
              <strong>{localize(event.titleI18n, event.title)}</strong>
              <p style={{ margin: '4px 0', color: '#6b7280', fontSize: 14 }}>
                {localize(event.descriptionI18n, event.description)}
              </p>
              <small>{formatDate(event.startAt)}</small>
              {event.coinsReward > 0 && (
                <span style={{ marginLeft: 8, color: '#0f766e' }}>+{event.coinsReward} coins</span>
              )}
            </article>
          ))
        ) : (
          <p>{t('student.events.empty')}</p>
        )}
      </div>
    </section>
  );
}
