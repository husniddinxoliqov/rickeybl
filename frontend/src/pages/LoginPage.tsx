interface LoginPageProps {
  isLoading: boolean;
  error?: string | null;
}

export default function LoginPage({ isLoading, error }: LoginPageProps) {
  return (
    <main style={{ padding: '96px 24px 24px', textAlign: 'center' }}>
      <h1 style={{ marginBottom: 12 }}>SamDU Mini-App</h1>
      <p style={{ color: '#4b5563' }}>
        {isLoading ? 'Authenticating with Telegram…' : 'Authentication required'}
      </p>
      {error ? (
        <p style={{ marginTop: 16, color: '#b91c1c' }}>{error}</p>
      ) : null}
    </main>
  );
}
