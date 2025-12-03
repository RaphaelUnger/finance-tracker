import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import { cryptoService, BiometricConfig } from './cryptoService';

export interface SecurityConfig {
  pinLength: number;
  maxLoginAttempts: number;
  lockoutDuration: number; // in minutes
  autoLockTimeout: number; // in minutes
  biometricEnabled: boolean;
  requirePINForBiometric: boolean;
}

export interface AuthenticationResult {
  success: boolean;
  error?: string;
  attemptsRemaining?: number;
  lockedUntil?: number;
}

export interface SessionInfo {
  isAuthenticated: boolean;
  authenticatedAt: number;
  lastActivity: number;
  authMethod: 'pin' | 'biometric' | 'none';
}

export class SecurityService {
  private static instance: SecurityService;
  private appStateListener: any = null;
  private autoLockTimer: NodeJS.Timeout | null = null;
  private sessionInfo: SessionInfo = {
    isAuthenticated: false,
    authenticatedAt: 0,
    lastActivity: 0,
    authMethod: 'none',
  };

  private readonly STORAGE_KEYS = {
    SECURITY_CONFIG: 'security_config',
    FAILED_ATTEMPTS: 'failed_attempts',
    LOCKOUT_TIME: 'lockout_time',
    SETUP_COMPLETED: 'setup_completed',
    LAST_ACTIVITY: 'last_activity',
  };

  private readonly DEFAULT_CONFIG: SecurityConfig = {
    pinLength: 4,
    maxLoginAttempts: 5,
    lockoutDuration: 5, // 5 minutes
    autoLockTimeout: 5, // 5 minutes
    biometricEnabled: false,
    requirePINForBiometric: false,
  };

  private constructor() {
    this.initializeAppStateListener();
  }

