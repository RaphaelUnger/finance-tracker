let fs: any;
let path: any;
import { Transaction } from './models';

// lazy-load node modules in environments where they're available
try {
    // @ts-ignore
    fs = require('fs');
    // @ts-ignore
    path = require('path');
} catch (e) {
    fs = null;
    path = null;
}

export class FileTransactionRepo {
    private filePath: string;
    private data: Record<string, Transaction> = {};

    constructor(filePath?: string) {
        this.filePath = filePath || (path ? path.join(process.cwd(), 'app', 'data', 'transactions.json') : 'app/data/transactions.json');
        this.load();
    }

    private load() {
        try {
            const dir = path.dirname(this.filePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            if (!fs.existsSync(this.filePath)) {
                this.save();
            } else {
                const raw = fs.readFileSync(this.filePath, 'utf8');
                this.data = raw ? JSON.parse(raw) : {};
            }
        } catch (e) {
            // init empty on error
            this.data = {};
            this.save();
        }
    }

    private save() {
        fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf8');
    }

    async create(tx: Transaction): Promise<void> {
        if (this.data[tx.id]) throw new Error('duplicate id');
        this.data[tx.id] = tx;
        this.save();
    }

    async get(id: string): Promise<Transaction | null> {
        return this.data[id] ?? null;
    }

    async update(id: string, patch: Partial<Transaction>): Promise<void> {
        const cur = this.data[id];
        if (!cur) throw new Error('not found');
        this.data[id] = { ...cur, ...patch } as Transaction;
        this.save();
    }

    async delete(id: string): Promise<void> {
        delete this.data[id];
        this.save();
    }

    async list(): Promise<Transaction[]> {
        const arr = Object.values(this.data);
        arr.sort((a, b) => (a.date < b.date ? 1 : -1));
        return arr;
    }

    // helper for tests
    clearStore() {
        this.data = {};
        this.save();
    }
}
