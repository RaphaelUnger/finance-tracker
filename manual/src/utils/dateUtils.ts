import { format, parseISO, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { de, enUS } from 'date-fns/locale';

/**
 * Date formatting utilities for the Finance Tracker app
 */

export const DATE_FORMATS = {
  DISPLAY: 'dd.MM.yyyy',
  DISPLAY_WITH_TIME: 'dd.MM.yyyy HH:mm',
  ISO: 'yyyy-MM-dd',
  ISO_WITH_TIME: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
  MONTH_YEAR: 'MM/yyyy',
  READABLE: 'dd. MMMM yyyy',
  SHORT: 'dd.MM.yy',
  TIME_ONLY: 'HH:mm',
} as const;

export const getLocale = (language: 'en' | 'de') => {
  return language === 'de' ? de : enUS;
};

/**
 * Format a date for display to the user
 */
export const formatDate = (
  date: Date | string,
  formatStr: string = DATE_FORMATS.DISPLAY,
  language: 'en' | 'de' = 'de'
): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr, { locale: getLocale(language) });
  } catch (error) {
    console.warn('Date formatting error:', error);
    return '';
  }
};

/**
 * Format a date for database storage (ISO format)
 */
export const formatDateForDB = (date: Date): string => {
  return format(date, DATE_FORMATS.ISO_WITH_TIME);
};

/**
 * Parse a date from database (ISO format)
 */
export const parseDateFromDB = (dateString: string): Date => {
  return parseISO(dateString);
};

/**
 * Get the start of the current month
 */
export const getCurrentMonthStart = (): Date => {
  return startOfMonth(new Date());
};

/**
 * Get the end of the current month
 */
export const getCurrentMonthEnd = (): Date => {
  return endOfMonth(new Date());
};

/**
 * Get month boundaries for a specific month
 */
export const getMonthBoundaries = (date: Date) => {
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
};

/**
 * Get previous month's date
 */
export const getPreviousMonth = (date: Date = new Date()): Date => {
  return subMonths(date, 1);
};

/**
 * Get next month's date
 */
export const getNextMonth = (date: Date = new Date()): Date => {
  return addMonths(date, 1);
};

/**
 * Check if two dates are in the same month
 */
export const isSameMonth = (date1: Date, date2: Date): boolean => {
  return (
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
};

/**
 * Get a user-friendly relative date string
 */
export const getRelativeDateString = (
  date: Date,
  language: 'en' | 'de' = 'de'
): string => {
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (language === 'de') {
    if (diffInDays === 0) return 'Heute';
    if (diffInDays === 1) return 'Gestern';
    if (diffInDays === -1) return 'Morgen';
    if (diffInDays > 1 && diffInDays < 7) return `Vor ${diffInDays} Tagen`;
    if (diffInDays < -1 && diffInDays > -7) return `In ${Math.abs(diffInDays)} Tagen`;
  } else {
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays === -1) return 'Tomorrow';
    if (diffInDays > 1 && diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < -1 && diffInDays > -7) return `In ${Math.abs(diffInDays)} days`;
  }

  return formatDate(date, DATE_FORMATS.DISPLAY, language);
};

/**
 * Generate month labels for charts
 */
export const generateMonthLabels = (
  months: number = 12,
  language: 'en' | 'de' = 'de'
): string[] => {
  const labels: string[] = [];
  let currentDate = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const monthDate = subMonths(currentDate, i);
    labels.push(format(monthDate, 'MMM yyyy', { locale: getLocale(language) }));
  }

  return labels;
};

/**
 * Check if date is today
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/**
 * Get age of date in days
 */
export const getDateAgeInDays = (date: Date): number => {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Validate date string
 */
export const isValidDateString = (dateString: string): boolean => {
  try {
    const date = parseISO(dateString);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
};
