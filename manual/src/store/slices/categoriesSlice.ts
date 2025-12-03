import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
  CategoryType,
  CategoryFilter,
  CategoryStats,
  FilterPreset
} from '../../types/transaction';
import { categoryRepository, CategorySearchOptions } from '../../services/categoryRepository';

export interface CategoriesState {
  categories: Category[];
  popularCategories: Category[];
  categoryStats: CategoryStats[];
  filterPresets: FilterPreset[];
  currentFilter: CategoryFilter | null;
  searchQuery: string;
  selectedCategoryId: string | null;
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  hasMore: boolean;
  lastFetchTime: number | null;

  // UI state
  showCreateModal: boolean;
  showEditModal: boolean;
  showStatsModal: boolean;
  selectedType: CategoryType | null;
  sortBy: 'name' | 'usage' | 'created_at' | 'updated_at';
  sortOrder: 'asc' | 'desc';
}

const initialState: CategoriesState = {
  categories: [],
  popularCategories: [],
  categoryStats: [],
  filterPresets: [],
  currentFilter: null,
  searchQuery: '',
  selectedCategoryId: null,
  isLoading: false,
  error: null,
  totalCount: 0,
  hasMore: false,
  lastFetchTime: null,

  // UI state
  showCreateModal: false,
  showEditModal: false,
  showStatsModal: false,
  selectedType: null,
  sortBy: 'name',
  sortOrder: 'asc',
};

// Async Thunks
export const fetchCategories = createAsyncThunk(
  'categories/fetchCategories',
  async (options: CategorySearchOptions = {}, { rejectWithValue }) => {
    try {
      const result = await categoryRepository.getCategories(options);
      return result;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch categories');
    }
  }
);

export const searchCategories = createAsyncThunk(
  'categories/searchCategories',
  async ({ query, type, limit }: { query: string; type?: CategoryType; limit?: number }, { rejectWithValue }) => {
    try {
      const categories = await categoryRepository.searchCategories(query, type, limit);
      return categories;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to search categories');
    }
  }
);

export const fetchPopularCategories = createAsyncThunk(
  'categories/fetchPopularCategories',
  async ({ type, limit }: { type?: CategoryType; limit?: number } = {}, { rejectWithValue }) => {
    try {
      const categories = await categoryRepository.getPopularCategories(type, limit);
      return categories;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch popular categories');
    }
  }
);

export const createCategory = createAsyncThunk(
  'categories/createCategory',
  async (input: CreateCategoryInput, { rejectWithValue, dispatch }) => {
    try {
      const category = await categoryRepository.createCategory(input);
      // Refresh categories list after creation
      dispatch(fetchCategories());
      return category;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create category');
    }
  }
);

export const updateCategory = createAsyncThunk(
  'categories/updateCategory',
  async (input: UpdateCategoryInput, { rejectWithValue, dispatch }) => {
    try {
      const category = await categoryRepository.updateCategory(input);
      // Refresh categories list after update
      dispatch(fetchCategories());
      return category;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update category');
    }
  }
);

export const deleteCategory = createAsyncThunk(
  'categories/deleteCategory',
  async (id: string, { rejectWithValue, dispatch }) => {
    try {
      await categoryRepository.deleteCategory(id);
      // Refresh categories list after deletion
      dispatch(fetchCategories());
      return id;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete category');
    }
  }
);

export const fetchCategoryStats = createAsyncThunk(
  'categories/fetchCategoryStats',
  async ({ startDate, endDate }: { startDate?: number; endDate?: number } = {}, { rejectWithValue }) => {
    try {
      const stats = await categoryRepository.getCategoryStats(startDate, endDate);
      return stats;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch category statistics');
    }
  }
);

