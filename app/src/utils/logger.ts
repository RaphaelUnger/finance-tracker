// Lightweight logger utility to avoid noisy console statements in production.
// Uses React Native's __DEV__ when available, otherwise NODE_ENV check.
const isDev = (typeof __DEV__ !== 'undefined' && __DEV__) || process.env.NODE_ENV !== 'production';

export function debug(...args: any[]) {
    if (isDev) {
        // eslint-disable-next-line no-console
        console.debug('[debug]', ...args);
    }
}

export function info(...args: any[]) {
    if (isDev) {
        // eslint-disable-next-line no-console
        console.info('[info]', ...args);
    }
}

export function warn(...args: any[]) {
    // Keep warnings visible in non-dev builds too, but prefix them for clarity.
    // eslint-disable-next-line no-console
    console.warn('[warn]', ...args);
}

export function error(...args: any[]) {
    // eslint-disable-next-line no-console
    console.error('[error]', ...args);
}

export default { debug, info, warn, error };
