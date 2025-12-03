import { securityService, SecurityConfig, AuthenticationResult } from '../../src/services/securityService';
import { cryptoService } from '../../src/services/cryptoService';

// Mock dependencies
jest.mock('../../src/services/cryptoService');
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('react-native', () => ({
  AppState: {
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
}));

describe('SecurityService', () => {
  const mockCryptoService = cryptoService as jest.Mocked<typeof cryptoService>;
  const AsyncStorage = require('@react-native-async-storage/async-storage');

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('PIN Setup and Authentication', () => {
    it('should setup PIN successfully', async () => {
      const pin = '1234';
      const mockDbKey = 'mock-database-key';

      mockCryptoService.storePINSecurely.mockResolvedValueOnce();
      mockCryptoService.generateDatabaseKey.mockReturnValueOnce(mockDbKey);
      mockCryptoService.storeDatabaseKeySecurely.mockResolvedValueOnce();
      AsyncStorage.setItem.mockResolvedValue(undefined);

      await expect(securityService.setupPIN(pin)).resolves.not.toThrow();

      expect(mockCryptoService.storePINSecurely).toHaveBeenCalledWith(pin);
      expect(mockCryptoService.generateDatabaseKey).toHaveBeenCalled();
      expect(mockCryptoService.storeDatabaseKeySecurely).toHaveBeenCalledWith(mockDbKey);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('setup_completed', 'true');
    });

    it('should reject invalid PIN format', async () => {
      const invalidPin = '12'; // Too short

      await expect(securityService.setupPIN(invalidPin))
        .rejects
        .toThrow('Invalid PIN format');
    });

    it('should authenticate with correct PIN', async () => {
      const pin = '1234';

      mockCryptoService.verifyStoredPIN.mockResolvedValueOnce(true);
      AsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'lockout_time') return Promise.resolve(null);
        if (key === 'failed_attempts') return Promise.resolve('0');
        return Promise.resolve(null);
      });

      const result = await securityService.authenticateWithPIN(pin);

      expect(result.success).toBe(true);
      expect(mockCryptoService.verifyStoredPIN).toHaveBeenCalledWith(pin);
    });

    it('should reject incorrect PIN', async () => {
      const pin = '9999';

      mockCryptoService.verifyStoredPIN.mockResolvedValueOnce(false);
      AsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'lockout_time') return Promise.resolve(null);
        if (key === 'failed_attempts') return Promise.resolve('0');
        if (key === 'security_config') return Promise.resolve(JSON.stringify({
          maxLoginAttempts: 5,
        }));
        return Promise.resolve(null);
      });

      const result = await securityService.authenticateWithPIN(pin);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid PIN');
      expect(result.attemptsRemaining).toBe(4);
    });

    it('should lockout after max failed attempts', async () => {
      const pin = '9999';

      mockCryptoService.verifyStoredPIN.mockResolvedValueOnce(false);
      AsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'lockout_time') return Promise.resolve(null);
        if (key === 'failed_attempts') return Promise.resolve('4'); // 4 previous attempts
        if (key === 'security_config') return Promise.resolve(JSON.stringify({
          maxLoginAttempts: 5,
          lockoutDuration: 5,
        }));
        return Promise.resolve(null);
      });

      const result = await securityService.authenticateWithPIN(pin);

      expect(result.success).toBe(false);
      expect(result.attemptsRemaining).toBe(0);
      expect(result.error).toContain('App locked for 5 minutes');
      expect(result.lockedUntil).toBeDefined();
    });

    it('should prevent authentication during lockout', async () => {
      const pin = '1234';
      const lockoutEndTime = Date.now() + (5 * 60 * 1000); // 5 minutes from now

      AsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'lockout_time') return Promise.resolve(lockoutEndTime.toString());
        return Promise.resolve(null);
      });

      const result = await securityService.authenticateWithPIN(pin);

      expect(result.success).toBe(false);
      expect(result.error).toBe('App is locked due to too many failed attempts');
      expect(result.lockedUntil).toBe(lockoutEndTime);
    });

    it('should clear lockout after expiration', async () => {
      const pin = '1234';
      const expiredLockoutTime = Date.now() - (1000); // 1 second ago

      AsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'lockout_time') return Promise.resolve(expiredLockoutTime.toString());
        if (key === 'failed_attempts') return Promise.resolve('5');
        return Promise.resolve(null);
      });

      mockCryptoService.verifyStoredPIN.mockResolvedValueOnce(true);

      const result = await securityService.authenticateWithPIN(pin);

      expect(result.success).toBe(true);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('lockout_time');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('failed_attempts');
    });
  });

  describe('Biometric Authentication', () => {
    it('should authenticate with biometric successfully', async () => {
      mockCryptoService.getBiometricConfig.mockResolvedValueOnce({
        isEnabled: true,
        isAvailable: true,
        supportedTypes: ['FaceID'],
      });
      mockCryptoService.verifyBiometric.mockResolvedValueOnce(true);

      AsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'security_config') return Promise.resolve(JSON.stringify({
          biometricEnabled: true,
        }));
        return Promise.resolve(null);
      });

      const result = await securityService.authenticateWithBiometric();

      expect(result.success).toBe(true);
    });

    it('should fail when biometric not enabled', async () => {
      AsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'security_config') return Promise.resolve(JSON.stringify({
          biometricEnabled: false,
        }));
        return Promise.resolve(null);
      });

      const result = await securityService.authenticateWithBiometric();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Biometric authentication not enabled');
    });

    it('should fail when biometric not available', async () => {
      mockCryptoService.getBiometricConfig.mockResolvedValueOnce({
        isEnabled: true,
        isAvailable: false,
        supportedTypes: [],
      });

      AsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'security_config') return Promise.resolve(JSON.stringify({
          biometricEnabled: true,
        }));
        return Promise.resolve(null);
      });

      const result = await securityService.authenticateWithBiometric();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Biometric authentication not available');
    });

    it('should enable biometric authentication', async () => {
      mockCryptoService.getBiometricConfig.mockResolvedValueOnce({
        isAvailable: true,
        isEnabled: false,
        supportedTypes: ['TouchID'],
      });
      mockCryptoService.generateSecurePassword.mockReturnValueOnce('secure-token');
      mockCryptoService.storeBiometricToken.mockResolvedValueOnce();

      AsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'security_config') return Promise.resolve(JSON.stringify({}));
        return Promise.resolve(null);
      });

      await expect(securityService.enableBiometric()).resolves.not.toThrow();

      expect(mockCryptoService.storeBiometricToken).toHaveBeenCalledWith('secure-token');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'security_config',
        expect.stringContaining('"biometricEnabled":true')
      );
    });

    it('should fail to enable biometric when not available', async () => {
      mockCryptoService.getBiometricConfig.mockResolvedValueOnce({
        isAvailable: false,
        isEnabled: false,
        supportedTypes: [],
      });

      await expect(securityService.enableBiometric())
        .rejects
        .toThrow('Biometric authentication not available on this device');
    });
  });

  describe('Session Management', () => {
    it('should track session info correctly', () => {
      const sessionInfo = securityService.getSessionInfo();

      expect(sessionInfo).toHaveProperty('isAuthenticated');
      expect(sessionInfo).toHaveProperty('authenticatedAt');
      expect(sessionInfo).toHaveProperty('lastActivity');
      expect(sessionInfo).toHaveProperty('authMethod');
    });

    it('should return false for isAuthenticated initially', () => {
      const isAuthenticated = securityService.isAuthenticated();
      expect(isAuthenticated).toBe(false);
    });

    it('should lock app and update session', () => {
      securityService.lockApp();

      const sessionInfo = securityService.getSessionInfo();
      expect(sessionInfo.isAuthenticated).toBe(false);
      expect(sessionInfo.authMethod).toBe('none');
    });
  });

  describe('Security Configuration', () => {
    it('should return default config when none stored', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null);

      const config = await securityService.getSecurityConfig();

      expect(config).toHaveProperty('pinLength');
      expect(config).toHaveProperty('maxLoginAttempts');
      expect(config).toHaveProperty('lockoutDuration');
      expect(config).toHaveProperty('autoLockTimeout');
      expect(config.pinLength).toBe(4);
      expect(config.maxLoginAttempts).toBe(5);
    });

    it('should merge stored config with defaults', async () => {
      const storedConfig = {
        pinLength: 6,
        maxLoginAttempts: 3,
      };
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(storedConfig));

      const config = await securityService.getSecurityConfig();

      expect(config.pinLength).toBe(6);
      expect(config.maxLoginAttempts).toBe(3);
      expect(config.lockoutDuration).toBe(5); // Default value
    });

    it('should update security configuration', async () => {
      const updates = {
        autoLockTimeout: 10,
        biometricEnabled: true,
      };

      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify({}));

      await securityService.updateSecurityConfig(updates);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'security_config',
        expect.stringContaining('"autoLockTimeout":10')
      );
    });
  });

  describe('Setup Status', () => {
    it('should return true when setup is completed', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce('true');

      const isCompleted = await securityService.isSetupCompleted();

      expect(isCompleted).toBe(true);
    });

    it('should return false when setup is not completed', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null);

      const isCompleted = await securityService.isSetupCompleted();

      expect(isCompleted).toBe(false);
    });
  });

  describe('PIN Change', () => {
    it('should change PIN successfully', async () => {
      const currentPIN = '1234';
      const newPIN = '5678';

      // Mock successful current PIN verification
      mockCryptoService.verifyStoredPIN.mockResolvedValueOnce(true);
      mockCryptoService.storePINSecurely.mockResolvedValueOnce();

      AsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'lockout_time') return Promise.resolve(null);
        if (key === 'failed_attempts') return Promise.resolve('0');
        return Promise.resolve(null);
      });

      await expect(securityService.changePIN(currentPIN, newPIN)).resolves.not.toThrow();

      expect(mockCryptoService.storePINSecurely).toHaveBeenCalledWith(newPIN);
    });

    it('should fail with incorrect current PIN', async () => {
      const currentPIN = '9999';
      const newPIN = '5678';

      // Mock failed current PIN verification
      mockCryptoService.verifyStoredPIN.mockResolvedValueOnce(false);
      AsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'lockout_time') return Promise.resolve(null);
        if (key === 'failed_attempts') return Promise.resolve('0');
        return Promise.resolve(null);
      });

      await expect(securityService.changePIN(currentPIN, newPIN))
        .rejects
        .toThrow('Current PIN is incorrect');
    });

    it('should fail with invalid new PIN', async () => {
      const currentPIN = '1234';
      const invalidNewPIN = '12'; // Too short

      await expect(securityService.changePIN(currentPIN, invalidNewPIN))
        .rejects
        .toThrow('Invalid new PIN format');
    });
  });

  describe('Data Reset', () => {
    it('should reset all security data', async () => {
      mockCryptoService.clearAllSecureData.mockResolvedValueOnce();

      await expect(securityService.resetAllSecurityData()).resolves.not.toThrow();

      expect(mockCryptoService.clearAllSecureData).toHaveBeenCalled();
      expect(AsyncStorage.removeItem).toHaveBeenCalledTimes(5); // All storage keys
    });
  });

  describe('Auto-lock Functionality', () => {
    it('should start auto-lock timer', async () => {
      const config: SecurityConfig = {
        pinLength: 4,
        maxLoginAttempts: 5,
        lockoutDuration: 5,
        autoLockTimeout: 1, // 1 minute
        biometricEnabled: false,
        requirePINForBiometric: false,
      };

      AsyncStorage.getItem.mockImplementation((key) => {
        if (key === 'security_config') return Promise.resolve(JSON.stringify(config));
        return Promise.resolve(null);
      });

      // Simulate app going to background
      const instance = securityService as any;
      await instance.handleAppBackgrounded();

      // Fast-forward time
      jest.advanceTimersByTime(60 * 1000); // 1 minute

      // Session should be locked
      const sessionInfo = securityService.getSessionInfo();
      expect(sessionInfo.isAuthenticated).toBe(false);
    });
  });
});
