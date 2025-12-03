import { cryptoService, EncryptionResult } from '../../src/services/cryptoService';

// Mock react-native-keychain
jest.mock('react-native-keychain', () => ({
  setInternetCredentials: jest.fn(),
  getInternetCredentials: jest.fn(),
  resetInternetCredentials: jest.fn(),
  getSupportedBiometryType: jest.fn(),
  ACCESS_CONTROL: {
    DEVICE_PASSCODE: 'DevicePasscode',
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WhenUnlockedThisDeviceOnly',
    BIOMETRY_ANY: 'BiometryAny',
  },
  AUTHENTICATION_TYPE: {
    DEVICE_PASSCODE_OR_BIOMETRICS: 'DevicePasscodeOrBiometrics',
    BIOMETRICS: 'Biometrics',
  },
}));

// Mock crypto-js
jest.mock('crypto-js', () => ({
  lib: {
    WordArray: {
      random: jest.fn((size) => ({ toString: () => 'mock-salt-or-iv'.repeat(Math.ceil(size / 16)) })),
    },
  },
  PBKDF2: jest.fn(() => ({ toString: () => 'mock-derived-key' })),
  AES: {
    encrypt: jest.fn(() => ({ toString: () => 'mock-encrypted-data' })),
    decrypt: jest.fn(() => ({ toString: () => 'mock-decrypted-data' })),
  },
  enc: {
    Hex: { parse: jest.fn() },
    Utf8: 'Utf8',
  },
  mode: { CBC: 'CBC' },
  pad: { Pkcs7: 'Pkcs7' },
}));

