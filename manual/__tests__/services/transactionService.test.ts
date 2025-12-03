import { transactionService } from '../../src/services/transactionService';
import { databaseService } from '../../src/services/databaseService';
import { CreateTransactionInput, UpdateTransactionInput } from '../../src/types/transaction';

// Mock the database service
jest.mock('../../src/services/databaseService');

describe('TransactionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTransaction', () => {
    it('should create a valid transaction', async () => {
      // Arrange
      const mockInput: CreateTransactionInput = {
        amount: 25.50,
        description: 'Grocery shopping',
        type: 'expense',
        categoryId: 'cat_food',
        date: 1672531200, // 2023-01-01
        notes: 'Weekly groceries',
      };

      // Mock category repository
      const mockCategory = {
        id: 'cat_food',
        name: 'Food',
        icon: '🍔',
        color: '#FF9800',
        type: 'expense' as const,
        isCustom: false,
        createdAt: 1672531200,
        updatedAt: 1672531200,
      };

      // Mock transaction repository
      const mockTransaction = {
        id: 'transaction_123',
        amount: 25.50,
        description: 'Grocery shopping',
        type: 'expense' as const,
        categoryId: 'cat_food',
        date: 1672531200,
        notes: 'Weekly groceries',
        createdAt: 1672531200,
        updatedAt: 1672531200,
        deletedAt: undefined,
      };

      // Act
      const result = await transactionService.createTransaction(mockInput);

      // Assert
      expect(result).toEqual(mockTransaction);
      expect(result.amount).toBe(25.50);
      expect(result.description).toBe('Grocery shopping');
      expect(result.type).toBe('expense');
    });

    it('should validate amount correctly', async () => {
      // Arrange
      const mockInput: CreateTransactionInput = {
        amount: -10, // Invalid negative amount
        description: 'Invalid transaction',
        type: 'expense',
        categoryId: 'cat_food',
        date: 1672531200,
      };

      // Act & Assert
      await expect(transactionService.createTransaction(mockInput))
        .rejects
        .toThrow();
    });

    it('should validate description correctly', async () => {
      // Arrange
      const mockInput: CreateTransactionInput = {
        amount: 25.50,
        description: '', // Invalid empty description
        type: 'expense',
        categoryId: 'cat_food',
        date: 1672531200,
      };

      // Act & Assert
      await expect(transactionService.createTransaction(mockInput))
        .rejects
        .toThrow();
    });

    it('should validate category exists', async () => {
      // Arrange
      const mockInput: CreateTransactionInput = {
        amount: 25.50,
        description: 'Valid description',
        type: 'expense',
        categoryId: 'nonexistent_category', // Invalid category
        date: 1672531200,
      };

      // Act & Assert
      await expect(transactionService.createTransaction(mockInput))
        .rejects
        .toThrow('Kategorie nicht gefunden');
    });
  });

  describe('getTransactions', () => {
    it('should return paginated transactions', async () => {
      // Arrange
      const mockTransactions = [
        {
          id: 'transaction_1',
          amount: 25.50,
          description: 'Grocery shopping',
          type: 'expense' as const,
          categoryId: 'cat_food',
          date: 1672531200,
          createdAt: 1672531200,
          updatedAt: 1672531200,
        },
        {
          id: 'transaction_2',
          amount: 1500.00,
          description: 'Salary',
          type: 'income' as const,
          categoryId: 'cat_salary',
          date: 1672617600,
          createdAt: 1672617600,
          updatedAt: 1672617600,
        },
      ];

      // Act
      const result = await transactionService.getTransactions();

      // Assert
      expect(result.transactions).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(result.hasMore).toBe(false);
    });

    it('should apply filters correctly', async () => {
      // Arrange
      const filters = {
        type: 'expense' as const,
        startDate: 1672531200,
        endDate: 1672617600,
      };

      // Act
      const result = await transactionService.getTransactions(filters);

      // Assert
      expect(result.transactions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'expense' }),
        ])
      );
    });
  });

  describe('updateTransaction', () => {
    it('should update transaction successfully', async () => {
      // Arrange
      const updateInput: UpdateTransactionInput = {
        id: 'transaction_123',
        amount: 30.00,
        description: 'Updated description',
      };

      const mockUpdatedTransaction = {
        id: 'transaction_123',
        amount: 30.00,
        description: 'Updated description',
        type: 'expense' as const,
        categoryId: 'cat_food',
        date: 1672531200,
        createdAt: 1672531200,
        updatedAt: 1672617600,
      };

      // Act
      const result = await transactionService.updateTransaction(updateInput);

      // Assert
      expect(result.amount).toBe(30.00);
      expect(result.description).toBe('Updated description');
      expect(result.updatedAt).toBeGreaterThan(result.createdAt);
    });

    it('should throw error for non-existent transaction', async () => {
      // Arrange
      const updateInput: UpdateTransactionInput = {
        id: 'nonexistent_transaction',
        amount: 30.00,
      };

      // Act & Assert
      await expect(transactionService.updateTransaction(updateInput))
        .rejects
        .toThrow('Transaktion nicht gefunden');
    });
  });

  describe('deleteTransaction', () => {
    it('should delete transaction successfully', async () => {
      // Arrange
      const transactionId = 'transaction_123';

      // Act & Assert
      await expect(transactionService.deleteTransaction(transactionId))
        .resolves
        .not
        .toThrow();
    });

    it('should throw error for non-existent transaction', async () => {
      // Arrange
      const transactionId = 'nonexistent_transaction';

      // Act & Assert
      await expect(transactionService.deleteTransaction(transactionId))
        .rejects
        .toThrow('Transaktion nicht gefunden');
    });
  });

  describe('getBalance', () => {
    it('should calculate balance correctly', async () => {
      // Arrange
      const mockBalance = {
        income: 2000.00,
        expense: 500.00,
        balance: 1500.00,
      };

      // Act
      const result = await transactionService.getBalance();

      // Assert
      expect(result.income).toBe(2000.00);
      expect(result.expense).toBe(500.00);
      expect(result.balance).toBe(1500.00);
    });

    it('should apply filters to balance calculation', async () => {
      // Arrange
      const filters = {
        startDate: 1672531200,
        endDate: 1672617600,
        categoryId: 'cat_food',
      };

      // Act
      const result = await transactionService.getBalance(filters);

      // Assert
      expect(typeof result.income).toBe('number');
      expect(typeof result.expense).toBe('number');
      expect(typeof result.balance).toBe('number');
      expect(result.balance).toBe(result.income - result.expense);
    });
  });

  describe('getMonthlyStats', () => {
    it('should return correct monthly statistics', async () => {
      // Arrange
      const year = 2023;
      const month = 1; // January

      // Act
      const result = await transactionService.getMonthlyStats(year, month);

      // Assert
      expect(result).toHaveProperty('income');
      expect(result).toHaveProperty('expense');
      expect(result).toHaveProperty('balance');
      expect(result).toHaveProperty('transactionCount');
      expect(result).toHaveProperty('avgTransactionAmount');
      expect(result.balance).toBe(result.income - result.expense);
    });
  });

  describe('searchTransactions', () => {
    it('should return matching transactions for search query', async () => {
      // Arrange
      const query = 'grocery';

      // Act
      const result = await transactionService.searchTransactions(query);

      // Assert
      expect(Array.isArray(result)).toBe(true);
      // Should contain transactions with matching description or notes
      result.forEach(transaction => {
        expect(
          transaction.description.toLowerCase().includes(query.toLowerCase()) ||
          transaction.notes?.toLowerCase().includes(query.toLowerCase())
        ).toBe(true);
      });
    });

    it('should return empty array for empty search query', async () => {
      // Arrange
      const query = '';

      // Act
      const result = await transactionService.searchTransactions(query);

      // Assert
      expect(result).toEqual([]);
    });
  });
});
