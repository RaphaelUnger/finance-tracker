import { nextOccurrence, computeOccurrences } from '../src/services/recurrenceService';

describe('recurrenceService', () => {
    it('nextOccurrence advances monthly by interval', () => {
        const next = nextOccurrence('2023-01-31', { frequency: 'monthly', interval: 1 } as any);
        // adding one month to Jan 31 should produce Feb 28 (or 2023-02-28)
        expect(next).toMatch(/^2023-02-..$/);
    });

    it('computeOccurrences generates occurrences until window end', () => {
        const rec = { frequency: 'weekly', interval: 1 } as any;
        const occ = computeOccurrences('2023-10-01', rec, '2023-10-31');
        // should include multiple weekly dates in October
        expect(occ.length).toBeGreaterThanOrEqual(4);
        expect(occ[0]).toBe('2023-10-01');
    });

    it('computeOccurrences respects endDate in recurrence', () => {
        const rec = { frequency: 'daily', interval: 1, endDate: '2023-11-03' } as any;
        const occ = computeOccurrences('2023-11-01', rec, '2023-11-10');
        expect(occ).toEqual(['2023-11-01', '2023-11-02', '2023-11-03']);
    });
});
