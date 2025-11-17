import TransactionService from '../src/services/transactionService';
import { runGenerator, rollbackGeneratedFor } from '../src/services/recurrenceService';

describe('recurrence generator integration (AsyncStorageRepo)', () => {
    beforeEach(async () => {
        // reset singleton
        // @ts-ignore
        TransactionService.instance = null;
        const svc = await TransactionService.getInstanceAsync();
        const all = await svc.list();
        for (const t of all) await svc.delete(t.id);
    });

    it('generates occurrences and can rollback', async () => {
        const svc = TransactionService.getInstance();
        // create a recurrence rule starting today
        const today = new Date().toISOString().slice(0, 10);
        const rule = await svc.create({ title: 'MonthlyRule', amount: 1000, date: today, recurrence: { frequency: 'monthly', interval: 1 } as any });
        const created = await runGenerator(60);
        expect(created).toBeGreaterThanOrEqual(1);
        // Now rollback generated for rule
        await rollbackGeneratedFor(rule.id);
        const after = await svc.list();
        // only the rule should remain
        expect(after.find(x => x.id === rule.id)).toBeDefined();
        const generated = after.filter(x => x.generatedFrom === rule.id);
        expect(generated.length).toBe(0);
    });
});
