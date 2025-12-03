import { categoryRepository, CategorySearchOptions } from '../../src/services/categoryRepository';
import { databaseService } from '../../src/services/databaseService';
import { CreateCategoryInput, UpdateCategoryInput, CategoryType, CategoryStats } from '../../src/types/transaction';

// Mock dependencies
jest.mock('../../src/services/databaseService');
jest.mock('../../src/utils/helpers', () => ({
  generateId: jest.fn(() => 'mock-id-' + Date.now()),
}));

describe('CategoryRepository - Sprint 4 Enhanced Features', () => {
  const mockDatabaseService = databaseService as jest.Mocked<typeof databaseService>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Math, 'floor').mockReturnValue(1640995200); // Mock timestamp
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getCategories with advanced filtering', () => {
    const mockCategories = [
      {
        id: 'cat-1',
        name: 'Food',
        icon: '🍔',
        color: '#FF5733',
        type: 'expense',
        is_custom: 0,
        description: 'Food and dining',
        parent_id: null,
        deleted_at: null,
        created_at: 1640995200,
        updated_at: 1640995200,
        usage_count: 15,
      },
      {
        id: 'cat-2',
        name: 'Salary',
        icon: '💰',
        color: '#10B981',
        type: 'income',
        is_custom: 0,
        description: null,
        parent_id: null,
        deleted_at: null,
        created_at: 1640995200,
        updated_at: 1640995200,
        usage_count: 12,
      },
    ];

    it('should get categories with default options', async () => {
      mockDatabaseService.executeQuery
        .mockResolvedValueOnce(mockCategories) // Main query
        .mockResolvedValueOnce([{ total: 2 }]); // Count query

      const result = await categoryRepository.getCategories();

      expect(result.categories).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(result.hasMore).toBe(false);
      expect(result.categories[0]).toMatchObject({
        id: 'cat-1',
        name: 'Food',
        icon: '🍔',
        color: '#FF5733',
        type: 'expense',
        isCustom: false,
        usageCount: 15,
      });
    });

    it('should filter by category type', async () => {
      mockDatabaseService.executeQuery
        .mockResolvedValueOnce([mockCategories[1]]) // Only income category
        .mockResolvedValueOnce([{ total: 1 }]);

      const options: CategorySearchOptions = {
        type: 'income',
      };

      const result = await categoryRepository.getCategories(options);

      expect(mockDatabaseService.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('type = ? OR type = ?'),
        expect.arrayContaining(['income', 'both', 50, 0])
      );
      expect(result.categories).toHaveLength(1);
      expect(result.categories[0].type).toBe('income');
    });

    it('should filter by custom status', async () => {
      mockDatabaseService.executeQuery
        .mockResolvedValueOnce([]) // No custom categories
        .mockResolvedValueOnce([{ total: 0 }]);

      const options: CategorySearchOptions = {
        isCustom: true,
      };

      await categoryRepository.getCategories(options);

      expect(mockDatabaseService.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('is_custom = ?'),
        expect.arrayContaining([1, 50, 0])
      );
    });

    it('should search by query', async () => {
      mockDatabaseService.executeQuery
        .mockResolvedValueOnce([mockCategories[0]]) // Food category matches
        .mockResolvedValueOnce([{ total: 1 }]);

      const options: CategorySearchOptions = {
        query: 'food',
      };

      await categoryRepository.getCategories(options);

      expect(mockDatabaseService.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('(name LIKE ? OR description LIKE ?)'),
        expect.arrayContaining(['%food%', '%food%', 50, 0])
      );
    });

    it('should sort by usage count', async () => {
      mockDatabaseService.executeQuery
        .mockResolvedValueOnce(mockCategories)
        .mockResolvedValueOnce([{ total: 2 }]);

      const options: CategorySearchOptions = {
        sortBy: 'usage',
        sortOrder: 'desc',
      };

      await categoryRepository.getCategories(options);

      expect(mockDatabaseService.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY usage_count DESC'),
        expect.anything()
      );
    });

    it('should handle pagination', async () => {
      mockDatabaseService.executeQuery
        .mockResolvedValueOnce([mockCategories[0]]) // One result
        .mockResolvedValueOnce([{ total: 2 }]); // Total count

      const options: CategorySearchOptions = {
        limit: 1,
        offset: 0,
      };

      const result = await categoryRepository.getCategories(options);

      expect(result.categories).toHaveLength(1);
      expect(result.totalCount).toBe(2);
      expect(result.hasMore).toBe(true);
    });
  });

  describe('createCategory with enhanced validation', () => {
    it('should create category successfully', async () => {
      const input: CreateCategoryInput = {
        name: 'Custom Food',
        icon: '🥗',
        color: '#22C55E',
        type: 'expense',
        description: 'Healthy food options',
      };

      mockDatabaseService.executeQuery
        .mockResolvedValueOnce([]) // No duplicate check
        .mockResolvedValueOnce([{ total: 0 }]) // Count query for duplicates
        .mockResolvedValueOnce([]); // Insert query

      // Mock getCategoryById to return the created category
      jest.spyOn(categoryRepository, 'getCategoryById').mockResolvedValueOnce({
        id: 'mock-id-1640995200000',
        name: 'Custom Food',
        icon: '🥗',
        color: '#22C55E',
        type: 'expense',
        isCustom: true,
        description: 'Healthy food options',
        usageCount: 0,
        isActive: true,
        createdAt: 1640995200,
        updatedAt: 1640995200,
      });

      const result = await categoryRepository.createCategory(input);

      expect(result.name).toBe('Custom Food');
      expect(result.isCustom).toBe(true);
      expect(mockDatabaseService.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO categories'),
        expect.arrayContaining([
          'mock-id-1640995200000',
          'Custom Food',
          '🥗',
          '#22C55E',
          'expense',
          'Healthy food options',
          null,
          1,
          1640995200,
          1640995200,
        ])
      );
    });

    it('should reject empty category name', async () => {
      const input: CreateCategoryInput = {
        name: '',
        icon: '🥗',
        color: '#22C55E',
        type: 'expense',
      };

      await expect(categoryRepository.createCategory(input))
        .rejects
        .toThrow('Category name is required');
    });

    it('should reject name longer than 50 characters', async () => {
      const input: CreateCategoryInput = {
        name: 'A'.repeat(51),
        icon: '🥗',
        color: '#22C55E',
        type: 'expense',
      };

      await expect(categoryRepository.createCategory(input))
        .rejects
        .toThrow('Category name must be 50 characters or less');
    });

    it('should reject duplicate category names', async () => {
      const input: CreateCategoryInput = {
        name: 'Food',
        icon: '🥗',
        color: '#22C55E',
        type: 'expense',
      };

      // Mock duplicate check
      mockDatabaseService.executeQuery
        .mockResolvedValueOnce([mockCategories[0]]) // Duplicate found
        .mockResolvedValueOnce([{ total: 1 }]);

      await expect(categoryRepository.createCategory(input))
        .rejects
        .toThrow('A category with this name already exists');
    });
  });

  describe('updateCategory', () => {
    const existingCategory = {
      id: 'cat-1',
      name: 'Food',
      icon: '🍔',
      color: '#FF5733',
      type: 'expense' as CategoryType,
      isCustom: true,
      usageCount: 15,
      isActive: true,
      createdAt: 1640995200,
      updatedAt: 1640995200,
    };

    it('should update category successfully', async () => {
      const input: UpdateCategoryInput = {
        id: 'cat-1',
        name: 'Updated Food',
        description: 'Updated description',
      };

      jest.spyOn(categoryRepository, 'getCategoryById')
        .mockResolvedValueOnce(existingCategory) // Initial fetch
        .mockResolvedValueOnce({ ...existingCategory, name: 'Updated Food' }); // After update

      mockDatabaseService.executeQuery.mockResolvedValueOnce([]); // Update query

      const result = await categoryRepository.updateCategory(input);

      expect(result.name).toBe('Updated Food');
      expect(mockDatabaseService.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE categories'),
        expect.arrayContaining(['Updated Food', 'Updated description', 1640995200, 'cat-1'])
      );
    });

    it('should reject updating non-custom category', async () => {
      const nonCustomCategory = { ...existingCategory, isCustom: false };
      jest.spyOn(categoryRepository, 'getCategoryById').mockResolvedValueOnce(nonCustomCategory);

      const input: UpdateCategoryInput = {
        id: 'cat-1',
        name: 'Updated Name',
      };

      await expect(categoryRepository.updateCategory(input))
        .rejects
        .toThrow('Default categories cannot be modified');
    });

    it('should reject updating to duplicate name', async () => {
      const input: UpdateCategoryInput = {
        id: 'cat-1',
        name: 'Salary', // Existing name from another category
      };

      jest.spyOn(categoryRepository, 'getCategoryById').mockResolvedValueOnce(existingCategory);

      // Mock duplicate check
      mockDatabaseService.executeQuery
        .mockResolvedValueOnce([{ id: 'cat-2', name: 'Salary' }]) // Duplicate found
        .mockResolvedValueOnce([{ total: 1 }]);

      await expect(categoryRepository.updateCategory(input))
        .rejects
        .toThrow('A category with this name already exists');
    });
  });

  describe('deleteCategory', () => {
    it('should delete unused custom category', async () => {
      const customCategory = {
        id: 'cat-1',
        name: 'Custom Category',
        icon: '📁',
        color: '#3B82F6',
        type: 'expense' as CategoryType,
        isCustom: true,
        usageCount: 0,
        isActive: true,
        createdAt: 1640995200,
        updatedAt: 1640995200,
      };

      jest.spyOn(categoryRepository, 'getCategoryById').mockResolvedValueOnce(customCategory);

      mockDatabaseService.executeQuery
        .mockResolvedValueOnce([{ count: 0 }]) // No transactions using this category
        .mockResolvedValueOnce([{ count: 0 }]) // No child categories
        .mockResolvedValueOnce([]); // Delete query

      await categoryRepository.deleteCategory('cat-1');

      expect(mockDatabaseService.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE categories SET deleted_at = ?'),
        expect.arrayContaining([1640995200, 1640995200, 'cat-1'])
      );
    });

    it('should reject deleting default category', async () => {
      const defaultCategory = {
        id: 'cat-1',
        name: 'Food',
        icon: '🍔',
        color: '#FF5733',
        type: 'expense' as CategoryType,
        isCustom: false,
        usageCount: 15,
        isActive: true,
        createdAt: 1640995200,
        updatedAt: 1640995200,
      };

      jest.spyOn(categoryRepository, 'getCategoryById').mockResolvedValueOnce(defaultCategory);

      await expect(categoryRepository.deleteCategory('cat-1'))
        .rejects
        .toThrow('Default categories cannot be deleted');
    });

    it('should reject deleting category in use', async () => {
      const customCategory = {
        id: 'cat-1',
        name: 'Custom Category',
        icon: '📁',
        color: '#3B82F6',
        type: 'expense' as CategoryType,
        isCustom: true,
        usageCount: 5,
        isActive: true,
        createdAt: 1640995200,
        updatedAt: 1640995200,
      };

      jest.spyOn(categoryRepository, 'getCategoryById').mockResolvedValueOnce(customCategory);

      mockDatabaseService.executeQuery.mockResolvedValueOnce([{ count: 5 }]); // 5 transactions using this category

      await expect(categoryRepository.deleteCategory('cat-1'))
        .rejects
        .toThrow('Category cannot be deleted as it is used in 5 transaction(s)');
    });
  });

  describe('getCategoryStats', () => {
    const mockStatsData = [
      {
        id: 'cat-1',
        name: 'Food',
        icon: '🍔',
        color: '#FF5733',
        type: 'expense',
        transaction_count: 15,
        total_income: 0,
        total_expense: 450.75,
        total_amount: 450.75,
        avg_amount: 30.05,
        min_amount: 5.99,
        max_amount: 89.50,
        first_transaction_date: 1640995200,
        last_transaction_date: 1641081600,
      },
      {
        id: 'cat-2',
        name: 'Salary',
        icon: '💰',
        color: '#10B981',
        type: 'income',
        transaction_count: 3,
        total_income: 3000,
        total_expense: 0,
        total_amount: 3000,
        avg_amount: 1000,
        min_amount: 1000,
        max_amount: 1000,
        first_transaction_date: 1640995200,
        last_transaction_date: 1641081600,
      },
    ];

    it('should get category statistics for all time', async () => {
      mockDatabaseService.executeQuery.mockResolvedValueOnce(mockStatsData);

      const result = await categoryRepository.getCategoryStats();

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        categoryId: 'cat-1',
        categoryName: 'Food',
        categoryType: 'expense',
        transactionCount: 15,
        totalExpense: 450.75,
        averageAmount: 30.05,
        minAmount: 5.99,
        maxAmount: 89.50,
      });
      expect(result[1]).toMatchObject({
        categoryId: 'cat-2',
        categoryName: 'Salary',
        categoryType: 'income',
        totalIncome: 3000,
      });
    });

    it('should get category statistics for date range', async () => {
      const startDate = 1640995200;
      const endDate = 1641081600;

      mockDatabaseService.executeQuery.mockResolvedValueOnce([mockStatsData[0]]);

      await categoryRepository.getCategoryStats(startDate, endDate);

      expect(mockDatabaseService.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('t.date >= ?'),
        expect.arrayContaining([startDate, endDate])
      );
    });
  });

  describe('getPopularCategories', () => {
    it('should get popular categories by usage', async () => {
      const popularCategories = [
        { ...mockCategories[0], usage_count: 25 },
        { ...mockCategories[1], usage_count: 20 },
      ];

      mockDatabaseService.executeQuery
        .mockResolvedValueOnce(popularCategories)
        .mockResolvedValueOnce([{ total: 2 }]);

      const result = await categoryRepository.getPopularCategories('expense', 5);

      expect(result).toHaveLength(2);
      expect(result[0].usageCount).toBe(25);
      expect(result[1].usageCount).toBe(20);
    });

    it('should filter out categories with zero usage', async () => {
      mockDatabaseService.executeQuery
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ total: 0 }]);

      const result = await categoryRepository.getPopularCategories();

      expect(result).toHaveLength(0);
    });
  });

  describe('searchCategories', () => {
    it('should search categories by name', async () => {
      mockDatabaseService.executeQuery
        .mockResolvedValueOnce([mockCategories[0]])
        .mockResolvedValueOnce([{ total: 1 }]);

      const result = await categoryRepository.searchCategories('food');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Food');
    });

    it('should search with type filter', async () => {
      mockDatabaseService.executeQuery
        .mockResolvedValueOnce([mockCategories[1]])
        .mockResolvedValueOnce([{ total: 1 }]);

      const result = await categoryRepository.searchCategories('salary', 'income');

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('income');
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockDatabaseService.executeQuery.mockRejectedValueOnce(new Error('Database connection failed'));

      await expect(categoryRepository.getCategories())
        .rejects
        .toThrow('Failed to get categories: Database connection failed');
    });

    it('should handle invalid category ID', async () => {
      jest.spyOn(categoryRepository, 'getCategoryById').mockResolvedValueOnce(null);

      await expect(categoryRepository.updateCategory({ id: 'invalid-id', name: 'Test' }))
        .rejects
        .toThrow('Category not found');
    });
  });
});
