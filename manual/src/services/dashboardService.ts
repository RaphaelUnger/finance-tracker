import { reportsService } from './reportsService';
import { transactionRepository } from './transactionRepository';
import { categoryRepository } from './categoryRepository';
import {
  DashboardSummary,
  MonthlyStats,
  DashboardWidget,
  ChartData,
  WidgetConfig
} from '../types/dashboard';
import { Transaction, CategoryStats } from '../types/transaction';
import { formatCurrency, formatPercentage } from '../utils/helpers';

export interface DashboardFilters {
  timeRange?: 'week' | 'month' | 'quarter' | 'year';
  categories?: string[];
  transactionType?: 'income' | 'expense' | 'both';
}

export interface WidgetData {
  id: string;
  type: string;
  title: string;
  data: any;
  config: WidgetConfig;
  lastUpdated: number;
}

export class DashboardService {
  private static instance: DashboardService;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

  private constructor() {}

  public static getInstance(): DashboardService {
    if (!DashboardService.instance) {
      DashboardService.instance = new DashboardService();
    }
    return DashboardService.instance;
  }

  /**
   * Get comprehensive dashboard summary with enhanced widgets
   */
  public async getDashboardSummary(filters: DashboardFilters = {}): Promise<DashboardSummary> {
    try {
      const cacheKey = `dashboard_${JSON.stringify(filters)}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;

      // Get current date range based on filter
      const { startDate, endDate } = this.getDateRange(filters.timeRange || 'month');

      // Get transactions for the period
      const transactions = await transactionRepository.getTransactions({
        startDate,
        endDate,
        type: filters.transactionType,
        categoryIds: filters.categories,
        limit: 10000,
      });

      // Get category statistics
      const categoryStats = await categoryRepository.getCategoryStats(startDate, endDate);

      // Calculate enhanced summary
      const summary = this.calculateEnhancedSummary(
        transactions.transactions,
        categoryStats,
        startDate,
        endDate
      );

      // Generate widgets data
      const widgets = await this.generateWidgets(
        transactions.transactions,
        categoryStats,
        filters
      );

      const dashboardData: DashboardSummary = {
        ...summary,
        widgets,
        lastUpdated: Date.now(),
        performance: {
          dataPoints: transactions.transactions.length,
          categories: categoryStats.length,
          renderTime: Date.now(),
        },
      };

      // Cache the result
      this.setCachedData(cacheKey, dashboardData);

      return dashboardData;
    } catch (error) {
      throw new Error(`Failed to get dashboard summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate individual widget data
   */
  public async getWidgetData(widgetType: string, config: WidgetConfig): Promise<WidgetData> {
    try {
      const { timeRange = 'month', categories, transactionType } = config.filters || {};
      const { startDate, endDate } = this.getDateRange(timeRange);

      switch (widgetType) {
        case 'balance':
          return this.generateBalanceWidget(startDate, endDate, config);
        case 'monthlyOverview':
          return this.generateMonthlyOverviewWidget(startDate, endDate, config);
        case 'categoryBreakdown':
          return this.generateCategoryBreakdownWidget(startDate, endDate, config);
        case 'topCategories':
          return this.generateTopCategoriesWidget(startDate, endDate, config);
        case 'trendChart':
          return this.generateTrendChartWidget(startDate, endDate, config);
        case 'quickStats':
          return this.generateQuickStatsWidget(startDate, endDate, config);
        default:
          throw new Error(`Unknown widget type: ${widgetType}`);
      }
    } catch (error) {
      throw new Error(`Failed to generate widget data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get chart data for specific chart type
   */
  public async getChartData(chartType: string, filters: DashboardFilters = {}): Promise<ChartData> {
    try {
      const { timeRange = 'month' } = filters;
      const { startDate, endDate } = this.getDateRange(timeRange);

      switch (chartType) {
        case 'income-expense-line':
          return this.generateIncomeExpenseLineChart(startDate, endDate, filters);
        case 'category-pie':
          return this.generateCategoryPieChart(startDate, endDate, filters);
        case 'monthly-bar':
          return this.generateMonthlyBarChart(startDate, endDate, filters);
        case 'trend-area':
          return this.generateTrendAreaChart(startDate, endDate, filters);
        default:
          throw new Error(`Unknown chart type: ${chartType}`);
      }
    } catch (error) {
      throw new Error(`Failed to generate chart data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clear dashboard cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Update widget configuration
   */
  public async updateWidgetConfig(widgetId: string, config: WidgetConfig): Promise<WidgetData> {
    try {
      // Extract widget type from ID
      const widgetType = widgetId.split('_')[0];
      return this.getWidgetData(widgetType, config);
    } catch (error) {
      throw new Error(`Failed to update widget config: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Private helper methods

  private async generateWidgets(
    transactions: Transaction[],
    categoryStats: CategoryStats[],
    filters: DashboardFilters
  ): Promise<WidgetData[]> {
    const widgets: WidgetData[] = [];

    // Balance Widget
    const balanceConfig: WidgetConfig = {
      size: 'medium',
      position: { row: 0, col: 0 },
      filters,
    };
    widgets.push(await this.generateBalanceWidget(0, Date.now(), balanceConfig));

    // Monthly Overview Widget
    const monthlyConfig: WidgetConfig = {
      size: 'large',
      position: { row: 0, col: 1 },
      filters,
    };
    widgets.push(await this.generateMonthlyOverviewWidget(0, Date.now(), monthlyConfig));

    // Category Breakdown Widget
    const categoryConfig: WidgetConfig = {
      size: 'medium',
      position: { row: 1, col: 0 },
      filters,
    };
    widgets.push(await this.generateCategoryBreakdownWidget(0, Date.now(), categoryConfig));

    // Top Categories Widget
    const topConfig: WidgetConfig = {
      size: 'medium',
      position: { row: 1, col: 1 },
      filters,
    };
    widgets.push(await this.generateTopCategoriesWidget(0, Date.now(), topConfig));

    // Quick Stats Widget
    const statsConfig: WidgetConfig = {
      size: 'small',
      position: { row: 2, col: 0 },
      filters,
    };
    widgets.push(await this.generateQuickStatsWidget(0, Date.now(), statsConfig));

    return widgets;
  }

  private async generateBalanceWidget(startDate: number, endDate: number, config: WidgetConfig): Promise<WidgetData> {
    const transactions = await transactionRepository.getTransactions({
      startDate,
      endDate,
      limit: 10000,
    });

    const totalIncome = transactions.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpense;

    // Calculate trend vs previous period
    const previousPeriod = await this.getPreviousPeriodData(startDate, endDate);
    const trend = balance - previousPeriod.balance;
    const trendPercent = previousPeriod.balance !== 0 ?
      (trend / Math.abs(previousPeriod.balance)) * 100 : 0;

    return {
      id: 'balance_widget',
      type: 'balance',
      title: 'Aktuelles Saldo',
      data: {
        balance,
        totalIncome,
        totalExpense,
        trend: {
          value: trend,
          percentage: trendPercent,
          direction: trend >= 0 ? 'up' : 'down',
        },
        formatted: {
          balance: formatCurrency(balance),
          income: formatCurrency(totalIncome),
          expense: formatCurrency(totalExpense),
          trend: formatCurrency(Math.abs(trend)),
          trendPercent: formatPercentage(Math.abs(trendPercent)),
        },
      },
      config,
      lastUpdated: Date.now(),
    };
  }

  private async generateMonthlyOverviewWidget(startDate: number, endDate: number, config: WidgetConfig): Promise<WidgetData> {
    const monthlyData = await reportsService.generateMonthlyReport(
      new Date(startDate).getFullYear(),
      new Date(startDate).getMonth() + 1
    );

    // Generate chart data for income vs expense over days
    const chartData: ChartData = {
      type: 'line',
      data: monthlyData.dailyTotals.map(day => ({
        name: new Date(day.date).getDate().toString(),
        income: day.income,
        expense: day.expense,
        net: day.income - day.expense,
      })),
      config: {
        title: 'Täglicher Verlauf',
        colors: ['#10B981', '#EF4444', '#6366F1'],
        showLegend: true,
        showGrid: true,
      },
    };

    return {
      id: 'monthly_overview_widget',
      type: 'monthlyOverview',
      title: 'Monatsübersicht',
      data: {
        summary: monthlyData.summary,
        chart: chartData,
        comparison: monthlyData.comparison,
      },
      config,
      lastUpdated: Date.now(),
    };
  }

  private async generateCategoryBreakdownWidget(startDate: number, endDate: number, config: WidgetConfig): Promise<WidgetData> {
    const categoryStats = await categoryRepository.getCategoryStats(startDate, endDate);

    // Filter for expenses only for pie chart
    const expenseCategories = categoryStats
      .filter(stat => stat.totalExpense > 0)
      .sort((a, b) => b.totalExpense - a.totalExpense)
      .slice(0, 8); // Top 8 categories

    const total = expenseCategories.reduce((sum, cat) => sum + cat.totalExpense, 0);

    const chartData: ChartData = {
      type: 'pie',
      data: expenseCategories.map(cat => ({
        name: cat.categoryName,
        value: cat.totalExpense,
        percentage: total > 0 ? (cat.totalExpense / total) * 100 : 0,
        color: cat.categoryColor,
        icon: cat.categoryIcon,
      })),
      config: {
        title: 'Ausgaben nach Kategorien',
        showLegend: true,
        colors: expenseCategories.map(cat => cat.categoryColor),
      },
    };

    return {
      id: 'category_breakdown_widget',
      type: 'categoryBreakdown',
      title: 'Kategorien-Aufschlüsselung',
      data: {
        categories: expenseCategories,
        chart: chartData,
        total: formatCurrency(total),
      },
      config,
      lastUpdated: Date.now(),
    };
  }

  private async generateTopCategoriesWidget(startDate: number, endDate: number, config: WidgetConfig): Promise<WidgetData> {
    const categoryStats = await categoryRepository.getCategoryStats(startDate, endDate);

    const topExpense = categoryStats
      .filter(stat => stat.totalExpense > 0)
      .sort((a, b) => b.totalExpense - a.totalExpense)
      .slice(0, 5);

    const topIncome = categoryStats
      .filter(stat => stat.totalIncome > 0)
      .sort((a, b) => b.totalIncome - a.totalIncome)
      .slice(0, 5);

    return {
      id: 'top_categories_widget',
      type: 'topCategories',
      title: 'Top Kategorien',
      data: {
        topExpense: topExpense.map(cat => ({
          ...cat,
          formattedAmount: formatCurrency(cat.totalExpense),
        })),
        topIncome: topIncome.map(cat => ({
          ...cat,
          formattedAmount: formatCurrency(cat.totalIncome),
        })),
      },
      config,
      lastUpdated: Date.now(),
    };
  }

  private async generateTrendChartWidget(startDate: number, endDate: number, config: WidgetConfig): Promise<WidgetData> {
    // Generate 6-month trend data
    const trendData = [];
    const now = new Date(endDate);

    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);

      const transactions = await transactionRepository.getTransactions({
        startDate: monthStart.getTime(),
        endDate: monthEnd.getTime(),
        limit: 10000,
      });

      const income = transactions.transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expense = transactions.transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      trendData.push({
        name: monthStart.toLocaleDateString('de-DE', { month: 'short' }),
        income,
        expense,
        net: income - expense,
      });
    }

    const chartData: ChartData = {
      type: 'area',
      data: trendData,
      config: {
        title: '6-Monats-Trend',
        colors: ['#10B981', '#EF4444'],
        showLegend: true,
        showGrid: true,
      },
    };

    return {
      id: 'trend_chart_widget',
      type: 'trendChart',
      title: 'Trend-Analyse',
      data: {
        chart: chartData,
        summary: {
          averageIncome: trendData.reduce((sum, d) => sum + d.income, 0) / trendData.length,
          averageExpense: trendData.reduce((sum, d) => sum + d.expense, 0) / trendData.length,
          trend: this.calculateTrend(trendData.map(d => d.net)),
        },
      },
      config,
      lastUpdated: Date.now(),
    };
  }

  private async generateQuickStatsWidget(startDate: number, endDate: number, config: WidgetConfig): Promise<WidgetData> {
    const transactions = await transactionRepository.getTransactions({
      startDate,
      endDate,
      limit: 10000,
    });

    const stats = {
      totalTransactions: transactions.transactions.length,
      avgTransactionAmount: transactions.transactions.length > 0 ?
        transactions.transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.transactions.length : 0,
      topTransactionAmount: transactions.transactions.length > 0 ?
        Math.max(...transactions.transactions.map(t => t.amount)) : 0,
      categoriesUsed: new Set(transactions.transactions.map(t => t.categoryId)).size,
      thisMonthTransactions: transactions.transactions.filter(t => {
        const transactionDate = new Date(t.date);
        const now = new Date();
        return transactionDate.getMonth() === now.getMonth() &&
               transactionDate.getFullYear() === now.getFullYear();
      }).length,
    };

    return {
      id: 'quick_stats_widget',
      type: 'quickStats',
      title: 'Schnell-Statistiken',
      data: {
        stats,
        formatted: {
          totalTransactions: stats.totalTransactions.toString(),
          avgTransactionAmount: formatCurrency(stats.avgTransactionAmount),
          topTransactionAmount: formatCurrency(stats.topTransactionAmount),
          categoriesUsed: stats.categoriesUsed.toString(),
          thisMonthTransactions: stats.thisMonthTransactions.toString(),
        },
      },
      config,
      lastUpdated: Date.now(),
    };
  }

  // Chart generation methods

  private async generateIncomeExpenseLineChart(startDate: number, endDate: number, filters: DashboardFilters): Promise<ChartData> {
    const transactions = await transactionRepository.getTransactions({
      startDate,
      endDate,
      type: filters.transactionType,
      categoryIds: filters.categories,
      limit: 10000,
    });

    // Group by day
    const dailyData = new Map<string, { income: number; expense: number }>();

    transactions.transactions.forEach(transaction => {
      const dateKey = new Date(transaction.date).toISOString().split('T')[0];
      const existing = dailyData.get(dateKey) || { income: 0, expense: 0 };

      if (transaction.type === 'income') {
        existing.income += transaction.amount;
      } else {
        existing.expense += transaction.amount;
      }

      dailyData.set(dateKey, existing);
    });

    const data = Array.from(dailyData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, totals]) => ({
        name: new Date(date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
        income: totals.income,
        expense: totals.expense,
        net: totals.income - totals.expense,
      }));

    return {
      type: 'line',
      data,
      config: {
        title: 'Einnahmen vs. Ausgaben',
        colors: ['#10B981', '#EF4444', '#6366F1'],
        showLegend: true,
        showGrid: true,
        xAxisLabel: 'Datum',
        yAxisLabel: 'Betrag (€)',
      },
    };
  }

  private async generateCategoryPieChart(startDate: number, endDate: number, filters: DashboardFilters): Promise<ChartData> {
    const categoryStats = await categoryRepository.getCategoryStats(startDate, endDate);

    const relevantStats = filters.transactionType === 'income' ?
      categoryStats.filter(stat => stat.totalIncome > 0) :
      filters.transactionType === 'expense' ?
        categoryStats.filter(stat => stat.totalExpense > 0) :
        categoryStats.filter(stat => stat.totalIncome + stat.totalExpense > 0);

    const data = relevantStats
      .sort((a, b) => {
        const aTotal = filters.transactionType === 'income' ? a.totalIncome :
                      filters.transactionType === 'expense' ? a.totalExpense :
                      a.totalIncome + a.totalExpense;
        const bTotal = filters.transactionType === 'income' ? b.totalIncome :
                      filters.transactionType === 'expense' ? b.totalExpense :
                      b.totalIncome + b.totalExpense;
        return bTotal - aTotal;
      })
      .slice(0, 8)
      .map(stat => {
        const value = filters.transactionType === 'income' ? stat.totalIncome :
                     filters.transactionType === 'expense' ? stat.totalExpense :
                     stat.totalIncome + stat.totalExpense;
        return {
          name: stat.categoryName,
          value,
          color: stat.categoryColor,
          icon: stat.categoryIcon,
        };
      });

    return {
      type: 'pie',
      data,
      config: {
        title: `Aufschlüsselung nach Kategorien`,
        showLegend: true,
        colors: data.map(d => d.color),
      },
    };
  }

  private async generateMonthlyBarChart(startDate: number, endDate: number, filters: DashboardFilters): Promise<ChartData> {
    // Generate last 6 months data
    const monthlyData = [];
    const endDateObj = new Date(endDate);

    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(endDateObj.getFullYear(), endDateObj.getMonth() - i, 1);
      const monthEnd = new Date(endDateObj.getFullYear(), endDateObj.getMonth() - i + 1, 0, 23, 59, 59, 999);

      const transactions = await transactionRepository.getTransactions({
        startDate: monthStart.getTime(),
        endDate: monthEnd.getTime(),
        type: filters.transactionType,
        categoryIds: filters.categories,
        limit: 10000,
      });

      const income = transactions.transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expense = transactions.transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      monthlyData.push({
        name: monthStart.toLocaleDateString('de-DE', { month: 'short' }),
        income,
        expense,
        net: income - expense,
      });
    }

    return {
      type: 'bar',
      data: monthlyData,
      config: {
        title: 'Monatlicher Vergleich',
        colors: ['#10B981', '#EF4444'],
        showLegend: true,
        showGrid: true,
        xAxisLabel: 'Monat',
        yAxisLabel: 'Betrag (€)',
      },
    };
  }

  private async generateTrendAreaChart(startDate: number, endDate: number, filters: DashboardFilters): Promise<ChartData> {
    const trendData = await this.generateTrendChartWidget(startDate, endDate, {
      size: 'large',
      position: { row: 0, col: 0 },
      filters
    });

    return (trendData.data as any).chart;
  }

  // Utility methods

  private getDateRange(timeRange: 'week' | 'month' | 'quarter' | 'year'): { startDate: number; endDate: number } {
    const now = new Date();
    const endDate = now.getTime();
    let startDate: number;

    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime();
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        break;
      case 'quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStart, 1).getTime();
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1).getTime();
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    }

    return { startDate, endDate };
  }

  private calculateEnhancedSummary(
    transactions: Transaction[],
    categoryStats: CategoryStats[],
    startDate: number,
    endDate: number
  ): Omit<DashboardSummary, 'widgets' | 'lastUpdated' | 'performance'> {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const currentMonth: MonthlyStats = {
      month: new Date(startDate).getMonth() + 1,
      year: new Date(startDate).getFullYear(),
      income: totalIncome,
      expense: totalExpense,
      balance: totalIncome - totalExpense,
      transactionCount: transactions.length,
      avgTransactionAmount: transactions.length > 0 ?
        (totalIncome + totalExpense) / transactions.length : 0,
      topCategory: categoryStats[0] ? {
        id: categoryStats[0].categoryId,
        name: categoryStats[0].categoryName,
        amount: categoryStats[0].totalExpense || categoryStats[0].totalIncome,
      } : null,
      categoryBreakdown: categoryStats,
    };

    return {
      currentMonth,
      previousMonth: currentMonth, // Simplified for now
      yearToDate: {
        totalIncome,
        totalExpense,
        netAmount: totalIncome - totalExpense,
        transactionCount: transactions.length,
        averageTransaction: currentMonth.avgTransactionAmount,
        categoriesUsed: categoryStats.length,
        period: { start: startDate, end: endDate },
      },
      topCategories: categoryStats.slice(0, 5),
      recentTrend: [], // Will be populated by trend widget
    };
  }

  private async getPreviousPeriodData(startDate: number, endDate: number): Promise<{ balance: number }> {
    const periodLength = endDate - startDate;
    const previousStartDate = startDate - periodLength;
    const previousEndDate = startDate;

    const previousTransactions = await transactionRepository.getTransactions({
      startDate: previousStartDate,
      endDate: previousEndDate,
      limit: 10000,
    });

    const previousIncome = previousTransactions.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const previousExpense = previousTransactions.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      balance: previousIncome - previousExpense,
    };
  }

  private calculateTrend(values: number[]): 'up' | 'down' | 'stable' {
    if (values.length < 2) return 'stable';

    const first = values[0];
    const last = values[values.length - 1];
    const change = last - first;

    if (Math.abs(change) < 0.05 * Math.abs(first)) return 'stable';
    return change > 0 ? 'up' : 'down';
  }

  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }
}

export const dashboardService = DashboardService.getInstance();
