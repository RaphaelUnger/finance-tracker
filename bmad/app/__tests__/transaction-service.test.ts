import TransactionService from '../src/services/transactionService';

describe('TransactionService (AsyncStorageRepo fallback)', () => {
    let svc: any;

    beforeEach(async () => {
        // create a fresh instance
        // reset singleton
        // @ts-ignore
        TransactionService.instance = null;
        svc = TransactionService.getInstance();
        // ensure init completed
        await svc.init?.();
        // clear any existing
        const all = await svc.list();
        for (const t of all) {
            await svc.delete(t.id);
        }
    });

    it('creates and lists a transaction', async () => {
        const tx = await svc.create({ title: 'Test', amount: 500, date: '2023-01-02' });
        expect(tx.id).toBeDefined();
        const all = await svc.list();
        expect(all.find((x: any) => x.id === tx.id)).toBeDefined();
    });

    it('gets, updates and deletes a transaction', async () => {
        const tx = await svc.create({ title: 'Updatable', amount: 1200, date: '2023-02-02' });
        const fetched = await svc.get(tx.id);
        expect(fetched).toBeDefined();
        expect(fetched.title).toBe('Updatable');

        const updated = await svc.update(tx.id, { title: 'Updated', amount: 1300 });
        expect(updated.title).toBe('Updated');
        expect(updated.amount).toBe(1300);

        await svc.delete(tx.id);
        const after = await svc.get(tx.id);
        expect(after).toBeUndefined();
    });
});
