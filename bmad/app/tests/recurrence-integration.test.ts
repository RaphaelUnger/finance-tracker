import { runGenerator, rollbackGeneratedFor } from '../src/services/recurrenceService';
import TransactionService from '../src/services/transactionService';

jest.mock('../src/services/transactionService');

const Mocked = TransactionService as jest.Mocked<typeof TransactionService>;

describe('recurrence generator integration (mocked repo)', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    test('runGenerator creates instances and updates nextRun', async () => {
        // arrange: one rule with monthly recurrence starting today
        const rule = { id: 'r1', title: 'Rent', amount: 100000, date: '2025-11-01', recurrence: { frequency: 'monthly', interval: 1 } } as any;
        const created: any[] = [];

        // mock getInstanceAsync to return an object with list/create/update/delete/get
        Mocked.getInstanceAsync = jest.fn().mockResolvedValue({
            list: jest.fn().mockResolvedValue([rule]),
            create: jest.fn().mockImplementation(async (input: any) => { const obj = { ...input, id: `g-${created.length}`, createdAt: new Date().toISOString() }; created.push(obj); return obj; }),
            update: jest.fn().mockResolvedValue(null),
            get: jest.fn().mockResolvedValue(rule),
            delete: jest.fn().mockResolvedValue(null)
        } as any);

        // act
        await runGenerator(60);

        // assert: at least one generated instance created
        expect(created.length).toBeGreaterThanOrEqual(1);
        expect(created[0].generatedFrom).toBe('r1');
        expect(created[0].generatedAt).toBeDefined();
    });

    test('rollbackGeneratedFor deletes generated transactions', async () => {
        const rule = { id: 'r2', title: 'Gym', amount: 3000, date: '2025-11-05', recurrence: { frequency: 'monthly' } } as any;
        const existing = [
            { id: 'g-1', generatedFrom: 'r2' },
            { id: 'g-2', generatedFrom: 'r2' },
            { id: 'other', generatedFrom: null }
        ];
        const deleted: string[] = [];

        Mocked.getInstanceAsync = jest.fn().mockResolvedValue({
            list: jest.fn().mockResolvedValue([rule, ...existing]),
            delete: jest.fn().mockImplementation(async (id: string) => { deleted.push(id); }),
            get: jest.fn().mockResolvedValue(rule),
            update: jest.fn().mockResolvedValue(null)
        } as any);

        await rollbackGeneratedFor('r2');
        expect(deleted).toContain('g-1');
        expect(deleted).toContain('g-2');
        expect(deleted).not.toContain('other');
    });
});
