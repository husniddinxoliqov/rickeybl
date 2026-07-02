import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useI18n } from '../../i18n';
import { AuditLog } from '../../types';

export default function StaffAuditPage() {
  const { t } = useI18n();
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    void apiClient.get<AuditLog[]>('/api/audit/logs').then(setLogs);
  }, []);

  return (
    <section>
      <h1>{t('staff.audit.title')}</h1>
      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        {logs.length ? (
          logs.map((entry) => (
            <article key={entry.id} style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
              <strong>{entry.action}</strong>
              <p style={{ marginTop: 4 }}>{entry.entity}</p>
            </article>
          ))
        ) : (
          <p>{t('staff.audit.empty')}</p>
        )}
      </div>
    </section>
  );
}
