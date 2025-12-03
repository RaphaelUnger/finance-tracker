import { formatDate, formatDateForDB, parseDateFromDB, getRelativeDateString, isValidDateString } from '@/utils/dateUtils';

describe('DateUtils', () => {
  const testDate = new Date('2024-11-28T10:30:00Z');

  describe('formatDate', () => {
    it('should format date in German format', () => {
      const result = formatDate(testDate, 'dd.MM.yyyy', 'de');
      expect(result).toBe('28.11.2024');
    });

    it('should format date in different format', () => {
      const result = formatDate(testDate, 'yyyy-MM-dd', 'en');
      expect(result).toBe('2024-11-28');
    });

    it('should handle ISO string input', () => {
      const result = formatDate('2024-11-28T10:30:00Z', 'dd.MM.yyyy', 'de');
      expect(result).toBe('28.11.2024');
    });

    it('should handle invalid date gracefully', () => {
      const result = formatDate('invalid-date', 'dd.MM.yyyy', 'de');
      expect(result).toBe('');
    });
  });

  describe('formatDateForDB', () => {
    it('should format date for database storage', () => {
      const result = formatDateForDB(testDate);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}/);
    });
  });

  describe('parseDateFromDB', () => {
    it('should parse date from database format', () => {
      const isoString = '2024-11-28T10:30:00.000Z';
      const result = parseDateFromDB(isoString);
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(10); // November = 10 (0-indexed)
      expect(result.getDate()).toBe(28);
    });
  });

  describe('getRelativeDateString', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return "Today" for today', () => {
      const today = new Date();
      jest.setSystemTime(today);

      const result = getRelativeDateString(today, 'en');
      expect(result).toBe('Today');
    });

    it('should return "Yesterday" for yesterday', () => {
      const today = new Date('2024-11-28T12:00:00Z');
      const yesterday = new Date('2024-11-27T12:00:00Z');
      jest.setSystemTime(today);

      const result = getRelativeDateString(yesterday, 'en');
      expect(result).toBe('Yesterday');
    });

    it('should return German relative dates', () => {
      const today = new Date('2024-11-28T12:00:00Z');
      const yesterday = new Date('2024-11-27T12:00:00Z');
      jest.setSystemTime(today);

      const result = getRelativeDateString(yesterday, 'de');
      expect(result).toBe('Gestern');
    });

    it('should return formatted date for older dates', () => {
      const today = new Date('2024-11-28T12:00:00Z');
      const weekAgo = new Date('2024-11-20T12:00:00Z');
      jest.setSystemTime(today);

      const result = getRelativeDateString(weekAgo, 'de');
      expect(result).toBe('20.11.2024');
    });
  });

  describe('isValidDateString', () => {
    it('should validate valid ISO date strings', () => {
      expect(isValidDateString('2024-11-28T10:30:00Z')).toBe(true);
      expect(isValidDateString('2024-11-28')).toBe(true);
    });

    it('should reject invalid date strings', () => {
      expect(isValidDateString('invalid-date')).toBe(false);
      expect(isValidDateString('')).toBe(false);
      expect(isValidDateString('2024-13-45')).toBe(false);
    });
  });
});
