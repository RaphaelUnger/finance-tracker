import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  AppState,
  AppStateStatus,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { useTheme } from '../hooks/useTheme';
import LoadingScreen from '../components/LoadingScreen';
import Button from '../components/Button';
import {
  authenticateWithPIN,
  authenticateWithBiometric,
  clearError,
  resetFailedAttempts
} from '../store/slices/authSlice';

interface PinInputProps {
  pin: string;
  maxLength: number;
  isError?: boolean;
  isLocked?: boolean;
}

function PinInput({ pin, maxLength, isError = false, isLocked = false }: PinInputProps) {
  const theme = useTheme();

  return (
    <View style={styles.pinContainer}>
      {Array.from({ length: maxLength }, (_, index) => (
        <View
          key={index}
          style={[
            styles.pinDot,
            {
              backgroundColor: index < pin.length
                ? (isError ? theme.colors.error : (isLocked ? theme.colors.warning : theme.colors.primary))
                : theme.colors.surface,
              borderColor: isError
                ? theme.colors.error
                : (isLocked ? theme.colors.warning : theme.colors.border),
            }
          ]}
        >
          {index < pin.length && (
            <Text style={[styles.pinDotText, { color: '#FFFFFF' }]}>•</Text>
          )}
        </View>
      ))}
    </View>
  );
}

interface NumpadProps {
  onNumberPress: (number: string) => void;
  onBackspace: () => void;
  disabled?: boolean;
}

