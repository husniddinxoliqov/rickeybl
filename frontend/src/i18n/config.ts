import { AppLanguage, appMessages } from './messages';

export const APP_LANGUAGE_STORAGE_KEY = 'samdu_language';

export const LANGUAGE_LOCALES: Record<AppLanguage, string> = {
  uz: 'uz-UZ',
  ru: 'ru-RU',
  en: 'en-US',
};

export const SUPPORTED_LANGUAGES: AppLanguage[] = ['uz', 'ru', 'en'];

export function normalizeLanguage(raw?: string | null): AppLanguage | null {
  if (!raw) {
    return null;
  }

  const normalized = raw.trim().toLowerCase();
  if (normalized.startsWith('uz')) {
    return 'uz';
  }
  if (normalized.startsWith('ru')) {
    return 'ru';
  }
  if (normalized.startsWith('en')) {
    return 'en';
  }

  return null;
}

export function getStoredLanguage(): AppLanguage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return normalizeLanguage(window.localStorage.getItem(APP_LANGUAGE_STORAGE_KEY));
}

export function persistLanguage(language: AppLanguage) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, language);
}

function getTelegramLanguage(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code ?? null;
}

export function detectAppLanguage(): AppLanguage {
  if (typeof window === 'undefined') {
    return 'uz';
  }

  return (
    normalizeLanguage(getTelegramLanguage()) ??
    normalizeLanguage(window.navigator.languages?.[0]) ??
    normalizeLanguage(window.navigator.language) ??
    'uz'
  );
}

export function getRequestLanguage(): AppLanguage {
  return getStoredLanguage() ?? detectAppLanguage();
}

/**
 * Picks the best-fit locale string from a DB i18n map (e.g. `{ uz: '…', ru: '…', en: '…' }`).
 * Falls back to the `fallback` value when no translation is available.
 */
export function localizeField(
  i18nMap: Record<string, string> | null | undefined,
  language: AppLanguage,
  fallback: string,
): string {
  if (!i18nMap) {
    return fallback;
  }

  return i18nMap[language] ?? i18nMap['en'] ?? i18nMap['uz'] ?? fallback;
}

export function translateAppMessage(
  language: AppLanguage,
  key: string,
  values?: Record<string, string | number>,
) {
  const template = appMessages[language][key] ?? appMessages.uz[key] ?? key;
  if (!values) {
    return template;
  }

  return Object.entries(values).reduce(
    (message, [name, value]) => message.split(`{{${name}}}`).join(String(value)),
    template,
  );
}
