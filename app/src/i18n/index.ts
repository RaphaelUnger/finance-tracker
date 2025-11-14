import en from './en.json';
import es from './es.json';

const LOCALES: Record<string, Record<string, string>> = { en, es };
let current = 'en';

export function setLocale(l: string) { if (LOCALES[l]) current = l; }
export function getLocale() { return current; }
export function t(key: string): string { return LOCALES[current][key] || LOCALES['en'][key] || key; }

export default { setLocale, getLocale, t };
