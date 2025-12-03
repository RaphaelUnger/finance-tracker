import { CategoryStats } from './transaction';

export type ReportPeriod =
  | 'last30days'
  | 'last90days'
  | 'last6months'
  | 'last12months'
  | 'thisyear'
  | 'lastyear';

export type ExportFormat = 'csv' | 'pdf' | 'excel' | 'json';

export interface ReportPeriodInfo {
  type?: ReportPeriod;
  startDate: number;
  endDate: number;
  label: string;
  year?: number;
  month?: number;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  transactionCount: number;
  averageTransaction: number;
  categoriesUsed: number;
  period: {
    start: number;
    end: number;
  };
}

export interface TrendData {
  period: string;
  value: number;
  income: number;
  expense: number;
  change: number;
  changePercent: number;
}

export interface MonthlyStats {
  month: number;
  year: number;
  income: number;
  expense: number;
  balance: number;
  transactionCount: number;
  avgTransactionAmount: number;
  topCategory: {
    id: string;
    name: string;
    amount: number;
  } | null;
  categoryBreakdown: CategoryStats[];
}

export interface ComparisonData {
  amount: number;
  percentage: number;
}

export interface MonthlyComparison {
  previousMonth: TransactionSummary;
  changes: {
    income: ComparisonData;
    expense: ComparisonData;
    net: ComparisonData;
  };
}

export interface MonthlyReport {
  period: ReportPeriodInfo;
  summary: TransactionSummary;
  categoryBreakdown: CategoryStats[];
  topIncomeCategories: CategoryStats[];
  topExpenseCategories: CategoryStats[];
  dailyTotals: Array<{
    date: string;
    income: number;
    expense: number;
  }>;
  comparison: MonthlyComparison;
  generatedAt: number;
}

export interface CategoryReport {
  period: ReportPeriodInfo;
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  totalTransactions: number;
  categoryStats: Array<CategoryStats & {
    incomePercentage: number;
    expensePercentage: number;
  }>;
  topCategories: {
    byIncome: CategoryStats[];
    byExpense: CategoryStats[];
    byTransactions: CategoryStats[];
  };
  filters: {
    startDate?: number;
    endDate?: number;
    categoryIds?: string[];
    type?: 'income' | 'expense' | 'both';
    minAmount?: number;
    maxAmount?: number;
  };
  generatedAt: number;
}

export interface TrendStatistics {
  totalIncome: number;
  totalExpense: number;
  averageIncome: number;
  averageExpense: number;
  peakIncome: number;
  peakExpense: number;
  lowIncome: number;
  lowExpense: number;
  trend: 'up' | 'down' | 'stable';
}

export interface TrendReport {
  period: ReportPeriodInfo;
  trendData: TrendData[];
  statistics: TrendStatistics;
  insights: string[];
  filters: {
    startDate?: number;
    endDate?: number;
    categoryIds?: string[];
    type?: 'income' | 'expense' | 'both';
    minAmount?: number;
    maxAmount?: number;
  };
  generatedAt: number;
}

export interface DashboardSummary {
  currentMonth: MonthlyStats;
  previousMonth: MonthlyStats;
  yearToDate: TransactionSummary;
  topCategories: CategoryStats[];
  recentTrend: TrendData[];
}

export interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'area';
  data: Array<{
    name: string;
    value: number;
    color?: string;
    [key: string]: any;
  }>;
  config: {
    title?: string;
    xAxisLabel?: string;
    yAxisLabel?: string;
    showLegend?: boolean;
    showGrid?: boolean;
    colors?: string[];
  };
}

export interface ReportVisualization {
  charts: ChartData[];
  summary: {
    title: string;
    value: string;
    subtitle?: string;
    trend?: 'up' | 'down' | 'stable';
    change?: string;
  }[];
  insights: string[];
}

export interface ExportConfiguration {
  format: ExportFormat;
  includeCharts: boolean;
  includeDetails: boolean;
  companyName?: string;
  reportTitle?: string;
  customFields?: Record<string, any>;
  dateFormat?: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  currencyFormat?: 'EUR' | 'USD' | 'GBP';
  language?: 'de' | 'en';
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'monthly' | 'category' | 'trend' | 'custom';
  configuration: {
    period: ReportPeriod;
    filters: {
      categoryIds?: string[];
      type?: 'income' | 'expense' | 'both';
      minAmount?: number;
      maxAmount?: number;
    };
    visualization: {
      charts: Array<{
        type: ChartData['type'];
        dataSource: string;
        config: ChartData['config'];
      }>;
      layout: 'grid' | 'stacked' | 'tabs';
    };
    export: ExportConfiguration;
  };
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ScheduledReport {
  id: string;
  templateId: string;
  name: string;
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    dayOfWeek?: number; // 0-6, Sunday is 0
    dayOfMonth?: number; // 1-31
    time: string; // HH:mm format
  };
  recipients: Array<{
    email: string;
    name?: string;
  }>;
  isActive: boolean;
  lastRun?: number;
  nextRun?: number;
  createdAt: number;
  updatedAt: number;
}

export interface ReportMetadata {
  id: string;
  type: 'monthly' | 'category' | 'trend' | 'custom';
  title: string;
  period: ReportPeriodInfo;
  generatedAt: number;
  generatedBy: string;
  version: string;
  dataHash: string; // For change detection
  exportFormats: ExportFormat[];
  size: {
    records: number;
    categories: number;
    dateRange: number; // days
  };
}

// Helper types for report building
export interface ReportBuilder {
  addSection(type: 'summary' | 'chart' | 'table' | 'text', config: any): ReportBuilder;
  addChart(chartData: ChartData): ReportBuilder;
  addSummary(summary: TransactionSummary): ReportBuilder;
  addTable(data: any[], columns: string[]): ReportBuilder;
  addText(content: string, style?: 'heading' | 'paragraph' | 'caption'): ReportBuilder;
  setHeader(header: { title: string; subtitle?: string; logo?: string }): ReportBuilder;
  setFooter(footer: { text: string; showPageNumbers?: boolean }): ReportBuilder;
  build(): Promise<any>;
}

export interface ReportSection {
  id: string;
  type: 'summary' | 'chart' | 'table' | 'text' | 'spacer';
  title?: string;
  content: any;
  config: {
    span?: number; // 1-12 for grid layout
    height?: number;
    backgroundColor?: string;
    padding?: number;
    margin?: number;
  };
}

export interface CustomReport {
  id: string;
  name: string;
  description?: string;
  sections: ReportSection[];
  layout: {
    type: 'grid' | 'flow';
    columns: number;
    gap: number;
  };
  filters: {
    startDate?: number;
    endDate?: number;
    categoryIds?: string[];
    type?: 'income' | 'expense' | 'both';
    tags?: string[];
  };
  styling: {
    theme: 'default' | 'minimal' | 'colorful';
    primaryColor: string;
    fontFamily: string;
    fontSize: 'small' | 'medium' | 'large';
  };
  createdAt: number;
  updatedAt: number;
}
