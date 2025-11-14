import { SQLiteTransactionRepo } from '../services/sqliteTransactionRepo';
import { Transaction } from '../services/models';

describe('SQLiteTransactionRepo', () => {
    const tmpPath = process.cwd() + '/app/tmp/test-transactions.db';

    beforeEach(() => {
        // test repo will be created fresh and cleared
    });

    test('create/get/update/delete persists to sqlite', async () => {
        const repo = new SQLiteTransactionRepo(tmpPath);
        repo.clear();

        const tx: Transaction = { id: 'f1', amountCents: 200, date: '2025-04-01', createdAt: '2025-04-01T00:00:00Z' } as any;
        await repo.create(tx);

        const got = await repo.get('f1');
        expect(got).not.toBeNull();
        expect(got!.amountCents).toBe(200);

        await repo.update('f1', { amountCents: 250 });
        const updated = await repo.get('f1');
        expect(updated!.amountCents).toBe(250);

        await repo.delete('f1');
        const after = await repo.get('f1');
        expect(after).toBeNull();
    });
});
