let Database: any;
try {
    // @ts-ignore
    Database = require('better-sqlite3');
} catch (e) {
    Database = null;
}

export function runMigrations(dbPath?: string) {
    if (!Database) throw new Error('better-sqlite3 not available');
    const dbFile = dbPath || 'app/data/transactions.db';
    const db = new Database(dbFile);

    // ensure migrations table
    db.exec(`CREATE TABLE IF NOT EXISTS migrations (id TEXT PRIMARY KEY, applied_at TEXT);`);

    const appliedStmt = db.prepare('SELECT id FROM migrations WHERE id = ?');
    const insertMig = db.prepare('INSERT INTO migrations (id, applied_at) VALUES (?, ?)');

    const migId = '001-create-transactions';
    if (!appliedStmt.get(migId)) {
        db.exec(`CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      amount_cents INTEGER NOT NULL,
      date TEXT NOT NULL,
      category TEXT,
      merchant TEXT,
      notes TEXT,
      recurrence TEXT,
      created_at TEXT NOT NULL
    );`);
        insertMig.run(migId, new Date().toISOString());
    }

    // Migration 002: add recurrence column if not present
    const migId2 = '002-add-recurrence';
    if (!appliedStmt.get(migId2)) {
        try {
            // Add recurrence column if it doesn't exist. SQLite allows ALTER TABLE ADD COLUMN.
            db.exec(`ALTER TABLE transactions ADD COLUMN recurrence TEXT;`);
        } catch (e) {
            // If column already exists or alter fails, ignore — we'll still mark migration applied
        }
        insertMig.run(migId2, new Date().toISOString());
    }
}
