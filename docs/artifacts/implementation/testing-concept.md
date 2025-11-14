# Testing Concept & Plan — Finance Tracker

Date: 2025-11-14

Purpose

This document describes a pragmatic, implementable testing strategy for the Finance Tracker app. It covers the types of tests to write, recommended tools and libraries, CI quality gates, sample test cases for the app's most important flows (transactions, OCR, import/export, recurrence, security), test data management, and a roadmap for rolling tests into the iterative plan.

Principles
- Fast, deterministic unit tests; broader integration and E2E tests where they add the most value.
- Keep tests offline-first and reproducible (no external network calls). Mock external dependencies (OCR engines, camera, platform APIs) in unit/integration tests.
- Tests run locally and in CI. Run heavier E2E tests selectively (pull request gating vs nightly runs).
- Prioritize critical user flows: transaction CRUD, receipt scanning (parse & save), import/export, backup/restore.

Scope
- In-scope: all client-side business logic in TypeScript, DB repository layer, CSV import logic, receipt parsing heuristics, recurrence expansion logic, settings (lock/backup) logic.
- Out-of-scope (initial): opt-in cloud sync, heavy ML model training, device-specific camera integration beyond mocks.

Test Pyramid (recommended allocation)
- Unit tests (60–70%): pure functions, parser, recurrence logic, DB helpers (using an in-memory DB or test SQLite file), CSV import parsing.
- Integration tests (20–30%): repository + persistence + simple UI component interactions (if RN), OCR pipeline integrated with parser but mocking heavy OCR libs.
- End-to-end (E2E) tests (5–10%): full app flows on a device/emulator (Add transaction -> List -> Export), run in CI on merge or nightly.

Recommended tools and libs
- Test runner & assertions: Jest with ts-jest (TypeScript support) — widely used, fast.
- Unit/component testing: @testing-library/react-native (if React Native) or @testing-library/react + React Testing Library for web-like UI.
- Mocks & spies: jest-mock, msw (for any HTTP mocks, optional).
- SQLite test helpers: use an in-memory SQLite instance or a per-test temporary file; use better-sqlite3 or sqlite3 native bindings only in integration tests; consider a JS-only mock for fast unit tests.
- OCR test strategy: mock OCR output for unit/integration tests; add a small number of acceptance tests that run actual tesseract.js (optional, gated, and run on a separate job if heavy).
- E2E: Detox (React Native) or Playwright/Appium depending on platform. Choose Detox for RN since it integrates well into CI and is stable for RN apps.
- Lint & typechecks: ESLint + TypeScript (tsc) enforced in CI.

CI Quality Gates (suggested)
- PR gate (fast feedback): install deps, run lint, run typecheck, run unit tests (fast only), run integration smoke tests that use mocked services.
- Merge gate (full checks on main): all above + integration tests with actual SQLite + lightweight OCR acceptance tests (if fast) + artifact creation if needed.
- Nightly / scheduled (heavy): E2E test suite across emulators/simulators and OCR full runs on a couple of sample receipts.

Local run commands (example)

```bash
# install deps
npm ci
# run lint
npm run lint
# run unit tests
npm test
# run unit + integration tests
npm run test:all
```

(Adjust commands to match the project's package manager and scripts; add these scripts to `package.json` as part of Iteration 0.)

Test Data & Fixtures
- Keep a small `tests/fixtures/` folder containing:
  - Example receipt images (small, low-res) covering common formats.
  - Sample CSV files (valid and malformed) for import tests.
  - JSON fixtures for parsed OCR outputs (to decouple parser tests from OCR engine runs).
- Fixtures must be deterministic and small. Store only a handful of representative images to keep repo size reasonable.
- Provide helper functions to seed the test DB from fixtures and to tear it down reproducibly.

Mocking strategy
- Mock heavy or non-deterministic dependencies in most tests:
  - OCR engine: mock `detectText(uri)` to return specific outputs from fixtures.
  - Camera / photo picker: mock native module to return a URI to a fixture image.
  - Native secure storage / biometrics: mock success/failure flows.
  - Platform APIs (file system) for import/export: use an in-memory FS mock or temporary directories.
- For one or two acceptance tests, run tesseract.js real recognition against a couple of fixtures to validate parsing heuristics. Keep these tests isolated and run them in a separate CI job.

Test types and concrete sample tests

1) Unit tests (fast, isolated)
- CSV parser: valid CSV -> array of transactions; invalid rows -> error/warning handling.
- Amount conversion: floats -> integer cents rounding behavior (0.005 etc.).
- Date normalization: parse different ISO and locale formats and confirm UTC normalization.
- Recurrence expansion: monthly/weekly/yearly rules -> correct generated dates, edge cases on month ends.
- Receipt parser heuristics: OCR text string -> parsed {amount, date, merchant} for representative strings.

