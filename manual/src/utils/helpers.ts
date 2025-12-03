import { Platform } from 'react-native';

/**
 * Generate a unique ID for database records
 */
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substr(2, 9);
  return `${timestamp}${randomPart}`;
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date for display
 */
export function formatDate(timestamp: number, options: Intl.DateTimeFormatOptions = {}): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...options,
  };

  return new Intl.DateTimeFormat('de-DE', defaultOptions).format(new Date(timestamp * 1000));
}

/**
 * Format date and time for display
 */
export function formatDateTime(timestamp: number): string {
  return formatDate(timestamp, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get start of day timestamp
 */
export function getStartOfDay(date: Date = new Date()): number {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return Math.floor(start.getTime() / 1000);
}

/**
 * Get end of day timestamp
 */
export function getEndOfDay(date: Date = new Date()): number {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return Math.floor(end.getTime() / 1000);
}

/**
 * Get start of month timestamp
 */
export function getStartOfMonth(date: Date = new Date()): number {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  return Math.floor(start.getTime() / 1000);
}

/**
 * Get end of month timestamp
 */
export function getEndOfMonth(date: Date = new Date()): number {
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return Math.floor(end.getTime() / 1000);
}

/**
 * Convert timestamp to Date object
 */
export function timestampToDate(timestamp: number): Date {
  return new Date(timestamp * 1000);
}

/**
 * Convert Date object to timestamp
 */
export function dateToTimestamp(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

/**
 * Validate transaction amount
 */
export function validateAmount(amount: string): { isValid: boolean; value?: number; error?: string } {
  if (!amount || amount.trim() === '') {
    return { isValid: false, error: 'Betrag ist erforderlich' };
  }

  // Replace comma with dot for decimal parsing
  const normalizedAmount = amount.replace(',', '.');
  const numericAmount = parseFloat(normalizedAmount);

  if (isNaN(numericAmount)) {
    return { isValid: false, error: 'Ungültiger Betrag' };
  }

  if (numericAmount <= 0) {
    return { isValid: false, error: 'Betrag muss größer als 0 sein' };
  }

  if (numericAmount > 999999.99) {
    return { isValid: false, error: 'Betrag ist zu hoch' };
  }

  // Round to 2 decimal places
  const roundedAmount = Math.round(numericAmount * 100) / 100;

  return { isValid: true, value: roundedAmount };
}

/**
 * Validate transaction description
 */
export function validateDescription(description: string): { isValid: boolean; error?: string } {
  if (!description || description.trim() === '') {
    return { isValid: false, error: 'Beschreibung ist erforderlich' };
  }

  if (description.trim().length > 100) {
    return { isValid: false, error: 'Beschreibung ist zu lang (max. 100 Zeichen)' };
  }

  return { isValid: true };
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
}

/**
 * Check if device has biometric authentication available
 */
export function isBiometricAvailable(): boolean {
  // This would need to be implemented with actual biometric libraries
  // For now, assume it's available on both platforms
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

/**
 * Get month name in German
 */
export function getMonthName(month: number): string {
  const months = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];
  return months[month];
}

/**
 * Get relative date string (heute, gestern, etc.)
 */
export function getRelativeDate(timestamp: number): string {
  const now = new Date();
  const date = timestampToDate(timestamp);

  const nowStart = getStartOfDay(now);
  const dateStart = getStartOfDay(date);

  const daysDiff = Math.floor((nowStart - dateStart) / (24 * 60 * 60));

  if (daysDiff === 0) {
    return 'Heute';
  } else if (daysDiff === 1) {
    return 'Gestern';
  } else if (daysDiff < 7) {
    return `vor ${daysDiff} Tagen`;
  } else {
    return formatDate(timestamp);
  }
}
