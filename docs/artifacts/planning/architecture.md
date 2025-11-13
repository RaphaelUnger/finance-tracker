# Architecture

## Executive Summary

A privacy-first, offline-capable mobile-first architecture optimized for fast transaction capture, local encrypted storage, and on-device OCR for receipts. We'll use a cross-platform mobile approach (Expo/React Native) with local-first persistence and optional backend only for non-MVP features. This decision-focused document defines consistent implementation patterns to prevent AI agent conflicts.

## Project Initialization

First implementation story: initialize a cross-platform mobile app using Expo.

```bash
npx create-expo-app finance-tracker --template expo-template-blank --name "FinanceTracker" --npm
```

This provides the mobile runtime, TypeScript option, and navigation.

## Decision Summary

| Category | Decision | Version | Affects Epics | Rationale |
| -------- | -------- | ------- | ------------- | --------- |
| Platform | Expo / React Native | create-expo-app 3.5.3 (CLI) / Expo docs (latest SDK) | Core Transactions, Receipt Capture, Reporting | Cross-platform mobile, fast iteration, strong community support |
| Persistence | SQLite via Expo SQLite or WatermelonDB | expo-sqlite (bundled ~16.0.9) or @nozbe/watermelondb 0.28.0 | Core Transactions, Recurring Transactions, Reporting | Local-first persistence with proven mobile performance; supports offline-first flows |
| Encryption | SQLCipher or platform keystore (via secure-store) | expo-secure-store (bundled ~15.0.7) / SQLCipher via expo-sqlite config | Privacy & Security | Protect data at rest locally per PRD requirement |
| OCR | Tesseract via native modules or ML Kit on-device | tesseract.js 6.0.1 (WASM) or native ML Kit bindings | Receipt Capture | On-device OCR to meet offline requirement; choose lightweight model for mobile |
| Starter Template | Expo template | create-expo-app 3.5.3 | Project Initialization | Provides app scaffolding and native build pipeline |
| Authentication | Local device PIN/biometric only (no cloud auth) | N/A | Privacy & Security | PRD excludes cloud; optional local lock fulfills requirement |
| API Pattern | None for MVP (local-only); later REST/GraphQL for optional cloud sync | N/A/TBD | Optional features | Keeps MVP offline; defines future path for sync |
| Deployment Target | App Stores (iOS/Android) | N/A | All epics | Native distribution for mobile apps |
| Data Format | JSON for CSV import/export; ISO 8601 for dates | N/A | Reporting, Export/Import | Clear interchange format for backup and reporting |

## Project Structure

```
finance-tracker/
├─ app/ (Expo app source)
│  ├─ components/
│  ├─ screens/
│  ├─ navigation/
│  ├─ services/
│  ├─ storage/
│  ├─ hooks/
│  └─ utils/
├─ assets/
├─ tests/
├─ docs/
└─ package.json
```

## Epic to Architecture Mapping

| Epic | Module/Location |
| ---- | --------------- |
| Core Transactions | app/screens/Transactions, app/services/transactionService, app/storage/transactions.db |
| Categorization | app/components/CategoryPicker, app/services/categoryService |
| Receipt & Invoice Capture | app/screens/Scan, app/services/ocrService, native modules for OCR |
| Recurring Transactions | app/services/recurrenceService, app/storage/recurrences.db |
| Reporting & Export | app/screens/Reports, app/services/reportService, CSV export/import utils |
| Privacy & Security | app/services/security, secure storage integration |

## Technology Stack Details

### Core Technologies

- Runtime: Expo / React Native (TypeScript)
- Persistence: SQLite (via Expo SQLite) or WatermelonDB
- Storage Encryption: SecureStore / SQLCipher (investigate) 
- OCR: Tesseract native bindings or ML Kit on-device
- Charts: react-native-svg + victory-native or react-native-chart-kit
- Testing: Jest + React Native Testing Library

### Version verification (summary)

Verified on 2025-11-13 (sources: Expo docs and npm pages)

