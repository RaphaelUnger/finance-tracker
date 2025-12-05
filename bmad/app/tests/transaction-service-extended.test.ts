import TransactionService from '../src/services/transactionService';

describe('TransactionService extended tests', () => {
    let svc: TransactionService;

    beforeEach(async () => {
        // Reset singleton
        // @ts-ignore
        TransactionService.instance = null;
        svc = await TransactionService.getInstanceAsync();

        // Clear all transactions
        const all = await svc.list();
        for (const t of all) {
            await svc.delete(t.id);
        }
    });

    describe('create', () => {
        it('should create a transaction with all fields', async () => {
            const tx = await svc.create({
                title: 'Full Transaction',
                amount: 9999,
                date: '2024-06-15',
                category: 'Shopping',
                merchant: 'Amazon',
                notes: 'Birthday gift'
            });

            expect(tx.id).toBeDefined();
            expect(tx.title).toBe('Full Transaction');
            expect(tx.amount).toBe(9999);
            expect(tx.date).toBe('2024-06-15');
            expect(tx.category).toBe('Shopping');
            expect(tx.merchant).toBe('Amazon');
            expect(tx.notes).toBe('Birthday gift');
            expect(tx.createdAt).toBeDefined();
        });

        it('should create a transaction with minimal fields', async () => {
            const tx = await svc.create({
                title: 'Minimal',
                amount: 100,
                date: '2024-01-01'
            });

            expect(tx.id).toBeDefined();
            expect(tx.title).toBe('Minimal');
            expect(tx.category).toBeUndefined();
        });

        it('should create a transaction with recurrence', async () => {
            const tx = await svc.create({
                title: 'Monthly Rent',
                amount: 150000,
                date: '2024-01-01',
                recurrence: { frequency: 'monthly', interval: 1 }
            });

            expect(tx.recurrence).toBeDefined();
            expect(tx.recurrence!.frequency).toBe('monthly');
            expect(tx.recurrence!.interval).toBe(1);
        });

        it('should generate unique IDs for each transaction', async () => {
            const tx1 = await svc.create({ title: 'TX1', amount: 100, date: '2024-01-01' });
            const tx2 = await svc.create({ title: 'TX2', amount: 200, date: '2024-01-02' });
            const tx3 = await svc.create({ title: 'TX3', amount: 300, date: '2024-01-03' });

            expect(tx1.id).not.toBe(tx2.id);
            expect(tx2.id).not.toBe(tx3.id);
            expect(tx1.id).not.toBe(tx3.id);
        });

        it('should set createdAt timestamp', async () => {
            const before = new Date().toISOString();
            const tx = await svc.create({ title: 'Timestamped', amount: 100, date: '2024-01-01' });
            const after = new Date().toISOString();

            expect(tx.createdAt).toBeDefined();
            expect(tx.createdAt! >= before).toBe(true);
            expect(tx.createdAt! <= after).toBe(true);
        });
    });

    describe('list', () => {
        it('should return empty array when no transactions', async () => {
            const all = await svc.list();
            expect(all).toEqual([]);
        });

        it('should return all created transactions', async () => {
            await svc.create({ title: 'A', amount: 100, date: '2024-01-01' });
            await svc.create({ title: 'B', amount: 200, date: '2024-01-02' });
            await svc.create({ title: 'C', amount: 300, date: '2024-01-03' });

            const all = await svc.list();
            expect(all.length).toBe(3);
        });

        it('should include all transaction properties', async () => {
            await svc.create({
                title: 'Complete',
                amount: 5000,
                date: '2024-06-15',
                category: 'Food',
                merchant: 'Restaurant',
                notes: 'Lunch'
            });

            const all = await svc.list();
            const tx = all[0];
            expect(tx.title).toBe('Complete');
            expect(tx.amount).toBe(5000);
            expect(tx.category).toBe('Food');
            expect(tx.merchant).toBe('Restaurant');
            expect(tx.notes).toBe('Lunch');
        });
    });

    describe('get', () => {
        it('should get a specific transaction by id', async () => {
            const created = await svc.create({ title: 'Find Me', amount: 999, date: '2024-01-01' });

            const found = await svc.get(created.id);
            expect(found).toBeDefined();
            expect(found!.title).toBe('Find Me');
            expect(found!.amount).toBe(999);
        });

        it('should return undefined for non-existent id', async () => {
            const found = await svc.get('non-existent-id');
            expect(found).toBeUndefined();
        });
    });

    describe('update', () => {
        it('should update transaction title', async () => {
            const tx = await svc.create({ title: 'Original', amount: 100, date: '2024-01-01' });

            const updated = await svc.update(tx.id, { title: 'Updated' });
            expect(updated.title).toBe('Updated');
            expect(updated.amount).toBe(100); // unchanged
        });

        it('should update transaction amount', async () => {
            const tx = await svc.create({ title: 'Test', amount: 100, date: '2024-01-01' });

            const updated = await svc.update(tx.id, { amount: 500 });
            expect(updated.amount).toBe(500);
        });

        it('should update multiple fields at once', async () => {
            const tx = await svc.create({ title: 'Test', amount: 100, date: '2024-01-01' });

            const updated = await svc.update(tx.id, {
                title: 'New Title',
                amount: 999,
                category: 'New Category'
            });

            expect(updated.title).toBe('New Title');
            expect(updated.amount).toBe(999);
            expect(updated.category).toBe('New Category');
        });

        it('should update recurrence', async () => {
            const tx = await svc.create({
                title: 'Recurring',
                amount: 100,
                date: '2024-01-01',
                recurrence: { frequency: 'monthly', interval: 1 }
            });

            const updated = await svc.update(tx.id, {
                recurrence: { frequency: 'weekly', interval: 2 }
            });

            expect(updated.recurrence!.frequency).toBe('weekly');
            expect(updated.recurrence!.interval).toBe(2);
        });

        it('should throw error for non-existent id', async () => {
            await expect(svc.update('non-existent', { title: 'Fail' }))
                .rejects.toThrow();
        });

        it('should persist updates', async () => {
            const tx = await svc.create({ title: 'Persist', amount: 100, date: '2024-01-01' });
            await svc.update(tx.id, { title: 'Persisted' });

            const found = await svc.get(tx.id);
            expect(found!.title).toBe('Persisted');
        });
    });

    describe('delete', () => {
        it('should delete a transaction', async () => {
            const tx = await svc.create({ title: 'To Delete', amount: 100, date: '2024-01-01' });

            await svc.delete(tx.id);

            const found = await svc.get(tx.id);
            expect(found).toBeUndefined();
        });

        it('should not affect other transactions', async () => {
            const tx1 = await svc.create({ title: 'Keep', amount: 100, date: '2024-01-01' });
            const tx2 = await svc.create({ title: 'Delete', amount: 200, date: '2024-01-02' });

            await svc.delete(tx2.id);

            const found = await svc.get(tx1.id);
            expect(found).toBeDefined();
            expect(found!.title).toBe('Keep');
        });

        it('should handle deleting non-existent id gracefully', async () => {
            // Should not throw
            await svc.delete('non-existent-id');
        });
    });

    describe('singleton pattern', () => {
        it('should return same instance from getInstance', () => {
            const inst1 = TransactionService.getInstance();
            const inst2 = TransactionService.getInstance();
            expect(inst1).toBe(inst2);
        });

        it('should return same instance from getInstanceAsync', async () => {
            const inst1 = await TransactionService.getInstanceAsync();
            const inst2 = await TransactionService.getInstanceAsync();
            expect(inst1).toBe(inst2);
        });
    });

    describe('generatedFrom tracking', () => {
        it('should track generated transactions', async () => {
            const rule = await svc.create({
                title: 'Recurring Rule',
                amount: 1000,
                date: '2024-01-01',
                recurrence: { frequency: 'monthly', interval: 1 }
            });

            const generated = await svc.create({
                title: 'Recurring Rule',
                amount: 1000,
                date: '2024-02-01',
                generatedFrom: rule.id,
                generatedAt: new Date().toISOString()
            });

            expect(generated.generatedFrom).toBe(rule.id);
            expect(generated.generatedAt).toBeDefined();
        });

        it('should filter generated transactions', async () => {
            const rule = await svc.create({
                title: 'Rule',
                amount: 1000,
                date: '2024-01-01'
            });

            await svc.create({ title: 'Gen1', amount: 1000, date: '2024-02-01', generatedFrom: rule.id });
            await svc.create({ title: 'Gen2', amount: 1000, date: '2024-03-01', generatedFrom: rule.id });
            await svc.create({ title: 'Manual', amount: 500, date: '2024-02-15' });

            const all = await svc.list();
            const generated = all.filter(t => t.generatedFrom === rule.id);
            expect(generated.length).toBe(2);
        });
    });
});
