import { AppLocale } from './localization';

export type LocalizedText = Partial<Record<AppLocale, string>>;

const SUPPORTED_LOCALES: AppLocale[] = ['uz', 'ru', 'en'];

export function localizedText(uz: string, ru: string, en: string): LocalizedText {
  return { uz, ru, en };
}

export function normalizeLocalizedText(input?: Record<string, unknown> | null): LocalizedText | undefined {
  if (!input || typeof input !== 'object') {
    return undefined;
  }

  const normalized = SUPPORTED_LOCALES.reduce<LocalizedText>((acc, locale) => {
    const value = input[locale];
    if (typeof value !== 'string') {
      return acc;
    }

    const trimmed = value.trim();
    if (trimmed) {
      acc[locale] = trimmed;
    }

    return acc;
  }, {});

  return Object.keys(normalized).length ? normalized : undefined;
}

export function getLocalizedText(input: unknown, locale: AppLocale, fallback: string): string {
  const normalized = normalizeLocalizedText(
    input && typeof input === 'object' ? (input as Record<string, unknown>) : undefined,
  );

  return normalized?.[locale] ?? normalized?.en ?? normalized?.uz ?? fallback;
}
