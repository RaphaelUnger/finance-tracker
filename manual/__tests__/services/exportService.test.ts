import ExportService from '../../services/exportService';
import { DatabaseService } from '../../services/databaseService';
import { CryptoService } from '../../services/cryptoService';
import { Transaction, Category } from '../../types';

// Mock dependencies
jest.mock('../../services/databaseService');
jest.mock('../../services/cryptoService');
jest.mock('jspdf');
jest.mock('jspdf-autotable');

const mockDatabaseService = DatabaseService as jest.Mocked<typeof DatabaseService>;
const mockCryptoService = CryptoService as jest.Mocked<typeof CryptoService>;

describe('ExportService', () => {
  const mockTransactions: Transaction[] = [
    {
      id: '1',
      amount: 50.00,
      description: 'Groceries',
      date: new Date('2025-01-15').getTime(),
      type: 'expense',
      categoryId: 'cat1',
      notes: 'Weekly shopping',
      createdAt: new Date('2025-01-15').getTime(),
      updatedAt: new Date('2025-01-15').getTime(),
      deletedAt: null
    },
    {
      id: '2',
      amount: 2500.00,
      description: 'Salary',
      date: new Date('2025-01-01').getTime(),
      type: 'income',
      categoryId: 'cat2',
      notes: 'Monthly salary',
      createdAt: new Date('2025-01-01').getTime(),
      updatedAt: new Date('2025-01-01').getTime(),
      deletedAt: null
    }
  ];

  const mockCategories: Category[] = [
    {
      id: 'cat1',
      name: 'Lebensmittel',
      icon: 'shopping-cart',
      color: '#4CAF50',
      type: 'expense',
      isDefault: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null
    },
    {
      id: 'cat2',
      name: 'Gehalt',
      icon: 'account-balance',
      color: '#2196F3',
      type: 'income',
      isDefault: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    mockDatabaseService.prototype.getTransactions = jest.fn().mockResolvedValue(mockTransactions);
    mockDatabaseService.prototype.getCategories = jest.fn().mockResolvedValue(mockCategories);
    mockDatabaseService.prototype.getSettings = jest.fn().mockResolvedValue({});
    mockDatabaseService.prototype.addTransaction = jest.fn().mockResolvedValue('new-id');
    mockDatabaseService.prototype.addCategory = jest.fn().mockResolvedValue('new-cat-id');

    mockCryptoService.prototype.encrypt = jest.fn().mockResolvedValue('encrypted-data');
    mockCryptoService.prototype.decrypt = jest.fn().mockResolvedValue('{"data": {"transactions": [], "categories": [], "settings": {}}}');
  });

  describe('CSV Export', () => {
    it('should export transactions to CSV format', async () => {
      const options = {
        format: 'csv' as const
      };

      const csvContent = await ExportService.exportToCSV(options);

      expect(csvContent).toContain('Date,Amount,Type,Description,Category,Notes,Created At');
      expect(csvContent).toContain('2025-01-15,50,expense,"Groceries",Lebensmittel,"Weekly shopping"');
      expect(csvContent).toContain('2025-01-01,2500,income,"Salary",Gehalt,"Monthly salary"');
    });

    it('should handle date range filtering', async () => {
      const options = {
        format: 'csv' as const,
        dateRange: {
          startDate: new Date('2025-01-10'),
          endDate: new Date('2025-01-20')
        }
      };

      const csvContent = await ExportService.exportToCSV(options);

      // Should only contain transaction from 2025-01-15 (within range)
      expect(csvContent).toContain('2025-01-15,50,expense');
      expect(csvContent).not.toContain('2025-01-01,2500,income');
    });

    it('should handle category filtering', async () => {
      const options = {
        format: 'csv' as const,
        categories: ['cat1'] // Only groceries category
      };

      const csvContent = await ExportService.exportToCSV(options);

      expect(csvContent).toContain('Groceries');
      expect(csvContent).not.toContain('Salary');
    });

    it('should escape CSV special characters', async () => {
      const specialTransaction: Transaction = {
        ...mockTransactions[0],
        description: 'Test "with quotes" and, commas',
        notes: 'Notes with "quotes"'
      };

      mockDatabaseService.prototype.getTransactions = jest.fn().mockResolvedValue([specialTransaction]);

      const csvContent = await ExportService.exportToCSV({ format: 'csv' });

      expect(csvContent).toContain('"Test ""with quotes"" and, commas"');
      expect(csvContent).toContain('"Notes with ""quotes"""');
    });
  });

  describe('Backup Export/Import', () => {
    it('should create encrypted backup', async () => {
      const options = {
        format: 'backup' as const,
        password: 'test-password'
      };

      const backupBlob = await ExportService.exportBackup(options);
      const backupText = await backupBlob.text();
      const backupData = JSON.parse(backupText);

      expect(backupData.app).toBe('finance-tracker');
      expect(backupData.version).toBe('1.0');
      expect(backupData.encrypted).toBe(true);
      expect(backupData.data).toBe('encrypted-data');

      expect(mockCryptoService.prototype.encrypt).toHaveBeenCalledWith(
        expect.stringContaining('"transactions"'),
        'test-password'
      );
    });

    it('should throw error if no password provided for backup', async () => {
      const options = {
        format: 'backup' as const
        // No password
      };

      await expect(ExportService.exportBackup(options)).rejects.toThrow('Password required for backup export');
    });

    it('should import from encrypted backup', async () => {
      const mockBackupData = {
        app: 'finance-tracker',
        version: '1.0',
        encrypted: true,
        data: 'encrypted-backup-content'
      };

      const backupBlob = new Blob([JSON.stringify(mockBackupData)], { type: 'application/json' });

      // Mock decryption to return valid backup data
      const decryptedData = JSON.stringify({
        version: '1.0',
        exportDate: '2025-01-15T10:00:00.000Z',
        data: {
          transactions: [mockTransactions[0]],
          categories: [mockCategories[0]],
          settings: {}
        }
      });

      mockCryptoService.prototype.decrypt = jest.fn().mockResolvedValue(decryptedData);

      const result = await ExportService.importFromBackup(backupBlob, 'test-password');

      expect(result.success).toBe(true);
      expect(result.imported).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(mockCryptoService.prototype.decrypt).toHaveBeenCalledWith('encrypted-backup-content', 'test-password');
      expect(mockDatabaseService.prototype.addCategory).toHaveBeenCalled();
      expect(mockDatabaseService.prototype.addTransaction).toHaveBeenCalled();
    });

    it('should handle invalid backup format', async () => {
      const invalidBackup = new Blob(['{"invalid": "format"}'], { type: 'application/json' });

      const result = await ExportService.importFromBackup(invalidBackup, 'password');

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid backup file format');
    });
  });

  describe('CSV Import', () => {
    it('should import valid CSV data', async () => {
      const csvContent = `Date,Amount,Type,Description,Category
2025-01-20,25.50,expense,Coffee,Food
2025-01-21,100.00,income,Freelance,Income`;

      // Mock no existing duplicates
      mockDatabaseService.prototype.getTransactions = jest.fn().mockResolvedValue([]);

      const result = await ExportService.importFromCSV(csvContent);

      expect(result.success).toBe(true);
      expect(result.imported).toBe(2);
      expect(result.duplicates).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate required fields', async () => {
      const invalidCsv = `Date,Description
2025-01-20,Coffee`; // Missing amount and type

      const result = await ExportService.importFromCSV(invalidCsv);

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Missing required fields');
    });

    it('should detect and skip duplicates', async () => {
      const csvContent = `Date,Amount,Type,Description,Category
2025-01-15,50.00,expense,Groceries,Food`; // Same as mockTransactions[0]

      const result = await ExportService.importFromCSV(csvContent);

      expect(result.success).toBe(true);
      expect(result.imported).toBe(0);
      expect(result.duplicates).toBe(1);
    });

    it('should handle invalid amounts', async () => {
      const csvContent = `Date,Amount,Type,Description,Category
2025-01-20,invalid,expense,Coffee,Food`;

      const result = await ExportService.importFromCSV(csvContent);

      expect(result.success).toBe(true);
      expect(result.imported).toBe(0);
      expect(result.errors).toContain('Row 2: Invalid amount: invalid');
    });

    it('should handle invalid dates', async () => {
      const csvContent = `Date,Amount,Type,Description,Category
invalid-date,25.50,expense,Coffee,Food`;

      const result = await ExportService.importFromCSV(csvContent);

      expect(result.success).toBe(true);
      expect(result.imported).toBe(0);
      expect(result.errors).toContain('Row 2: Invalid date: invalid-date');
    });

    it('should handle invalid transaction types', async () => {
      const csvContent = `Date,Amount,Type,Description,Category
2025-01-20,25.50,invalid,Coffee,Food`;

      const result = await ExportService.importFromCSV(csvContent);

      expect(result.success).toBe(true);
      expect(result.imported).toBe(0);
      expect(result.errors).toContain("Row 2: Invalid type: invalid. Must be 'income' or 'expense'");
    });
  });

  describe('PDF Export', () => {
    it('should generate PDF with transaction data', async () => {
      const mockPDF = {
        setFontSize: jest.fn(),
        text: jest.fn(),
        autoTable: jest.fn(),
        output: jest.fn().mockReturnValue(new Blob(['pdf-content'], { type: 'application/pdf' }))
      };

      // Mock jsPDF
      const jsPDF = require('jspdf');
      jsPDF.mockImplementation(() => mockPDF);

      const options = {
        format: 'pdf' as const
      };

      const pdfBlob = await ExportService.exportToPDF(options);

      expect(pdfBlob).toBeInstanceOf(Blob);
      expect(mockPDF.text).toHaveBeenCalledWith('Finance Tracker Report', 20, 20);
      expect(mockPDF.autoTable).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors during export', async () => {
      mockDatabaseService.prototype.getTransactions = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(ExportService.exportToCSV({ format: 'csv' })).rejects.toThrow('CSV export failed: Database error');
    });

    it('should handle encryption errors during backup', async () => {
      mockCryptoService.prototype.encrypt = jest.fn().mockRejectedValue(new Error('Encryption failed'));

      await expect(ExportService.exportBackup({
        format: 'backup',
        password: 'test'
      })).rejects.toThrow('Backup export failed: Encryption failed');
    });

    it('should handle decryption errors during import', async () => {
      const backupBlob = new Blob([JSON.stringify({
        app: 'finance-tracker',
        version: '1.0',
        encrypted: true,
        data: 'encrypted-data'
      })], { type: 'application/json' });

      mockCryptoService.prototype.decrypt = jest.fn().mockRejectedValue(new Error('Wrong password'));

      const result = await ExportService.importFromBackup(backupBlob, 'wrong-password');

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Wrong password');
    });
  });
});

// Helper function tests
describe('ExportService Helper Functions', () => {
  it('should parse CSV rows with quoted fields correctly', async () => {
    const csvContent = `Date,Amount,Type,Description,Notes
2025-01-20,25.50,expense,"Coffee, ""premium""","Notes with ""quotes"""`;

    mockDatabaseService.prototype.getTransactions = jest.fn().mockResolvedValue([]);

    const result = await ExportService.importFromCSV(csvContent);

    // Should parse without errors
    expect(result.errors).toHaveLength(0);
    expect(mockDatabaseService.prototype.addTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Coffee, "premium"',
        notes: 'Notes with "quotes"'
      })
    );
  });

  it('should format dates consistently for export', async () => {
    const csvContent = await ExportService.exportToCSV({ format: 'csv' });

    // Dates should be in ISO format (YYYY-MM-DD)
    expect(csvContent).toContain('2025-01-15');
    expect(csvContent).toContain('2025-01-01');
  });
});
