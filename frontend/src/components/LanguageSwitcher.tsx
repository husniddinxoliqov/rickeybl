import { SUPPORTED_LANGUAGES } from '../i18n/config';
import { useI18n } from '../i18n';

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span style={{ color: '#6b7280', fontSize: 14 }}>{t('language.label')}</span>
      <div
        style={{
          display: 'inline-flex',
          border: '1px solid #d1d5db',
          borderRadius: 9999,
          overflow: 'hidden',
          background: '#ffffff',
        }}
      >
        {SUPPORTED_LANGUAGES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setLanguage(item)}
            aria-pressed={language === item}
            style={{
              border: 'none',
              padding: '6px 10px',
              background: language === item ? '#0f766e' : '#ffffff',
              color: language === item ? '#ffffff' : '#111827',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {item.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
