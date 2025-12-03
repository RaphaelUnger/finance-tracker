import { Transaction, Category } from '../types';
import { DatabaseService } from './databaseService';

export interface TimeRange {
  startDate: Date;
  endDate: Date;
  label: string;
}

export interface TrendDataPoint {
  date: string;
  value: number;
  label?: string;
  category?: string;
}

export interface ComparisonPeriod {
  current: {
    period: TimeRange;
    data: AnalyticsData;
  };
  previous: {
    period: TimeRange;
    data: AnalyticsData;
  };
  change: {
    absolute: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  };
}

export interface AnalyticsData {
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  transactionCount: number;
  avgTransactionAmount: number;
  categoryBreakdown: CategoryAnalytics[];
  dailyTotals: TrendDataPoint[];
}

export interface CategoryAnalytics {
  categoryId: string;
  categoryName: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
  trend: TrendDataPoint[];
  avgAmount: number;
  color?: string;
}

export interface CustomReportConfig {
  id: string;
  name: string;
  description?: string;
  timeRange: TimeRange;
  categoryFilters?: string[];
  groupBy: 'day' | 'week' | 'month' | 'category';
  chartType: 'line' | 'bar' | 'pie' | 'area' | 'stacked';
  metrics: ('income' | 'expenses' | 'net' | 'count' | 'average')[];
  createdAt: Date;
  lastModified: Date;
}

export interface MovingAverageData {
  period: number; // days
  data: TrendDataPoint[];
  trend: 'increasing' | 'decreasing' | 'stable';
  slope: number;
}

export interface SeasonalityAnalysis {
  patterns: {
    dayOfWeek: { [key: string]: number };
    dayOfMonth: { [key: string]: number };
    monthOfYear: { [key: string]: number };
  };
  recommendations: string[];
}