function Numpad({ onNumberPress, onBackspace, disabled = false }: NumpadProps) {
  const theme = useTheme();

  const numbers = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'backspace'],
  ];

  const handlePress = (value: string) => {
    if (disabled) return;

    if (value === 'backspace') {
      onBackspace();
    } else if (value !== '') {
      onNumberPress(value);
    }
  };

  return (
    <View style={styles.numpad}>
      {numbers.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.numpadRow}>
          {row.map((value, colIndex) => (
            <TouchableOpacity
              key={colIndex}
              style={[
                styles.numpadButton,
                {
                  backgroundColor: value === ''
                    ? 'transparent'
                    : theme.colors.surface,
                  borderColor: theme.colors.border,
                  opacity: disabled ? 0.5 : 1,
                }
              ]}
              onPress={() => handlePress(value)}
              disabled={disabled || value === ''}
            >
              {value === 'backspace' ? (
                <Text style={[styles.backspaceText, { color: theme.colors.text }]}>⌫</Text>
              ) : (
                <Text style={[styles.numpadButtonText, { color: theme.colors.text }]}>
                  {value}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
}

export default function LockScreen() {
  const dispatch = useAppDispatch();
  const theme = useTheme();

  const {
    isLoading,
    error,
    failedAttempts,
    lockedUntil,
    securityConfig,
    biometricConfig
  } = useAppSelector(state => state.auth);

  const [pin, setPin] = useState('');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lockoutTimeRemaining, setLockoutTimeRemaining] = useState(0);

  const PIN_LENGTH = securityConfig?.pinLength || 4;
  const MAX_ATTEMPTS = securityConfig?.maxLoginAttempts || 5;
  const isLockedOut = lockedUntil ? Date.now() < lockedUntil : false;

  useEffect(() => {
    if (error) {
      setErrorMessage(error);
      setShowError(true);

      // Clear PIN on error
      setPin('');

      // Auto-clear error after 3 seconds
      const timer = setTimeout(() => {
        setShowError(false);
        dispatch(clearError());
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  useEffect(() => {
    // Handle lockout timer
    if (isLockedOut && lockedUntil) {
      const updateTimer = () => {
        const remaining = Math.max(0, lockedUntil - Date.now());
        setLockoutTimeRemaining(remaining);

        if (remaining <= 0) {
          dispatch(resetFailedAttempts());
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [isLockedOut, lockedUntil, dispatch]);

  useEffect(() => {
    // Auto-trigger biometric auth on mount if enabled and available
    if (biometricConfig?.isEnabled && biometricConfig?.isAvailable && !isLockedOut) {
      const timer = setTimeout(() => {
        handleBiometricAuth();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [biometricConfig, isLockedOut]);

  const handleNumberPress = (number: string) => {
    if (isLockedOut || isLoading) return;

    setShowError(false);

    if (pin.length < PIN_LENGTH) {
      const newPin = pin + number;
      setPin(newPin);

      if (newPin.length === PIN_LENGTH) {
        // Auto-submit when PIN is complete
        setTimeout(() => {
          handlePinSubmit(newPin);
        }, 100);
      }
    }
  };

  const handleBackspace = () => {
    if (isLockedOut || isLoading) return;

    setShowError(false);
    setPin(prev => prev.slice(0, -1));
  };

  const handlePinSubmit = async (pinToSubmit: string) => {
    try {
      await dispatch(authenticateWithPIN(pinToSubmit)).unwrap();
      // Success is handled by Redux state update
    } catch (error) {
      // Error is handled by Redux and useEffect
      setPin('');
    }
  };

  const handleBiometricAuth = async () => {
    if (isLockedOut || !biometricConfig?.isEnabled || !biometricConfig?.isAvailable) {
      return;
    }

    try {
      await dispatch(authenticateWithBiometric()).unwrap();
      // Success is handled by Redux state update
    } catch (error) {
      // Biometric failed - user can still use PIN
      console.log('Biometric authentication failed');
    }
  };

  const formatLockoutTime = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  const attemptsRemaining = MAX_ATTEMPTS - failedAttempts;
  const shouldShowAttempts = failedAttempts > 0 && !isLockedOut;

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.appTitle, { color: theme.colors.text }]}>
            Finance Tracker
          </Text>

          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {isLockedOut
              ? '🔒 App ist gesperrt'
              : 'Geben Sie Ihren PIN ein'
            }
          </Text>

          {isLockedOut && (
            <View style={styles.lockoutInfo}>
              <Text style={[styles.lockoutText, { color: theme.colors.error }]}>
                Zu viele Fehlversuche
              </Text>
              <Text style={[styles.lockoutTimer, { color: theme.colors.warning }]}>
                Entsperrt in: {formatLockoutTime(lockoutTimeRemaining)}
              </Text>
            </View>
          )}

          {shouldShowAttempts && (
            <Text style={[styles.attemptsText, { color: theme.colors.warning }]}>
              {attemptsRemaining} Versuch{attemptsRemaining !== 1 ? 'e' : ''} verbleibend
            </Text>
          )}
        </View>

        <View style={styles.pinSection}>
          <PinInput
            pin={pin}
            maxLength={PIN_LENGTH}
            isError={showError}
            isLocked={isLockedOut}
          />

          {showError && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {errorMessage}
            </Text>
          )}
        </View>

        <Numpad
          onNumberPress={handleNumberPress}
          onBackspace={handleBackspace}
          disabled={isLockedOut || isLoading}
        />

        <View style={styles.footer}>
          {biometricConfig?.isEnabled && biometricConfig?.isAvailable && !isLockedOut && (
            <Button
              title="🔒 Biometric entsperren"
              onPress={handleBiometricAuth}
              variant="outline"
              disabled={isLoading}
              style={styles.biometricButton}
            />
          )}

          <Text style={[styles.securityInfo, { color: theme.colors.textSecondary }]}>
            🔒 Ihre Daten sind sicher verschlüsselt
          </Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  lockoutInfo: {
    alignItems: 'center',
    marginTop: 16,
  },
  lockoutText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  lockoutTimer: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  attemptsText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  pinSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  pinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 20,
  },
  pinDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinDotText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    maxWidth: 280,
    fontWeight: '500',
  },
  numpad: {
    flex: 1,
    justifyContent: 'center',
    maxHeight: 320,
  },
  numpadRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  numpadButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  numpadButtonText: {
    fontSize: 26,
    fontWeight: '600',
  },
  backspaceText: {
    fontSize: 22,
  },
  footer: {
    alignItems: 'center',
    marginTop: 30,
  },
  biometricButton: {
    marginBottom: 20,
    paddingHorizontal: 32,
  },
  securityInfo: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
  const [failedAttempts, setFailedAttempts] = useState(0);
  const securityService = SecurityService.getInstance();

  const handlePinSubmit = async () => {
    if (pin.length < 4) {
      Alert.alert('Error', 'PIN must be at least 4 digits');
      return;
    }

    setLoading(true);
    try {
      const result = await securityService.verifyPin(pin);

      if (result.success) {
        dispatch(authenticate());
        setPin('');
        setFailedAttempts(0);
      } else {
        setFailedAttempts(prev => prev + 1);
        Alert.alert('Incorrect PIN', result.error || 'Please try again');
        setPin('');
      }
    } catch (error) {
      Alert.alert('Error', 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricAuth = async () => {
    setLoading(true);
    try {
      const result = await securityService.authenticateWithBiometric();

      if (result.success) {
        dispatch(authenticate());
      } else {
        Alert.alert('Biometric Authentication Failed', result.error || 'Please use PIN instead');
      }
    } catch (error) {
      Alert.alert('Error', 'Biometric authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.lg,
    },
    logo: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: theme.spacing.xl,
    },
    title: {
      fontSize: 24,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xl,
      textAlign: 'center',
    },
    pinContainer: {
      flexDirection: 'row',
      marginBottom: theme.spacing.lg,
    },
    pinDot: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: theme.colors.primary,
      marginHorizontal: theme.spacing.sm,
    },
    pinDotFilled: {
      backgroundColor: theme.colors.primary,
    },
    pinInput: {
      position: 'absolute',
      opacity: 0,
      width: 1,
      height: 1,
    },
    biometricButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.md,
    },
    biometricButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: theme.spacing.sm,
    },
    submitButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      minWidth: 120,
      alignItems: 'center',
    },
    submitButtonDisabled: {
      backgroundColor: theme.colors.textSecondary,
    },
    submitButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    failedAttempts: {
      marginTop: theme.spacing.md,
      color: theme.colors.error,
      fontSize: 14,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>💰</Text>
      <Text style={styles.title}>Finance Tracker</Text>
      <Text style={styles.subtitle}>Enter your PIN to continue</Text>

      <View style={styles.pinContainer}>
        {[0, 1, 2, 3, 4, 5, 6, 7].map(index => (
          <View
            key={index}
            style={[
              styles.pinDot,
              index < pin.length && styles.pinDotFilled,
            ]}
          />
        ))}
      </View>

      <TextInput
        style={styles.pinInput}
        value={pin}
        onChangeText={setPin}
        keyboardType="numeric"
        secureTextEntry
        maxLength={8}
        autoFocus
        onSubmitEditing={handlePinSubmit}
      />

      <TouchableOpacity
        style={styles.biometricButton}
        onPress={handleBiometricAuth}
        disabled={loading}
      >
        <Icon name="fingerprint" size={24} color="#FFFFFF" />
        <Text style={styles.biometricButtonText}>Use Biometric</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.submitButton,
          (loading || pin.length < 4) && styles.submitButtonDisabled,
        ]}
        onPress={handlePinSubmit}
        disabled={loading || pin.length < 4}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.submitButtonText}>Unlock</Text>
        )}
      </TouchableOpacity>

      {failedAttempts > 0 && (
        <Text style={styles.failedAttempts}>
          Failed attempts: {failedAttempts}
        </Text>
      )}
    </View>
  );
};