- create-expo-app (CLI): 3.5.3 (npm) — used for project bootstrap
- expo-sqlite: bundled version ~16.0.9 (Expo docs)
- expo-secure-store: bundled version ~15.0.7 (Expo docs)
- @nozbe/watermelondb: 0.28.0 (npm)
- tesseract.js: 6.0.1 (npm / GitHub)
- react-native-chart-kit: 6.12.0 (npm)
- victory-native: 41.20.2 (npm)

Notes:
- `expo-sqlite` SQLCipher support is available via the config plugin (`useSQLCipher`) and requires a native rebuild (not available in Expo Go).
- `expo-secure-store` uses Android Keystore and iOS Keychain; some features (e.g., requireAuthentication) need native config and are not available in Expo Go without prebuild.
- WatermelonDB is available on npm (0.28.0); the GitHub releases page may not show packaged releases — pin to npm package version or a Git tag/commit when adopting.
- Tesseract.js is a WASM-based OCR (v6.x) suitable for on-device JS usage; native bindings or ML Kit may offer better perf on mobile if required.

### Integration Points

- CSV Export/Import: local filesystem access via Expo FileSystem
- Optional cloud sync (future): REST API with background sync worker

## Implementation Patterns

These patterns ensure consistent implementation across all AI agents:

- Naming Conventions:
  - Files & components: kebab-case for filenames (e.g., transaction-list.tsx), PascalCase for component names (TransactionList)
  - Database tables: snake_case (transactions, categories)
  - JSON field names: camelCase (transactionId, createdAt)

- Structure Patterns:
  - Feature-based organization (screens, components, services per feature)
  - Tests co-located next to modules with *.test.ts

- Format Patterns:
  - Dates: ISO 8601 strings in UTC for storage; display localized in UI
  - API responses (if added): { data: ..., error: null } wrapper

- Communication Patterns:
  - Service layer for all data access (transactionService) to isolate storage implementation

- Lifecycle Patterns:
  - All long-running operations show a consistent loading state component
  - Retry policy: exponential backoff for optional network operations; local ops retry immediately

- Consistency Patterns:
  - Logging format: JSON entries with {level, timestamp, module, message}
  - Error messages: user-facing errors in user-friendly language, logged with full stack for debugging

### Practical integration examples (small, copyable)

1) SQLCipher + `expo-sqlite` (app config + runtime PRAGMA)

Add the `expo-sqlite` config plugin to your `app.json` (or `app.config.js`) to enable SQLCipher and FTS if desired. Note: this requires a native rebuild (`npx expo prebuild` / EAS build) and is not available in Expo Go.

app.json (snippet):

```json
{
  "expo": {
    "plugins": [
      [
        "expo-sqlite",
        {
          "enableFTS": true,
          "useSQLCipher": true,
          "android": { "useSQLCipher": true },
          "ios": { "useSQLCipher": true }
        }
      ]
    ]
  }
}
```

After building the native binary, set the SQLCipher key immediately after opening the database:

```ts
import * as SQLite from 'expo-sqlite';

async function openEncryptedDb(dbName: string, password: string) {
  const db = await SQLite.openDatabaseAsync(dbName);
  // Set the key for SQLCipher (run once per connection)
  await db.execAsync(`PRAGMA key = '${password.replace(/'/g, "''" )}'`);
  // Optional: verify
  const versionRow = await db.getFirstAsync<{ 'sqlite_version()': string }>('SELECT sqlite_version()');
  console.log('SQLite version:', versionRow['sqlite_version()']);
  return db;
}
```

2) On-device OCR: tesseract.js worker snippet + fallback guidance

Tesseract.js (WASM) works inside the JS bundle and is suitable when you want a pure-JS solution. For higher performance on mobile, evaluate native ML Kit bindings.

Tesseract.js worker (basic example):

```ts
import { createWorker } from 'tesseract.js';

