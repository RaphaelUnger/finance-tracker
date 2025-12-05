import { parseCsv, validateRow, exportMonthToCsv, importCsvToTransactions, importCsvWithMapping, importCsvWithMappingWithStats } from '../src/services/exportService';
import TransactionService from '../src/services/transactionService';

describe('exportService extended tests', () => {
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

    describe('parseCsv', () => {
        it('should parse simple CSV', () => {
            const csv = 'name,age,city\nJohn,30,NYC\nJane,25,LA';
            const { header, rows } = parseCsv(csv);

            expect(header).toEqual(['name', 'age', 'city']);
            expect(rows.length).toBe(2);
            expect(rows[0].name).toBe('John');
            expect(rows[1].city).toBe('LA');
        });

        it('should handle empty values', () => {
            const csv = 'a,b,c\n1,,3';
            const { rows } = parseCsv(csv);

            expect(rows[0].a).toBe('1');
            expect(rows[0].b).toBe('');
            expect(rows[0].c).toBe('3');
        });

        it('should handle quoted values with commas', () => {
            const csv = 'name,description\n"Item","A, B, and C"';
            const { rows } = parseCsv(csv);

            expect(rows[0].description).toBe('A, B, and C');
        });

        it('should skip empty lines', () => {
            const csv = 'a,b\n1,2\n\n3,4';
            const { rows } = parseCsv(csv);

            expect(rows.length).toBe(2);
        });

        it('should handle single column', () => {
            const csv = 'value\n100\n200\n300';
            const { header, rows } = parseCsv(csv);

            expect(header).toEqual(['value']);
            expect(rows.length).toBe(3);
        });
    });

    describe('validateRow', () => {
        const mapping = { title: 'name', amount: 'price', date: 'when' };

        it('should validate correct row', () => {
            const row = { name: 'Coffee', price: '3.50', when: '2024-01-01' };
            const result = validateRow(row, mapping);

            expect(result.valid).toBe(true);
            expect(result.errors).toEqual([]);
        });

        it('should detect missing title', () => {
            const row = { name: '', price: '3.50', when: '2024-01-01' };
            const result = validateRow(row, mapping);

            expect(result.valid).toBe(false);
            expect(result.errors).toContain('title missing');
        });

        it('should detect invalid amount', () => {
            const row = { name: 'Item', price: 'not-a-number', when: '2024-01-01' };
            const result = validateRow(row, mapping);

            expect(result.valid).toBe(false);
            expect(result.errors).toContain('amount invalid');
        });

        it('should detect invalid date', () => {
            const row = { name: 'Item', price: '10', when: 'invalid-date' };
            const result = validateRow(row, mapping);

            expect(result.valid).toBe(false);
            expect(result.errors).toContain('date invalid');
        });

        it('should detect multiple errors', () => {
            const row = { name: '', price: 'abc', when: 'xyz' };
            const result = validateRow(row, mapping);

            expect(result.valid).toBe(false);
            expect(result.errors.length).toBe(3);
        });

        it('should handle missing mapped columns', () => {
            const row = { other: 'value' };
            const result = validateRow(row, mapping);

            expect(result.valid).toBe(false);
        });
    });

    describe('exportMonthToCsv', () => {
        it('should export transactions for a specific month', async () => {
            const svc = await TransactionService.getInstanceAsync();
            await svc.create({ title: 'Jan TX', amount: 1000, date: '2024-01-15' });
            await svc.create({ title: 'Feb TX', amount: 2000, date: '2024-02-15' });
            await svc.create({ title: 'Jan TX 2', amount: 3000, date: '2024-01-20' });

            const csv = await exportMonthToCsv(2024, 1);
            const lines = csv.split('\n');

            expect(lines[0]).toContain('id,title,amount');
            expect(csv).toContain('Jan TX');
            expect(csv).toContain('Jan TX 2');
            expect(csv).not.toContain('Feb TX');
        });

        it('should return header only when no transactions for month', async () => {
            const csv = await exportMonthToCsv(2099, 12);
            const lines = csv.split('\n');

            expect(lines.length).toBe(1); // header only
            expect(lines[0]).toContain('id,title,amount');
        });

        it('should format amount as decimal', async () => {
            const svc = await TransactionService.getInstanceAsync();
            await svc.create({ title: 'Test', amount: 1234, date: '2024-03-15' });

            const csv = await exportMonthToCsv(2024, 3);
            expect(csv).toContain('12.34');
        });

        it('should escape commas in text fields', async () => {
            const svc = await TransactionService.getInstanceAsync();
            await svc.create({
                title: 'Item, with comma',
                amount: 100,
                date: '2024-04-15',
                notes: 'Note, also comma'
            });

            const csv = await exportMonthToCsv(2024, 4);
            expect(csv).toContain('Item  with comma'); // commas replaced with spaces
        });
    });

    describe('importCsvToTransactions', () => {
        it('should import valid CSV with header', async () => {
            const csv = 'title,amount,date\nCoffee,3.50,2024-01-01\nLunch,12.00,2024-01-02';
            const created = await importCsvToTransactions(csv);

            expect(created).toBe(2);

            const svc = await TransactionService.getInstanceAsync();
            const all = await svc.list();
            expect(all.length).toBe(2);
        });

        it('should convert decimal amounts to cents', async () => {
            const csv = 'title,amount,date\nTest,15.99,2024-01-01';
            await importCsvToTransactions(csv);

            const svc = await TransactionService.getInstanceAsync();
            const all = await svc.list();
            expect(all[0].amount).toBe(1599);
        });

        it('should handle missing optional fields', async () => {
            const csv = 'title,amount,date\nMinimal,10,2024-01-01';
            const created = await importCsvToTransactions(csv);

            expect(created).toBe(1);
        });

        it('should return 0 for empty CSV', async () => {
            const csv = '';
            const created = await importCsvToTransactions(csv);
            expect(created).toBe(0);
        });

        it('should skip header by default', async () => {
            const csv = 'title,amount,date\nItem,5.00,2024-01-01';
            await importCsvToTransactions(csv);

            const svc = await TransactionService.getInstanceAsync();
            const all = await svc.list();
            // Should not have a transaction with title "title"
            expect(all.find(t => t.title === 'title')).toBeUndefined();
        });
    });

    describe('importCsvWithMapping', () => {
        it('should map custom column names', async () => {
            const csv = 'item_name,price,purchase_date\nGroceries,45.50,2024-05-10';
            const mapping = { title: 'item_name', amount: 'price', date: 'purchase_date' };

            const count = await importCsvWithMapping(csv, mapping);
            expect(count).toBe(1);

            const svc = await TransactionService.getInstanceAsync();
            const all = await svc.list();
            expect(all[0].title).toBe('Groceries');
            expect(all[0].amount).toBe(4550);
        });

        it('should include category in mapping', async () => {
            const csv = 'name,cost,dt,cat\nLunch,12.00,2024-01-01,Food';
            const mapping = { title: 'name', amount: 'cost', date: 'dt', category: 'cat' };

            await importCsvWithMapping(csv, mapping);

            const svc = await TransactionService.getInstanceAsync();
            const all = await svc.list();
            expect(all[0].category).toBe('Food');
        });
    });

    describe('importCsvWithMappingWithStats', () => {
        it('should return created and error counts', async () => {
            const csv = 'name,amt,dt\nGood,10.00,2024-01-01\nBad,invalid,2024-01-02\nAlsoGood,20.00,2024-01-03';
            const mapping = { title: 'name', amount: 'amt', date: 'dt' };

            const result = await importCsvWithMappingWithStats(csv, mapping);

            expect(result.created).toBe(2);
            expect(result.errors).toBe(1);
        });

        it('should count all rows as errors when all invalid', async () => {
            const csv = 'name,amt,dt\n,invalid,notadate\n,abc,xyz';
            const mapping = { title: 'name', amount: 'amt', date: 'dt' };

            const result = await importCsvWithMappingWithStats(csv, mapping);

            expect(result.created).toBe(0);
            expect(result.errors).toBe(2);
        });

        it('should handle empty CSV', async () => {
            const csv = 'name,amt,dt';
            const mapping = { title: 'name', amount: 'amt', date: 'dt' };

            const result = await importCsvWithMappingWithStats(csv, mapping);

            expect(result.created).toBe(0);
            expect(result.errors).toBe(0);
        });
    });
});
