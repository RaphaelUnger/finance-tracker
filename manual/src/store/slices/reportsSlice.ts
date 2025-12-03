import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  MonthlyReport,
  CategoryReport,
  TrendReport,
  DashboardSummary,
  ReportTemplate,
  ScheduledReport,
  ExportFormat,
  ReportPeriod
} from '../../types/reports';
import { reportsService, ReportFilters, ExportOptions } from '../../services/reportsService';

export interface ReportsState {
  // Reports data
  monthlyReports: { [key: string]: MonthlyReport };
  categoryReports: { [key: string]: CategoryReport };
  trendReports: { [key: string]: TrendReport };
  dashboardSummary: DashboardSummary | null;

  // Templates and schedules
  reportTemplates: ReportTemplate[];
  scheduledReports: ScheduledReport[];

  // UI state
  currentReport: MonthlyReport | CategoryReport | TrendReport | null;
  reportType: 'monthly' | 'category' | 'trend';
  selectedPeriod: ReportPeriod;
  filters: ReportFilters;

  // Export state
  exportFormat: ExportFormat;
  isExporting: boolean;
  exportProgress: number;
  lastExportPath: string | null;

  // Loading and error states
  isLoading: boolean;
  isDashboardLoading: boolean;
  isGeneratingReport: boolean;
  error: string | null;

  // Cache management
  lastUpdateTime: number | null;
  cacheExpiry: number; // milliseconds
}

const initialState: ReportsState = {
  // Reports data
  monthlyReports: {},
  categoryReports: {},
  trendReports: {},
  dashboardSummary: null,

  // Templates and schedules
  reportTemplates: [],
  scheduledReports: [],

  // UI state
  currentReport: null,
  reportType: 'monthly',
  selectedPeriod: 'last30days',
  filters: {},

  // Export state
  exportFormat: 'pdf',
  isExporting: false,
  exportProgress: 0,
  lastExportPath: null,

  // Loading and error states
  isLoading: false,
  isDashboardLoading: false,
  isGeneratingReport: false,
  error: null,

  // Cache management
  lastUpdateTime: null,
  cacheExpiry: 5 * 60 * 1000, // 5 minutes
};

// Async Thunks
export const generateMonthlyReport = createAsyncThunk(
  'reports/generateMonthlyReport',
  async ({ year, month }: { year: number; month: number }, { rejectWithValue }) => {
    try {
      const report = await reportsService.generateMonthlyReport(year, month);
      return { key: `${year}-${month}`, report };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to generate monthly report');
    }
  }
);

export const generateCategoryReport = createAsyncThunk(
  'reports/generateCategoryReport',
  async (filters: ReportFilters, { rejectWithValue }) => {
    try {
      const report = await reportsService.generateCategoryReport(filters);
      const key = `category-${Date.now()}`;
      return { key, report };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to generate category report');
    }
  }
);

export const generateTrendReport = createAsyncThunk(
  'reports/generateTrendReport',
  async ({ period, filters }: { period: ReportPeriod; filters?: ReportFilters }, { rejectWithValue }) => {
    try {
      const report = await reportsService.generateTrendReport(period, filters);
      const key = `trend-${period}-${Date.now()}`;
      return { key, report };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to generate trend report');
    }
  }
);

export const fetchDashboardSummary = createAsyncThunk(
  'reports/fetchDashboardSummary',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { reports: ReportsState };
      const { lastUpdateTime, cacheExpiry } = state.reports;

      // Check cache validity
      const now = Date.now();
      if (lastUpdateTime && (now - lastUpdateTime) < cacheExpiry) {
        return null; // Use cached data
      }

      const summary = await reportsService.getDashboardSummary();
      return summary;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch dashboard summary');
    }
  }
);

export const exportReport = createAsyncThunk(
  'reports/exportReport',
  async (
    {
      report,
      options
    }: {
      report: MonthlyReport | CategoryReport | TrendReport;
      options: ExportOptions
    },
    { rejectWithValue, dispatch }
  ) => {
    try {
      // Start export with progress updates
      dispatch(setExportProgress(10));

      const exportPath = await reportsService.exportReport(report, options);

      dispatch(setExportProgress(100));

      return { path: exportPath, format: options.format };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to export report');
    }
  }
);

