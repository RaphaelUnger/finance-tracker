import { setPin, clearPin, getPin, checkPin, hasPin, enableBiometric, isBiometricEnabled } from '../src/services/lockService';

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
    setItemAsync: jest.fn().mockRejectedValue(new Error('not available')),
    getItemAsync: jest.fn().mockRejectedValue(new Error('not available')),
    deleteItemAsync: jest.fn().mockRejectedValue(new Error('not available')),
}));

// Mock expo-local-authentication
jest.mock('expo-local-authentication', () => ({
    hasHardwareAsync: jest.fn().mockResolvedValue(false),
    isEnrolledAsync: jest.fn().mockResolvedValue(false),
    authenticateAsync: jest.fn().mockResolvedValue({ success: false }),
}));

describe('lockService', () => {
    beforeEach(async () => {
        // Clear PIN before each test
        await clearPin();
    });

    describe('PIN management', () => {
        it('should set and check PIN correctly', async () => {
            const pin = '1234';
            await setPin(pin);

            const isValid = await checkPin(pin);
            expect(isValid).toBe(true);
        });

        it('should reject incorrect PIN', async () => {
            await setPin('1234');

            const isValid = await checkPin('wrong');
            expect(isValid).toBe(false);
        });

        it('should report hasPin correctly', async () => {
            expect(await hasPin()).toBe(false);

            await setPin('5678');
            expect(await hasPin()).toBe(true);
        });

        it('should clear PIN correctly', async () => {
            await setPin('9999');
            expect(await hasPin()).toBe(true);

            await clearPin();
            expect(await hasPin()).toBe(false);
        });

        it('should return false for checkPin when no PIN is set', async () => {
            const isValid = await checkPin('1234');
            expect(isValid).toBe(false);
        });

        it('should handle different PIN lengths', async () => {
            // Short PIN
            await setPin('12');
            expect(await checkPin('12')).toBe(true);
            await clearPin();

            // Long PIN
            await setPin('123456789012');
            expect(await checkPin('123456789012')).toBe(true);
        });

        it('should use custom iterations for PBKDF2', async () => {
            await setPin('test', 1000);
            expect(await checkPin('test')).toBe(true);
        });
    });

    describe('Biometric settings', () => {
        it('should enable and check biometric setting', async () => {
            await enableBiometric(true);
            expect(await isBiometricEnabled()).toBe(true);

            await enableBiometric(false);
            expect(await isBiometricEnabled()).toBe(false);
        });
    });
});
