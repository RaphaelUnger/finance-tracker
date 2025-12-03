import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ReceiptState } from '@/types/app';
import { Receipt } from '@/types';

const initialState: ReceiptState = {
  items: [],
  loading: false,
  error: undefined,
  processing: false,
};

const receiptsSlice = createSlice({
  name: 'receipts',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setError: (state, action: PayloadAction<string | undefined>) => {
      state.error = action.payload;
    },

    setProcessing: (state, action: PayloadAction<boolean>) => {
      state.processing = action.payload;
    },

    setReceipts: (state, action: PayloadAction<Receipt[]>) => {
      state.items = action.payload;
      state.error = undefined;
    },

    addReceipt: (state, action: PayloadAction<Receipt>) => {
      state.items.unshift(action.payload);
    },

    updateReceipt: (state, action: PayloadAction<Receipt>) => {
      const index = state.items.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },

    removeReceipt: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },

    updateProcessingStatus: (state, action: PayloadAction<{ id: string; status: 'pending' | 'processed' | 'failed' }>) => {
      const index = state.items.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index].processingStatus = action.payload.status;
      }
    },

    updateOCRResult: (state, action: PayloadAction<{ id: string; ocrText: string; extractedData: any; confidence: number }>) => {
      const index = state.items.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index].ocrText = action.payload.ocrText;
        state.items[index].extractedData = action.payload.extractedData;
        state.items[index].confidence = action.payload.confidence;
        state.items[index].processingStatus = 'processed';
      }
    },

    reset: () => initialState,
  },
});

export const {
  setLoading,
  setError,
  setProcessing,
  setReceipts,
  addReceipt,
  updateReceipt,
  removeReceipt,
  updateProcessingStatus,
  updateOCRResult,
  reset,
} = receiptsSlice.actions;

export default receiptsSlice.reducer;
