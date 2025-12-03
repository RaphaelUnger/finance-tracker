import AdvancedAnalyticsService from '../../services/advancedAnalyticsService';
import { DatabaseService } from '../../services/databaseService';
import { Transaction, Category } from '../../types';

// Mock DatabaseService
jest.mock('../../services/databaseService');
const mockDatabaseService = DatabaseService as jest.Mocked<typeof DatabaseService>;

describe('AdvancedAnalyticsService', () => {
  const mockTransactions: Transaction[] = [
    {
      id: '1',
      amount: 50,
      description: 'Groceries',
      date: new Date('2025-01-15').getTime(),
      type: 'expense',
      categoryId: 'cat1',
      notes: '',
      createdAt: new Date('2025-01-15').getTime(),
      updatedAt: new Date('2025-01-15').getTime(),
      deletedAt: null
    },
    {
      id: '2',
      amount: 2500,
      description: 'Salary',
      date: new Date('2025-01-01').getTime(),
      type: 'income',
      categoryId: 'cat2',
      notes: '',
      createdAt: new Date('2025-01-01').getTime(),
      updatedAt: new Date('2025-01-01').getTime(),
      deletedAt: null
    },
    {
      id: '3',
      amount: 30,
      description: 'Coffee',
      date: new Date('2025-01-10').getTime(),
      type: 'expense',
      categoryId: 'cat3',
      notes: '',
      createdAt: new Date('2025-01-10').getTime(),
      updatedAt: new Date('2025-01-10').getTime(),
      deletedAt: null
    }
  ];

  const mockCategories: Category[] = [
    {
      id: 'cat1',
      name: 'Groceries',
      icon: 'shopping-cart',
      color: '#4CAF50',
      type: 'expense',
      isDefault: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null
    },
    {
      id: 'cat2',
      name: 'Salary',
      icon: 'account-balance',
      color: '#2196F3',
      type: 'income',
      isDefault: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null
    },
    {
      id: 'cat3',
      name: 'Food & Drinks',
      icon: 'restaurant',
      color: '#FF9800',
      type: 'expense',
      isDefault: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    mockDatabaseService.prototype.getTransactions = jest.fn().mockResolvedValue(mockTransactions);
    mockDatabaseService.prototype.getCategories = jest.fn().mockResolvedValue(mockCategories);
    mockDatabaseService.prototype.saveCustomReport = jest.fn().mockResolvedValue(undefined);
    mockDatabaseService.prototype.getCustomReport = jest.fn().mockResolvedValue(null);
    mockDatabaseService.prototype.updateCustomReport = jest.fn().mockResolvedValue(undefined);

    // Clear cache
    AdvancedAnalyticsService.clearCache();
  });

  describe('Basic Analytics', () => {
    it('should calculate analytics for a time range', async () => {
      const timeRange = {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        label: 'January 2025'
      };

      const analytics = await AdvancedAnalyticsService.getAnalytics(timeRange);

      expect(analytics.totalIncome).toBe(2500);
      expect(analytics.totalExpenses).toBe(80); // 50 + 30
      expect(analytics.netAmount).toBe(2420); // 2500 - 80
      expect(analytics.transactionCount).toBe(3);
      expect(analytics.avgTransactionAmount).toBeCloseTo(860, 0); // (2500 + 50 + 30) / 3
    });

    it('should filter transactions by category', async () => {
      const timeRange = {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        label: 'January 2025'
      };

      const analytics = await AdvancedAnalyticsService.getAnalytics(timeRange, ['cat1']);

      expect(analytics.totalIncome).toBe(0);
      expect(analytics.totalExpenses).toBe(50);
      expect(analytics.transactionCount).toBe(1);
    });

    it('should calculate category breakdown correctly', async () => {
      const timeRange = {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        label: 'January 2025'
      };

      const analytics = await AdvancedAnalyticsService.getAnalytics(timeRange);

      expect(analytics.categoryBreakdown).toHaveLength(3);

      const salaryCategory = analytics.categoryBreakdown.find(c => c.categoryId === 'cat2');
      expect(salaryCategory?.totalAmount).toBe(2500);
      expect(salaryCategory?.percentage).toBeCloseTo(96.9, 1); // 2500 / 2580 * 100

      const groceriesCategory = analytics.categoryBreakdown.find(c => c.categoryId === 'cat1');
      expect(groceriesCategory?.totalAmount).toBe(50);
    });

    it('should calculate daily totals', async () => {
      const timeRange = {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        label: 'January 2025'
      };

      const analytics = await AdvancedAnalyticsService.getAnalytics(timeRange);

      expect(analytics.dailyTotals).toHaveLength(31); // January has 31 days

      // Check specific dates
      const jan1 = analytics.dailyTotals.find(d => d.date === '2025-01-01');
      expect(jan1?.value).toBe(2500); // Salary (income = positive)

      const jan10 = analytics.dailyTotals.find(d => d.date === '2025-01-10');
      expect(jan10?.value).toBe(-30); // Coffee (expense = negative)

      const jan15 = analytics.dailyTotals.find(d => d.date === '2025-01-15');
      expect(jan15?.value).toBe(-50); // Groceries (expense = negative)
    });
  });

  describe('Time Range Comparison', () => {
    it('should compare two time periods', async () => {
      const currentRange = {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        label: 'Current Month'
      };

      const previousRange = {
        startDate: new Date('2024-12-01'),
        endDate: new Date('2024-12-31'),
        label: 'Previous Month'
      };

      // Mock previous period with different data
      const previousTransactions: Transaction[] = [
        {
          id: '4',
          amount: 2000,
          description: 'Previous Salary',
          date: new Date('2024-12-01').getTime(),
          type: 'income',
          categoryId: 'cat2',
          notes: '',
          createdAt: new Date('2024-12-01').getTime(),
          updatedAt: new Date('2024-12-01').getTime(),
          deletedAt: null
        }
      ];

      mockDatabaseService.prototype.getTransactions = jest.fn()
        .mockImplementationOnce(() => Promise.resolve(mockTransactions))
        .mockImplementationOnce(() => Promise.resolve(previousTransactions));

      const comparison = await AdvancedAnalyticsService.compareTimeRanges(
        currentRange,
        previousRange
      );

      expect(comparison.current.data.netAmount).toBe(2420);
      expect(comparison.previous.data.netAmount).toBe(2000);
      expect(comparison.change.absolute).toBe(420);
      expect(comparison.change.percentage).toBeCloseTo(21, 0);
      expect(comparison.change.trend).toBe('up');
    });

    it('should handle negative trend correctly', async () => {
      const currentRange = {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        label: 'Current Month'
      };

      const previousRange = {
        startDate: new Date('2024-12-01'),
        endDate: new Date('2024-12-31'),
        label: 'Previous Month'
      };

      const higherPreviousTransactions: Transaction[] = [
        {
          id: '4',
          amount: 3000,
          description: 'Higher Previous Salary',
          date: new Date('2024-12-01').getTime(),
          type: 'income',
          categoryId: 'cat2',
          notes: '',
          createdAt: new Date('2024-12-01').getTime(),
          updatedAt: new Date('2024-12-01').getTime(),
          deletedAt: null
        }
      ];

      mockDatabaseService.prototype.getTransactions = jest.fn()
        .mockImplementationOnce(() => Promise.resolve(mockTransactions))
        .mockImplementationOnce(() => Promise.resolve(higherPreviousTransactions));

      const comparison = await AdvancedAnalyticsService.compareTimeRanges(
        currentRange,
        previousRange
      );

      expect(comparison.change.trend).toBe('down');
      expect(comparison.change.absolute).toBe(-580);
    });
  });

  describe('Moving Averages', () => {
    it('should calculate moving averages correctly', async () => {
      const timeRange = {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        label: 'January 2025'
      };

      const movingAverage = await AdvancedAnalyticsService.getMovingAverages(
        timeRange,
        7,
        'expenses'
      );

      expect(movingAverage.period).toBe(7);
      expect(movingAverage.data).toBeDefined();
      expect(movingAverage.trend).toBeDefined();
      expect(['increasing', 'decreasing', 'stable']).toContain(movingAverage.trend);
    });

    it('should calculate trend slope', async () => {
      // Create data with increasing trend
      const increasingTransactions: Transaction[] = [];
      for (let i = 1; i <= 10; i++) {
        increasingTransactions.push({
          id: i.toString(),
          amount: i * 10, // Increasing amounts
          description: `Transaction ${i}`,
          date: new Date(`2025-01-${String(i).padStart(2, '0')}`).getTime(),
          type: 'expense',
          categoryId: 'cat1',
          notes: '',
          createdAt: new Date().getTime(),
          updatedAt: new Date().getTime(),
          deletedAt: null
        });
      }

      mockDatabaseService.prototype.getTransactions = jest.fn().mockResolvedValue(increasingTransactions);

      const timeRange = {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-10'),
        label: 'Test Range'
      };

      const movingAverage = await AdvancedAnalyticsService.getMovingAverages(
        timeRange,
        3,
        'expenses'
      );

      expect(movingAverage.trend).toBe('increasing');
      expect(movingAverage.slope).toBeGreaterThan(0);
    });
  });

  describe('Seasonality Analysis', () => {
    it('should analyze spending patterns by day of week', async () => {
      const timeRange = {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        label: 'January 2025'
      };

      const seasonality = await AdvancedAnalyticsService.getSeasonalityAnalysis(timeRange);

      expect(seasonality.patterns.dayOfWeek).toBeDefined();
      expect(seasonality.patterns.dayOfMonth).toBeDefined();
      expect(seasonality.patterns.monthOfYear).toBeDefined();
      expect(seasonality.recommendations).toBeInstanceOf(Array);
    });

    it('should generate recommendations based on patterns', async () => {
      // Create transactions with clear weekend spending pattern
      const weekendTransactions: Transaction[] = [];

      // Add weekend transactions (Saturday = 6, Sunday = 0)
      for (let i = 0; i < 4; i++) {
        weekendTransactions.push({
          id: `weekend-${i}`,
          amount: 100,
          description: 'Weekend Spending',
          date: new Date(2025, 0, 5 + (i * 7)).getTime(), // Saturdays
          type: 'expense',
          categoryId: 'cat1',
          notes: '',
          createdAt: new Date().getTime(),
          updatedAt: new Date().getTime(),
          deletedAt: null
        });
      }

      // Add few weekday transactions with lower amounts
      weekendTransactions.push({
        id: 'weekday-1',
        amount: 20,
        description: 'Weekday Spending',
        date: new Date(2025, 0, 6).getTime(), // Monday
        type: 'expense',
        categoryId: 'cat1',
        notes: '',
        createdAt: new Date().getTime(),
        updatedAt: new Date().getTime(),
        deletedAt: null
      });

      mockDatabaseService.prototype.getTransactions = jest.fn().mockResolvedValue(weekendTransactions);

      const timeRange = {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        label: 'January 2025'
      };

      const seasonality = await AdvancedAnalyticsService.getSeasonalityAnalysis(timeRange);

      expect(seasonality.recommendations.length).toBeGreaterThan(0);
      expect(seasonality.recommendations[0]).toContain('Saturday');
    });
  });

  describe('Category Trends', () => {
    it('should get trends for specific categories', async () => {
      const timeRange = {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        label: 'January 2025'
      };

      const trends = await AdvancedAnalyticsService.getCategoryTrends(
        ['cat1', 'cat2'],
        timeRange,
        'week'
      );

      expect(trends.size).toBe(2);
      expect(trends.has('cat1')).toBe(true);
      expect(trends.has('cat2')).toBe(true);

      const cat1Trend = trends.get('cat1');
      expect(cat1Trend).toBeDefined();
      expect(cat1Trend![0].category).toBe('Groceries');
    });
  });

  describe('Spending Velocity', () => {
    it('should calculate spending velocity correctly', async () => {
      const timeRange = {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        label: 'January 2025'
      };

      const velocity = await AdvancedAnalyticsService.getSpendingVelocity(timeRange);

      expect(velocity.current).toBeGreaterThan(0);
      expect(velocity.average).toBeGreaterThan(0);
      expect(['accelerating', 'decelerating', 'stable']).toContain(velocity.trend);
      expect(velocity.projection).toBeGreaterThan(0);
    });
  });

  describe('Custom Reports', () => {
    it('should create custom report configuration', async () => {
      const config = {
        name: 'Monthly Expense Report',
        description: 'Detailed monthly expense analysis',
        timeRange: {
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-01-31'),
          label: 'January 2025'
        },
        categoryFilters: ['cat1', 'cat3'],
        groupBy: 'category' as const,
        chartType: 'pie' as const,
        metrics: ['expenses', 'count'] as const
      };

      const report = await AdvancedAnalyticsService.createCustomReport(config);

      expect(report.id).toBeDefined();
      expect(report.name).toBe('Monthly Expense Report');
      expect(report.createdAt).toBeInstanceOf(Date);
      expect(report.lastModified).toBeInstanceOf(Date);
      expect(mockDatabaseService.prototype.saveCustomReport).toHaveBeenCalledWith(report);
    });

    it('should execute custom report', async () => {
      const reportConfig = {
        id: 'test-report',
        name: 'Test Report',
        description: 'Test description',
        timeRange: {
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-01-31'),
          label: 'January 2025'
        },
        categoryFilters: undefined,
        groupBy: 'category' as const,
        chartType: 'pie' as const,
        metrics: ['expenses', 'income'] as const,
        createdAt: new Date(),
        lastModified: new Date()
      };

      mockDatabaseService.prototype.getCustomReport = jest.fn().mockResolvedValue(reportConfig);

      const result = await AdvancedAnalyticsService.executeCustomReport('test-report');

      expect(result.config).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.data.expenses).toBe(80);
      expect(result.data.income).toBe(2500);
      expect(result.generatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Caching', () => {
    it('should cache analytics results', async () => {
      const timeRange = {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        label: 'January 2025'
      };

      // First call
      await AdvancedAnalyticsService.getAnalytics(timeRange);
      expect(mockDatabaseService.prototype.getTransactions).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await AdvancedAnalyticsService.getAnalytics(timeRange);
      expect(mockDatabaseService.prototype.getTransactions).toHaveBeenCalledTimes(1);
    });

    it('should clear cache when requested', async () => {
      const timeRange = {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        label: 'January 2025'
      };

      // First call
      await AdvancedAnalyticsService.getAnalytics(timeRange);
      expect(mockDatabaseService.prototype.getTransactions).toHaveBeenCalledTimes(1);

      // Clear cache
      AdvancedAnalyticsService.clearCache();

      // Second call should fetch fresh data
      await AdvancedAnalyticsService.getAnalytics(timeRange);
      expect(mockDatabaseService.prototype.getTransactions).toHaveBeenCalledTimes(2);
    });
  });

  describe('Time Range Utilities', () => {
    it('should provide predefined time ranges', () => {
      const ranges = AdvancedAnalyticsService.getTimeRanges();

      expect(ranges.today).toBeDefined();
      expect(ranges.thisWeek).toBeDefined();
      expect(ranges.thisMonth).toBeDefined();
      expect(ranges.lastMonth).toBeDefined();
      expect(ranges.thisYear).toBeDefined();
      expect(ranges.lastYear).toBeDefined();

      expect(ranges.today.label).toBe('Heute');
      expect(ranges.thisMonth.label).toBe('Dieser Monat');
    });

    it('should calculate correct time ranges', () => {
      const ranges = AdvancedAnalyticsService.getTimeRanges();
      const now = new Date();

      // Check this month range
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      expect(ranges.thisMonth.startDate.getTime()).toBe(thisMonthStart.getTime());

      // Check this year range
      const thisYearStart = new Date(now.getFullYear(), 0, 1);
      expect(ranges.thisYear.startDate.getTime()).toBe(thisYearStart.getTime());
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockDatabaseService.prototype.getTransactions = jest.fn().mockRejectedValue(new Error('Database error'));

      const timeRange = {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        label: 'January 2025'
      };

      await expect(AdvancedAnalyticsService.getAnalytics(timeRange))
        .rejects.toThrow('Failed to get analytics: Database error');
    });

    it('should handle empty transaction data', async () => {
      mockDatabaseService.prototype.getTransactions = jest.fn().mockResolvedValue([]);

      const timeRange = {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        label: 'January 2025'
      };

      const analytics = await AdvancedAnalyticsService.getAnalytics(timeRange);

      expect(analytics.totalIncome).toBe(0);
      expect(analytics.totalExpenses).toBe(0);
      expect(analytics.netAmount).toBe(0);
      expect(analytics.transactionCount).toBe(0);
      expect(analytics.avgTransactionAmount).toBe(0);
    });
  });
});
