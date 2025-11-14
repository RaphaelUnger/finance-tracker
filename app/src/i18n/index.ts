import en from './en.json';
import de from './de.json';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCALES: Record<string, Record<string, string>> = { en, de };
let current = 'en';
const STORAGE_KEY = 'app.locale';

export function setLocale(l: string) { if (LOCALES[l]) current = l; }
export function getLocale() { return current; }
export function t(key: string): string { return LOCALES[current][key] || LOCALES['en'][key] || key; }

export function getAvailableLocales(): string[] { return Object.keys(LOCALES); }

export async function initI18n() {
    try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored && LOCALES[stored]) current = stored;
    } catch (e) { /* ignore */ }
}

export async function persistLocale(l: string) {
    try {
        await AsyncStorage.setItem(STORAGE_KEY, l);
    } catch (e) { /* ignore */ }
}

export default { setLocale, getLocale, t, getAvailableLocales, initI18n, persistLocale };