2) Integration tests (repo + DB + small service)
- Repository CRUD: create -> read -> update -> delete works against a real test SQLite file.
- Import flow: run the CSV import module against `tests/fixtures/import-valid.csv` and assert DB contains expected rows.
- OCR pipeline (mocked OCR): feed detectText mock output into the parser + save flow; assert transaction persisted.

3) E2E tests (emulator/device)
- Add a transaction manually (simulate UI), then check the transaction appears in list and in exported CSV.
- Receipt scan end-to-end: simulate picking an image (fixture), run the OCR flow, confirm suggestion appears and saving creates a transaction.
- Backup & Restore: export encrypted backup, wipe DB (in app), restore from backup and confirm data restored.

4) Accessibility & Localization tests
- Use automated checks (axe for web, or RN accessibility testing) to verify labels and roles on main screens.
- Run a smoke test for each supported locale to ensure strings load and layouts don't break (snapshot tests can help).

5) Security tests (manual + automated)
- Verify encrypted backup cannot be opened without password (automated if using library with deterministic output).
- Test PIN/biometric lock flows under success/failure conditions (mock biometrics).

Edge cases to add tests for
- Duplicate imports (CSV imported twice) generate duplicate detection or dedup policy.
- Large CSV import (throttling / batching) — integration/perf test.
- Receipts with multiple totals — parser picks the correct total or prompts user.
- Timezone edge cases for recurrence generation around DST transitions.

Test coverage & metrics
- Target a sensible coverage threshold for unit-tested logic (e.g., 60–80% for business logic modules). Avoid focusing on line coverage for UI code; prefer meaningful tests.
- Track test durations and flaky tests; keep test suite stable and fast.

Flaky test strategy
- Mark flaky tests with a `@flaky` tag and run them in isolation.
- Invest time to fix flaky tests early (they reduce confidence). Use retries as a last resort and note them in test metadata.

CI Implementation plan (incremental)
- Phase 1 (Iteration 0): Add Jest + ts-jest, add one unit test (CSV parser), add `npm test` script, add CI job to run lint/typecheck and unit tests.
- Phase 2 (Iteration 1–2): Add integration tests, DB seeding helpers, run integration smoke tests in CI.
- Phase 3 (Iteration 3): Add OCR acceptance job (separate CI job) that runs tesseract.js on 2 fixtures and validates parsing; run nightly.
- Phase 4 (Stabilize): Add E2E tests using Detox; run E2E on a dedicated runner or schedule nightly full runs. Gate merges only after passing fast PR checks.

Test maintenance
- Update fixtures when adding parsing features.
- Keep tests small and focused; review failing tests on each PR and fix within the same iteration.
- Assign ownership for tests per feature area in the backlog.

Mapping tests to earlier iterative plan (short)
- Iteration 0: Unit tests + CI for CSV import and typecheck.
- Iteration 1: Repository unit tests + integration tests for DB.
- Iteration 2: UI component tests and integration wiring tests for add/edit flows.
- Iteration 3: Parser unit tests, OCR-mocked integration tests, OCR acceptance tests (separate job).
- Iteration 4–5: Recurrence tests, export/import integration tests, backup/restore tests.
- Iteration 6–7: Security & accessibility tests.

Example test checklist for a PR
- [ ] Typecheck passes
- [ ] Lint passes
- [ ] Unit tests added/updated and pass locally
- [ ] Integration smoke tests pass (if touching persistence)
- [ ] E2E not required for small changes (unless UI critical), otherwise link to passing E2E run
- [ ] New fixtures added under `tests/fixtures/` if needed

Deliverables and timeline
- Week 0 (Iteration 0): Add test infra, example unit test (CSV parser), CI unit test job.
- Week 1–2: Add DB integration tests and seeding helpers.
- Week 3–4: Add OCR parser unit tests and mocked OCR integration tests.
- Week 5–6: Add E2E harness (Detox) and one or two stable E2E flows; schedule nightly runs.

Appendix — Short examples
- Suggested package.json scripts (add during Iteration 0):

```json
{
  "scripts": {
    "test": "jest --config jest.config.js",
    "test:watch": "jest --watch",
    "test:all": "jest --runInBand",
    "lint": "eslint . --ext .ts,.tsx",
    "typecheck": "tsc --noEmit"
  }
}
```

- Jest config notes:
  - Use `ts-jest` preset or Babel transform for TypeScript.
  - Configure test environment to `node` for business logic tests; use `@testing-library/react-native` for component tests (requires React Native test setup).
  - Use `setupFilesAfterEnv` to register testing-library matchers and global mocks.

---

Next steps I can implement for you
- Add a baseline Jest + ts-jest configuration and a single unit test (CSV parser) and wire CI to run it.
- Add test fixtures folder and small example fixtures (receipt text, sample CSV) and a parser test.
- Draft Detox config and one E2E test skeleton (requires more setup and may need a CI runner with Android/iOS emulators).

Tell me which of the next steps you'd like me to do and I'll implement it.
