# Iterative Development Plan — Finance Tracker

Date: 2025-11-14

This document outlines a pragmatic, iterative roadmap for the Finance Tracker project. It is written to match the repository's current shape (TypeScript code, an OCR helper, a CSV import script) and the product brief in `README.md` (offline-first, privacy-first mobile app with receipt scanning, reports, recurring transactions).

Principles
- Deliver end-to-end working increments (vertical slices) every 1–2 weeks.
- Keep the app offline-first and privacy-first; network sync is optional and out of scope for early iterations.
- Favor simple, testable implementations; add complexity only when needed.

Assumptions
- Platform: cross-platform mobile (React Native or similar) using TypeScript. The repo already contains TS and Node scripts.
- Local storage: SQLite / local persisted store will be used for transaction data.
- OCR: `tesseract.js` is available as a cross-platform JS/WASM fallback; native ML Kit bindings may be added later.

How to use this plan
- Each iteration has: Goal, Deliverables, Acceptance criteria (Definition of Done), Tasks, Estimates, Risks and Tests.
- Use iterations sequentially. Keep each iteration scoped so it can be completed in 1–2 weeks.

---

## Iteration 0 — Project hygiene & baseline (1 week)
Goal: Make the repo easy to build, test, and extend.

Deliverables
- Project README updated with dev setup and quick start.
- Basic project scaffolding (package.json / tsconfig / linting) verified.
- CI workflow updated to run typecheck and tests (`.github/workflows/ci.yml` exists).

Definition of Done
- `npm ci` / `pnpm install` succeeds; typecheck and linters run in CI.
- A contributor can run the app in emulator or run unit tests locally following README steps.

Tasks
- Audit `package.json` (create if missing) and add dev scripts: test, lint, build, typecheck.
- Add or update `README.md` dev setup section.
- Ensure `.github/workflows/ci.yml` runs basic checks (install, typecheck, test).

Estimates: 3–5 days
Risks: Unknown dependency setups, native modules. Mitigation: keep CI checks minimal (typecheck + unit tests) and defer native builds.
Tests: Add one unit test (e.g., CSV import script parsing) and a type-check step.

---

## Iteration 1 — Core transaction model & local persistence (1–2 weeks)
Goal: Implement the core transaction data model and CRUD backed by a local DB.

Deliverables
- Transaction model (id, amount cents, date ISO, category, merchant, notes, created_at, recurring metadata).
- Local DB layer (SQLite or IndexedDB abstraction) with repository methods: create, read, update, delete, list (with filters by date / category).
- Simple CLI or test harness to insert/read transactions (serverless test harness).

Definition of Done
- Unit tests for repository methods.
- Manual test: add a transaction and verify it persists across app restarts (or in test harness).

Tasks
- Design TypeScript interfaces for Transaction and Recurrence.
- Implement DB helper (wraps SQLite or alternative) and wiring in `app/services/db/helpers.ts`.
- Add migrations or schema creation on first run.

Estimates: 1–2 weeks
Risks: Native SQLite integration complexity; start with a JS SQLite wrapper or an in-memory store and switch later.
Tests: Repository unit tests (happy path + error cases: duplicate id, invalid data).

Edge cases to consider
- Timezones and date normalization
- Large import files
- Concurrent writes / UI race conditions

---

## Iteration 2 — Basic UI flows & manual entry (2 weeks)
Goal: Provide screens to add/edit/delete transactions and view a simple list.

Deliverables
- Transaction list screen with basic filters (month, category).
- Add / Edit transaction form with validation.
- Delete confirmation and error handling.

Definition of Done
- E2E flow: user can add a transaction via UI and it appears in list and persists.
- Unit tests for form validation logic.

Tasks
- Implement screens & wiring to DB layer.
- Add form validation and error messages.
- Add lightweight UI tests or storybook stories for components.

Estimates: 2 weeks
Risks: UI framework inconsistencies. Mitigation: keep UI minimal and use standard components.

---

## Iteration 3 — Receipt scanning (OCR) (2 weeks)
Goal: Add receipt image capture and OCR to create transactions automatically.

Deliverables
- Camera/Photo picker integration to capture receipt images.
- OCR integration using `app/services/ocrService.ts` (tesseract fallback + native hook design).
- Receipt parsing rules: extract total amount, date, merchant, and line items (best-effort).
- A review screen showing parsed fields before saving.

Definition of Done
- Upload/capture an image, get OCR text, parse a transaction suggestion, and allow user to save it.
- Unit tests for parsing heuristics (string inputs -> parsed fields).

Tasks
- Wire `detectText(uri)` results into a parser module (receipt -> transaction suggestion).
- Create a review UI and map suggestion to the Add Transaction flow.
- Add analytics events (local) for OCR success/failure.

Estimates: 2 weeks
Risks: OCR quality variance (lighting, language). Mitigation: surface parsed text and allow manual correction.

Tests: Parser unit tests covering typical receipt variations and failure modes.

