import { reportsService } from '../../src/services/reportsService';
import { databaseService } from '../../src/services/databaseService';
import { transactionRepository } from '../../src/services/transactionRepository';
import { categoryRepository } from '../../src/services/categoryRepository';
import {
  MonthlyReport,
  CategoryReport,
  TrendReport,
  ReportPeriod,
  ExportFormat
} from '../../src/types/reports';

// Mock dependencies
jest.mock('../../src/services/databaseService');
jest.mock('../../src/services/transactionRepository');
jest.mock('../../src/services/categoryRepository');

describe('ReportsService - Sprint 5 Features', () => {
  const mockTransactionRepository = transactionRepository as jest.Mocked<typeof transactionRepository>;
  const mockCategoryRepository = categoryRepository as jest.Mocked<typeof categoryRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(1640995200000); // Mock timestamp
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('generateMonthlyReport', () => {
    const mockTransactions = [
      {
        id: 'tx-1',
        amount: 100,
        description: 'Income 1',
        date: 1640995200000,
        type: 'income' as const,
        categoryId: 'cat-1',
        createdAt: 1640995200,
        updatedAt: 1640995200,
      },
      {
        id: 'tx-2',
        amount: 50,
        description: 'Expense 1',
        date: 1640995200000,
        type: 'expense' as const,
        categoryId: 'cat-2',
        createdAt: 1640995200,
        updatedAt: 1640995200,
      },
    ];

    const mockCategoryStats = [
      {
        categoryId: 'cat-1',
        categoryName: 'Salary',
        categoryIcon: '💰',
        categoryColor: '#10B981',
        categoryType: 'income' as const,
        transactionCount: 1,
        totalIncome: 100,
        totalExpense: 0,
        totalAmount: 100,
        averageAmount: 100,
        minAmount: 100,
        maxAmount: 100,
        firstTransactionDate: 1640995200000,
        lastTransactionDate: 1640995200000,
      },
      {
        categoryId: 'cat-2',
        categoryName: 'Food',
        categoryIcon: '🍔',
        categoryColor: '#EF4444',
        categoryType: 'expense' as const,
        transactionCount: 1,
        totalIncome: 0,
        totalExpense: 50,
        totalAmount: 50,
        averageAmount: 50,
        minAmount: 50,
        maxAmount: 50,
        firstTransactionDate: 1640995200000,
        lastTransactionDate: 1640995200000,
      },
    ];

    it('should generate monthly report successfully', async () => {
      mockTransactionRepository.getTransactions
        .mockResolvedValueOnce({ // Current month transactions
          transactions: mockTransactions,
          totalCount: 2,
          hasMore: false,
        })
        .mockResolvedValueOnce({ // Previous month transactions
          transactions: [
            {
              id: 'tx-prev-1',
              amount: 80,
              description: 'Previous Income',
              date: 1638403200000, // Previous month
              type: 'income' as const,
              categoryId: 'cat-1',
              createdAt: 1638403200,
              updatedAt: 1638403200,
            },
          ],
          totalCount: 1,
          hasMore: false,
        });

      mockCategoryRepository.getCategoryStats.mockResolvedValueOnce(mockCategoryStats);

      const report = await reportsService.generateMonthlyReport(2022, 1);

      expect(report).toBeDefined();
      expect(report.period.year).toBe(2022);
      expect(report.period.month).toBe(1);
      expect(report.summary.totalIncome).toBe(100);
      expect(report.summary.totalExpense).toBe(50);
      expect(report.summary.netAmount).toBe(50);
      expect(report.summary.transactionCount).toBe(2);
      expect(report.categoryBreakdown).toHaveLength(2);
      expect(report.comparison).toBeDefined();
      expect(report.comparison.changes.income.amount).toBe(20); // 100 - 80
    });

    it('should calculate daily totals correctly', async () => {
      mockTransactionRepository.getTransactions.mockResolvedValueOnce({
        transactions: mockTransactions,
        totalCount: 2,
        hasMore: false,
      }).mockResolvedValueOnce({
        transactions: [],
        totalCount: 0,
        hasMore: false,
      });

      mockCategoryRepository.getCategoryStats.mockResolvedValueOnce(mockCategoryStats);

      const report = await reportsService.generateMonthlyReport(2022, 1);

      expect(report.dailyTotals).toBeInstanceOf(Array);
      expect(report.dailyTotals.length).toBeGreaterThan(0);

      const dayTotal = report.dailyTotals.find(total => total.date === '2022-01-01');
      expect(dayTotal).toBeDefined();
      expect(dayTotal?.income).toBe(100);
      expect(dayTotal?.expense).toBe(50);
    });

    it('should identify top categories correctly', async () => {
      const mockMultipleCategories = [
        ...mockCategoryStats,
        {
          categoryId: 'cat-3',
          categoryName: 'Transport',
          categoryIcon: '🚗',
          categoryColor: '#3B82F6',
          categoryType: 'expense' as const,
          transactionCount: 2,
          totalIncome: 0,
          totalExpense: 75,
          totalAmount: 75,
          averageAmount: 37.5,
          minAmount: 25,
          maxAmount: 50,
          firstTransactionDate: 1640995200000,
          lastTransactionDate: 1640995200000,
        },
      ];

      mockTransactionRepository.getTransactions
        .mockResolvedValueOnce({
          transactions: mockTransactions,
          totalCount: 2,
          hasMore: false,
        })
        .mockResolvedValueOnce({
          transactions: [],
          totalCount: 0,
          hasMore: false,
        });

      mockCategoryRepository.getCategoryStats.mockResolvedValueOnce(mockMultipleCategories);

      const report = await reportsService.generateMonthlyReport(2022, 1);

      expect(report.topExpenseCategories).toHaveLength(2);
      expect(report.topExpenseCategories[0].categoryName).toBe('Transport'); // Higher expense
      expect(report.topExpenseCategories[1].categoryName).toBe('Food');

      expect(report.topIncomeCategories).toHaveLength(1);
      expect(report.topIncomeCategories[0].categoryName).toBe('Salary');
    });

    it('should handle error when transaction retrieval fails', async () => {
      mockTransactionRepository.getTransactions.mockRejectedValueOnce(new Error('Database error'));

      await expect(reportsService.generateMonthlyReport(2022, 1))
        .rejects
        .toThrow('Failed to generate monthly report: Database error');
    });
  });

  describe('generateCategoryReport', () => {
    it('should generate category report with filters', async () => {
      const filters = {
        startDate: 1640995200000,
        endDate: 1641081600000,
        type: 'expense' as const,
        categoryIds: ['cat-2'],
      };

      const mockCategoryStats = [
        {
          categoryId: 'cat-2',
          categoryName: 'Food',
          categoryIcon: '🍔',
          categoryColor: '#EF4444',
          categoryType: 'expense' as const,
          transactionCount: 5,
          totalIncome: 0,
          totalExpense: 250,
          totalAmount: 250,
          averageAmount: 50,
          minAmount: 25,
          maxAmount: 75,
          firstTransactionDate: 1640995200000,
          lastTransactionDate: 1641081600000,
        },
      ];

      mockCategoryRepository.getCategoryStats.mockResolvedValueOnce(mockCategoryStats);

      const report = await reportsService.generateCategoryReport(filters);

      expect(report).toBeDefined();
      expect(report.totalExpense).toBe(250);
      expect(report.totalIncome).toBe(0);
      expect(report.netAmount).toBe(-250);
      expect(report.totalTransactions).toBe(5);
      expect(report.categoryStats).toHaveLength(1);
      expect(report.categoryStats[0].expensePercentage).toBe(100);
      expect(report.filters).toEqual(filters);
    });

    it('should calculate percentages correctly with multiple categories', async () => {
      const mockMultipleStats = [
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
          lastTransactionDate: 1641081600000,
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
          lastTransactionDate: 1641081600000,
        },
      ];

      mockCategoryRepository.getCategoryStats.mockResolvedValueOnce(mockMultipleStats);

      const report = await reportsService.generateCategoryReport({});

      expect(report.totalExpense).toBe(250);
      expect(report.categoryStats[0].expensePercentage).toBe(60); // 150/250
      expect(report.categoryStats[1].expensePercentage).toBe(40); // 100/250

      // Check sorting (should be by total amount DESC)
      expect(report.categoryStats[0].categoryName).toBe('Food');
      expect(report.categoryStats[1].categoryName).toBe('Transport');
    });

    it('should generate top categories lists', async () => {
      const mockMixedStats = [
        {
          categoryId: 'cat-1',
          categoryName: 'Salary',
          categoryIcon: '💰',
          categoryColor: '#10B981',
          categoryType: 'income' as const,
          transactionCount: 1,
          totalIncome: 2000,
          totalExpense: 0,
          totalAmount: 2000,
          averageAmount: 2000,
          minAmount: 2000,
          maxAmount: 2000,
          firstTransactionDate: 1640995200000,
          lastTransactionDate: 1640995200000,
        },
        {
          categoryId: 'cat-2',
          categoryName: 'Food',
          categoryIcon: '🍔',
          categoryColor: '#EF4444',
          categoryType: 'expense' as const,
          transactionCount: 10,
          totalIncome: 0,
          totalExpense: 300,
          totalAmount: 300,
          averageAmount: 30,
          minAmount: 15,
          maxAmount: 50,
          firstTransactionDate: 1640995200000,
          lastTransactionDate: 1641081600000,
        },
      ];

      mockCategoryRepository.getCategoryStats.mockResolvedValueOnce(mockMixedStats);

      const report = await reportsService.generateCategoryReport({});

      expect(report.topCategories.byIncome).toHaveLength(1);
      expect(report.topCategories.byIncome[0].categoryName).toBe('Salary');

      expect(report.topCategories.byExpense).toHaveLength(1);
      expect(report.topCategories.byExpense[0].categoryName).toBe('Food');

      expect(report.topCategories.byTransactions).toHaveLength(2);
      expect(report.topCategories.byTransactions[0].categoryName).toBe('Food'); // More transactions
    });
  });

  describe('generateTrendReport', () => {
    it('should generate trend report for last 6 months', async () => {
      // Mock transaction data for different months
      const mockMonthlyTransactions = [
        { transactions: [{ amount: 100, type: 'income' as const }], totalCount: 1, hasMore: false },
        { transactions: [{ amount: 50, type: 'expense' as const }], totalCount: 1, hasMore: false },
        { transactions: [{ amount: 150, type: 'income' as const }], totalCount: 1, hasMore: false },
      ];

      mockTransactionRepository.getTransactions
        .mockResolvedValueOnce(mockMonthlyTransactions[0])
        .mockResolvedValueOnce(mockMonthlyTransactions[1])
        .mockResolvedValueOnce(mockMonthlyTransactions[2])
        .mockResolvedValueOnce(mockMonthlyTransactions[0])
        .mockResolvedValueOnce(mockMonthlyTransactions[1])
        .mockResolvedValueOnce(mockMonthlyTransactions[2]);

      const report = await reportsService.generateTrendReport('last6months', {});

      expect(report).toBeDefined();
      expect(report.period.type).toBe('last6months');
      expect(report.trendData).toBeInstanceOf(Array);
      expect(report.trendData.length).toBeGreaterThan(0);
      expect(report.statistics.trend).toMatch(/up|down|stable/);
      expect(report.insights).toBeInstanceOf(Array);
    });

    it('should calculate trend direction correctly', async () => {
      // Mock increasing income trend
      const increasingTrend = [
        { transactions: [{ amount: 1000, type: 'income' as const }], totalCount: 1, hasMore: false },
        { transactions: [{ amount: 1100, type: 'income' as const }], totalCount: 1, hasMore: false },
        { transactions: [{ amount: 1200, type: 'income' as const }], totalCount: 1, hasMore: false },
      ];

      mockTransactionRepository.getTransactions
        .mockResolvedValueOnce(increasingTrend[0])
        .mockResolvedValueOnce(increasingTrend[1])
        .mockResolvedValueOnce(increasingTrend[2]);

      const report = await reportsService.generateTrendReport('last90days', {});

      expect(report.statistics.trend).toBe('up');
      expect(report.insights).toContain('Ihr Netto-Cashflow zeigt einen positiven Trend.');
    });

    it('should generate insights based on data patterns', async () => {
      const stableData = [
        { transactions: [{ amount: 1000, type: 'income' as const }, { amount: 500, type: 'expense' as const }], totalCount: 2, hasMore: false },
        { transactions: [{ amount: 1000, type: 'income' as const }, { amount: 500, type: 'expense' as const }], totalCount: 2, hasMore: false },
        { transactions: [{ amount: 1000, type: 'income' as const }, { amount: 500, type: 'expense' as const }], totalCount: 2, hasMore: false },
      ];

      mockTransactionRepository.getTransactions
        .mockResolvedValueOnce(stableData[0])
        .mockResolvedValueOnce(stableData[1])
        .mockResolvedValueOnce(stableData[2]);

      const report = await reportsService.generateTrendReport('last90days', {});

      expect(report.insights).toContain('Ihre Finanzen sind sehr stabil.');
      expect(report.insights).toContain('Sie haben einen gesunden Überschuss an Einnahmen.');
    });

    it('should calculate correct statistics', async () => {
      const mockData = [
        { transactions: [
          { amount: 1000, type: 'income' as const },
          { amount: 300, type: 'expense' as const }
        ], totalCount: 2, hasMore: false },
        { transactions: [
          { amount: 1200, type: 'income' as const },
          { amount: 400, type: 'expense' as const }
        ], totalCount: 2, hasMore: false },
      ];

      mockTransactionRepository.getTransactions
        .mockResolvedValueOnce(mockData[0])
        .mockResolvedValueOnce(mockData[1]);

      const report = await reportsService.generateTrendReport('last30days', {});

      expect(report.statistics.totalIncome).toBe(2200); // 1000 + 1200
      expect(report.statistics.totalExpense).toBe(700); // 300 + 400
      expect(report.statistics.averageIncome).toBe(1100); // 2200 / 2
      expect(report.statistics.averageExpense).toBe(350); // 700 / 2
      expect(report.statistics.peakIncome).toBe(1200);
      expect(report.statistics.peakExpense).toBe(400);
    });
  });

  describe('getDashboardSummary', () => {
    it('should generate comprehensive dashboard summary', async () => {
      // Mock current month report
      const mockCurrentMonthReport = {
        summary: {
          totalIncome: 3000,
          totalExpense: 2000,
          netAmount: 1000,
          transactionCount: 25,
          averageTransaction: 200,
          categoriesUsed: 8,
          period: { start: 1640995200000, end: 1643673600000 },
        },
        topExpenseCategories: [{
          categoryId: 'cat-1',
          categoryName: 'Food',
          totalExpense: 500,
          categoryIcon: '🍔',
          categoryColor: '#EF4444',
          categoryType: 'expense' as const,
          transactionCount: 15,
          totalIncome: 0,
          totalAmount: 500,
          averageAmount: 33.33,
          minAmount: 10,
          maxAmount: 80,
          firstTransactionDate: 1640995200000,
          lastTransactionDate: 1643673600000,
        }],
        categoryBreakdown: [],
        period: { year: 2022, month: 1 },
        generatedAt: 1640995200000,
      };

      // Mock the generateMonthlyReport method
      jest.spyOn(reportsService, 'generateMonthlyReport')
        .mockResolvedValueOnce(mockCurrentMonthReport as any)
        .mockResolvedValueOnce(mockCurrentMonthReport as any); // Previous month

      mockTransactionRepository.getTransactions.mockResolvedValueOnce({
        transactions: [
          { amount: 10000, type: 'income' as const },
          { amount: 8000, type: 'expense' as const }
        ],
        totalCount: 2,
        hasMore: false,
      });

      mockCategoryRepository.getCategoryStats.mockResolvedValueOnce([
        {
          categoryId: 'cat-1',
          categoryName: 'Food',
          categoryIcon: '🍔',
          categoryColor: '#EF4444',
          categoryType: 'expense' as const,
          transactionCount: 50,
          totalIncome: 0,
          totalExpense: 1500,
          totalAmount: 1500,
          averageAmount: 30,
          minAmount: 10,
          maxAmount: 80,
          firstTransactionDate: 1640995200000,
          lastTransactionDate: 1643673600000,
        },
      ]);

      const summary = await reportsService.getDashboardSummary();

      expect(summary).toBeDefined();
      expect(summary.currentMonth).toBeDefined();
      expect(summary.previousMonth).toBeDefined();
      expect(summary.yearToDate).toBeDefined();
      expect(summary.topCategories).toHaveLength(1);
      expect(summary.recentTrend).toBeInstanceOf(Array);

      expect(summary.currentMonth.income).toBe(3000);
      expect(summary.currentMonth.expense).toBe(2000);
      expect(summary.currentMonth.balance).toBe(1000);
      expect(summary.yearToDate.totalIncome).toBe(10000);
      expect(summary.yearToDate.totalExpense).toBe(8000);
    });
  });

  describe('exportReport', () => {
    const mockReport = {
      period: { label: 'January 2022' },
      generatedAt: 1640995200000,
      summary: {
        totalIncome: 3000,
        totalExpense: 2000,
        netAmount: 1000,
      },
    };

    it('should export report as JSON', async () => {
      const result = await reportsService.exportReport(mockReport as any, {
        format: 'json',
        includeCharts: true,
        includeDetails: true,
      });

      expect(result).toBe(JSON.stringify(mockReport, null, 2));
    });

    it('should handle unsupported export formats', async () => {
      await expect(reportsService.exportReport(mockReport as any, {
        format: 'xml' as any,
        includeCharts: true,
        includeDetails: true,
      })).rejects.toThrow('Unsupported export format: xml');
    });

    it('should return placeholder for CSV export', async () => {
      const result = await reportsService.exportReport(mockReport as any, {
        format: 'csv',
        includeCharts: false,
        includeDetails: true,
      });

      expect(result).toBe('CSV export not yet implemented');
    });

    it('should return placeholder for PDF export', async () => {
      const result = await reportsService.exportReport(mockReport as any, {
        format: 'pdf',
        includeCharts: true,
        includeDetails: true,
      });

      expect(result).toBe('PDF export not yet implemented');
    });
  });

  describe('error handling', () => {
    it('should handle category stats service errors', async () => {
      mockCategoryRepository.getCategoryStats.mockRejectedValueOnce(new Error('Category service error'));

      await expect(reportsService.generateCategoryReport({}))
        .rejects
        .toThrow('Failed to generate category report: Category service error');
    });

    it('should handle transaction service errors in trend reports', async () => {
      mockTransactionRepository.getTransactions.mockRejectedValueOnce(new Error('Transaction service error'));

      await expect(reportsService.generateTrendReport('last30days', {}))
        .rejects
        .toThrow('Failed to generate trend report: Transaction service error');
    });

    it('should handle invalid period types gracefully', async () => {
      mockTransactionRepository.getTransactions.mockResolvedValue({
        transactions: [],
        totalCount: 0,
        hasMore: false,
      });

      const result = await reportsService.generateTrendReport('invalid_period' as any, {});

      expect(result.period.type).toBe('invalid_period');
      expect(result.trendData).toBeInstanceOf(Array);
    });
  });

  describe('performance edge cases', () => {
    it('should handle large datasets efficiently', async () => {
      // Mock large transaction dataset
      const largeTransactionSet = Array.from({ length: 1000 }, (_, i) => ({
        id: `tx-${i}`,
        amount: Math.random() * 1000,
        description: `Transaction ${i}`,
        date: 1640995200000 + (i * 86400000), // One per day
        type: i % 2 === 0 ? 'income' as const : 'expense' as const,
        categoryId: `cat-${i % 10}`,
        createdAt: 1640995200,
        updatedAt: 1640995200,
      }));

      mockTransactionRepository.getTransactions
        .mockResolvedValueOnce({
          transactions: largeTransactionSet,
          totalCount: 1000,
          hasMore: false,
        })
        .mockResolvedValueOnce({
          transactions: [],
          totalCount: 0,
          hasMore: false,
        });

      mockCategoryRepository.getCategoryStats.mockResolvedValueOnce([]);

      const startTime = Date.now();
      const report = await reportsService.generateMonthlyReport(2022, 1);
      const endTime = Date.now();

      expect(report).toBeDefined();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(report.summary.transactionCount).toBe(1000);
    });

    it('should handle empty datasets gracefully', async () => {
      mockTransactionRepository.getTransactions.mockResolvedValue({
        transactions: [],
        totalCount: 0,
        hasMore: false,
      });

      mockCategoryRepository.getCategoryStats.mockResolvedValueOnce([]);

      const report = await reportsService.generateMonthlyReport(2022, 1);

      expect(report).toBeDefined();
      expect(report.summary.totalIncome).toBe(0);
      expect(report.summary.totalExpense).toBe(0);
      expect(report.summary.transactionCount).toBe(0);
      expect(report.categoryBreakdown).toHaveLength(0);
      expect(report.topExpenseCategories).toHaveLength(0);
    });
  });
});
