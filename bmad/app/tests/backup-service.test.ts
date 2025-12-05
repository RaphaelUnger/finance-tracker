import { createBackup, restoreFromEncrypted, saveBackupToStorage, getBackupFromStorage } from '../src/services/backupService';
import TransactionService from '../src/services/transactionService';

describe('backupService', () => {
    beforeEach(async () => {
        // Reset singleton and clear transactions
        // @ts-ignore
        TransactionService.instance = null;
        const svc = await TransactionService.getInstanceAsync();
        const all = await svc.list();
        for (const t of all) {
            await svc.delete(t.id);
        }
    });

    describe('createBackup', () => {
        it('should create an encrypted backup string', async () => {
            const password = 'test-password';
            const backup = await createBackup(password);

            expect(typeof backup).toBe('string');
            const parsed = JSON.parse(backup);
            expect(parsed.version).toBe(1);
            expect(parsed.kdf).toBeDefined();
            expect(parsed.kdf.salt).toBeDefined();
            expect(parsed.kdf.iterations).toBeDefined();
            expect(parsed.iv).toBeDefined();
            expect(parsed.ciphertext).toBeDefined();
            expect(parsed.hmac).toBeDefined();
        });

        it('should create different backups with same password (random salt/iv)', async () => {
            const password = 'same-password';
            const backup1 = await createBackup(password);
            const backup2 = await createBackup(password);

            expect(backup1).not.toBe(backup2);
        });

        it('should use custom PBKDF2 iterations', async () => {
            const password = 'test';
            const backup = await createBackup(password, 5000);

            const parsed = JSON.parse(backup);
            expect(parsed.kdf.iterations).toBe(5000);
        });
    });

    describe('restoreFromEncrypted', () => {
        it('should restore backup with correct password', async () => {
            const svc = await TransactionService.getInstanceAsync();
            await svc.create({ title: 'Test TX', amount: 1000, date: '2024-01-01' });

            const password = 'restore-test';
            const backup = await createBackup(password);

            // Clear transactions
            const all = await svc.list();
            for (const t of all) await svc.delete(t.id);

            const result = await restoreFromEncrypted(backup, password);
            expect(result.created).toBeGreaterThanOrEqual(1);
            expect(result.errors).toBe(0);
        });

        it('should throw error with wrong password', async () => {
            const backup = await createBackup('correct-password');

            await expect(restoreFromEncrypted(backup, 'wrong-password'))
                .rejects.toThrow(/Invalid password|HMAC mismatch/);
        });

        it('should throw error for invalid envelope format', async () => {
            await expect(restoreFromEncrypted('not json', 'test'))
                .rejects.toThrow('Invalid backup envelope');
        });

        it('should throw error for unsupported version', async () => {
            const invalidEnvelope = JSON.stringify({ version: 99 });

            await expect(restoreFromEncrypted(invalidEnvelope, 'test'))
                .rejects.toThrow('Unsupported backup version');
        });

        it('should throw error for missing envelope fields', async () => {
            const invalidEnvelope = JSON.stringify({
                version: 1,
                kdf: { salt: 'abc' }
                // missing iv, ciphertext, hmac
            });

            await expect(restoreFromEncrypted(invalidEnvelope, 'test'))
                .rejects.toThrow('Invalid backup envelope');
        });
    });

    describe('storage operations', () => {
        it('should save and retrieve backup from storage', async () => {
            const password = 'storage-test';
            await saveBackupToStorage(password);

            const stored = await getBackupFromStorage();
            expect(stored).not.toBeNull();

            const parsed = JSON.parse(stored!);
            expect(parsed.version).toBe(1);
        });
    });

    describe('round-trip backup/restore', () => {
        it('should preserve transaction data through backup and restore', async () => {
            const svc = await TransactionService.getInstanceAsync();

            // Create test transactions
            await svc.create({
                title: 'Grocery Shopping',
                amount: 5499,
                date: '2024-06-15',
                category: 'Food',
                merchant: 'Supermarket',
                notes: 'Weekly groceries'
            });
            await svc.create({
                title: 'Monthly Rent',
                amount: 120000,
                date: '2024-06-01',
                category: 'Housing'
            });

            const password = 'roundtrip-test';
            const backup = await createBackup(password);

            // Clear all transactions
            const beforeRestore = await svc.list();
            for (const t of beforeRestore) await svc.delete(t.id);
            expect((await svc.list()).length).toBe(0);

            // Restore
            const result = await restoreFromEncrypted(backup, password);
            expect(result.created).toBe(2);

            // Verify data
            const restored = await svc.list();
            expect(restored.length).toBe(2);

            const grocery = restored.find(t => t.title === 'Grocery Shopping');
            expect(grocery).toBeDefined();
            expect(grocery!.amount).toBe(5499);
            expect(grocery!.category).toBe('Food');
            expect(grocery!.merchant).toBe('Supermarket');
        });
    });
});
