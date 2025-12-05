import type { Frequency, Recurrence, Transaction } from '../src/services/models';

describe('models type definitions', () => {
    describe('Frequency type', () => {
        it('should accept valid frequency values', () => {
            const daily: Frequency = 'daily';
            const weekly: Frequency = 'weekly';
            const monthly: Frequency = 'monthly';
            const yearly: Frequency = 'yearly';

            expect(daily).toBe('daily');
            expect(weekly).toBe('weekly');
            expect(monthly).toBe('monthly');
            expect(yearly).toBe('yearly');
        });
    });

    describe('Recurrence interface', () => {
        it('should create minimal recurrence', () => {
            const rec: Recurrence = { frequency: 'monthly' };
            expect(rec.frequency).toBe('monthly');
            expect(rec.interval).toBeUndefined();
        });

        it('should create recurrence with all fields', () => {
            const rec: Recurrence = {
                frequency: 'weekly',
                interval: 2,
                nextRun: '2024-01-15',
                endDate: '2024-12-31'
            };

            expect(rec.frequency).toBe('weekly');
            expect(rec.interval).toBe(2);
            expect(rec.nextRun).toBe('2024-01-15');
            expect(rec.endDate).toBe('2024-12-31');
        });

        it('should allow null endDate', () => {
            const rec: Recurrence = {
                frequency: 'daily',
                endDate: null
            };

            expect(rec.endDate).toBeNull();
        });
    });

    describe('Transaction interface', () => {
        it('should create transaction with required fields', () => {
            const tx: Transaction = {
                id: 'tx-123',
                amountCents: 1500,
                date: '2024-06-15',
                createdAt: '2024-06-15T10:00:00Z'
            };

            expect(tx.id).toBe('tx-123');
            expect(tx.amountCents).toBe(1500);
            expect(tx.date).toBe('2024-06-15');
        });

        it('should create transaction with all optional fields', () => {
            const tx: Transaction = {
                id: 'tx-456',
                amountCents: 5000,
                date: '2024-07-20',
                category: 'Food',
                merchant: 'Restaurant',
                notes: 'Dinner with friends',
                createdAt: '2024-07-20T18:30:00Z',
                recurrence: {
                    frequency: 'monthly',
                    interval: 1
                }
            };

            expect(tx.category).toBe('Food');
            expect(tx.merchant).toBe('Restaurant');
            expect(tx.notes).toBe('Dinner with friends');
            expect(tx.recurrence?.frequency).toBe('monthly');
        });

        it('should allow null recurrence', () => {
            const tx: Transaction = {
                id: 'tx-789',
                amountCents: 2000,
                date: '2024-08-01',
                createdAt: '2024-08-01T00:00:00Z',
                recurrence: null
            };

            expect(tx.recurrence).toBeNull();
        });
    });
});
