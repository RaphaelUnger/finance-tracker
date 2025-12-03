import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionFilters,
  TransactionSortOptions,
} from '../../types/transaction';
import { transactionService } from '../../services/transactionService';

export interface TransactionsState {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  filters: TransactionFilters;
  sortOptions: TransactionSortOptions;
  currentPage: number;
  pageSize: number;
  totalCount: number;
  hasMore: boolean;
  balance: {
    income: number;
    expense: number;
    balance: number;
  };
  selectedTransaction: Transaction | null;
}

const initialState: TransactionsState = {
  transactions: [],
  loading: false,
  error: null,
  filters: {},
  sortOptions: { field: 'date', direction: 'desc' },
  currentPage: 1,
  pageSize: 50,
  totalCount: 0,
  hasMore: false,
  balance: {
    income: 0,
    expense: 0,
    balance: 0,
  },
  selectedTransaction: null,
};

// Async Thunks
export const createTransaction = createAsyncThunk(
  'transactions/create',
  async (input: CreateTransactionInput, { rejectWithValue }) => {
    try {
      const transaction = await transactionService.createTransaction(input);
      return transaction;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Fehler beim Erstellen der Transaktion');
    }
  }
);

export const fetchTransactions = createAsyncThunk(
  'transactions/fetchAll',
  async (params: {
    filters?: TransactionFilters;
    sortOptions?: TransactionSortOptions;
    page?: number;
    pageSize?: number;
    refresh?: boolean;
  } = {}, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { transactions: TransactionsState };
      const currentState = state.transactions;

      const page = params.page ?? (params.refresh ? 1 : currentState.currentPage);
      const pageSize = params.pageSize ?? currentState.pageSize;
      const filters = params.filters ?? currentState.filters;
      const sortOptions = params.sortOptions ?? currentState.sortOptions;

      const result = await transactionService.getTransactions(filters, sortOptions, page, pageSize);

      return {
        ...result,
        page,
        filters,
        sortOptions,
        isRefresh: params.refresh || page === 1,
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Fehler beim Laden der Transaktionen');
    }
  }
);

export const updateTransaction = createAsyncThunk(
  'transactions/update',
  async (input: UpdateTransactionInput, { rejectWithValue }) => {
    try {
      const transaction = await transactionService.updateTransaction(input);
      return transaction;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Fehler beim Aktualisieren der Transaktion');
    }
  }
);

export const deleteTransaction = createAsyncThunk(
  'transactions/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await transactionService.deleteTransaction(id);
      return id;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Fehler beim Löschen der Transaktion');
    }
  }
);

export const fetchBalance = createAsyncThunk(
  'transactions/fetchBalance',
  async (filters?: Omit<TransactionFilters, 'type'>, { rejectWithValue }) => {
    try {
      const balance = await transactionService.getBalance(filters);
      return balance;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Fehler beim Laden des Saldos');
    }
  }
);

export const fetchTransactionById = createAsyncThunk(
  'transactions/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const transaction = await transactionService.getTransaction(id);
      if (!transaction) {
        throw new Error('Transaktion nicht gefunden');
      }
      return transaction;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Fehler beim Laden der Transaktion');
    }
  }
);

export const transactionsSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<TransactionFilters>) => {
      state.filters = action.payload;
      state.currentPage = 1; // Reset to first page when filters change
    },

    setSortOptions: (state, action: PayloadAction<TransactionSortOptions>) => {
      state.sortOptions = action.payload;
      state.currentPage = 1; // Reset to first page when sort changes
    },

    clearFilters: (state) => {
      state.filters = {};
      state.currentPage = 1;
    },

    setSelectedTransaction: (state, action: PayloadAction<Transaction | null>) => {
      state.selectedTransaction = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },

    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },

    resetTransactions: (state) => {
      state.transactions = [];
      state.currentPage = 1;
      state.totalCount = 0;
      state.hasMore = false;
    },
  },
  extraReducers: (builder) => {
    // Create Transaction
    builder
      .addCase(createTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTransaction.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions.unshift(action.payload); // Add to beginning
        state.totalCount += 1;
      })
      .addCase(createTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Transactions
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        const { transactions, totalCount, hasMore, page, filters, sortOptions, isRefresh } = action.payload;

        if (isRefresh) {
          state.transactions = transactions;
        } else {
          // Append for pagination
          state.transactions = [...state.transactions, ...transactions];
        }

        state.totalCount = totalCount;
        state.hasMore = hasMore;
        state.currentPage = page;
        state.filters = filters;
        state.sortOptions = sortOptions;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update Transaction
    builder
      .addCase(updateTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTransaction.fulfilled, (state, action) => {
        state.loading = false;
        const updatedTransaction = action.payload;
        const index = state.transactions.findIndex(t => t.id === updatedTransaction.id);
        if (index !== -1) {
          state.transactions[index] = updatedTransaction;
        }
        if (state.selectedTransaction?.id === updatedTransaction.id) {
          state.selectedTransaction = updatedTransaction;
        }
      })
      .addCase(updateTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete Transaction
    builder
      .addCase(deleteTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTransaction.fulfilled, (state, action) => {
        state.loading = false;
        const deletedId = action.payload;
        state.transactions = state.transactions.filter(t => t.id !== deletedId);
        state.totalCount = Math.max(0, state.totalCount - 1);
        if (state.selectedTransaction?.id === deletedId) {
          state.selectedTransaction = null;
        }
      })
      .addCase(deleteTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Balance
    builder
      .addCase(fetchBalance.pending, (state) => {
        // Don't set global loading for balance fetch
        state.error = null;
      })
      .addCase(fetchBalance.fulfilled, (state, action) => {
        state.balance = action.payload;
      })
      .addCase(fetchBalance.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Fetch Transaction by ID
    builder
      .addCase(fetchTransactionById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactionById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedTransaction = action.payload;
      })
      .addCase(fetchTransactionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setFilters,
  setSortOptions,
  clearFilters,
  setSelectedTransaction,
  clearError,
  setCurrentPage,
  resetTransactions,
} = transactionsSlice.actions;

export default transactionsSlice.reducer;
      state.filters = action.payload;
    },

    updateFilters: (state, action: PayloadAction<Partial<TransactionFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    clearFilters: (state) => {
      state.filters = {};
    },

    setPagination: (state, action: PayloadAction<PaginationState>) => {
      state.pagination = action.payload;
    },

    updatePagination: (state, action: PayloadAction<Partial<PaginationState>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },

    appendTransactions: (state, action: PayloadAction<Transaction[]>) => {
      state.items = [...state.items, ...action.payload];
    },

    reset: () => initialState,
  },
});

export const {
  setLoading,
  setError,
  setTransactions,
  addTransaction,
  updateTransaction,
  removeTransaction,
  setFilters,
  updateFilters,
  clearFilters,
  setPagination,
  updatePagination,
  appendTransactions,
  reset,
} = transactionsSlice.actions;

export default transactionsSlice.reducer;
