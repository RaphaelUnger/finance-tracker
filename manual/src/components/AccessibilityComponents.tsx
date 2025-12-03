import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAccessibilityFocus } from '../hooks/useAccessibility';

interface AccessibleButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  icon?: string;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  style?: any;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  style,
  accessibilityLabel,
  accessibilityHint,
  testID
}) => {
  const { focusRef, focusAccessibility } = useAccessibilityFocus();

  const handlePress = () => {
    if (!disabled && !loading) {
      onPress();
    }
  };

  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[`button_${variant}`], styles[`button_${size}`]];

    if (disabled) {
      baseStyle.push(styles.button_disabled);
    }

    if (style) {
      baseStyle.push(style);
    }

    return baseStyle;
  };

  const getTextStyle = () => {
    return [styles.buttonText, styles[`buttonText_${variant}`], styles[`buttonText_${size}`]];
  };

  const renderIcon = () => {
    if (!icon) return null;

    const iconSize = size === 'small' ? 16 : size === 'large' ? 24 : 20;
    const iconStyle = [
      styles.icon,
      iconPosition === 'right' ? styles.icon_right : styles.icon_left
    ];

    return (
      <Icon
        name={icon}
        size={iconSize}
        color={styles[`buttonText_${variant}`].color}
        style={iconStyle}
      />
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <Icon name="refresh" size={20} color={styles[`buttonText_${variant}`].color} />
          <Text style={getTextStyle()}>Loading...</Text>
        </View>
      );
    }

    return (
      <>
        {iconPosition === 'left' && renderIcon()}
        <Text style={getTextStyle()}>{title}</Text>
        {iconPosition === 'right' && renderIcon()}
      </>
    );
  };

  return (
    <TouchableOpacity
      ref={focusRef}
      style={getButtonStyle()}
      onPress={handlePress}
      disabled={disabled || loading}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        disabled: disabled || loading,
        busy: loading
      }}
      testID={testID}
      onFocus={focusAccessibility}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

// Accessible Text Input Component
interface AccessibleTextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: any;
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  style?: any;
  accessibilityHint?: string;
  testID?: string;
}

export const AccessibleTextInput: React.FC<AccessibleTextInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
  multiline,
  numberOfLines,
  error,
  disabled,
  required,
  style,
  accessibilityHint,
  testID
}) => {
  const { focusRef, focusAccessibility } = useAccessibilityFocus();

  const accessibilityLabel = `${label}${required ? ', required' : ''}${error ? `, error: ${error}` : ''}`;

  return (
    <View style={[styles.inputContainer, style]}>
      <Text style={[styles.inputLabel, error && styles.inputLabel_error]}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>

      <TextInput
        ref={focusRef}
        style={[
          styles.input,
          multiline && styles.input_multiline,
          error && styles.input_error,
          disabled && styles.input_disabled
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        numberOfLines={numberOfLines}
        editable={!disabled}
        accessible={true}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        testID={testID}
        onFocus={focusAccessibility}
      />

      {error && (
        <Text
          style={styles.errorText}
          accessible={true}
          accessibilityRole="text"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      )}
    </View>
  );
};

// High Contrast Mode Support
export const useHighContrastMode = () => {
  // This would check system accessibility settings
  // For now, return a mock implementation
  return false;
};

// Font Size Scaling
export const getScaledFontSize = (baseFontSize: number): number => {
  // This would use React Native's PixelRatio or AccessibilityInfo
  // For now, return base font size
  return baseFontSize;
};

// Screen Reader Announcements
export const announceForScreenReader = (message: string, urgency: 'polite' | 'assertive' = 'polite') => {
  // This would use AccessibilityInfo.announceForAccessibility
  if (__DEV__) {
    console.log(`Screen Reader Announcement (${urgency}): ${message}`);
  }
};

// Focus Management Hook
export const useFocusManagement = () => {
  const focusNext = (nextRef: React.RefObject<any>) => {
    if (nextRef.current) {
      nextRef.current.focus();
    }
  };

  const focusPrevious = (previousRef: React.RefObject<any>) => {
    if (previousRef.current) {
      previousRef.current.focus();
    }
  };

  return { focusNext, focusPrevious };
};

const styles = StyleSheet.create({
  // Button Styles
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44, // WCAG minimum touch target
  },
  button_primary: {
    backgroundColor: '#007AFF',
  },
  button_secondary: {
    backgroundColor: '#6C7B7F',
  },
  button_outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  button_danger: {
    backgroundColor: '#FF3B30',
  },
  button_disabled: {
    opacity: 0.5,
  },
  button_small: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
  },
  button_medium: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  button_large: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 52,
  },
  buttonText: {
    fontWeight: '600',
  },
  buttonText_primary: {
    color: '#FFFFFF',
  },
  buttonText_secondary: {
    color: '#FFFFFF',
  },
  buttonText_outline: {
    color: '#007AFF',
  },
  buttonText_danger: {
    color: '#FFFFFF',
  },
  buttonText_small: {
    fontSize: 14,
  },
  buttonText_medium: {
    fontSize: 16,
  },
  buttonText_large: {
    fontSize: 18,
  },
  icon: {
    marginHorizontal: 4,
  },
  icon_left: {
    marginRight: 8,
    marginLeft: 0,
  },
  icon_right: {
    marginLeft: 8,
    marginRight: 0,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Input Styles
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#000000',
  },
  inputLabel_error: {
    color: '#FF3B30',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    minHeight: 44, // WCAG minimum touch target
  },
  input_multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  input_error: {
    borderColor: '#FF3B30',
    borderWidth: 2,
  },
  input_disabled: {
    backgroundColor: '#F2F2F7',
    opacity: 0.6,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginTop: 4,
  },
  required: {
    color: '#FF3B30',
  },
});

export default AccessibleButton;
