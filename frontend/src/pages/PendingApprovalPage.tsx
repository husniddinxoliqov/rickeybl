interface PendingApprovalPageProps {
  hasProfile: boolean;
}

export default function PendingApprovalPage({ hasProfile }: PendingApprovalPageProps) {
  return (
    <main style={{ padding: '96px 24px 24px' }}>
      <h1 style={{ marginBottom: 16 }}>Approval required</h1>
      <p style={{ color: '#374151' }}>
        {hasProfile
          ? 'Your student profile is waiting for SamDU staff approval.'
          : 'Your account is authenticated, but a student profile has not been created yet.'}
      </p>
      <p style={{ color: '#6b7280', marginTop: 12 }}>
        Contact staff or complete profile setup through the backend API before continuing.
      </p>
    </main>
  );
}
