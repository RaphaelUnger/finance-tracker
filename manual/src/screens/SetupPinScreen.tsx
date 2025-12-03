import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  BackHandler,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { useTheme } from '../hooks/useTheme';
import LoadingScreen from '../components/LoadingScreen';
import Button from '../components/Button';
import { setupPIN, clearError } from '../store/slices/authSlice';

interface PinInputProps {
  pin: string;
  onPinChange: (pin: string) => void;
  maxLength: number;
  isError?: boolean;
}

function PinInput({ pin, onPinChange, maxLength, isError = false }: PinInputProps) {
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
                ? (isError ? theme.colors.error : theme.colors.primary)
                : theme.colors.surface,
              borderColor: isError ? theme.colors.error : theme.colors.border,
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

type SetupStep = 'enter' | 'confirm';

export default function SetupPinScreen() {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { isLoading, error } = useAppSelector(state => state.auth);

  const [step, setStep] = useState<SetupStep>('enter');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const PIN_LENGTH = 4;

  useEffect(() => {
    // Prevent back button on Android
    const backAction = () => {
      Alert.alert(
        'PIN Setup erforderlich',
        'Sie müssen einen PIN einrichten, um die App zu verwenden.',
        [{ text: 'OK' }]
      );
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    if (error) {
      setErrorMessage(error);
      setShowError(true);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const validatePin = (pinToValidate: string): boolean => {
    if (pinToValidate.length !== PIN_LENGTH) {
      return false;
    }

    // Check for simple patterns (optional additional security)
    if (pinToValidate === '0000' || pinToValidate === '1234' || pinToValidate === '1111') {
      setErrorMessage('PIN ist zu einfach. Wählen Sie eine andere Kombination.');
      setShowError(true);
      return false;
    }

    return true;
  };

  const handleNumberPress = (number: string) => {
    setShowError(false);

    if (step === 'enter') {
      if (pin.length < PIN_LENGTH) {
        const newPin = pin + number;
        setPin(newPin);

        if (newPin.length === PIN_LENGTH) {
          if (validatePin(newPin)) {
            setTimeout(() => {
              setStep('confirm');
            }, 100);
          } else {
            setTimeout(() => {
              setPin('');
            }, 500);
          }
        }
      }
    } else {
      if (confirmPin.length < PIN_LENGTH) {
        const newConfirmPin = confirmPin + number;
        setConfirmPin(newConfirmPin);

        if (newConfirmPin.length === PIN_LENGTH) {
          setTimeout(() => {
            handlePinComplete(pin, newConfirmPin);
          }, 100);
        }
      }
    }
  };

  const handleBackspace = () => {
    setShowError(false);

    if (step === 'enter') {
      setPin(prev => prev.slice(0, -1));
    } else {
      setConfirmPin(prev => prev.slice(0, -1));
    }
  };

  const handlePinComplete = async (firstPin: string, secondPin: string) => {
    if (firstPin !== secondPin) {
      setErrorMessage('PINs stimmen nicht überein. Bitte versuchen Sie es erneut.');
      setShowError(true);
      setTimeout(() => {
        setStep('enter');
        setPin('');
        setConfirmPin('');
        setShowError(false);
      }, 1500);
      return;
    }

    try {
      await dispatch(setupPIN(firstPin)).unwrap();
      Alert.alert(
        'PIN erfolgreich eingerichtet',
        'Ihr PIN wurde sicher gespeichert. Sie können jetzt die App verwenden.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      // Error handled by Redux
    }
  };

  const handleStartOver = () => {
    setStep('enter');
    setPin('');
    setConfirmPin('');
    setShowError(false);
    setErrorMessage('');
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  const currentPin = step === 'enter' ? pin : confirmPin;
  const isError = showError;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {step === 'enter' ? 'PIN einrichten' : 'PIN bestätigen'}
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          {step === 'enter'
            ? `Erstellen Sie einen ${PIN_LENGTH}-stelligen PIN für die App-Sicherheit`
            : 'Geben Sie Ihren PIN erneut ein, um ihn zu bestätigen'
          }
        </Text>
      </View>

      <View style={styles.pinSection}>
        <PinInput
          pin={currentPin}
          onPinChange={() => {}}
          maxLength={PIN_LENGTH}
          isError={isError}
        />

        {isError && (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {errorMessage}
          </Text>
        )}
      </View>

      <Numpad
        onNumberPress={handleNumberPress}
        onBackspace={handleBackspace}
        disabled={isLoading}
      />

      <View style={styles.footer}>
        {step === 'confirm' && (
          <Button
            title="Neu beginnen"
            onPress={handleStartOver}
            variant="outline"
            style={styles.startOverButton}
          />
        )}

        <Text style={[styles.securityInfo, { color: theme.colors.textSecondary }]}>
          🔒 Ihr PIN wird verschlüsselt auf diesem Gerät gespeichert
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  pinSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  pinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 20,
  },
  pinDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinDotText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 280,
  },
  numpad: {
    flex: 1,
    justifyContent: 'center',
    maxHeight: 300,
  },
  numpadRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  numpadButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  numpadButtonText: {
    fontSize: 24,
    fontWeight: '600',
  },
  backspaceText: {
    fontSize: 20,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  startOverButton: {
    marginBottom: 20,
  },
  securityInfo: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
  const [loading, setLoading] = useState(false);
  const securityService = SecurityService.getInstance();

  const handlePinSubmit = async () => {
    if (step === 'enter') {
      if (pin.length < 4) {
        Alert.alert('Error', 'PIN must be at least 4 digits');
        return;
      }
      setStep('confirm');
      return;
    }

    if (pin !== confirmPin) {
      Alert.alert('Error', 'PINs do not match');
      setConfirmPin('');
      return;
    }

    setLoading(true);
    try {
      const result = await securityService.setupPin(pin);

      if (result.success) {
        dispatch(setPinStatus(true));
        dispatch(authenticate());
        Alert.alert('Success', 'PIN setup completed successfully');
      } else {
        Alert.alert('Error', result.error || 'Failed to setup PIN');
      }
    } catch (error) {
      Alert.alert('Error', 'PIN setup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('enter');
      setConfirmPin('');
    }
  };

  const currentPin = step === 'enter' ? pin : confirmPin;
  const setCurrentPin = step === 'enter' ? setPin : setConfirmPin;

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
    buttonContainer: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    button: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      minWidth: 100,
      alignItems: 'center',
    },
    buttonSecondary: {
      backgroundColor: theme.colors.textSecondary,
    },
    buttonDisabled: {
      backgroundColor: theme.colors.textSecondary,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    instruction: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>💰</Text>
      <Text style={styles.title}>Setup Security</Text>
      <Text style={styles.subtitle}>
        {step === 'enter'
          ? 'Create a PIN to secure your financial data'
          : 'Confirm your PIN'
        }
      </Text>

      <Text style={styles.instruction}>
        {step === 'enter'
          ? 'Enter a 4-8 digit PIN'
          : 'Enter your PIN again to confirm'
        }
      </Text>

      <View style={styles.pinContainer}>
        {[0, 1, 2, 3, 4, 5, 6, 7].map(index => (
          <View
            key={index}
            style={[
              styles.pinDot,
              index < currentPin.length && styles.pinDotFilled,
            ]}
          />
        ))}
      </View>

      <TextInput
        style={styles.pinInput}
        value={currentPin}
        onChangeText={setCurrentPin}
        keyboardType="numeric"
        secureTextEntry
        maxLength={8}
        autoFocus
        onSubmitEditing={handlePinSubmit}
      />

      <View style={styles.buttonContainer}>
        {step === 'confirm' && (
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={handleBack}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Back</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            (loading || currentPin.length < 4) && styles.buttonDisabled,
          ]}
          onPress={handlePinSubmit}
          disabled={loading || currentPin.length < 4}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>
              {step === 'enter' ? 'Next' : 'Complete'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};
