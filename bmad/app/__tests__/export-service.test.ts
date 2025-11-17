import { parseCsv, validateRow, importCsvWithMappingWithStats, importCsvToTransactions } from '../src/services/exportService';
import TransactionService from '../src/services/transactionService';

describe('exportService CSV helpers', () => {
    it('parseCsv returns header and rows', () => {
        const csv = 'title,amount,date\nCoffee,2.5,2023-01-01\nShop,10,2023-01-02';
        const { header, rows } = parseCsv(csv);
        expect(header).toEqual(['title', 'amount', 'date']);
        expect(rows.length).toBe(2);
        expect(rows[0].title).toBe('Coffee');
    });

    it('validateRow flags missing/invalid fields', () => {
        const row = { title: '', amount: 'abc', date: 'not a date' } as Record<string, string>;
        const mapping = { title: 'title', amount: 'amount', date: 'date' } as Record<string, string>;
        const res = validateRow(row, mapping);
        expect(res.valid).toBe(false);
        expect(res.errors).toContain('title missing');
        expect(res.errors).toContain('amount invalid');
        expect(res.errors).toContain('date invalid');
    });

    it('importCsvWithMappingWithStats creates valid rows and reports errors', async () => {
        // reset svc singleton
        // @ts-ignore
        TransactionService.instance = null;
        const csv = 'title,amount,date\nGood,1.00,2023-01-01\nBad,notnum,2023-01-02';
        const mapping = { title: 'title', amount: 'amount', date: 'date' } as Record<string, string>;
        const res = await importCsvWithMappingWithStats(csv, mapping);
        expect(res.created).toBe(1);
        expect(res.errors).toBe(1);
    });

    it('importCsvToTransactions creates transactions and returns count', async () => {
        // reset singleton
        // @ts-ignore
        TransactionService.instance = null;
        const csv = 'title,amount,date\nX,2.00,2023-03-01\nY,3.50,2023-03-02';
        const created = await importCsvToTransactions(csv);
        expect(created).toBe(2);
    });
});
