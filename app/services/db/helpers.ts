// Minimal expo-sqlite helper examples (TypeScript)
// These are small convenience wrappers inspired by the architecture doc

import * as SQLite from 'expo-sqlite';

export type TransactionRow = {
    id: string;
    amount: number; // cents
    date: string; // ISO 8601
    category?: string;
    notes?: string;
    merchant?: string;
    created_at?: string;
    updated_at?: string;
};

export function openDatabase(name = 'app.db') {
    // Note: expo-sqlite exposes different APIs depending on SDK; check docs.
    // This example uses the sync/open style from the docs. Adjust to openDatabaseAsync if available.
    // @ts-ignore
    return SQLite.openDatabase(name);
}

export async function createTransactionsTable(db: any) {
    const sql = `
  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    amount INTEGER NOT NULL,
    date TEXT NOT NULL,
    category TEXT,
    notes TEXT,
    merchant TEXT,
    created_at TEXT,
    updated_at TEXT
  );`;
    // expo-sqlite provides execAsync/runAsync depending on SDK
    if (db.execAsync) {
        await db.execAsync(sql);
    } else if (db.transaction) {
        db.transaction((tx: any) => tx.executeSql(sql));
    }
}

export async function addTransaction(db: any, t: TransactionRow) {
    const now = new Date().toISOString();
    const stmt = 'INSERT INTO transactions (id, amount, date, category, notes, merchant, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    const params = [t.id, t.amount, t.date, t.category ?? null, t.notes ?? null, t.merchant ?? null, t.created_at ?? now, t.updated_at ?? now];
    if (db.runAsync) {
        return db.runAsync(stmt, params);
    }
    // fallback using transaction/executeSql
    return new Promise((resolve, reject) => {
        db.transaction((tx: any) => {
            tx.executeSql(stmt, params, (_: any, res: any) => resolve(res), (_: any, err: any) => reject(err));
        });
    });
}

export async function getRecentTransactions(db: any, limit = 100) {
    const q = `SELECT * FROM transactions ORDER BY date DESC LIMIT ${limit}`;
    if (db.getAllAsync) {
        return db.getAllAsync(q);
    }
    return new Promise((resolve, reject) => {
        db.transaction((tx: any) => {
            tx.executeSql(q, [], (_: any, { rows }: any) => resolve(rows._array || rows), (_: any, err: any) => reject(err));
        });
    });
}
