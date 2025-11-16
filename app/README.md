Finance Tracker (mobile prototype)

This is a small Expo + React Native TypeScript prototype implementing Iteration 2 UI: transaction list, add/edit form, and delete.

Quick start

1. Install Expo CLI if you don't have it:

   npm install -g expo-cli

2. From this folder:

   ```markdown
   # Finance Tracker — Mobile (app)

   This folder contains an Expo + React Native TypeScript prototype for the Finance Tracker mobile app.

   The instructions below help you install dependencies, run the app locally (Expo), run tests and perform a quick typecheck.

   ## Prerequisites

   - Node.js (LTS, e.g. 18.x or 20.x)
   - npm (bundled with Node) or yarn
   - Optional but useful: Expo CLI (you can also use `npx expo`)

   Install Expo CLI globally (optional):

   ```bash
   npm install -g expo-cli
   ```

   ## Install dependencies

   From this folder (`app/`) run:

   ```bash
   cd app
   npm install
   ```

   If you prefer clean installs in CI/dev, use:

   ```bash
   npm ci
   ```

   ## Run the app (development)

   - Start the Expo dev server:

   ```bash
   npm start
   # or equivalently
   npx expo start
   ```

   - Open on Android emulator / device:

   ```bash
   npm run android
   ```

   - Open on iOS simulator / device (macOS only):

   ```bash
   npm run ios
   ```

   - Open for web:

   ```bash
   npm run web
   ```

   When the Expo dev server opens, scan the QR code with the Expo Go app (Android/iOS) or open the simulator from the Expo UI.

   ## Running tests

   This project uses Jest. Run the test suite with:

   ```bash
   npm test
   ```

   You can run tests in-band (useful in CI or when debugging):

   ```bash
   npm test -- --runInBand
   ```

   ## Typecheck

   Run the TypeScript compiler in "check only" mode:

   ```bash
   npx tsc --noEmit
   ```

   This validates typing without emitting build artifacts. If you see missing-module or type errors (for example for optional libs like `tesseract.js`), the repository includes a small local declaration under `src/types/` to reduce friction. If you add new native modules, install their types or add a declaration file.

   ## Common tips / troubleshooting

   - If the Metro bundler or Expo fails to start, try clearing cache:

   ```bash
   npx expo start -c
   ```

   - If a native dependency requires a prebuild / native build (e.g. SQLCipher via `expo-sqlite`), follow Expo prebuild/EAS build instructions. Those flows are outside the scope of the local dev server (Expo Go) and require a native rebuild.

   - If you see TypeScript errors from third-party libs (missing types), either:
      - install the appropriate `@types/` package, or
      - add a small `declare module '...';` file under `src/types/` (this repo already contains a shim for `tesseract.js`).

   - To run the app on a physical device use the Expo Go app and scan the dev server QR code. For native builds (store distribution with native plugins), use EAS Build.

   ## Notes for contributors

   - The app is structured feature-first under `src/` (screens, services, i18n, utils). The decision and iterative plans are in the repository `docs/` folder if you need product or architecture context.
   - Be conservative with console logging in services — the project prefers a small logger util (`src/utils/logger.ts`) which gates dev logs.

   ## Next steps you can take

   - Add a `typecheck` script to `package.json`:

   ```json
   "scripts": {
      "typecheck": "tsc --noEmit"
   }
   ```

   - Add `lint`/ESLint if you want automated linting in CI.

   ---

   Enjoy hacking on the mobile app. If you want, I can add the `typecheck` and `lint` scripts to `package.json` and a minimal ESLint configuration next.
   ```
