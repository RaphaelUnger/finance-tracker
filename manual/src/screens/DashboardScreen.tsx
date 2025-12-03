import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Alert,
  Modal,
  Animated,
} from 'react-native';
import { VictoryChart, VictoryLine, VictoryPie, VictoryBar, VictoryArea, VictoryTheme } from 'victory-native';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { useTheme } from '../hooks/useTheme';
import LoadingScreen from '../components/LoadingScreen';
import Button from '../components/Button';
import { dashboardService } from '../services/dashboardService';
import {
  DashboardSummary,
  WidgetData,
  WidgetType,
  MonthlyStats,
  BalanceWidgetData,
  CategoryBreakdownWidgetData,
  TopCategoriesWidgetData,
  QuickStatsWidgetData,
} from '../types/dashboard';
import { formatCurrency, formatDate, formatPercentage } from '../utils/helpers';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const WIDGET_MARGIN = 8;
const WIDGET_SMALL_WIDTH = (screenWidth - 48) / 2;
const WIDGET_MEDIUM_WIDTH = screenWidth - 32;
const WIDGET_LARGE_WIDTH = screenWidth - 32;

interface DashboardWidgetProps {
  widget: WidgetData;
  onPress?: () => void;
  onRefresh?: () => void;
}

function BalanceWidget({ widget, onPress }: DashboardWidgetProps) {
  const theme = useTheme();
  const data = widget.data as BalanceWidgetData;

  return (
    <TouchableOpacity
      style={[
        styles.widget,
        styles.balanceWidget,
        { backgroundColor: theme.colors.surface, width: WIDGET_MEDIUM_WIDTH }
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.widgetHeader}>
        <Text style={[styles.widgetTitle, { color: theme.colors.text }]}>
          {widget.title}
        </Text>
        <Text style={styles.balanceIcon}>💰</Text>
      </View>

      <Text style={[styles.balanceAmount, { color: data.balance >= 0 ? '#10B981' : '#EF4444' }]}>
        {data.formatted.balance}
      </Text>

      <View style={styles.balanceDetails}>
        <View style={styles.balanceItem}>
          <Text style={styles.balanceLabel}>Einnahmen</Text>
          <Text style={[styles.balanceValue, { color: '#10B981' }]}>
            {data.formatted.income}
          </Text>
        </View>
        <View style={styles.balanceItem}>
          <Text style={styles.balanceLabel}>Ausgaben</Text>
          <Text style={[styles.balanceValue, { color: '#EF4444' }]}>
            {data.formatted.expense}
          </Text>
        </View>
      </View>

      {data.trend && (
        <View style={styles.trendContainer}>
          <Text style={styles.trendIcon}>
            {data.trend.direction === 'up' ? '📈' : data.trend.direction === 'down' ? '📉' : '➡️'}
          </Text>
          <Text style={[
            styles.trendText,
            { color: data.trend.direction === 'up' ? '#10B981' : data.trend.direction === 'down' ? '#EF4444' : theme.colors.textSecondary }
          ]}>
            {data.trend.direction === 'up' ? '+' : data.trend.direction === 'down' ? '-' : ''}
            {data.formatted.trend} ({data.formatted.trendPercent})
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function CategoryBreakdownWidget({ widget, onPress }: DashboardWidgetProps) {
  const theme = useTheme();
  const data = widget.data as CategoryBreakdownWidgetData;

  const chartData = data.chart.data.map((item: any) => ({
    x: item.name,
    y: item.value,
  }));

  return (
    <TouchableOpacity
      style={[
        styles.widget,
        { backgroundColor: theme.colors.surface, width: WIDGET_MEDIUM_WIDTH }
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.widgetHeader}>
        <Text style={[styles.widgetTitle, { color: theme.colors.text }]}>
          {widget.title}
        </Text>
        <Text style={styles.widgetIcon}>📊</Text>
      </View>

      <View style={styles.chartContainer}>
        <VictoryPie
          data={chartData}
          width={WIDGET_MEDIUM_WIDTH - 32}
          height={180}
          colorScale={data.chart.config.colors}
          innerRadius={40}
          labelRadius={({ innerRadius }) => innerRadius as number + 30}
          labelComponent={<></>}
          theme={VictoryTheme.material}
        />
      </View>

      <View style={styles.categoryLegend}>
        {data.categories.slice(0, 4).map((category, index) => (
          <View key={category.categoryId} style={styles.categoryLegendItem}>
            <View style={[
              styles.categoryColorIndicator,
              { backgroundColor: category.categoryColor }
            ]} />
            <Text style={[styles.categoryLegendText, { color: theme.colors.textSecondary }]}>
              {category.categoryName}
            </Text>
            <Text style={[styles.categoryAmount, { color: theme.colors.text }]}>
              {formatCurrency(category.totalExpense)}
            </Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

function TopCategoriesWidget({ widget, onPress }: DashboardWidgetProps) {
  const theme = useTheme();
  const data = widget.data as TopCategoriesWidgetData;

  return (
    <TouchableOpacity
      style={[
        styles.widget,
        { backgroundColor: theme.colors.surface, width: WIDGET_SMALL_WIDTH }
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.widgetHeader}>
        <Text style={[styles.widgetTitle, { color: theme.colors.text }]}>
          Top Ausgaben
        </Text>
        <Text style={styles.widgetIcon}>🏆</Text>
      </View>

      <View style={styles.topCategoriesList}>
        {data.topExpense.slice(0, 5).map((category, index) => (
          <View key={category.categoryId} style={styles.topCategoryItem}>
            <View style={styles.topCategoryRank}>
              <Text style={[styles.rankNumber, { color: theme.colors.textSecondary }]}>
                {index + 1}
              </Text>
            </View>
            <Text style={styles.categoryIcon}>{category.categoryIcon}</Text>
            <View style={styles.topCategoryInfo}>
              <Text style={[styles.categoryName, { color: theme.colors.text }]}>
                {category.categoryName}
              </Text>
              <Text style={[styles.categoryAmount, { color: '#EF4444' }]}>
                {category.formattedAmount}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

function QuickStatsWidget({ widget, onPress }: DashboardWidgetProps) {
  const theme = useTheme();
  const data = widget.data as QuickStatsWidgetData;

  const stats = [
    { label: 'Transaktionen', value: data.formatted.totalTransactions, icon: '🔢' },
    { label: 'Kategorien', value: data.formatted.categoriesUsed, icon: '🗂️' },
    { label: 'Durchschnitt', value: data.formatted.avgTransactionAmount, icon: '📊' },
    { label: 'Höchste', value: data.formatted.topTransactionAmount, icon: '⭐' },
  ];

  return (
    <TouchableOpacity
      style={[
        styles.widget,
        { backgroundColor: theme.colors.surface, width: WIDGET_SMALL_WIDTH }
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.widgetHeader}>
        <Text style={[styles.widgetTitle, { color: theme.colors.text }]}>
          Schnell-Stats
        </Text>
        <Text style={styles.widgetIcon}>⚡</Text>
      </View>

      <View style={styles.quickStatsGrid}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.quickStatItem}>
            <Text style={styles.quickStatIcon}>{stat.icon}</Text>
            <Text style={[styles.quickStatValue, { color: theme.colors.text }]}>
              {stat.value}
            </Text>
            <Text style={[styles.quickStatLabel, { color: theme.colors.textSecondary }]}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

function MonthlyTrendWidget({ widget, onPress }: DashboardWidgetProps) {
  const theme = useTheme();
  const data = widget.data;

  if (!data.chart || !data.chart.data) {
    return (
      <View style={[
        styles.widget,
        { backgroundColor: theme.colors.surface, width: WIDGET_LARGE_WIDTH }
      ]}>
        <Text style={[styles.widgetTitle, { color: theme.colors.text }]}>
          Monatstrend
        </Text>
        <Text style={[styles.noDataText, { color: theme.colors.textSecondary }]}>
          Keine Daten verfügbar
        </Text>
      </View>
    );
  }

  const chartData = data.chart.data.map((item: any) => ({
    x: item.name,
    y: item.income - item.expense,
  }));

  return (
    <TouchableOpacity
      style={[
        styles.widget,
        { backgroundColor: theme.colors.surface, width: WIDGET_LARGE_WIDTH }
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.widgetHeader}>
        <Text style={[styles.widgetTitle, { color: theme.colors.text }]}>
          6-Monats-Trend
        </Text>
        <Text style={styles.widgetIcon}>📈</Text>
      </View>

      <View style={styles.chartContainer}>
        <VictoryChart
          width={WIDGET_LARGE_WIDTH - 32}
          height={200}
          theme={VictoryTheme.material}
          padding={{ left: 60, top: 20, right: 40, bottom: 40 }}
        >
          <VictoryArea
            data={chartData}
            style={{
              data: { fill: theme.colors.primary + '40', stroke: theme.colors.primary, strokeWidth: 2 }
            }}
            animate={{ duration: 1000 }}
          />
        </VictoryChart>
      </View>

      <View style={styles.trendSummary}>
        <Text style={[styles.trendDescription, { color: theme.colors.textSecondary }]}>
          Netto-Cashflow-Entwicklung über die letzten 6 Monate
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function WelcomeHeader() {
  const theme = useTheme();
  const now = new Date();

  const getGreeting = () => {
    const hour = now.getHours();
    if (hour < 12) return '☀️ Guten Morgen';
    if (hour < 18) return '🌤️ Guten Tag';
    return '🌙 Guten Abend';
  };

  return (
    <View style={[styles.welcomeHeader, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.greetingText, { color: theme.colors.text }]}>
        {getGreeting()}
      </Text>
      <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>
        {now.toLocaleDateString('de-DE', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })}
      </Text>
    </View>
  );
}

function QuickActionBar({ onAction }: { onAction: (action: string) => void }) {
  const theme = useTheme();

  const actions = [
    { id: 'add_income', icon: '💰', label: 'Einnahme', color: '#10B981' },
    { id: 'add_expense', icon: '💸', label: 'Ausgabe', color: '#EF4444' },
    { id: 'scan_receipt', icon: '📸', label: 'Beleg', color: '#6366F1' },
    { id: 'view_reports', icon: '📊', label: 'Berichte', color: '#8B5CF6' },
  ];

  return (
    <View style={styles.quickActionBar}>
      {actions.map((action) => (
        <TouchableOpacity
          key={action.id}
          style={[styles.quickActionButton, { backgroundColor: action.color + '20' }]}
          onPress={() => onAction(action.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.actionIcon}>{action.icon}</Text>
          <Text style={[styles.actionLabel, { color: action.color }]}>
            {action.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function DashboardScreen() {
  const dispatch = useAppDispatch();
  const theme = useTheme();

  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  const loadDashboardData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      setError(null);

      const data = await dashboardService.getDashboardSummary({
        timeRange: selectedTimeRange,
      });

      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedTimeRange]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    dashboardService.clearCache();
    await loadDashboardData(false);
  }, [loadDashboardData]);

  const handleQuickAction = useCallback((action: string) => {
    switch (action) {
      case 'add_income':
      case 'add_expense':
        Alert.alert('Info', 'Transaktions-Feature wird in der nächsten Version verfügbar sein.');
        break;
      case 'scan_receipt':
        Alert.alert('Info', 'OCR-Feature wird in Sprint 8 implementiert.');
        break;
      case 'view_reports':
        Alert.alert('Info', 'Navigiere zum Reports-Tab für detaillierte Berichte.');
        break;
    }
  }, []);

  const handleTimeRangeChange = useCallback((range: typeof selectedTimeRange) => {
    if (range !== selectedTimeRange) {
      setSelectedTimeRange(range);
    }
  }, [selectedTimeRange]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      if (!isLoading && !isRefreshing) {
        handleRefresh();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [handleRefresh, isLoading, isRefreshing]);

  if (isLoading && !dashboardData) {
    return <LoadingScreen />;
  }

  const renderWidget = (widget: WidgetData) => {
    switch (widget.type) {
      case 'balance':
        return <BalanceWidget key={widget.id} widget={widget} />;
      case 'categoryBreakdown':
        return <CategoryBreakdownWidget key={widget.id} widget={widget} />;
      case 'topCategories':
        return <TopCategoriesWidget key={widget.id} widget={widget} />;
      case 'quickStats':
        return <QuickStatsWidget key={widget.id} widget={widget} />;
      case 'trendChart':
        return <MonthlyTrendWidget key={widget.id} widget={widget} />;
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Time Range Selector */}
      <View style={styles.timeRangeSelector}>
        {(['week', 'month', 'quarter', 'year'] as const).map((range) => (
          <TouchableOpacity
            key={range}
            style={[
              styles.timeRangeButton,
              {
                backgroundColor: selectedTimeRange === range
                  ? theme.colors.primary
                  : theme.colors.surface,
              }
            ]}
            onPress={() => handleTimeRangeChange(range)}
          >
            <Text style={[
              styles.timeRangeText,
              {
                color: selectedTimeRange === range
                  ? '#FFFFFF'
                  : theme.colors.text
              }
            ]}>
              {range === 'week' ? 'Woche' :
               range === 'month' ? 'Monat' :
               range === 'quarter' ? 'Quartal' : 'Jahr'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Welcome Header */}
        <WelcomeHeader />

        {/* Quick Action Bar */}
        <QuickActionBar onAction={handleQuickAction} />

        {/* Error State */}
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: theme.colors.error + '10' }]}>
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {error}
            </Text>
            <Button
              title="Erneut versuchen"
              onPress={() => loadDashboardData()}
              style={styles.retryButton}
            />
          </View>
        )}

        {/* Dashboard Widgets */}
        {dashboardData && (
          <View style={styles.widgetsContainer}>
            {dashboardData.widgets?.map(renderWidget)}
          </View>
        )}

        {/* Performance Info */}
        {dashboardData && __DEV__ && (
          <View style={[styles.performanceInfo, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.performanceText, { color: theme.colors.textSecondary }]}>
              Performance: {dashboardData.performance.dataPoints} Datenpunkte,
              {dashboardData.performance.categories} Kategorien,
              Renderzeit: {dashboardData.performance.renderTime}ms
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  timeRangeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  timeRangeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  welcomeHeader: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  greetingText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
  },
  quickActionBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  widgetsContainer: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: WIDGET_MARGIN,
  },
  widget: {
    padding: 16,
    borderRadius: 12,
    marginBottom: WIDGET_MARGIN,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  balanceWidget: {
    alignItems: 'center',
  },
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
  },
  widgetTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  widgetIcon: {
    fontSize: 20,
  },
  balanceIcon: {
    fontSize: 24,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  balanceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 12,
  },
  balanceItem: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendIcon: {
    fontSize: 16,
  },
  trendText: {
    fontSize: 14,
    fontWeight: '500',
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  categoryLegend: {
    marginTop: 8,
  },
  categoryLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryLegendText: {
    flex: 1,
    fontSize: 12,
  },
  categoryAmount: {
    fontSize: 12,
    fontWeight: '600',
  },
  topCategoriesList: {
    marginTop: 8,
  },
  topCategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  topCategoryRank: {
    width: 20,
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  categoryIcon: {
    fontSize: 16,
    marginHorizontal: 8,
  },
  topCategoryInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 12,
    flex: 1,
  },
  quickStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  quickStatItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickStatIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  quickStatValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  quickStatLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  trendSummary: {
    marginTop: 8,
  },
  trendDescription: {
    fontSize: 12,
    textAlign: 'center',
  },
  noDataText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
  errorContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
  },
  performanceInfo: {
    margin: 16,
    padding: 8,
    borderRadius: 4,
  },
  performanceText: {
    fontSize: 10,
    textAlign: 'center',
  },
});
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const currentMonthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth &&
             transactionDate.getFullYear() === currentYear &&
             !t.deletedAt;
    });

    const monthlyIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = monthlyIncome - monthlyExpenses;

    const recentTransactions = transactions
      .filter(t => !t.deletedAt)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    return {
      balance,
      monthlyIncome,
      monthlyExpenses,
      recentTransactions,
    };
  };

  const metrics = calculateMetrics();

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add_transaction':
        // TODO: Navigate to TransactionForm
        navigation.navigate('Transactions');
        break;
      case 'scan_receipt':
        // TODO: Navigate to ReceiptScanner
        navigation.navigate('Transactions');
        break;
      case 'view_reports':
        navigation.navigate('Reports');
        break;
      default:
        break;
    }
  };

  const handleViewAllTransactions = () => {
    navigation.navigate('Transactions');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContainer: {
      padding: theme.spacing.md,
    },
    welcomeText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    dateText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.lg,
    },
    balanceCard: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      ...theme.shadows.md,
    },
    balanceLabel: {
      color: '#FFFFFF',
      fontSize: 16,
      opacity: 0.9,
    },
    balanceAmount: {
      color: '#FFFFFF',
      fontSize: 32,
      fontWeight: 'bold',
      marginTop: theme.spacing.xs,
    },
    balanceSubtext: {
      color: '#FFFFFF',
      fontSize: 14,
      opacity: 0.8,
      marginTop: theme.spacing.xs,
    },
    statsContainer: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      ...theme.shadows.sm,
    },
    statLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    statAmount: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
    },
    statAmountIncome: {
      color: theme.colors.income,
    },
    statAmountExpense: {
      color: theme.colors.expense,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    transactionCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      ...theme.shadows.sm,
    },
    transactionIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.md,
    },
    transactionContent: {
      flex: 1,
    },
    transactionDescription: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.text,
      marginBottom: 2,
    },
    transactionDate: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    transactionAmount: {
      fontSize: 16,
      fontWeight: '600',
      marginLeft: theme.spacing.md,
    },
    quickActions: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    quickActionButton: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      alignItems: 'center',
      ...theme.shadows.sm,
    },
    quickActionIcon: {
      marginBottom: theme.spacing.xs,
    },
    quickActionText: {
      fontSize: 12,
      color: theme.colors.text,
      textAlign: 'center',
      fontWeight: '500',
    },
    viewAllButton: {
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
    },
    viewAllText: {
      color: theme.colors.primary,
      fontSize: 16,
      fontWeight: '500',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: theme.spacing.xl,
    },
    emptyStateText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: theme.spacing.sm,
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: theme.spacing.xs,
    },
  });

  const getCurrentDateString = () => {
    return new Date().toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContainer}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={loadDashboardData}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
    >
      {/* Welcome Header */}
      <Text style={styles.welcomeText}>Welcome back!</Text>
      <Text style={styles.dateText}>{getCurrentDateString()}</Text>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={styles.balanceAmount}>
          {formatCurrency(metrics.balance, currency as any)}
        </Text>
        <Text style={styles.balanceSubtext}>
          {metrics.balance > 0 ? 'You\'re doing great!' : 'Keep tracking your expenses'}
        </Text>
      </View>

      {/* Monthly Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>This Month Income</Text>
          <Text style={[styles.statAmount, styles.statAmountIncome]}>
            {formatCurrency(metrics.monthlyIncome, currency as any)}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>This Month Expenses</Text>
          <Text style={[styles.statAmount, styles.statAmountExpense]}>
            {formatCurrency(metrics.monthlyExpenses, currency as any)}
          </Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => handleQuickAction('add_transaction')}
        >
          <Icon name="add" size={24} color={theme.colors.primary} style={styles.quickActionIcon} />
          <Text style={styles.quickActionText}>Add Transaction</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => handleQuickAction('scan_receipt')}
        >
          <Icon name="camera-alt" size={24} color={theme.colors.primary} style={styles.quickActionIcon} />
          <Text style={styles.quickActionText}>Scan Receipt</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => handleQuickAction('view_reports')}
        >
          <Icon name="assessment" size={24} color={theme.colors.primary} style={styles.quickActionIcon} />
          <Text style={styles.quickActionText}>View Reports</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Transactions */}
      <Text style={styles.sectionTitle}>Recent Transactions</Text>
      {metrics.recentTransactions.length > 0 ? (
        <>
          {metrics.recentTransactions.map((transaction) => (
            <TouchableOpacity key={transaction.id} style={styles.transactionCard}>
              <View style={styles.transactionIcon}>
                <Icon
                  name={transaction.type === 'income' ? "trending-up" : "trending-down"}
                  size={20}
                  color={transaction.type === 'income' ? theme.colors.income : theme.colors.expense}
                />
              </View>
              <View style={styles.transactionContent}>
                <Text style={styles.transactionDescription}>{transaction.description}</Text>
                <Text style={styles.transactionDate}>
                  {new Date(transaction.date).toLocaleDateString()}
                </Text>
              </View>
              <Text style={[
                styles.transactionAmount,
                { color: transaction.type === 'income' ? theme.colors.income : theme.colors.expense }
              ]}>
                {transaction.type === 'income' ? '+' : '-'}
                {formatCurrency(transaction.amount, currency as any)}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAllTransactions}>
            <Text style={styles.viewAllText}>View All Transactions</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.emptyState}>
          <Icon name="receipt-long" size={48} color={theme.colors.textSecondary} />
          <Text style={styles.emptyStateText}>No transactions yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Start by adding your first transaction
          </Text>
        </View>
      )}
    </ScrollView>
  );
};
