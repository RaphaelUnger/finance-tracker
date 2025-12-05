import { TransactionService, Transaction } from './transactionService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';

// ============================================================================
// Types
// ============================================================================

/** Backup envelope structure for encrypted storage */
interface BackupEnvelope {
    version: number;
    kdf: {
        salt: string;
        iterations: number;
    };
    iv: string;
    ciphertext: string;
    hmac: string;
}

/** Backup payload containing exported data */
interface BackupPayload {
    exportedAt: string;
    transactions: Transaction[];
}

/** Result of a restore operation */
export interface RestoreResult {
    created: number;
    errors: number;
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'ft_backup_v1';
const BACKUP_VERSION = 1;
const DEFAULT_PBKDF2_ITERATIONS = 10000;
const KEY_SIZE_BITS = 256;

// ============================================================================
// Crypto Helpers
// ============================================================================

// Note: Using 'any' for CryptoJS WordArray as the library doesn't export proper types
type WordArray = ReturnType<typeof CryptoJS.lib.WordArray.random>;

/**
 * Convert hex string to CryptoJS WordArray
 */
function hexToWordArray(hex: string): WordArray {
    return CryptoJS.enc.Hex.parse(hex);
}

/**
 * Derive an encryption key using PBKDF2
 */
function deriveKey(password: string, salt: WordArray, iterations: number): WordArray {
    return CryptoJS.PBKDF2(password, salt, {
        keySize: KEY_SIZE_BITS / 32,
        iterations
    });
}

/**
 * Encrypt data with AES and return the ciphertext as base64
 */
function encryptData(plaintext: string, key: WordArray, iv: WordArray): string {
    const encrypted = CryptoJS.AES.encrypt(plaintext, key, { iv });
    return CryptoJS.enc.Base64.stringify(encrypted.ciphertext);
}

/**
 * Decrypt AES ciphertext
 */
function decryptData(ciphertext: string, key: WordArray, iv: WordArray): string {
    const cipherParams = CryptoJS.lib.CipherParams.create({
        ciphertext: CryptoJS.enc.Base64.parse(ciphertext)
    });
    const decrypted = CryptoJS.AES.decrypt(cipherParams, key, { iv });
    return decrypted.toString(CryptoJS.enc.Utf8);
}

/**
 * Compute HMAC-SHA256 for integrity verification
 */
function computeHmac(data: string, key: WordArray): string {
    return CryptoJS.HmacSHA256(data, key).toString(CryptoJS.enc.Hex);
}

// ============================================================================
// Backup Creation
// ============================================================================

/**
 * Create an encrypted backup of all transactions
 */
export async function createBackup(
    password: string,
    iterations: number = DEFAULT_PBKDF2_ITERATIONS
): Promise<string> {
    const svc = await TransactionService.getInstanceAsync();
    const all = await svc.list();

    const payload: BackupPayload = {
        exportedAt: new Date().toISOString(),
        transactions: all
    };
    const plaintext = JSON.stringify(payload);

    // Generate random salt and IV
    const salt = CryptoJS.lib.WordArray.random(16);
    const iv = CryptoJS.lib.WordArray.random(16);

    // Derive key and encrypt
    const key = deriveKey(password, salt, iterations);
    const ciphertext = encryptData(plaintext, key, iv);

    // Create HMAC for integrity
    const hmac = computeHmac(ciphertext, key);

    const envelope: BackupEnvelope = {
        version: BACKUP_VERSION,
        kdf: {
            salt: salt.toString(CryptoJS.enc.Hex),
            iterations
        },
        iv: iv.toString(CryptoJS.enc.Hex),
        ciphertext,
        hmac
    };

    return JSON.stringify(envelope);
}

/**
 * Save an encrypted backup to AsyncStorage
 */
export async function saveBackupToStorage(password: string): Promise<void> {
    const encrypted = await createBackup(password);
    await AsyncStorage.setItem(STORAGE_KEY, encrypted);
}

/**
 * Retrieve the stored backup from AsyncStorage
 */
export async function getBackupFromStorage(): Promise<string | null> {
    return AsyncStorage.getItem(STORAGE_KEY);
}

// ============================================================================
// Backup Restoration
// ============================================================================

/**
 * Parse and validate the backup envelope
 */
function parseEnvelope(envelopeJson: string): BackupEnvelope {
    let envelope: BackupEnvelope;
    try {
        envelope = JSON.parse(envelopeJson);
    } catch {
        throw new Error('Invalid backup envelope');
    }

    if (!envelope || envelope.version !== BACKUP_VERSION) {
        throw new Error('Unsupported backup version');
    }

    const { kdf, iv, ciphertext, hmac } = envelope;
    if (!kdf?.salt || !iv || !ciphertext || !hmac) {
        throw new Error('Invalid backup envelope');
    }

    return envelope;
}

/**
 * Restore transactions from an encrypted backup
 */
export async function restoreFromEncrypted(
    envelopeJson: string,
    password: string
): Promise<RestoreResult> {
    const envelope = parseEnvelope(envelopeJson);
    const { kdf, iv: ivHex, ciphertext, hmac } = envelope;
    const iterations = kdf.iterations || DEFAULT_PBKDF2_ITERATIONS;

    // Derive key
    const salt = hexToWordArray(kdf.salt);
    const iv = hexToWordArray(ivHex);
    const key = deriveKey(password, salt, iterations);

    // Verify HMAC
    const expectedHmac = computeHmac(ciphertext, key);
    if (expectedHmac !== hmac) {
        throw new Error('Invalid password or corrupted backup (HMAC mismatch)');
    }

    // Decrypt and parse
    try {
        const plain = decryptData(ciphertext, key, iv);
        if (!plain) {
            throw new Error('Decryption failed');
        }

        const parsed: BackupPayload = JSON.parse(plain);
        const transactions = parsed.transactions || [];

        // Restore transactions
        const svc = await TransactionService.getInstanceAsync();
        let created = 0;
        let errors = 0;

        for (const t of transactions) {
            try {
                await svc.create({
                    title: t.title || 'Restored',
                    amount: t.amount,
                    date: t.date,
                    category: t.category,
                    merchant: t.merchant,
                    notes: t.notes,
                    recurrence: t.recurrence || null,
                    generatedFrom: t.generatedFrom || null,
                    generatedAt: t.generatedAt || null
                });
                created++;
            } catch {
                errors++;
            }
        }

        return { created, errors };
    } catch (e) {
        if (e instanceof Error && e.message.includes('HMAC')) {
            throw e;
        }
        throw new Error('Invalid password or corrupted backup');
    }
}

// ============================================================================
// Default Export
// ============================================================================

export default {
    createBackup,
    saveBackupToStorage,
    getBackupFromStorage,
    restoreFromEncrypted
};
