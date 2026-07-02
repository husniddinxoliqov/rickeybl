import { FormEvent, useState } from 'react';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useI18n } from '../i18n';

interface LoginPageProps {
  isLoading: boolean;
  error?: string | null;
  onCredentialLogin: (email: string, password: string) => Promise<void>;
  onTelegramLogin: () => Promise<void>;
}

export default function LoginPage({
  isLoading,
  error,
  onCredentialLogin,
  onTelegramLogin,
}: LoginPageProps) {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitCredentials = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await onCredentialLogin(email, password);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main style={{ padding: '96px 24px 24px', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
        <LanguageSwitcher />
      </div>
      <h1 style={{ marginBottom: 12 }}>{t('auth.title')}</h1>
      <p style={{ color: '#4b5563' }}>
        {isLoading ? t('auth.loading') : t('auth.requiredWithCredential')}
      </p>
      <form
        onSubmit={submitCredentials}
        style={{ marginTop: 20, display: 'grid', gap: 8, maxWidth: 360, marginInline: 'auto' }}
      >
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t('auth.email')}
          required
          autoComplete="username"
          style={{ padding: 10, border: '1px solid #e5e7eb', borderRadius: 8 }}
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={t('auth.password')}
          required
          autoComplete="current-password"
          style={{ padding: 10, border: '1px solid #e5e7eb', borderRadius: 8 }}
        />
        <button type="submit" disabled={isSubmitting || isLoading} style={{ padding: 10 }}>
          {t('auth.login')}
        </button>
      </form>
      <button
        type="button"
        onClick={() => void onTelegramLogin()}
        disabled={isSubmitting || isLoading}
        style={{ marginTop: 8, padding: 10 }}
      >
        {t('auth.telegramLogin')}
      </button>
      {error ? (
        <p style={{ marginTop: 16, color: '#b91c1c' }}>{error}</p>
      ) : null}
    </main>
  );
}
