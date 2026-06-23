import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useI18n } from '../i18n';

interface LoginPageProps {
  isLoading: boolean;
  error?: string | null;
}

export default function LoginPage({ isLoading, error }: LoginPageProps) {
  const { t } = useI18n();

  return (
    <main style={{ padding: '96px 24px 24px', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
        <LanguageSwitcher />
      </div>
      <h1 style={{ marginBottom: 12 }}>{t('auth.title')}</h1>
      <p style={{ color: '#4b5563' }}>
        {isLoading ? t('auth.loading') : t('auth.required')}
      </p>
      {error ? (
        <p style={{ marginTop: 16, color: '#b91c1c' }}>{error}</p>
      ) : null}
    </main>
  );
}
