import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UIState } from '@/types/app';

const initialState: UIState = {
  activeScreen: 'Dashboard',
  loading: {},
  errors: {},
  modals: {},
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveScreen: (state, action: PayloadAction<string>) => {
      state.activeScreen = action.payload;
    },

    setLoading: (state, action: PayloadAction<{ key: string; loading: boolean }>) => {
      state.loading[action.payload.key] = action.payload.loading;
    },

    setError: (state, action: PayloadAction<{ key: string; error?: string }>) => {
      if (action.payload.error) {
        state.errors[action.payload.key] = action.payload.error;
      } else {
        delete state.errors[action.payload.key];
      }
    },

    clearErrors: (state) => {
      state.errors = {};
    },

    setModal: (state, action: PayloadAction<{ key: string; visible: boolean }>) => {
      state.modals[action.payload.key] = action.payload.visible;
    },

    closeAllModals: (state) => {
      state.modals = {};
    },

    reset: () => initialState,
  },
});

export const {
  setActiveScreen,
  setLoading,
  setError,
  clearErrors,
  setModal,
  closeAllModals,
  reset,
} = uiSlice.actions;

export default uiSlice.reducer;
