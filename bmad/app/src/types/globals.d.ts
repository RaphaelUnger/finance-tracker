/* Ambient declarations for test globals and dynamically imported native modules
   This is intentionally minimal to avoid adding dev dependencies. */

declare const describe: any;
declare const it: any;
declare const test: any;
declare const expect: any;

declare module 'expo-secure-store';
declare module 'expo-local-authentication';
declare module 'expo-file-system';
declare module 'expo-document-picker';
declare module 'expo-sharing';
declare module '@react-native-picker/picker';
