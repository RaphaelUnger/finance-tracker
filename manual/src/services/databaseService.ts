import SQLite from 'react-native-sqlite-storage';
import { Platform } from 'react-native';

SQLite.DEBUG(false);
SQLite.enablePromise(true);

export class DatabaseService {
  private database: SQLite.SQLiteDatabase | null = null;
  private static instance: DatabaseService;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async initialize(): Promise<void> {
    try {
      const dbName = 'finance_tracker.db';
      const dbVersion = '1.0';
      const dbDisplayName = 'Finance Tracker Database';
      const dbSize = 200000;

      this.database = await SQLite.openDatabase(
        dbName,
        dbVersion,
        dbDisplayName,
        dbSize
      );

      await this.createTables();
      await this.insertDefaultCategories();

      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  public async close(): Promise<void> {
    if (this.database) {
      await this.database.close();
      this.database = null;
    }
  }

  public getDatabase(): SQLite.SQLiteDatabase {
    if (!this.database) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.database;
  }

  private async createTables(): Promise<void> {
    const db = this.getDatabase();

    // Categories table
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT NOT NULL,
        color TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'both')),
        is_custom INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      );
    `);

    // Transactions table
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        amount REAL NOT NULL,
        description TEXT NOT NULL,
        date INTEGER NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
        category_id TEXT NOT NULL,
        notes TEXT,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        deleted_at INTEGER NULL,
        FOREIGN KEY (category_id) REFERENCES categories (id)
      );
    `);

    // Create indexes for better performance
    await db.executeSql(`
      CREATE INDEX IF NOT EXISTS idx_transactions_date 
      ON transactions(date);
    `);

    await db.executeSql(`
      CREATE INDEX IF NOT EXISTS idx_transactions_category 
      ON transactions(category_id);
    `);

    await db.executeSql(`
      CREATE INDEX IF NOT EXISTS idx_transactions_type 
      ON transactions(type);
    `);

    console.log('Database tables created successfully');
  }

  private async insertDefaultCategories(): Promise<void> {
    const db = this.getDatabase();

    // Check if categories already exist
    const [result] = await db.executeSql(
      'SELECT COUNT(*) as count FROM categories WHERE is_custom = 0'
    );

    if (result.rows.item(0).count > 0) {
      return; // Default categories already exist
    }

    const defaultCategories = [
      // Expense categories
      { id: 'cat_food', name: 'Lebensmittel', icon: '🍔', color: '#FF9800', type: 'expense' },
      { id: 'cat_transport', name: 'Transport', icon: '🚗', color: '#2196F3', type: 'expense' },
      { id: 'cat_housing', name: 'Wohnen', icon: '🏠', color: '#4CAF50', type: 'expense' },
      { id: 'cat_entertainment', name: 'Unterhaltung', icon: '🎬', color: '#E91E63', type: 'expense' },
      { id: 'cat_health', name: 'Gesundheit', icon: '🏥', color: '#F44336', type: 'expense' },
      { id: 'cat_clothing', name: 'Kleidung', icon: '👔', color: '#9C27B0', type: 'expense' },
      { id: 'cat_education', name: 'Bildung', icon: '📚', color: '#3F51B5', type: 'expense' },
      { id: 'cat_utilities', name: 'Nebenkosten', icon: '💡', color: '#FF5722', type: 'expense' },
      { id: 'cat_insurance', name: 'Versicherungen', icon: '🛡️', color: '#607D8B', type: 'expense' },
      { id: 'cat_other_expense', name: 'Sonstiges', icon: '📦', color: '#795548', type: 'expense' },

      // Income categories
      { id: 'cat_salary', name: 'Gehalt', icon: '💼', color: '#4CAF50', type: 'income' },
      { id: 'cat_freelance', name: 'Freelancing', icon: '💻', color: '#2196F3', type: 'income' },
      { id: 'cat_investment', name: 'Investments', icon: '📈', color: '#FF9800', type: 'income' },
      { id: 'cat_gift', name: 'Geschenke', icon: '🎁', color: '#E91E63', type: 'income' },
      { id: 'cat_bonus', name: 'Bonus', icon: '🎯', color: '#9C27B0', type: 'income' },
      { id: 'cat_other_income', name: 'Sonstiges', icon: '💰', color: '#795548', type: 'income' },
    ];

    for (const category of defaultCategories) {
      await db.executeSql(
        `INSERT INTO categories (id, name, icon, color, type, is_custom) 
         VALUES (?, ?, ?, ?, ?, 0)`,
        [category.id, category.name, category.icon, category.color, category.type]
      );
    }

    console.log('Default categories inserted successfully');
  }

  public async executeQuery(
    query: string,
    params: any[] = []
  ): Promise<SQLite.ResultSet[]> {
    const db = this.getDatabase();
    return await db.executeSql(query, params);
  }

  public async transaction(
    fn: (tx: SQLite.Transaction) => Promise<void>
  ): Promise<void> {
    const db = this.getDatabase();
    return new Promise((resolve, reject) => {
      db.transaction(
        async (tx) => {
          try {
            await fn(tx);
            resolve();
          } catch (error) {
            reject(error);
          }
        },
        reject,
        resolve
      );
    });
  }
}

export const databaseService = DatabaseService.getInstance();
