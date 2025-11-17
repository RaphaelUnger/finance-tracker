import { parseReceiptText } from '../src/services/receiptParser';

describe('receiptParser', () => {
    test('extracts amount (largest money value)', () => {
        const text = `Store ABC\nItem 1 5.00\nItem 2 3.50\nTotal 8.50`;
        const r = parseReceiptText(text);
        expect(r.amount).toBe(850);
    });

    test('extracts ISO date', () => {
        const text = `Store\n2025-06-12\nTotal 12.00`;
        const r = parseReceiptText(text);
        expect(r.date).toBe('2025-06-12');
    });

    test('extracts merchant as first non-empty line', () => {
        const text = `MY SHOP\nAddress line\nTotal: $10.00`;
        const r = parseReceiptText(text);
        expect(r.title).toBe('MY SHOP');
    });
});
