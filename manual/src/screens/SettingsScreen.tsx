import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector, useAppDispatch } from '@/hooks/useRedux';
import { setTheme, setLanguage, setCurrency } from '@/store/slices/settingsSlice';
import { setActiveScreen } from '@/store/slices/uiSlice';
import { CURRENCIES } from '@/utils/currencyUtils';

export const SettingsScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<NavigationProp<any>>();
  const dispatch = useAppDispatch();
  const settings = useAppSelector(state => state.settings);

  React.useEffect(() => {
    dispatch(setActiveScreen('Settings'));
  }, [dispatch]);

  const handleThemeToggle = () => {
    dispatch(setTheme(isDark ? 'light' : 'dark'));
  };

  const handleLanguageChange = () => {
    Alert.alert(
      'Change Language',
      'Select your preferred language',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deutsch',
          onPress: () => dispatch(setLanguage('de')),
          style: settings.language === 'de' ? 'destructive' : 'default'
        },
        {
          text: 'English',
          onPress: () => dispatch(setLanguage('en')),
          style: settings.language === 'en' ? 'destructive' : 'default'
        },
      ]
    );
  };

  const handleCurrencyChange = () => {
    const currencyOptions = Object.entries(CURRENCIES).map(([code, info]) => ({
      text: `${info.symbol} ${info.name} (${code})`,
      onPress: () => dispatch(setCurrency(code)),
      style: settings.currency === code ? 'destructive' : 'default' as const,
    }));

    Alert.alert(
      'Change Currency',
      'Select your preferred currency',
      [
        { text: 'Cancel', style: 'cancel' },
        ...currencyOptions,
      ]
    );
  };

  const handleAutoLockChange = () => {
    const timeoutOptions = [
      { label: '1 minute', value: 1 },
      { label: '5 minutes', value: 5 },
      { label: '15 minutes', value: 15 },
      { label: '30 minutes', value: 30 },
      { label: 'Never', value: 0 },
    ];

    Alert.alert(
      'Auto-lock Timeout',
      'Select how long the app stays unlocked',
      [
        { text: 'Cancel', style: 'cancel' },
        ...timeoutOptions.map(option => ({
          text: option.label,
          onPress: () => {
            // TODO: Implement auto-lock timeout change
            Alert.alert('Coming Soon', 'Auto-lock settings will be implemented in Sprint 3');
          },
        })),
      ]
    );
  };

  const handleSecuritySettings = () => {
    Alert.alert('Coming Soon', 'Security settings will be implemented in Sprint 3');
  };

  const handleCategoryManagement = () => {
    Alert.alert('Coming Soon', 'Category management will be implemented in Sprint 4');
  };

  const handleBackupExport = () => {
    // Navigate to Export/Import screen
    navigation.navigate('ExportImport');
  };

  const handleImportData = () => {
    // Navigate to Export/Import screen
    navigation.navigate('ExportImport');
  };

  const handleAbout = () => {
    Alert.alert(
      'About Finance Tracker',
      'Version: 1.0.0\n\nA privacy-first, offline-capable mobile application for managing personal finances.\n\nDeveloped using manual AI-prompting approach.',
      [{ text: 'OK' }]
    );
  };

  const handleHelp = () => {
    Alert.alert(
      'Help & Support',
      'This app is currently in development.\n\nFor help with current features:\n• Dashboard: View your financial overview\n• Transactions: Coming in Sprint 2\n• Reports: Coming in Sprint 6\n• Settings: Basic theme and language settings',
      [{ text: 'OK' }]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    section: {
      backgroundColor: theme.colors.surface,
      marginVertical: theme.spacing.xs,
    },
    sectionHeader: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      textTransform: 'uppercase',
      backgroundColor: theme.colors.background,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
      backgroundColor: theme.colors.surface,
    },
    lastSettingItem: {
      borderBottomWidth: 0,
    },
    settingIcon: {
      marginRight: theme.spacing.md,
    },
    settingContent: {
      flex: 1,
    },
    settingTitle: {
      fontSize: 16,
      color: theme.colors.text,
      fontWeight: '500',
    },
    settingSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    settingValue: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginRight: theme.spacing.sm,
    },
    chevron: {
      marginLeft: theme.spacing.sm,
    },
    switch: {
      marginLeft: theme.spacing.sm,
    },
    headerContainer: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.lg,
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    headerIcon: {
      marginBottom: theme.spacing.sm,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    headerSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  });

  const SettingItem: React.FC<{
    icon: string;
    title: string;
    subtitle?: string;
    value?: string;
    onPress?: () => void;
    showChevron?: boolean;
    rightElement?: React.ReactNode;
    isLast?: boolean;
  }> = ({ icon, title, subtitle, value, onPress, showChevron = true, rightElement, isLast = false }) => (
    <TouchableOpacity
      style={[styles.settingItem, isLast && styles.lastSettingItem]}
      onPress={onPress}
      disabled={!onPress}
    >
      <Icon name={icon} size={24} color={theme.colors.primary} style={styles.settingIcon} />
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {value && <Text style={styles.settingValue}>{value}</Text>}
      {rightElement}
      {showChevron && onPress && (
        <Icon name="chevron-right" size={24} color={theme.colors.textSecondary} style={styles.chevron} />
      )}
    </TouchableOpacity>
  );

  const getCurrencyDisplay = () => {
    const currency = CURRENCIES[settings.currency as keyof typeof CURRENCIES];
    return currency ? `${currency.symbol} ${currency.name}` : settings.currency;
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Icon name="settings" size={48} color={theme.colors.primary} style={styles.headerIcon} />
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>
          Customize your Finance Tracker experience
        </Text>
      </View>

      {/* Appearance Section */}
      <Text style={styles.sectionHeader}>Appearance</Text>
      <View style={styles.section}>
        <SettingItem
          icon="brightness-6"
          title="Dark Mode"
          subtitle="Toggle between light and dark theme"
          rightElement={
            <Switch
              value={isDark}
              onValueChange={handleThemeToggle}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor="#FFFFFF"
              style={styles.switch}
            />
          }
          showChevron={false}
        />
        <SettingItem
          icon="language"
          title="Language"
          subtitle="Change app language"
          value={settings.language === 'de' ? 'Deutsch' : 'English'}
          onPress={handleLanguageChange}
        />
        <SettingItem
          icon="attach-money"
          title="Currency"
          subtitle="Default currency for transactions"
          value={getCurrencyDisplay()}
          onPress={handleCurrencyChange}
          isLast
        />
      </View>

      {/* Security Section */}
      <Text style={styles.sectionHeader}>Security</Text>
      <View style={styles.section}>
        <SettingItem
          icon="security"
          title="Security Settings"
          subtitle="PIN, biometric authentication"
          onPress={handleSecuritySettings}
        />
        <SettingItem
          icon="lock-clock"
          title="Auto-lock"
          subtitle="Automatically lock app after inactivity"
          value={`${settings.security.autoLockTimeout} min`}
          onPress={handleAutoLockChange}
          isLast
        />
      </View>

      {/* Data Section */}
      <Text style={styles.sectionHeader}>Data Management</Text>
      <View style={styles.section}>
        <SettingItem
          icon="folder"
          title="Categories"
          subtitle="Manage transaction categories"
          onPress={handleCategoryManagement}
        />
        <SettingItem
          icon="backup"
          title="Backup & Export"
          subtitle="Export your data securely"
          onPress={handleBackupExport}
        />
        <SettingItem
          icon="file-download"
          title="Import Data"
          subtitle="Import transactions from file"
          onPress={handleImportData}
          isLast
        />
      </View>

      {/* About Section */}
      <Text style={styles.sectionHeader}>Support</Text>
      <View style={styles.section}>
        <SettingItem
          icon="info"
          title="About"
          subtitle="App version and information"
          value="v1.0.0"
          onPress={handleAbout}
        />
        <SettingItem
          icon="help"
          title="Help & Support"
          subtitle="Get help using the app"
          onPress={handleHelp}
          isLast
        />
      </View>

      {/* Development Info */}
      <Text style={styles.sectionHeader}>Development Status</Text>
      <View style={styles.section}>
        <SettingItem
          icon="code"
          title="Current Sprint"
          subtitle="Sprint 1 - Basis UI and Navigation"
          value="Active"
          showChevron={false}
          isLast
        />
      </View>
    </ScrollView>
  );
};
