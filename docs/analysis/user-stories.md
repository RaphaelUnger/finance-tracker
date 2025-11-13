# Finance Tracker — User Stories

## Epic: Core Transactions

### US-001: Add transaction
- As a user, I want to add an expense or income with minimal steps so I can record transactions quickly.
  - Acceptance Criteria:
    - User can open "Add Transaction" and complete entry in 3 taps or fewer.
    - Required fields: amount, date, category, type (expense/income).

### US-002: Edit transaction
- As a user, I want to edit an existing transaction so I can correct mistakes.
  - Acceptance Criteria:
    - User can change amount, date, category, and notes.

### US-003: Delete transaction
- As a user, I want to delete a transaction so I can remove erroneous entries.
  - Acceptance Criteria:
    - Deletions require confirmation.

## Epic: Categorization

### US-010: Predefined categories
- As a user, I want to select from a predefined list of general expense categories so that categorization is consistent.
  - Acceptance Criteria:
    - Categories include: Food, Transport, Utilities, Entertainment, Shopping, Healthcare, Other.
    - No custom category creation is available.

## Epic: Receipt & Invoice Capture

### US-020: Scan receipt/invoice/bill
- As a user, I want to scan receipts, invoices, or bills offline so that transactions can be captured automatically without internet.
  - Acceptance Criteria:
    - App performs OCR locally and extracts amount, date, and merchant when possible.
    - Parsed data is presented for user confirmation before saving.

### US-021: Manual correction after scan
- As a user, I want to correct scanned data before saving so that entries are accurate.
  - Acceptance Criteria:
    - All parsed fields are editable before save.

## Epic: Recurring Transactions

### US-030: Define recurring transaction
- As a user, I want to define recurring incomes or expenses with flexible recurrence options so recurring events are tracked.
  - Acceptance Criteria:
    - Recurrence options: daily, weekly, monthly, yearly.
    - User can set start date and optional end date.
    - Recurring items are created in the transaction list but do not trigger in-app reminders/notifications.

## Epic: Reporting & Export

### US-040: Visual reports
- As a user, I want monthly and yearly summaries with charts so I can understand my spending at a glance.
  - Acceptance Criteria:
    - Provide pie chart by category and bar chart by month.
    - Allow custom date range selection.

### US-041: Export / Import CSV
- As a user, I want to export and import my transactions as CSV so I can backup or migrate my data offline.
  - Acceptance Criteria:
    - CSV export includes all transaction fields.
    - CSV import validates format and reports parsing errors.

## Epic: Privacy & Security

### US-050: Local encrypted storage
- As a user, I want all data stored locally and encrypted so my financial data remains private.
  - Acceptance Criteria:
    - Data at rest is encrypted.
    - App does not attempt network access by default.

### US-051: PIN/Biometric access
- As a user, I want optional PIN or biometric lock for app access so my data is protected if my device is accessed.
  - Acceptance Criteria:
    - User can enable/disable PIN or biometric lock.

## Non-Functional Requirements

- Offline-first: All core functionality must work without network access.
- Performance: Common flows (add transaction, scan receipt, view monthly chart) should respond within 300ms on target devices.
- Simplicity: Add transaction flow must be <= 3 taps.