---

## Iteration 4 — Recurring transactions & scheduling (1 week)
Goal: Support recurring transactions (salaries, rent) and automatic generation.

Deliverables
- Recurrence model and UI to create recurring rules.
- Background job / on-app-launch generator that materializes due transactions.

Definition of Done
- Create a recurring rule and see generated transactions for the upcoming month.
- Unit tests for recurrence expansion logic.

Tasks
- Implement recurrence rule structure (frequency, nextRun, endDate) and generator logic.
- Wire generator to app start and optionally manual trigger.

Estimates: 1 week
Risks: Time calculations/timezones. Mitigation: normalize to UTC for recurrence computation, store user locale for display.

---

## Iteration 5 — Reports, exports, and imports (2 weeks)
Goal: Provide monthly reports and data portability (CSV/PDF export + improved CSV import).

Deliverables
- Monthly summary screen with charts (category breakdown, totals).
- CSV export and improved CSV import with preview and mapping UI.
- Optional PDF export for a report using a simple template.

Definition of Done
- User can export a month to CSV and import a CSV mapping columns.
- Unit tests for export format and import mapping logic.

Tasks
- Integrate charting library and build summary components.
- Enhance `scripts/import-csv.js` logic into an import module with validation.
- Add export-to-file helpers and storage permissions handling.

Estimates: 2 weeks
Risks: Library size (offline constraints), PDF generation complexity. Mitigation: keep exports optional and use lightweight libraries.

---

## Iteration 6 — Security, backups & restore (1–2 weeks)
Goal: Harden data protection: PIN/biometric lock, encrypted local storage, and manual backup/restore.

Deliverables
- App lock screen (PIN / biometric flow) to unlock the app.
- Encrypted local DB or file export with password-based encryption for backups.
- Manual export/import backup workflow in settings.

Definition of Done
- User can set a PIN/biometric unlock and create an encrypted backup file that can be restored locally.

Tasks
- Choose encryption library and implement backup export/import.
- Add settings UI for lock and backup management.

Estimates: 1–2 weeks
Risks: Platform permissions and secure storage integration. Mitigation: limit initial support to simple password-encrypted file export.

---

## Iteration 7 — UX polish, accessibility, and localization (2 weeks)
Goal: Make the app feel polished and reachable by more users.

Deliverables
- Accessibility improvements (labels, contrasts, keyboard navigation where applicable).
- Localization strings for at least 2 locales (en + one target language).
- Visual polish for main flows and a basic onboarding screen.

Definition of Done
- Accessibility audit checklist passed for main screens.
- Strings externalized; switching locale updates UI.

Estimates: 2 weeks
Risks: Localization platform complexity. Mitigation: use a simple JSON-based i18n solution.

---

## Iteration 8+ — Optional/advanced features
- Encrypted, opt-in cloud sync (end-to-end encrypted)
- Smart categorization via local ML models
- Budgeting and goal-setting features
- Multi-account / multi-currency support
- Enhanced analytics and insights (trends, forecasting)

Plan for each advanced feature: small spike (3–5 days) to explore integrations and costs.

---

## Cross-iteration quality gates
For each iteration, ensure these checks run in CI:
- Build / Typecheck -> PASS
- Linting -> PASS
- Unit tests -> PASS (coverage targets optional)

If any iteration introduces native modules, document required native build steps in README and keep CI tests limited to JS/TS checks.

---

## Testing strategy
- Unit tests for parser, recurrence, and DB layer (happy + key edge cases).
- Integration tests for data flows (create -> persist -> list -> export/import).
- Manual QA checklist for OCR: good image, noisy image, foreign language receipt, handwritten text.

Example edge cases
- Receipts with multiple totals (tip + subtotal)
- Wrongly parsed dates (e.g., 01/02 ambiguity)
- Duplicate imports
- Large imports that need batching

---

## Metrics & telemetry (local-first)
- Track counts of transactions added, OCR success/fail rates (locally stored aggregates), exports/imports performed.
- Use local-only analytics to avoid privacy issues; any telemetry must be opt-in.

---

## Minimal roadmap calendar (high level)
- Weeks 0–2: Iteration 0 (hygiene) + Iteration 1 (model + persistence)
- Weeks 3–4: Iteration 2 (UI flows)
- Weeks 5–6: Iteration 3 (OCR)
- Weeks 7–8: Iteration 4 + 5 (recurring + reports)
- Weeks 9–11: Iteration 6–7 (security + polish)

---

## Next steps (recommended immediate actions)
1. Add or confirm `package.json` and a dev script to run typecheck/tests.
2. Create one or two unit tests: DB repository and the CSV parser.
3. Start Iteration 0: update the README with dev setup commands and CI expectations.

---

Notes
- If you want, I can convert each iteration into GitHub issues (with checklists) or generate a milestone/timeline. Tell me which format you prefer and I will create the issues.

---

Generated by the development planning assistant — edit as needed.
