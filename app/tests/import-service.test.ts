import { importCsvToRepo } from '../services/importService';
import { InMemoryTransactionRepo } from '../services/transactionRepo';
import { SQLiteTransactionRepo } from '../services/sqliteTransactionRepo';

const csv = `id,amount,date,category,notes,merchant,createdAt
1,10.00,2025-05-01,Food,Meal,Cafe,2025-05-01T12:00:00Z
2,20.50,2025-05-02,Transport,Uber,TaxiCo,2025-05-02T08:00:00Z
`;

describe('importCsvToRepo', () => {
    test('imports into in-memory repo', async () => {
        const repo = new InMemoryTransactionRepo();
        await repo.clear();
        const res = await importCsvToRepo(csv, repo);
        expect(res.created).toBe(2);
        const list = await repo.list();
        expect(list.length).toBe(2);
    });

    test('imports into sqlite repo and skips duplicates', async () => {
        const tmpPath = process.cwd() + '/app/tmp/import-test.db';
        const repo = new SQLiteTransactionRepo(tmpPath);
        repo.clear();
        const res1 = await importCsvToRepo(csv, repo);
        expect(res1.created).toBe(2);
        // re-import same CSV: should be skipped as duplicates
        const res2 = await importCsvToRepo(csv, repo);
        expect(res2.skipped).toBe(2);
    });
});
