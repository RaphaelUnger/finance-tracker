Example snippets and small runnable helpers

This folder contains small example helpers referenced in `docs/architecture.md`.

Files created

- `app/services/ocrService.ts` — tesseract.js worker example and a native-fallback stub.
- `app/services/db/helpers.ts` — minimal expo-sqlite helpers: openDatabase, createTransactionsTable, addTransaction, getRecentTransactions.
- `scripts/import-csv.js` — Node script that reads a CSV and emits SQL INSERT statements to stdout. Use this to generate `imports.sql` and then feed into your SQLite tooling.

Quick start (local CSV import)

1. Prepare a CSV with header: `id,amount,date,category,notes,merchant,createdAt`
2. Run:

```bash
node scripts/import-csv.js path/to/transactions.csv > imports.sql
```

3. Inspect `imports.sql`, then run it against your SQLite database (example with `sqlite3` CLI):

```bash
sqlite3 app.db < imports.sql
```

Notes

- The TypeScript examples assume you will install `tesseract.js` and `expo-sqlite` in the mobile project. Use the version pins in `docs/architecture.md`.
- The Node CSV importer is intentionally dependency-free for portability.
- These example files are minimal; adapt them to your project's error handling and transaction/migration strategy.
