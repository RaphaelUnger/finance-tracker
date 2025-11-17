import { TransactionService } from './transactionService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';

const BACKUP_KEY = 'ft_backup_v1';

// Envelope format (JSON string):
// {
//   version: 1,
//   kdf: { salt: hex, iterations: number },
//   iv: hex,
//   ciphertext: base64,
//   hmac: hex // HMAC-SHA256 of ciphertext using derived key
// }

const DEFAULT_PBKDF2_ITER = 10000;

function hexToWordArray(hex: string) {
    return CryptoJS.enc.Hex.parse(hex);
}

export async function createBackup(password: string, iterations: number = DEFAULT_PBKDF2_ITER): Promise<string> {
    const svc = await TransactionService.getInstanceAsync();
    const all = await svc.list();
    const payload = JSON.stringify({ exportedAt: new Date().toISOString(), transactions: all });

    const salt = CryptoJS.lib.WordArray.random(16);
    const iv = CryptoJS.lib.WordArray.random(16);
    const key = CryptoJS.PBKDF2(password, salt, { keySize: 256 / 32, iterations });

    const encrypted = CryptoJS.AES.encrypt(payload, key, { iv });
    const ciphertext = CryptoJS.enc.Base64.stringify(encrypted.ciphertext);

    // HMAC for integrity
    const hmac = CryptoJS.HmacSHA256(ciphertext, key).toString(CryptoJS.enc.Hex);

    const envelope = {
        version: 1,
        kdf: { salt: salt.toString(CryptoJS.enc.Hex), iterations },
        iv: iv.toString(CryptoJS.enc.Hex),
        ciphertext,
        hmac
    };
    return JSON.stringify(envelope);
}

export async function saveBackupToStorage(password: string): Promise<void> {
    const encrypted = await createBackup(password);
    await AsyncStorage.setItem(BACKUP_KEY, encrypted);
}

export async function getBackupFromStorage(): Promise<string | null> {
    return AsyncStorage.getItem(BACKUP_KEY);
}

export async function restoreFromEncrypted(envelopeJson: string, password: string): Promise<{ created: number; errors: number }> {
    let envelope: any;
    try {
        envelope = JSON.parse(envelopeJson);
    } catch (e) {
        throw new Error('Invalid backup envelope');
    }
    if (!envelope || envelope.version !== 1) throw new Error('Unsupported backup version');
    const saltHex = envelope.kdf?.salt;
    const iterations = envelope.kdf?.iterations || DEFAULT_PBKDF2_ITER;
    const ivHex = envelope.iv;
    const ciphertext = envelope.ciphertext;
    const hmac = envelope.hmac;
    if (!saltHex || !ivHex || !ciphertext || !hmac) throw new Error('Invalid backup envelope');

    const salt = hexToWordArray(saltHex);
    const iv = hexToWordArray(ivHex);
    const key = CryptoJS.PBKDF2(password, salt, { keySize: 256 / 32, iterations });

    // verify HMAC
    const expectedHmac = CryptoJS.HmacSHA256(ciphertext, key).toString(CryptoJS.enc.Hex);
    if (expectedHmac !== hmac) throw new Error('Invalid password or corrupted backup (HMAC mismatch)');

    // decrypt
    try {
        const cipherParams = CryptoJS.lib.CipherParams.create({ ciphertext: CryptoJS.enc.Base64.parse(ciphertext) });
        const decrypted = CryptoJS.AES.decrypt(cipherParams, key, { iv });
        const plain = decrypted.toString(CryptoJS.enc.Utf8);
        if (!plain) throw new Error('Decryption failed');
        const parsed = JSON.parse(plain);
        const txs: any[] = parsed.transactions || [];
        const svc = await TransactionService.getInstanceAsync();
        let created = 0;
        let errors = 0;
        for (const t of txs) {
            try {
                const input: any = {
                    title: t.title || 'Restored',
                    amount: t.amount,
                    date: t.date,
                    category: t.category,
                    merchant: t.merchant,
                    notes: t.notes,
                    recurrence: t.recurrence || null,
                    generatedFrom: t.generatedFrom || null,
                    generatedAt: t.generatedAt || null,
                    createdAt: t.createdAt
                };
                await svc.create(input);
                created++;
            } catch (e) {
                errors++;
            }
        }
        return { created, errors };
    } catch (e) {
        throw new Error('Invalid password or corrupted backup');
    }
}

export default { createBackup, saveBackupToStorage, getBackupFromStorage, restoreFromEncrypted };
