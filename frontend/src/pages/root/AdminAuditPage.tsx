import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { AuditLog } from '../../types';

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    void apiClient.get<AuditLog[]>('/api/admin/audit-logs').then(setLogs);
  }, []);

  return (
    <section>
      <h1>Audit Logs</h1>
      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        {logs.map((log) => (
          <article key={log.id} style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
            <strong>{log.action}</strong>
            <p>{log.entity}</p>
            <small>{new Date(log.createdAt).toLocaleString()}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
