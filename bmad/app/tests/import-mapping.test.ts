import { importCsvWithMapping } from '../src/services/exportService';
import TransactionService from '../src/services/transactionService';

jest.mock('../src/services/transactionService');
const Mocked = TransactionService as jest.Mocked<typeof TransactionService>;

describe('importCsvWithMapping', () => {
    beforeEach(() => jest.resetAllMocks());

    test('imports mapped CSV rows', async () => {
        const csv = 'name,amt,when,cat\nCoffee,3.50,2025-11-10,Food\nRent,1000.00,2025-11-01,Housing';
        const created: any[] = [];
        Mocked.getInstanceAsync = jest.fn().mockResolvedValue({
            create: jest.fn().mockImplementation(async (x: any) => { created.push(x); return x; }),
            list: jest.fn().mockResolvedValue([])
        } as any);

        const mapping = { title: 'name', amount: 'amt', date: 'when', category: 'cat', merchant: undefined, notes: undefined } as any;
        const count = await importCsvWithMapping(csv, mapping);
        expect(count).toBe(2);
        expect(created[0].title).toBe('Coffee');
        expect(created[0].amount).toBe(Math.round(3.5 * 100));
        expect(created[1].title).toBe('Rent');
    });
});