  public static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  /**
   * Initialize app state listener for auto-lock
   */
  private initializeAppStateListener(): void {
    this.appStateListener = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        this.handleAppBackgrounded();
      } else if (nextAppState === 'active') {
        this.handleAppForegrounded();
      }
    });
  }

  /**
   * Handle app going to background
   */
  private async handleAppBackgrounded(): Promise<void> {
    await this.updateLastActivity();
    this.startAutoLockTimer();
  }

  /**
   * Handle app coming to foreground
   */
  private async handleAppForegrounded(): Promise<void> {
    this.clearAutoLockTimer();
    await this.checkAutoLock();
  }

  /**
   * Start auto-lock timer
   */
  private async startAutoLockTimer(): Promise<void> {
    this.clearAutoLockTimer();

    const config = await this.getSecurityConfig();
    const timeout = config.autoLockTimeout * 60 * 1000; // Convert to milliseconds

    this.autoLockTimer = setTimeout(() => {
      this.lockApp();
    }, timeout);
  }

  /**
   * Clear auto-lock timer
   */
  private clearAutoLockTimer(): void {
    if (this.autoLockTimer) {
      clearTimeout(this.autoLockTimer);
      this.autoLockTimer = null;
    }
  }

  /**
   * Check if app should be auto-locked
   */
  private async checkAutoLock(): Promise<void> {
    if (!this.sessionInfo.isAuthenticated) {
      return;
    }

    const config = await this.getSecurityConfig();
    const lastActivity = await this.getLastActivity();
    const now = Date.now();
    const timeDiff = (now - lastActivity) / (1000 * 60); // Convert to minutes

    if (timeDiff >= config.autoLockTimeout) {
      this.lockApp();
    }
  }

  /**
   * Lock the app
   */
  public lockApp(): void {
    this.sessionInfo = {
      isAuthenticated: false,
      authenticatedAt: 0,
      lastActivity: 0,
      authMethod: 'none',
    };
    this.clearAutoLockTimer();
  }

  /**
   * Setup initial PIN
   */
  public async setupPIN(pin: string): Promise<void> {
    if (!this.isValidPIN(pin)) {
      throw new Error('Invalid PIN format');
    }

    try {
      await cryptoService.storePINSecurely(pin);

      // Generate and store database key
      const dbKey = cryptoService.generateDatabaseKey();
      await cryptoService.storeDatabaseKeySecurely(dbKey);

      await AsyncStorage.setItem(this.STORAGE_KEYS.SETUP_COMPLETED, 'true');

      // Reset any failed attempts
      await this.clearFailedAttempts();

    } catch (error) {
      throw new Error(`PIN setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Authenticate with PIN
   */
  public async authenticateWithPIN(pin: string): Promise<AuthenticationResult> {
    try {
      // Check if locked out
      const lockoutCheck = await this.checkLockout();
      if (!lockoutCheck.success) {
        return lockoutCheck;
      }

      const isValid = await cryptoService.verifyStoredPIN(pin);

      if (isValid) {
        await this.handleSuccessfulAuthentication('pin');
        await this.clearFailedAttempts();
        return { success: true };
      } else {
        return await this.handleFailedAuthentication();
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      };
    }
  }

  /**
   * Authenticate with biometric
   */
  public async authenticateWithBiometric(): Promise<AuthenticationResult> {
    try {
      const config = await this.getSecurityConfig();

      if (!config.biometricEnabled) {
        return {
          success: false,
          error: 'Biometric authentication not enabled',
        };
      }

      const biometricConfig = await cryptoService.getBiometricConfig();
      if (!biometricConfig.isAvailable) {
        return {
          success: false,
          error: 'Biometric authentication not available',
        };
      }

      const isValid = await cryptoService.verifyBiometric();

      if (isValid) {
        await this.handleSuccessfulAuthentication('biometric');
        return { success: true };
      } else {
        return {
          success: false,
          error: 'Biometric authentication failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Biometric authentication failed',
      };
    }
  }

  /**
   * Enable biometric authentication
   */
  public async enableBiometric(): Promise<void> {
    const biometricConfig = await cryptoService.getBiometricConfig();

    if (!biometricConfig.isAvailable) {
      throw new Error('Biometric authentication not available on this device');
    }

    try {
      // Generate and store biometric token
      const token = cryptoService.generateSecurePassword(32);
      await cryptoService.storeBiometricToken(token);

      // Update security config
      const config = await this.getSecurityConfig();
      config.biometricEnabled = true;
      await this.updateSecurityConfig(config);

    } catch (error) {
      throw new Error(`Failed to enable biometric authentication: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Disable biometric authentication
   */
  public async disableBiometric(): Promise<void> {
    try {
      const config = await this.getSecurityConfig();
      config.biometricEnabled = false;
      await this.updateSecurityConfig(config);
    } catch (error) {
      throw new Error(`Failed to disable biometric authentication: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Handle successful authentication
   */
  private async handleSuccessfulAuthentication(method: 'pin' | 'biometric'): Promise<void> {
    const now = Date.now();
    this.sessionInfo = {
      isAuthenticated: true,
      authenticatedAt: now,
      lastActivity: now,
      authMethod: method,
    };

    await this.updateLastActivity();
    await this.startAutoLockTimer();
  }

  /**
   * Handle failed authentication
   */
  private async handleFailedAuthentication(): Promise<AuthenticationResult> {
    const config = await this.getSecurityConfig();
    const failedAttempts = await this.getFailedAttempts();
    const newFailedAttempts = failedAttempts + 1;

    await AsyncStorage.setItem(this.STORAGE_KEYS.FAILED_ATTEMPTS, newFailedAttempts.toString());

    const attemptsRemaining = config.maxLoginAttempts - newFailedAttempts;

    if (newFailedAttempts >= config.maxLoginAttempts) {
      const lockoutTime = Date.now() + (config.lockoutDuration * 60 * 1000);
      await AsyncStorage.setItem(this.STORAGE_KEYS.LOCKOUT_TIME, lockoutTime.toString());

      return {
        success: false,
        error: `Too many failed attempts. App locked for ${config.lockoutDuration} minutes.`,
        attemptsRemaining: 0,
        lockedUntil: lockoutTime,
      };
    }

    return {
      success: false,
      error: 'Invalid PIN',
      attemptsRemaining,
    };
  }

  /**
   * Check lockout status
   */
  private async checkLockout(): Promise<AuthenticationResult> {
    const lockoutTime = await AsyncStorage.getItem(this.STORAGE_KEYS.LOCKOUT_TIME);

    if (lockoutTime) {
      const lockoutEndTime = parseInt(lockoutTime, 10);
      const now = Date.now();

      if (now < lockoutEndTime) {
        return {
          success: false,
          error: 'App is locked due to too many failed attempts',
          lockedUntil: lockoutEndTime,
        };
      } else {
        // Lockout period has ended
        await this.clearFailedAttempts();
        await AsyncStorage.removeItem(this.STORAGE_KEYS.LOCKOUT_TIME);
      }
    }

    return { success: true };
  }

  /**
   * Get failed attempts count
   */
  private async getFailedAttempts(): Promise<number> {
    const attempts = await AsyncStorage.getItem(this.STORAGE_KEYS.FAILED_ATTEMPTS);
    return attempts ? parseInt(attempts, 10) : 0;
  }

  /**
   * Clear failed attempts
   */
  private async clearFailedAttempts(): Promise<void> {
    await AsyncStorage.removeItem(this.STORAGE_KEYS.FAILED_ATTEMPTS);
  }

  /**
   * Update last activity timestamp
   */
  private async updateLastActivity(): Promise<void> {
    const now = Date.now();
    this.sessionInfo.lastActivity = now;
    await AsyncStorage.setItem(this.STORAGE_KEYS.LAST_ACTIVITY, now.toString());
  }

  /**
   * Get last activity timestamp
   */
  private async getLastActivity(): Promise<number> {
    const lastActivity = await AsyncStorage.getItem(this.STORAGE_KEYS.LAST_ACTIVITY);
    return lastActivity ? parseInt(lastActivity, 10) : 0;
  }

  /**
   * Get security configuration
   */
  public async getSecurityConfig(): Promise<SecurityConfig> {
    try {
      const configStr = await AsyncStorage.getItem(this.STORAGE_KEYS.SECURITY_CONFIG);
      if (configStr) {
        return { ...this.DEFAULT_CONFIG, ...JSON.parse(configStr) };
      }
    } catch (error) {
      console.warn('Failed to load security config:', error);
    }

    return this.DEFAULT_CONFIG;
  }

  /**
   * Update security configuration
   */
  public async updateSecurityConfig(config: Partial<SecurityConfig>): Promise<void> {
    try {
      const currentConfig = await this.getSecurityConfig();
      const newConfig = { ...currentConfig, ...config };
      await AsyncStorage.setItem(this.STORAGE_KEYS.SECURITY_CONFIG, JSON.stringify(newConfig));
    } catch (error) {
      throw new Error(`Failed to update security config: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if setup is completed
   */
  public async isSetupCompleted(): Promise<boolean> {
    try {
      const setup = await AsyncStorage.getItem(this.STORAGE_KEYS.SETUP_COMPLETED);
      return setup === 'true';
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current session info
   */
  public getSessionInfo(): SessionInfo {
    return { ...this.sessionInfo };
  }

  /**
   * Check if currently authenticated
   */
  public isAuthenticated(): boolean {
    return this.sessionInfo.isAuthenticated;
  }

  /**
   * Get biometric configuration
   */
  public async getBiometricConfig(): Promise<BiometricConfig> {
    return await cryptoService.getBiometricConfig();
  }

  /**
   * Validate PIN format
   */
  private isValidPIN(pin: string): boolean {
    const config = this.DEFAULT_CONFIG; // Use default during setup

    // Check length
    if (pin.length !== config.pinLength) {
      return false;
    }

    // Check if only digits
    if (!/^\d+$/.test(pin)) {
      return false;
    }

    return true;
  }

  /**
   * Change PIN
   */
  public async changePIN(currentPIN: string, newPIN: string): Promise<void> {
    if (!this.isValidPIN(newPIN)) {
      throw new Error('Invalid new PIN format');
    }

    // Verify current PIN first
    const authResult = await this.authenticateWithPIN(currentPIN);
    if (!authResult.success) {
      throw new Error('Current PIN is incorrect');
    }

    try {
      await cryptoService.storePINSecurely(newPIN);
    } catch (error) {
      throw new Error(`Failed to change PIN: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Reset all security data
   */
  public async resetAllSecurityData(): Promise<void> {
    try {
      await Promise.all([
        cryptoService.clearAllSecureData(),
        AsyncStorage.removeItem(this.STORAGE_KEYS.SECURITY_CONFIG),
        AsyncStorage.removeItem(this.STORAGE_KEYS.FAILED_ATTEMPTS),
        AsyncStorage.removeItem(this.STORAGE_KEYS.LOCKOUT_TIME),
        AsyncStorage.removeItem(this.STORAGE_KEYS.SETUP_COMPLETED),
        AsyncStorage.removeItem(this.STORAGE_KEYS.LAST_ACTIVITY),
      ]);

      this.lockApp();
    } catch (error) {
      throw new Error(`Failed to reset security data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.clearAutoLockTimer();
    if (this.appStateListener) {
      this.appStateListener.remove();
      this.appStateListener = null;
    }
  }
}

export const securityService = SecurityService.getInstance();
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
      }

      const hasPin = await this.checkPinExists();
      const biometricInfo = await this.getBiometricInfo();

      this.authState = {
        ...this.authState,
        hasPin,
        hasBiometric: biometricInfo.available && this.settings.biometricEnabled,
      };

      this.notifyListeners();
    } catch (error) {
      console.error('Failed to initialize security settings:', error);
    }
  }

  /**
   * Add auth state listener
   */
  addListener(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.authState));
  }

  /**
   * Get current auth state
   */
  getAuthState(): AuthState {
    return { ...this.authState };
  }

  /**
   * Get security settings
   */
  getSecuritySettings(): SecuritySettings {
    return { ...this.settings };
  }

  /**
   * Update security settings
   */
  async updateSecuritySettings(newSettings: Partial<SecuritySettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    await AsyncStorage.setItem('security_settings', JSON.stringify(this.settings));
    this.notifyListeners();
  }

  /**
   * Setup PIN for first time
   */
  async setupPin(pin: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { hash, salt } = CryptoService.hashPassword(pin);

      await Keychain.setInternetCredentials('finance_app_pin', hash, salt);

      this.authState = {
        ...this.authState,
        hasPin: true,
      };

      await this.updateSecuritySettings({ pinEnabled: true });
      this.notifyListeners();

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to setup PIN'
      };
    }
  }

  /**
   * Change existing PIN
   */
  async changePin(currentPin: string, newPin: string): Promise<{ success: boolean; error?: string }> {
    try {
      const isValid = await this.verifyPin(currentPin);
      if (!isValid.success) {
        return { success: false, error: 'Current PIN is incorrect' };
      }

      return await this.setupPin(newPin);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to change PIN'
      };
    }
  }

  /**
   * Verify PIN
   */
  async verifyPin(pin: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (this.authState.isLockedOut) {
        return { success: false, error: 'Account is temporarily locked' };
      }

      const credentials = await Keychain.getInternetCredentials('finance_app_pin');
      if (!credentials || credentials === false) {
        return { success: false, error: 'PIN not found' };
      }

      const { username: hash, password: salt } = credentials;
      const isValid = CryptoService.verifyPassword(pin, hash, salt);

      if (isValid) {
        await this.onSuccessfulAuth();
        return { success: true };
      } else {
        await this.onFailedAuth();
        return { success: false, error: 'Incorrect PIN' };
      }
    } catch (error) {
      await this.onFailedAuth();
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PIN verification failed'
      };
    }
  }

  /**
   * Remove PIN
   */
  async removePin(): Promise<{ success: boolean; error?: string }> {
    try {
      await Keychain.resetInternetCredentials('finance_app_pin');

      this.authState = {
        ...this.authState,
        hasPin: false,
        isAuthenticated: false,
        isLocked: true,
      };

      await this.updateSecuritySettings({ pinEnabled: false });
      this.notifyListeners();

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove PIN'
      };
    }
  }

  /**
   * Check if PIN exists
   */
  private async checkPinExists(): Promise<boolean> {
    try {
      const credentials = await Keychain.getInternetCredentials('finance_app_pin');
      return credentials !== false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get biometric information
   */
  async getBiometricInfo(): Promise<BiometricInfo> {
    try {
      const biometricType = await BiometricAuth.isSensorAvailable();

      if (biometricType.available) {
        return {
          available: true,
          biometryType: biometricType.biometryType || 'None',
        };
      } else {
        return {
          available: false,
          biometryType: 'None',
          error: biometricType.error || 'Biometric authentication not available',
        };
      }
    } catch (error) {
      return {
        available: false,
        biometryType: 'None',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Setup biometric authentication
   */
  async setupBiometric(): Promise<{ success: boolean; error?: string }> {
    try {
      const biometricInfo = await this.getBiometricInfo();

      if (!biometricInfo.available) {
        return { success: false, error: 'Biometric authentication not available' };
      }

      // Create biometric keys
      await BiometricAuth.createKeys();

      await this.updateSecuritySettings({ biometricEnabled: true });

      this.authState = {
        ...this.authState,
        hasBiometric: true,
      };

      this.notifyListeners();

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to setup biometric auth'
      };
    }
  }

  /**
   * Authenticate with biometrics
   */
  async authenticateWithBiometric(): Promise<{ success: boolean; error?: string }> {
    try {
      if (this.authState.isLockedOut) {
        return { success: false, error: 'Account is temporarily locked' };
      }

      const result = await BiometricAuth.simplePrompt({
        promptMessage: 'Authenticate to access your finance data',
        fallbackPromptMessage: 'Use PIN instead',
      });

      if (result.success) {
        await this.onSuccessfulAuth();
        return { success: true };
      } else {
        await this.onFailedAuth();
        return { success: false, error: 'Biometric authentication failed' };
      }
    } catch (error) {
      await this.onFailedAuth();
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Biometric authentication failed'
      };
    }
  }

  /**
   * Disable biometric authentication
   */
  async disableBiometric(): Promise<{ success: boolean; error?: string }> {
    try {
      await BiometricAuth.deleteKeys();

      await this.updateSecuritySettings({ biometricEnabled: false });

      this.authState = {
        ...this.authState,
        hasBiometric: false,
      };

      this.notifyListeners();

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to disable biometric auth'
      };
    }
  }

  /**
   * Handle successful authentication
   */
  private async onSuccessfulAuth(): Promise<void> {
    this.authState = {
      ...this.authState,
      isAuthenticated: true,
      isLocked: false,
      lastActiveTime: Date.now(),
      failedAttempts: 0,
      isLockedOut: false,
      lockoutUntil: undefined,
    };

    this.startAutoLockTimer();
    this.notifyListeners();
  }

  /**
   * Handle failed authentication
   */
  private async onFailedAuth(): Promise<void> {
    this.authState = {
      ...this.authState,
      failedAttempts: this.authState.failedAttempts + 1,
    };

    if (this.authState.failedAttempts >= this.settings.maxFailedAttempts) {
      const lockoutUntil = Date.now() + (this.settings.lockoutDuration * 60 * 1000);
      this.authState = {
        ...this.authState,
        isLockedOut: true,
        lockoutUntil,
      };

      // Clear lockout after duration
      setTimeout(() => {
        this.authState = {
          ...this.authState,
          isLockedOut: false,
          lockoutUntil: undefined,
          failedAttempts: 0,
        };
        this.notifyListeners();
      }, this.settings.lockoutDuration * 60 * 1000);
    }

    this.notifyListeners();
  }

  /**
   * Lock the application
   */
  lock(): void {
    this.authState = {
      ...this.authState,
      isAuthenticated: false,
      isLocked: true,
      lastActiveTime: 0,
    };

    this.stopAutoLockTimer();
    this.notifyListeners();
  }

  /**
   * Update last active time
   */
  updateActivity(): void {
    if (this.authState.isAuthenticated) {
      this.authState = {
        ...this.authState,
        lastActiveTime: Date.now(),
      };

      this.startAutoLockTimer(); // Reset timer
    }
  }

  /**
   * Start auto-lock timer
   */
  private startAutoLockTimer(): void {
    this.stopAutoLockTimer();

    if (this.settings.autoLockTimeout > 0) {
      this.lockTimer = setTimeout(() => {
        this.lock();
      }, this.settings.autoLockTimeout * 60 * 1000);
    }
  }

  /**
   * Stop auto-lock timer
   */
  private stopAutoLockTimer(): void {
    if (this.lockTimer) {
      clearTimeout(this.lockTimer);
      this.lockTimer = null;
    }
  }

  /**
   * Check if app should be locked due to inactivity
   */
  checkAutoLock(): boolean {
    if (!this.authState.isAuthenticated) {
      return true;
    }

    if (this.settings.autoLockTimeout <= 0) {
      return false;
    }

    const inactiveDuration = Date.now() - this.authState.lastActiveTime;
    const shouldLock = inactiveDuration > (this.settings.autoLockTimeout * 60 * 1000);

    if (shouldLock) {
      this.lock();
      return true;
    }

    return false;
  }

  /**
   * Get lockout remaining time in milliseconds
   */
  getLockoutRemainingTime(): number {
    if (!this.authState.isLockedOut || !this.authState.lockoutUntil) {
      return 0;
    }

    const remaining = this.authState.lockoutUntil - Date.now();
    return Math.max(0, remaining);
  }

  /**
   * Clear all security data (for app reset)
   */
  async clearAllData(): Promise<void> {
    try {
      // Remove all keychain data
      await Keychain.resetInternetCredentials('finance_app_pin');
      await BiometricAuth.deleteKeys();

      // Clear settings
      await AsyncStorage.removeItem('security_settings');

      // Reset state
      this.authState = {
        isAuthenticated: false,
        isLocked: true,
        hasPin: false,
        hasBiometric: false,
        lastActiveTime: 0,
        failedAttempts: 0,
        isLockedOut: false,
      };

      this.settings = {
        pinEnabled: false,
        biometricEnabled: false,
        autoLockTimeout: 5,
        maxFailedAttempts: 5,
        lockoutDuration: 30,
      };

      this.stopAutoLockTimer();
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to clear security data:', error);
    }
  }
}
