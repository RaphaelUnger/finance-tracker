<!--
Architecture Decision Records (ADRs) for finance-tracker
Generated: 2025-11-13
-->

# ADRs — Architecture Decisions (summary)

This file captures the key architecture decisions made for the Finance Tracker mobile product. Each ADR follows the lightweight ADR structure: Title, Status, Context, Decision, Consequences, Alternatives, Implementation Notes, and Date.

---

## ADR-001: Use Expo / React Native as the primary platform

- Status: Accepted
- Date: 2025-11-13

Context

We need a cross-platform mobile app with fast iteration for an MVP and good ecosystem support for plugins (camera, file system, native modules). The team values speed of development, testing, and the ability to add native capabilities later.

Decision

Use Expo / React Native for the mobile client. Bootstrap projects using `create-expo-app` (CLI version pinned at 3.5.3). Target distribution via standard App Store channels and use EAS for native builds when native modules/config plugins are needed.

Consequences

- Pros: Fast developer iteration, large ecosystem, Expo-managed APIs for camera, file system, and easy onboarding for contributors.
- Cons: Some native capabilities (e.g., enabling SQLCipher in `expo-sqlite`) require prebuilding or EAS builds and are not available in Expo Go.

Alternatives Considered

- Bare React Native app (more control, longer setup time).
- Flutter (not chosen due to team's React/TS preference and ecosystem alignment).

Implementation Notes

- Bootstrap using: `npx create-expo-app@3.5.3 finance-tracker --template expo-template-blank --npm`
- Use EAS for native builds when enabling config plugins (SQLCipher, SecureStore advanced options).

---

## ADR-002: Local-first persistence using SQLite (expo-sqlite) with WatermelonDB as an optional higher-level abstraction

- Status: Accepted
- Date: 2025-11-13

Context

The product requires offline-first behavior, reliable local queries for reporting and transactions, and efficient local storage that can be encrypted at rest.

Decision

Use SQLite as the canonical local datastore. Prefer `expo-sqlite` for integration with Expo-managed workflow. Offer WatermelonDB (npm @nozbe/watermelondb 0.28.0) as an optional higher-level ORM for complex offline sync and reactive patterns.

Consequences

- Pros: SQLite is lightweight and performant for local queries; `expo-sqlite` integrates well with Expo. WatermelonDB provides useful offline-first primitives if the app grows in complexity.
- Cons: `expo-sqlite` advanced options (SQLCipher, FTS) require native configuration (prebuild/EAS). WatermelonDB may introduce additional complexity and native bridging.

Alternatives Considered

- Realm (paid/licensing considerations), AsyncStorage (insufficient for relational queries), IndexedDB (not appropriate for native mobile runtime).

Implementation Notes

- Use `expo-sqlite` APIs and the provider/`useSQLiteContext()` patterns from Expo docs for database access.
- If WatermelonDB is adopted, pin to `@nozbe/watermelondb@0.28.0` and document the chosen version and compatibility matrix.

---

## ADR-003: Encrypt data at rest using SQLCipher with SecureStore for keys

- Status: Accepted
- Date: 2025-11-13

Context

User privacy and local data protection are core requirements. Local data must be encrypted at rest on user devices.

Decision

Use SQLCipher (via `expo-sqlite` config plugin `useSQLCipher`) to encrypt the SQLite database. Use `expo-secure-store` for storing the DB encryption key or small secrets; SecureStore maps to Android Keystore and iOS Keychain. Document the requirement that enabling SQLCipher requires a native rebuild (EAS) and a PRAGMA key call immediately after opening the DB.

Consequences

- Pros: Strong encryption of the database file; platform-standard secure storage for the key.
- Cons: Not available in Expo Go; requires prebuild / EAS for native binary. Care required for export/import and backup scenarios.

Alternatives Considered

- Store only the encryption key externally (not acceptable for offline-first privacy constraint), use SecureStore for all small data (but large datasets still require DB-level encryption).

Implementation Notes

- app.json plugin snippet example (see `docs/architecture.md`): set `useSQLCipher: true` and call `PRAGMA key = 'password'` after opening the DB.
- Keep the encryption key lifecycle limited (rotate if device credentials change) and avoid storing large secrets in SecureStore.

---

## ADR-004: On-device OCR — tesseract.js (WASM) by default, with native ML Kit as a performance fallback

- Status: Accepted
- Date: 2025-11-13

Context

The product supports receipt capture and must work offline. OCR must be available on-device without relying on cloud OCR services.

Decision

Use `tesseract.js` (v6.0.1) as the default, cross-platform JS/WASM OCR implementation for quick integration and offline capability. Provide a recommended fallback to native ML Kit (Android/iOS) bindings or a native Tesseract binding if device performance or memory usage is inadequate.

Consequences

- Pros: Ready-to-use JS API, works in WASM and Node environments for testing; easy to bundle and run inside the app.
- Cons: WASM OCR can be memory- and CPU-intensive on low-end devices. Native ML Kit offers better performance but requires native integration.

Alternatives Considered

- Native Tesseract mobile bindings (may be more complex to maintain), cloud OCR (rejected for privacy and offline requirements), ML Kit (preferred for high-performance native flows).

Implementation Notes

- Provide a small abstraction `ocrService.detectText(uri)` so the implementation can switch from tesseract.js to ML Kit with minimal app changes.
- Pin the default JS implementation to `tesseract.js@6.0.1` and document the fallback path.

---

## ADR-005: Charts library — prefer `victory-native`, fallback to `react-native-chart-kit`

- Status: Accepted
- Date: 2025-11-13

Context

The app needs high-quality charts for reports. We want a well-supported library that renders nicely on mobile and plays well with React Native Skia/Reanimated when needed.

Decision

Prefer `victory-native` (v41.20.2) for its D3-based feature set and active maintenance. Keep `react-native-chart-kit` (v6.12.0) as a fallback for simpler needs or if compatibility issues arise.

Consequences

- Pros: `victory-native` offers powerful, production-ready charts. `react-native-chart-kit` is lighter and easy to use for straightforward charts.
- Cons: `victory-native` requires peer deps (react-native-reanimated, gesture-handler, Skia) which add setup complexity.

Implementation Notes

- Document required peer dependencies and provide example install instructions in the architecture doc.

---

## ADR-006: Authentication strategy for MVP — local device PIN/biometric only

- Status: Accepted
- Date: 2025-11-13

Context

The PRD excludes cloud authentication in the MVP and emphasizes privacy. Users require a simple local lock for the app.

Decision

Implement local device PIN/biometric unlocking using secure storage (expo-secure-store) for sensitive keys; do not integrate cloud auth for MVP. Future sync or multi-device features can add optional cloud auth, but only after secure sync design.

Consequences

- Pros: Simplifies the MVP and preserves user privacy.
- Cons: No multi-device sync for MVP; user recovery for lost devices must be handled by export/import flows.

Implementation Notes

- Provide a simple local lock screen and store minimal unlocking tokens in SecureStore.

---

## ADR-007: Starter template and project initialization

- Status: Accepted
- Date: 2025-11-13

Context

We want a reproducible starter that provides a known baseline for project structure and dependency versions.

Decision

Use `create-expo-app` (CLI pinned at 3.5.3) and the `expo-template-blank` or `expo-template-tabs` depending on navigation needs. Document which files are scaffolded by the template and which decisions are left for the architecture (for example: navigation wiring, TypeScript config).

Consequences

- Pros: Consistent project scaffolding and up-to-date template code from the Expo ecosystem.
- Cons: Template updates may introduce breaking changes; pin the template SDK in project docs where appropriate.

Implementation Notes

- Example bootstrap command in `docs/architecture.md`:

```bash
npx create-expo-app finance-tracker --template expo-template-blank --name "FinanceTracker" --npm
```

---

## How to add new ADRs

Add a new document to `docs/adr/` or append new sections to this file. Each ADR should include Date, Status (Proposed / Accepted / Deprecated), Context, Decision, Consequences, Alternatives, and Implementation Notes.

---

Generated on 2025-11-13
