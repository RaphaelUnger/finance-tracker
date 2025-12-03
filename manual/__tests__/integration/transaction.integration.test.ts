import { databaseService } from '../../src/services/databaseService';
import { transactionService } from '../../src/services/transactionService';
import { CreateTransactionInput } from '../../src/types/transaction';

describe('Transaction Integration Tests', () => {
  beforeAll(async () => {
    // Initialize database for integration tests
    await databaseService.initialize();
  });

  afterAll(async () => {
    // Clean up database connection
    await databaseService.close();
  });

  beforeEach(async () => {
    // Clean up transactions before each test
    // In a real scenario, we would clear test data
  });

  describe('Full Transaction Lifecycle', () => {
    it('should create, read, update, and delete a transaction', async () => {
      // 1. Create Transaction
      const createInput: CreateTransactionInput = {
        amount: 25.50,
        description: 'Integration Test Transaction',
        type: 'expense',
        categoryId: 'cat_food', // Should exist from default categories
        date: Math.floor(Date.now() / 1000),
        notes: 'Test notes',
      };

      const createdTransaction = await transactionService.createTransaction(createInput);

      // Verify creation
      expect(createdTransaction.id).toBeDefined();
      expect(createdTransaction.amount).toBe(25.50);
      expect(createdTransaction.description).toBe('Integration Test Transaction');
      expect(createdTransaction.type).toBe('expense');

      // 2. Read Transaction
      const fetchedTransaction = await transactionService.getTransaction(createdTransaction.id);
      expect(fetchedTransaction).toBeDefined();
      expect(fetchedTransaction!.id).toBe(createdTransaction.id);

      // 3. Update Transaction
      const updateInput = {
        id: createdTransaction.id,
        amount: 30.75,
        description: 'Updated Integration Test Transaction',
      };

      const updatedTransaction = await transactionService.updateTransaction(updateInput);
      expect(updatedTransaction.amount).toBe(30.75);
      expect(updatedTransaction.description).toBe('Updated Integration Test Transaction');
      expect(updatedTransaction.updatedAt).toBeGreaterThan(updatedTransaction.createdAt);

      // 4. Delete Transaction
      await transactionService.deleteTransaction(createdTransaction.id);

      // Verify deletion
      const deletedTransaction = await transactionService.getTransaction(createdTransaction.id);
      expect(deletedTransaction).toBeNull();
    });

    it('should maintain data consistency across operations', async () => {
      // Create multiple transactions
      const transactions = await Promise.all([
        transactionService.createTransaction({
          amount: 100,
          description: 'Income 1',
          type: 'income',
          categoryId: 'cat_salary',
          date: Math.floor(Date.now() / 1000),
        }),
        transactionService.createTransaction({
          amount: 50,
          description: 'Expense 1',
          type: 'expense',
          categoryId: 'cat_food',
          date: Math.floor(Date.now() / 1000),
        }),
        transactionService.createTransaction({
          amount: 200,
          description: 'Income 2',
          type: 'income',
          categoryId: 'cat_salary',
          date: Math.floor(Date.now() / 1000),
        }),
      ]);

      // Check balance calculation
      const balance = await transactionService.getBalance();
      expect(balance.income).toBeGreaterThanOrEqual(300); // 100 + 200
      expect(balance.expense).toBeGreaterThanOrEqual(50);
      expect(balance.balance).toBe(balance.income - balance.expense);

      // Check transaction listing
      const result = await transactionService.getTransactions();
      expect(result.transactions.length).toBeGreaterThanOrEqual(3);
      expect(result.totalCount).toBeGreaterThanOrEqual(3);

      // Clean up
      await Promise.all(
        transactions.map(t => transactionService.deleteTransaction(t.id))
      );
    });

    it('should handle concurrent operations correctly', async () => {
      // Create transactions concurrently
      const createPromises = Array.from({ length: 5 }, (_, index) =>
        transactionService.createTransaction({
          amount: 10 + index,
          description: `Concurrent Transaction ${index}`,
          type: 'expense',
          categoryId: 'cat_food',
          date: Math.floor(Date.now() / 1000),
        })
      );

      const createdTransactions = await Promise.all(createPromises);

      // Verify all transactions were created
      expect(createdTransactions).toHaveLength(5);
      createdTransactions.forEach((transaction, index) => {
        expect(transaction.amount).toBe(10 + index);
        expect(transaction.description).toBe(`Concurrent Transaction ${index}`);
      });

      // Update them concurrently
      const updatePromises = createdTransactions.map((transaction, index) =>
        transactionService.updateTransaction({
          id: transaction.id,
          amount: 20 + index,
        })
      );

      const updatedTransactions = await Promise.all(updatePromises);

      // Verify all updates
      updatedTransactions.forEach((transaction, index) => {
        expect(transaction.amount).toBe(20 + index);
      });

      // Clean up
      await Promise.all(
        createdTransactions.map(t => transactionService.deleteTransaction(t.id))
      );
    });
  });

  describe('Transaction Filtering and Search', () => {
    let testTransactions: any[] = [];

    beforeEach(async () => {
      // Create test data
      testTransactions = await Promise.all([
        transactionService.createTransaction({
          amount: 25.50,
          description: 'Grocery Shopping',
          type: 'expense',
          categoryId: 'cat_food',
          date: Math.floor(new Date('2023-01-01').getTime() / 1000),
        }),
        transactionService.createTransaction({
          amount: 1500,
          description: 'Monthly Salary',
          type: 'income',
          categoryId: 'cat_salary',
          date: Math.floor(new Date('2023-01-01').getTime() / 1000),
        }),
        transactionService.createTransaction({
          amount: 75,
          description: 'Gas Station',
          type: 'expense',
          categoryId: 'cat_transport',
          date: Math.floor(new Date('2023-01-15').getTime() / 1000),
        }),
      ]);
    });

    afterEach(async () => {
      // Clean up test data
      await Promise.all(
        testTransactions.map(t => transactionService.deleteTransaction(t.id))
      );
    });

    it('should filter transactions by type', async () => {
      const expenseResult = await transactionService.getTransactions({ type: 'expense' });
      const incomeResult = await transactionService.getTransactions({ type: 'income' });

      expect(expenseResult.transactions.every(t => t.type === 'expense')).toBe(true);
      expect(incomeResult.transactions.every(t => t.type === 'income')).toBe(true);
    });

    it('should filter transactions by date range', async () => {
      const startDate = Math.floor(new Date('2023-01-01').getTime() / 1000);
      const endDate = Math.floor(new Date('2023-01-10').getTime() / 1000);

      const result = await transactionService.getTransactions({
        startDate,
        endDate,
      });

      result.transactions.forEach(transaction => {
        expect(transaction.date).toBeGreaterThanOrEqual(startDate);
        expect(transaction.date).toBeLessThanOrEqual(endDate);
      });
    });

    it('should filter transactions by category', async () => {
      const result = await transactionService.getTransactions({
        categoryId: 'cat_food',
      });

      expect(result.transactions.every(t => t.categoryId === 'cat_food')).toBe(true);
    });

    it('should search transactions by description', async () => {
      const result = await transactionService.searchTransactions('grocery');

      expect(result.length).toBeGreaterThan(0);
      expect(
        result.some(t => t.description.toLowerCase().includes('grocery'))
      ).toBe(true);
    });

    it('should combine multiple filters', async () => {
      const result = await transactionService.getTransactions({
        type: 'expense',
        startDate: Math.floor(new Date('2023-01-01').getTime() / 1000),
        endDate: Math.floor(new Date('2023-01-31').getTime() / 1000),
      });

      result.transactions.forEach(transaction => {
        expect(transaction.type).toBe('expense');
        expect(transaction.date).toBeGreaterThanOrEqual(
          Math.floor(new Date('2023-01-01').getTime() / 1000)
        );
        expect(transaction.date).toBeLessThanOrEqual(
          Math.floor(new Date('2023-01-31').getTime() / 1000)
        );
      });
    });
  });

  describe('Transaction Statistics', () => {
    it('should calculate monthly statistics correctly', async () => {
      // Create transactions for January 2023
      const january2023Transactions = await Promise.all([
        transactionService.createTransaction({
          amount: 1500,
          description: 'January Salary',
          type: 'income',
          categoryId: 'cat_salary',
          date: Math.floor(new Date('2023-01-15').getTime() / 1000),
        }),
        transactionService.createTransaction({
          amount: 200,
          description: 'Groceries',
          type: 'expense',
          categoryId: 'cat_food',
          date: Math.floor(new Date('2023-01-20').getTime() / 1000),
        }),
        transactionService.createTransaction({
          amount: 100,
          description: 'Gas',
          type: 'expense',
          categoryId: 'cat_transport',
          date: Math.floor(new Date('2023-01-25').getTime() / 1000),
        }),
      ]);

      const stats = await transactionService.getMonthlyStats(2023, 1);

      expect(stats.income).toBeGreaterThanOrEqual(1500);
      expect(stats.expense).toBeGreaterThanOrEqual(300);
      expect(stats.balance).toBe(stats.income - stats.expense);
      expect(stats.transactionCount).toBeGreaterThanOrEqual(3);
      expect(stats.avgTransactionAmount).toBeGreaterThan(0);

      // Clean up
      await Promise.all(
        january2023Transactions.map(t => transactionService.deleteTransaction(t.id))
      );
    });
  });
});
