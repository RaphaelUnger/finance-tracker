import { TransactionService, validateTransactionInput } from '../services/transactionService';
import { InMemoryTransactionRepo } from '../services/transactionRepo';

describe('TransactionService', () => {
    test('validate input', () => {
        expect(validateTransactionInput(null as any)).toBe('missing input');
        expect(validateTransactionInput({} as any)).toBe('missing id');
        expect(validateTransactionInput({ id: 'x' } as any)).toBe('invalid amountCents');
    });

    test('create and list', async () => {
        const repo = new InMemoryTransactionRepo();
        await repo.clear();
        const svc = new TransactionService(repo);
        const tx = await svc.create({ id: 't1', amountCents: 123, date: '2025-06-01' });
        expect(tx.id).toBe('t1');
        const all = await svc.list();
        expect(all.length).toBe(1);
    });

    test('update and delete', async () => {
        const repo = new InMemoryTransactionRepo();
        await repo.clear();
        const svc = new TransactionService(repo);
        await svc.create({ id: 't2', amountCents: 200, date: '2025-06-02' });
        const updated = await svc.update('t2', { amountCents: 250, date: '2025-06-03' } as any);
        expect(updated.amountCents).toBe(250);
        expect(updated.date).toBe('2025-06-03');
        await svc.delete('t2');
        const after = await repo.get('t2');
        expect(after).toBeNull();
    });
});
