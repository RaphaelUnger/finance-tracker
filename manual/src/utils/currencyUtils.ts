/**
 * Currency and number formatting utilities for the Finance Tracker app
 */

export const CURRENCIES = {
  EUR: { symbol: '€', code: 'EUR', name: 'Euro', decimals: 2 },
  USD: { symbol: '$', code: 'USD', name: 'US Dollar', decimals: 2 },
  GBP: { symbol: '£', code: 'GBP', name: 'British Pound', decimals: 2 },
  CHF: { symbol: 'CHF', code: 'CHF', name: 'Swiss Franc', decimals: 2 },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

/**
 * Format amount as currency
 */
export const formatCurrency = (
  amount: number,
  currencyCode: CurrencyCode = 'EUR',
  language: 'en' | 'de' = 'de'
): string => {
  try {
    const currency = CURRENCIES[currencyCode];
    const locale = language === 'de' ? 'de-DE' : 'en-US';

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: currency.decimals,
      maximumFractionDigits: currency.decimals,
    }).format(amount);
  } catch (error) {
    // Fallback formatting
    const currency = CURRENCIES[currencyCode];
    const formattedNumber = formatNumber(amount, currency.decimals);
    return language === 'de'
      ? `${formattedNumber} ${currency.symbol}`
      : `${currency.symbol}${formattedNumber}`;
  }
};

/**
 * Format number with proper locale
 */
export const formatNumber = (
  value: number,
  decimals: number = 2,
  language: 'en' | 'de' = 'de'
): string => {
  try {
    const locale = language === 'de' ? 'de-DE' : 'en-US';
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  } catch (error) {
    // Fallback formatting
    return value.toFixed(decimals);
  }
};

/**
 * Parse currency string to number
 */
export const parseCurrency = (
  currencyString: string,
  language: 'en' | 'de' = 'de'
): number => {
  if (!currencyString || typeof currencyString !== 'string') {
    return 0;
  }

  // Remove currency symbols and common formatting
  let cleanedString = currencyString
    .replace(/[€$£CHF\s]/g, '') // Remove currency symbols
    .replace(/[,\.]/g, match => match === ',' ? '.' : match); // Normalize decimal separator

  // Handle German number format (comma as decimal separator)
  if (language === 'de') {
    // If there's a comma, treat it as decimal separator
    const parts = cleanedString.split(',');
    if (parts.length === 2) {
      cleanedString = parts[0].replace(/\./g, '') + '.' + parts[1];
    }
  }

  const parsed = parseFloat(cleanedString);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Validate currency input
 */
export const isValidCurrencyInput = (input: string): boolean => {
  const parsed = parseCurrency(input);
  return !isNaN(parsed) && parsed >= 0;
};

/**
 * Format amount with appropriate sign and color indication
 */
export const formatAmountWithSign = (
  amount: number,
  type: 'income' | 'expense',
  currencyCode: CurrencyCode = 'EUR',
  language: 'en' | 'de' = 'de'
): { formatted: string; isPositive: boolean } => {
  const absAmount = Math.abs(amount);
  const formatted = formatCurrency(absAmount, currencyCode, language);
  const isPositive = type === 'income';

  return {
    formatted: isPositive ? `+${formatted}` : `-${formatted}`,
    isPositive,
  };
};

/**
 * Calculate percentage
 */
export const calculatePercentage = (
  value: number,
  total: number,
  decimals: number = 1
): number => {
  if (total === 0) return 0;
  const percentage = (value / total) * 100;
  return parseFloat(percentage.toFixed(decimals));
};

/**
 * Format percentage
 */
export const formatPercentage = (
  percentage: number,
  decimals: number = 1,
  language: 'en' | 'de' = 'de'
): string => {
  try {
    const locale = language === 'de' ? 'de-DE' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(percentage / 100);
  } catch (error) {
    return `${percentage.toFixed(decimals)}%`;
  }
};

/**
 * Round to nearest cent
 */
export const roundToCent = (amount: number): number => {
  return Math.round(amount * 100) / 100;
};

/**
 * Calculate change between two amounts
 */
export const calculateChange = (
  currentValue: number,
  previousValue: number
): { amount: number; percentage: number; direction: 'up' | 'down' | 'same' } => {
  const amount = currentValue - previousValue;
  const percentage = previousValue === 0 ? 0 : (amount / previousValue) * 100;

  let direction: 'up' | 'down' | 'same' = 'same';
  if (amount > 0) direction = 'up';
  if (amount < 0) direction = 'down';

  return {
    amount: roundToCent(amount),
    percentage: roundToCent(percentage),
    direction,
  };
};

/**
 * Format large numbers with K, M suffixes
 */
export const formatLargeNumber = (
  value: number,
  language: 'en' | 'de' = 'de'
): string => {
  const suffixes = language === 'de'
    ? ['', 'K', 'M', 'B']
    : ['', 'K', 'M', 'B'];

  const magnitude = Math.floor(Math.log10(Math.abs(value)) / 3);
  const scaledValue = value / Math.pow(1000, magnitude);

  if (magnitude === 0 || magnitude >= suffixes.length) {
    return formatNumber(value, 0, language);
  }

  return `${formatNumber(scaledValue, 1, language)}${suffixes[magnitude]}`;
};

/**
 * Sum array of numbers safely
 */
export const safeSum = (numbers: number[]): number => {
  return numbers.reduce((sum, num) => sum + (isNaN(num) ? 0 : num), 0);
};

/**
 * Calculate average safely
 */
export const safeAverage = (numbers: number[]): number => {
  const validNumbers = numbers.filter(num => !isNaN(num));
  if (validNumbers.length === 0) return 0;
  return safeSum(validNumbers) / validNumbers.length;
};

/**
 * Generate amount range for filters
 */
export const generateAmountRanges = (
  amounts: number[],
  steps: number = 5
): { min: number; max: number; step: number; ranges: Array<{ min: number; max: number; label: string }> } => {
  if (amounts.length === 0) {
    return { min: 0, max: 1000, step: 200, ranges: [] };
  }

  const min = Math.min(...amounts);
  const max = Math.max(...amounts);
  const step = Math.ceil((max - min) / steps);

  const ranges = [];
  for (let i = 0; i < steps; i++) {
    const rangeMin = min + (step * i);
    const rangeMax = i === steps - 1 ? max : min + (step * (i + 1));
    ranges.push({
      min: rangeMin,
      max: rangeMax,
      label: `${formatCurrency(rangeMin)} - ${formatCurrency(rangeMax)}`,
    });
  }

  return { min, max, step, ranges };
};
