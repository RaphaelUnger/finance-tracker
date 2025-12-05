import { parseReceiptText } from '../src/services/receiptParser';

describe('receiptParser extended tests', () => {
    describe('amount extraction', () => {
        it('should extract amount with EUR symbol', () => {
            const text = 'Total: EUR 25.99';
            const result = parseReceiptText(text);
            expect(result.amount).toBe(2599);
        });

        it('should extract amount with USD symbol', () => {
            const text = 'Total: USD 15.50';
            const result = parseReceiptText(text);
            expect(result.amount).toBe(1550);
        });

        it('should extract amount with $ symbol', () => {
            const text = 'Grand Total: $99.99';
            const result = parseReceiptText(text);
            expect(result.amount).toBe(9999);
        });

        it('should pick the largest amount as total', () => {
            const text = `Item 1: 5.00
Item 2: 3.50
Subtotal: 8.50
Tax: 0.85
Total: 9.35`;
            const result = parseReceiptText(text);
            expect(result.amount).toBe(935);
        });

        it('should handle comma as decimal separator', () => {
            const text = 'Total: €12,50';
            const result = parseReceiptText(text);
            expect(result.amount).toBe(1250);
        });

        it('should handle amounts without decimal', () => {
            const text = 'Total: 100';
            const result = parseReceiptText(text);
            expect(result.amount).toBe(10000);
        });

        it('should handle single decimal place', () => {
            const text = 'Total: 5.5';
            const result = parseReceiptText(text);
            expect(result.amount).toBe(550);
        });

        it('should return undefined for text without amounts', () => {
            const text = 'No money values here';
            const result = parseReceiptText(text);
            expect(result.amount).toBeUndefined();
        });
    });

    describe('date extraction', () => {
        it('should extract ISO date format YYYY-MM-DD', () => {
            const text = 'Date: 2024-12-25';
            const result = parseReceiptText(text);
            expect(result.date).toBe('2024-12-25');
        });

        it('should extract European date format DD/MM/YYYY', () => {
            const text = 'Date: 25/12/2024';
            const result = parseReceiptText(text);
            expect(result.date).toBe('2024-12-25');
        });

        it('should extract date with dots DD.MM.YYYY', () => {
            const text = 'Receipt Date: 01.06.2024';
            const result = parseReceiptText(text);
            expect(result.date).toBe('2024-06-01');
        });

        it('should extract date with dashes DD-MM-YYYY', () => {
            const text = 'Date: 15-03-2024';
            const result = parseReceiptText(text);
            expect(result.date).toBe('2024-03-15');
        });

        it('should handle two-digit year', () => {
            const text = 'Date: 1/6/24';
            const result = parseReceiptText(text);
            expect(result.date).toBe('2024-06-01');
        });

        it('should pad single digit day/month', () => {
            const text = 'Date: 5/3/2024';
            const result = parseReceiptText(text);
            expect(result.date).toBe('2024-03-05');
        });

        it('should return undefined for text without dates', () => {
            const text = 'No date here, just text';
            const result = parseReceiptText(text);
            expect(result.date).toBeUndefined();
        });
    });

    describe('merchant extraction', () => {
        it('should extract merchant from first non-empty line', () => {
            const text = `ACME STORE
123 Main Street
Total: $50.00`;
            const result = parseReceiptText(text);
            expect(result.title).toBe('ACME STORE');
        });

        it('should skip lines with common receipt keywords', () => {
            const text = `RECEIPT
INVOICE
MY SHOP
Total: 10.00`;
            const result = parseReceiptText(text);
            expect(result.title).toBe('MY SHOP');
        });

        it('should handle lines with only whitespace', () => {
            const text = `
   
STORE NAME
Address`;
            const result = parseReceiptText(text);
            expect(result.title).toBe('STORE NAME');
        });

        it('should return undefined for empty text', () => {
            const result = parseReceiptText('');
            expect(result.title).toBeUndefined();
        });

        it('should skip very long lines', () => {
            const longLine = 'A'.repeat(100);
            const text = `${longLine}
SHORT SHOP
Address`;
            const result = parseReceiptText(text);
            expect(result.title).toBe('SHORT SHOP');
        });

        it('should skip lines containing VAT/TAX', () => {
            const text = `VAT: 10%
TAX ID: 12345
COFFEE SHOP
Total: 5.00`;
            const result = parseReceiptText(text);
            expect(result.title).toBe('COFFEE SHOP');
        });
    });

    describe('rawText preservation', () => {
        it('should preserve the original text in rawText', () => {
            const text = 'Original Receipt Text\nTotal: 10.00';
            const result = parseReceiptText(text);
            expect(result.rawText).toBe(text);
        });

        it('should handle empty text', () => {
            const result = parseReceiptText('');
            expect(result.rawText).toBe('');
        });
    });

    describe('complex receipts', () => {
        it('should parse a complete receipt correctly', () => {
            const text = `SUPERMARKET ABC
Shopping Street
City, State

Milk 3.99
Bread 2.50
Eggs 4.99

Subtotal: 11.48
Tax: 0.92
Total: 12.40

Thank you for shopping!`;

            const result = parseReceiptText(text);
            expect(result.title).toBe('SUPERMARKET ABC');
            // Parser picks largest amount
            expect(result.amount).toBe(1240);
        });

        it('should handle simple receipt format', () => {
            const text = `EDEKA Markt
Hauptstr):

Summe: 15,99`;

            const result = parseReceiptText(text);
            expect(result.title).toBe('EDEKA Markt');
            expect(result.amount).toBe(1599);
        });
    });
});
