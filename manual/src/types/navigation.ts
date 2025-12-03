// Navigation types for React Navigation

export type RootStackParamList = {
  // Auth Stack
  LockScreen: undefined;
  SetupPin: undefined;

  // Main Stack
  MainTabs: undefined;

  // Transaction Stack
  TransactionForm: { transactionId?: string; mode?: 'create' | 'edit' };
  TransactionDetail: { transactionId: string };

  // Receipt Stack
  ReceiptScanner: undefined;
  ReceiptReview: { receiptId: string; extractedData: any };

  // Category Stack
  CategoryManagement: undefined;
  CategoryForm: { categoryId?: string; mode?: 'create' | 'edit' };

  // Report Stack
  ReportDetail: { reportType: string; period?: string };

  // Settings Stack
  Settings: undefined;
  SecuritySettings: undefined;
  ExportData: undefined;
  ImportData: undefined;
  About: undefined;

  // Recurrence Stack
  RecurrenceManagement: undefined;
  RecurrenceForm: { recurrenceId?: string; mode?: 'create' | 'edit' };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Transactions: undefined;
  Reports: undefined;
  Settings: undefined;
};

export type AuthStackParamList = {
  LockScreen: undefined;
  SetupPin: undefined;
  SetupBiometric: undefined;
};

export type TransactionStackParamList = {
  TransactionList: undefined;
  TransactionForm: { transactionId?: string; mode?: 'create' | 'edit' };
  TransactionDetail: { transactionId: string };
  ReceiptScanner: undefined;
  ReceiptReview: { receiptId: string; extractedData: any };
};

export type ReportStackParamList = {
  ReportDashboard: undefined;
  MonthlyReport: { month?: string; year?: number };
  CategoryReport: { categoryId?: string };
  TrendReport: { period?: string };
  ReportDetail: { reportType: string; period?: string };
};

export type SettingsStackParamList = {
  SettingsList: undefined;
  SecuritySettings: undefined;
  CategoryManagement: undefined;
  RecurrenceManagement: undefined;
  ExportData: undefined;
  ImportData: undefined;
  About: undefined;
};

// Navigation props helpers

import type { StackScreenProps } from '@react-navigation/stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

export type RootStackScreenProps<Screen extends keyof RootStackParamList> =
  StackScreenProps<RootStackParamList, Screen>;

export type MainTabScreenProps<Screen extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, Screen>,
    StackScreenProps<RootStackParamList>
  >;

export type TransactionStackScreenProps<Screen extends keyof TransactionStackParamList> =
  CompositeScreenProps<
    StackScreenProps<TransactionStackParamList, Screen>,
    StackScreenProps<RootStackParamList>
  >;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
