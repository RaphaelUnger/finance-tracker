// ============================================================================
// Type Definitions
// ============================================================================

/** Supported recurrence frequencies */
export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

/** Recurrence configuration for recurring transactions */
export interface Recurrence {
    /** How often the transaction recurs */
    frequency: Frequency;
    /** Interval multiplier (e.g., 2 = every 2 weeks) */
    interval?: number;
    /** Next scheduled occurrence (ISO date string) */
    nextRun?: string;
    /** End date for recurrence (ISO date string, null = no end) */
    endDate?: string | null;
}

/** Transaction record */
export interface Transaction {
    /** Unique identifier */
    id: string;
    /** Display title/description */
    title: string;
    /** Amount in cents (integer) */
    amount: number;
    /** Transaction date (YYYY-MM-DD) */
    date: string;
    /** Category name */
    category?: string;
    /** Merchant/vendor name */
    merchant?: string;
    /** Additional notes */
    notes?: string;
    /** Recurrence configuration (null = one-time) */
    recurrence?: Recurrence | null;
    /** ID of the recurring rule that generated this transaction */
    generatedFrom?: string | null;
    /** Timestamp when this was auto-generated */
    generatedAt?: string | null;
    /** Creation timestamp (ISO string) */
    createdAt?: string;
}

/** Input type for creating a new transaction (id is auto-generated) */
export type TransactionInput = Omit<Transaction, 'id'>;

// ============================================================================
// Storage Keys (centralized to avoid magic strings)
// ============================================================================

export const STORAGE_KEYS = {
    TRANSACTIONS: 'ft_transactions_v1',
    BACKUP: 'ft_backup_v1',
    ANALYTICS: 'ft_analytics_v1',
    LOCK_PIN: 'ft_lock_pin_v1',
    BIOMETRIC_ENABLED: 'ft_biometric_enabled_v1',
} as const;

// ============================================================================
// Constants
// ============================================================================

/** Default PBKDF2 iterations for password hashing */
export const DEFAULT_PBKDF2_ITERATIONS = 10000;

/** Predefined expense categories */
export const CATEGORIES = [
    'Food',
    'Transport',
    'Utilities',
    'Entertainment',
    'Shopping',
    'Healthcare',
    'Other',
] as const;

export type Category = typeof CATEGORIES[number];
