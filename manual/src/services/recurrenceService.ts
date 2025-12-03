import { Transaction } from '../types';
import { DatabaseService } from './databaseService';

export interface RecurrencePattern {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // Every X days/weeks/months/years
  endDate?: Date;
  maxOccurrences?: number;
  weekdays?: number[]; // For weekly: 0=Sunday, 1=Monday, etc.
  monthDay?: number; // For monthly: day of month (1-31)
  monthEndRelative?: boolean; // For monthly: relative to month end
  yearlyMonth?: number; // For yearly: month (1-12)
  yearlyDay?: number; // For yearly: day of month
}

export interface RecurringTransaction {
  id: string;
  templateTransaction: Omit<Transaction, 'id' | 'date' | 'createdAt' | 'updatedAt'>;
  pattern: RecurrencePattern;
  isActive: boolean;
  nextExecutionDate: Date;
  lastExecutionDate?: Date;
  createdTransactionIds: string[];
  createdAt: Date;
  updatedAt: Date;
  description: string;
  name: string;
}

export interface UpcomingRecurrence {
  recurrence: RecurringTransaction;
  scheduledDate: Date;
  daysUntil: number;
  canExecuteNow: boolean;
}

class RecurrenceService {
  private databaseService: DatabaseService;
  private checkInterval: NodeJS.Timeout | null = null;
  private listeners: Array<(recurrences: UpcomingRecurrence[]) => void> = [];

  constructor() {
    this.databaseService = new DatabaseService();
  }

  /**
   * Create a new recurring transaction
   */
  async createRecurrence(
    templateTransaction: Omit<Transaction, 'id' | 'date' | 'createdAt' | 'updatedAt'>,
    pattern: RecurrencePattern,
    name: string,
    description?: string
  ): Promise<string> {
    try {
      const recurringTransaction: RecurringTransaction = {
        id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        templateTransaction,
        pattern,
        isActive: true,
        nextExecutionDate: this.calculateNextExecution(new Date(), pattern),
        createdTransactionIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        name,
        description: description || `Wiederkehrend: ${templateTransaction.description}`
      };

      await this.databaseService.addRecurringTransaction(recurringTransaction);

      // Start monitoring if this is the first recurrence
      await this.ensureMonitoring();

      return recurringTransaction.id;

    } catch (error) {
      console.error('Error creating recurring transaction:', error);
      throw new Error(`Failed to create recurring transaction: ${error.message}`);
    }
  }

  /**
   * Get all recurring transactions
   */
  async getRecurrences(): Promise<RecurringTransaction[]> {
    try {
      return await this.databaseService.getRecurringTransactions();
    } catch (error) {
      console.error('Error fetching recurring transactions:', error);
      return [];
    }
  }

