import { formatCurrency, parseCurrency, calculatePercentage, formatPercentage } from '@/utils/currencyUtils';

describe('CurrencyUtils', () => {
  describe('formatCurrency', () => {
    it('should format EUR currency correctly', () => {
      const result = formatCurrency(1234.56, 'EUR', 'de');
      expect(result).toBe('1.234,56 €');
    });

    it('should format USD currency correctly', () => {
      const result = formatCurrency(1234.56, 'USD', 'en');
      expect(result).toBe('$1,234.56');
    });

    it('should handle zero amount', () => {
      const result = formatCurrency(0, 'EUR', 'de');
      expect(result).toBe('0,00 €');
    });

    it('should handle negative amounts', () => {
      const result = formatCurrency(-100.50, 'EUR', 'de');
      expect(result).toBe('-100,50 €');
    });

    it('should fallback gracefully for unknown currency', () => {
      const result = formatCurrency(100, 'XYZ' as any, 'de');
      expect(result).toContain('100');
    });
  });

  describe('parseCurrency', () => {
    it('should parse EUR format correctly', () => {
      expect(parseCurrency('1.234,56 €', 'de')).toBe(1234.56);
      expect(parseCurrency('100,50', 'de')).toBe(100.50);
    });

    it('should parse USD format correctly', () => {
      expect(parseCurrency('$1,234.56', 'en')).toBe(1234.56);
      expect(parseCurrency('100.50', 'en')).toBe(100.50);
    });

    it('should handle invalid input', () => {
      expect(parseCurrency('invalid', 'en')).toBe(0);
      expect(parseCurrency('', 'en')).toBe(0);
      expect(parseCurrency(null as any, 'en')).toBe(0);
    });

    it('should remove currency symbols', () => {
      expect(parseCurrency('€ 100,50', 'de')).toBe(100.50);
      expect(parseCurrency('$ 100.50', 'en')).toBe(100.50);
      expect(parseCurrency('CHF 100.50', 'en')).toBe(100.50);
    });
  });

  describe('calculatePercentage', () => {
    it('should calculate percentage correctly', () => {
      expect(calculatePercentage(25, 100)).toBe(25.0);
      expect(calculatePercentage(33.33, 100, 2)).toBe(33.33);
      expect(calculatePercentage(1, 3, 1)).toBe(33.3);
    });

    it('should handle zero total', () => {
      expect(calculatePercentage(100, 0)).toBe(0);
    });

    it('should handle zero value', () => {
      expect(calculatePercentage(0, 100)).toBe(0);
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage correctly', () => {
      expect(formatPercentage(25.5, 1, 'en')).toBe('25.5%');
      expect(formatPercentage(33.333, 2, 'en')).toBe('33.33%');
    });

    it('should handle zero percentage', () => {
      expect(formatPercentage(0, 1, 'en')).toBe('0.0%');
    });
  });
});