describe('CryptoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Encryption and Decryption', () => {
    it('should encrypt data successfully', () => {
      const data = 'sensitive data';
      const password = 'strong-password';

      const result = cryptoService.encrypt(data, password);

      expect(result).toHaveProperty('encryptedData');
      expect(result).toHaveProperty('iv');
      expect(result).toHaveProperty('salt');
      expect(typeof result.encryptedData).toBe('string');
      expect(typeof result.iv).toBe('string');
      expect(typeof result.salt).toBe('string');
    });

    it('should decrypt data successfully', () => {
      const mockEncryptionResult: EncryptionResult = {
        encryptedData: 'mock-encrypted-data',
        iv: 'mock-iv',
        salt: 'mock-salt',
      };
      const password = 'strong-password';

      const result = cryptoService.decrypt(mockEncryptionResult, password);

      expect(result).toBe('mock-decrypted-data');
    });

    it('should throw error for invalid decryption', () => {
      const mockEncryptionResult: EncryptionResult = {
        encryptedData: 'invalid-data',
        iv: 'invalid-iv',
        salt: 'invalid-salt',
      };
      const wrongPassword = 'wrong-password';

      // Mock CryptoJS to return empty string for invalid decryption
      const CryptoJS = require('crypto-js');
      CryptoJS.AES.decrypt.mockReturnValueOnce({ toString: () => '' });

      expect(() => {
        cryptoService.decrypt(mockEncryptionResult, wrongPassword);
      }).toThrow('Decryption resulted in empty string');
    });
  });

  describe('PIN Hashing and Verification', () => {
    it('should hash PIN correctly', async () => {
      const pin = '1234';

      const hashedPin = await cryptoService.hashPIN(pin);

      expect(typeof hashedPin).toBe('string');
      expect(hashedPin).toContain(':');

      const [salt, hash] = hashedPin.split(':');
      expect(salt).toBeDefined();
      expect(hash).toBeDefined();
    });

    it('should verify PIN correctly', async () => {
      const pin = '1234';
      const hashedPin = await cryptoService.hashPIN(pin);

      const isValid = await cryptoService.verifyPIN(pin, hashedPin);

      expect(isValid).toBe(true);
    });

    it('should reject wrong PIN', async () => {
      const correctPin = '1234';
      const wrongPin = '5678';
      const hashedPin = await cryptoService.hashPIN(correctPin);

      const isValid = await cryptoService.verifyPIN(wrongPin, hashedPin);

      expect(isValid).toBe(false);
    });

    it('should reject invalid hash format', async () => {
      const pin = '1234';
      const invalidHash = 'invalid-hash-format';

      await expect(cryptoService.verifyPIN(pin, invalidHash))
        .rejects
        .toThrow('PIN verification failed');
    });
  });

  describe('Keychain Operations', () => {
    const Keychain = require('react-native-keychain');

    it('should store PIN securely', async () => {
      const pin = '1234';

      Keychain.setInternetCredentials.mockResolvedValueOnce(true);

      await expect(cryptoService.storePINSecurely(pin)).resolves.not.toThrow();

      expect(Keychain.setInternetCredentials).toHaveBeenCalledWith(
        'FinanceTracker_PIN',
        'user',
        expect.any(String),
        expect.any(Object)
      );
    });

    it('should verify stored PIN', async () => {
      const pin = '1234';
      const hashedPin = await cryptoService.hashPIN(pin);

      Keychain.getInternetCredentials.mockResolvedValueOnce({
        password: hashedPin,
        username: 'user',
      });

      const isValid = await cryptoService.verifyStoredPIN(pin);

      expect(isValid).toBe(true);
      expect(Keychain.getInternetCredentials).toHaveBeenCalledWith('FinanceTracker_PIN');
    });

    it('should throw error when no stored PIN found', async () => {
      const pin = '1234';

      Keychain.getInternetCredentials.mockResolvedValueOnce(false);

      await expect(cryptoService.verifyStoredPIN(pin))
        .rejects
        .toThrow('Failed to verify stored PIN');
    });

    it('should store and retrieve database key', async () => {
      const dbKey = 'mock-database-key';

      Keychain.setInternetCredentials.mockResolvedValueOnce(true);
      Keychain.getInternetCredentials.mockResolvedValueOnce({
        password: dbKey,
        username: 'database',
      });

      await cryptoService.storeDatabaseKeySecurely(dbKey);
      const retrievedKey = await cryptoService.getDatabaseKey();

      expect(retrievedKey).toBe(dbKey);
    });

    it('should return null when database key not found', async () => {
      Keychain.getInternetCredentials.mockResolvedValueOnce(false);

      const retrievedKey = await cryptoService.getDatabaseKey();

      expect(retrievedKey).toBeNull();
    });
  });

  describe('Biometric Configuration', () => {
    const Keychain = require('react-native-keychain');

    it('should return biometric config when available', async () => {
      Keychain.getSupportedBiometryType.mockResolvedValueOnce('FaceID');

      const config = await cryptoService.getBiometricConfig();

      expect(config.isAvailable).toBe(true);
      expect(config.supportedTypes).toEqual(['FaceID']);
    });

    it('should return unavailable when biometric not supported', async () => {
      Keychain.getSupportedBiometryType.mockResolvedValueOnce(null);

      const config = await cryptoService.getBiometricConfig();

      expect(config.isAvailable).toBe(false);
      expect(config.supportedTypes).toEqual([]);
    });

    it('should store biometric token', async () => {
      const token = 'biometric-token';

      Keychain.setInternetCredentials.mockResolvedValueOnce(true);

      await expect(cryptoService.storeBiometricToken(token)).resolves.not.toThrow();

      expect(Keychain.setInternetCredentials).toHaveBeenCalledWith(
        'FinanceTracker_Biometric',
        'biometric',
        token,
        expect.any(Object)
      );
    });

    it('should verify biometric authentication', async () => {
      Keychain.getInternetCredentials.mockResolvedValueOnce({
        password: 'token',
        username: 'biometric',
      });

      const isValid = await cryptoService.verifyBiometric();

      expect(isValid).toBe(true);
    });

    it('should fail biometric verification when not stored', async () => {
      Keychain.getInternetCredentials.mockResolvedValueOnce(false);

      const isValid = await cryptoService.verifyBiometric();

      expect(isValid).toBe(false);
    });
  });

  describe('Utility Functions', () => {
    it('should generate secure password', () => {
      const password = cryptoService.generateSecurePassword(16);

      expect(password).toHaveLength(16);
      expect(typeof password).toBe('string');
      // Should contain mix of characters
      expect(/[A-Z]/.test(password) || /[a-z]/.test(password) || /\d/.test(password)).toBe(true);
    });

    it('should generate database key', () => {
      const key = cryptoService.generateDatabaseKey();

      expect(typeof key).toBe('string');
      expect(key.length).toBeGreaterThan(0);
    });

    it('should validate encryption successfully', async () => {
      const data = 'test data';
      const password = 'test-password';

      const isValid = await cryptoService.validateEncryption(data, password);

      expect(isValid).toBe(true);
    });

    it('should clear all secure data', async () => {
      Keychain.resetInternetCredentials.mockResolvedValue(true);

      await expect(cryptoService.clearAllSecureData()).resolves.not.toThrow();

      expect(Keychain.resetInternetCredentials).toHaveBeenCalledTimes(3);
    });
  });

  describe('Key Derivation', () => {
    it('should derive key with correct parameters', () => {
      const options = {
        password: 'test-password',
        salt: 'test-salt',
        iterations: 100000,
        keySize: 8,
      };

      const derivedKey = cryptoService.deriveKey(options);

      expect(typeof derivedKey).toBe('string');
      expect(derivedKey).toBe('mock-derived-key');
    });

    it('should generate salt with correct length', () => {
      const salt = cryptoService.generateSalt(32);

      expect(typeof salt).toBe('string');
      expect(salt.length).toBeGreaterThan(0);
    });
  });
});
