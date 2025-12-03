// Core domain types

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: Date;
  type: 'income' | 'expense';
  categoryId: string;
  notes?: string;
  receiptId?: string;
  recurrenceId?: string;
  tags: string[];
  location?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  parentId?: string;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Recurrence {
  id: string;
  name: string;
  amount: number;
  description: string;
  categoryId: string;
  pattern: string; // Cron-like pattern
  startDate: Date;
  endDate?: Date;
  nextExecution: Date;
  isActive: boolean;
  lastExecuted?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Receipt {
  id: string;
  imagePath: string;
  ocrText: string;
  extractedData: ReceiptExtractedData;
  confidence: number;
  processingStatus: 'pending' | 'processed' | 'failed';
  createdAt: Date;
}

export interface ReceiptExtractedData {
  amount?: number;
  date?: Date;
  merchant?: string;
  items?: string[];
  taxAmount?: number;
  paymentMethod?: string;
}

// Utility types

export interface DatabaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export type TransactionType = 'income' | 'expense';
export type CategoryType = 'income' | 'expense';
export type RecurrencePattern = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

// API Response types

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Search and Filter types

export interface TransactionFilters {
  type?: TransactionType;
  categoryId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  amountMin?: number;
  amountMax?: number;
  searchQuery?: string;
  tags?: string[];
}

export interface CategoryFilters {
  type?: CategoryType;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface TransactionSearchOptions {
  filters?: TransactionFilters;
  sortBy?: 'date' | 'amount' | 'description';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Statistics and Reports

export interface MonthlyReport {
  month: string;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  transactionCount: number;
  categoryBreakdown: CategoryBreakdown[];
  dailyBreakdown: DailyBreakdown[];
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface DailyBreakdown {
  date: string;
  income: number;
  expenses: number;
  net: number;
}

export interface TrendData {
  period: string;
  value: number;
  change?: number;
  changePercent?: number;
}

// Form types

export interface TransactionFormData {
  amount: string;
  description: string;
  date: Date;
  type: TransactionType;
  categoryId: string;
  notes?: string;
  tags: string[];
}

export interface CategoryFormData {
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  parentId?: string;
}

export interface RecurrenceFormData {
  name: string;
  amount: string;
  description: string;
  categoryId: string;
  pattern: string;
  startDate: Date;
  endDate?: Date;
}

// Export types

export interface ExportOptions {
  format: 'csv' | 'pdf' | 'json';
  dateFrom?: Date;
  dateTo?: Date;
  categories?: string[];
  includeReceipts?: boolean;
}

export interface ImportResult {
  success: boolean;
  importedCount: number;
  skippedCount: number;
  errors: string[];
}

// Chart data types

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface LineChartData {
  labels: string[];
  datasets: {
    data: number[];
    color?: string;
    strokeWidth?: number;
  }[];
}

export interface PieChartData {
  name: string;
  value: number;
  color: string;
}

export interface BarChartData {
  labels: string[];
  data: number[];
}

export default {};
