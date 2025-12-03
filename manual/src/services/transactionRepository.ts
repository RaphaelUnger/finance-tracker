import { databaseService } from './databaseService';
import {
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionFilters,
  TransactionSortOptions
} from '../types/transaction';
import { generateId } from '../utils/helpers';

export class TransactionRepository {
  private static instance: TransactionRepository;

  private constructor() {}

  public static getInstance(): TransactionRepository {
    if (!TransactionRepository.instance) {
      TransactionRepository.instance = new TransactionRepository();
    }
    return TransactionRepository.instance;
  }

  public async create(input: CreateTransactionInput): Promise<Transaction> {
    const now = Math.floor(Date.now() / 1000);
    const transaction: Transaction = {
      id: generateId(),
      amount: input.amount,
      description: input.description,
      date: input.date,
      type: input.type,
      categoryId: input.categoryId,
      notes: input.notes || null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    await databaseService.executeQuery(
      `INSERT INTO transactions 
       (id, amount, description, date, type, category_id, notes, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transaction.id,
        transaction.amount,
        transaction.description,
        transaction.date,
        transaction.type,
        transaction.categoryId,
        transaction.notes,
        transaction.createdAt,
        transaction.updatedAt,
      ]
    );

    return transaction;
  }

  public async findById(id: string): Promise<Transaction | null> {
    const [result] = await databaseService.executeQuery(
      'SELECT * FROM transactions WHERE id = ? AND deleted_at IS NULL',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToTransaction(result.rows.item(0));
  }

  public async findAll(
    filters?: TransactionFilters,
    sortOptions?: TransactionSortOptions,
    limit?: number,
    offset?: number
  ): Promise<Transaction[]> {
    let query = `
      SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM transactions t 
      LEFT JOIN categories c ON t.category_id = c.id 
      WHERE t.deleted_at IS NULL
    `;
    const params: any[] = [];

    // Apply filters
    if (filters) {
      if (filters.type) {
        query += ' AND t.type = ?';
        params.push(filters.type);
      }

      if (filters.categoryId) {
        query += ' AND t.category_id = ?';
        params.push(filters.categoryId);
      }

      if (filters.startDate) {
        query += ' AND t.date >= ?';
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        query += ' AND t.date <= ?';
        params.push(filters.endDate);
      }

      if (filters.search) {
        query += ' AND (t.description LIKE ? OR t.notes LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm);
      }
    }

    // Apply sorting
    if (sortOptions) {
      const sortField = sortOptions.field === 'date' ? 't.date' :
                       sortOptions.field === 'amount' ? 't.amount' :
                       't.description';
      query += ` ORDER BY ${sortField} ${sortOptions.direction.toUpperCase()}`;
    } else {
      query += ' ORDER BY t.date DESC'; // Default sort by date descending
    }

    // Apply pagination
    if (limit) {
      query += ' LIMIT ?';
      params.push(limit);

      if (offset) {
        query += ' OFFSET ?';
        params.push(offset);
      }
    }

    const [result] = await databaseService.executeQuery(query, params);
    const transactions: Transaction[] = [];

    for (let i = 0; i < result.rows.length; i++) {
      transactions.push(this.mapRowToTransaction(result.rows.item(i)));
    }

    return transactions;
  }

  public async update(input: UpdateTransactionInput): Promise<Transaction> {
    const existingTransaction = await this.findById(input.id);
    if (!existingTransaction) {
      throw new Error(`Transaction with id ${input.id} not found`);
    }

    const now = Math.floor(Date.now() / 1000);
    const updatedTransaction: Transaction = {
      ...existingTransaction,
      ...input,
      updatedAt: now,
    };

    await databaseService.executeQuery(
      `UPDATE transactions SET 
       amount = ?, description = ?, date = ?, type = ?, 
       category_id = ?, notes = ?, updated_at = ?
       WHERE id = ?`,
      [
        updatedTransaction.amount,
        updatedTransaction.description,
        updatedTransaction.date,
        updatedTransaction.type,
        updatedTransaction.categoryId,
        updatedTransaction.notes,
        updatedTransaction.updatedAt,
        updatedTransaction.id,
      ]
    );

    return updatedTransaction;
  }

  public async delete(id: string): Promise<void> {
    const now = Math.floor(Date.now() / 1000);

    await databaseService.executeQuery(
      'UPDATE transactions SET deleted_at = ? WHERE id = ?',
      [now, id]
    );
  }

  public async hardDelete(id: string): Promise<void> {
    await databaseService.executeQuery(
      'DELETE FROM transactions WHERE id = ?',
      [id]
    );
  }

  public async count(filters?: TransactionFilters): Promise<number> {
    let query = 'SELECT COUNT(*) as count FROM transactions WHERE deleted_at IS NULL';
    const params: any[] = [];

    // Apply same filters as in findAll
    if (filters) {
      if (filters.type) {
        query += ' AND type = ?';
        params.push(filters.type);
      }

      if (filters.categoryId) {
        query += ' AND category_id = ?';
        params.push(filters.categoryId);
      }

      if (filters.startDate) {
        query += ' AND date >= ?';
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        query += ' AND date <= ?';
        params.push(filters.endDate);
      }

      if (filters.search) {
        query += ' AND (description LIKE ? OR notes LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm);
      }
    }

    const [result] = await databaseService.executeQuery(query, params);
    return result.rows.item(0).count;
  }

  public async getBalance(filters?: Omit<TransactionFilters, 'type'>): Promise<{
    income: number;
    expense: number;
    balance: number;
  }> {
    let incomeQuery = 'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = "income" AND deleted_at IS NULL';
    let expenseQuery = 'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = "expense" AND deleted_at IS NULL';

    const incomeParams: any[] = [];
    const expenseParams: any[] = [];

    // Apply filters to both queries
    if (filters) {
      if (filters.categoryId) {
        incomeQuery += ' AND category_id = ?';
        expenseQuery += ' AND category_id = ?';
        incomeParams.push(filters.categoryId);
        expenseParams.push(filters.categoryId);
      }

      if (filters.startDate) {
        incomeQuery += ' AND date >= ?';
        expenseQuery += ' AND date >= ?';
        incomeParams.push(filters.startDate);
        expenseParams.push(filters.startDate);
      }

      if (filters.endDate) {
        incomeQuery += ' AND date <= ?';
        expenseQuery += ' AND date <= ?';
        incomeParams.push(filters.endDate);
        expenseParams.push(filters.endDate);
      }
    }

    const [incomeResult] = await databaseService.executeQuery(incomeQuery, incomeParams);
    const [expenseResult] = await databaseService.executeQuery(expenseQuery, expenseParams);

    const income = incomeResult.rows.item(0).total;
    const expense = expenseResult.rows.item(0).total;

    return {
      income,
      expense,
      balance: income - expense,
    };
  }

  private mapRowToTransaction(row: any): Transaction {
    return {
      id: row.id,
      amount: row.amount,
      description: row.description,
      date: row.date,
      type: row.type,
      categoryId: row.category_id,
      notes: row.notes || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at || undefined,
    };
  }
}

export const transactionRepository = TransactionRepository.getInstance();
