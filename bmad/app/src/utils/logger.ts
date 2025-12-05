// ============================================================================
// Logger Utility
// ============================================================================
// Lightweight logger that suppresses debug/info output in production builds.
// Uses React Native's __DEV__ when available, falls back to NODE_ENV check.

// ============================================================================
// Types
// ============================================================================

/** Log levels supported by the logger */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// ============================================================================
// Environment Detection
// ============================================================================

/**
 * Determine if we're in a development environment
 */
function isDevEnvironment(): boolean {
    // React Native exposes __DEV__ global
    if (typeof __DEV__ !== 'undefined') {
        return __DEV__;
    }
    // Fallback for Node.js environments
    return process.env.NODE_ENV !== 'production';
}

const IS_DEV = isDevEnvironment();

// ============================================================================
// Log Prefixes
// ============================================================================

const LOG_PREFIX = {
    debug: '[debug]',
    info: '[info]',
    warn: '[warn]',
    error: '[error]',
} as const;

// ============================================================================
// Logger Functions
// ============================================================================

/**
 * Log debug messages (development only)
 */
export function debug(...args: unknown[]): void {
    if (IS_DEV) {
        // eslint-disable-next-line no-console
        console.debug(LOG_PREFIX.debug, ...args);
    }
}

/**
 * Log info messages (development only)
 */
export function info(...args: unknown[]): void {
    if (IS_DEV) {
        // eslint-disable-next-line no-console
        console.info(LOG_PREFIX.info, ...args);
    }
}

/**
 * Log warning messages (always visible)
 */
export function warn(...args: unknown[]): void {
    // eslint-disable-next-line no-console
    console.warn(LOG_PREFIX.warn, ...args);
}

/**
 * Log error messages (always visible)
 */
export function error(...args: unknown[]): void {
    // eslint-disable-next-line no-console
    console.error(LOG_PREFIX.error, ...args);
}

// ============================================================================
// Default Export
// ============================================================================

export default { debug, info, warn, error };
