import { InMemoryTransactionRepo } from '../services/transactionRepo';
import { Transaction } from '../services/models';

describe('InMemoryTransactionRepo', () => {
    let repo: InMemoryTransactionRepo;

    beforeEach(async () => {
        repo = new InMemoryTransactionRepo();
        await repo.clear();
    });

    test('create/get/delete', async () => {
        const tx: Transaction = {
            id: 'tx1',
            amountCents: 1000,
            date: '2025-01-01',
            category: 'Food',
            merchant: 'Cafe',
            notes: '',
            createdAt: '2025-01-01T00:00:00Z',
            recurrence: null
        };
        await repo.create(tx);
        const got = await repo.get('tx1');
        expect(got).not.toBeNull();
        expect(got!.amountCents).toBe(1000);

        await repo.delete('tx1');
        const gone = await repo.get('tx1');
        expect(gone).toBeNull();
    });

    test('update and list with filters', async () => {
        const t1: Transaction = { id: 'a', amountCents: 500, date: '2025-02-01', createdAt: '2025-02-01T00:00:00Z' } as any;
        const t2: Transaction = { id: 'b', amountCents: 1500, date: '2025-03-01', createdAt: '2025-03-01T00:00:00Z', category: 'Transport' } as any;
        await repo.seed([t1, t2]);

        await repo.update('a', { amountCents: 600 });
        const updated = await repo.get('a');
        expect(updated!.amountCents).toBe(600);

        const listAll = await repo.list();
        expect(listAll.length).toBe(2);

        const march = await repo.list({ from: '2025-03-01', to: '2025-03-31' });
        expect(march.length).toBe(1);
        expect(march[0].id).toBe('b');

        const byCategory = await repo.list({ category: 'Transport' });
        expect(byCategory.length).toBe(1);
    });
});
