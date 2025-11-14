import { parseCsv, csvRowToTransaction } from '../services/csvParser';

describe('CSV Parser', () => {
    test('parses inline CSV and converts amounts to cents', () => {
        const csv = `id,amount,date,category,notes,merchant,createdAt
1,12.34,2025-01-02,Food,Lunch at cafe,Cafe Good,2025-01-02T12:00:00Z
2,5.5,2025-01-03,Transport,Bus ticket,Local Bus,2025-01-03T08:00:00Z
`;
        const rows = parseCsv(csv);
        expect(rows.length).toBe(2);

        const t1 = csvRowToTransaction(rows[0]);
        expect(t1.id).toBe('1');
        expect(t1.amountCents).toBe(1234);
        expect(t1.category).toBe('Food');

        const t2 = csvRowToTransaction(rows[1]);
        expect(t2.amountCents).toBe(550);
        expect(t2.merchant).toBe('Local Bus');
    });
});
