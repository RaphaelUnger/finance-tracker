# Finance Tracker — Product Brief

## One-line summary
Privacy-first, offline-capable mobile app for personal finance: fast transaction capture, predefined categorization, receipt/invoice scanning, visual reports, and CSV backup.

## Context & problem
Many people want a private, reliable way to track personal finances on their phones without relying on internet services or cloud sync. Existing apps often require accounts, expose data to third parties, or make quick entry and offline operation difficult.

## Target users
- Privacy-conscious individuals who prefer local-only data storage
- Users who want fast, low-friction transaction capture on mobile devices
- People who need simple visual reports (monthly/yearly) and manual CSV backup

## Goals and success criteria
- Enable fast transaction capture (3 taps or fewer) — measured by usability testing task completion.
- Accurate offline capture from receipts/invoices with local OCR and user-confirmation — measured by extraction accuracy and correction rate.
- Provide clear visual reports (pie + bar charts) for monthly and yearly summaries — measured by user satisfaction and report usage.
- Ensure data stays local and encrypted; no mandatory internet or cloud sync — verified by code audit.
- Provide CSV export/import for manual backup/migration — verified by successful round-trip imports.

## Key features (MVP)
- Fast add/edit/delete transactions (amount, date, predefined category, type, notes).
- Predefined category set (Food, Transport, Utilities, Entertainment, Shopping, Healthcare, Other).
- Offline OCR-based receipt/invoice/bill scanning with confirmation UI and editable parsed fields.
- Recurring transactions support (daily/weekly/monthly/yearly) without reminders/notifications.
- Visual reports: pie chart by category and bar chart by month; date-range selection.
- Manual CSV export/import for backup and migration.
- Local encrypted storage and optional PIN/biometric lock.

## Out of scope (MVP)
- Custom category creation (explicitly excluded).
- Cloud sync, server-side backups, or any internet-dependent features.
- Push notifications, scheduled reminders, or automated alerts.
- Advanced accessibility optimizations (deferred).

## User stories (high level)
- Add/edit/delete transactions quickly (US-001..US-003)
- Select from a predefined category list (US-010)
- Scan receipts/invoices offline and confirm parsed data (US-020, US-021)
- Define recurring transactions with flexible recurrence (US-030)
- Visual monthly/yearly reports and CSV import/export (US-040, US-041)
- Local encryption and optional app lock (US-050, US-051)

## Non-functional requirements
- Offline-first: app works without network connectivity for all core flows.
- Performance: common flows should respond within ~300ms on target devices.
- Simplicity: add-transaction flow ≤ 3 taps.
- Privacy: no telemetry or third-party analytics in MVP.

## Metrics & KPIs
- Time-to-add-transaction (target ≤ 3 taps; mean time under 10s).
- OCR extraction accuracy (target ≥ 80% fields correct before correction).
- Report usage rate (percentage of active users viewing reports weekly).
- Backup adoption (percentage of users who export CSV at least once in first 30 days).

## Milestones (suggested)
1. Project setup & architecture + local encrypted storage (2 weeks)
2. Core transaction CRUD + predefined categories + fast entry UX (2 weeks)
3. Offline OCR engine integration + receipt confirmation UI (3 weeks)
4. Recurring transactions + CSV export/import (2 weeks)
5. Visual reporting (charts) + date-range filters (2 weeks)
6. QA, performance tuning, and user testing (2 weeks)

## Risks & mitigations
- OCR accuracy may be low on-device: choose a lightweight OCR library tuned for receipts and provide strong correction UI and fallback to manual entry.
- Device storage/encryption implementation complexity: reuse proven mobile storage libraries (e.g., SQLCipher, platform keystore) and audit early.
- Performance on low-end devices: profile and optimize hotspots; offer lower-quality image processing mode.

## Acceptance criteria (MVP)
- Add transaction flow completes in ≤ 3 taps.
- OCR parsing extracts amount/date/merchant for ≥ 80% of clear receipts in tests; parsed results editable.
- Reports render correctly for sample datasets and include pie+bar charts.
- Data is stored encrypted on device and app functions fully offline.
- CSV export/import succeeds for a representative dataset and shows no data loss in round-trip test.

## Deliverables
- `docs/user-stories.md` (user stories)
- `docs/requirements.md` (requirements)
- `docs/product-brief.md` (this brief)
- Prototype app with transaction CRUD, receipt scanning, report views, and CSV import/export (code repository)

## Next steps
1. Review and confirm the brief.
2. Create issues/user stories in the tracker and prioritize the MVP backlog.
3. Start implementation with storage/encryption and core transaction flows.

---
Generated from `docs/requirements.md` and `docs/user-stories.md`.
