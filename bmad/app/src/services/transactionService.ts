import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import type { Recurrence, TransactionInput } from './models';
import { STORAGE_KEYS } from './models';

// ============================================================================
// Types
// ============================================================================

export type Transaction = {
    id: string;
    title: string;
    amount: number; // cents
    date: string; // YYYY-MM-DD
    category?: string;
    merchant?: string;
    notes?: string;
    recurrence?: Recurrence | null;
    generatedFrom?: string | null;
    generatedAt?: string | null;
    createdAt?: string;
};

// ============================================================================
// Helpers
// ============================================================================

/**
 * Generate a unique ID, falling back to a time-based ID if crypto is unavailable
 */
function generateId(): string {
    try {
        return uuidv4();
    } catch {
        return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
    }
}

/**
 * Map raw storage/DB row to Transaction object
 */
function mapRowToTransaction(row: Record<string, any>): Transaction {
    return {
        id: row.id,
        title: row.title,
        amount: row.amount,
        date: row.date,
        category: row.category || undefined,
        merchant: row.merchant || undefined,
        notes: row.notes || undefined,
        recurrence: row.recurrence
            ? (typeof row.recurrence === 'string' ? JSON.parse(row.recurrence) : row.recurrence)
            : null,
        generatedFrom: row.generatedFrom || row.generated_from || null,
        generatedAt: row.generatedAt || row.generated_at || null,
        createdAt: row.createdAt || row.created_at,
    };
}

// ============================================================================
// Repository Implementations
// ============================================================================

/**
 * AsyncStorage-based repository for transactions.
 * Used as fallback when SQLite is not available.
 */
class AsyncStorageRepo {
    private readonly storageKey = STORAGE_KEYS.TRANSACTIONS;

    async list(): Promise<Transaction[]> {
        const raw = await AsyncStorage.getItem(this.storageKey);
        if (!raw) return [];
        try {
            const parsed = JSON.parse(raw) as Record<string, any>[];
            return parsed.map(mapRowToTransaction);
        } catch {
            return [];
        }
    }

    async get(id: string): Promise<Transaction | undefined> {
        const all = await this.list();
        return all.find((t) => t.id === id);
    }

    async create(input: Omit<Transaction, 'id'>): Promise<Transaction> {
        const tx: Transaction = {
            ...input,
            id: generateId(),
            createdAt: new Date().toISOString(),
        };
        const all = await this.list();
        all.unshift(tx);
        await AsyncStorage.setItem(this.storageKey, JSON.stringify(all));
        return tx;
    }

    async update(id: string, patch: Partial<Omit<Transaction, 'id'>>): Promise<Transaction> {
        const all = await this.list();
        const idx = all.findIndex((t) => t.id === id);
        if (idx === -1) throw new Error('Transaction not found');
        const updated = { ...all[idx], ...patch };
        all[idx] = updated;
        await AsyncStorage.setItem(this.storageKey, JSON.stringify(all));
        return updated;
    }

    async delete(id: string): Promise<void> {
        const all = await this.list();
        const filtered = all.filter((t) => t.id !== id);
        await AsyncStorage.setItem(this.storageKey, JSON.stringify(filtered));
    }
}

/**
 * SQLite-based repository for transactions.
 * Provides better performance for large datasets.
 */
class SQLiteRepo {
    private readonly db: any;

    constructor(SQLiteModule: any) {
        this.db = SQLiteModule.openDatabase('transactions.db');
    }

    private execSqlAsync(sql: string, params: any[] = []): Promise<any> {
        return new Promise((resolve, reject) => {
            this.db.transaction(
                (tx: any) => {
                    tx.executeSql(
                        sql,
                        params,
                        (_t: any, result: any) => resolve(result),
                        (_t: any, err: any) => {
                            reject(err);
                            return false;
                        }
                    );
                },
                (err: any) => reject(err)
            );
        });
    }

    async init(): Promise<void> {
        // Create table if not exists
        const createSql = `CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            title TEXT,
            amount INTEGER NOT NULL,
            date TEXT NOT NULL,
            category TEXT,
            merchant TEXT,
            notes TEXT,
            recurrence TEXT,
            generated_from TEXT,
            generated_at TEXT,
            created_at TEXT NOT NULL
        )`;
        await this.execSqlAsync(createSql);

        // Safe migrations: add columns if missing (for older DBs)
        const migrations = [
            'ALTER TABLE transactions ADD COLUMN generated_from TEXT',
            'ALTER TABLE transactions ADD COLUMN generated_at TEXT',
        ];
        for (const sql of migrations) {
            try {
                await this.execSqlAsync(sql);
            } catch {
                // Column already exists, ignore
            }
        }
    }