async function recognizeImage(uri: string) {
  const worker = createWorker({ logger: m => console.log(m) });
  await worker.load();
  await worker.loadLanguage('eng');
  await worker.initialize('eng');
  const { data } = await worker.recognize(uri);
  await worker.terminate();
  return data.text;
}
```

Fallback / performance notes:
- If tesseract.js is too slow or memory-heavy on low-end devices, use native ML Kit (Android/iOS) via a small native module or existing React Native bindings. ML Kit offers better runtime performance and smaller runtime memory for common receipt OCR use-cases.
- When using ML Kit, implement a common interface `ocrService.detectText(uri)` so agents can switch implementations without touching callers.

3) Three concise implementation examples (DB schema + usage + CSV import)

- Example A — Transactions table schema (SQL) and a simple insert helper

SQL schema (create table):

```sql
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  amount INTEGER NOT NULL,
  date TEXT NOT NULL,
  category TEXT,
  notes TEXT,
  merchant TEXT,
  created_at TEXT,
  updated_at TEXT
);
```

Insert helper (TypeScript):

```ts
import { v4 as uuidv4 } from 'uuid';

async function addTransaction(db, { amount, date, category, notes, merchant }) {
  const id = uuidv4();
  const now = new Date().toISOString();
  await db.runAsync(
    'INSERT INTO transactions (id, amount, date, category, notes, merchant, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, amount, date, category, notes, merchant, now, now]
  );
  return id;
}
```

- Example B — Component file path and small read snippet

File: `app/screens/Transactions/TransactionList.tsx`

Read snippet (using expo-sqlite provider pattern):

```ts
const rows = await db.getAllAsync('SELECT * FROM transactions ORDER BY date DESC LIMIT 100');
setTransactions(rows);
```

- Example C — CSV import/export header example

CSV header (import/export):

```
id,amount,date,category,notes,merchant,createdAt
```

CSV import note: parse `amount` as integer cents and `date` as ISO 8601 string; run imports in a background task and batch inserts inside a transaction for performance.

## Consistency Rules

### Naming Conventions

- API endpoints (future): plural resource names (e.g., /transactions)
- DB columns: snake_case
- UI components: PascalCase filenames with .tsx extension

### Code Organization

- Feature folders under `app/` contain screens, components, services, and storage
- Shared utilities under `app/utils/`

### Error Handling

- Use a central error handler in services that maps internal errors to user-friendly messages
- For critical errors (storage corruption), show recovery path and export logs

### Logging Strategy

- Structured JSON logging stored locally for debugging; anonymize any personal data

## Data Architecture

- Transactions table:
  - id (uuid)
  - amount (integer cents)
  - date (ISO 8601)
  - category (enum)
  - notes (text)
  - merchant (text)
  - createdAt, updatedAt

- Recurrences table:
  - id (uuid)
  - transaction_template_id
  - recurrence_rule (RRULE-ish string)

## API Contracts

- MVP: no network API. CSV import/export uses column headers: id, amount, date, category, notes, merchant, createdAt

## Security Architecture

- Data at rest encrypted using platform keystore / SQLCipher
- Optional PIN/biometric unlocking via Expo SecureStore or platform biometrics
- No telemetry or analytics in MVP

## Performance Considerations

- Use background threads for OCR and image processing
- Debounce writes during rapid transaction entry
- Preload category list and cache frequently used queries

## Deployment Architecture

- Distribution: Apple App Store and Google Play
- Optional backend (future): Dockerized REST service with PostgreSQL

## Development Environment

### Prerequisites

- Node.js (LTS)
- npm or yarn
- Expo CLI

### Setup Commands

```bash
# install deps
npm install
# run app
npx expo start
```

## Architecture Decision Records (ADRs)

1. ADR-001: Choose Expo for cross-platform mobile development — Rationale: Fast iteration, strong community, offline-capable via local storage.
2. ADR-002: Use local SQLite for persistence — Rationale: Offline-first requirement and efficient local queries.

---

_Generated by BMAD Decision Architecture Workflow v1.0_
_Date: 2025-11-13_
_For: BMad_
