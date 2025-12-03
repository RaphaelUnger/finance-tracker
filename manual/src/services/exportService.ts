import { Transaction, Category } from '../types';
import { DatabaseService } from './databaseService';
import { CryptoService } from './cryptoService';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export interface ExportOptions {
  format: 'csv' | 'pdf' | 'json' | 'backup';
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  categories?: string[];
  includeDeleted?: boolean;
  password?: string; // For encrypted backups
}

export interface ImportResult {
  success: boolean;
  imported: number;
  errors: string[];
  duplicates: number;
}

class ExportService {
  private databaseService: DatabaseService;
  private cryptoService: CryptoService;

  constructor() {
    this.databaseService = new DatabaseService();
    this.cryptoService = new CryptoService();
  }

  /**
   * Export transactions to CSV format
   */
  async exportToCSV(options: ExportOptions): Promise<string> {
    try {
      const transactions = await this.getFilteredTransactions(options);
      const categories = await this.databaseService.getCategories();

      // Create category lookup map
      const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]));

      // CSV Header
      const headers = [
        'Date',
        'Amount',
        'Type',
        'Description',
        'Category',
        'Notes',
        'Created At'
      ];

      // Convert transactions to CSV rows
      const rows = transactions.map(transaction => [
        this.formatDateForExport(transaction.date),
        transaction.amount.toString(),
        transaction.type,
        `"${transaction.description.replace(/"/g, '""')}"`,
        categoryMap.get(transaction.categoryId) || 'Unknown',
        `"${(transaction.notes || '').replace(/"/g, '""')}"`,
        this.formatDateForExport(transaction.createdAt)
      ]);

      // Combine headers and rows
      const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

      return csvContent;
    } catch (error) {
      throw new Error(`CSV export failed: ${error.message}`);
    }
  }

  /**
   * Export data as encrypted backup
   */
  async exportBackup(options: ExportOptions): Promise<Blob> {
    try {
      if (!options.password) {
        throw new Error('Password required for backup export');
      }

      // Get all data
      const [transactions, categories, settings] = await Promise.all([
        this.databaseService.getTransactions(),
        this.databaseService.getCategories(),
        this.databaseService.getSettings()
      ]);

      const backupData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        data: {
          transactions,
          categories,
          settings
        }
      };

      // Encrypt the backup data
      const encryptedData = await this.cryptoService.encrypt(
        JSON.stringify(backupData),
        options.password
      );

      // Create backup file
      const backupContent = {
        app: 'finance-tracker',
        version: '1.0',
        encrypted: true,
        data: encryptedData
      };

      return new Blob([JSON.stringify(backupContent, null, 2)], {
        type: 'application/json'
      });
    } catch (error) {
      throw new Error(`Backup export failed: ${error.message}`);
    }
  }

  /**
   * Generate PDF report
   */
  async exportToPDF(options: ExportOptions): Promise<Blob> {
    try {
      const transactions = await this.getFilteredTransactions(options);
      const categories = await this.databaseService.getCategories();

      // Calculate summary statistics
      const stats = this.calculateStats(transactions);
      const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]));

      const pdf = new jsPDF();

      // Title
      pdf.setFontSize(20);
      pdf.text('Finance Tracker Report', 20, 20);

      // Date range
      pdf.setFontSize(12);
      if (options.dateRange) {
        pdf.text(
          `Period: ${this.formatDateForDisplay(options.dateRange.startDate)} - ${this.formatDateForDisplay(options.dateRange.endDate)}`,
          20,
          35
        );
      }

      // Summary section
      pdf.setFontSize(14);
      pdf.text('Summary', 20, 55);

      pdf.setFontSize(11);
      let yPos = 65;
      pdf.text(`Total Transactions: ${stats.totalTransactions}`, 20, yPos);
      yPos += 7;
      pdf.text(`Total Income: €${stats.totalIncome.toFixed(2)}`, 20, yPos);
      yPos += 7;
      pdf.text(`Total Expenses: €${stats.totalExpenses.toFixed(2)}`, 20, yPos);
      yPos += 7;
      pdf.text(`Net Amount: €${stats.netAmount.toFixed(2)}`, 20, yPos);
      yPos += 15;

      // Transactions table
      pdf.setFontSize(14);
      pdf.text('Transactions', 20, yPos);
      yPos += 10;

      const tableData = transactions.slice(0, 50).map(transaction => [
        this.formatDateForDisplay(transaction.date),
        `€${transaction.amount.toFixed(2)}`,
        transaction.type,
        transaction.description.substring(0, 30),
        categoryMap.get(transaction.categoryId) || 'Unknown'
      ]);

      (pdf as any).autoTable({
        head: [['Date', 'Amount', 'Type', 'Description', 'Category']],
        body: tableData,
        startY: yPos,
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 25, halign: 'right' },
          2: { cellWidth: 20 },
          3: { cellWidth: 40 },
          4: { cellWidth: 25 }
        }
      });

      if (transactions.length > 50) {
        const finalY = (pdf as any).lastAutoTable.finalY + 10;
        pdf.text(`... and ${transactions.length - 50} more transactions`, 20, finalY);
      }

      return pdf.output('blob');
    } catch (error) {
      throw new Error(`PDF export failed: ${error.message}`);
    }
  }

  /**
   * Import transactions from CSV
   */
  async importFromCSV(csvContent: string): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      imported: 0,
      errors: [],
      duplicates: 0
    };

    try {
      const lines = csvContent.trim().split('\n');
      if (lines.length < 2) {
        throw new Error('CSV file appears to be empty or invalid');
      }

      // Parse header
      const header = lines[0].toLowerCase().split(',').map(h => h.trim());
      const requiredFields = ['date', 'amount', 'description', 'type'];

      const missingFields = requiredFields.filter(field =>
        !header.some(h => h.includes(field))
      );

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Get existing categories for mapping
      const categories = await this.databaseService.getCategories();
      const categoryByName = new Map(
        categories.map(cat => [cat.name.toLowerCase(), cat.id])
      );

      // Process data rows
      for (let i = 1; i < lines.length; i++) {
        try {
          const row = this.parseCSVRow(lines[i]);
          if (row.length === 0) continue; // Skip empty rows

          const transaction = this.parseTransactionFromCSV(row, header, categoryByName);

          // Check for duplicates
          const isDuplicate = await this.checkDuplicate(transaction);
          if (isDuplicate) {
            result.duplicates++;
            continue;
          }

          // Save transaction
          await this.databaseService.addTransaction(transaction);
          result.imported++;

        } catch (error) {
          result.errors.push(`Row ${i + 1}: ${error.message}`);
        }
      }

    } catch (error) {
      result.success = false;
      result.errors.push(error.message);
    }

    return result;
  }

  /**
   * Import from encrypted backup
   */
  async importFromBackup(backupFile: Blob, password: string): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      imported: 0,
      errors: [],
      duplicates: 0
    };

    try {
      const backupContent = JSON.parse(await backupFile.text());

      if (!backupContent.encrypted || backupContent.app !== 'finance-tracker') {
        throw new Error('Invalid backup file format');
      }

      // Decrypt data
      const decryptedData = await this.cryptoService.decrypt(
        backupContent.data,
        password
      );

      const backupData = JSON.parse(decryptedData);

      // Restore categories first
      for (const category of backupData.data.categories) {
        try {
          await this.databaseService.addCategory(category);
        } catch (error) {
          // Category might already exist, continue
        }
      }

      // Restore transactions
      for (const transaction of backupData.data.transactions) {
        try {
          const isDuplicate = await this.checkDuplicate(transaction);
          if (!isDuplicate) {
            await this.databaseService.addTransaction(transaction);
            result.imported++;
          } else {
            result.duplicates++;
          }
        } catch (error) {
          result.errors.push(`Transaction ${transaction.id}: ${error.message}`);
        }
      }

    } catch (error) {
      result.success = false;
      result.errors.push(error.message);
    }

    return result;
  }

  private async getFilteredTransactions(options: ExportOptions): Promise<Transaction[]> {
    let transactions = await this.databaseService.getTransactions();

    // Apply date filter
    if (options.dateRange) {
      transactions = transactions.filter(t =>
        t.date >= options.dateRange!.startDate.getTime() &&
        t.date <= options.dateRange!.endDate.getTime()
      );
    }

    // Apply category filter
    if (options.categories && options.categories.length > 0) {
      transactions = transactions.filter(t =>
        options.categories!.includes(t.categoryId)
      );
    }

    // Filter deleted transactions unless explicitly included
    if (!options.includeDeleted) {
      transactions = transactions.filter(t => !t.deletedAt);
    }

    return transactions.sort((a, b) => b.date - a.date);
  }

  private calculateStats(transactions: Transaction[]) {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalTransactions: transactions.length,
      totalIncome,
      totalExpenses,
      netAmount: totalIncome - totalExpenses
    };
  }

  private parseCSVRow(row: string): string[] {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];

      if (char === '"') {
        if (inQuotes && row[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  private parseTransactionFromCSV(
    row: string[],
    header: string[],
    categoryMap: Map<string, string>
  ): Omit<Transaction, 'id'> {
    const getFieldValue = (fieldName: string): string => {
      const index = header.findIndex(h => h.includes(fieldName));
      return index >= 0 ? row[index] : '';
    };

    const dateStr = getFieldValue('date');
    const amountStr = getFieldValue('amount');
    const description = getFieldValue('description').replace(/^"|"$/g, '');
    const type = getFieldValue('type').toLowerCase();
    const categoryName = getFieldValue('category').toLowerCase();

    // Validate required fields
    if (!dateStr || !amountStr || !description || !type) {
      throw new Error('Missing required fields');
    }

    // Parse date
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date: ${dateStr}`);
    }

    // Parse amount
    const amount = parseFloat(amountStr.replace(/[€$,]/g, ''));
    if (isNaN(amount) || amount <= 0) {
      throw new Error(`Invalid amount: ${amountStr}`);
    }

    // Validate type
    if (!['income', 'expense'].includes(type)) {
      throw new Error(`Invalid type: ${type}. Must be 'income' or 'expense'`);
    }

    // Find category ID
    const categoryId = categoryMap.get(categoryName) || categoryMap.get('sonstiges') || '';

    return {
      amount,
      description,
      date: date.getTime(),
      type: type as 'income' | 'expense',
      categoryId,
      notes: getFieldValue('notes')?.replace(/^"|"$/g, '') || '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null
    };
  }

  private async checkDuplicate(transaction: Partial<Transaction>): Promise<boolean> {
    const existingTransactions = await this.databaseService.getTransactions();

    return existingTransactions.some(existing =>
      Math.abs(existing.date - transaction.date!) < 24 * 60 * 60 * 1000 && // Same day
      existing.amount === transaction.amount &&
      existing.description === transaction.description &&
      existing.type === transaction.type
    );
  }

  private formatDateForExport(timestamp: number): string {
    return new Date(timestamp).toISOString().split('T')[0];
  }

  private formatDateForDisplay(date: Date | number): string {
    const dateObj = typeof date === 'number' ? new Date(date) : date;
    return dateObj.toLocaleDateString('de-DE');
  }
}

export default new ExportService();
