import { Transaction } from './models';

export type ListFilter = {
    from?: string; // ISO
    to?: string; // ISO
    category?: string;
};

export class InMemoryTransactionRepo {
    private items: Map<string, Transaction> = new Map();

    async create(tx: Transaction): Promise<void> {
        if (this.items.has(tx.id)) throw new Error('duplicate id');
        this.items.set(tx.id, tx);
    }

    async get(id: string): Promise<Transaction | null> {
        return this.items.get(id) ?? null;
    }

    async update(id: string, patch: Partial<Transaction>): Promise<void> {
        const cur = this.items.get(id);
        if (!cur) throw new Error('not found');
        this.items.set(id, { ...cur, ...patch });
    }

    async delete(id: string): Promise<void> {
        this.items.delete(id);
    }

    async list(filter?: ListFilter): Promise<Transaction[]> {
        let result = Array.from(this.items.values());
        if (filter) {
            const from = filter.from;
            const to = filter.to;
            if (from) {
                result = result.filter(r => r.date >= from);
            }
            if (to) {
                result = result.filter(r => r.date <= to);
            }
            if (filter.category) {
                result = result.filter(r => (r.category || '') === filter.category);
            }
        }
        // sort by date desc
        result.sort((a, b) => (a.date < b.date ? 1 : -1));
        return result;
    }

    // test helpers
    async clear(): Promise<void> {
        this.items.clear();
    }

    async seed(list: Transaction[]): Promise<void> {
        for (const t of list) this.items.set(t.id, t);
    }
}
