import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from 'redux';
import authSlice from './slices/authSlice';
import transactionsSlice from './slices/transactionsSlice';
import categoriesSlice from './slices/categoriesSlice';
import recurrencesSlice from './slices/recurrencesSlice';
import receiptsSlice from './slices/receiptsSlice';
import reportsSlice from './slices/reportsSlice';
import settingsSlice from './slices/settingsSlice';
import uiSlice from './slices/uiSlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['settings'], // Only persist settings
  blacklist: ['auth', 'ui'], // Don't persist sensitive auth data
};

const rootReducer = combineReducers({
  auth: authSlice,
  transactions: transactionsSlice,
  categories: categoriesSlice,
  recurrences: recurrencesSlice,
  receipts: receiptsSlice,
  reports: reportsSlice,
  settings: settingsSlice,
  ui: uiSlice,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        ignoredPaths: ['register'],
      },
    }),
  devTools: __DEV__,
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
