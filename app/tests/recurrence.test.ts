import { computeOccurrences } from '../src/services/recurrenceService';

describe('recurrence computeOccurrences', () => {
    test('monthly recurrence generates expected dates', () => {
        const start = '2025-11-01';
        const rec = { frequency: 'monthly', interval: 1 } as any;
        const out = computeOccurrences(start, rec, '2026-02-01');
        // expect at least Nov, Dec, Jan, Feb occurrences
        expect(out.length).toBeGreaterThanOrEqual(3);
        expect(out[0]).toBe('2025-11-01');
    });
});
