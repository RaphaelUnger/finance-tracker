import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { securityService, SecurityConfig, AuthenticationResult, SessionInfo, BiometricConfig } from '../../services/securityService';

export interface AuthState {
  isAuthenticated: boolean;
  isSetupCompleted: boolean;
  isLocked: boolean;
  isLoading: boolean;
  error: string | null;
  sessionInfo: SessionInfo | null;
  securityConfig: SecurityConfig | null;
  biometricConfig: BiometricConfig | null;
  failedAttempts: number;
  lockedUntil: number | null;
  showLockScreen: boolean;
  authMethod: 'pin' | 'biometric' | 'none';
}

const initialState: AuthState = {
  isAuthenticated: false,
  isSetupCompleted: false,
  isLocked: true,
  isLoading: false,
  error: null,
  sessionInfo: null,
  securityConfig: null,
  biometricConfig: null,
  failedAttempts: 0,
  lockedUntil: null,
  showLockScreen: true,
  authMethod: 'none',
};

// Async Thunks
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const [isSetupCompleted, securityConfig, biometricConfig, sessionInfo] = await Promise.all([
        securityService.isSetupCompleted(),
        securityService.getSecurityConfig(),
        securityService.getBiometricConfig(),
        Promise.resolve(securityService.getSessionInfo()),
      ]);

      return {
        isSetupCompleted,
        securityConfig,
        biometricConfig,
        sessionInfo,
        isAuthenticated: sessionInfo.isAuthenticated,
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Auth initialization failed');
    }
  }
);

export const setupPIN = createAsyncThunk(
  'auth/setupPIN',
  async (pin: string, { rejectWithValue }) => {
    try {
      await securityService.setupPIN(pin);
      const securityConfig = await securityService.getSecurityConfig();
      return { securityConfig };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'PIN setup failed');
    }
  }
);

export const authenticateWithPIN = createAsyncThunk(
  'auth/authenticateWithPIN',
  async (pin: string, { rejectWithValue }) => {
    try {
      const result = await securityService.authenticateWithPIN(pin);

      if (result.success) {
        const sessionInfo = securityService.getSessionInfo();
        return { result, sessionInfo };
      } else {
        throw new Error(result.error || 'Authentication failed');
      }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'PIN authentication failed');
    }
  }
);

export const authenticateWithBiometric = createAsyncThunk(
  'auth/authenticateWithBiometric',
  async (_, { rejectWithValue }) => {
    try {
      const result = await securityService.authenticateWithBiometric();

      if (result.success) {
        const sessionInfo = securityService.getSessionInfo();
        return { result, sessionInfo };
      } else {
        throw new Error(result.error || 'Biometric authentication failed');
      }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Biometric authentication failed');
    }
  }
);

export const enableBiometric = createAsyncThunk(
  'auth/enableBiometric',
  async (_, { rejectWithValue }) => {
    try {
      await securityService.enableBiometric();
      const [securityConfig, biometricConfig] = await Promise.all([
        securityService.getSecurityConfig(),
        securityService.getBiometricConfig(),
      ]);
      return { securityConfig, biometricConfig };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to enable biometric authentication');
    }
  }
);

export const lockApp = createAsyncThunk(
  'auth/lockApp',
  async (_, { rejectWithValue }) => {
    try {
      securityService.lockApp();
      const sessionInfo = securityService.getSessionInfo();
      return { sessionInfo };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to lock app');
    }
  }
);

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },

    setLockScreen: (state, action: PayloadAction<boolean>) => {
      state.showLockScreen = action.payload;
    },

    resetFailedAttempts: (state) => {
      state.failedAttempts = 0;
      state.lockedUntil = null;
    },

    updateSessionActivity: (state) => {
      if (state.sessionInfo) {
        state.sessionInfo.lastActivity = Date.now();
      }
    },
  },
  extraReducers: (builder) => {
    // Initialize Auth
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSetupCompleted = action.payload.isSetupCompleted;
        state.securityConfig = action.payload.securityConfig;
        state.biometricConfig = action.payload.biometricConfig;
        state.sessionInfo = action.payload.sessionInfo;
        state.isAuthenticated = action.payload.isAuthenticated;
        state.isLocked = !action.payload.isAuthenticated;
        state.showLockScreen = !action.payload.isAuthenticated || !action.payload.isSetupCompleted;
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Setup PIN
    builder
      .addCase(setupPIN.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(setupPIN.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSetupCompleted = true;
        state.securityConfig = action.payload.securityConfig;
        state.showLockScreen = true;
      })
      .addCase(setupPIN.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Authenticate with PIN
    builder
      .addCase(authenticateWithPIN.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(authenticateWithPIN.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.isLocked = false;
        state.showLockScreen = false;
        state.sessionInfo = action.payload.sessionInfo;
        state.authMethod = 'pin';
        state.failedAttempts = 0;
        state.lockedUntil = null;
      })
      .addCase(authenticateWithPIN.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.isLocked = true;
      });

    // Authenticate with Biometric
    builder
      .addCase(authenticateWithBiometric.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(authenticateWithBiometric.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.isLocked = false;
        state.showLockScreen = false;
        state.sessionInfo = action.payload.sessionInfo;
        state.authMethod = 'biometric';
      })
      .addCase(authenticateWithBiometric.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.isLocked = true;
      });

    // Lock App
    builder
      .addCase(lockApp.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(lockApp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.isLocked = true;
        state.showLockScreen = true;
        state.sessionInfo = action.payload.sessionInfo;
        state.authMethod = 'none';
      })
      .addCase(lockApp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  setLockScreen,
  resetFailedAttempts,
  updateSessionActivity,
} = authSlice.actions;

export default authSlice.reducer;

    authenticate: (state) => {
      state.isAuthenticated = true;
      state.isLocked = false;
      state.lastActiveTime = Date.now();
      state.failedAttempts = 0;
      state.isLockedOut = false;
      state.lockoutUntil = undefined;
    },

    lock: (state) => {
      state.isAuthenticated = false;
      state.isLocked = true;
      state.lastActiveTime = 0;
    },

    updateActivity: (state) => {
      if (state.isAuthenticated) {
        state.lastActiveTime = Date.now();
      }
    },

    recordFailedAttempt: (state, action: PayloadAction<{ maxAttempts: number; lockoutDuration: number }>) => {
      state.failedAttempts += 1;

      if (state.failedAttempts >= action.payload.maxAttempts) {
        state.isLockedOut = true;
        state.lockoutUntil = Date.now() + (action.payload.lockoutDuration * 60 * 1000);
      }
    },

    clearLockout: (state) => {
      state.isLockedOut = false;
      state.lockoutUntil = undefined;
      state.failedAttempts = 0;
    },

    setPinStatus: (state, action: PayloadAction<boolean>) => {
      state.hasPin = action.payload;
    },

    setBiometricStatus: (state, action: PayloadAction<boolean>) => {
      state.hasBiometric = action.payload;
    },

    reset: () => initialState,
  },
});

export const {
  setAuthState,
  authenticate,
  lock,
  updateActivity,
  recordFailedAttempt,
  clearLockout,
  setPinStatus,
  setBiometricStatus,
  reset,
} = authSlice.actions;

export default authSlice.reducer;
