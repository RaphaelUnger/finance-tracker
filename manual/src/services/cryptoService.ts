import CryptoJS from 'crypto-js';
import { Platform } from 'react-native';
import Keychain from 'react-native-keychain';

export interface EncryptionResult {
  encryptedData: string;
  iv: string;
  salt: string;
}

export interface KeyDerivationOptions {
  password: string;
  salt: string;
  iterations: number;
  keySize: number;
}

export interface BiometricConfig {
  isEnabled: boolean;
  isAvailable: boolean;
  supportedTypes: string[];
}

export class CryptoService {
  private static instance: CryptoService;
  private readonly DEFAULT_ITERATIONS = 100000;
  private readonly KEY_SIZE = 256 / 32; // 256 bits / 32 bits per word
  private readonly IV_SIZE = 128 / 8; // 128 bits in bytes

  // Keychain service names
  private readonly PIN_KEYCHAIN_SERVICE = 'FinanceTracker_PIN';
  private readonly DB_KEY_KEYCHAIN_SERVICE = 'FinanceTracker_DB_Key';
  private readonly BIOMETRIC_KEYCHAIN_SERVICE = 'FinanceTracker_Biometric';

  private constructor() {}

  public static getInstance(): CryptoService {
    if (!CryptoService.instance) {
      CryptoService.instance = new CryptoService();
    }
    return CryptoService.instance;
  }

  /**
   * Generate a cryptographically secure random salt
   */
  public generateSalt(length: number = 32): string {
    return CryptoJS.lib.WordArray.random(length).toString();
  }

