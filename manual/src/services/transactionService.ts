import { transactionRepository } from './transactionRepository';
import { categoryRepository } from './categoryRepository';
import {
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionFilters,
  TransactionSortOptions,
  Category
} from '../types/transaction';
import { validateAmount, validateDescription } from '../utils/helpers';

export interface TransactionService {
  createTransaction(input: CreateTransactionInput): Promise<Transaction>;
  getTransaction(id: string): Promise<Transaction | null>;
  getTransactions(
    filters?: TransactionFilters,
    sortOptions?: TransactionSortOptions,
    page?: number,
    pageSize?: number
  ): Promise<{
    transactions: Transaction[];
    totalCount: number;
    hasMore: boolean;
  }>;
  updateTransaction(input: UpdateTransactionInput): Promise<Transaction>;
  deleteTransaction(id: string): Promise<void>;
  getBalance(filters?: Omit<TransactionFilters, 'type'>): Promise<{
    income: number;
    expense: number;
    balance: number;
  }>;
  getCategories(type?: 'income' | 'expense'): Promise<Category[]>;
}

class TransactionServiceImpl implements TransactionService {
  private static instance: TransactionServiceImpl;

  private constructor() {}

  public static getInstance(): TransactionServiceImpl {
    if (!TransactionServiceImpl.instance) {
      TransactionServiceImpl.instance = new TransactionServiceImpl();
    }
    return TransactionServiceImpl.instance;
  }

  public async createTransaction(input: CreateTransactionInput): Promise<Transaction> {
    // Validate input
    const amountValidation = validateAmount(input.amount.toString());
    if (!amountValidation.isValid) {
      throw new Error(amountValidation.error);
    }

    const descriptionValidation = validateDescription(input.description);
    if (!descriptionValidation.isValid) {
      throw new Error(descriptionValidation.error);
    }

    // Verify category exists
    const category = await categoryRepository.findById(input.categoryId);
    if (!category) {
      throw new Error('Kategorie nicht gefunden');
    }

    // Verify category type matches transaction type
    if (category.type !== 'both' && category.type !== input.type) {
      throw new Error('Kategorie-Typ stimmt nicht mit Transaktions-Typ überein');
    }

    // Create transaction with validated amount
    const validatedInput: CreateTransactionInput = {
      ...input,
      amount: amountValidation.value!,
      description: input.description.trim(),
    };

    return await transactionRepository.create(validatedInput);
  }

  public async getTransaction(id: string): Promise<Transaction | null> {
    return await transactionRepository.findById(id);
  }

  public async getTransactions(
    filters?: TransactionFilters,
    sortOptions?: TransactionSortOptions,
    page = 1,
    pageSize = 50
  ): Promise<{
    transactions: Transaction[];
    totalCount: number;
    hasMore: boolean;
  }> {
    const offset = (page - 1) * pageSize;

    const [transactions, totalCount] = await Promise.all([
      transactionRepository.findAll(filters, sortOptions, pageSize, offset),
      transactionRepository.count(filters),
    ]);

    const hasMore = offset + transactions.length < totalCount;

    return {
      transactions,
      totalCount,
      hasMore,
    };
  }

  public async updateTransaction(input: UpdateTransactionInput): Promise<Transaction> {
    // Validate input if provided
    if (input.amount !== undefined) {
      const amountValidation = validateAmount(input.amount.toString());
      if (!amountValidation.isValid) {
        throw new Error(amountValidation.error);
      }
      input.amount = amountValidation.value;
    }

    if (input.description !== undefined) {
      const descriptionValidation = validateDescription(input.description);
      if (!descriptionValidation.isValid) {
        throw new Error(descriptionValidation.error);
      }
      input.description = input.description.trim();
    }

    // Verify category exists if provided
    if (input.categoryId) {
      const category = await categoryRepository.findById(input.categoryId);
      if (!category) {
        throw new Error('Kategorie nicht gefunden');
      }

      // If type is also being updated, verify compatibility
      if (input.type) {
        if (category.type !== 'both' && category.type !== input.type) {
          throw new Error('Kategorie-Typ stimmt nicht mit Transaktions-Typ überein');
        }
      } else {
        // Check against existing transaction type
        const existingTransaction = await transactionRepository.findById(input.id);
        if (existingTransaction && category.type !== 'both' && category.type !== existingTransaction.type) {
          throw new Error('Kategorie-Typ stimmt nicht mit Transaktions-Typ überein');
        }
      }
    }

    return await transactionRepository.update(input);
  }

