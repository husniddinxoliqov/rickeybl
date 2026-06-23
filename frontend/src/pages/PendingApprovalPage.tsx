import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useI18n } from '../i18n';

interface PendingApprovalPageProps {
  hasProfile: boolean;
}

export default function PendingApprovalPage({ hasProfile }: PendingApprovalPageProps) {
  const { t } = useI18n();

  return (
    <main style={{ padding: '96px 24px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
        <LanguageSwitcher />
      </div>
      <h1 style={{ marginBottom: 16 }}>{t('pending.title')}</h1>
      <p style={{ color: '#374151' }}>
        {hasProfile ? t('pending.withProfile') : t('pending.withoutProfile')}
      </p>
      <p style={{ color: '#6b7280', marginTop: 12 }}>
        {t('pending.help')}
      </p>
    </main>
  );
}
