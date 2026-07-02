import { useEffect, useState } from 'react';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { apiClient } from '../api/client';
import { useI18n } from '../i18n';
import { Group, Faculty } from '../types';

interface PendingApprovalPageProps {
  hasProfile: boolean;
  refreshProfile?: () => Promise<void>;
}

export default function PendingApprovalPage({ hasProfile, refreshProfile }: PendingApprovalPageProps) {
  const { t } = useI18n();

  if (hasProfile) {
    return (
      <main style={{ padding: '96px 24px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
          <LanguageSwitcher />
        </div>
        <h1 style={{ marginBottom: 16 }}>{t('pending.title')}</h1>
        <p style={{ color: '#374151' }}>{t('pending.withProfile')}</p>
        <p style={{ color: '#6b7280', marginTop: 12 }}>{t('pending.help')}</p>
      </main>
    );
  }

  return (
    <main style={{ padding: '96px 24px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
        <LanguageSwitcher />
      </div>
      <h1 style={{ marginBottom: 16 }}>{t('profile.form.title')}</h1>
      <p style={{ color: '#374151', marginBottom: 24 }}>{t('pending.withoutProfile')}</p>
      <ProfileForm refreshProfile={refreshProfile} />
    </main>
  );
}

function ProfileForm({ refreshProfile }: { refreshProfile?: () => Promise<void> }) {
  const { t } = useI18n();
  const [groups, setGroups] = useState<Group[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [studentId, setStudentId] = useState('');
  const [fullName, setFullName] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const data = await apiClient.get<Group[]>('/api/groups');
        setGroups(data);
        const uniqueFaculties = new Map<string, Faculty>();
        for (const group of data) {
          if (group.faculty && !uniqueFaculties.has(group.faculty.id)) {
            uniqueFaculties.set(group.faculty.id, group.faculty);
          }
        }
        setFaculties(Array.from(uniqueFaculties.values()));
      } catch {
        setError(t('common.error'));
      }
    };
    void loadGroups();
  }, [t]);

  const filteredGroups = groups.filter((g) => g.facultyId === facultyId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await apiClient.post('/api/students/profile', {
        studentId: studentId.trim(),
        fullName: fullName.trim(),
        facultyId,
        groupId,
        joinCode: joinCode.trim(),
      });
      setSuccess(true);
      if (refreshProfile) {
        await refreshProfile();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return <p style={{ color: '#0f766e', fontWeight: 600 }}>{t('profile.form.success')}</p>;
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 14,
    boxSizing: 'border-box' as const,
  };

  const labelStyle = {
    display: 'block',
    marginBottom: 4,
    fontWeight: 500,
    fontSize: 14,
    color: '#374151',
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
      {error && <p style={{ color: '#dc2626', margin: 0 }}>{error}</p>}

      <div>
        <label style={labelStyle}>{t('profile.form.studentId')}</label>
        <input
          type="text"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          required
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>{t('profile.form.fullName')}</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>{t('profile.form.faculty')}</label>
        <select
          value={facultyId}
          onChange={(e) => {
            setFacultyId(e.target.value);
            setGroupId('');
          }}
          required
          style={inputStyle}
        >
          <option value="">{t('profile.form.selectFaculty')}</option>
          {faculties.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label style={labelStyle}>{t('profile.form.group')}</label>
        <select
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          required
          disabled={!facultyId}
          style={inputStyle}
        >
          <option value="">{t('profile.form.selectGroup')}</option>
          {filteredGroups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label style={labelStyle}>{t('profile.form.joinCode')}</label>
        <input
          type="text"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
          required
          style={inputStyle}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          padding: '12px 24px',
          background: '#0f766e',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontWeight: 600,
          fontSize: 14,
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
          opacity: isSubmitting ? 0.7 : 1,
        }}
      >
        {isSubmitting ? t('common.loading') : t('profile.form.submit')}
      </button>
    </form>
  );
}
