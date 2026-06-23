import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useI18n } from '../../i18n';
import { StudentProfile } from '../../types';

export default function ApprovalsPage() {
  const { t } = useI18n();
  const [students, setStudents] = useState<StudentProfile[]>([]);

  const load = async () => {
    const data = await apiClient.get<StudentProfile[]>('/api/students/pending');
    setStudents(data);
  };

  useEffect(() => {
    void load();
  }, []);

  const approve = async (id: string) => {
    await apiClient.post(`/api/students/${id}/approve`);
    await load();
  };

  const reject = async (id: string) => {
    await apiClient.post(`/api/students/${id}/reject`);
    await load();
  };

  return (
    <section>
      <h1>{t('staff.approvals.title')}</h1>
      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        {students.length ? (
          students.map((student) => (
            <article key={student.id} style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
              <strong>{student.fullName}</strong>
              <p>{student.studentId}</p>
              <div style={{ display: 'flex', gap: 8 }}>
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
