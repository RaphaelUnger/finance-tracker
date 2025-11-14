import { Transaction } from './models';

export function parseAndNormalizeDate(input?: string): string {
    // Accept ISO or common date strings and return an ISO date (YYYY-MM-DD)
    if (!input) return new Date().toISOString().slice(0, 10);
    const d = new Date(input);
    if (isNaN(d.getTime())) throw new Error('invalid date');
    // normalize to date-only ISO (YYYY-MM-DD)
    return d.toISOString().slice(0, 10);
}

export function validateTransactionInput(input: Partial<Transaction>): string | null {
    if (!input) return 'missing input';
    if (!input.id) return 'missing id';
    if (typeof input.amountCents !== 'number' || !Number.isFinite(input.amountCents)) return 'invalid amountCents';
    if (input.amountCents < 0) return 'amountCents must be >= 0';
    if (!input.date) return 'missing date';
    // validate date
    try {
        parseAndNormalizeDate(input.date);
    } catch (e: any) {
        return 'invalid date';
    }
    return null;
}

export class TransactionService {
    private repo: any;
    constructor(repo: any) {
        this.repo = repo;
    }

    async create(input: Partial<Transaction>): Promise<Transaction> {
        const err = validateTransactionInput(input);
        if (err) throw new Error(err);
        const tx: Transaction = {
            id: input.id!,
            amountCents: input.amountCents!,
            date: parseAndNormalizeDate(input.date),
            category: input.category || '',
            merchant: input.merchant || '',
            notes: input.notes || '',
            createdAt: input.createdAt || new Date().toISOString(),
            recurrence: input.recurrence || null
        } as Transaction;
        await this.repo.create(tx);
        return tx;
    }

    async update(id: string, patch: Partial<Transaction>): Promise<Transaction> {
        if (patch.date) patch.date = parseAndNormalizeDate(patch.date);
        await this.repo.update(id, patch);
        const updated = await this.repo.get(id);
        if (!updated) throw new Error('not found after update');
        return updated;
    }

    async delete(id: string): Promise<void> {
        await this.repo.delete(id);
    }

    async list(): Promise<Transaction[]> {
        return this.repo.list();
    }
}
