import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RecurrenceState } from '@/types/app';
import { Recurrence } from '@/types';

const initialState: RecurrenceState = {
  items: [],
  loading: false,
  error: undefined,
};

const recurrencesSlice = createSlice({
  name: 'recurrences',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setError: (state, action: PayloadAction<string | undefined>) => {
      state.error = action.payload;
    },

    setRecurrences: (state, action: PayloadAction<Recurrence[]>) => {
      state.items = action.payload;
      state.error = undefined;
    },

    addRecurrence: (state, action: PayloadAction<Recurrence>) => {
      state.items.push(action.payload);
    },

    updateRecurrence: (state, action: PayloadAction<Recurrence>) => {
      const index = state.items.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },

    removeRecurrence: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },

    toggleRecurrenceActive: (state, action: PayloadAction<string>) => {
      const index = state.items.findIndex(item => item.id === action.payload);
      if (index !== -1) {
        state.items[index].isActive = !state.items[index].isActive;
      }
    },

    updateNextExecution: (state, action: PayloadAction<{ id: string; nextExecution: Date }>) => {
      const index = state.items.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index].nextExecution = action.payload.nextExecution;
        state.items[index].lastExecuted = new Date();
      }
    },

    reset: () => initialState,
  },
});

export const {
  setLoading,
  setError,
  setRecurrences,
  addRecurrence,
  updateRecurrence,
  removeRecurrence,
  toggleRecurrenceActive,
  updateNextExecution,
  reset,
} = recurrencesSlice.actions;

export default recurrencesSlice.reducer;
