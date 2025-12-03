import { databaseService } from './databaseService';
import { transactionRepository } from './transactionRepository';
import { categoryRepository } from './categoryRepository';
import {
  MonthlyReport,
  CategoryReport,
  TrendReport,
  ReportPeriod,
  ExportFormat,
  TransactionSummary,
  CategoryStats,
  TrendData,
  MonthlyStats
} from '../types/reports';
import { Transaction, CategoryType } from '../types/transaction';
import { formatCurrency } from '../utils/helpers';

export interface ReportFilters {
  startDate?: number;
  endDate?: number;
  categoryIds?: string[];
  type?: 'income' | 'expense' | 'both';
  minAmount?: number;
  maxAmount?: number;
}

export interface ExportOptions {
  format: ExportFormat;
  includeCharts?: boolean;
  includeDetails?: boolean;
  companyName?: string;
  reportTitle?: string;
}

export class ReportsService {
  private static instance: ReportsService;

  private constructor() {}

  public static getInstance(): ReportsService {
    if (!ReportsService.instance) {
      ReportsService.instance = new ReportsService();
    }
    return ReportsService.instance;
  }

  /**
   * Generate monthly report for a specific month/year
   */
  public async generateMonthlyReport(year: number, month: number): Promise<MonthlyReport> {
    try {
      const startDate = new Date(year, month - 1, 1).getTime();
      const endDate = new Date(year, month, 0, 23, 59, 59, 999).getTime();

      // Get all transactions for the month
      const transactions = await transactionRepository.getTransactions({
        startDate,
        endDate,
        limit: 10000, // Get all transactions
      });

      // Get category statistics for the month
      const categoryStats = await categoryRepository.getCategoryStats(startDate, endDate);

      // Calculate summary statistics
      const summary = this.calculateTransactionSummary(transactions.transactions, startDate, endDate);

      // Find top categories
      const topIncomeCategories = categoryStats
        .filter(stat => stat.totalIncome > 0)
        .sort((a, b) => b.totalIncome - a.totalIncome)
        .slice(0, 5);

      const topExpenseCategories = categoryStats
        .filter(stat => stat.totalExpense > 0)
        .sort((a, b) => b.totalExpense - a.totalExpense)
        .slice(0, 5);

      // Calculate comparison with previous month
      const previousMonthStart = new Date(year, month - 2, 1).getTime();
      const previousMonthEnd = new Date(year, month - 1, 0, 23, 59, 59, 999).getTime();

      const previousMonthTransactions = await transactionRepository.getTransactions({
        startDate: previousMonthStart,
        endDate: previousMonthEnd,
        limit: 10000,
      });

      const previousMonthSummary = this.calculateTransactionSummary(
        previousMonthTransactions.transactions,
        previousMonthStart,
        previousMonthEnd
      );

      // Calculate changes
      const incomeChange = summary.totalIncome - previousMonthSummary.totalIncome;
      const expenseChange = summary.totalExpense - previousMonthSummary.totalExpense;
      const netChange = summary.netAmount - previousMonthSummary.netAmount;

      return {
        period: {
          year,
          month,
          startDate,
          endDate,
          label: this.formatMonthYear(year, month),
        },
        summary,
        categoryBreakdown: categoryStats,
        topIncomeCategories,
        topExpenseCategories,
        dailyTotals: await this.calculateDailyTotals(transactions.transactions),
        comparison: {
          previousMonth: previousMonthSummary,
          changes: {
            income: {
              amount: incomeChange,
              percentage: previousMonthSummary.totalIncome > 0 ?
                (incomeChange / previousMonthSummary.totalIncome) * 100 : 0,
            },
            expense: {
              amount: expenseChange,
              percentage: previousMonthSummary.totalExpense > 0 ?
                (expenseChange / previousMonthSummary.totalExpense) * 100 : 0,
            },
            net: {
              amount: netChange,
              percentage: Math.abs(previousMonthSummary.netAmount) > 0 ?
                (netChange / Math.abs(previousMonthSummary.netAmount)) * 100 : 0,
            },
          },
        },
        generatedAt: Date.now(),
      };
    } catch (error) {
      throw new Error(`Failed to generate monthly report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate category report with detailed breakdown
   */
  public async generateCategoryReport(filters: ReportFilters = {}): Promise<CategoryReport> {
    try {
      const { startDate, endDate, categoryIds, type } = filters;

      // Get category statistics for the period
      const categoryStats = await categoryRepository.getCategoryStats(startDate, endDate);

      // Filter by category IDs if provided
      const filteredStats = categoryIds && categoryIds.length > 0
        ? categoryStats.filter(stat => categoryIds.includes(stat.categoryId))
        : categoryStats;

      // Filter by type if provided
      const typeFilteredStats = type && type !== 'both'
        ? filteredStats.filter(stat => stat.categoryType === type || stat.categoryType === 'both')
        : filteredStats;

      // Calculate totals
      const totalIncome = typeFilteredStats.reduce((sum, stat) => sum + stat.totalIncome, 0);
      const totalExpense = typeFilteredStats.reduce((sum, stat) => sum + stat.totalExpense, 0);
      const totalTransactions = typeFilteredStats.reduce((sum, stat) => sum + stat.transactionCount, 0);

      // Add percentage calculations
      const statsWithPercentage = typeFilteredStats.map(stat => ({
        ...stat,
        incomePercentage: totalIncome > 0 ? (stat.totalIncome / totalIncome) * 100 : 0,
        expensePercentage: totalExpense > 0 ? (stat.totalExpense / totalExpense) * 100 : 0,
      }));

      // Sort by total amount (income + expense)
      const sortedStats = statsWithPercentage.sort((a, b) =>
        (b.totalIncome + b.totalExpense) - (a.totalIncome + a.totalExpense)
      );

      return {
        period: {
          startDate: startDate || 0,
          endDate: endDate || Date.now(),
          label: this.formatDateRange(startDate, endDate),
        },
        totalIncome,
        totalExpense,
        netAmount: totalIncome - totalExpense,
        totalTransactions,
        categoryStats: sortedStats,
        topCategories: {
          byIncome: sortedStats
            .filter(stat => stat.totalIncome > 0)
            .sort((a, b) => b.totalIncome - a.totalIncome)
            .slice(0, 5),
          byExpense: sortedStats
            .filter(stat => stat.totalExpense > 0)
            .sort((a, b) => b.totalExpense - a.totalExpense)
            .slice(0, 5),
          byTransactions: sortedStats
            .sort((a, b) => b.transactionCount - a.transactionCount)
            .slice(0, 5),
        },
        filters,
        generatedAt: Date.now(),
      };
    } catch (error) {
      throw new Error(`Failed to generate category report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate trend report for specified period
   */
  public async generateTrendReport(
    period: ReportPeriod,
    filters: ReportFilters = {}
  ): Promise<TrendReport> {
    try {
      const { startDate, endDate } = this.calculatePeriodDates(period);

      let trendData: TrendData[];

      switch (period) {
        case 'last6months':
        case 'last12months':
          trendData = await this.calculateMonthlyTrends(startDate, endDate, filters);
          break;
        case 'last30days':
        case 'last90days':
          trendData = await this.calculateDailyTrends(startDate, endDate, filters);
          break;
        case 'thisyear':
        case 'lastyear':
          trendData = await this.calculateMonthlyTrends(startDate, endDate, filters);
          break;
        default:
          trendData = await this.calculateMonthlyTrends(startDate, endDate, filters);
      }

      // Calculate trend direction
      const trendDirection = this.calculateTrendDirection(trendData);

      // Find peak and low points
      const peakIncome = trendData.reduce((max, curr) =>
        curr.income > max.income ? curr : max, trendData[0]);
      const peakExpense = trendData.reduce((max, curr) =>
        curr.expense > max.expense ? curr : max, trendData[0]);
      const lowIncome = trendData.reduce((min, curr) =>
        curr.income < min.income ? curr : min, trendData[0]);
      const lowExpense = trendData.reduce((min, curr) =>
        curr.expense < min.expense ? curr : min, trendData[0]);

      return {
        period: {
          type: period,
          startDate,
          endDate,
          label: this.formatPeriodLabel(period),
        },
        trendData,
        statistics: {
          totalIncome: trendData.reduce((sum, data) => sum + data.income, 0),
          totalExpense: trendData.reduce((sum, data) => sum + data.expense, 0),
          averageIncome: trendData.reduce((sum, data) => sum + data.income, 0) / trendData.length,
          averageExpense: trendData.reduce((sum, data) => sum + data.expense, 0) / trendData.length,
          peakIncome: peakIncome.income,
          peakExpense: peakExpense.expense,
          lowIncome: lowIncome.income,
          lowExpense: lowExpense.expense,
          trend: trendDirection,
        },
        insights: this.generateTrendInsights(trendData, trendDirection),
        filters,
        generatedAt: Date.now(),
      };
    } catch (error) {
      throw new Error(`Failed to generate trend report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Export report data in specified format
   */
  public async exportReport(
    reportData: MonthlyReport | CategoryReport | TrendReport,
    options: ExportOptions
  ): Promise<string> {
    try {
      switch (options.format) {
        case 'csv':
          return this.exportToCSV(reportData, options);
        case 'pdf':
          return this.exportToPDF(reportData, options);
        case 'excel':
          return this.exportToExcel(reportData, options);
        case 'json':
          return this.exportToJSON(reportData, options);
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }
    } catch (error) {
      throw new Error(`Failed to export report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get dashboard summary for quick overview
   */
  public async getDashboardSummary(): Promise<{
    currentMonth: MonthlyStats;
    previousMonth: MonthlyStats;
    yearToDate: TransactionSummary;
    topCategories: CategoryStats[];
    recentTrend: TrendData[];
  }> {
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      // Current month stats
      const currentMonthReport = await this.generateMonthlyReport(currentYear, currentMonth);

      // Previous month stats
      const previousMonthDate = new Date(currentYear, currentMonth - 2, 1);
      const previousMonthReport = await this.generateMonthlyReport(
        previousMonthDate.getFullYear(),
        previousMonthDate.getMonth() + 1
      );

      // Year to date stats
      const yearStartDate = new Date(currentYear, 0, 1).getTime();
      const yearEndDate = now.getTime();

      const yearTransactions = await transactionRepository.getTransactions({
        startDate: yearStartDate,
        endDate: yearEndDate,
        limit: 10000,
      });

      const yearToDateSummary = this.calculateTransactionSummary(
        yearTransactions.transactions,
        yearStartDate,
        yearEndDate
      );

      // Top categories (last 3 months)
      const threeMonthsAgo = new Date(currentYear, currentMonth - 4, 1).getTime();
      const topCategories = await categoryRepository.getCategoryStats(threeMonthsAgo, now.getTime());

      // Recent trend (last 6 months)
      const sixMonthsAgo = new Date(currentYear, currentMonth - 7, 1).getTime();
      const recentTrend = await this.calculateMonthlyTrends(sixMonthsAgo, now.getTime());

      return {
        currentMonth: {
          month: currentMonth,
          year: currentYear,
          income: currentMonthReport.summary.totalIncome,
          expense: currentMonthReport.summary.totalExpense,
          balance: currentMonthReport.summary.netAmount,
          transactionCount: currentMonthReport.summary.transactionCount,
          avgTransactionAmount: currentMonthReport.summary.averageTransaction,
          topCategory: currentMonthReport.topExpenseCategories[0] ? {
            id: currentMonthReport.topExpenseCategories[0].categoryId,
            name: currentMonthReport.topExpenseCategories[0].categoryName,
            amount: currentMonthReport.topExpenseCategories[0].totalExpense,
          } : null,
          categoryBreakdown: currentMonthReport.categoryBreakdown,
        },
        previousMonth: {
          month: previousMonthDate.getMonth() + 1,
          year: previousMonthDate.getFullYear(),
          income: previousMonthReport.summary.totalIncome,
          expense: previousMonthReport.summary.totalExpense,
          balance: previousMonthReport.summary.netAmount,
          transactionCount: previousMonthReport.summary.transactionCount,
          avgTransactionAmount: previousMonthReport.summary.averageTransaction,
          topCategory: previousMonthReport.topExpenseCategories[0] ? {
            id: previousMonthReport.topExpenseCategories[0].categoryId,
            name: previousMonthReport.topExpenseCategories[0].categoryName,
            amount: previousMonthReport.topExpenseCategories[0].totalExpense,
          } : null,
          categoryBreakdown: previousMonthReport.categoryBreakdown,
        },
        yearToDate: yearToDateSummary,
        topCategories: topCategories.slice(0, 5),
        recentTrend: recentTrend.slice(-6), // Last 6 months
      };
    } catch (error) {
      throw new Error(`Failed to get dashboard summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Private helper methods

  private calculateTransactionSummary(
    transactions: Transaction[],
    startDate: number,
    endDate: number
  ): TransactionSummary {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const categoriesUsed = new Set(transactions.map(t => t.categoryId)).size;

    return {
      totalIncome,
      totalExpense,
      netAmount: totalIncome - totalExpense,
      transactionCount: transactions.length,
      averageTransaction: transactions.length > 0 ?
        (totalIncome + totalExpense) / transactions.length : 0,
      categoriesUsed,
      period: { start: startDate, end: endDate },
    };
  }

  private async calculateDailyTotals(transactions: Transaction[]): Promise<{ date: string; income: number; expense: number }[]> {
    const dailyTotals = new Map<string, { income: number; expense: number }>();

    transactions.forEach(transaction => {
      const dateKey = new Date(transaction.date).toISOString().split('T')[0];
      const existing = dailyTotals.get(dateKey) || { income: 0, expense: 0 };

      if (transaction.type === 'income') {
        existing.income += transaction.amount;
      } else {
        existing.expense += transaction.amount;
      }

      dailyTotals.set(dateKey, existing);
    });

    return Array.from(dailyTotals.entries()).map(([date, totals]) => ({
      date,
      ...totals,
    })).sort((a, b) => a.date.localeCompare(b.date));
  }

  private async calculateMonthlyTrends(
    startDate: number,
    endDate: number,
    filters: ReportFilters = {}
  ): Promise<TrendData[]> {
    const trendData: TrendData[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    let current = new Date(start.getFullYear(), start.getMonth(), 1);

    while (current <= end) {
      const monthStart = new Date(current.getFullYear(), current.getMonth(), 1).getTime();
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0, 23, 59, 59, 999).getTime();

      const transactions = await transactionRepository.getTransactions({
        startDate: monthStart,
        endDate: monthEnd,
        categoryIds: filters.categoryIds,
        type: filters.type,
        minAmount: filters.minAmount,
        maxAmount: filters.maxAmount,
        limit: 10000,
      });

      const income = transactions.transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expense = transactions.transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      trendData.push({
        period: this.formatMonthYear(current.getFullYear(), current.getMonth() + 1),
        value: income - expense,
        income,
        expense,
        change: 0, // Will be calculated after all data is collected
        changePercent: 0, // Will be calculated after all data is collected
      });

      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }

    // Calculate changes
    for (let i = 1; i < trendData.length; i++) {
      const current = trendData[i];
      const previous = trendData[i - 1];

      current.change = current.value - previous.value;
      current.changePercent = previous.value !== 0 ?
        (current.change / Math.abs(previous.value)) * 100 : 0;
    }

    return trendData;
  }

  private async calculateDailyTrends(
    startDate: number,
    endDate: number,
    filters: ReportFilters = {}
  ): Promise<TrendData[]> {
    const trendData: TrendData[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    let current = new Date(start);

    while (current <= end) {
      const dayStart = new Date(current.getFullYear(), current.getMonth(), current.getDate()).getTime();
      const dayEnd = new Date(current.getFullYear(), current.getMonth(), current.getDate(), 23, 59, 59, 999).getTime();

      const transactions = await transactionRepository.getTransactions({
        startDate: dayStart,
        endDate: dayEnd,
        categoryIds: filters.categoryIds,
        type: filters.type,
        minAmount: filters.minAmount,
        maxAmount: filters.maxAmount,
        limit: 10000,
      });

      const income = transactions.transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expense = transactions.transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      trendData.push({
        period: current.toISOString().split('T')[0],
        value: income - expense,
        income,
        expense,
        change: 0,
        changePercent: 0,
      });

      current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
    }

    // Calculate changes
    for (let i = 1; i < trendData.length; i++) {
      const current = trendData[i];
      const previous = trendData[i - 1];

      current.change = current.value - previous.value;
      current.changePercent = previous.value !== 0 ?
        (current.change / Math.abs(previous.value)) * 100 : 0;
    }

    return trendData;
  }

  private calculateTrendDirection(trendData: TrendData[]): 'up' | 'down' | 'stable' {
    if (trendData.length < 2) return 'stable';

    const changes = trendData.slice(1).map(data => data.change);
    const positiveChanges = changes.filter(change => change > 0).length;
    const negativeChanges = changes.filter(change => change < 0).length;

    const positiveRatio = positiveChanges / changes.length;

    if (positiveRatio > 0.6) return 'up';
    if (positiveRatio < 0.4) return 'down';
    return 'stable';
  }

  private generateTrendInsights(trendData: TrendData[], trend: 'up' | 'down' | 'stable'): string[] {
    const insights: string[] = [];

    // Basic trend insight
    switch (trend) {
      case 'up':
        insights.push('Ihr Netto-Cashflow zeigt einen positiven Trend.');
        break;
      case 'down':
        insights.push('Ihr Netto-Cashflow zeigt einen negativen Trend.');
        break;
      case 'stable':
        insights.push('Ihr Netto-Cashflow ist relativ stabil.');
        break;
    }

    // Volatility insight
    const values = trendData.map(data => data.value);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);
    const volatility = standardDeviation / Math.abs(average);

    if (volatility > 0.5) {
      insights.push('Ihre Finanzen zeigen hohe Volatilität.');
    } else if (volatility < 0.2) {
      insights.push('Ihre Finanzen sind sehr stabil.');
    }

    // Income vs Expense insights
    const totalIncome = trendData.reduce((sum, data) => sum + data.income, 0);
    const totalExpense = trendData.reduce((sum, data) => sum + data.expense, 0);

    if (totalIncome > totalExpense * 1.2) {
      insights.push('Sie haben einen gesunden Überschuss an Einnahmen.');
    } else if (totalExpense > totalIncome) {
      insights.push('Ihre Ausgaben übersteigen Ihre Einnahmen.');
    }

    return insights;
  }

  private calculatePeriodDates(period: ReportPeriod): { startDate: number; endDate: number } {
    const now = new Date();
    const endDate = now.getTime();
    let startDate: number;

    switch (period) {
      case 'last30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).getTime();
        break;
      case 'last90days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).getTime();
        break;
      case 'last6months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1).getTime();
        break;
      case 'last12months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 12, 1).getTime();
        break;
      case 'thisyear':
        startDate = new Date(now.getFullYear(), 0, 1).getTime();
        break;
      case 'lastyear':
        startDate = new Date(now.getFullYear() - 1, 0, 1).getTime();
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
    }

    return { startDate, endDate };
  }

  private formatMonthYear(year: number, month: number): string {
    const monthNames = [
      'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];
    return `${monthNames[month - 1]} ${year}`;
  }

  private formatDateRange(startDate?: number, endDate?: number): string {
    if (!startDate && !endDate) return 'Alle Zeit';
    if (!startDate) return `Bis ${new Date(endDate!).toLocaleDateString('de-DE')}`;
    if (!endDate) return `Ab ${new Date(startDate).toLocaleDateString('de-DE')}`;

    return `${new Date(startDate).toLocaleDateString('de-DE')} - ${new Date(endDate).toLocaleDateString('de-DE')}`;
  }

  private formatPeriodLabel(period: ReportPeriod): string {
    const periodLabels = {
      last30days: 'Letzte 30 Tage',
      last90days: 'Letzte 90 Tage',
      last6months: 'Letzte 6 Monate',
      last12months: 'Letzte 12 Monate',
      thisyear: 'Dieses Jahr',
      lastyear: 'Letztes Jahr',
    };
    return periodLabels[period];
  }

  // Export methods (simplified implementations)
  private async exportToCSV(reportData: any, options: ExportOptions): Promise<string> {
    // This would be implemented with a proper CSV library
    return 'CSV export not yet implemented';
  }

  private async exportToPDF(reportData: any, options: ExportOptions): Promise<string> {
    // This would be implemented with a proper PDF library like react-native-pdf
    return 'PDF export not yet implemented';
  }

  private async exportToExcel(reportData: any, options: ExportOptions): Promise<string> {
    // This would be implemented with a proper Excel library
    return 'Excel export not yet implemented';
  }

  private async exportToJSON(reportData: any, options: ExportOptions): Promise<string> {
    return JSON.stringify(reportData, null, 2);
  }
}

export const reportsService = ReportsService.getInstance();
