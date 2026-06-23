import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  detectAppLanguage,
  LANGUAGE_LOCALES,
  persistLanguage,
  translateAppMessage,
} from './config';
import type { AppLanguage } from './messages';
import { getStoredLanguage } from './config';

interface I18nContextValue {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
  formatDate: (value: string | number | Date) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(
    () => getStoredLanguage() ?? detectAppLanguage(),
  );

  useEffect(() => {
    persistLanguage(language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage);
  }, []);

  const t = useCallback(
    (key: string, values?: Record<string, string | number>) =>
      translateAppMessage(language, key, values),
    [language],
  );

  const formatDate = useCallback(
    (value: string | number | Date) =>
      new Intl.DateTimeFormat(LANGUAGE_LOCALES[language], {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value)),
    [language],
  );

  const contextValue = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      formatDate,
    }),
    [formatDate, language, setLanguage, t],
  );

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }

  return context;
}