    async list(): Promise<Transaction[]> {
        const res = await this.execSqlAsync('SELECT * FROM transactions ORDER BY date DESC');
        const rows: Transaction[] = [];
        for (let i = 0; i < res.rows.length; i++) {
            rows.push(mapRowToTransaction(res.rows.item(i)));
        }
        return rows;
    }

    async get(id: string): Promise<Transaction | undefined> {
        const res = await this.execSqlAsync('SELECT * FROM transactions WHERE id = ?', [id]);
        if (res.rows.length === 0) return undefined;
        return mapRowToTransaction(res.rows.item(0));
    }

    async create(input: Omit<Transaction, 'id'>): Promise<Transaction> {
        const id = generateId();
        const createdAt = new Date().toISOString();
        const recurrence = input.recurrence ? JSON.stringify(input.recurrence) : null;
        const generatedFrom = (input as any).generatedFrom || null;
        const generatedAt = (input as any).generatedAt || null;

        await this.execSqlAsync(
            `INSERT INTO transactions 
             (id, title, amount, date, category, merchant, notes, recurrence, generated_from, generated_at, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                input.title,
                input.amount,
                input.date,
                input.category || null,
                input.merchant || null,
                input.notes || null,
                recurrence,
                generatedFrom,
                generatedAt,
                createdAt,
            ]
        );
        return { ...input, id, createdAt } as Transaction;
    }

    async update(id: string, patch: Partial<Omit<Transaction, 'id'>>): Promise<Transaction> {
        const current = await this.get(id);
        if (!current) throw new Error('Transaction not found');

        const merged = { ...current, ...patch } as Transaction;
        const recurrence = merged.recurrence ? JSON.stringify(merged.recurrence) : null;

        await this.execSqlAsync(
            `UPDATE transactions 
             SET title = ?, amount = ?, date = ?, category = ?, merchant = ?, notes = ?, recurrence = ?, created_at = ? 
             WHERE id = ?`,
            [
                merged.title,
                merged.amount,
                merged.date,
                merged.category || null,
                merged.merchant || null,
                merged.notes || null,
                recurrence,
                merged.createdAt || new Date().toISOString(),
                id,
            ]
        );
        return merged;
    }

    async delete(id: string): Promise<void> {
        await this.execSqlAsync('DELETE FROM transactions WHERE id = ?', [id]);
    }
}

export class TransactionService {
    private static instance: TransactionService | null = null;
    private repo: any;

    static async getInstanceAsync(): Promise<TransactionService> {
        if (!this.instance) {
            const svc = new TransactionService();
            await svc.init();
            this.instance = svc;
        }
        return this.instance;
    }

    static getInstance(): TransactionService {
        if (!this.instance) {
            // lazy non-async creation: will initialize repo on first call
            this.instance = new TransactionService();
            // fire-and-forget init
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            this.instance.init();
        }
        return this.instance;
    }

    private constructor() {
        this.repo = null;
    }

    private async init() {
        if (this.repo) return;
        let SQLite: any = null;
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            SQLite = require('expo-sqlite');
        } catch (e) {
            SQLite = null;
        }

        if (SQLite && SQLite.openDatabase) {
            const repo = new SQLiteRepo(SQLite);
            await repo.init();
            this.repo = repo;
            return;
        }
        // fallback to AsyncStorage repo
        this.repo = new AsyncStorageRepo();
    }

    async list(): Promise<Transaction[]> {
        if (!this.repo) await this.init();
        return this.repo.list();
    }

    async get(id: string): Promise<Transaction | undefined> {
        if (!this.repo) await this.init();
        return this.repo.get(id);
    }

    async create(input: Omit<Transaction, 'id'>): Promise<Transaction> {
        if (!this.repo) await this.init();
        return this.repo.create(input);
    }

    async update(id: string, patch: Partial<Omit<Transaction, 'id'>>): Promise<Transaction> {
        if (!this.repo) await this.init();
        return this.repo.update(id, patch);
    }

    async delete(id: string): Promise<void> {
        if (!this.repo) await this.init();
        return this.repo.delete(id);
    }
}

export default TransactionService;
