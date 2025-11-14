declare module 'expo-document-picker' {
    export function getDocumentAsync(opts?: any): Promise<{ type: 'success' | 'cancel'; uri?: string }>;
    const x: any;
    export default x;
}

declare module 'expo-file-system' {
    export const EncodingType: { UTF8: string };
    export const documentDirectory: string | null;
    export function readAsStringAsync(uri: string, opts?: any): Promise<string>;
    export function writeAsStringAsync(uri: string, data: string, opts?: any): Promise<void>;
    const x: any;
    export default x;
}

declare module 'expo-sharing' {
    export function isAvailableAsync(): Promise<boolean>;
    export function shareAsync(uri: string, options?: any): Promise<void>;
    const x: any;
    export default x;
}

declare module 'expo-image-picker' {
    export const MediaTypeOptions: { Images: string, Videos: string };
    export function launchImageLibraryAsync(opts?: any): Promise<any>;
    export function launchCameraAsync(opts?: any): Promise<any>;
    export function requestCameraPermissionsAsync(): Promise<{ granted: boolean }>;
    const x: any;
    export default x;
}
