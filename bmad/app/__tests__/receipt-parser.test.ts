import { parseReceiptText } from '../src/services/receiptParser';

describe('receiptParser.parseReceiptText', () => {
    it('extracts amount in cents from text with euro and comma', () => {
        const text = `SUPER STORE\nTotal: € 12,34\nDate: 2023-04-01`;
        const res = parseReceiptText(text);
        expect(res.amount).toBe(1234);
        expect(res.date).toBe('2023-04-01');
        expect(res.title).toBe('SUPER STORE');
    });

    it('picks the largest money-like value as total', () => {
        const text = `Shop\nItem1 2.00\nItem2 5.50\nTotal 10.00`;
        const res = parseReceiptText(text);
        expect(res.amount).toBe(1000);
        expect(res.title).toBe('Shop');
    });

    it('parses dd/mm/yyyy and normalizes to yyyy-mm-dd', () => {
        const text = `Cafe\n12/3/2022\n€3.50`;
        const res = parseReceiptText(text);
        expect(res.date).toBe('2022-03-12');
    });

    it('returns undefined for missing fields', () => {
        const text = ``;
        const res = parseReceiptText(text);
        expect(res.amount).toBeUndefined();
        expect(res.date).toBeUndefined();
        expect(res.title).toBeUndefined();
    });
});
