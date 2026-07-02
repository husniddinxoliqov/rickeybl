import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useI18n } from '../../i18n';
import { EventEntity, Group, Faculty } from '../../types';

export default function AdminEventsPage() {
  const { t, localize, formatDate } = useI18n();
  const [events, setEvents] = useState<EventEntity[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStartAt('');
    setEndAt('');
    setFacultyId('');
    setCoinsReward(0);
    setIsPublished(true);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (event: EventEntity) => {
    setTitle(event.title);
    setDescription(event.description);
    setStartAt(event.startAt.slice(0, 16));
    setEndAt(event.endAt ? event.endAt.slice(0, 16) : '');
    setFacultyId(event.facultyId || '');
    setCoinsReward(event.coinsReward);
    setIsPublished(event.isPublished);
    setEditingId(event.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);
    try {
      const body = {
        title: title.trim(),
        description: description.trim(),
        startAt,
        endAt: endAt || undefined,
        facultyId: facultyId || undefined,
        coinsReward,
        isPublished,
      };
      if (editingId) {
        await apiClient.put(`/api/events/${editingId}`, body);
      } else {
        await apiClient.post('/api/events', body);
      }
      setSuccess(t('admin.events.createSuccess'));
      resetForm();
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteEvent = async (id: string) => {
    if (!confirm(t('admin.events.deleteConfirm'))) return;
    setError(null);
    try {
      await apiClient.delete(`/api/events/${id}`);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('common.error'));
    }
  };

  if (isLoading) {
    return (
      <section>
        <h1>{t('admin.events.title')}</h1>
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
      <h1>{t('admin.events.title')}</h1>

      {success && <p style={{ color: '#0f766e', marginTop: 8 }}>{success}</p>}
      {error && <p style={{ color: '#dc2626', marginTop: 8 }}>{error}</p>}

      <button
        onClick={() => { resetForm(); setShowForm(!showForm); }}
        style={{ marginTop: 12, padding: '10px 20px', background: '#0f766e', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
      >
        {showForm ? t('common.cancel') : t('admin.events.create')}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, marginTop: 16, padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('staff.events.eventTitle')} required style={inputStyle} />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('staff.events.description')} required style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} />
          <div>
            <label style={{ fontSize: 13, color: '#6b7280' }}>{t('staff.events.startAt')}</label>
            <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} required style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 13, color: '#6b7280' }}>{t('staff.events.endAt')}</label>
            <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} style={inputStyle} />
          </div>
          <select value={facultyId} onChange={(e) => setFacultyId(e.target.value)} style={inputStyle}>
            <option value="">{t('staff.events.faculty')}</option>
            {faculties.map((f) => (<option key={f.id} value={f.id}>{f.name}</option>))}
          </select>
          <div>
            <label style={{ fontSize: 13, color: '#6b7280' }}>{t('staff.events.coinsReward')}</label>
            <input type="number" value={coinsReward} onChange={(e) => setCoinsReward(Number(e.target.value))} min={0} style={inputStyle} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
            {t('staff.events.publish')}
          </label>
          <button type="submit" disabled={isSubmitting} style={{ padding: '10px 20px', background: '#0f766e', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
            {isSubmitting ? t('common.loading') : editingId ? t('common.save') : t('admin.events.create')}
          </button>
        </form>
      )}

      <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
        {events.length ? events.map((event) => (
          <article key={event.id} style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12, opacity: event.isPublished ? 1 : 0.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <strong>{localize(event.titleI18n, event.title)}</strong>
                <p style={{ margin: '4px 0', color: '#6b7280', fontSize: 14 }}>{localize(event.descriptionI18n, event.description)}</p>
                <small>{formatDate(event.startAt)}</small>
                {event.coinsReward > 0 && <span style={{ marginLeft: 8, color: '#0f766e' }}>+{event.coinsReward} coins</span>}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => startEdit(event)} style={{ padding: '6px 12px', background: '#e5e7eb', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>{t('admin.events.edit')}</button>
                <button onClick={() => void deleteEvent(event.id)} style={{ padding: '6px 12px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>{t('admin.events.delete')}</button>
              </div>
            </div>
          </article>
        )) : <p>{t('student.events.empty')}</p>}
      </div>
    </section>
  );
}
