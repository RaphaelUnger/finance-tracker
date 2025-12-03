import {
  generateId,
  formatCurrency,
  formatDate,
  formatDateTime,
  getStartOfDay,
  getEndOfDay,
  getStartOfMonth,
  getEndOfMonth,
  validateAmount,
  validateDescription,
  timestampToDate,
  dateToTimestamp,
  getRelativeDate,
  debounce,
} from '../../src/utils/helpers';

describe('Utility Helpers', () => {
  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
    });

    it('should generate IDs with timestamp and random parts', () => {
      const id = generateId();

      // Should contain both timestamp and random parts
      expect(id.length).toBeGreaterThan(10);
    });
  });

  describe('formatCurrency', () => {
    it('should format currency in EUR by default', () => {
      expect(formatCurrency(1234.56)).toBe('1.234,56 €');
      expect(formatCurrency(0)).toBe('0,00 €');
      expect(formatCurrency(99.9)).toBe('99,90 €');
    });

    it('should handle different currencies', () => {
      expect(formatCurrency(1234.56, 'USD')).toContain('$');
      expect(formatCurrency(1234.56, 'GBP')).toContain('£');
    });

    it('should handle negative amounts', () => {
      expect(formatCurrency(-123.45)).toBe('-123,45 €');
    });
  });

  describe('formatDate', () => {
    it('should format timestamp to German date format', () => {
      const timestamp = 1672531200; // 2023-01-01
      const result = formatDate(timestamp);

      expect(result).toBe('01.01.2023');
    });

    it('should respect custom formatting options', () => {
      const timestamp = 1672531200;
      const result = formatDate(timestamp, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      expect(result).toContain('Januar');
      expect(result).toContain('2023');
    });
  });

  describe('formatDateTime', () => {
    it('should format timestamp to German date and time format', () => {
      const timestamp = 1672531200; // 2023-01-01 00:00:00
      const result = formatDateTime(timestamp);

      expect(result).toContain('01.01.2023');
      expect(result).toMatch(/\d{2}:\d{2}/); // Should contain time
    });
  });

  describe('date utility functions', () => {
    const testDate = new Date('2023-01-15T14:30:00Z');

    it('should get start of day correctly', () => {
      const startTimestamp = getStartOfDay(testDate);
      const startDate = timestampToDate(startTimestamp);

      expect(startDate.getHours()).toBe(0);
      expect(startDate.getMinutes()).toBe(0);
      expect(startDate.getSeconds()).toBe(0);
      expect(startDate.getMilliseconds()).toBe(0);
    });

    it('should get end of day correctly', () => {
      const endTimestamp = getEndOfDay(testDate);
      const endDate = timestampToDate(endTimestamp);

      expect(endDate.getHours()).toBe(23);
      expect(endDate.getMinutes()).toBe(59);
      expect(endDate.getSeconds()).toBe(59);
    });

    it('should get start of month correctly', () => {
      const startTimestamp = getStartOfMonth(testDate);
      const startDate = timestampToDate(startTimestamp);

      expect(startDate.getDate()).toBe(1);
      expect(startDate.getMonth()).toBe(testDate.getMonth());
      expect(startDate.getFullYear()).toBe(testDate.getFullYear());
    });

    it('should get end of month correctly', () => {
      const endTimestamp = getEndOfMonth(testDate);
      const endDate = timestampToDate(endTimestamp);

      expect(endDate.getDate()).toBe(31); // January has 31 days
      expect(endDate.getMonth()).toBe(testDate.getMonth());
    });
  });

  describe('timestamp conversion', () => {
    it('should convert date to timestamp and back', () => {
      const originalDate = new Date('2023-01-15T14:30:00Z');
      const timestamp = dateToTimestamp(originalDate);
      const convertedDate = timestampToDate(timestamp);

      expect(Math.abs(convertedDate.getTime() - originalDate.getTime())).toBeLessThan(1000);
    });
  });

  describe('validateAmount', () => {
    it('should validate correct amounts', () => {
      expect(validateAmount('123.45')).toEqual({ isValid: true, value: 123.45 });
      expect(validateAmount('123,45')).toEqual({ isValid: true, value: 123.45 });
      expect(validateAmount('1000')).toEqual({ isValid: true, value: 1000 });
      expect(validateAmount('0.01')).toEqual({ isValid: true, value: 0.01 });
    });

    it('should reject invalid amounts', () => {
      expect(validateAmount('')).toEqual({
        isValid: false,
        error: 'Betrag ist erforderlich'
      });
      expect(validateAmount('abc')).toEqual({
        isValid: false,
        error: 'Ungültiger Betrag'
      });
      expect(validateAmount('0')).toEqual({
        isValid: false,
        error: 'Betrag muss größer als 0 sein'
      });
      expect(validateAmount('-10')).toEqual({
        isValid: false,
        error: 'Betrag muss größer als 0 sein'
      });
      expect(validateAmount('1000000')).toEqual({
        isValid: false,
        error: 'Betrag ist zu hoch'
      });
    });

    it('should round to 2 decimal places', () => {
      expect(validateAmount('123.456')).toEqual({ isValid: true, value: 123.46 });
      expect(validateAmount('123.454')).toEqual({ isValid: true, value: 123.45 });
    });
  });

  describe('validateDescription', () => {
    it('should validate correct descriptions', () => {
      expect(validateDescription('Valid description')).toEqual({ isValid: true });
      expect(validateDescription('   Valid with spaces   ')).toEqual({ isValid: true });
    });

    it('should reject invalid descriptions', () => {
      expect(validateDescription('')).toEqual({
        isValid: false,
        error: 'Beschreibung ist erforderlich'
      });
      expect(validateDescription('   ')).toEqual({
        isValid: false,
        error: 'Beschreibung ist erforderlich'
      });

      const longDescription = 'a'.repeat(101);
      expect(validateDescription(longDescription)).toEqual({
        isValid: false,
        error: 'Beschreibung ist zu lang (max. 100 Zeichen)'
      });
    });
  });

  describe('getRelativeDate', () => {
    it('should return "Heute" for today', () => {
      const now = Math.floor(Date.now() / 1000);
      expect(getRelativeDate(now)).toBe('Heute');
    });

    it('should return "Gestern" for yesterday', () => {
      const yesterday = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
      expect(getRelativeDate(yesterday)).toBe('Gestern');
    });

    it('should return "vor X Tagen" for recent dates', () => {
      const threeDaysAgo = Math.floor((Date.now() - 3 * 24 * 60 * 60 * 1000) / 1000);
      expect(getRelativeDate(threeDaysAgo)).toBe('vor 3 Tagen');
    });

    it('should return formatted date for older dates', () => {
      const twoWeeksAgo = Math.floor((Date.now() - 14 * 24 * 60 * 60 * 1000) / 1000);
      const result = getRelativeDate(twoWeeksAgo);
      expect(result).toMatch(/\d{2}\.\d{2}\.\d{4}/);
    });
  });

  describe('debounce', () => {
    jest.useFakeTimers();

    it('should debounce function calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('test1');
      debouncedFn('test2');
      debouncedFn('test3');

      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('test3');
    });

    it('should reset timer on subsequent calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('test1');
      jest.advanceTimersByTime(50);

      debouncedFn('test2');
      jest.advanceTimersByTime(50);

      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(50);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('test2');
    });
  });
});
