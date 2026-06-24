import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useI18n } from '../../i18n';
import { StudentProfile } from '../../types';

export default function ApprovalsPage() {
  const { t } = useI18n();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<StudentProfile[]>('/api/students/pending');
      setStudents(data);
    } catch {
      setError(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const approve = async (id: string) => {
    try {
      await apiClient.post(`/api/students/${id}/approve`);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('common.error'));
    }
  };

  const reject = async (id: string) => {
    try {
      await apiClient.post(`/api/students/${id}/reject`);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('common.error'));
    }
  };

  if (isLoading) {
    return (
      <section>
        <h1>{t('staff.approvals.title')}</h1>
        <p>{t('common.loading')}</p>
      </section>
    );
  }

  return (
    <section>
      <h1>{t('staff.approvals.title')}</h1>
      {error ? <p style={{ color: '#dc2626', marginTop: 8 }}>{error}</p> : null}
      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        {students.length ? (
          students.map((student) => (
            <article key={student.id} style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
              <strong>{student.fullName}</strong>
              <p style={{ margin: '4px 0', fontSize: 14, color: '#6b7280' }}>
                {student.studentId}
                {student.faculty ? ` · ${student.faculty.name}` : ''}
                {student.group ? ` / ${student.group.name}` : ''}
              </p>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={() => void approve(student.id)}>{t('staff.approvals.approve')}</button>
                <button onClick={() => void reject(student.id)}>{t('staff.approvals.reject')}</button>
              </div>
            </article>
          ))
        ) : (
          <p>{t('staff.approvals.empty')}</p>
        )}
      </div>
    </section>
  );
}
