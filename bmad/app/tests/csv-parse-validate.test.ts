import { parseCsv, validateRow } from '../src/services/exportService';

describe('CSV parse and validate', () => {
    test('parseCsv returns headers and rows', () => {
        const csv = 'name,amt,when\nCoffee,3.50,2025-11-10\nRent,1000.00,2025-11-01';
        const res = parseCsv(csv);
        expect(res.header).toEqual(['name', 'amt', 'when']);
        expect(res.rows.length).toBe(2);
        expect(res.rows[0].name).toBe('Coffee');
    });

    test('validateRow detects missing/invalid fields', () => {
        const row = { name: 'Coffee', amt: '3.50', when: '2025-11-10' } as any;
        const mapping = { title: 'name', amount: 'amt', date: 'when' } as any;
        const v = validateRow(row, mapping);
        expect(v.valid).toBe(true);

        const bad = { name: '', amt: 'abc', when: 'notadate' } as any;
        const vb = validateRow(bad, mapping);
        expect(vb.valid).toBe(false);
        expect(vb.errors.length).toBeGreaterThanOrEqual(1);
    });
});
