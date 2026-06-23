import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useI18n } from '../../i18n';
import { AuditLog } from '../../types';

export default function AdminAuditPage() {
  const { t, formatDate } = useI18n();
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    void apiClient.get<AuditLog[]>('/api/admin/audit-logs').then(setLogs);
  }, []);

  return (
    <section>
      <h1>{t('admin.audit.title')}</h1>
      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        {logs.length ? (
          logs.map((log) => (
            <article key={log.id} style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
              <strong>{log.action}</strong>
              <p>{log.entity}</p>
              <small>{formatDate(log.createdAt)}</small>
            </article>
          ))
        ) : (
          <p>{t('admin.audit.empty')}</p>
        )}
      </div>
    </section>
  );
}
