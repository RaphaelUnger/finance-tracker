import { nextOccurrence, computeOccurrences } from '../src/services/recurrenceService';
import type { Recurrence } from '../src/services/models';

describe('recurrenceService extended tests', () => {
    describe('nextOccurrence', () => {
        it('should advance daily by interval', () => {
            const rec: Recurrence = { frequency: 'daily', interval: 1 };
            expect(nextOccurrence('2024-01-01', rec)).toBe('2024-01-02');
        });

        it('should advance daily by multiple days', () => {
            const rec: Recurrence = { frequency: 'daily', interval: 3 };
            expect(nextOccurrence('2024-01-01', rec)).toBe('2024-01-04');
        });

        it('should advance weekly by interval', () => {
            const rec: Recurrence = { frequency: 'weekly', interval: 1 };
            expect(nextOccurrence('2024-01-01', rec)).toBe('2024-01-08');
        });

        it('should advance weekly by multiple weeks', () => {
            const rec: Recurrence = { frequency: 'weekly', interval: 2 };
            expect(nextOccurrence('2024-01-01', rec)).toBe('2024-01-15');
        });

        it('should advance monthly by interval', () => {
            const rec: Recurrence = { frequency: 'monthly', interval: 1 };
            expect(nextOccurrence('2024-01-15', rec)).toBe('2024-02-15');
        });

        it('should advance monthly by multiple months', () => {
            const rec: Recurrence = { frequency: 'monthly', interval: 3 };
            expect(nextOccurrence('2024-01-15', rec)).toBe('2024-04-15');
        });

        it('should handle month-end edge cases', () => {
            const rec: Recurrence = { frequency: 'monthly', interval: 1 };
            // Jan 31 -> Feb (should be Feb 29 in leap year 2024)
            const result = nextOccurrence('2024-01-31', rec);
            expect(result).toMatch(/^2024-02-/);
        });

        it('should advance yearly by interval', () => {
            const rec: Recurrence = { frequency: 'yearly', interval: 1 };
            expect(nextOccurrence('2024-06-15', rec)).toBe('2025-06-15');
        });

        it('should advance yearly by multiple years', () => {
            const rec: Recurrence = { frequency: 'yearly', interval: 2 };
            expect(nextOccurrence('2024-06-15', rec)).toBe('2026-06-15');
        });

        it('should handle leap year for yearly recurrence', () => {
            const rec: Recurrence = { frequency: 'yearly', interval: 1 };
            // Feb 29, 2024 (leap year) -> Feb 28, 2025
            const result = nextOccurrence('2024-02-29', rec);
            expect(result).toMatch(/^2025-02-28/);
        });

        it('should default interval to 1 if not provided', () => {
            const rec: Recurrence = { frequency: 'monthly' };
            expect(nextOccurrence('2024-01-15', rec)).toBe('2024-02-15');
        });

        it('should default interval to 1 if invalid', () => {
            const rec: Recurrence = { frequency: 'monthly', interval: 0 };
            expect(nextOccurrence('2024-01-15', rec)).toBe('2024-02-15');
        });

        it('should default to monthly for unknown frequency', () => {
            const rec = { frequency: 'unknown' as any, interval: 1 };
            expect(nextOccurrence('2024-01-15', rec)).toBe('2024-02-15');
        });
    });

    describe('computeOccurrences', () => {
        it('should generate daily occurrences', () => {
            const rec: Recurrence = { frequency: 'daily', interval: 1 };
            const occ = computeOccurrences('2024-01-01', rec, '2024-01-05');
            expect(occ).toEqual([
                '2024-01-01',
                '2024-01-02',
                '2024-01-03',
                '2024-01-04',
                '2024-01-05'
            ]);
        });

        it('should generate weekly occurrences', () => {
            const rec: Recurrence = { frequency: 'weekly', interval: 1 };
            const occ = computeOccurrences('2024-01-01', rec, '2024-01-22');
            expect(occ).toEqual([
                '2024-01-01',
                '2024-01-08',
                '2024-01-15',
                '2024-01-22'
            ]);
        });

        it('should generate monthly occurrences', () => {
            const rec: Recurrence = { frequency: 'monthly', interval: 1 };
            const occ = computeOccurrences('2024-01-15', rec, '2024-04-15');
            expect(occ).toEqual([
                '2024-01-15',
                '2024-02-15',
                '2024-03-15',
                '2024-04-15'
            ]);
        });

        it('should generate yearly occurrences', () => {
            const rec: Recurrence = { frequency: 'yearly', interval: 1 };
            const occ = computeOccurrences('2024-06-01', rec, '2027-06-01');
            expect(occ).toEqual([
                '2024-06-01',
                '2025-06-01',
                '2026-06-01',
                '2027-06-01'
            ]);
        });

        it('should respect endDate in recurrence', () => {
            const rec: Recurrence = { frequency: 'daily', interval: 1, endDate: '2024-01-03' };
            const occ = computeOccurrences('2024-01-01', rec, '2024-01-10');
            expect(occ).toEqual([
                '2024-01-01',
                '2024-01-02',
                '2024-01-03'
            ]);
        });

        it('should use nextRun if provided', () => {
            const rec: Recurrence = { frequency: 'daily', interval: 1, nextRun: '2024-01-05' };
            const occ = computeOccurrences('2024-01-01', rec, '2024-01-07');
            expect(occ).toEqual([
                '2024-01-05',
                '2024-01-06',
                '2024-01-07'
            ]);
        });

        it('should return empty array if window is before start', () => {
            const rec: Recurrence = { frequency: 'daily', interval: 1 };
            const occ = computeOccurrences('2024-02-01', rec, '2024-01-15');
            expect(occ).toEqual([]);
        });

        it('should handle bi-weekly recurrence', () => {
            const rec: Recurrence = { frequency: 'weekly', interval: 2 };
            const occ = computeOccurrences('2024-01-01', rec, '2024-01-29');
            expect(occ).toEqual([
                '2024-01-01',
                '2024-01-15',
                '2024-01-29'
            ]);
        });

        it('should handle quarterly recurrence', () => {
            const rec: Recurrence = { frequency: 'monthly', interval: 3 };
            const occ = computeOccurrences('2024-01-01', rec, '2024-10-01');
            expect(occ).toEqual([
                '2024-01-01',
                '2024-04-01',
                '2024-07-01',
                '2024-10-01'
            ]);
        });

        it('should include window end date if it matches occurrence', () => {
            const rec: Recurrence = { frequency: 'monthly', interval: 1 };
            const occ = computeOccurrences('2024-01-15', rec, '2024-03-15');
            expect(occ).toContain('2024-03-15');
        });
    });
});
