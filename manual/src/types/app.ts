// Security and Authentication types

export interface AuthState {
  isAuthenticated: boolean;
  isLocked: boolean;
  hasPin: boolean;
  hasBiometric: boolean;
  lastActiveTime: number;
  failedAttempts: number;
  isLockedOut: boolean;
  lockoutUntil?: number;
}

export interface SecuritySettings {
  pinEnabled: boolean;
  biometricEnabled: boolean;
  autoLockTimeout: number; // in minutes
  maxFailedAttempts: number;
  lockoutDuration: number; // in minutes
}

export interface BiometricInfo {
  available: boolean;
  biometryType: 'TouchID' | 'FaceID' | 'Fingerprint' | 'None';
  error?: string;
}

export interface EncryptionKey {
  salt: string;
  iterations: number;
  keyDerivation: 'PBKDF2';
}

export interface SecureStorageItem {
  key: string;
  value: string;
  encrypted: boolean;
}

// Database types

export interface DatabaseConfig {
  name: string;
  version: number;
  encrypted: boolean;
  location: string;
}

export interface DatabaseMigration {
  version: number;
  sql: string[];
}

export interface QueryResult<T = any> {
  success: boolean;
  rows: T[];
  rowsAffected: number;
  insertId?: number;
  error?: string;
}

// OCR types

export interface OCRResult {
  text: string;
  confidence: number;
  boundingBox?: BoundingBox;
  words: OCRWord[];
}

export interface OCRWord {
  text: string;
  confidence: number;
  boundingBox: BoundingBox;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OCRProcessingOptions {
  language: 'deu' | 'eng' | 'deu+eng';
  enhance: boolean;
  preprocessor?: 'auto' | 'receipt' | 'document';
}

// Storage and File types

export interface FileInfo {
  path: string;
  name: string;
  size: number;
  mimeType: string;
  createdAt: Date;
  modifiedAt: Date;
}

export interface BackupMetadata {
  version: string;
  createdAt: Date;
  transactionCount: number;
  categoryCount: number;
  recurrenceCount: number;
  receiptCount: number;
  encrypted: boolean;
  checksum: string;
}

export interface BackupOptions {
  includeReceipts: boolean;
  includeSettings: boolean;
  encrypted: boolean;
  password?: string;
  compression: boolean;
}

// Redux Store types

export interface RootState {
  auth: AuthState;
  transactions: TransactionState;
  categories: CategoryState;
  recurrences: RecurrenceState;
  receipts: ReceiptState;
  reports: ReportState;
  settings: SettingsState;
  ui: UIState;
}

export interface TransactionState {
  items: Transaction[];
  loading: boolean;
  error?: string;
  filters: TransactionFilters;
  pagination: PaginationState;
}

export interface CategoryState {
  items: Category[];
  loading: boolean;
  error?: string;
}

export interface RecurrenceState {
  items: Recurrence[];
  loading: boolean;
  error?: string;
}

export interface ReceiptState {
  items: Receipt[];
  loading: boolean;
  error?: string;
  processing: boolean;
}

export interface ReportState {
  monthlyReports: Record<string, MonthlyReport>;
  trends: Record<string, TrendData[]>;
  loading: boolean;
  error?: string;
}

export interface SettingsState {
  theme: 'light' | 'dark' | 'auto';
  language: 'en' | 'de';
  currency: string;
  dateFormat: string;
  security: SecuritySettings;
  notifications: NotificationSettings;
}

export interface UIState {
  activeScreen: string;
  loading: Record<string, boolean>;
  errors: Record<string, string>;
  modals: Record<string, boolean>;
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  recurrenceReminders: boolean;
  budgetAlerts: boolean;
  weeklyReports: boolean;
}

// Validation types

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Theme types

export interface Theme {
  colors: ThemeColors;
  spacing: ThemeSpacing;
  typography: ThemeTypography;
  borderRadius: ThemeBorderRadius;
  shadows: ThemeShadows;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  error: string;
  warning: string;
  info: string;
  success: string;
  text: string;
  textSecondary: string;
  border: string;
  divider: string;
  income: string;
  expense: string;
}

export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface ThemeTypography {
  h1: TextStyle;
  h2: TextStyle;
  h3: TextStyle;
  h4: TextStyle;
  body1: TextStyle;
  body2: TextStyle;
  caption: TextStyle;
  button: TextStyle;
}

export interface ThemeBorderRadius {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  round: number;
}

export interface ThemeShadows {
  sm: object;
  md: object;
  lg: object;
}

import type { TextStyle } from 'react-native';
import type {
  Transaction,
  Category,
  Recurrence,
  Receipt,
  MonthlyReport,
  TrendData,
  TransactionFilters
} from './index';
