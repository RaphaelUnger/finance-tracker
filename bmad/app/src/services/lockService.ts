import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuth from 'expo-local-authentication';
import CryptoJS from 'crypto-js';

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEYS = {
    PIN: 'ft_lock_pin_v1',
    BIOMETRIC_ENABLED: 'ft_biometric_enabled_v1',
} as const;

/** Default PBKDF2 iterations for PIN hashing */
const DEFAULT_ITERATIONS = 20000;

/** Key size in bits for PBKDF2 */
const KEY_SIZE_BITS = 256;

// ============================================================================
// Secure Storage Helpers
// ============================================================================

/**
 * Store a value securely, falling back to AsyncStorage if SecureStore fails
 */
async function secureSet(key: string, value: string): Promise<void> {
    try {
        await SecureStore.setItemAsync(key, value);
    } catch {
        // Fallback to AsyncStorage (less secure but functional)
        await AsyncStorage.setItem(key, value);
    }
}

/**
 * Retrieve a value from secure storage, with AsyncStorage fallback
 */
async function secureGet(key: string): Promise<string | null> {
    try {
        const v = await SecureStore.getItemAsync(key);
        if (v !== null) return v;
    } catch {
        // Ignore SecureStore errors, try AsyncStorage
    }
    return AsyncStorage.getItem(key);
}

/**
 * Remove a value from both SecureStore and AsyncStorage
 */
async function secureRemove(key: string): Promise<void> {
    try {
        await SecureStore.deleteItemAsync(key);
    } catch {
        // Ignore
    }
    try {
        await AsyncStorage.removeItem(key);
    } catch {
        // Ignore
    }
}

// ============================================================================
// PIN Management
// ============================================================================

interface PinEnvelope {
    salt: string;
    iterations: number;
    hash: string;
}

/**
 * Hash a PIN using PBKDF2 with the given salt and iterations
 */
function hashPin(pin: string, salt: string, iterations: number): string {
    const key = CryptoJS.PBKDF2(pin, CryptoJS.enc.Hex.parse(salt), {
        keySize: KEY_SIZE_BITS / 32,
        iterations
    });
    return key.toString(CryptoJS.enc.Hex);
}

/**
 * Set a new PIN (replaces any existing PIN)
 */
export async function setPin(pin: string, iterations: number = DEFAULT_ITERATIONS): Promise<void> {
    const salt = CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex);
    const hash = hashPin(pin, salt, iterations);
    const envelope: PinEnvelope = { salt, iterations, hash };
    await secureSet(STORAGE_KEYS.PIN, JSON.stringify(envelope));
}

/**
 * Remove the stored PIN
 */
export async function clearPin(): Promise<void> {
    await secureRemove(STORAGE_KEYS.PIN);
}

/**
 * Get the raw stored PIN envelope (for internal use)
 */
export async function getPin(): Promise<string | null> {
    return secureGet(STORAGE_KEYS.PIN);
}

/**
 * Verify if the provided PIN matches the stored PIN
 */
export async function checkPin(pin: string): Promise<boolean> {
    const stored = await getPin();
    if (!stored) return false;

    try {
        const env: PinEnvelope = JSON.parse(stored);
        const iterations = env.iterations || DEFAULT_ITERATIONS;
        const computedHash = hashPin(pin, env.salt, iterations);
        return computedHash === env.hash;
    } catch {
        return false;
    }
}

/**
 * Check if a PIN has been set
 */
export async function hasPin(): Promise<boolean> {
    const p = await getPin();
    return !!p;
}

// ============================================================================
// Biometric Authentication
// ============================================================================

/**
 * Check if biometric authentication is available on this device
 */
export async function isBiometricAvailable(): Promise<boolean> {
    try {
        const hasHardware = await LocalAuth.hasHardwareAsync();
        const isEnrolled = await LocalAuth.isEnrolledAsync();
        return !!hasHardware && !!isEnrolled;
    } catch {
        return false;
    }
}

/**
 * Enable or disable biometric authentication
 */
export async function enableBiometric(enabled: boolean): Promise<void> {
    await secureSet(STORAGE_KEYS.BIOMETRIC_ENABLED, enabled ? '1' : '0');
}

/**
 * Check if biometric authentication is enabled by the user
 */
export async function isBiometricEnabled(): Promise<boolean> {
    try {
        const v = await secureGet(STORAGE_KEYS.BIOMETRIC_ENABLED);
        return v === '1';
    } catch {
        return false;
    }
}

/**
 * Prompt the user for biometric authentication
 */
export async function authenticateBiometric(): Promise<boolean> {
    try {
        const res = await LocalAuth.authenticateAsync({
            promptMessage: 'Unlock Finance Tracker',
            cancelLabel: 'Cancel'
        });
        return !!res.success;
    } catch {
        return false;
    }
}

// ============================================================================
// Default Export
// ============================================================================

export default {
    setPin,
    clearPin,
    getPin,
    checkPin,
    hasPin,
    isBiometricAvailable,
    enableBiometric,
    isBiometricEnabled,
    authenticateBiometric
};
