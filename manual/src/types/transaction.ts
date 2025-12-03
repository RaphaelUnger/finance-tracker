export type CategoryType = 'income' | 'expense' | 'both';
export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
  isCustom: boolean;
  description?: string;
  parentId?: string;
  children?: Category[];
  usageCount?: number;
  isActive?: boolean;
  sortOrder?: number;
  createdAt: number;
  updatedAt: number;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: number; // Unix timestamp
  type: TransactionType;
  categoryId: string;
  category?: Category;
  notes?: string;
  receiptUrl?: string;
  location?: string;
  tags?: string[];
  isRecurring?: boolean;
  recurringId?: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
}

export interface CreateTransactionInput {
  amount: number;
  description: string;
  date: number;
  type: TransactionType;
  categoryId: string;
  notes?: string;
  receiptUrl?: string;
  location?: string;
  tags?: string[];
}

export interface UpdateTransactionInput extends Partial<CreateTransactionInput> {
  id: string;
}

export interface CreateCategoryInput {
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
  description?: string;
  parentId?: string;
}

export interface UpdateCategoryInput {
  id: string;
  name?: string;
  icon?: string;
  color?: string;
  description?: string;
  parentId?: string;
}

// Enhanced filtering for Sprint 4
export interface TransactionFilter {
  type?: TransactionType;
  categoryIds?: string[];
  startDate?: number;
  endDate?: number;
  minAmount?: number;
  maxAmount?: number;
  searchQuery?: string;
  tags?: string[];
  hasReceipt?: boolean;
  isRecurring?: boolean;
  sortBy?: 'date' | 'amount' | 'description' | 'category';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Legacy compatibility
export interface TransactionFilters {
  type?: TransactionType;
  categoryId?: string;
  startDate?: number;
  endDate?: number;
  search?: string;
}

export interface TransactionSortOptions {
  field: 'date' | 'amount' | 'description';
  direction: 'asc' | 'desc';
}

export interface CategoryFilter {
  type?: CategoryType;
  isCustom?: boolean;
  parentId?: string;
  searchQuery?: string;
  hasTransactions?: boolean;
  dateRange?: {
    start: number;
    end: number;
  };
}

export interface CategoryStats {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  categoryType: CategoryType;
  transactionCount: number;
  totalIncome: number;
  totalExpense: number;
  totalAmount: number;
  averageAmount: number;
  minAmount: number;
  maxAmount: number;
  firstTransactionDate: number | null;
  lastTransactionDate: number | null;
  percentage?: number;
  trend?: 'up' | 'down' | 'stable';
  monthlyAverage?: number;
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

export interface FilterPreset {
  id: string;
  name: string;
  filter: TransactionFilter;
  isDefault?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface SearchSuggestion {
  type: 'category' | 'description' | 'amount' | 'tag';
  value: string;
  label: string;
  count?: number;
}

export interface TransactionGroup {
  key: string;
  label: string;
  transactions: Transaction[];
  totalAmount: number;
  count: number;
}
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense' | 'both';
}
