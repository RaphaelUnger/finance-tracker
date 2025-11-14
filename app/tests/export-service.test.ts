import { exportMonthToCsv } from '../src/services/exportService';
import TransactionService from '../src/services/transactionService';

jest.mock('../src/services/transactionService');
const Mocked = TransactionService as jest.Mocked<typeof TransactionService>;

describe('exportMonthToCsv', () => {
    beforeEach(() => jest.resetAllMocks());

    test('exports only transactions for the selected month', async () => {
        const txs = [
            { id: 'a', title: 'Coffee', amount: 350, date: '2025-11-10', category: 'Food', merchant: 'Cafe', notes: '', createdAt: '2025-11-10T00:00:00Z' },
            { id: 'b', title: 'Rent', amount: 100000, date: '2025-11-01', category: 'Housing', merchant: '', notes: '', createdAt: '2025-11-01T00:00:00Z' },
            { id: 'c', title: 'Groceries', amount: 4599, date: '2025-12-05', category: 'Food', merchant: '', notes: '', createdAt: '2025-12-05T00:00:00Z' }
        ];

        Mocked.getInstanceAsync = jest.fn().mockResolvedValue({ list: jest.fn().mockResolvedValue(txs) } as any);

        const csv = await exportMonthToCsv(2025, 11);
        const lines = csv.split('\n');
        expect(lines[0]).toContain('id,title,amount');
        // two entries for November
        expect(lines.length).toBe(1 + 2);
        expect(csv).toContain('Coffee');
        expect(csv).toContain('Rent');
        expect(csv).not.toContain('Groceries');
    });
});
