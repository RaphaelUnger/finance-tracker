import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  Share,
  Dimensions,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { useTheme } from '../hooks/useTheme';
import LoadingScreen from '../components/LoadingScreen';
import Button from '../components/Button';
import {
  generateMonthlyReport,
  generateCategoryReport,
  generateTrendReport,
  fetchDashboardSummary,
  exportReport,
  setReportType,
  setSelectedPeriod,
  setFilters,
  clearFilters,
  setExportFormat,
  clearError,
} from '../store/slices/reportsSlice';
import {
  MonthlyReport,
  CategoryReport,
  TrendReport,
  ReportPeriod,
  ExportFormat,
  ChartData
} from '../types/reports';
import { formatCurrency, formatDate, formatPercentage } from '../utils/helpers';

const { width: screenWidth } = Dimensions.get('window');

interface ReportSelectorProps {
  selectedType: 'monthly' | 'category' | 'trend';
  onTypeChange: (type: 'monthly' | 'category' | 'trend') => void;
}

function ReportSelector({ selectedType, onTypeChange }: ReportSelectorProps) {
  const theme = useTheme();

  const reportTypes = [
    { key: 'monthly' as const, label: 'Monatsbericht', icon: '📅' },
    { key: 'category' as const, label: 'Kategorien', icon: '📊' },
    { key: 'trend' as const, label: 'Trends', icon: '📈' },
  ];

  return (
    <View style={styles.reportSelector}>
      {reportTypes.map((type) => (
        <TouchableOpacity
          key={type.key}
          style={[
            styles.reportTypeButton,
            {
              backgroundColor: selectedType === type.key
                ? theme.colors.primary
                : theme.colors.surface,
              borderColor: theme.colors.border,
            }
          ]}
          onPress={() => onTypeChange(type.key)}
        >
          <Text style={styles.reportTypeIcon}>{type.icon}</Text>
          <Text style={[
            styles.reportTypeText,
            {
              color: selectedType === type.key
                ? '#FFFFFF'
                : theme.colors.text
            }
          ]}>
            {type.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

interface PeriodSelectorProps {
  selectedPeriod: ReportPeriod;
  onPeriodChange: (period: ReportPeriod) => void;
}

function PeriodSelector({ selectedPeriod, onPeriodChange }: PeriodSelectorProps) {
  const theme = useTheme();

  const periods: { key: ReportPeriod; label: string }[] = [
    { key: 'last30days', label: '30 Tage' },
    { key: 'last90days', label: '90 Tage' },
    { key: 'last6months', label: '6 Monate' },
    { key: 'last12months', label: '12 Monate' },
    { key: 'thisyear', label: 'Dieses Jahr' },
    { key: 'lastyear', label: 'Letztes Jahr' },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.periodSelector}
    >
      {periods.map((period) => (
        <TouchableOpacity
          key={period.key}
          style={[
            styles.periodButton,
            {
              backgroundColor: selectedPeriod === period.key
                ? theme.colors.primary + '20'
                : theme.colors.surface,
              borderColor: selectedPeriod === period.key
                ? theme.colors.primary
                : theme.colors.border,
            }
          ]}
          onPress={() => onPeriodChange(period.key)}
        >
          <Text style={[
            styles.periodText,
            {
              color: selectedPeriod === period.key
                ? theme.colors.primary
                : theme.colors.text
            }
          ]}>
            {period.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  change?: string;
  icon?: string;
}

function SummaryCard({ title, value, subtitle, trend, change, icon }: SummaryCardProps) {
  const theme = useTheme();

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return '#10B981';
      case 'down':
        return '#EF4444';
      default:
        return theme.colors.textSecondary;
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return '📈';
      case 'down':
        return '📉';
      default:
        return '➡️';
    }
  };

  return (
    <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.summaryHeader}>
        <Text style={[styles.summaryTitle, { color: theme.colors.textSecondary }]}>
          {title}
        </Text>
        {icon && <Text style={styles.summaryIcon}>{icon}</Text>}
      </View>

      <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
        {value}
      </Text>

      {subtitle && (
        <Text style={[styles.summarySubtitle, { color: theme.colors.textSecondary }]}>
          {subtitle}
        </Text>
      )}

      {(trend && change) && (
        <View style={styles.summaryTrend}>
          <Text style={styles.trendIcon}>{getTrendIcon()}</Text>
          <Text style={[styles.trendText, { color: getTrendColor() }]}>
            {change}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function ReportsScreen() {
  const dispatch = useAppDispatch();
  const theme = useTheme();

  const {
    reportType,
    selectedPeriod,
    filters,
    currentReport,
    isGeneratingReport,
    isDashboardLoading,
    isExporting,
    exportProgress,
    error,
  } = useAppSelector(state => state.reports);

  const [showExportModal, setShowExportModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Load dashboard summary on mount
    dispatch(fetchDashboardSummary());
  }, [dispatch]);

  const generateReport = useCallback(async () => {
    try {
      switch (reportType) {
        case 'monthly':
          const now = new Date();
          await dispatch(generateMonthlyReport({
            year: now.getFullYear(),
            month: now.getMonth() + 1,
          })).unwrap();
          break;
        case 'category':
          await dispatch(generateCategoryReport(filters)).unwrap();
          break;
        case 'trend':
          await dispatch(generateTrendReport({
            period: selectedPeriod,
            filters,
          })).unwrap();
          break;
      }
    } catch (error) {
      Alert.alert('Fehler', 'Bericht konnte nicht generiert werden.');
    }
  }, [dispatch, reportType, selectedPeriod, filters]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchDashboardSummary()).unwrap(),
        generateReport(),
      ]);
    } catch (error) {
      console.error('Failed to refresh reports:', error);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, generateReport]);

  const handleExportReport = useCallback(async (format: ExportFormat) => {
    if (!currentReport) return;

    try {
      await dispatch(exportReport({
        report: currentReport,
        options: {
          format,
          includeCharts: true,
          includeDetails: true,
          reportTitle: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)}-Bericht`,
        },
      })).unwrap();

      setShowExportModal(false);
      Alert.alert('Export erfolgreich', 'Der Bericht wurde erfolgreich exportiert.');
    } catch (error) {
      Alert.alert('Export fehlgeschlagen', 'Der Bericht konnte nicht exportiert werden.');
    }
  }, [dispatch, currentReport, reportType]);

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        Kein Bericht vorhanden
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        Wählen Sie einen Berichtstyp und generieren Sie Ihren ersten Bericht
      </Text>
      <Button
        title="Bericht generieren"
        onPress={generateReport}
        style={styles.generateButton}
      />
    </View>
  );

  if (isGeneratingReport && !currentReport) {
    return <LoadingScreen />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Berichte
        </Text>

        <View style={styles.headerActions}>
          {currentReport && (
            <>
              <TouchableOpacity
                style={[styles.headerButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => setShowExportModal(true)}
              >
                <Text style={[styles.headerButtonText, { color: '#FFFFFF' }]}>
                  Export
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Report Type Selector */}
        <ReportSelector
          selectedType={reportType}
          onTypeChange={(type) => dispatch(setReportType(type))}
        />

        {/* Period Selector */}
        <PeriodSelector
          selectedPeriod={selectedPeriod}
          onPeriodChange={(period) => dispatch(setSelectedPeriod(period))}
        />

        {/* Generate Button */}
        <View style={styles.generateSection}>
          <Button
            title={isGeneratingReport ? 'Generiere...' : 'Bericht generieren'}
            onPress={generateReport}
            disabled={isGeneratingReport}
            style={styles.generateReportButton}
          />
        </View>

        {/* Report Content */}
        {currentReport ? (
          <View style={styles.reportContent}>
            <View style={styles.summaryGrid}>
              <SummaryCard
                title="Typ"
                value={reportType.charAt(0).toUpperCase() + reportType.slice(1)}
                subtitle={`Generiert am ${formatDate(currentReport.generatedAt)}`}
                icon="📊"
              />
              <SummaryCard
                title="Zeitraum"
                value={currentReport.period?.label || 'Unbekannt'}
                icon="📅"
              />
            </View>

            <View style={[styles.reportDetails, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.detailsTitle, { color: theme.colors.text }]}>
                Berichtsdetails
              </Text>
              <Text style={[styles.detailsText, { color: theme.colors.textSecondary }]}>
                Bericht erfolgreich generiert. Nutzen Sie die Export-Funktion, um den Bericht zu teilen oder zu speichern.
              </Text>
            </View>
          </View>
        ) : (
          renderEmptyState()
        )}
      </ScrollView>

      {/* Export Modal */}
      <Modal
        visible={showExportModal}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowExportModal(false)}
      >
        <View style={[styles.exportModal, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.exportHeader, { borderBottomColor: theme.colors.border }]}>
            <TouchableOpacity onPress={() => setShowExportModal(false)}>
              <Text style={[styles.exportCloseButton, { color: theme.colors.textSecondary }]}>
                Abbrechen
              </Text>
            </TouchableOpacity>

            <Text style={[styles.exportTitle, { color: theme.colors.text }]}>
              Bericht exportieren
            </Text>

            <View style={{ width: 80 }} />
          </View>

          <View style={styles.exportOptions}>
            {(['pdf', 'csv', 'excel', 'json'] as ExportFormat[]).map((format) => (
              <TouchableOpacity
                key={format}
                style={[styles.exportOption, { backgroundColor: theme.colors.surface }]}
                onPress={() => handleExportReport(format)}
                disabled={isExporting}
              >
                <Text style={styles.exportOptionIcon}>
                  {format === 'pdf' ? '📄' :
                   format === 'csv' ? '📊' :
                   format === 'excel' ? '📈' : '📝'}
                </Text>
                <Text style={[styles.exportOptionText, { color: theme.colors.text }]}>
                  {format.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {isExporting && (
            <View style={styles.exportProgress}>
              <Text style={[styles.exportProgressText, { color: theme.colors.textSecondary }]}>
                Exportiere... {exportProgress}%
              </Text>
            </View>
          )}
        </View>
      </Modal>

      {/* Error Display */}
      {error && (
        <View style={[styles.errorContainer, { backgroundColor: theme.colors.error + '10' }]}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error}
          </Text>
          <TouchableOpacity onPress={() => dispatch(clearError())}>
            <Text style={[styles.errorDismiss, { color: theme.colors.error }]}>
              Schließen
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  headerButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  reportSelector: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  reportTypeButton: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  reportTypeIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  reportTypeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  periodSelector: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '500',
  },
  generateSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  generateReportButton: {
    width: '100%',
  },
  reportContent: {
    flex: 1,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    width: (screenWidth - 44) / 2,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  summaryIcon: {
    fontSize: 16,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 12,
  },
  summaryTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  trendIcon: {
    fontSize: 12,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  reportDetails: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detailsText: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  generateButton: {
    paddingHorizontal: 32,
  },
  exportModal: {
    flex: 1,
  },
  exportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  exportCloseButton: {
    fontSize: 16,
    width: 80,
  },
  exportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  exportOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
  },
  exportOption: {
    width: (screenWidth - 64) / 2,
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  exportOptionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  exportOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  exportProgress: {
    padding: 16,
    alignItems: 'center',
  },
  exportProgressText: {
    fontSize: 14,
  },
  errorContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
  },
  errorDismiss: {
    fontSize: 14,
    fontWeight: '600',
  },
});
      title: 'Export Reports',
      description: 'PDF and CSV exports',
      sprint: '7',
    },
    {
      icon: 'schedule',
      title: 'Scheduled Reports',
      description: 'Automatic weekly/monthly reports',
      sprint: '11',
    },
  ];

  const mockChartData = [
    { category: 'Food & Dining', amount: 650, color: theme.colors.primary },
    { category: 'Transportation', amount: 420, color: theme.colors.secondary },
    { category: 'Shopping', amount: 380, color: theme.colors.warning },
    { category: 'Entertainment', amount: 220, color: theme.colors.success },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      padding: theme.spacing.lg,
      alignItems: 'center',
    },
    icon: {
      marginBottom: theme.spacing.md,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.xl,
    },
    sprintInfo: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.lg,
      width: '100%',
      ...theme.shadows.sm,
    },
    sprintTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.primary,
      marginBottom: theme.spacing.xs,
    },
    sprintText: {
      fontSize: 14,
      color: theme.colors.text,
      lineHeight: 20,
    },
    mockChartContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.lg,
      width: '100%',
      ...theme.shadows.sm,
    },
    mockChartTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
      textAlign: 'center',
    },
    mockChartItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    mockChartColor: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: theme.spacing.sm,
    },
    mockChartLabel: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.text,
    },
    mockChartAmount: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
    },
    reportsTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
      alignSelf: 'flex-start',
    },
    reportCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      ...theme.shadows.sm,
    },
    reportIcon: {
      marginRight: theme.spacing.md,
    },
    reportContent: {
      flex: 1,
    },
    reportTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    reportDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
    sprintBadge: {
      backgroundColor: theme.colors.info,
      borderRadius: theme.borderRadius.sm,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 2,
      marginLeft: theme.spacing.sm,
    },
    sprintBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Icon name="bar-chart" size={64} color={theme.colors.primary} style={styles.icon} />
        <Text style={styles.title}>Reports & Analytics</Text>
        <Text style={styles.subtitle}>
          Gain insights into your spending patterns and financial health
        </Text>

        <View style={styles.sprintInfo}>
          <Text style={styles.sprintTitle}>Coming in Sprint 6!</Text>
          <Text style={styles.sprintText}>
            Comprehensive reporting features will be implemented starting in Sprint 6, with advanced analytics
            and trend analysis coming in later sprints. Get ready for powerful financial insights!
          </Text>
        </View>

        {/* Mock Chart Preview */}
        <View style={styles.mockChartContainer}>
          <Text style={styles.mockChartTitle}>Preview: Category Breakdown</Text>
          {mockChartData.map((item, index) => (
            <View key={index} style={styles.mockChartItem}>
              <View style={[styles.mockChartColor, { backgroundColor: item.color }]} />
              <Text style={styles.mockChartLabel}>{item.category}</Text>
              <Text style={styles.mockChartAmount}>€{item.amount}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.reportsTitle}>Planned Report Types</Text>

        {reportTypes.map((report, index) => (
          <TouchableOpacity key={index} style={styles.reportCard}>
            <Icon
              name={report.icon}
              size={24}
              color={theme.colors.primary}
              style={styles.reportIcon}
            />
            <View style={styles.reportContent}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.reportTitle}>{report.title}</Text>
                <View style={styles.sprintBadge}>
                  <Text style={styles.sprintBadgeText}>Sprint {report.sprint}</Text>
                </View>
              </View>
              <Text style={styles.reportDescription}>{report.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};