  /**
   * Get upcoming recurrences (next 30 days)
   */
  async getUpcomingRecurrences(days: number = 30): Promise<UpcomingRecurrence[]> {
    try {
      const recurrences = await this.getRecurrences();
      const upcoming: UpcomingRecurrence[] = [];
      const today = new Date();
      const endDate = new Date(today.getTime() + (days * 24 * 60 * 60 * 1000));

      for (const recurrence of recurrences) {
        if (!recurrence.isActive) continue;

        let nextDate = recurrence.nextExecutionDate;

        while (nextDate <= endDate) {
          const daysUntil = Math.ceil((nextDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));

          upcoming.push({
            recurrence,
            scheduledDate: new Date(nextDate),
            daysUntil,
            canExecuteNow: daysUntil <= 0
          });

          // Calculate next occurrence
          nextDate = this.calculateNextExecution(nextDate, recurrence.pattern);

          // Prevent infinite loop
          if (upcoming.length > 100) break;
        }
      }

      return upcoming.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());

    } catch (error) {
      console.error('Error getting upcoming recurrences:', error);
      return [];
    }
  }

  /**
   * Execute a recurring transaction manually or automatically
   */
  async executeRecurrence(recurrenceId: string, executeDate?: Date): Promise<string> {
    try {
      const recurrence = await this.databaseService.getRecurringTransaction(recurrenceId);
      if (!recurrence || !recurrence.isActive) {
        throw new Error('Recurring transaction not found or inactive');
      }

      const executionDate = executeDate || new Date();

      // Create the actual transaction
      const transaction: Transaction = {
        id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...recurrence.templateTransaction,
        date: executionDate.getTime(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        notes: `${recurrence.templateTransaction.notes || ''}\nAutomatisch erstellt durch Wiederholung: ${recurrence.name}`.trim()
      };

      const transactionId = await this.databaseService.addTransaction(transaction);

      // Update recurrence
      const updatedRecurrence: RecurringTransaction = {
        ...recurrence,
        lastExecutionDate: executionDate,
        nextExecutionDate: this.calculateNextExecution(executionDate, recurrence.pattern),
        createdTransactionIds: [...recurrence.createdTransactionIds, transactionId],
        updatedAt: new Date()
      };

      // Check if recurrence should be deactivated
      if (this.shouldDeactivateRecurrence(updatedRecurrence)) {
        updatedRecurrence.isActive = false;
      }

      await this.databaseService.updateRecurringTransaction(updatedRecurrence);

      // Notify listeners
      this.notifyListeners();

      return transactionId;

    } catch (error) {
      console.error('Error executing recurring transaction:', error);
      throw new Error(`Failed to execute recurring transaction: ${error.message}`);
    }
  }

  /**
   * Update a recurring transaction
   */
  async updateRecurrence(
    recurrenceId: string,
    updates: Partial<Pick<RecurringTransaction, 'templateTransaction' | 'pattern' | 'name' | 'description' | 'isActive'>>
  ): Promise<void> {
    try {
      const existing = await this.databaseService.getRecurringTransaction(recurrenceId);
      if (!existing) {
        throw new Error('Recurring transaction not found');
      }

      const updated: RecurringTransaction = {
        ...existing,
        ...updates,
        updatedAt: new Date()
      };

      // Recalculate next execution if pattern changed
      if (updates.pattern) {
        updated.nextExecutionDate = this.calculateNextExecution(
          existing.lastExecutionDate || new Date(),
          updates.pattern
        );
      }

      await this.databaseService.updateRecurringTransaction(updated);
      this.notifyListeners();

    } catch (error) {
      console.error('Error updating recurring transaction:', error);
      throw new Error(`Failed to update recurring transaction: ${error.message}`);
    }
  }

  /**
   * Delete a recurring transaction
   */
  async deleteRecurrence(recurrenceId: string, deleteCreatedTransactions: boolean = false): Promise<void> {
    try {
      const recurrence = await this.databaseService.getRecurringTransaction(recurrenceId);
      if (!recurrence) return;

      // Optionally delete all created transactions
      if (deleteCreatedTransactions) {
        for (const transactionId of recurrence.createdTransactionIds) {
          try {
            await this.databaseService.deleteTransaction(transactionId);
          } catch (error) {
            console.warn(`Failed to delete transaction ${transactionId}:`, error);
          }
        }
      }

      await this.databaseService.deleteRecurringTransaction(recurrenceId);
      this.notifyListeners();

    } catch (error) {
      console.error('Error deleting recurring transaction:', error);
      throw new Error(`Failed to delete recurring transaction: ${error.message}`);
    }
  }

  /**
   * Calculate next execution date based on pattern
   */
  calculateNextExecution(fromDate: Date, pattern: RecurrencePattern): Date {
    const next = new Date(fromDate);

    switch (pattern.type) {
      case 'daily':
        next.setDate(next.getDate() + pattern.interval);
        break;

      case 'weekly':
        if (pattern.weekdays && pattern.weekdays.length > 0) {
          // Find next matching weekday
          const currentWeekday = next.getDay();
          let daysToAdd = pattern.interval * 7;

          // Find next occurrence of any specified weekday
          for (let i = 1; i <= 7; i++) {
            const targetWeekday = (currentWeekday + i) % 7;
            if (pattern.weekdays.includes(targetWeekday)) {
              daysToAdd = i;
              break;
            }
          }

          next.setDate(next.getDate() + daysToAdd);
        } else {
          next.setDate(next.getDate() + (pattern.interval * 7));
        }
        break;

      case 'monthly':
        if (pattern.monthEndRelative) {
          // Last day of month logic
          next.setMonth(next.getMonth() + pattern.interval + 1, 0);
        } else {
          const targetDay = pattern.monthDay || next.getDate();
          next.setMonth(next.getMonth() + pattern.interval, targetDay);

          // Handle month overflow (e.g., Jan 31 -> Feb 28/29)
          if (next.getDate() !== targetDay) {
            next.setDate(0); // Go to last day of previous month
          }
        }
        break;

      case 'yearly':
        const targetMonth = pattern.yearlyMonth || (next.getMonth() + 1);
        const targetDay = pattern.yearlyDay || next.getDate();

        next.setFullYear(next.getFullYear() + pattern.interval, targetMonth - 1, targetDay);

        // Handle leap year issues (e.g., Feb 29)
        if (next.getMonth() !== (targetMonth - 1)) {
          next.setDate(0); // Go to last day of previous month
        }
        break;

      default:
        throw new Error(`Unknown recurrence pattern type: ${pattern.type}`);
    }

    return next;
  }

  /**
   * Check if a recurrence should be deactivated
   */
  private shouldDeactivateRecurrence(recurrence: RecurringTransaction): boolean {
    // Check end date
    if (recurrence.pattern.endDate && recurrence.nextExecutionDate > recurrence.pattern.endDate) {
      return true;
    }

    // Check max occurrences
    if (recurrence.pattern.maxOccurrences &&
        recurrence.createdTransactionIds.length >= recurrence.pattern.maxOccurrences) {
      return true;
    }

    return false;
  }

  /**
   * Start automatic monitoring for due recurrences
   */
  async startMonitoring(): Promise<void> {
    if (this.checkInterval) return; // Already monitoring

    // Check every hour
    this.checkInterval = setInterval(async () => {
      await this.processDueRecurrences();
    }, 60 * 60 * 1000);

    // Initial check
    await this.processDueRecurrences();
    console.log('Recurrence monitoring started');
  }

  /**
   * Stop automatic monitoring
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('Recurrence monitoring stopped');
    }
  }

  /**
   * Process all due recurrences
   */
  async processDueRecurrences(): Promise<void> {
    try {
      const upcoming = await this.getUpcomingRecurrences(1); // Today only
      const due = upcoming.filter(u => u.canExecuteNow);

      for (const dueRecurrence of due) {
        try {
          await this.executeRecurrence(dueRecurrence.recurrence.id, dueRecurrence.scheduledDate);
          console.log(`Executed recurring transaction: ${dueRecurrence.recurrence.name}`);
        } catch (error) {
          console.error(`Failed to execute recurring transaction ${dueRecurrence.recurrence.id}:`, error);
        }
      }

      if (due.length > 0) {
        this.notifyListeners();
      }

    } catch (error) {
      console.error('Error processing due recurrences:', error);
    }
  }

  /**
   * Ensure monitoring is active if there are active recurrences
   */
  private async ensureMonitoring(): Promise<void> {
    const recurrences = await this.getRecurrences();
    const hasActiveRecurrences = recurrences.some(r => r.isActive);

    if (hasActiveRecurrences && !this.checkInterval) {
      await this.startMonitoring();
    } else if (!hasActiveRecurrences && this.checkInterval) {
      this.stopMonitoring();
    }
  }

  /**
   * Add listener for recurrence updates
   */
  addListener(callback: (recurrences: UpcomingRecurrence[]) => void): () => void {
    this.listeners.push(callback);

    // Initial notification
    this.getUpcomingRecurrences().then(callback);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners
   */
  private async notifyListeners(): Promise<void> {
    try {
      const upcoming = await this.getUpcomingRecurrences();
      this.listeners.forEach(listener => {
        try {
          listener(upcoming);
        } catch (error) {
          console.error('Error in recurrence listener:', error);
        }
      });
    } catch (error) {
      console.error('Error notifying listeners:', error);
    }
  }

  /**
   * Parse human-readable recurrence descriptions
   */
  parseRecurrenceDescription(description: string): RecurrencePattern | null {
    const desc = description.toLowerCase().trim();

    // Daily patterns
    if (desc.includes('täglich') || desc.includes('daily')) {
      return { type: 'daily', interval: 1 };
    }
    if (desc.match(/jeden? (\d+)\.? tag/)) {
      const match = desc.match(/jeden? (\d+)\.? tag/);
      return { type: 'daily', interval: parseInt(match![1]) };
    }

    // Weekly patterns
    if (desc.includes('wöchentlich') || desc.includes('weekly')) {
      return { type: 'weekly', interval: 1 };
    }
    if (desc.includes('werktags') || desc.includes('weekdays')) {
      return { type: 'weekly', interval: 1, weekdays: [1, 2, 3, 4, 5] };
    }

    // Monthly patterns
    if (desc.includes('monatlich') || desc.includes('monthly')) {
      if (desc.includes('monatsende') || desc.includes('month end')) {
        return { type: 'monthly', interval: 1, monthEndRelative: true };
      }
      return { type: 'monthly', interval: 1 };
    }

    // Yearly patterns
    if (desc.includes('jährlich') || desc.includes('yearly') || desc.includes('annual')) {
      return { type: 'yearly', interval: 1 };
    }

    return null;
  }

  /**
   * Get recurrence pattern description in human-readable format
   */
  getPatternDescription(pattern: RecurrencePattern, locale: string = 'de'): string {
    const isGerman = locale === 'de';

    switch (pattern.type) {
      case 'daily':
        if (pattern.interval === 1) {
          return isGerman ? 'Täglich' : 'Daily';
        }
        return isGerman ? `Alle ${pattern.interval} Tage` : `Every ${pattern.interval} days`;

      case 'weekly':
        if (pattern.weekdays && pattern.weekdays.length > 0) {
          const weekdayNames = isGerman
            ? ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
            : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

          const selectedDays = pattern.weekdays.map(d => weekdayNames[d]).join(', ');
          return isGerman ? `Wöchentlich: ${selectedDays}` : `Weekly: ${selectedDays}`;
        }

        if (pattern.interval === 1) {
          return isGerman ? 'Wöchentlich' : 'Weekly';
        }
        return isGerman ? `Alle ${pattern.interval} Wochen` : `Every ${pattern.interval} weeks`;

      case 'monthly':
        if (pattern.monthEndRelative) {
          return isGerman ? 'Monatlich (Monatsende)' : 'Monthly (end of month)';
        }

        if (pattern.interval === 1) {
          if (pattern.monthDay) {
            return isGerman ? `Monatlich am ${pattern.monthDay}.` : `Monthly on the ${pattern.monthDay}th`;
          }
          return isGerman ? 'Monatlich' : 'Monthly';
        }
        return isGerman ? `Alle ${pattern.interval} Monate` : `Every ${pattern.interval} months`;

      case 'yearly':
        if (pattern.interval === 1) {
          return isGerman ? 'Jährlich' : 'Yearly';
        }
        return isGerman ? `Alle ${pattern.interval} Jahre` : `Every ${pattern.interval} years`;

      default:
        return isGerman ? 'Unbekannt' : 'Unknown';
    }
  }

  /**
   * Clean up expired recurrences
   */
  async cleanupExpiredRecurrences(): Promise<number> {
    try {
      const recurrences = await this.getRecurrences();
      let cleanedCount = 0;

      for (const recurrence of recurrences) {
        if (!recurrence.isActive && this.isExpired(recurrence)) {
          await this.deleteRecurrence(recurrence.id, false); // Keep created transactions
          cleanedCount++;
        }
      }

      return cleanedCount;
    } catch (error) {
      console.error('Error cleaning up expired recurrences:', error);
      return 0;
    }
  }

  /**
   * Check if a recurrence is expired and can be cleaned up
   */
  private isExpired(recurrence: RecurringTransaction): boolean {
    const sixMonthsAgo = new Date(Date.now() - (180 * 24 * 60 * 60 * 1000));
    return !recurrence.isActive &&
           (recurrence.lastExecutionDate || recurrence.createdAt) < sixMonthsAgo;
  }
}

export default new RecurrenceService();
