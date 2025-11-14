Finance Tracker (mobile prototype)

This is a small Expo + React Native TypeScript prototype implementing Iteration 2 UI: transaction list, add/edit form, and delete.

Quick start

1. Install Expo CLI if you don't have it:

   npm install -g expo-cli

2. From this folder:

   cd mobile
   npm install
   npx expo start

Notes

- This prototype uses AsyncStorage as a local client-side store to emulate the same models used by the backend service.
- It's intended as a quick mobile front-end to demonstrate the UI flows; you can later replace the storage layer to call the Node.js service or a native SQLite store.

On-device storage

- The mobile app prefers an on-device SQLite store via `expo-sqlite`. If `expo-sqlite` is available the app will use it; otherwise it falls back to `@react-native-async-storage/async-storage`.

Recommended dependencies to install in `mobile/`:

```bash
npm install expo-sqlite @react-native-async-storage/async-storage uuid
```

Then run the project with `npx expo start` as above.
