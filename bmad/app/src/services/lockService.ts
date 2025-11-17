import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuth from 'expo-local-authentication';
import CryptoJS from 'crypto-js';

const LOCK_KEY = 'ft_lock_pin_v1';
const BIOMETRIC_ENABLED_KEY = 'ft_biometric_enabled_v1';

async function secureSet(key: string, value: string): Promise<void> {
    try {
        await SecureStore.setItemAsync(key, value);
    } catch (e) {
        // fallback to AsyncStorage
        await AsyncStorage.setItem(key, value);
    }
}

async function secureGet(key: string): Promise<string | null> {
    try {
        const v = await SecureStore.getItemAsync(key);
        if (v !== null) return v;
    } catch (e) {
        // ignore
    }
    return AsyncStorage.getItem(key);
}

async function secureRemove(key: string): Promise<void> {
    try { await SecureStore.deleteItemAsync(key); } catch (e) { /* ignore */ }
    try { await AsyncStorage.removeItem(key); } catch (e) { /* ignore */ }
}

export async function setPin(pin: string, iterations: number = 20000): Promise<void> {
    // store PBKDF2(salt, iterations) result in envelope: salt:hex|iter:number|hash:hex
    const salt = CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex);
    const key = CryptoJS.PBKDF2(pin, CryptoJS.enc.Hex.parse(salt), { keySize: 256 / 32, iterations });
    const hash = key.toString(CryptoJS.enc.Hex);
    const envelope = JSON.stringify({ salt, iterations, hash });
    await secureSet(LOCK_KEY, envelope);
}

export async function clearPin(): Promise<void> {
    await secureRemove(LOCK_KEY);
}

export async function getPin(): Promise<string | null> {
    return secureGet(LOCK_KEY);
}

export async function checkPin(pin: string): Promise<boolean> {
    const stored = await getPin();
    if (!stored) return false;
    try {
        const env = JSON.parse(stored);
        const salt = env.salt;
        const iterations = env.iterations || 20000;
        const expectedHash = env.hash;
        const key = CryptoJS.PBKDF2(pin, CryptoJS.enc.Hex.parse(salt), { keySize: 256 / 32, iterations });
        const hash = key.toString(CryptoJS.enc.Hex);
        return hash === expectedHash;
    } catch (e) {
        return false;
    }
}

export async function hasPin(): Promise<boolean> {
    const p = await getPin();
    return !!p;
}

export async function isBiometricAvailable(): Promise<boolean> {
    try {
        const available = await LocalAuth.hasHardwareAsync();
        const enrolled = await LocalAuth.isEnrolledAsync();
        return !!available && !!enrolled;
    } catch (e) { return false; }
}

export async function enableBiometric(enabled: boolean): Promise<void> {
    await secureSet(BIOMETRIC_ENABLED_KEY, enabled ? '1' : '0');
}

export async function isBiometricEnabled(): Promise<boolean> {
    try {
        const v = await secureGet(BIOMETRIC_ENABLED_KEY);
        return v === '1';
    } catch (e) { return false; }
}

export async function authenticateBiometric(): Promise<boolean> {
    try {
        const res = await LocalAuth.authenticateAsync({ promptMessage: 'Unlock Finance Tracker', cancelLabel: 'Cancel' });
        return !!res.success;
    } catch (e) { return false; }
}

export default { setPin, clearPin, getPin, checkPin, hasPin };