class AdvancedAnalyticsService {
  private databaseService: DatabaseService;
  private cache: Map<string, any> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.databaseService = new DatabaseService();
  }

  /**
   * Get comprehensive analytics for a time range
   */
  async getAnalytics(timeRange: TimeRange, categoryIds?: string[]): Promise<AnalyticsData> {
    try {
      const cacheKey = `analytics_${timeRange.startDate.getTime()}_${timeRange.endDate.getTime()}_${categoryIds?.join(',') || 'all'}`;

      // Check cache first
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;

      const [transactions, categories] = await Promise.all([
        this.getFilteredTransactions(timeRange, categoryIds),
        this.databaseService.getCategories()
      ]);

      const categoryMap = new Map(categories.map(cat => [cat.id, cat]));

      // Calculate basic metrics
      const income = transactions.filter(t => t.type === 'income');
      const expenses = transactions.filter(t => t.type === 'expense');

      const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
      const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);

      // Calculate category breakdown
      const categoryBreakdown = this.calculateCategoryAnalytics(
        transactions,
        categories,
        timeRange
      );

      // Calculate daily totals for trend analysis
      const dailyTotals = this.calculateDailyTotals(transactions, timeRange);

      const analyticsData: AnalyticsData = {
        totalIncome,
        totalExpenses,
        netAmount: totalIncome - totalExpenses,
        transactionCount: transactions.length,
        avgTransactionAmount: transactions.length > 0 ?
          (totalIncome + totalExpenses) / transactions.length : 0,
        categoryBreakdown,
        dailyTotals
      };

      // Cache the result
      this.setCachedData(cacheKey, analyticsData);

      return analyticsData;

    } catch (error) {
      console.error('Error getting analytics:', error);
      throw new Error(`Failed to get analytics: ${error.message}`);
    }
  }

  /**
   * Compare two time periods
   */
  async compareTimeRanges(
    currentRange: TimeRange,
    previousRange: TimeRange,
    categoryIds?: string[]
  ): Promise<ComparisonPeriod> {
    try {
      const [currentData, previousData] = await Promise.all([
        this.getAnalytics(currentRange, categoryIds),
        this.getAnalytics(previousRange, categoryIds)
      ]);

      const change = {
        absolute: currentData.netAmount - previousData.netAmount,
        percentage: previousData.netAmount !== 0 ?
          ((currentData.netAmount - previousData.netAmount) / Math.abs(previousData.netAmount)) * 100 : 0,
        trend: this.determineTrend(currentData.netAmount, previousData.netAmount)
      };

      return {
        current: { period: currentRange, data: currentData },
        previous: { period: previousRange, data: previousData },
        change
      };

    } catch (error) {
      console.error('Error comparing time ranges:', error);
      throw new Error(`Failed to compare time ranges: ${error.message}`);
    }
  }

  /**
   * Calculate moving averages for trend analysis
   */
  async getMovingAverages(
    timeRange: TimeRange,
    period: number = 7,
    type: 'expenses' | 'income' | 'net' = 'expenses'
  ): Promise<MovingAverageData> {
    try {
      const transactions = await this.getFilteredTransactions(timeRange);
      const dailyTotals = this.calculateDailyTotals(transactions, timeRange);

      // Calculate moving averages
      const movingAverageData: TrendDataPoint[] = [];

      for (let i = period - 1; i < dailyTotals.length; i++) {
        const windowData = dailyTotals.slice(i - period + 1, i + 1);
        const avgValue = windowData.reduce((sum, point) => {
          switch (type) {
            case 'income':
              return sum + (point.value > 0 ? point.value : 0);
            case 'expenses':
              return sum + (point.value < 0 ? Math.abs(point.value) : 0);
            case 'net':
            default:
              return sum + point.value;
          }
        }, 0) / period;

        movingAverageData.push({
          date: dailyTotals[i].date,
          value: avgValue,
          label: `${period}-day average`
        });
      }

      // Calculate trend slope
      const slope = this.calculateTrendSlope(movingAverageData);
      const trend = slope > 0.1 ? 'increasing' : slope < -0.1 ? 'decreasing' : 'stable';

      return {
        period,
        data: movingAverageData,
        trend,
        slope
      };

    } catch (error) {
      console.error('Error calculating moving averages:', error);
      throw new Error(`Failed to calculate moving averages: ${error.message}`);
    }
  }

  /**
   * Analyze seasonality patterns
   */
  async getSeasonalityAnalysis(timeRange: TimeRange): Promise<SeasonalityAnalysis> {
    try {
      const transactions = await this.getFilteredTransactions(timeRange);
      const expenses = transactions.filter(t => t.type === 'expense');

      const patterns = {
        dayOfWeek: this.analyzeByDayOfWeek(expenses),
        dayOfMonth: this.analyzeByDayOfMonth(expenses),
        monthOfYear: this.analyzeByMonthOfYear(expenses)
      };

      const recommendations = this.generateSeasonalityRecommendations(patterns);

      return { patterns, recommendations };

    } catch (error) {
      console.error('Error analyzing seasonality:', error);
      throw new Error(`Failed to analyze seasonality: ${error.message}`);
    }
  }

  /**
   * Get category trend analysis
   */
  async getCategoryTrends(
    categoryIds: string[],
    timeRange: TimeRange,
    granularity: 'day' | 'week' | 'month' = 'week'
  ): Promise<Map<string, TrendDataPoint[]>> {
    try {
      const transactions = await this.getFilteredTransactions(timeRange, categoryIds);
      const categories = await this.databaseService.getCategories();
      const categoryMap = new Map(categories.map(cat => [cat.id, cat]));

      const trends = new Map<string, TrendDataPoint[]>();

      for (const categoryId of categoryIds) {
        const categoryTransactions = transactions.filter(t => t.categoryId === categoryId);
        const categoryName = categoryMap.get(categoryId)?.name || 'Unknown';

        const trendData = this.calculateTimeSeriesTotals(
          categoryTransactions,
          timeRange,
          granularity
        );

        trends.set(categoryId, trendData.map(point => ({
          ...point,
          category: categoryName
        })));
      }

      return trends;

    } catch (error) {
      console.error('Error getting category trends:', error);
      throw new Error(`Failed to get category trends: ${error.message}`);
    }
  }

  /**
   * Create custom report
   */
  async createCustomReport(config: Omit<CustomReportConfig, 'id' | 'createdAt' | 'lastModified'>): Promise<CustomReportConfig> {
    try {
      const reportConfig: CustomReportConfig = {
        ...config,
        id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        lastModified: new Date()
      };

      // Save to database
      await this.databaseService.saveCustomReport(reportConfig);

      return reportConfig;

    } catch (error) {
      console.error('Error creating custom report:', error);
      throw new Error(`Failed to create custom report: ${error.message}`);
    }
  }

  /**
   * Execute custom report
   */
  async executeCustomReport(reportId: string): Promise<any> {
    try {
      const config = await this.databaseService.getCustomReport(reportId);
      if (!config) {
        throw new Error('Custom report not found');
      }

      const analytics = await this.getAnalytics(config.timeRange, config.categoryFilters);

      // Transform data based on report configuration
      const reportData = this.transformDataForReport(analytics, config);

      // Update last modified
      config.lastModified = new Date();
      await this.databaseService.updateCustomReport(config);

      return {
        config,
        data: reportData,
        generatedAt: new Date()
      };

    } catch (error) {
      console.error('Error executing custom report:', error);
      throw new Error(`Failed to execute custom report: ${error.message}`);
    }
  }

  /**
   * Get spending velocity (spending rate over time)
   */
  async getSpendingVelocity(timeRange: TimeRange): Promise<{
    current: number;
    average: number;
    trend: 'accelerating' | 'decelerating' | 'stable';
    projection: number;
  }> {
    try {
      const transactions = await this.getFilteredTransactions(timeRange);
      const expenses = transactions.filter(t => t.type === 'expense');

      const dailyExpenses = this.calculateDailyTotals(expenses, timeRange);

      // Calculate current spending rate (last 7 days)
      const recentDays = dailyExpenses.slice(-7);
      const currentRate = recentDays.reduce((sum, day) => sum + Math.abs(day.value), 0) / 7;

      // Calculate average rate
      const averageRate = dailyExpenses.reduce((sum, day) => sum + Math.abs(day.value), 0) / dailyExpenses.length;

      // Calculate trend
      const firstHalf = dailyExpenses.slice(0, Math.floor(dailyExpenses.length / 2));
      const secondHalf = dailyExpenses.slice(Math.floor(dailyExpenses.length / 2));

      const firstHalfAvg = firstHalf.reduce((sum, day) => sum + Math.abs(day.value), 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, day) => sum + Math.abs(day.value), 0) / secondHalf.length;

      const changePercent = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
      const trend = changePercent > 10 ? 'accelerating' : changePercent < -10 ? 'decelerating' : 'stable';

      // Project next month spending
      const daysInMonth = 30;
      const projection = currentRate * daysInMonth;

      return {
        current: currentRate,
        average: averageRate,
        trend,
        projection
      };

    } catch (error) {
      console.error('Error calculating spending velocity:', error);
      throw new Error(`Failed to calculate spending velocity: ${error.message}`);
    }
  }

  // Private helper methods

  private async getFilteredTransactions(
    timeRange: TimeRange,
    categoryIds?: string[]
  ): Promise<Transaction[]> {
    const allTransactions = await this.databaseService.getTransactions();

    return allTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      const inTimeRange = transactionDate >= timeRange.startDate && transactionDate <= timeRange.endDate;
      const inCategories = !categoryIds || categoryIds.includes(transaction.categoryId);
      const notDeleted = !transaction.deletedAt;

      return inTimeRange && inCategories && notDeleted;
    });
  }

  private calculateCategoryAnalytics(
    transactions: Transaction[],
    categories: Category[],
    timeRange: TimeRange
  ): CategoryAnalytics[] {
    const categoryMap = new Map(categories.map(cat => [cat.id, cat]));
    const categoryTotals = new Map<string, number>();
    const categoryCounts = new Map<string, number>();

    // Calculate totals per category
    transactions.forEach(transaction => {
      const current = categoryTotals.get(transaction.categoryId) || 0;
      categoryTotals.set(transaction.categoryId, current + transaction.amount);

      const count = categoryCounts.get(transaction.categoryId) || 0;
      categoryCounts.set(transaction.categoryId, count + 1);
    });

    const totalAmount = Array.from(categoryTotals.values()).reduce((sum, amount) => sum + amount, 0);

    // Create analytics for each category
    const analytics: CategoryAnalytics[] = [];

    categoryTotals.forEach((amount, categoryId) => {
      const category = categoryMap.get(categoryId);
      if (!category) return;

      const transactionCount = categoryCounts.get(categoryId) || 0;
      const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;

      // Calculate trend for this category
      const categoryTransactions = transactions.filter(t => t.categoryId === categoryId);
      const trend = this.calculateDailyTotals(categoryTransactions, timeRange);

      analytics.push({
        categoryId,
        categoryName: category.name,
        totalAmount: amount,
        transactionCount,
        percentage,
        trend,
        avgAmount: transactionCount > 0 ? amount / transactionCount : 0,
        color: category.color
      });
    });

    return analytics.sort((a, b) => b.totalAmount - a.totalAmount);
  }

  private calculateDailyTotals(transactions: Transaction[], timeRange: TimeRange): TrendDataPoint[] {
    const dailyTotals = new Map<string, number>();

    // Initialize all days in range with 0
    const currentDate = new Date(timeRange.startDate);
    while (currentDate <= timeRange.endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      dailyTotals.set(dateKey, 0);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Add transaction amounts to respective days
    transactions.forEach(transaction => {
      const dateKey = new Date(transaction.date).toISOString().split('T')[0];
      const current = dailyTotals.get(dateKey) || 0;
      const amount = transaction.type === 'income' ? transaction.amount : -transaction.amount;
      dailyTotals.set(dateKey, current + amount);
    });

    // Convert to array and sort by date
    return Array.from(dailyTotals.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private calculateTimeSeriesTotals(
    transactions: Transaction[],
    timeRange: TimeRange,
    granularity: 'day' | 'week' | 'month'
  ): TrendDataPoint[] {
    const totals = new Map<string, number>();

    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      let key: string;

      switch (granularity) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
      }

      const current = totals.get(key) || 0;
      totals.set(key, current + transaction.amount);
    });

    return Array.from(totals.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private analyzeByDayOfWeek(transactions: Transaction[]): { [key: string]: number } {
    const dayTotals: { [key: string]: number } = {
      'Sunday': 0, 'Monday': 0, 'Tuesday': 0, 'Wednesday': 0,
      'Thursday': 0, 'Friday': 0, 'Saturday': 0
    };

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    transactions.forEach(transaction => {
      const dayOfWeek = new Date(transaction.date).getDay();
      dayTotals[dayNames[dayOfWeek]] += transaction.amount;
    });

    return dayTotals;
  }

  private analyzeByDayOfMonth(transactions: Transaction[]): { [key: string]: number } {
    const dayTotals: { [key: string]: number } = {};

    for (let day = 1; day <= 31; day++) {
      dayTotals[day.toString()] = 0;
    }

    transactions.forEach(transaction => {
      const dayOfMonth = new Date(transaction.date).getDate();
      dayTotals[dayOfMonth.toString()] += transaction.amount;
    });

    return dayTotals;
  }

  private analyzeByMonthOfYear(transactions: Transaction[]): { [key: string]: number } {
    const monthTotals: { [key: string]: number } = {
      'January': 0, 'February': 0, 'March': 0, 'April': 0,
      'May': 0, 'June': 0, 'July': 0, 'August': 0,
      'September': 0, 'October': 0, 'November': 0, 'December': 0
    };

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    transactions.forEach(transaction => {
      const month = new Date(transaction.date).getMonth();
      monthTotals[monthNames[month]] += transaction.amount;
    });

    return monthTotals;
  }

  private generateSeasonalityRecommendations(patterns: SeasonalityAnalysis['patterns']): string[] {
    const recommendations: string[] = [];

    // Analyze day of week patterns
    const dayValues = Object.values(patterns.dayOfWeek);
    const avgDaySpending = dayValues.reduce((sum, val) => sum + val, 0) / dayValues.length;
    const highestDay = Object.entries(patterns.dayOfWeek)
      .reduce((max, [day, amount]) => amount > max.amount ? { day, amount } : max, { day: '', amount: 0 });

    if (highestDay.amount > avgDaySpending * 1.5) {
      recommendations.push(`Sie geben am ${highestDay.day} überdurchschnittlich viel aus. Planen Sie Ihre Ausgaben besser.`);
    }

    // Analyze month patterns
    const monthValues = Object.values(patterns.monthOfYear);
    const avgMonthSpending = monthValues.reduce((sum, val) => sum + val, 0) / monthValues.length;
    const expensiveMonths = Object.entries(patterns.monthOfYear)
      .filter(([month, amount]) => amount > avgMonthSpending * 1.3)
      .map(([month]) => month);

    if (expensiveMonths.length > 0) {
      recommendations.push(`In ${expensiveMonths.join(', ')} sind Ihre Ausgaben erhöht. Berücksichtigen Sie dies in Ihrer Budgetplanung.`);
    }

    return recommendations;
  }

  private determineTrend(current: number, previous: number): 'up' | 'down' | 'stable' {
    const changePercent = Math.abs(((current - previous) / Math.abs(previous)) * 100);
    if (changePercent < 5) return 'stable';
    return current > previous ? 'up' : 'down';
  }

  private calculateTrendSlope(data: TrendDataPoint[]): number {
    if (data.length < 2) return 0;

    const n = data.length;
    const sumX = data.reduce((sum, _, index) => sum + index, 0);
    const sumY = data.reduce((sum, point) => sum + point.value, 0);
    const sumXY = data.reduce((sum, point, index) => sum + (index * point.value), 0);
    const sumX2 = data.reduce((sum, _, index) => sum + (index * index), 0);

    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  }

  private transformDataForReport(analytics: AnalyticsData, config: CustomReportConfig): any {
    const data: any = {};

    config.metrics.forEach(metric => {
      switch (metric) {
        case 'income':
          data.income = analytics.totalIncome;
          break;
        case 'expenses':
          data.expenses = analytics.totalExpenses;
          break;
        case 'net':
          data.net = analytics.netAmount;
          break;
        case 'count':
          data.transactionCount = analytics.transactionCount;
          break;
        case 'average':
          data.average = analytics.avgTransactionAmount;
          break;
      }
    });

    switch (config.groupBy) {
      case 'category':
        data.breakdown = analytics.categoryBreakdown;
        break;
      case 'day':
      case 'week':
      case 'month':
        data.timeSeries = analytics.dailyTotals;
        break;
    }

    return data;
  }

  // Cache management
  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear analytics cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get predefined time ranges
   */
  static getTimeRanges(): { [key: string]: TimeRange } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return {
      today: {
        startDate: today,
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
        label: 'Heute'
      },
      thisWeek: {
        startDate: new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000)),
        endDate: now,
        label: 'Diese Woche'
      },
      thisMonth: {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        endDate: now,
        label: 'Dieser Monat'
      },
      lastMonth: {
        startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        endDate: new Date(now.getFullYear(), now.getMonth(), 0),
        label: 'Letzter Monat'
      },
      thisYear: {
        startDate: new Date(now.getFullYear(), 0, 1),
        endDate: now,
        label: 'Dieses Jahr'
      },
      lastYear: {
        startDate: new Date(now.getFullYear() - 1, 0, 1),
        endDate: new Date(now.getFullYear() - 1, 11, 31),
        label: 'Letztes Jahr'
      }
    };
  }
}

export default new AdvancedAnalyticsService();
