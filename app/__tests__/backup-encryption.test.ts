import { createBackup, restoreFromEncrypted } from '../src/services/backupService';

describe('backupService encryption', () => {
    it('creates and restores backup with correct password', async () => {
        const password = 'test-pass-123';
        const encrypted = await createBackup(password);
        expect(typeof encrypted).toBe('string');
        // restore should not throw with correct password
        // In tests the transaction list may be empty but restore should return an object
        const result = await restoreFromEncrypted(encrypted, password);
        expect(result).toHaveProperty('created');
        expect(result).toHaveProperty('errors');
    });
});