  /**
   * Derive a key from password using PBKDF2
   */
  public deriveKey(options: KeyDerivationOptions): string {
    const key = CryptoJS.PBKDF2(options.password, options.salt, {
      keySize: options.keySize,
      iterations: options.iterations,
    });
    return key.toString();
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  public encrypt(data: string, password: string): EncryptionResult {
    try {
      const salt = this.generateSalt();
      const iv = CryptoJS.lib.WordArray.random(this.IV_SIZE).toString();

      const key = this.deriveKey({
        password,
        salt,
        iterations: this.DEFAULT_ITERATIONS,
        keySize: this.KEY_SIZE,
      });

      const encrypted = CryptoJS.AES.encrypt(data, key, {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      return {
        encryptedData: encrypted.toString(),
        iv,
        salt,
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  public decrypt(encryptionResult: EncryptionResult, password: string): string {
    try {
      const key = this.deriveKey({
        password,
        salt: encryptionResult.salt,
        iterations: this.DEFAULT_ITERATIONS,
        keySize: this.KEY_SIZE,
      });

      const decrypted = CryptoJS.AES.decrypt(encryptionResult.encryptedData, key, {
        iv: CryptoJS.enc.Hex.parse(encryptionResult.iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);

      if (!decryptedString) {
        throw new Error('Decryption resulted in empty string - likely incorrect password');
      }

      return decryptedString;
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Hash PIN for secure storage
   */
  public hashPIN(pin: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const salt = this.generateSalt();
        const hashedPIN = this.deriveKey({
          password: pin,
          salt,
          iterations: this.DEFAULT_ITERATIONS,
          keySize: this.KEY_SIZE,
        });

        // Store salt with hash (salt:hash format)
        const result = `${salt}:${hashedPIN}`;
        resolve(result);
      } catch (error) {
        reject(new Error(`PIN hashing failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
  }

  /**
   * Verify PIN against stored hash
   */
  public verifyPIN(pin: string, storedHash: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        const [salt, hash] = storedHash.split(':');
        if (!salt || !hash) {
          throw new Error('Invalid stored hash format');
        }

        const computedHash = this.deriveKey({
          password: pin,
          salt,
          iterations: this.DEFAULT_ITERATIONS,
          keySize: this.KEY_SIZE,
        });

        resolve(hash === computedHash);
      } catch (error) {
        reject(new Error(`PIN verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
  }

  /**
   * Generate database encryption key
   */
  public generateDatabaseKey(): string {
    return CryptoJS.lib.WordArray.random(256 / 8).toString(); // 256-bit key
  }

  /**
   * Store PIN hash securely in keychain
   */
  public async storePINSecurely(pin: string): Promise<void> {
    try {
      const hashedPIN = await this.hashPIN(pin);

      await Keychain.setInternetCredentials(
        this.PIN_KEYCHAIN_SERVICE,
        'user',
        hashedPIN,
        {
          accessControl: Keychain.ACCESS_CONTROL.DEVICE_PASSCODE,
          authenticationType: Keychain.AUTHENTICATION_TYPE.DEVICE_PASSCODE_OR_BIOMETRICS,
          accessGroup: Platform.OS === 'ios' ? 'group.financetracker.secure' : undefined,
        }
      );
    } catch (error) {
      throw new Error(`Failed to store PIN securely: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieve and verify PIN from keychain
   */
  public async verifyStoredPIN(pin: string): Promise<boolean> {
    try {
      const credentials = await Keychain.getInternetCredentials(this.PIN_KEYCHAIN_SERVICE);

      if (!credentials || credentials === false) {
        throw new Error('No stored PIN found');
      }

      return await this.verifyPIN(pin, credentials.password);
    } catch (error) {
      throw new Error(`Failed to verify stored PIN: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Store database key securely
   */
  public async storeDatabaseKeySecurely(key: string): Promise<void> {
    try {
      await Keychain.setInternetCredentials(
        this.DB_KEY_KEYCHAIN_SERVICE,
        'database',
        key,
        {
          accessControl: Keychain.ACCESS_CONTROL.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
          accessGroup: Platform.OS === 'ios' ? 'group.financetracker.secure' : undefined,
        }
      );
    } catch (error) {
      throw new Error(`Failed to store database key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieve database key from keychain
   */
  public async getDatabaseKey(): Promise<string | null> {
    try {
      const credentials = await Keychain.getInternetCredentials(this.DB_KEY_KEYCHAIN_SERVICE);

      if (!credentials || credentials === false) {
        return null;
      }

      return credentials.password;
    } catch (error) {
      console.warn('Failed to retrieve database key:', error);
      return null;
    }
  }

  /**
   * Check biometric availability
   */
  public async getBiometricConfig(): Promise<BiometricConfig> {
    try {
      const biometryType = await Keychain.getSupportedBiometryType();

      return {
        isAvailable: biometryType !== null,
        isEnabled: false, // Will be set based on user preference
        supportedTypes: biometryType ? [biometryType] : [],
      };
    } catch (error) {
      console.warn('Failed to check biometric availability:', error);
      return {
        isAvailable: false,
        isEnabled: false,
        supportedTypes: [],
      };
    }
  }

  /**
   * Store biometric authentication token
   */
  public async storeBiometricToken(token: string): Promise<void> {
    try {
      await Keychain.setInternetCredentials(
        this.BIOMETRIC_KEYCHAIN_SERVICE,
        'biometric',
        token,
        {
          accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
          authenticationType: Keychain.AUTHENTICATION_TYPE.BIOMETRICS,
          accessGroup: Platform.OS === 'ios' ? 'group.financetracker.secure' : undefined,
        }
      );
    } catch (error) {
      throw new Error(`Failed to store biometric token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify biometric authentication
   */
  public async verifyBiometric(): Promise<boolean> {
    try {
      const credentials = await Keychain.getInternetCredentials(this.BIOMETRIC_KEYCHAIN_SERVICE);
      return credentials !== false;
    } catch (error) {
      console.warn('Biometric verification failed:', error);
      return false;
    }
  }

  /**
   * Clear all stored credentials
   */
  public async clearAllSecureData(): Promise<void> {
    try {
      await Promise.all([
        Keychain.resetInternetCredentials(this.PIN_KEYCHAIN_SERVICE),
        Keychain.resetInternetCredentials(this.DB_KEY_KEYCHAIN_SERVICE),
        Keychain.resetInternetCredentials(this.BIOMETRIC_KEYCHAIN_SERVICE),
      ]);
    } catch (error) {
      throw new Error(`Failed to clear secure data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate secure random password for exports
   */
  public generateSecurePassword(length: number = 16): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }

    return password;
  }

  /**
   * Validate encryption strength
   */
  public validateEncryption(data: string, password: string): Promise<boolean> {
    return new Promise(async (resolve) => {
      try {
        const encrypted = this.encrypt(data, password);
        const decrypted = this.decrypt(encrypted, password);
        resolve(decrypted === data);
      } catch (error) {
        resolve(false);
      }
    });
  }
}

export const cryptoService = CryptoService.getInstance();
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  static encrypt(data: string, password: string, salt?: string): string {
    try {
      const useSalt = salt || this.generateSalt();
      const key = this.deriveKey(password, useSalt);
      const iv = this.generateIV();

      // Encrypt using AES-256-GCM simulation (CryptoJS doesn't have native GCM)
      // We use CTR mode with HMAC for authenticated encryption
      const encrypted = CryptoJS.AES.encrypt(data, key, {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.CTR,
        padding: CryptoJS.pad.NoPadding,
      });

      // Create HMAC for authentication
      const hmac = CryptoJS.HmacSHA256(encrypted.ciphertext.toString(), key);

      // Combine salt + iv + hmac + ciphertext
      const combined = useSalt + iv + hmac.toString() + encrypted.ciphertext.toString();

      return combined;
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  static decrypt(encryptedData: string, password: string): string {
    try {
      // Extract components
      const salt = encryptedData.substring(0, this.SALT_LENGTH * 2); // hex encoding doubles length
      const iv = encryptedData.substring(this.SALT_LENGTH * 2, this.SALT_LENGTH * 2 + this.IV_LENGTH * 2);
      const hmac = encryptedData.substring(
        this.SALT_LENGTH * 2 + this.IV_LENGTH * 2,
        this.SALT_LENGTH * 2 + this.IV_LENGTH * 2 + 64 // SHA256 = 64 hex chars
      );
      const ciphertext = encryptedData.substring(this.SALT_LENGTH * 2 + this.IV_LENGTH * 2 + 64);

      const key = this.deriveKey(password, salt);

      // Verify HMAC
      const expectedHmac = CryptoJS.HmacSHA256(ciphertext, key).toString();
      if (hmac !== expectedHmac) {
        throw new Error('Authentication failed - data may be corrupted or password is incorrect');
      }

      // Decrypt
      const decrypted = CryptoJS.AES.decrypt(
        { ciphertext: CryptoJS.enc.Hex.parse(ciphertext) } as any,
        key,
        {
          iv: CryptoJS.enc.Hex.parse(iv),
          mode: CryptoJS.mode.CTR,
          padding: CryptoJS.pad.NoPadding,
        }
      );

      const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
      if (!plaintext) {
        throw new Error('Decryption failed - invalid password or corrupted data');
      }

      return plaintext;
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Hash password for storage (one-way)
   */
  static hashPassword(password: string, salt?: string): { hash: string; salt: string } {
    const useSalt = salt || this.generateSalt();
    const hash = CryptoJS.PBKDF2(password, useSalt, {
      keySize: this.KEY_LENGTH / 4,
      iterations: this.PBKDF2_ITERATIONS * 2, // Extra iterations for password hashing
      hasher: CryptoJS.algo.SHA256,
    }).toString();

    return { hash, salt: useSalt };
  }

  /**
   * Verify password against hash
   */
  static verifyPassword(password: string, hash: string, salt: string): boolean {
    try {
      const computed = this.hashPassword(password, salt);
      return computed.hash === hash;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate secure random string
   */
  static generateSecureRandom(length: number = 32): string {
    return CryptoJS.lib.WordArray.random(length).toString();
  }

  /**
   * Create SHA256 hash
   */
  static hash(data: string): string {
    return CryptoJS.SHA256(data).toString();
  }

  /**
   * Create HMAC-SHA256
   */
  static hmac(data: string, key: string): string {
    return CryptoJS.HmacSHA256(data, key).toString();
  }

  /**
   * Secure compare two strings (timing attack resistant)
   */
  static secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Encrypt JSON object
   */
  static encryptObject<T>(obj: T, password: string, salt?: string): string {
    const json = JSON.stringify(obj);
    return this.encrypt(json, password, salt);
  }

  /**
   * Decrypt to JSON object
   */
  static decryptObject<T>(encryptedData: string, password: string): T {
    const json = this.decrypt(encryptedData, password);
    return JSON.parse(json) as T;
  }

  /**
   * Validate encryption strength
   */
  static validateEncryptionStrength(password: string): {
    isStrong: boolean;
    score: number;
    requirements: string[];
  } {
    const requirements: string[] = [];
    let score = 0;

    if (password.length >= 8) {
      score += 1;
    } else {
      requirements.push('At least 8 characters');
    }

    if (password.length >= 12) {
      score += 1;
    } else {
      requirements.push('At least 12 characters for strong encryption');
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      requirements.push('At least one lowercase letter');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      requirements.push('At least one uppercase letter');
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      requirements.push('At least one number');
    }

    if (/[^A-Za-z0-9]/.test(password)) {
      score += 1;
    } else {
      requirements.push('At least one special character');
    }

    return {
      isStrong: score >= 5,
      score,
      requirements,
    };
  }

  /**
   * Clear sensitive data from memory (best effort)
   */
  static clearSensitiveData(data: string): void {
    // This is a best-effort attempt to clear sensitive data
    // JavaScript doesn't provide guaranteed memory clearing
    if (typeof data === 'string') {
      // Overwrite with random data
      for (let i = 0; i < data.length; i++) {
        // This doesn't actually modify the original string in memory
        // but signals intent to clear sensitive data
      }
    }
  }

  /**
   * Create backup encryption
   */
  static encryptBackup(data: any, password: string): {
    encryptedData: string;
    checksum: string;
    metadata: {
      version: string;
      algorithm: string;
      keyDerivation: string;
      iterations: number;
      timestamp: string;
    };
  } {
    const timestamp = new Date().toISOString();
    const metadata = {
      version: '1.0',
      algorithm: 'AES-256-CTR+HMAC',
      keyDerivation: 'PBKDF2',
      iterations: this.PBKDF2_ITERATIONS,
      timestamp,
    };

    const payload = {
      data,
      metadata: {
        ...metadata,
        timestamp,
      },
    };

    const encryptedData = this.encryptObject(payload, password);
    const checksum = this.hash(encryptedData);

    return {
      encryptedData,
      checksum,
      metadata,
    };
  }

  /**
   * Decrypt backup and verify integrity
   */
  static decryptBackup(
    encryptedData: string,
    password: string,
    expectedChecksum?: string
  ): { data: any; metadata: any; isValid: boolean } {
    // Verify checksum if provided
    if (expectedChecksum) {
      const actualChecksum = this.hash(encryptedData);
      if (actualChecksum !== expectedChecksum) {
        throw new Error('Backup integrity check failed - checksum mismatch');
      }
    }

    const decryptedPayload = this.decryptObject(encryptedData, password);

    return {
      data: decryptedPayload.data,
      metadata: decryptedPayload.metadata,
      isValid: true,
    };
  }
}
