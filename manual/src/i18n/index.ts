import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';
import { de } from './locales/de';
import { en } from './locales/en';

const resources = {
  de: { translation: de },
  en: { translation: en }
};

const initI18n = async () => {
  // Get device locale
  const locales = RNLocalize.getLocales();
  const deviceLocale = locales[0]?.languageCode || 'en';

  // Supported locales
  const supportedLocales = ['de', 'en'];
  const fallbackLocale = supportedLocales.includes(deviceLocale) ? deviceLocale : 'en';

  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: fallbackLocale,
      fallbackLng: 'en',

      interpolation: {
        escapeValue: false, // React already escapes values
      },

      // Currency and number formatting
      returnObjects: true,

      // React Native specific settings
      compatibilityJSON: 'v3',

      // Debug settings
      debug: __DEV__,
    });

  return i18n;
};

// Format currency based on locale
export const formatCurrency = (amount: number, currency: string = 'EUR'): string => {
  const locale = i18n.language === 'de' ? 'de-DE' : 'en-US';
  const currencyCode = i18n.language === 'de' ? 'EUR' : (currency === 'EUR' ? 'USD' : currency);

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Format date based on locale
export const formatDate = (date: Date, format: 'short' | 'medium' | 'long' = 'medium'): string => {
  const locale = i18n.language === 'de' ? 'de-DE' : 'en-US';

  switch (format) {
    case 'short':
      return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(date);

    case 'medium':
      return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).format(date);

    case 'long':
      return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }).format(date);

    default:
      return new Intl.DateTimeFormat(locale).format(date);
  }
};

// Format relative time (e.g., "2 days ago")
export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  const rtf = new Intl.RelativeTimeFormat(i18n.language, { numeric: 'auto' });

  if (diffInDays > 0) {
    return rtf.format(-diffInDays, 'day');
  } else if (diffInHours > 0) {
    return rtf.format(-diffInHours, 'hour');
  } else if (diffInMinutes > 0) {
    return rtf.format(-diffInMinutes, 'minute');
  } else {
    return i18n.t('common.now');
  }
};

// Format numbers based on locale
export const formatNumber = (number: number): string => {
  const locale = i18n.language === 'de' ? 'de-DE' : 'en-US';
  return new Intl.NumberFormat(locale).format(number);
};

// Pluralization helper
export const pluralize = (count: number, key: string): string => {
  return i18n.t(key, { count });
};

// Change language
export const changeLanguage = async (language: string): Promise<void> => {
  await i18n.changeLanguage(language);
};

// Get current language
export const getCurrentLanguage = (): string => {
  return i18n.language;
};

// Get available languages
export const getAvailableLanguages = (): { code: string; name: string; nativeName: string }[] => {
  return [
    { code: 'de', name: 'German', nativeName: 'Deutsch' },
    { code: 'en', name: 'English', nativeName: 'English' }
  ];
};

// Translation helper with type safety
export const t = (key: string, options?: any): string => {
  return i18n.t(key, options);
};

export default initI18n;
