import { dashboardService } from '../../src/services/dashboardService';
import { reportsService } from '../../src/services/reportsService';
import { transactionRepository } from '../../src/services/transactionRepository';
import { categoryRepository } from '../../src/services/categoryRepository';
import {
  DashboardSummary,
  WidgetData,
  BalanceWidgetData,
  CategoryBreakdownWidgetData,
  TopCategoriesWidgetData,
  QuickStatsWidgetData
} from '../../src/types/dashboard';

// Mock dependencies
jest.mock('../../src/services/reportsService');
jest.mock('../../src/services/transactionRepository');
jest.mock('../../src/services/categoryRepository');

describe('DashboardService - Sprint 6 Features', () => {
  const mockReportsService = reportsService as jest.Mocked<typeof reportsService>;
  const mockTransactionRepository = transactionRepository as jest.Mocked<typeof transactionRepository>;
  const mockCategoryRepository = categoryRepository as jest.Mocked<typeof categoryRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(1640995200000); // Mock timestamp
    dashboardService.clearCache();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getDashboardSummary', () => {
    const mockTransactions = [
      {
        id: 'tx-1',
        amount: 1000,
        description: 'Salary',
        date: 1640995200000,
        type: 'income' as const,
        categoryId: 'cat-income-1',
        createdAt: 1640995200,
        updatedAt: 1640995200,
      },
      {
        id: 'tx-2',
        amount: 300,
        description: 'Groceries',
        date: 1640995200000,
        type: 'expense' as const,
        categoryId: 'cat-expense-1',
        createdAt: 1640995200,
        updatedAt: 1640995200,
      },
    ];

    const mockCategoryStats = [
      {
        categoryId: 'cat-income-1',
        categoryName: 'Salary',
        categoryIcon: '💰',
        categoryColor: '#10B981',
        categoryType: 'income' as const,
        transactionCount: 1,
        totalIncome: 1000,
        totalExpense: 0,
        totalAmount: 1000,
        averageAmount: 1000,
        minAmount: 1000,
        maxAmount: 1000,
        firstTransactionDate: 1640995200000,
        lastTransactionDate: 1640995200000,
      },
      {
        categoryId: 'cat-expense-1',
        categoryName: 'Food',
        categoryIcon: '🍔',
        categoryColor: '#EF4444',
        categoryType: 'expense' as const,
        transactionCount: 1,
        totalIncome: 0,
        totalExpense: 300,
        totalAmount: 300,
        averageAmount: 300,
        minAmount: 300,
        maxAmount: 300,
        firstTransactionDate: 1640995200000,
        lastTransactionDate: 1640995200000,
      },
    ];

    it('should generate comprehensive dashboard summary with widgets', async () => {
      mockTransactionRepository.getTransactions.mockResolvedValue({
        transactions: mockTransactions,
        totalCount: 2,
        hasMore: false,
      });

      mockCategoryRepository.getCategoryStats.mockResolvedValue(mockCategoryStats);

      const result = await dashboardService.getDashboardSummary();

      expect(result).toBeDefined();
      expect(result.currentMonth).toBeDefined();
      expect(result.widgets).toBeInstanceOf(Array);
      expect(result.widgets.length).toBeGreaterThan(0);
      expect(result.performance).toBeDefined();
      expect(result.lastUpdated).toBe(1640995200000);
    });

    it('should include balance widget with trend analysis', async () => {
      mockTransactionRepository.getTransactions
        .mockResolvedValueOnce({ // Current period
          transactions: mockTransactions,
          totalCount: 2,
          hasMore: false,
        })
        .mockResolvedValueOnce({ // Previous period for trend
          transactions: [
            {
              id: 'tx-prev',
              amount: 800,
              description: 'Previous income',
              date: 1638316800000,
              type: 'income' as const,
              categoryId: 'cat-income-1',
              createdAt: 1638316800,
              updatedAt: 1638316800,
            },
          ],
          totalCount: 1,
          hasMore: false,
        });

      mockCategoryRepository.getCategoryStats.mockResolvedValue(mockCategoryStats);

      const result = await dashboardService.getDashboardSummary();
      const balanceWidget = result.widgets.find(w => w.type === 'balance');

      expect(balanceWidget).toBeDefined();
      expect(balanceWidget?.data.balance).toBe(700); // 1000 - 300
      expect(balanceWidget?.data.totalIncome).toBe(1000);
      expect(balanceWidget?.data.totalExpense).toBe(300);
      expect(balanceWidget?.data.trend).toBeDefined();
    });

    it('should include category breakdown widget with chart data', async () => {
      mockTransactionRepository.getTransactions.mockResolvedValue({
        transactions: mockTransactions,
        totalCount: 2,
        hasMore: false,
      });

      mockCategoryRepository.getCategoryStats.mockResolvedValue(mockCategoryStats);

      const result = await dashboardService.getDashboardSummary();
      const categoryWidget = result.widgets.find(w => w.type === 'categoryBreakdown');

      expect(categoryWidget).toBeDefined();
      expect(categoryWidget?.data.chart).toBeDefined();
      expect(categoryWidget?.data.chart.type).toBe('pie');
      expect(categoryWidget?.data.categories).toBeInstanceOf(Array);
    });

    it('should include top categories widget', async () => {
      mockTransactionRepository.getTransactions.mockResolvedValue({
        transactions: mockTransactions,
        totalCount: 2,
        hasMore: false,
      });

      mockCategoryRepository.getCategoryStats.mockResolvedValue(mockCategoryStats);

      const result = await dashboardService.getDashboardSummary();
      const topCategoriesWidget = result.widgets.find(w => w.type === 'topCategories');

      expect(topCategoriesWidget).toBeDefined();
      expect(topCategoriesWidget?.data.topExpense).toBeInstanceOf(Array);
      expect(topCategoriesWidget?.data.topIncome).toBeInstanceOf(Array);
    });

    it('should include quick stats widget', async () => {
      mockTransactionRepository.getTransactions.mockResolvedValue({
        transactions: mockTransactions,
        totalCount: 2,
        hasMore: false,
      });

      mockCategoryRepository.getCategoryStats.mockResolvedValue(mockCategoryStats);

      const result = await dashboardService.getDashboardSummary();
      const quickStatsWidget = result.widgets.find(w => w.type === 'quickStats');

      expect(quickStatsWidget).toBeDefined();
      expect(quickStatsWidget?.data.stats.totalTransactions).toBe(2);
      expect(quickStatsWidget?.data.stats.categoriesUsed).toBe(2);
      expect(quickStatsWidget?.data.formatted).toBeDefined();
    });

    it('should cache dashboard data for performance', async () => {
      mockTransactionRepository.getTransactions.mockResolvedValue({
        transactions: mockTransactions,
        totalCount: 2,
        hasMore: false,
      });

      mockCategoryRepository.getCategoryStats.mockResolvedValue(mockCategoryStats);

      // First call
      const result1 = await dashboardService.getDashboardSummary();

      // Second call with same parameters should use cache
      const result2 = await dashboardService.getDashboardSummary();

      expect(result1).toEqual(result2);
      expect(mockTransactionRepository.getTransactions).toHaveBeenCalledTimes(1);
      expect(mockCategoryRepository.getCategoryStats).toHaveBeenCalledTimes(1);
    });

    it('should handle different time ranges correctly', async () => {
      mockTransactionRepository.getTransactions.mockResolvedValue({
        transactions: mockTransactions,
        totalCount: 2,
        hasMore: false,
      });

      mockCategoryRepository.getCategoryStats.mockResolvedValue(mockCategoryStats);

      const weekResult = await dashboardService.getDashboardSummary({ timeRange: 'week' });
      const yearResult = await dashboardService.getDashboardSummary({ timeRange: 'year' });

      expect(weekResult).toBeDefined();
      expect(yearResult).toBeDefined();
      expect(mockTransactionRepository.getTransactions).toHaveBeenCalledTimes(2);
    });

    it('should handle filters correctly', async () => {
      mockTransactionRepository.getTransactions.mockResolvedValue({
        transactions: mockTransactions,
        totalCount: 2,
        hasMore: false,
      });

      mockCategoryRepository.getCategoryStats.mockResolvedValue(mockCategoryStats);

      const result = await dashboardService.getDashboardSummary({
        timeRange: 'month',
        categories: ['cat-expense-1'],
        transactionType: 'expense',
      });

      expect(result).toBeDefined();
      expect(mockTransactionRepository.getTransactions).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'expense',
          categoryIds: ['cat-expense-1'],
        })
      );
    });
  });

  describe('getWidgetData', () => {
    it('should generate balance widget data correctly', async () => {
      mockTransactionRepository.getTransactions
        .mockResolvedValueOnce({ // Current period
          transactions: [
            {
              id: 'tx-1',
              amount: 1000,
              description: 'Income',
              date: 1640995200000,
              type: 'income' as const,
              categoryId: 'cat-1',
              createdAt: 1640995200,
              updatedAt: 1640995200,
            },
            {
              id: 'tx-2',
              amount: 400,
              description: 'Expense',
              date: 1640995200000,
              type: 'expense' as const,
              categoryId: 'cat-2',
              createdAt: 1640995200,
              updatedAt: 1640995200,
            },
          ],
          totalCount: 2,
          hasMore: false,
        })
        .mockResolvedValueOnce({ // Previous period
          transactions: [
            {
              id: 'tx-prev',
              amount: 500,
              description: 'Previous',
              date: 1638316800000,
              type: 'income' as const,
              categoryId: 'cat-1',
              createdAt: 1638316800,
              updatedAt: 1638316800,
            },
          ],
          totalCount: 1,
          hasMore: false,
        });

      const config = {
        size: 'medium' as const,
        position: { row: 0, col: 0 },
        filters: { timeRange: 'month' as const },
      };

      const result = await dashboardService.getWidgetData('balance', config);

      expect(result.type).toBe('balance');
      expect(result.data.balance).toBe(600); // 1000 - 400
      expect(result.data.totalIncome).toBe(1000);
      expect(result.data.totalExpense).toBe(400);
      expect(result.data.trend).toBeDefined();
      expect(result.data.formatted).toBeDefined();
    });

    it('should generate category breakdown widget data', async () => {
      mockCategoryRepository.getCategoryStats.mockResolvedValue([
        {
          categoryId: 'cat-1',
          categoryName: 'Food',
          categoryIcon: '🍔',
          categoryColor: '#EF4444',
          categoryType: 'expense' as const,
          transactionCount: 5,
          totalIncome: 0,
          totalExpense: 300,
          totalAmount: 300,
          averageAmount: 60,
          minAmount: 20,
          maxAmount: 100,
          firstTransactionDate: 1640995200000,
          lastTransactionDate: 1640995200000,
        },
      ]);

      const config = {
        size: 'large' as const,
        position: { row: 0, col: 0 },
        filters: { timeRange: 'month' as const },
      };

      const result = await dashboardService.getWidgetData('categoryBreakdown', config);

      expect(result.type).toBe('categoryBreakdown');
      expect(result.data.chart).toBeDefined();
      expect(result.data.chart.type).toBe('pie');
      expect(result.data.categories).toHaveLength(1);
      expect(result.data.total).toBeDefined();
    });

    it('should handle unknown widget types', async () => {
      const config = {
        size: 'medium' as const,
        position: { row: 0, col: 0 },
      };

      await expect(dashboardService.getWidgetData('unknown', config))
        .rejects
        .toThrow('Unknown widget type: unknown');
    });
  });

  describe('getChartData', () => {
    it('should generate income-expense line chart data', async () => {
      const mockDailyTransactions = [
        {
          id: 'tx-1',
          amount: 100,
          description: 'Day 1 Income',
          date: 1640995200000, // Jan 1
          type: 'income' as const,
          categoryId: 'cat-1',
          createdAt: 1640995200,
          updatedAt: 1640995200,
        },
        {
          id: 'tx-2',
          amount: 50,
          description: 'Day 1 Expense',
          date: 1640995200000, // Jan 1
          type: 'expense' as const,
          categoryId: 'cat-2',
          createdAt: 1640995200,
          updatedAt: 1640995200,
        },
        {
          id: 'tx-3',
          amount: 200,
          description: 'Day 2 Income',
          date: 1641081600000, // Jan 2
          type: 'income' as const,
          categoryId: 'cat-1',
          createdAt: 1641081600,
          updatedAt: 1641081600,
        },
      ];

      mockTransactionRepository.getTransactions.mockResolvedValue({
        transactions: mockDailyTransactions,
        totalCount: 3,
        hasMore: false,
      });

      const result = await dashboardService.getChartData('income-expense-line', {
        timeRange: 'month',
      });

      expect(result.type).toBe('line');
      expect(result.data).toBeInstanceOf(Array);
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.config.title).toBe('Einnahmen vs. Ausgaben');
    });

    it('should generate category pie chart data', async () => {
      mockCategoryRepository.getCategoryStats.mockResolvedValue([
        {
          categoryId: 'cat-1',
          categoryName: 'Food',
          categoryIcon: '🍔',
          categoryColor: '#EF4444',
          categoryType: 'expense' as const,
          transactionCount: 3,
          totalIncome: 0,
          totalExpense: 150,
          totalAmount: 150,
          averageAmount: 50,
          minAmount: 30,
          maxAmount: 70,
          firstTransactionDate: 1640995200000,
          lastTransactionDate: 1640995200000,
        },
        {
          categoryId: 'cat-2',
          categoryName: 'Transport',
          categoryIcon: '🚗',
          categoryColor: '#3B82F6',
          categoryType: 'expense' as const,
          transactionCount: 2,
          totalIncome: 0,
          totalExpense: 100,
          totalAmount: 100,
          averageAmount: 50,
          minAmount: 40,
          maxAmount: 60,
          firstTransactionDate: 1640995200000,
          lastTransactionDate: 1640995200000,
        },
      ]);

      const result = await dashboardService.getChartData('category-pie', {
        timeRange: 'month',
        transactionType: 'expense',
      });

      expect(result.type).toBe('pie');
      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe('Food'); // Should be sorted by amount
      expect(result.data[0].value).toBe(150);
      expect(result.data[0].color).toBe('#EF4444');
    });

    it('should handle unknown chart types', async () => {
      await expect(dashboardService.getChartData('unknown-chart', {}))
        .rejects
        .toThrow('Unknown chart type: unknown-chart');
    });
  });

  describe('performance and caching', () => {
    it('should clear cache when requested', async () => {
      mockTransactionRepository.getTransactions.mockResolvedValue({
        transactions: [],
        totalCount: 0,
        hasMore: false,
      });
      mockCategoryRepository.getCategoryStats.mockResolvedValue([]);

      // Load data to cache
      await dashboardService.getDashboardSummary();

      // Clear cache
      dashboardService.clearCache();

      // Load again - should make new requests
      await dashboardService.getDashboardSummary();

      expect(mockTransactionRepository.getTransactions).toHaveBeenCalledTimes(2);
    });

    it('should include performance metrics in dashboard summary', async () => {
      mockTransactionRepository.getTransactions.mockResolvedValue({
        transactions: Array.from({ length: 100 }, (_, i) => ({
          id: `tx-${i}`,
          amount: 100,
          description: `Transaction ${i}`,
          date: 1640995200000,
          type: 'income' as const,
          categoryId: 'cat-1',
          createdAt: 1640995200,
          updatedAt: 1640995200,
        })),
        totalCount: 100,
        hasMore: false,
      });

      mockCategoryRepository.getCategoryStats.mockResolvedValue([
        {
          categoryId: 'cat-1',
          categoryName: 'Test',
          categoryIcon: '🧪',
          categoryColor: '#000000',
          categoryType: 'income' as const,
          transactionCount: 100,
          totalIncome: 10000,
          totalExpense: 0,
          totalAmount: 10000,
          averageAmount: 100,
          minAmount: 100,
          maxAmount: 100,
          firstTransactionDate: 1640995200000,
          lastTransactionDate: 1640995200000,
        },
      ]);

      const result = await dashboardService.getDashboardSummary();

      expect(result.performance).toBeDefined();
      expect(result.performance.dataPoints).toBe(100);
      expect(result.performance.categories).toBe(1);
      expect(result.performance.renderTime).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle transaction service errors gracefully', async () => {
      mockTransactionRepository.getTransactions.mockRejectedValue(new Error('Database error'));

      await expect(dashboardService.getDashboardSummary())
        .rejects
        .toThrow('Failed to get dashboard summary: Database error');
    });

    it('should handle category service errors gracefully', async () => {
      mockTransactionRepository.getTransactions.mockResolvedValue({
        transactions: [],
        totalCount: 0,
        hasMore: false,
      });

      mockCategoryRepository.getCategoryStats.mockRejectedValue(new Error('Category error'));

      await expect(dashboardService.getDashboardSummary())
        .rejects
        .toThrow('Failed to get dashboard summary: Category error');
    });

    it('should handle widget generation errors', async () => {
      const config = {
        size: 'medium' as const,
        position: { row: 0, col: 0 },
      };

      mockTransactionRepository.getTransactions.mockRejectedValue(new Error('DB Error'));

      await expect(dashboardService.getWidgetData('balance', config))
        .rejects
        .toThrow('Failed to generate widget data: DB Error');
    });
  });
});