  public async deleteTransaction(id: string): Promise<void> {
    const transaction = await transactionRepository.findById(id);
    if (!transaction) {
      throw new Error('Transaktion nicht gefunden');
    }

    await transactionRepository.delete(id);
  }

  public async getBalance(filters?: Omit<TransactionFilters, 'type'>): Promise<{
    income: number;
    expense: number;
    balance: number;
  }> {
    return await transactionRepository.getBalance(filters);
  }

  public async getCategories(type?: 'income' | 'expense'): Promise<Category[]> {
    return await categoryRepository.findAll(type);
  }

  // Additional utility methods

  public async getRecentTransactions(limit = 10): Promise<Transaction[]> {
    return await transactionRepository.findAll(
      undefined,
      { field: 'date', direction: 'desc' },
      limit
    );
  }

  public async getTransactionsByDateRange(
    startDate: number,
    endDate: number,
    type?: 'income' | 'expense'
  ): Promise<Transaction[]> {
    const filters: TransactionFilters = {
      startDate,
      endDate,
      ...(type && { type }),
    };

    const result = await this.getTransactions(filters, { field: 'date', direction: 'desc' });
    return result.transactions;
  }

  public async getTransactionsByCategory(categoryId: string): Promise<Transaction[]> {
    const filters: TransactionFilters = { categoryId };
    const result = await this.getTransactions(filters, { field: 'date', direction: 'desc' });
    return result.transactions;
  }

  public async searchTransactions(query: string): Promise<Transaction[]> {
    if (!query.trim()) {
      return [];
    }

    const filters: TransactionFilters = { search: query.trim() };
    const result = await this.getTransactions(filters, { field: 'date', direction: 'desc' });
    return result.transactions;
  }

  // Statistics methods

  public async getMonthlyStats(year: number, month: number): Promise<{
    income: number;
    expense: number;
    balance: number;
    transactionCount: number;
    avgTransactionAmount: number;
  }> {
    const startDate = Math.floor(new Date(year, month - 1, 1).getTime() / 1000);
    const endDate = Math.floor(new Date(year, month, 0, 23, 59, 59, 999).getTime() / 1000);

    const filters = { startDate, endDate };

    const [balance, transactionCount, transactions] = await Promise.all([
      this.getBalance(filters),
      transactionRepository.count(filters),
      this.getTransactionsByDateRange(startDate, endDate),
    ]);

    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const avgTransactionAmount = transactionCount > 0 ? totalAmount / transactionCount : 0;

    return {
      ...balance,
      transactionCount,
      avgTransactionAmount,
    };
  }

  public async getCategoryStats(
    startDate?: number,
    endDate?: number
  ): Promise<Array<{
    category: Category;
    totalAmount: number;
    transactionCount: number;
    percentage: number;
  }>> {
    const filters: TransactionFilters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const [transactions, categories] = await Promise.all([
      transactionRepository.findAll(filters),
      categoryRepository.findAll(),
    ]);

    const categoryMap = new Map<string, Category>();
    categories.forEach(cat => categoryMap.set(cat.id, cat));

    const categoryStats = new Map<string, { amount: number; count: number }>();
    let totalAmount = 0;

    transactions.forEach(transaction => {
      const existing = categoryStats.get(transaction.categoryId) || { amount: 0, count: 0 };
      existing.amount += transaction.amount;
      existing.count += 1;
      categoryStats.set(transaction.categoryId, existing);
      totalAmount += transaction.amount;
    });

    const result: Array<{
      category: Category;
      totalAmount: number;
      transactionCount: number;
      percentage: number;
    }> = [];

    categoryStats.forEach((stats, categoryId) => {
      const category = categoryMap.get(categoryId);
      if (category) {
        result.push({
          category,
          totalAmount: stats.amount,
          transactionCount: stats.count,
          percentage: totalAmount > 0 ? (stats.amount / totalAmount) * 100 : 0,
        });
      }
    });

    return result.sort((a, b) => b.totalAmount - a.totalAmount);
  }
}

export const transactionService = TransactionServiceImpl.getInstance();
