import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useI18n } from '../../i18n';
import { Group, Faculty } from '../../types';

export default function AdminGroupsPage() {
  const { t } = useI18n();
  const [groups, setGroups] = useState<Group[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.get<Group[]>('/api/groups');
      setGroups(data);
      const uniq = new Map<string, Faculty>();
      for (const g of data) {
        if (g.faculty && !uniq.has(g.faculty.id)) uniq.set(g.faculty.id, g.faculty);
      }
      setFaculties(Array.from(uniq.values()));
    } catch { setError(t('common.error')); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const resetForm = () => {
    setName(''); setCode(''); setFacultyId('');
    setEditingId(null); setShowForm(false);
  };

  const startEdit = (group: Group) => {
    setName(group.name); setCode(group.code);
    setFacultyId(group.facultyId);
    setEditingId(group.id); setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSuccess(null); setIsSubmitting(true);
    try {
      if (editingId) {
        await apiClient.put(`/api/groups/${editingId}`, { name: name.trim(), code: code.trim() });
      } else {
        await apiClient.post('/api/groups', { name: name.trim(), code: code.trim(), facultyId });
      }
      setSuccess(t('admin.groups.createSuccess'));
      resetForm(); await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally { setIsSubmitting(false); }
  };

  const deleteGroup = async (id: string) => {
    if (!confirm(t('admin.groups.deleteConfirm'))) return;
    try { await apiClient.delete(`/api/groups/${id}`); await load(); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : t('common.error')); }
  };

  const regenerateCode = async (id: string) => {
    try { await apiClient.put(`/api/groups/${id}/regenerate-code`); await load(); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : t('common.error')); }
  };

  if (isLoading) return <section><h1>{t('admin.groups.title')}</h1><p>{t('common.loading')}</p></section>;

  const inputStyle = { width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' as const };

  return (
    <section>
      <h1>{t('admin.groups.title')}</h1>
      {success && <p style={{ color: '#0f766e', marginTop: 8 }}>{success}</p>}
      {error && <p style={{ color: '#dc2626', marginTop: 8 }}>{error}</p>}
      <button onClick={() => { resetForm(); setShowForm(!showForm); }} style={{ marginTop: 12, padding: '10px 20px', background: '#0f766e', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
        {showForm ? t('common.cancel') : t('admin.groups.create')}
      </button>
      {showForm && (
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, marginTop: 16, padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('admin.groups.name')} required style={inputStyle} />
          <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder={t('admin.groups.code')} required style={inputStyle} />
          {!editingId && (
            <select value={facultyId} onChange={(e) => setFacultyId(e.target.value)} required style={inputStyle}>
              <option value="">{t('admin.groups.faculty')}</option>
              {faculties.map((f) => (<option key={f.id} value={f.id}>{f.name}</option>))}
            </select>
          )}
          <button type="submit" disabled={isSubmitting} style={{ padding: '10px 20px', background: '#0f766e', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
            {isSubmitting ? t('common.loading') : editingId ? t('common.save') : t('admin.groups.create')}
          </button>
        </form>
      )}
      <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
        {groups.map((group) => (
          <article key={group.id} style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12, opacity: group.isActive ? 1 : 0.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <strong>{group.name}</strong> <span style={{ color: '#6b7280', fontSize: 13 }}>({group.code})</span>
                {group.faculty && <p style={{ margin: '4px 0', color: '#6b7280', fontSize: 14 }}>{group.faculty.name}</p>}
                <small style={{ color: '#9ca3af' }}>{t('admin.groups.joinCode')}: {group.joinCode}</small>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button onClick={() => void regenerateCode(group.id)} style={{ padding: '6px 10px', background: '#dbeafe', color: '#1d4ed8', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>{t('admin.groups.regenerateCode')}</button>
                <button onClick={() => startEdit(group)} style={{ padding: '6px 10px', background: '#e5e7eb', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>{t('admin.groups.edit')}</button>
                <button onClick={() => void deleteGroup(group.id)} style={{ padding: '6px 10px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>{t('admin.groups.delete')}</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