export const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },

    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },

    setCurrentFilter: (state, action: PayloadAction<CategoryFilter | null>) => {
      state.currentFilter = action.payload;
    },

    setSelectedCategoryId: (state, action: PayloadAction<string | null>) => {
      state.selectedCategoryId = action.payload;
    },

    setSelectedType: (state, action: PayloadAction<CategoryType | null>) => {
      state.selectedType = action.payload;
    },

    setSortOptions: (state, action: PayloadAction<{ sortBy: typeof state.sortBy; sortOrder: typeof state.sortOrder }>) => {
      state.sortBy = action.payload.sortBy;
      state.sortOrder = action.payload.sortOrder;
    },

    showCreateModal: (state) => {
      state.showCreateModal = true;
    },

    hideCreateModal: (state) => {
      state.showCreateModal = false;
    },

    showEditModal: (state, action: PayloadAction<string>) => {
      state.showEditModal = true;
      state.selectedCategoryId = action.payload;
    },

    hideEditModal: (state) => {
      state.showEditModal = false;
      state.selectedCategoryId = null;
    },

    showStatsModal: (state) => {
      state.showStatsModal = true;
    },

    hideStatsModal: (state) => {
      state.showStatsModal = false;
    },
  },
  extraReducers: (builder) => {
    // Fetch Categories
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categories = action.payload.categories;
        state.totalCount = action.payload.totalCount;
        state.hasMore = action.payload.hasMore;
        state.lastFetchTime = Date.now();
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Search Categories
    builder
      .addCase(searchCategories.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categories = action.payload;
        state.totalCount = action.payload.length;
        state.hasMore = false;
      })
      .addCase(searchCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Popular Categories
    builder
      .addCase(fetchPopularCategories.fulfilled, (state, action) => {
        state.popularCategories = action.payload;
      });

    // Create Category
    builder
      .addCase(createCategory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createCategory.fulfilled, (state) => {
        state.isLoading = false;
        state.showCreateModal = false;
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update Category
    builder
      .addCase(updateCategory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateCategory.fulfilled, (state) => {
        state.isLoading = false;
        state.showEditModal = false;
        state.selectedCategoryId = null;
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Delete Category
    builder
      .addCase(deleteCategory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedCategoryId = null;
        state.categories = state.categories.filter(cat => cat.id !== action.payload);
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Category Stats
    builder
      .addCase(fetchCategoryStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCategoryStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categoryStats = action.payload;
      })
      .addCase(fetchCategoryStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  setSearchQuery,
  setCurrentFilter,
  setSelectedCategoryId,
  setSelectedType,
  setSortOptions,
  showCreateModal,
  hideCreateModal,
  showEditModal,
  hideEditModal,
  showStatsModal,
  hideStatsModal,
} = categoriesSlice.actions;

export default categoriesSlice.reducer;

export const createCategory = createAsyncThunk(
  'categories/create',
  async (input: CreateCategoryInput, { rejectWithValue }) => {
    try {
      const category = await categoryRepository.create(input);
      return category;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Fehler beim Erstellen der Kategorie');
    }
  }
);

export const updateCategory = createAsyncThunk(
  'categories/update',
  async (params: { id: string; input: Partial<CreateCategoryInput> }, { rejectWithValue }) => {
    try {
      const category = await categoryRepository.update(params.id, params.input);
      return category;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Fehler beim Aktualisieren der Kategorie');
    }
  }
);

export const deleteCategory = createAsyncThunk(
  'categories/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await categoryRepository.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Fehler beim Löschen der Kategorie');
    }
  }
);

export const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    setSelectedCategory: (state, action: PayloadAction<Category | null>) => {
      state.selectedCategory = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Categories
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create Category
    builder
      .addCase(createCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.categories.push(action.payload);
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update Category
    builder
      .addCase(updateCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.loading = false;
        const updatedCategory = action.payload;
        const index = state.categories.findIndex(c => c.id === updatedCategory.id);
        if (index !== -1) {
          state.categories[index] = updatedCategory;
        }
        if (state.selectedCategory?.id === updatedCategory.id) {
          state.selectedCategory = updatedCategory;
        }
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete Category
    builder
      .addCase(deleteCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.loading = false;
        const deletedId = action.payload;
        state.categories = state.categories.filter(c => c.id !== deletedId);
        if (state.selectedCategory?.id === deletedId) {
          state.selectedCategory = null;
        }
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedCategory, clearError } = categoriesSlice.actions;

export default categoriesSlice.reducer;

    setCategories: (state, action: PayloadAction<Category[]>) => {
      state.items = action.payload;
      state.error = undefined;
    },

    addCategory: (state, action: PayloadAction<Category>) => {
      state.items.push(action.payload);
    },

    updateCategory: (state, action: PayloadAction<Category>) => {
      const index = state.items.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },

    removeCategory: (state, action: PayloadAction<string>) => {
      const index = state.items.findIndex(item => item.id === action.payload);
      if (index !== -1) {
        state.items[index] = { ...state.items[index], isActive: false };
      }
    },

    sortCategories: (state) => {
      state.items.sort((a, b) => {
        // Sort by type first (income vs expense), then by sort order, then by name
        if (a.type !== b.type) {
          return a.type === 'income' ? -1 : 1;
        }
        if (a.sortOrder !== b.sortOrder) {
          return a.sortOrder - b.sortOrder;
        }
        return a.name.localeCompare(b.name);
      });
    },

    reset: () => initialState,
  },
});

export const {
  setLoading,
  setError,
  setCategories,
  addCategory,
  updateCategory,
  removeCategory,
  sortCategories,
  reset,
} = categoriesSlice.actions;

export default categoriesSlice.reducer;
