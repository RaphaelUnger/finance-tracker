import { CategoryStats, Transaction } from './transaction';
import { ChartData } from './reports';

export interface DashboardSummary {
  currentMonth: MonthlyStats;
  previousMonth: MonthlyStats;
  yearToDate: {
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
  };
  topCategories: CategoryStats[];
  recentTrend: Array<{
    period: string;
    value: number;
    income: number;
    expense: number;
    change: number;
    changePercent: number;
  }>;
  widgets: WidgetData[];
  lastUpdated: number;
  performance: {
    dataPoints: number;
    categories: number;
    renderTime: number;
  };
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

export interface WidgetData {
  id: string;
  type: WidgetType;
  title: string;
  data: any;
  config: WidgetConfig;
  lastUpdated: number;
}

export type WidgetType =
  | 'balance'
  | 'monthlyOverview'
  | 'categoryBreakdown'
  | 'topCategories'
  | 'trendChart'
  | 'quickStats'
  | 'recentTransactions'
  | 'budgetProgress'
  | 'goalTracker';

export type WidgetSize = 'small' | 'medium' | 'large' | 'xlarge';

export interface WidgetConfig {
  size: WidgetSize;
  position: {
    row: number;
    col: number;
  };
  filters?: {
    timeRange?: 'week' | 'month' | 'quarter' | 'year';
    categories?: string[];
    transactionType?: 'income' | 'expense' | 'both';
  };
  appearance?: {
    showBorder?: boolean;
    backgroundColor?: string;
    textColor?: string;
    chartType?: string;
  };
  refreshInterval?: number; // in milliseconds
}

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  config: WidgetConfig;
  isEnabled: boolean;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface BalanceWidgetData {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  trend: {
    value: number;
    percentage: number;
    direction: 'up' | 'down' | 'stable';
  };
  formatted: {
    balance: string;
    income: string;
    expense: string;
    trend: string;
    trendPercent: string;
  };
}

export interface MonthlyOverviewWidgetData {
  summary: {
    totalIncome: number;
    totalExpense: number;
    netAmount: number;
    transactionCount: number;
    averageTransaction: number;
    categoriesUsed: number;
    period: { start: number; end: number };
  };
  chart: ChartData;
  comparison: {
    previousMonth: any;
    changes: {
      income: { amount: number; percentage: number };
      expense: { amount: number; percentage: number };
      net: { amount: number; percentage: number };
    };
  };
}

export interface CategoryBreakdownWidgetData {
  categories: CategoryStats[];
  chart: ChartData;
  total: string;
}

export interface TopCategoriesWidgetData {
  topExpense: Array<CategoryStats & { formattedAmount: string }>;
  topIncome: Array<CategoryStats & { formattedAmount: string }>;
}

export interface TrendChartWidgetData {
  chart: ChartData;
  summary: {
    averageIncome: number;
    averageExpense: number;
    trend: 'up' | 'down' | 'stable';
  };
}

export interface QuickStatsWidgetData {
  stats: {
    totalTransactions: number;
    avgTransactionAmount: number;
    topTransactionAmount: number;
    categoriesUsed: number;
    thisMonthTransactions: number;
  };
  formatted: {
    totalTransactions: string;
    avgTransactionAmount: string;
    topTransactionAmount: string;
    categoriesUsed: string;
    thisMonthTransactions: string;
  };
}

// Chart-specific types for Dashboard

export interface DashboardChartData extends ChartData {
  interactive?: boolean;
  animations?: {
    enabled: boolean;
    duration: number;
    easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
  };
  gestures?: {
    pan: boolean;
    zoom: boolean;
    pinch: boolean;
  };
  export?: {
    enabled: boolean;
    formats: Array<'png' | 'jpg' | 'svg' | 'pdf'>;
  };
}

export interface LineChartData {
  data: Array<{
    x: string | number;
    y: number;
    label?: string;
  }>;
  lines: Array<{
    key: string;
    color: string;
    strokeWidth?: number;
    strokeDashArray?: string;
  }>;
}

export interface PieChartData {
  data: Array<{
    x: string;
    y: number;
    label?: string;
    color?: string;
  }>;
  centerLabel?: {
    text: string;
    fontSize?: number;
    color?: string;
  };
}

export interface BarChartData {
  data: Array<{
    x: string;
    y: number;
    label?: string;
    color?: string;
  }>;
  orientation?: 'horizontal' | 'vertical';
}

export interface AreaChartData {
  data: Array<{
    x: string | number;
    y: number;
    y0?: number;
    label?: string;
  }>;
  areas: Array<{
    key: string;
    color: string;
    opacity?: number;
  }>;
}

// Dashboard Layout Types

export interface DashboardLayout {
  id: string;
  name: string;
  description?: string;
  widgets: Array<{
    widgetId: string;
    position: {
      row: number;
      col: number;
      span?: { rows: number; cols: number };
    };
  }>;
  gridConfig: {
    columns: number;
    rowHeight: number;
    gap: number;
  };
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface DashboardState {
  currentLayout: string;
  layouts: { [key: string]: DashboardLayout };
  widgets: { [key: string]: DashboardWidget };
  widgetData: { [key: string]: WidgetData };
  isLoading: boolean;
  isRefreshing: boolean;
  lastRefresh: number | null;
  error: string | null;
  filters: {
    timeRange: 'week' | 'month' | 'quarter' | 'year';
    categories: string[];
    transactionType: 'income' | 'expense' | 'both';
  };
  autoRefresh: {
    enabled: boolean;
    interval: number; // in milliseconds
  };
}

// Widget Configuration Templates

export interface WidgetTemplate {
  type: WidgetType;
  name: string;
  description: string;
  defaultConfig: WidgetConfig;
  configOptions: {
    sizes: WidgetSize[];
    supportedFilters: Array<'timeRange' | 'categories' | 'transactionType'>;
    chartTypes?: string[];
    refreshIntervals: number[];
  };
  requirements: {
    minTransactions?: number;
    minCategories?: number;
  };
}

// Performance Monitoring

export interface DashboardPerformance {
  renderTime: number;
  dataLoadTime: number;
  chartRenderTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  errors: Array<{
    timestamp: number;
    widget: string;
    error: string;
  }>;
}

// Real-time Updates

export interface DashboardUpdate {
  type: 'widget' | 'layout' | 'data' | 'config';
  widgetId?: string;
  data?: any;
  timestamp: number;
}

export interface RealtimeConfig {
  enabled: boolean;
  updateInterval: number;
  batchUpdates: boolean;
  priorityWidgets: string[];
}

// Export/Import Dashboard Configuration

export interface DashboardExportData {
  version: string;
  layouts: DashboardLayout[];
  widgets: DashboardWidget[];
  templates: WidgetTemplate[];
  exportedAt: number;
  metadata: {
    appVersion: string;
    userId?: string;
    deviceInfo?: string;
  };
}

export interface DashboardImportOptions {
  mergeStrategy: 'replace' | 'merge' | 'skip-existing';
  validateCompatibility: boolean;
  backupCurrent: boolean;
}

// Dashboard Analytics

export interface DashboardAnalytics {
  usage: {
    totalViews: number;
    averageSessionDuration: number;
    mostViewedWidgets: Array<{ widgetId: string; views: number }>;
    refreshCount: number;
  };
  performance: {
    averageLoadTime: number;
    errorRate: number;
    cacheEfficiency: number;
  };
  userBehavior: {
    widgetInteractions: Array<{ widgetId: string; interactions: number }>;
    layoutChanges: number;
    filterUsage: Array<{ filter: string; usage: number }>;
  };
}

// Utility Types

export type DashboardTheme = 'light' | 'dark' | 'auto' | 'custom';

export interface DashboardCustomization {
  theme: DashboardTheme;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    accent: string;
  };
  typography: {
    fontFamily: string;
    fontSizes: {
      small: number;
      medium: number;
      large: number;
      xlarge: number;
    };
  };
  animations: {
    enabled: boolean;
    duration: number;
    easing: string;
  };
}
