import { Transaction } from './models';
import { runMigrations } from './db/helpers';

let Database: any;
try {
    // try to load better-sqlite3 if available
    // @ts-ignore
    Database = require('better-sqlite3');
} catch (e) {
    Database = null;
}

export class SQLiteTransactionRepo {
    private db: any | null = null;

    constructor(dbPath?: string) {
        if (!Database) return;
        const path = dbPath || 'app/data/transactions.db';
        // ensure migrations/schema
        try {
            runMigrations(path);
        } catch (e) {
            // ignore migration errors here
        }
        this.db = new Database(path);
        this.init();
    }

    private init() {
        if (!this.db) return;
        this.db.exec(`CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      amount_cents INTEGER NOT NULL,
      date TEXT NOT NULL,
            category TEXT,
            merchant TEXT,
            notes TEXT,
            recurrence TEXT,
            created_at TEXT NOT NULL
    )`);
        this.insertStmt = this.db.prepare(`INSERT INTO transactions (id, amount_cents, date, category, merchant, notes, recurrence, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
        this.getStmt = this.db.prepare('SELECT * FROM transactions WHERE id = ?');
        this.updateStmt = this.db.prepare('UPDATE transactions SET amount_cents = ?, date = ?, category = ?, merchant = ?, notes = ?, recurrence = ?, created_at = ? WHERE id = ?');
        this.deleteStmt = this.db.prepare('DELETE FROM transactions WHERE id = ?');
        this.listStmt = this.db.prepare('SELECT * FROM transactions ORDER BY date DESC');
    }

    private insertStmt: any;
    private getStmt: any;
    private updateStmt: any;
    private deleteStmt: any;
    private listStmt: any;

    async create(tx: Transaction): Promise<void> {
        if (!this.db) throw new Error('SQLite not available');
        const rec = tx.recurrence ? JSON.stringify(tx.recurrence) : null;
        this.insertStmt.run(tx.id, tx.amountCents, tx.date, tx.category || null, tx.merchant || null, tx.notes || null, rec, tx.createdAt);
    }

    async get(id: string): Promise<Transaction | null> {
        if (!this.db) return null;
        const row = this.getStmt.get(id);
        if (!row) return null;
        return {
            id: row.id,
            amountCents: row.amount_cents,
            date: row.date,
            category: row.category,
            merchant: row.merchant,
            notes: row.notes,
            recurrence: row.recurrence ? JSON.parse(row.recurrence) : null,
            createdAt: row.created_at
        } as Transaction;
    }

    async update(id: string, patch: Partial<Transaction>): Promise<void> {
        if (!this.db) throw new Error('SQLite not available');
        const cur = await this.get(id);
        if (!cur) throw new Error('not found');
        const merged = { ...cur, ...patch } as Transaction;
        const rec = merged.recurrence ? JSON.stringify(merged.recurrence) : null;
        this.updateStmt.run(merged.amountCents, merged.date, merged.category || null, merged.merchant || null, merged.notes || null, rec, merged.createdAt, id);
    }

    async delete(id: string): Promise<void> {
        if (!this.db) throw new Error('SQLite not available');
        this.deleteStmt.run(id);
    }

    async list(): Promise<Transaction[]> {
        if (!this.db) return [];
        const rows = this.listStmt.all();
        return rows.map((r: any) => ({
            id: r.id,
            amountCents: r.amount_cents,
            date: r.date,
            category: r.category,
            merchant: r.merchant,
            notes: r.notes,
            recurrence: r.recurrence ? JSON.parse(r.recurrence) : null,
            createdAt: r.created_at
        } as Transaction));
    }

    // helper for tests: clear table
    clear() {
        if (!this.db) return;
        this.db.exec('DELETE FROM transactions');
    }
}
