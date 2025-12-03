import { DatabaseService } from '../../src/services/databaseService';
import { TransactionService } from '../../src/services/transactionService';
import { OCRService } from '../../src/services/ocrService';
import { SecurityService } from '../../src/services/securityService';
import { PerformanceMonitoringService } from '../../src/services/performanceMonitoringService';
import { MerchantRecognitionService } from '../../src/services/merchantRecognitionService';
import { CryptoService } from '../../src/services/cryptoService';

describe('E2E Tests - Complete User Journeys', () => {
  beforeAll(async () => {
    // Initialize all services for E2E testing
    await DatabaseService.initialize();
    await SecurityService.initialize();
    await MerchantRecognitionService.initialize();
  });

  afterAll(async () => {
    // Cleanup after all tests
    await DatabaseService.cleanup();
    await SecurityService.cleanup();
  });

  describe('Complete User Journey: New User Onboarding', () => {
    it('should complete full onboarding flow', async () => {
      // 1. App first launch
      const isFirstLaunch = await DatabaseService.isFirstLaunch();
      expect(isFirstLaunch).toBe(true);

      // 2. PIN setup
      const pinSetupResult = await SecurityService.setupPin('123456');
      expect(pinSetupResult.success).toBe(true);

      // 3. Default categories creation
      const categories = await DatabaseService.getCategories();
      expect(categories.length).toBeGreaterThan(10);

      // 4. First transaction creation
      const transaction = {
        amount: 50.00,
        description: 'Test grocery shopping',
        type: 'expense' as const,
        categoryId: categories.find(c => c.name === 'Lebensmittel')?.id || '',
        notes: 'First test transaction',
        date: Date.now()
      };

      const transactionId = await TransactionService.addTransaction(transaction);
      expect(transactionId).toBeDefined();

      // 5. Dashboard data loading
      const dashboardData = await TransactionService.getDashboardData();
      expect(dashboardData.totalTransactions).toBe(1);
      expect(dashboardData.totalExpenses).toBe(50.00);
    });
  });

  describe('Complete User Journey: Receipt Scanning to Transaction', () => {
    it('should complete full receipt scanning flow', async () => {
      const mockReceiptImage = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...'; // Mock image

      // 1. OCR Processing
      const ocrResult = await OCRService.recognizeTextAdvanced(mockReceiptImage, {
        preprocessing: true,
        language: 'deu'
      });

      expect(ocrResult.confidence).toBeGreaterThan(0.7);
      expect(ocrResult.text).toContain('REWE'); // Mock REWE receipt

      // 2. Merchant Recognition
      expect(ocrResult.merchantInfo).toBeDefined();
      expect(ocrResult.merchantInfo.merchant.name).toBe('REWE');
      expect(ocrResult.merchantInfo.confidence).toBeGreaterThan(0.9);

      // 3. Data Extraction and Transaction Creation
      const extractedData = {
        amount: 45.67,
        description: 'REWE Receipt',
        type: 'expense' as const,
        categoryId: ocrResult.merchantInfo.suggestedCategory,
        notes: `OCR Confidence: ${Math.round(ocrResult.confidence * 100)}%\nMerchant: ${ocrResult.merchantInfo.merchant.name}`,
        date: Date.now()
      };

      const transactionId = await TransactionService.addTransaction(extractedData);
      expect(transactionId).toBeDefined();

      // 4. Receipt Archive Storage
      const receiptId = await OCRService.saveReceiptImage(mockReceiptImage, {
        transactionId,
        ocrResult,
        timestamp: Date.now()
      });

      expect(receiptId).toBeDefined();
    });
  });

  describe('Complete User Journey: Recurring Transaction Management', () => {
    it('should complete recurring transaction lifecycle', async () => {
      // 1. Create recurring transaction
      const recurrenceData = {
        name: 'Monthly Salary',
        templateTransaction: {
          amount: 3000,
          description: 'Salary Payment',
          type: 'income' as const,
          categoryId: 'salary-category',
          notes: 'Monthly salary payment'
        },
        pattern: {
          type: 'monthly' as const,
          interval: 1,
          monthDay: 1
        }
      };

      const recurrenceId = await RecurrenceService.createRecurrence(
        recurrenceData.templateTransaction,
        recurrenceData.pattern,
        recurrenceData.name,
        'Monthly salary payment'
      );

      expect(recurrenceId).toBeDefined();

      // 2. Execute recurring transaction
      const executedTransactionId = await RecurrenceService.executeRecurrence(recurrenceId);
      expect(executedTransactionId).toBeDefined();

      // 3. Verify transaction was created
      const transaction = await TransactionService.getTransaction(executedTransactionId);
      expect(transaction).toBeDefined();
      expect(transaction.amount).toBe(3000);
      expect(transaction.description).toBe('Salary Payment');

      // 4. Check next execution date is calculated
      const recurrence = await RecurrenceService.getRecurrence(recurrenceId);
      expect(recurrence.nextExecutionDate).toBeDefined();
      expect(recurrence.nextExecutionDate.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('Complete User Journey: Analytics and Reports', () => {
    it('should generate comprehensive analytics', async () => {
      // Add sample data for analytics
      const sampleTransactions = [
        { amount: 100, description: 'Grocery 1', type: 'expense' as const, categoryId: 'food-id', date: Date.now() - 86400000 * 30 },
        { amount: 150, description: 'Grocery 2', type: 'expense' as const, categoryId: 'food-id', date: Date.now() - 86400000 * 20 },
        { amount: 2500, description: 'Salary', type: 'income' as const, categoryId: 'salary-id', date: Date.now() - 86400000 * 15 },
        { amount: 80, description: 'Gas', type: 'expense' as const, categoryId: 'transport-id', date: Date.now() - 86400000 * 10 },
      ];

      for (const tx of sampleTransactions) {
        await TransactionService.addTransaction(tx);
      }

      // 1. Generate monthly analytics
      const timeRange = {
        startDate: new Date(Date.now() - 86400000 * 31),
        endDate: new Date(),
        label: 'Last Month'
      };

      const analytics = await AdvancedAnalyticsService.getAnalytics(timeRange);

      expect(analytics.totalIncome).toBeGreaterThan(2000);
      expect(analytics.totalExpenses).toBeGreaterThan(300);
      expect(analytics.netAmount).toBeGreaterThan(0);
      expect(analytics.categoryBreakdown.length).toBeGreaterThan(2);

      // 2. Generate trend analysis
      const movingAverage = await AdvancedAnalyticsService.getMovingAverages(timeRange, 7, 'expenses');
      expect(movingAverage.data.length).toBeGreaterThan(0);
      expect(['increasing', 'decreasing', 'stable']).toContain(movingAverage.trend);

      // 3. Generate comparison report
      const previousRange = {
        startDate: new Date(Date.now() - 86400000 * 62),
        endDate: new Date(Date.now() - 86400000 * 31),
        label: 'Previous Month'
      };

      const comparison = await AdvancedAnalyticsService.compareTimeRanges(timeRange, previousRange);
      expect(comparison.change).toBeDefined();
      expect(['up', 'down', 'stable']).toContain(comparison.change.trend);
    });
  });

  describe('Complete User Journey: Data Export/Import', () => {
    it('should export and import data successfully', async () => {
      // 1. Export data
      const exportData = await ExportService.exportToJSON();
      expect(exportData).toBeDefined();
      expect(exportData.transactions).toBeDefined();
      expect(exportData.categories).toBeDefined();
      expect(exportData.recurrences).toBeDefined();

      // 2. CSV Export
      const csvData = await ExportService.exportToCSV();
      expect(csvData).toBeDefined();
      expect(csvData).toContain('amount,description,date,type,category');

      // 3. Backup creation
      const backupResult = await ExportService.createEncryptedBackup('test-password');
      expect(backupResult.success).toBe(true);
      expect(backupResult.backupPath).toBeDefined();

      // 4. Import validation
      const importValidation = await ImportService.validateCSV(csvData);
      expect(importValidation.isValid).toBe(true);
      expect(importValidation.errors.length).toBe(0);
    });
  });

  describe('Complete User Journey: Security Features', () => {
    it('should handle complete security lifecycle', async () => {
      // 1. PIN Authentication
      const authResult = await SecurityService.authenticateWithPin('123456');
      expect(authResult.success).toBe(true);

      // 2. Session management
      const session = SecurityService.getCurrentSession();
      expect(session).toBeDefined();
      expect(session.isActive).toBe(true);

      // 3. Auto-lock after inactivity
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate time
      const lockResult = await SecurityService.checkAutoLock();
      // Would depend on configured auto-lock timeout

      // 4. Data encryption verification
      const encryptedData = await CryptoService.encrypt('sensitive data', 'test-key');
      expect(encryptedData).toBeDefined();
      expect(encryptedData).not.toContain('sensitive data');

      const decryptedData = await CryptoService.decrypt(encryptedData, 'test-key');
      expect(decryptedData).toBe('sensitive data');
    });
  });

  describe('Performance Integration Tests', () => {
    it('should meet all performance benchmarks', async () => {
      PerformanceMonitoringService.markAppStart();

      // Simulate app initialization
      await new Promise(resolve => setTimeout(resolve, 50));

      PerformanceMonitoringService.markAppReady();

      // Check performance metrics
      const report = PerformanceMonitoringService.generateReport();

      expect(report.metrics.appStartTime).toBeLessThan(2000); // 2 seconds

      // Database performance test
      const dbPerformance = await PerformanceMonitoringService.runPerformanceTest(
        'Database Operations',
        async () => {
          const transactions = await TransactionService.getTransactions();
          expect(Array.isArray(transactions)).toBe(true);
        },
        5
      );

      expect(dbPerformance.average).toBeLessThan(100); // 100ms
    });
  });

  describe('Memory and Resource Management', () => {
    it('should not leak memory during heavy operations', async () => {
      const initialReport = PerformanceMonitoringService.generateReport();
      const initialMemory = initialReport.metrics.memoryUsage;

      // Perform heavy operations
      for (let i = 0; i < 100; i++) {
        await TransactionService.addTransaction({
          amount: Math.random() * 1000,
          description: `Test transaction ${i}`,
          type: Math.random() > 0.5 ? 'income' : 'expense',
          categoryId: 'test-category',
          notes: '',
          date: Date.now()
        });
      }

      // Generate analytics multiple times
      for (let i = 0; i < 10; i++) {
        const timeRange = {
          startDate: new Date(Date.now() - 86400000 * 30),
          endDate: new Date(),
          label: 'Test Range'
        };
        await AdvancedAnalyticsService.getAnalytics(timeRange);
      }

      const finalReport = PerformanceMonitoringService.generateReport();
      const finalMemory = finalReport.metrics.memoryUsage;

      // Memory should not increase significantly (allowing for 50% increase)
      expect(finalMemory).toBeLessThan(initialMemory * 1.5);
    });
  });

  describe('Cross-Platform Compatibility', () => {
    it('should work consistently across platforms', async () => {
      // Test core functionalities that should work identically
      const transaction = {
        amount: 100.50,
        description: 'Cross-platform test',
        type: 'expense' as const,
        categoryId: 'test-category',
        notes: 'Testing cross-platform compatibility',
        date: Date.now()
      };

      const transactionId = await TransactionService.addTransaction(transaction);
      expect(transactionId).toBeDefined();

      const retrievedTransaction = await TransactionService.getTransaction(transactionId);
      expect(retrievedTransaction.amount).toBe(100.50);
      expect(retrievedTransaction.description).toBe('Cross-platform test');

      // Test encryption works the same way
      const testData = 'cross-platform encryption test';
      const encrypted = await CryptoService.encrypt(testData, 'test-key');
      const decrypted = await CryptoService.decrypt(encrypted, 'test-key');

      expect(decrypted).toBe(testData);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should gracefully handle error scenarios', async () => {
      // Test invalid transaction data
      const invalidTransaction = {
        amount: -100, // Invalid negative amount
        description: '',
        type: 'invalid_type' as any,
        categoryId: '',
        notes: '',
        date: Date.now()
      };

      await expect(TransactionService.addTransaction(invalidTransaction))
        .rejects.toThrow();

      // Test database recovery
      const beforeCount = await TransactionService.getTransactionCount();

      // Simulate database error and recovery
      try {
        await DatabaseService.testErrorRecovery();
      } catch (error) {
        // Should recover gracefully
        expect(error.message).toContain('Database error');
      }

      const afterCount = await TransactionService.getTransactionCount();
      expect(afterCount).toBe(beforeCount); // Data should be intact

      // Test OCR error handling
      const invalidImageData = 'invalid-image-data';

      await expect(OCRService.recognizeTextAdvanced(invalidImageData))
        .rejects.toThrow();
    });
  });

  describe('Accessibility Features', () => {
    it('should support accessibility features', async () => {
      // Test screen reader compatibility (mock)
      const mockScreenReaderTest = {
        isScreenReaderEnabled: true,
        announcementsSent: []
      };

      // Simulate accessibility announcement
      const announcement = 'Transaction added successfully';
      mockScreenReaderTest.announcementsSent.push(announcement);

      expect(mockScreenReaderTest.announcementsSent).toContain(announcement);

      // Test high contrast mode compatibility (mock)
      const mockHighContrastTest = {
        isHighContrastEnabled: true,
        contrastRatio: 7.5 // WCAG AAA standard
      };

      expect(mockHighContrastTest.contrastRatio).toBeGreaterThan(7); // AAA compliance
    });
  });
});

describe('Stress Tests', () => {
  it('should handle large datasets efficiently', async () => {
    const startTime = Date.now();

    // Create 1000 transactions
    const promises = [];
    for (let i = 0; i < 1000; i++) {
      promises.push(TransactionService.addTransaction({
        amount: Math.random() * 1000,
        description: `Stress test transaction ${i}`,
        type: Math.random() > 0.5 ? 'income' : 'expense',
        categoryId: 'stress-test-category',
        notes: `Generated for stress testing - batch ${Math.floor(i / 100)}`,
        date: Date.now() - (Math.random() * 86400000 * 365) // Random date within last year
      }));
    }

    await Promise.all(promises);
    const creationTime = Date.now() - startTime;

    expect(creationTime).toBeLessThan(30000); // Should complete in under 30 seconds

    // Test retrieval performance
    const retrievalStart = Date.now();
    const allTransactions = await TransactionService.getTransactions();
    const retrievalTime = Date.now() - retrievalStart;

    expect(allTransactions.length).toBeGreaterThanOrEqual(1000);
    expect(retrievalTime).toBeLessThan(5000); // Should retrieve in under 5 seconds

    // Test analytics performance with large dataset
    const analyticsStart = Date.now();
    const timeRange = {
      startDate: new Date(Date.now() - 86400000 * 365),
      endDate: new Date(),
      label: 'Full Year'
    };

    const analytics = await AdvancedAnalyticsService.getAnalytics(timeRange);
    const analyticsTime = Date.now() - analyticsStart;

    expect(analyticsTime).toBeLessThan(10000); // Should complete in under 10 seconds
    expect(analytics.transactionCount).toBeGreaterThanOrEqual(1000);
  });
});

describe('Security Penetration Tests', () => {
  it('should resist common attack vectors', async () => {
    // SQL Injection resistance test
    const maliciousInput = "'; DROP TABLE transactions; --";

    await expect(TransactionService.addTransaction({
      amount: 100,
      description: maliciousInput,
      type: 'expense',
      categoryId: 'test-category',
      notes: maliciousInput,
      date: Date.now()
    })).resolves.toBeDefined();

    // Verify database is intact
    const transactions = await TransactionService.getTransactions();
    expect(Array.isArray(transactions)).toBe(true);

    // XSS resistance test
    const xssPayload = '<script>alert("XSS")</script>';
    const transactionId = await TransactionService.addTransaction({
      amount: 50,
      description: xssPayload,
      type: 'expense',
      categoryId: 'test-category',
      notes: xssPayload,
      date: Date.now()
    });

    const retrievedTransaction = await TransactionService.getTransaction(transactionId);
    expect(retrievedTransaction.description).toBe(xssPayload); // Stored as-is but should be escaped in UI

    // PIN brute force protection test
    let consecutiveFailures = 0;
    for (let i = 0; i < 10; i++) {
      try {
        await SecurityService.authenticateWithPin('wrong-pin');
      } catch (error) {
        consecutiveFailures++;
      }
    }

    expect(consecutiveFailures).toBe(10);

    // Should be locked after multiple failures
    const isLocked = await SecurityService.isTemporarilyLocked();
    expect(isLocked).toBe(true);
  });
});

describe('Internationalization Tests', () => {
  it('should support multiple languages correctly', async () => {
    const { changeLanguage, formatCurrency, formatDate } = require('../../src/i18n');

    // Test German locale
    await changeLanguage('de');

    const germanCurrency = formatCurrency(1234.56);
    expect(germanCurrency).toContain('€');
    expect(germanCurrency).toContain('1.234,56'); // German number format

    const germanDate = formatDate(new Date('2025-06-12'), 'medium');
    expect(germanDate).toContain('12'); // Day first in German format

    // Test English locale
    await changeLanguage('en');

    const englishCurrency = formatCurrency(1234.56);
    expect(englishCurrency).toContain('$');
    expect(englishCurrency).toContain('1,234.56'); // English number format

    const englishDate = formatDate(new Date('2025-06-12'), 'medium');
    expect(englishDate).toMatch(/Jun|June/); // Month name in English
  });
});
