import { createBackup } from './backupService';

test('backup creation returns string', async () => {
    const s = await createBackup('pw');
    expect(typeof s).toBe('string');
});
