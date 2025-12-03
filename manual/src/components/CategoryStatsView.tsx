import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { useTheme } from '../hooks/useTheme';
import Button from './Button';
import LoadingScreen from './LoadingScreen';
import {
  fetchCategoryStats,
  showStatsModal,
  hideStatsModal,
} from '../store/slices/categoriesSlice';
import { CategoryStats, CategoryType } from '../types/transaction';
import { formatCurrency, formatDate } from '../utils/helpers';

const { width: screenWidth } = Dimensions.get('window');

interface CategoryStatsCardProps {
  stats: CategoryStats;
  rank: number;
  onPress: () => void;
}

function CategoryStatsCard({ stats, rank, onPress }: CategoryStatsCardProps) {
  const theme = useTheme();

  const isIncome = stats.categoryType === 'income';
  const displayAmount = isIncome ? stats.totalIncome : stats.totalExpense;
  const backgroundColor = isIncome ? '#10B981' : '#EF4444';

  return (
    <TouchableOpacity
      style={[styles.statsCard, { backgroundColor: theme.colors.surface }]}
      onPress={onPress}
    >
      <View style={styles.rankBadge}>
        <Text style={[styles.rankText, { color: theme.colors.textSecondary }]}>
          #{rank}
        </Text>
      </View>

      <View style={styles.categoryHeader}>
        <View
          style={[
            styles.categoryIconContainer,
            { backgroundColor: stats.categoryColor + '20' }
          ]}
        >
          <Text style={[styles.categoryIcon, { color: stats.categoryColor }]}>
            {stats.categoryIcon}
          </Text>
        </View>

        <View style={styles.categoryInfo}>
          <Text style={[styles.categoryName, { color: theme.colors.text }]}>
            {stats.categoryName}
          </Text>
          <Text style={[styles.categoryType, { color: theme.colors.textSecondary }]}>
            {stats.categoryType === 'income' ? 'Einnahmen' :
             stats.categoryType === 'expense' ? 'Ausgaben' : 'Beide'}
          </Text>
        </View>
      </View>

      <View style={styles.statsContent}>
        <View style={styles.mainStat}>
          <Text style={[styles.mainAmount, { color: backgroundColor }]}>
            {formatCurrency(displayAmount)}
          </Text>
          <Text style={[styles.transactionCount, { color: theme.colors.textSecondary }]}>
            {stats.transactionCount} Transaktionen
          </Text>
        </View>

        <View style={styles.additionalStats}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Durchschnitt
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {formatCurrency(stats.averageAmount)}
            </Text>
          </View>

          {stats.percentage && (
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Anteil
              </Text>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {stats.percentage.toFixed(1)}%
              </Text>
            </View>
          )}
        </View>
      </View>

      {stats.trend && (
        <View style={styles.trendContainer}>
          <Text style={[
            styles.trendText,
            {
              color: stats.trend === 'up' ? '#10B981' :
                     stats.trend === 'down' ? '#EF4444' :
                     theme.colors.textSecondary
            }
          ]}>
            {stats.trend === 'up' ? '📈 Steigend' :
             stats.trend === 'down' ? '📉 Fallend' :
             '➡️ Stabil'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

interface CategoryDetailModalProps {
  visible: boolean;
  stats: CategoryStats | null;
  onClose: () => void;
}

function CategoryDetailModal({ visible, stats, onClose }: CategoryDetailModalProps) {
  const theme = useTheme();

  if (!stats) return null;

  const isIncome = stats.categoryType === 'income';
  const displayAmount = isIncome ? stats.totalIncome : stats.totalExpense;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet">
      <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.closeButton, { color: theme.colors.textSecondary }]}>
              Schließen
            </Text>
          </TouchableOpacity>

          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
            Kategorie-Details
          </Text>

          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Category Header */}
          <View style={styles.detailHeader}>
            <View
              style={[
                styles.detailIcon,
                { backgroundColor: stats.categoryColor + '20' }
              ]}
            >
              <Text style={[styles.detailIconText, { color: stats.categoryColor }]}>
                {stats.categoryIcon}
              </Text>
            </View>

            <Text style={[styles.detailName, { color: theme.colors.text }]}>
              {stats.categoryName}
            </Text>

            <Text style={[styles.detailType, { color: theme.colors.textSecondary }]}>
              {stats.categoryType === 'income' ? 'Einnahmen-Kategorie' :
               stats.categoryType === 'expense' ? 'Ausgaben-Kategorie' : 'Universal-Kategorie'}
            </Text>
          </View>

          {/* Main Statistics */}
          <View style={[styles.statsSection, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Übersicht
            </Text>

            <View style={styles.detailStatsGrid}>
              <View style={styles.detailStatItem}>
                <Text style={[styles.detailStatValue, { color: isIncome ? '#10B981' : '#EF4444' }]}>
                  {formatCurrency(displayAmount)}
                </Text>
                <Text style={[styles.detailStatLabel, { color: theme.colors.textSecondary }]}>
                  Gesamtbetrag
                </Text>
              </View>

              <View style={styles.detailStatItem}>
                <Text style={[styles.detailStatValue, { color: theme.colors.text }]}>
                  {stats.transactionCount}
                </Text>
                <Text style={[styles.detailStatLabel, { color: theme.colors.textSecondary }]}>
                  Transaktionen
                </Text>
              </View>

              <View style={styles.detailStatItem}>
                <Text style={[styles.detailStatValue, { color: theme.colors.text }]}>
                  {formatCurrency(stats.averageAmount)}
                </Text>
                <Text style={[styles.detailStatLabel, { color: theme.colors.textSecondary }]}>
                  Durchschnitt
                </Text>
              </View>

              <View style={styles.detailStatItem}>
                <Text style={[styles.detailStatValue, { color: theme.colors.text }]}>
                  {stats.percentage ? `${stats.percentage.toFixed(1)}%` : '—'}
                </Text>
                <Text style={[styles.detailStatLabel, { color: theme.colors.textSecondary }]}>
                  Anteil
                </Text>
              </View>
            </View>
          </View>

          {/* Amount Range */}
          <View style={[styles.statsSection, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Betragsspanne
            </Text>

            <View style={styles.rangeStats}>
              <View style={styles.rangeItem}>
                <Text style={[styles.rangeLabel, { color: theme.colors.textSecondary }]}>
                  Minimum
                </Text>
                <Text style={[styles.rangeValue, { color: theme.colors.text }]}>
                  {formatCurrency(stats.minAmount)}
                </Text>
              </View>

              <View style={styles.rangeItem}>
                <Text style={[styles.rangeLabel, { color: theme.colors.textSecondary }]}>
                  Maximum
                </Text>
                <Text style={[styles.rangeValue, { color: theme.colors.text }]}>
                  {formatCurrency(stats.maxAmount)}
                </Text>
              </View>
            </View>
          </View>

          {/* Time Range */}
          {stats.firstTransactionDate && stats.lastTransactionDate && (
            <View style={[styles.statsSection, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Aktivitätszeitraum
              </Text>

              <View style={styles.timeRange}>
                <View style={styles.timeItem}>
                  <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>
                    Erste Transaktion
                  </Text>
                  <Text style={[styles.timeValue, { color: theme.colors.text }]}>
                    {formatDate(stats.firstTransactionDate)}
                  </Text>
                </View>

                <View style={styles.timeItem}>
                  <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>
                    Letzte Transaktion
                  </Text>
                  <Text style={[styles.timeValue, { color: theme.colors.text }]}>
                    {formatDate(stats.lastTransactionDate)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Monthly Average */}
          {stats.monthlyAverage && (
            <View style={[styles.statsSection, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Monatlicher Durchschnitt
              </Text>

              <Text style={[styles.monthlyAverage, { color: theme.colors.text }]}>
                {formatCurrency(stats.monthlyAverage)}
              </Text>
              <Text style={[styles.monthlyAverageLabel, { color: theme.colors.textSecondary }]}>
                pro Monat
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

interface CategoryStatsViewProps {
  dateRange?: {
    start: number;
    end: number;
  };
  categoryType?: CategoryType;
  maxItems?: number;
}

export default function CategoryStatsView({
  dateRange,
  categoryType,
  maxItems = 10
}: CategoryStatsViewProps) {
  const dispatch = useAppDispatch();
  const theme = useTheme();

  const {
    categoryStats,
    isLoading,
    error,
    showStatsModal: showModal
  } = useAppSelector(state => state.categories);

  const [selectedStats, setSelectedStats] = useState<CategoryStats | null>(null);
  const [sortBy, setSortBy] = useState<'amount' | 'count' | 'average'>('amount');

  useEffect(() => {
    loadCategoryStats();
  }, [dispatch, dateRange?.start, dateRange?.end]);

  const loadCategoryStats = async () => {
    try {
      await dispatch(fetchCategoryStats({
        startDate: dateRange?.start,
        endDate: dateRange?.end,
      })).unwrap();
    } catch (error) {
      console.error('Failed to load category stats:', error);
    }
  };

  const filteredStats = categoryStats
    .filter(stats => {
      if (categoryType && stats.categoryType !== categoryType && stats.categoryType !== 'both') {
        return false;
      }
      return true;
    })
    .slice(0, maxItems);

  const sortedStats = [...filteredStats].sort((a, b) => {
    switch (sortBy) {
      case 'count':
        return b.transactionCount - a.transactionCount;
      case 'average':
        return b.averageAmount - a.averageAmount;
      default: // amount
        const aAmount = a.categoryType === 'income' ? a.totalIncome : a.totalExpense;
        const bAmount = b.categoryType === 'income' ? b.totalIncome : b.totalExpense;
        return bAmount - aAmount;
    }
  });

  // Calculate percentages
  const totalAmount = sortedStats.reduce((sum, stats) => {
    return sum + (stats.categoryType === 'income' ? stats.totalIncome : stats.totalExpense);
  }, 0);

  const statsWithPercentage = sortedStats.map(stats => {
    const amount = stats.categoryType === 'income' ? stats.totalIncome : stats.totalExpense;
    return {
      ...stats,
      percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
    };
  });

  const handleStatsPress = (stats: CategoryStats) => {
    setSelectedStats(stats);
    dispatch(showStatsModal());
  };

  const handleCloseModal = () => {
    setSelectedStats(null);
    dispatch(hideStatsModal());
  };

  if (isLoading && categoryStats.length === 0) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {error}
        </Text>
        <Button
          title="Erneut versuchen"
          onPress={loadCategoryStats}
          style={styles.retryButton}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Kategorie-Statistiken
        </Text>

        <View style={styles.sortOptions}>
          {[
            { key: 'amount', label: 'Betrag' },
            { key: 'count', label: 'Anzahl' },
            { key: 'average', label: 'Ø' },
          ].map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.sortButton,
                {
                  backgroundColor: sortBy === option.key
                    ? theme.colors.primary
                    : theme.colors.surface,
                  borderColor: theme.colors.border,
                }
              ]}
              onPress={() => setSortBy(option.key as any)}
            >
              <Text style={[
                styles.sortButtonText,
                {
                  color: sortBy === option.key
                    ? '#FFFFFF'
                    : theme.colors.text
                }
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Stats List */}
      <ScrollView style={styles.statsList} showsVerticalScrollIndicator={false}>
        {statsWithPercentage.map((stats, index) => (
          <CategoryStatsCard
            key={stats.categoryId}
            stats={stats}
            rank={index + 1}
            onPress={() => handleStatsPress(stats)}
          />
        ))}

        {statsWithPercentage.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              Keine Kategorie-Statistiken verfügbar
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
              Fügen Sie Transaktionen hinzu, um Statistiken zu sehen
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Detail Modal */}
      <CategoryDetailModal
        visible={showModal}
        stats={selectedStats}
        onClose={handleCloseModal}
      />
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
    paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  sortOptions: {
    flexDirection: 'row',
    gap: 4,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statsList: {
    flex: 1,
    padding: 16,
  },
  statsCard: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  rankBadge: {
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '500',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryIcon: {
    fontSize: 18,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  categoryType: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  statsContent: {
    marginBottom: 8,
  },
  mainStat: {
    marginBottom: 8,
  },
  mainAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  transactionCount: {
    fontSize: 14,
  },
  additionalStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  trendContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    fontSize: 16,
    width: 60,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  detailHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  detailIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailIconText: {
    fontSize: 24,
  },
  detailName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  detailType: {
    fontSize: 14,
    textAlign: 'center',
  },
  statsSection: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  detailStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailStatItem: {
    width: '50%',
    marginBottom: 16,
    alignItems: 'center',
  },
  detailStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  detailStatLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  rangeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  rangeItem: {
    alignItems: 'center',
  },
  rangeLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  rangeValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  timeRange: {
    gap: 12,
  },
  timeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 14,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  monthlyAverage: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  monthlyAverageLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
});
