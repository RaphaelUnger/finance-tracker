import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Picker } from '@react-native-picker/picker';

import { useTheme } from '../hooks/useTheme';
import { useAppSelector } from '../hooks/useRedux';
import AdvancedAnalyticsService, {
  TimeRange,
  AnalyticsData,
  ComparisonPeriod,
  MovingAverageData
} from '../services/advancedAnalyticsService';
import {
  TrendLineChart,
  MultiLineChart,
  CategoryPieChart,
  ComparisonBarChart,
  AreaTrendChart,
  SpendingVelocityChart,
  ChartUtils
} from '../components/AdvancedCharts';
import { Button } from '../components/Button';
import { LoadingOverlay } from '../components/LoadingOverlay';

interface AdvancedReportsScreenProps {
  navigation: any;
}

const AdvancedReportsScreen: React.FC<AdvancedReportsScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const { categories } = useAppSelector((state) => state.categories);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('thisMonth');
  const [selectedTab, setSelectedTab] = useState<'trends' | 'comparison' | 'categories' | 'velocity'>('trends');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [comparison, setComparison] = useState<ComparisonPeriod | null>(null);
  const [movingAverage, setMovingAverage] = useState<MovingAverageData | null>(null);
  const [showTimeRangeModal, setShowTimeRangeModal] = useState(false);
  const [spendingVelocity, setSpendingVelocity] = useState<any>(null);

  const styles = createStyles(theme);

  const timeRanges = AdvancedAnalyticsService.getTimeRanges();

  useEffect(() => {
    loadAnalytics();
  }, [selectedTimeRange]);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);

      const timeRange = timeRanges[selectedTimeRange];
      if (!timeRange) return;

      // Load current period analytics
      const currentAnalytics = await AdvancedAnalyticsService.getAnalytics(timeRange);
      setAnalytics(currentAnalytics);

      // Load comparison data
      const previousRange = getPreviousTimeRange(timeRange, selectedTimeRange);
      if (previousRange) {
        const comparisonData = await AdvancedAnalyticsService.compareTimeRanges(
          timeRange,
          previousRange
        );
        setComparison(comparisonData);
      }

      // Load moving averages
      const movingAvg = await AdvancedAnalyticsService.getMovingAverages(timeRange, 7, 'expenses');
      setMovingAverage(movingAvg);

      // Load spending velocity
      const velocity = await AdvancedAnalyticsService.getSpendingVelocity(timeRange);
      setSpendingVelocity(velocity);

    } catch (error) {
      console.error('Error loading analytics:', error);
      Alert.alert('Fehler', 'Analytics konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, [selectedTimeRange]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    AdvancedAnalyticsService.clearCache();
    await loadAnalytics();
    setRefreshing(false);
  }, [loadAnalytics]);

  const handleCreateCustomReport = () => {
    navigation.navigate('CustomReportBuilder');
  };

  const getPreviousTimeRange = (current: TimeRange, rangeType: string): TimeRange | null => {
    const duration = current.endDate.getTime() - current.startDate.getTime();

    switch (rangeType) {
      case 'thisMonth':
        return {
          startDate: new Date(current.startDate.getFullYear(), current.startDate.getMonth() - 1, 1),
          endDate: new Date(current.startDate.getFullYear(), current.startDate.getMonth(), 0),
          label: 'Letzter Monat'
        };
      case 'thisYear':
        return {
          startDate: new Date(current.startDate.getFullYear() - 1, 0, 1),
          endDate: new Date(current.startDate.getFullYear() - 1, 11, 31),
          label: 'Letztes Jahr'
        };
      default:
        return {
          startDate: new Date(current.startDate.getTime() - duration),
          endDate: new Date(current.endDate.getTime() - duration),
          label: 'Vorheriger Zeitraum'
        };
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, selectedTab === 'trends' && styles.activeTab]}
        onPress={() => setSelectedTab('trends')}
      >
        <Icon name="trending-up" size={20} color={selectedTab === 'trends' ? theme.colors.onPrimary : theme.colors.onSurfaceVariant} />
        <Text style={[styles.tabText, selectedTab === 'trends' && styles.activeTabText]}>
          Trends
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, selectedTab === 'comparison' && styles.activeTab]}
        onPress={() => setSelectedTab('comparison')}
      >
        <Icon name="compare-arrows" size={20} color={selectedTab === 'comparison' ? theme.colors.onPrimary : theme.colors.onSurfaceVariant} />
        <Text style={[styles.tabText, selectedTab === 'comparison' && styles.activeTabText]}>
          Vergleich
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, selectedTab === 'categories' && styles.activeTab]}
        onPress={() => setSelectedTab('categories')}
      >
        <Icon name="pie-chart" size={20} color={selectedTab === 'categories' ? theme.colors.onPrimary : theme.colors.onSurfaceVariant} />
        <Text style={[styles.tabText, selectedTab === 'categories' && styles.activeTabText]}>
          Kategorien
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, selectedTab === 'velocity' && styles.activeTab]}
        onPress={() => setSelectedTab('velocity')}
      >
        <Icon name="speed" size={20} color={selectedTab === 'velocity' ? theme.colors.onPrimary : theme.colors.onSurfaceVariant} />
        <Text style={[styles.tabText, selectedTab === 'velocity' && styles.activeTabText]}>
          Velocity
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderTrendsTab = () => {
    if (!analytics) return null;

    const trendData = ChartUtils.transformTrendData(
      analytics.dailyTotals,
      (date) => ChartUtils.formatDateLabel(date, 'short')
    );

    return (
      <View>
        {/* Summary Cards */}
        <View style={styles.summaryCards}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardTitle}>Einnahmen</Text>
            <Text style={[styles.summaryCardValue, { color: theme.colors.success }]}>
              {formatCurrency(analytics.totalIncome)}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardTitle}>Ausgaben</Text>
            <Text style={[styles.summaryCardValue, { color: theme.colors.error }]}>
              {formatCurrency(analytics.totalExpenses)}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardTitle}>Netto</Text>
            <Text style={[
              styles.summaryCardValue,
              { color: analytics.netAmount >= 0 ? theme.colors.success : theme.colors.error }
            ]}>
              {formatCurrency(analytics.netAmount)}
            </Text>
          </View>
        </View>

        {/* Daily Trend Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Tagestrend</Text>
          <TrendLineChart
            data={trendData}
            style={styles.chart}
          />
        </View>

        {/* Moving Average */}
        {movingAverage && (
          <View style={styles.chartSection}>
            <Text style={styles.chartTitle}>
              7-Tage Durchschnitt (Trend: {movingAverage.trend === 'increasing' ? '↗️' :
                                                movingAverage.trend === 'decreasing' ? '↘️' : '→'})
            </Text>
            <AreaTrendChart
              data={ChartUtils.transformTrendData(
                movingAverage.data,
                (date) => ChartUtils.formatDateLabel(date, 'short')
              )}
              style={styles.chart}
            />
          </View>
        )}
      </View>
    );
  };

  const renderComparisonTab = () => {
    if (!comparison || !analytics) return null;

    const comparisonData = ChartUtils.transformComparisonData(
      analytics.dailyTotals,
      comparison.previous.data.dailyTotals,
      theme
    );

    const changeIcon = comparison.change.trend === 'up' ? '↗️' :
                     comparison.change.trend === 'down' ? '↘️' : '→';
    const changeColor = comparison.change.trend === 'up' ? theme.colors.success :
                       comparison.change.trend === 'down' ? theme.colors.error : theme.colors.onSurfaceVariant;

    return (
      <View>
        {/* Comparison Summary */}
        <View style={styles.comparisonCard}>
          <Text style={styles.comparisonTitle}>Zeitraumvergleich</Text>
          <Text style={styles.comparisonSubtitle}>
            {comparison.current.period.label} vs. {comparison.previous.period.label}
          </Text>

          <View style={styles.comparisonMetrics}>
            <View style={styles.comparisonMetric}>
              <Text style={styles.metricLabel}>Änderung</Text>
              <Text style={[styles.metricValue, { color: changeColor }]}>
                {changeIcon} {formatCurrency(comparison.change.absolute)}
              </Text>
            </View>

            <View style={styles.comparisonMetric}>
              <Text style={styles.metricLabel}>Prozentual</Text>
              <Text style={[styles.metricValue, { color: changeColor }]}>
                {comparison.change.percentage.toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Comparison Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Verlaufsvergleich</Text>
          <MultiLineChart
            data={comparisonData}
            style={styles.chart}
          />
        </View>

        {/* Period Details */}
        <View style={styles.periodComparison}>
          <View style={styles.periodCard}>
            <Text style={styles.periodTitle}>{comparison.current.period.label}</Text>
            <Text style={styles.periodIncome}>
              Einnahmen: {formatCurrency(comparison.current.data.totalIncome)}
            </Text>
            <Text style={styles.periodExpense}>
              Ausgaben: {formatCurrency(comparison.current.data.totalExpenses)}
            </Text>
            <Text style={[
              styles.periodNet,
              { color: comparison.current.data.netAmount >= 0 ? theme.colors.success : theme.colors.error }
            ]}>
              Netto: {formatCurrency(comparison.current.data.netAmount)}
            </Text>
          </View>

          <View style={styles.periodCard}>
            <Text style={styles.periodTitle}>{comparison.previous.period.label}</Text>
            <Text style={styles.periodIncome}>
              Einnahmen: {formatCurrency(comparison.previous.data.totalIncome)}
            </Text>
            <Text style={styles.periodExpense}>
              Ausgaben: {formatCurrency(comparison.previous.data.totalExpenses)}
            </Text>
            <Text style={[
              styles.periodNet,
              { color: comparison.previous.data.netAmount >= 0 ? theme.colors.success : theme.colors.error }
            ]}>
              Netto: {formatCurrency(comparison.previous.data.netAmount)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderCategoriesTab = () => {
    if (!analytics) return null;

    const pieData = ChartUtils.transformCategoryData(
      analytics.categoryBreakdown,
      theme
    );

    return (
      <View>
        {/* Category Pie Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Ausgaben nach Kategorien</Text>
          <CategoryPieChart
            data={pieData}
            style={styles.chart}
          />
        </View>

        {/* Category Details */}
        <View style={styles.categoryDetails}>
          <Text style={styles.sectionTitle}>Kategorie-Details</Text>
          {analytics.categoryBreakdown.map((category, index) => (
            <View key={category.categoryId} style={styles.categoryItem}>
              <View style={styles.categoryHeader}>
                <View style={[
                  styles.categoryColorIndicator,
                  { backgroundColor: category.color || theme.colors.primary }
                ]} />
                <Text style={styles.categoryName}>{category.categoryName}</Text>
                <Text style={styles.categoryPercentage}>
                  {category.percentage.toFixed(1)}%
                </Text>
              </View>

              <View style={styles.categoryMetrics}>
                <Text style={styles.categoryAmount}>
                  {formatCurrency(category.totalAmount)}
                </Text>
                <Text style={styles.categoryCount}>
                  {category.transactionCount} Transaktionen
                </Text>
                <Text style={styles.categoryAverage}>
                  ⌀ {formatCurrency(category.avgAmount)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderVelocityTab = () => {
    if (!spendingVelocity) return null;

    return (
      <View>
        {/* Velocity Summary */}
        <View style={styles.velocityCard}>
          <Text style={styles.velocityTitle}>Ausgaben-Geschwindigkeit</Text>
          <Text style={styles.velocitySubtitle}>
            Aktuelle Ausgabenrate vs. Durchschnitt
          </Text>

          <View style={styles.velocityMetrics}>
            <View style={styles.velocityMetric}>
              <Text style={styles.velocityLabel}>Täglich (aktuell)</Text>
              <Text style={styles.velocityValue}>
                {formatCurrency(spendingVelocity.current)}
              </Text>
            </View>

            <View style={styles.velocityMetric}>
              <Text style={styles.velocityLabel}>Täglich (Durchschnitt)</Text>
              <Text style={styles.velocityValue}>
                {formatCurrency(spendingVelocity.average)}
              </Text>
            </View>

            <View style={styles.velocityMetric}>
              <Text style={styles.velocityLabel}>Trend</Text>
              <Text style={[
                styles.velocityTrend,
                {
                  color: spendingVelocity.trend === 'accelerating' ? theme.colors.error :
                        spendingVelocity.trend === 'decelerating' ? theme.colors.success :
                        theme.colors.onSurfaceVariant
                }
              ]}>
                {spendingVelocity.trend === 'accelerating' ? '📈 Steigend' :
                 spendingVelocity.trend === 'decelerating' ? '📉 Sinkend' :
                 '➡️ Stabil'}
              </Text>
            </View>
          </View>
        </View>

        {/* Velocity Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Ausgaben-Rate Vergleich</Text>
          <SpendingVelocityChart
            current={spendingVelocity.current}
            average={spendingVelocity.average}
            trend={spendingVelocity.trend}
            style={styles.chart}
          />
        </View>

        {/* Projection */}
        <View style={styles.projectionCard}>
          <Text style={styles.projectionTitle}>Monats-Projektion</Text>
          <Text style={styles.projectionSubtitle}>
            Basierend auf aktueller Ausgaben-Rate
          </Text>
          <Text style={styles.projectionAmount}>
            {formatCurrency(spendingVelocity.projection)}
          </Text>
          <Text style={styles.projectionNote}>
            Diese Projektion basiert auf den letzten 7 Tagen
          </Text>
        </View>
      </View>
    );
  };

  const renderContent = () => {
    switch (selectedTab) {
      case 'trends':
        return renderTrendsTab();
      case 'comparison':
        return renderComparisonTab();
      case 'categories':
        return renderCategoriesTab();
      case 'velocity':
        return renderVelocityTab();
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <LoadingOverlay visible={loading} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.timeRangeButton}
          onPress={() => setShowTimeRangeModal(true)}
        >
          <Text style={styles.timeRangeText}>
            {timeRanges[selectedTimeRange]?.label || 'Zeitraum wählen'}
          </Text>
          <Icon name="keyboard-arrow-down" size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.customReportButton}
          onPress={handleCreateCustomReport}
        >
          <Icon name="add-chart" size={20} color={theme.colors.onPrimary} />
        </TouchableOpacity>
      </View>

      {renderTabBar()}

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
        {renderContent()}
      </ScrollView>

      {/* Time Range Modal */}
      <Modal
        visible={showTimeRangeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimeRangeModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Zeitraum auswählen</Text>

            {Object.entries(timeRanges).map(([key, range]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.timeRangeOption,
                  selectedTimeRange === key && styles.selectedTimeRangeOption
                ]}
                onPress={() => {
                  setSelectedTimeRange(key);
                  setShowTimeRangeModal(false);
                }}
              >
                <Text style={[
                  styles.timeRangeOptionText,
                  selectedTimeRange === key && styles.selectedTimeRangeOptionText
                ]}>
                  {range.label}
                </Text>
                {selectedTimeRange === key && (
                  <Icon name="check" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}

            <Button
              title="Abbrechen"
              variant="outline"
              onPress={() => setShowTimeRangeModal(false)}
              style={styles.modalCancelButton}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface
  },
  timeRangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.outline
  },
  timeRangeText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.onSurface,
    marginRight: 8
  },
  customReportButton: {
    backgroundColor: theme.colors.primary,
    padding: 10,
    borderRadius: 8
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 4,
    paddingVertical: 4,
    margin: 16,
    marginBottom: 8,
    borderRadius: 8
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4
  },
  activeTab: {
    backgroundColor: theme.colors.primary
  },
  tabText: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.onSurfaceVariant
  },
  activeTabText: {
    color: theme.colors.onPrimary
  },
  content: {
    flex: 1,
    paddingHorizontal: 16
  },
  summaryCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20
  },
  summaryCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center'
  },
  summaryCardTitle: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 8
  },
  summaryCardValue: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  chartSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 16
  },
  chart: {
    alignItems: 'center'
  },
  comparisonCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 4
  },
  comparisonSubtitle: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 16
  },
  comparisonMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  comparisonMetric: {
    alignItems: 'center'
  },
  metricLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  periodComparison: {
    flexDirection: 'row',
    gap: 12
  },
  periodCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16
  },
  periodTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 12
  },
  periodIncome: {
    fontSize: 12,
    color: theme.colors.success,
    marginBottom: 4
  },
  periodExpense: {
    fontSize: 12,
    color: theme.colors.error,
    marginBottom: 4
  },
  periodNet: {
    fontSize: 14,
    fontWeight: 'bold'
  },
  categoryDetails: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 16
  },
  categoryItem: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  categoryColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12
  },
  categoryName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurface
  },
  categoryPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary
  },
  categoryMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 24
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.onSurface
  },
  categoryCount: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant
  },
  categoryAverage: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant
  },
  velocityCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16
  },
  velocityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 4
  },
  velocitySubtitle: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 16
  },
  velocityMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  velocityMetric: {
    alignItems: 'center'
  },
  velocityLabel: {
    fontSize: 10,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4,
    textAlign: 'center'
  },
  velocityValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.onSurface
  },
  velocityTrend: {
    fontSize: 12,
    fontWeight: '600'
  },
  projectionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center'
  },
  projectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 4
  },
  projectionSubtitle: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 16
  },
  projectionAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 8
  },
  projectionNote: {
    fontSize: 10,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    fontStyle: 'italic'
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 16,
    textAlign: 'center'
  },
  timeRangeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8
  },
  selectedTimeRangeOption: {
    backgroundColor: theme.colors.primaryContainer
  },
  timeRangeOptionText: {
    fontSize: 16,
    color: theme.colors.onSurface
  },
  selectedTimeRangeOptionText: {
    color: theme.colors.onPrimaryContainer,
    fontWeight: '500'
  },
  modalCancelButton: {
    marginTop: 16
  }
});

export default AdvancedReportsScreen;
