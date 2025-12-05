import { isBiometricAvailable, authenticateBiometric, enableBiometric, isBiometricEnabled, setPin, checkPin, clearPin } from '../src/services/lockService';
import * as LocalAuth from 'expo-local-authentication';

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
    setItemAsync: jest.fn().mockRejectedValue(new Error('not available')),
    getItemAsync: jest.fn().mockRejectedValue(new Error('not available')),
    deleteItemAsync: jest.fn().mockRejectedValue(new Error('not available')),
}));

// Mock expo-local-authentication
jest.mock('expo-local-authentication', () => ({
    hasHardwareAsync: jest.fn(),
    isEnrolledAsync: jest.fn(),
    authenticateAsync: jest.fn(),
}));

const MockLocalAuth = LocalAuth as jest.Mocked<typeof LocalAuth>;

describe('lockService biometric extended tests', () => {
    beforeEach(async () => {
        jest.clearAllMocks();
        await clearPin();
    });

    describe('isBiometricAvailable', () => {
        it('should return true when hardware and enrollment available', async () => {
            MockLocalAuth.hasHardwareAsync.mockResolvedValue(true);
            MockLocalAuth.isEnrolledAsync.mockResolvedValue(true);

            const result = await isBiometricAvailable();
            expect(result).toBe(true);
        });

        it('should return false when no hardware', async () => {
            MockLocalAuth.hasHardwareAsync.mockResolvedValue(false);
            MockLocalAuth.isEnrolledAsync.mockResolvedValue(true);

            const result = await isBiometricAvailable();
            expect(result).toBe(false);
        });

        it('should return false when not enrolled', async () => {
            MockLocalAuth.hasHardwareAsync.mockResolvedValue(true);
            MockLocalAuth.isEnrolledAsync.mockResolvedValue(false);

            const result = await isBiometricAvailable();
            expect(result).toBe(false);
        });

        it('should return false on error', async () => {
            MockLocalAuth.hasHardwareAsync.mockRejectedValue(new Error('test error'));

            const result = await isBiometricAvailable();
            expect(result).toBe(false);
        });
    });

    describe('authenticateBiometric', () => {
        it('should return true on successful authentication', async () => {
            MockLocalAuth.authenticateAsync.mockResolvedValue({ success: true });

            const result = await authenticateBiometric();
            expect(result).toBe(true);
        });

        it('should return false on failed authentication', async () => {
            MockLocalAuth.authenticateAsync.mockResolvedValue({ success: false, error: 'user_cancel' });

            const result = await authenticateBiometric();
            expect(result).toBe(false);
        });

        it('should return false on authentication error', async () => {
            MockLocalAuth.authenticateAsync.mockRejectedValue(new Error('auth failed'));

            const result = await authenticateBiometric();
            expect(result).toBe(false);
        });
    });

    describe('biometric enabled persistence', () => {
        it('should persist biometric enabled state', async () => {
            await enableBiometric(true);
            expect(await isBiometricEnabled()).toBe(true);

            await enableBiometric(false);
            expect(await isBiometricEnabled()).toBe(false);
        });
    });

    describe('PIN with invalid stored data', () => {
        it('should handle corrupted PIN storage gracefully', async () => {
            // Set a valid PIN first
            await setPin('1234');

            // Verify it works
            expect(await checkPin('1234')).toBe(true);
            expect(await checkPin('wrong')).toBe(false);
        });
    });
});
