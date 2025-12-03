import RecurrenceService from '../../services/recurrenceService';
import { DatabaseService } from '../../services/databaseService';
import { RecurrencePattern, RecurringTransaction } from '../../services/recurrenceService';
import { Transaction } from '../../types';

// Mock DatabaseService
jest.mock('../../services/databaseService');
const mockDatabaseService = DatabaseService as jest.Mocked<typeof DatabaseService>;

describe('RecurrenceService', () => {
  const mockTemplateTransaction: Omit<Transaction, 'id' | 'date' | 'createdAt' | 'updatedAt'> = {
    amount: 2500,
    description: 'Monthly Salary',
    type: 'income',
    categoryId: 'salary-category',
    notes: 'Regular salary payment',
    deletedAt: null
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    mockDatabaseService.prototype.addRecurringTransaction = jest.fn().mockResolvedValue('rec-id');
    mockDatabaseService.prototype.getRecurringTransactions = jest.fn().mockResolvedValue([]);
    mockDatabaseService.prototype.getRecurringTransaction = jest.fn().mockResolvedValue(null);
    mockDatabaseService.prototype.updateRecurringTransaction = jest.fn().mockResolvedValue(undefined);
    mockDatabaseService.prototype.deleteRecurringTransaction = jest.fn().mockResolvedValue(undefined);
    mockDatabaseService.prototype.addTransaction = jest.fn().mockResolvedValue('txn-id');
    mockDatabaseService.prototype.deleteTransaction = jest.fn().mockResolvedValue(undefined);

    // Reset monitoring
    RecurrenceService.stopMonitoring();
  });

  afterEach(() => {
    RecurrenceService.stopMonitoring();
  });

  describe('Pattern Calculation', () => {
    it('should calculate daily recurrence correctly', () => {
      const pattern: RecurrencePattern = { type: 'daily', interval: 1 };
      const startDate = new Date('2025-01-01');

      const nextDate = RecurrenceService.calculateNextExecution(startDate, pattern);

      expect(nextDate.toISOString().split('T')[0]).toBe('2025-01-02');
    });

    it('should calculate weekly recurrence correctly', () => {
      const pattern: RecurrencePattern = { type: 'weekly', interval: 1 };
      const startDate = new Date('2025-01-01'); // Wednesday

      const nextDate = RecurrenceService.calculateNextExecution(startDate, pattern);

      expect(nextDate.toISOString().split('T')[0]).toBe('2025-01-08');
    });

    it('should calculate weekly recurrence with specific weekdays', () => {
      const pattern: RecurrencePattern = {
        type: 'weekly',
        interval: 1,
        weekdays: [1, 3, 5] // Monday, Wednesday, Friday
      };
      const startDate = new Date('2025-01-01'); // Wednesday

      const nextDate = RecurrenceService.calculateNextExecution(startDate, pattern);

      // Next Friday (Jan 3)
      expect(nextDate.toISOString().split('T')[0]).toBe('2025-01-03');
    });

    it('should calculate monthly recurrence correctly', () => {
      const pattern: RecurrencePattern = {
        type: 'monthly',
        interval: 1,
        monthDay: 15
      };
      const startDate = new Date('2025-01-01');

      const nextDate = RecurrenceService.calculateNextExecution(startDate, pattern);

      expect(nextDate.toISOString().split('T')[0]).toBe('2025-02-15');
    });

    it('should calculate month-end recurrence correctly', () => {
      const pattern: RecurrencePattern = {
        type: 'monthly',
        interval: 1,
        monthEndRelative: true
      };
      const startDate = new Date('2025-01-31');

      const nextDate = RecurrenceService.calculateNextExecution(startDate, pattern);

      // Last day of February 2025 (not a leap year)
      expect(nextDate.toISOString().split('T')[0]).toBe('2025-02-28');
    });

    it('should handle month overflow correctly', () => {
      const pattern: RecurrencePattern = {
        type: 'monthly',
        interval: 1,
        monthDay: 31
      };
      const startDate = new Date('2025-01-31');

      const nextDate = RecurrenceService.calculateNextExecution(startDate, pattern);

      // February 31 doesn't exist, should go to February 28
      expect(nextDate.toISOString().split('T')[0]).toBe('2025-02-28');
    });

    it('should calculate yearly recurrence correctly', () => {
      const pattern: RecurrencePattern = {
        type: 'yearly',
        interval: 1,
        yearlyMonth: 12,
        yearlyDay: 25
      };
      const startDate = new Date('2025-01-01');

      const nextDate = RecurrenceService.calculateNextExecution(startDate, pattern);

      expect(nextDate.toISOString().split('T')[0]).toBe('2025-12-25');
    });

    it('should handle leap year correctly in yearly recurrence', () => {
      const pattern: RecurrencePattern = {
        type: 'yearly',
        interval: 1,
        yearlyMonth: 2,
        yearlyDay: 29
      };
      const startDate = new Date('2024-02-29'); // 2024 is a leap year

      const nextDate = RecurrenceService.calculateNextExecution(startDate, pattern);

      // 2025 is not a leap year, should go to Feb 28
      expect(nextDate.toISOString().split('T')[0]).toBe('2025-02-28');
    });
  });

  describe('Recurrence Creation', () => {
    it('should create a new recurring transaction', async () => {
      const pattern: RecurrencePattern = { type: 'monthly', interval: 1 };

      const recurrenceId = await RecurrenceService.createRecurrence(
        mockTemplateTransaction,
        pattern,
        'Monthly Salary',
        'Regular salary payment'
      );

      expect(recurrenceId).toBeTruthy();
      expect(mockDatabaseService.prototype.addRecurringTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          templateTransaction: mockTemplateTransaction,
          pattern,
          name: 'Monthly Salary',
          description: 'Regular salary payment',
          isActive: true
        })
      );
    });

    it('should calculate next execution date on creation', async () => {
      const pattern: RecurrencePattern = { type: 'daily', interval: 1 };

      await RecurrenceService.createRecurrence(
        mockTemplateTransaction,
        pattern,
        'Daily Test'
      );

      const calledWith = (mockDatabaseService.prototype.addRecurringTransaction as jest.Mock).mock.calls[0][0];
      expect(calledWith.nextExecutionDate).toBeInstanceOf(Date);
      expect(calledWith.nextExecutionDate.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('Recurrence Execution', () => {
    const mockRecurrence: RecurringTransaction = {
      id: 'rec-1',
      templateTransaction: mockTemplateTransaction,
      pattern: { type: 'monthly', interval: 1 },
      isActive: true,
      nextExecutionDate: new Date('2025-01-01'),
      lastExecutionDate: undefined,
      createdTransactionIds: [],
      createdAt: new Date('2024-12-01'),
      updatedAt: new Date('2024-12-01'),
      name: 'Test Recurrence',
      description: 'Test description'
    };

    it('should execute a recurring transaction', async () => {
      mockDatabaseService.prototype.getRecurringTransaction = jest.fn().mockResolvedValue(mockRecurrence);

      const transactionId = await RecurrenceService.executeRecurrence('rec-1');

      expect(transactionId).toBe('txn-id');
      expect(mockDatabaseService.prototype.addTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 2500,
          description: 'Monthly Salary',
          type: 'income',
          notes: expect.stringContaining('Automatisch erstellt durch Wiederholung')
        })
      );
    });

    it('should update recurrence after execution', async () => {
      mockDatabaseService.prototype.getRecurringTransaction = jest.fn().mockResolvedValue(mockRecurrence);

      await RecurrenceService.executeRecurrence('rec-1');

      expect(mockDatabaseService.prototype.updateRecurringTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          lastExecutionDate: expect.any(Date),
          nextExecutionDate: expect.any(Date),
          createdTransactionIds: ['txn-id']
        })
      );
    });

    it('should throw error for inactive recurrence', async () => {
      const inactiveRecurrence = { ...mockRecurrence, isActive: false };
      mockDatabaseService.prototype.getRecurringTransaction = jest.fn().mockResolvedValue(inactiveRecurrence);

      await expect(RecurrenceService.executeRecurrence('rec-1'))
        .rejects.toThrow('Recurring transaction not found or inactive');
    });

    it('should throw error for non-existent recurrence', async () => {
      mockDatabaseService.prototype.getRecurringTransaction = jest.fn().mockResolvedValue(null);

      await expect(RecurrenceService.executeRecurrence('rec-1'))
        .rejects.toThrow('Recurring transaction not found or inactive');
    });
  });

  describe('Upcoming Recurrences', () => {
    const mockActiveRecurrence: RecurringTransaction = {
      id: 'rec-1',
      templateTransaction: mockTemplateTransaction,
      pattern: { type: 'daily', interval: 1 },
      isActive: true,
      nextExecutionDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      lastExecutionDate: undefined,
      createdTransactionIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      name: 'Daily Test',
      description: 'Test description'
    };

    it('should get upcoming recurrences', async () => {
      mockDatabaseService.prototype.getRecurringTransactions = jest.fn().mockResolvedValue([mockActiveRecurrence]);

      const upcoming = await RecurrenceService.getUpcomingRecurrences(7);

      expect(upcoming).toHaveLength(7);
      expect(upcoming[0].recurrence.id).toBe('rec-1');
      expect(upcoming[0].daysUntil).toBeCloseTo(1, 0);
    });

    it('should skip inactive recurrences', async () => {
      const inactiveRecurrence = { ...mockActiveRecurrence, isActive: false };
      mockDatabaseService.prototype.getRecurringTransactions = jest.fn().mockResolvedValue([inactiveRecurrence]);

      const upcoming = await RecurrenceService.getUpcomingRecurrences(7);

      expect(upcoming).toHaveLength(0);
    });

    it('should mark overdue recurrences as executable', async () => {
      const overdueRecurrence = {
        ...mockActiveRecurrence,
        nextExecutionDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
      };
      mockDatabaseService.prototype.getRecurringTransactions = jest.fn().mockResolvedValue([overdueRecurrence]);

      const upcoming = await RecurrenceService.getUpcomingRecurrences(7);

      expect(upcoming[0].canExecuteNow).toBe(true);
      expect(upcoming[0].daysUntil).toBeLessThan(0);
    });
  });

  describe('Pattern Description', () => {
    it('should generate correct German descriptions', () => {
      expect(RecurrenceService.getPatternDescription({ type: 'daily', interval: 1 }, 'de')).toBe('Täglich');
      expect(RecurrenceService.getPatternDescription({ type: 'daily', interval: 3 }, 'de')).toBe('Alle 3 Tage');
      expect(RecurrenceService.getPatternDescription({ type: 'weekly', interval: 1 }, 'de')).toBe('Wöchentlich');
      expect(RecurrenceService.getPatternDescription({ type: 'monthly', interval: 1 }, 'de')).toBe('Monatlich');
      expect(RecurrenceService.getPatternDescription({ type: 'yearly', interval: 1 }, 'de')).toBe('Jährlich');
    });

    it('should generate correct English descriptions', () => {
      expect(RecurrenceService.getPatternDescription({ type: 'daily', interval: 1 }, 'en')).toBe('Daily');
      expect(RecurrenceService.getPatternDescription({ type: 'daily', interval: 3 }, 'en')).toBe('Every 3 days');
      expect(RecurrenceService.getPatternDescription({ type: 'weekly', interval: 1 }, 'en')).toBe('Weekly');
      expect(RecurrenceService.getPatternDescription({ type: 'monthly', interval: 1 }, 'en')).toBe('Monthly');
      expect(RecurrenceService.getPatternDescription({ type: 'yearly', interval: 1 }, 'en')).toBe('Yearly');
    });

    it('should handle weekday patterns', () => {
      const pattern: RecurrencePattern = {
        type: 'weekly',
        interval: 1,
        weekdays: [1, 3, 5] // Monday, Wednesday, Friday
      };

      const description = RecurrenceService.getPatternDescription(pattern, 'de');
      expect(description).toBe('Wöchentlich: Mo, Mi, Fr');
    });
  });

  describe('End Conditions', () => {
    it('should deactivate recurrence when end date is reached', async () => {
      const recurrence: RecurringTransaction = {
        id: 'rec-1',
        templateTransaction: mockTemplateTransaction,
        pattern: {
          type: 'daily',
          interval: 1,
          endDate: new Date('2025-01-01') // End date in past
        },
        isActive: true,
        nextExecutionDate: new Date('2025-01-02'), // After end date
        lastExecutionDate: undefined,
        createdTransactionIds: [],
        createdAt: new Date('2024-12-01'),
        updatedAt: new Date('2024-12-01'),
        name: 'Test Recurrence',
        description: 'Test'
      };

      mockDatabaseService.prototype.getRecurringTransaction = jest.fn().mockResolvedValue(recurrence);

      await RecurrenceService.executeRecurrence('rec-1');

      expect(mockDatabaseService.prototype.updateRecurringTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: false
        })
      );
    });

    it('should deactivate recurrence when max occurrences is reached', async () => {
      const recurrence: RecurringTransaction = {
        id: 'rec-1',
        templateTransaction: mockTemplateTransaction,
        pattern: {
          type: 'daily',
          interval: 1,
          maxOccurrences: 2
        },
        isActive: true,
        nextExecutionDate: new Date(),
        lastExecutionDate: undefined,
        createdTransactionIds: ['txn-1'], // 1 already executed
        createdAt: new Date(),
        updatedAt: new Date(),
        name: 'Test Recurrence',
        description: 'Test'
      };

      mockDatabaseService.prototype.getRecurringTransaction = jest.fn().mockResolvedValue(recurrence);

      await RecurrenceService.executeRecurrence('rec-1');

      // After this execution, we'll have 2 transactions (max reached)
      expect(mockDatabaseService.prototype.updateRecurringTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: false,
          createdTransactionIds: ['txn-1', 'txn-id']
        })
      );
    });
  });

  describe('Pattern Parsing', () => {
    it('should parse common German recurrence descriptions', () => {
      expect(RecurrenceService.parseRecurrenceDescription('täglich')?.type).toBe('daily');
      expect(RecurrenceService.parseRecurrenceDescription('wöchentlich')?.type).toBe('weekly');
      expect(RecurrenceService.parseRecurrenceDescription('monatlich')?.type).toBe('monthly');
      expect(RecurrenceService.parseRecurrenceDescription('jährlich')?.type).toBe('yearly');

      expect(RecurrenceService.parseRecurrenceDescription('werktags')).toEqual({
        type: 'weekly',
        interval: 1,
        weekdays: [1, 2, 3, 4, 5]
      });

      expect(RecurrenceService.parseRecurrenceDescription('monatsende')).toEqual({
        type: 'monthly',
        interval: 1,
        monthEndRelative: true
      });
    });

    it('should parse English recurrence descriptions', () => {
      expect(RecurrenceService.parseRecurrenceDescription('daily')?.type).toBe('daily');
      expect(RecurrenceService.parseRecurrenceDescription('weekly')?.type).toBe('weekly');
      expect(RecurrenceService.parseRecurrenceDescription('monthly')?.type).toBe('monthly');
      expect(RecurrenceService.parseRecurrenceDescription('yearly')?.type).toBe('yearly');

      expect(RecurrenceService.parseRecurrenceDescription('weekdays')).toEqual({
        type: 'weekly',
        interval: 1,
        weekdays: [1, 2, 3, 4, 5]
      });
    });

    it('should return null for unrecognized descriptions', () => {
      expect(RecurrenceService.parseRecurrenceDescription('random text')).toBeNull();
      expect(RecurrenceService.parseRecurrenceDescription('')).toBeNull();
    });
  });

  describe('Cleanup', () => {
    it('should clean up expired recurrences', async () => {
      const expiredRecurrence: RecurringTransaction = {
        id: 'rec-1',
        templateTransaction: mockTemplateTransaction,
        pattern: { type: 'daily', interval: 1 },
        isActive: false, // Inactive
        nextExecutionDate: new Date(),
        lastExecutionDate: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000), // 200 days ago
        createdTransactionIds: [],
        createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        name: 'Expired Recurrence',
        description: 'Test'
      };

      mockDatabaseService.prototype.getRecurringTransactions = jest.fn().mockResolvedValue([expiredRecurrence]);

      const cleanedCount = await RecurrenceService.cleanupExpiredRecurrences();

      expect(cleanedCount).toBe(1);
      expect(mockDatabaseService.prototype.deleteRecurringTransaction).toHaveBeenCalledWith('rec-1');
    });
  });
});