export const saveReportTemplate = createAsyncThunk(
  'reports/saveReportTemplate',
  async (template: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
    try {
      // This would typically save to a database or local storage
      const newTemplate: ReportTemplate = {
        ...template,
        id: `template-${Date.now()}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      return newTemplate;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to save report template');
    }
  }
);

export const scheduleReport = createAsyncThunk(
  'reports/scheduleReport',
  async (schedule: Omit<ScheduledReport, 'id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
    try {
      // This would typically schedule via a background service
      const newSchedule: ScheduledReport = {
        ...schedule,
        id: `schedule-${Date.now()}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      return newSchedule;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to schedule report');
    }
  }
);

export const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    setReportType: (state, action: PayloadAction<'monthly' | 'category' | 'trend'>) => {
      state.reportType = action.payload;
    },

    setSelectedPeriod: (state, action: PayloadAction<ReportPeriod>) => {
      state.selectedPeriod = action.payload;
    },

    setFilters: (state, action: PayloadAction<ReportFilters>) => {
      state.filters = action.payload;
    },

    updateFilters: (state, action: PayloadAction<Partial<ReportFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    clearFilters: (state) => {
      state.filters = {};
    },

    setCurrentReport: (state, action: PayloadAction<MonthlyReport | CategoryReport | TrendReport | null>) => {
      state.currentReport = action.payload;
    },

    setExportFormat: (state, action: PayloadAction<ExportFormat>) => {
      state.exportFormat = action.payload;
    },

    setExportProgress: (state, action: PayloadAction<number>) => {
      state.exportProgress = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },

    clearReportsCache: (state) => {
      state.monthlyReports = {};
      state.categoryReports = {};
      state.trendReports = {};
      state.dashboardSummary = null;
      state.lastUpdateTime = null;
    },

    deleteReportTemplate: (state, action: PayloadAction<string>) => {
      state.reportTemplates = state.reportTemplates.filter(
        template => template.id !== action.payload
      );
    },

    updateReportTemplate: (state, action: PayloadAction<ReportTemplate>) => {
      const index = state.reportTemplates.findIndex(
        template => template.id === action.payload.id
      );
      if (index !== -1) {
        state.reportTemplates[index] = {
          ...action.payload,
          updatedAt: Date.now(),
        };
      }
    },

    toggleScheduledReport: (state, action: PayloadAction<string>) => {
      const schedule = state.scheduledReports.find(s => s.id === action.payload);
      if (schedule) {
        schedule.isActive = !schedule.isActive;
        schedule.updatedAt = Date.now();
      }
    },

    deleteScheduledReport: (state, action: PayloadAction<string>) => {
      state.scheduledReports = state.scheduledReports.filter(
        schedule => schedule.id !== action.payload
      );
    },

    setCacheExpiry: (state, action: PayloadAction<number>) => {
      state.cacheExpiry = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Generate Monthly Report
    builder
      .addCase(generateMonthlyReport.pending, (state) => {
        state.isGeneratingReport = true;
        state.error = null;
      })
      .addCase(generateMonthlyReport.fulfilled, (state, action) => {
        state.isGeneratingReport = false;
        state.monthlyReports[action.payload.key] = action.payload.report;
        state.currentReport = action.payload.report;
        state.lastUpdateTime = Date.now();
      })
      .addCase(generateMonthlyReport.rejected, (state, action) => {
        state.isGeneratingReport = false;
        state.error = action.payload as string;
      });

    // Generate Category Report
    builder
      .addCase(generateCategoryReport.pending, (state) => {
        state.isGeneratingReport = true;
        state.error = null;
      })
      .addCase(generateCategoryReport.fulfilled, (state, action) => {
        state.isGeneratingReport = false;
        state.categoryReports[action.payload.key] = action.payload.report;
        state.currentReport = action.payload.report;
      })
      .addCase(generateCategoryReport.rejected, (state, action) => {
        state.isGeneratingReport = false;
        state.error = action.payload as string;
      });

    // Generate Trend Report
    builder
      .addCase(generateTrendReport.pending, (state) => {
        state.isGeneratingReport = true;
        state.error = null;
      })
      .addCase(generateTrendReport.fulfilled, (state, action) => {
        state.isGeneratingReport = false;
        state.trendReports[action.payload.key] = action.payload.report;
        state.currentReport = action.payload.report;
      })
      .addCase(generateTrendReport.rejected, (state, action) => {
        state.isGeneratingReport = false;
        state.error = action.payload as string;
      });

    // Fetch Dashboard Summary
    builder
      .addCase(fetchDashboardSummary.pending, (state) => {
        state.isDashboardLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardSummary.fulfilled, (state, action) => {
        state.isDashboardLoading = false;
        if (action.payload) { // Only update if not using cache
          state.dashboardSummary = action.payload;
          state.lastUpdateTime = Date.now();
        }
      })
      .addCase(fetchDashboardSummary.rejected, (state, action) => {
        state.isDashboardLoading = false;
        state.error = action.payload as string;
      });

    // Export Report
    builder
      .addCase(exportReport.pending, (state) => {
        state.isExporting = true;
        state.exportProgress = 0;
        state.error = null;
      })
      .addCase(exportReport.fulfilled, (state, action) => {
        state.isExporting = false;
        state.exportProgress = 100;
        state.lastExportPath = action.payload.path;
      })
      .addCase(exportReport.rejected, (state, action) => {
        state.isExporting = false;
        state.exportProgress = 0;
        state.error = action.payload as string;
      });

    // Save Report Template
    builder
      .addCase(saveReportTemplate.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(saveReportTemplate.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reportTemplates.push(action.payload);
      })
      .addCase(saveReportTemplate.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Schedule Report
    builder
      .addCase(scheduleReport.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(scheduleReport.fulfilled, (state, action) => {
        state.isLoading = false;
        state.scheduledReports.push(action.payload);
      })
      .addCase(scheduleReport.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setReportType,
  setSelectedPeriod,
  setFilters,
  updateFilters,
  clearFilters,
  setCurrentReport,
  setExportFormat,
  setExportProgress,
  clearError,
  clearReportsCache,
  deleteReportTemplate,
  updateReportTemplate,
  toggleScheduledReport,
  deleteScheduledReport,
  setCacheExpiry,
} = reportsSlice.actions;

export default reportsSlice.reducer;
