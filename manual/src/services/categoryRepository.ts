import { databaseService } from './databaseService';
import { Category, CreateCategoryInput, UpdateCategoryInput, CategoryType, CategoryFilter, CategoryStats } from '../types/transaction';
import { generateId } from '../utils/helpers';

export interface CategorySearchOptions {
  query?: string;
  type?: CategoryType;
  isCustom?: boolean;
  isActive?: boolean;
  sortBy?: 'name' | 'usage' | 'created_at' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export class CategoryRepository {
  private static instance: CategoryRepository;

  private constructor() {}

  public static getInstance(): CategoryRepository {
    if (!CategoryRepository.instance) {
      CategoryRepository.instance = new CategoryRepository();
    }
    return CategoryRepository.instance;
  }

  /**
   * Get all categories with optional filtering
   */
  public async getCategories(options: CategorySearchOptions = {}): Promise<{
    categories: Category[];
    totalCount: number;
    hasMore: boolean;
  }> {
    try {
      const {
        query,
        type,
        isCustom,
        isActive = true,
        sortBy = 'name',
        sortOrder = 'asc',
        limit = 50,
        offset = 0,
      } = options;

      let whereConditions: string[] = [];
      let params: any[] = [];

      // Base condition - only active categories by default
      if (isActive) {
        whereConditions.push('deleted_at IS NULL');
      }

      // Filter by type
      if (type) {
        whereConditions.push('type = ? OR type = ?');
        params.push(type, 'both');
      }

      // Filter by custom status
      if (isCustom !== undefined) {
        whereConditions.push('is_custom = ?');
        params.push(isCustom ? 1 : 0);
      }

      // Search query
      if (query) {
        whereConditions.push('(name LIKE ? OR description LIKE ?)');
        params.push(`%${query}%`, `%${query}%`);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Build sort clause
      let sortClause = '';
      switch (sortBy) {
        case 'usage':
          sortClause = `ORDER BY usage_count ${sortOrder.toUpperCase()}, name ASC`;
          break;
        case 'created_at':
          sortClause = `ORDER BY created_at ${sortOrder.toUpperCase()}`;
          break;
        case 'updated_at':
          sortClause = `ORDER BY updated_at ${sortOrder.toUpperCase()}`;
          break;
        default:
          sortClause = `ORDER BY name ${sortOrder.toUpperCase()}`;
      }

      // Main query with usage count
      const query1 = `
        SELECT 
          c.*,
          COALESCE(usage.count, 0) as usage_count
        FROM categories c
        LEFT JOIN (
          SELECT category_id, COUNT(*) as count 
          FROM transactions 
          WHERE deleted_at IS NULL 
          GROUP BY category_id
        ) usage ON c.id = usage.category_id
        ${whereClause}
        ${sortClause}
        LIMIT ? OFFSET ?
      `;

      const countQuery = `
        SELECT COUNT(*) as total
        FROM categories c
        ${whereClause}
      `;

      const [categoriesResult, countResult] = await Promise.all([
        databaseService.executeQuery(query1, [...params, limit, offset]),
        databaseService.executeQuery(countQuery, params),
      ]);

      const categories: Category[] = categoriesResult.map(row => ({
        id: row.id,
        name: row.name,
        icon: row.icon,
        color: row.color,
        type: row.type as CategoryType,
        isCustom: Boolean(row.is_custom),
        description: row.description || undefined,
        parentId: row.parent_id || undefined,
        usageCount: row.usage_count || 0,
        isActive: !row.deleted_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      const totalCount = countResult[0]?.total || 0;
      const hasMore = offset + categories.length < totalCount;

      return { categories, totalCount, hasMore };
    } catch (error) {
      throw new Error(`Failed to get categories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get category by ID
   */
  public async getCategoryById(id: string): Promise<Category | null> {
    try {
      const query = `
        SELECT 
          c.*,
          COALESCE(usage.count, 0) as usage_count
        FROM categories c
        LEFT JOIN (
          SELECT category_id, COUNT(*) as count 
          FROM transactions 
          WHERE deleted_at IS NULL 
          GROUP BY category_id
        ) usage ON c.id = usage.category_id
        WHERE c.id = ? AND c.deleted_at IS NULL
      `;

      const result = await databaseService.executeQuery(query, [id]);

      if (result.length === 0) {
        return null;
      }

      const row = result[0];
      return {
        id: row.id,
        name: row.name,
        icon: row.icon,
        color: row.color,
        type: row.type as CategoryType,
        isCustom: Boolean(row.is_custom),
        description: row.description || undefined,
        parentId: row.parent_id || undefined,
        usageCount: row.usage_count || 0,
        isActive: true,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (error) {
      throw new Error(`Failed to get category: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create new category
   */
  public async createCategory(input: CreateCategoryInput): Promise<Category> {
    try {
      const id = generateId();
      const now = Math.floor(Date.now() / 1000);

      // Validate input
      if (!input.name || input.name.trim().length === 0) {
        throw new Error('Category name is required');
      }

      if (input.name.length > 50) {
        throw new Error('Category name must be 50 characters or less');
      }

      // Check for duplicate names (case-insensitive)
      const existingCategories = await this.getCategories({
        query: input.name,
        type: input.type,
      });

      const duplicateCategory = existingCategories.categories.find(
        cat => cat.name.toLowerCase() === input.name.trim().toLowerCase()
      );

      if (duplicateCategory) {
        throw new Error('A category with this name already exists');
      }

      const query = `
        INSERT INTO categories (
          id, name, icon, color, type, description, parent_id, is_custom, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        id,
        input.name.trim(),
        input.icon,
        input.color,
        input.type,
        input.description || null,
        input.parentId || null,
        1, // Custom categories
        now,
        now,
      ];

      await databaseService.executeQuery(query, params);

      const createdCategory = await this.getCategoryById(id);
      if (!createdCategory) {
        throw new Error('Failed to retrieve created category');
      }

      return createdCategory;
    } catch (error) {
      throw new Error(`Failed to create category: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update category
   */
  public async updateCategory(input: UpdateCategoryInput): Promise<Category> {
    try {
      const existingCategory = await this.getCategoryById(input.id);
      if (!existingCategory) {
        throw new Error('Category not found');
      }

      if (!existingCategory.isCustom) {
        throw new Error('Default categories cannot be modified');
      }

      const now = Math.floor(Date.now() / 1000);
      const updateFields: string[] = [];
      const params: any[] = [];

      if (input.name !== undefined) {
        updateFields.push('name = ?');
        params.push(input.name.trim());
      }

      if (input.icon !== undefined) {
        updateFields.push('icon = ?');
        params.push(input.icon);
      }

      if (input.color !== undefined) {
        updateFields.push('color = ?');
        params.push(input.color);
      }

      if (input.description !== undefined) {
        updateFields.push('description = ?');
        params.push(input.description || null);
      }

      updateFields.push('updated_at = ?');
      params.push(now);

      const query = `
        UPDATE categories 
        SET ${updateFields.join(', ')}
        WHERE id = ? AND deleted_at IS NULL
      `;

      params.push(input.id);

      await databaseService.executeQuery(query, params);

      const updatedCategory = await this.getCategoryById(input.id);
      if (!updatedCategory) {
        throw new Error('Failed to retrieve updated category');
      }

      return updatedCategory;
    } catch (error) {
      throw new Error(`Failed to update category: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete category (soft delete)
   */
  public async deleteCategory(id: string): Promise<void> {
    try {
      const category = await this.getCategoryById(id);
      if (!category) {
        throw new Error('Category not found');
      }

      if (!category.isCustom) {
        throw new Error('Default categories cannot be deleted');
      }

      // Check if category is in use
      const usageQuery = `
        SELECT COUNT(*) as count 
        FROM transactions 
        WHERE category_id = ? AND deleted_at IS NULL
      `;

      const usageResult = await databaseService.executeQuery(usageQuery, [id]);
      const usageCount = usageResult[0]?.count || 0;

      if (usageCount > 0) {
        throw new Error(`Category cannot be deleted as it is used in ${usageCount} transaction(s)`);
      }

      const now = Math.floor(Date.now() / 1000);
      const deleteQuery = `
        UPDATE categories 
        SET deleted_at = ?, updated_at = ? 
        WHERE id = ? AND deleted_at IS NULL
      `;

      await databaseService.executeQuery(deleteQuery, [now, now, id]);
    } catch (error) {
      throw new Error(`Failed to delete category: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get category statistics
   */
  public async getCategoryStats(
    startDate?: number,
    endDate?: number
  ): Promise<CategoryStats[]> {
    try {
      let whereConditions = ['t.deleted_at IS NULL', 'c.deleted_at IS NULL'];
      let params: any[] = [];

      if (startDate) {
        whereConditions.push('t.date >= ?');
        params.push(startDate);
      }

      if (endDate) {
        whereConditions.push('t.date <= ?');
        params.push(endDate);
      }

      const query = `
        SELECT 
          c.id,
          c.name,
          c.icon,
          c.color,
          c.type,
          COUNT(t.id) as transaction_count,
          SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as total_income,
          SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as total_expense,
          SUM(t.amount) as total_amount,
          AVG(t.amount) as avg_amount,
          MIN(t.amount) as min_amount,
          MAX(t.amount) as max_amount,
          MIN(t.date) as first_transaction_date,
          MAX(t.date) as last_transaction_date
        FROM categories c
        LEFT JOIN transactions t ON c.id = t.category_id
        WHERE ${whereConditions.join(' AND ')}
        GROUP BY c.id, c.name, c.icon, c.color, c.type
        HAVING transaction_count > 0
        ORDER BY total_amount DESC
      `;

      const result = await databaseService.executeQuery(query, params);

      return result.map(row => ({
        categoryId: row.id,
        categoryName: row.name,
        categoryIcon: row.icon,
        categoryColor: row.color,
        categoryType: row.type as CategoryType,
        transactionCount: row.transaction_count || 0,
        totalIncome: row.total_income || 0,
        totalExpense: row.total_expense || 0,
        totalAmount: row.total_amount || 0,
        averageAmount: row.avg_amount || 0,
        minAmount: row.min_amount || 0,
        maxAmount: row.max_amount || 0,
        firstTransactionDate: row.first_transaction_date || null,
        lastTransactionDate: row.last_transaction_date || null,
      }));
    } catch (error) {
      throw new Error(`Failed to get category statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get popular categories (most used)
   */
  public async getPopularCategories(
    type?: CategoryType,
    limit: number = 10
  ): Promise<Category[]> {
    try {
      const options: CategorySearchOptions = {
        type,
        sortBy: 'usage',
        sortOrder: 'desc',
        limit,
      };

      const result = await this.getCategories(options);
      return result.categories.filter(cat => cat.usageCount > 0);
    } catch (error) {
      throw new Error(`Failed to get popular categories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search categories by name or description
   */
  public async searchCategories(
    query: string,
    type?: CategoryType,
    limit: number = 20
  ): Promise<Category[]> {
    try {
      const options: CategorySearchOptions = {
        query,
        type,
        limit,
        sortBy: 'usage',
        sortOrder: 'desc',
      };

      const result = await this.getCategories(options);
      return result.categories;
    } catch (error) {
      throw new Error(`Failed to search categories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const categoryRepository = CategoryRepository.getInstance();
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToCategory(result.rows.item(0));
  }

  public async findAll(type?: 'income' | 'expense'): Promise<Category[]> {
    let query = 'SELECT * FROM categories';
    const params: any[] = [];

    if (type) {
      query += ' WHERE type = ? OR type = "both"';
      params.push(type);
    }

    query += ' ORDER BY is_custom ASC, name ASC';

    const [result] = await databaseService.executeQuery(query, params);
    const categories: Category[] = [];

    for (let i = 0; i < result.rows.length; i++) {
      categories.push(this.mapRowToCategory(result.rows.item(i)));
    }

    return categories;
  }

  public async update(id: string, input: Partial<CreateCategoryInput>): Promise<Category> {
    const existingCategory = await this.findById(id);
    if (!existingCategory) {
      throw new Error(`Category with id ${id} not found`);
    }

    if (!existingCategory.isCustom) {
      throw new Error('Default categories cannot be modified');
    }

    const now = Math.floor(Date.now() / 1000);
    const updatedCategory: Category = {
      ...existingCategory,
      ...input,
      updatedAt: now,
    };

    await databaseService.executeQuery(
      `UPDATE categories SET 
       name = ?, icon = ?, color = ?, type = ?, updated_at = ?
       WHERE id = ?`,
      [
        updatedCategory.name,
        updatedCategory.icon,
        updatedCategory.color,
        updatedCategory.type,
        updatedCategory.updatedAt,
        updatedCategory.id,
      ]
    );

    return updatedCategory;
  }

  public async delete(id: string): Promise<void> {
    const category = await this.findById(id);
    if (!category) {
      throw new Error(`Category with id ${id} not found`);
    }

    if (!category.isCustom) {
      throw new Error('Default categories cannot be deleted');
    }

    // Check if category is in use
    const [result] = await databaseService.executeQuery(
      'SELECT COUNT(*) as count FROM transactions WHERE category_id = ? AND deleted_at IS NULL',
      [id]
    );

    if (result.rows.item(0).count > 0) {
      throw new Error('Cannot delete category that is in use by transactions');
    }

    await databaseService.executeQuery(
      'DELETE FROM categories WHERE id = ?',
      [id]
    );
  }

  private mapRowToCategory(row: any): Category {
    return {
      id: row.id,
      name: row.name,
      icon: row.icon,
      color: row.color,
      type: row.type,
      isCustom: row.is_custom === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const categoryRepository = CategoryRepository.getInstance();
