
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SettingsState, SecuritySettings, NotificationSettings } from '@/types/app';

const initialState: SettingsState = {
  theme: 'auto',
  language: 'de',
  currency: 'EUR',
  dateFormat: 'dd.MM.yyyy',
  security: {
    pinEnabled: false,
    biometricEnabled: false,
    autoLockTimeout: 5,
    maxFailedAttempts: 5,
    lockoutDuration: 30,
  },
  notifications: {
    enabled: true,
    recurrenceReminders: true,
    budgetAlerts: true,
    weeklyReports: false,
  },
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'auto'>) => {
      state.theme = action.payload;
    },

    setLanguage: (state, action: PayloadAction<'en' | 'de'>) => {
      state.language = action.payload;
    },

    setCurrency: (state, action: PayloadAction<string>) => {
      state.currency = action.payload;
    },

    setDateFormat: (state, action: PayloadAction<string>) => {
      state.dateFormat = action.payload;
    },

    updateSecuritySettings: (state, action: PayloadAction<Partial<SecuritySettings>>) => {
      state.security = { ...state.security, ...action.payload };
    },

    updateNotificationSettings: (state, action: PayloadAction<Partial<NotificationSettings>>) => {
      state.notifications = { ...state.notifications, ...action.payload };
    },

    resetToDefaults: () => initialState,
  },
});

export const {
  setTheme,
  setLanguage,
  setCurrency,
  setDateFormat,
  updateSecuritySettings,
  updateNotificationSettings,
  resetToDefaults,
} = settingsSlice.actions;

export default settingsSlice.reducer;
