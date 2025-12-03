import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { useTheme } from '../../hooks/useTheme';
import LoadingScreen from '../LoadingScreen';
import { Transaction, TransactionFilters, TransactionSortOptions } from '../../types/transaction';
import {
  fetchTransactions,
  deleteTransaction,
  setCurrentPage,
  clearError,
  resetTransactions,
} from '../../store/slices/transactionsSlice';
import { fetchCategories } from '../../store/slices/categoriesSlice';
import {
  formatCurrency,
  formatDate,
  getRelativeDate
} from '../../utils/helpers';

interface TransactionListProps {
  filters?: TransactionFilters;
  sortOptions?: TransactionSortOptions;
  onTransactionPress?: (transaction: Transaction) => void;
  onAddPress?: () => void;
  showAddButton?: boolean;
}

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: () => void;
  onDelete?: () => void;
}

function TransactionItem({ transaction, onPress, onDelete }: TransactionItemProps) {
  const theme = useTheme();
  const { categories } = useAppSelector(state => state.categories);

  const category = categories.find(c => c.id === transaction.categoryId);
  const isIncome = transaction.type === 'income';

  const handleLongPress = () => {
    Alert.alert(
      'Transaktion',
      'Was möchten Sie tun?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Bearbeiten', onPress },
        { text: 'Löschen', onPress: onDelete, style: 'destructive' },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.transactionItem,
        {
          backgroundColor: theme.colors.surface,
          borderLeftColor: category?.color || theme.colors.border,
        }
      ]}
      onPress={onPress}
      onLongPress={handleLongPress}
    >
      <View style={styles.transactionLeft}>
        <View style={styles.categoryInfo}>
          {category && (
            <Text style={styles.categoryIcon}>{category.icon}</Text>
          )}
          <View style={styles.transactionDetails}>
            <Text style={[styles.description, { color: theme.colors.text }]}>
              {transaction.description}
            </Text>
            <Text style={[styles.categoryName, { color: theme.colors.textSecondary }]}>
              {category?.name || 'Unbekannte Kategorie'}
            </Text>
          </View>
        </View>
        <Text style={[styles.date, { color: theme.colors.textSecondary }]}>
          {getRelativeDate(transaction.date)}
        </Text>
      </View>

      <View style={styles.transactionRight}>
        <Text style={[
          styles.amount,
          {
            color: isIncome ? theme.colors.success : theme.colors.error
          }
        ]}>
          {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
        </Text>
        {transaction.notes && (
          <Text style={[styles.notes, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            {transaction.notes}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function TransactionList({
  filters,
  sortOptions,
  onTransactionPress,
  onAddPress,
  showAddButton = true,
}: TransactionListProps) {
  const dispatch = useAppDispatch();
  const theme = useTheme();

  const {
    transactions,
    loading,
    error,
    currentPage,
    hasMore,
    totalCount
  } = useAppSelector(state => state.transactions);

  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    dispatch(fetchCategories());
    loadTransactions(true);
  }, [dispatch]);

  useEffect(() => {
    if (filters || sortOptions) {
      dispatch(resetTransactions());
      loadTransactions(true);
    }
  }, [filters, sortOptions, dispatch]);

  useEffect(() => {
    if (error) {
      Alert.alert('Fehler', error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const loadTransactions = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
      await dispatch(fetchTransactions({
        filters,
        sortOptions,
        refresh: true
      }));
      setRefreshing(false);
    } else {
      setLoadingMore(true);
      await dispatch(fetchTransactions({
        filters,
        sortOptions,
        page: currentPage + 1
      }));
      setLoadingMore(false);
    }
  }, [dispatch, filters, sortOptions, currentPage]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading && !loadingMore) {
      loadTransactions(false);
    }
  }, [hasMore, loading, loadingMore, loadTransactions]);

  const handleRefresh = useCallback(() => {
    loadTransactions(true);
  }, [loadTransactions]);

  const handleDeleteTransaction = useCallback(async (transaction: Transaction) => {
    Alert.alert(
      'Transaktion löschen',
      `Möchten Sie die Transaktion "${transaction.description}" wirklich löschen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteTransaction(transaction.id)).unwrap();
              Alert.alert('Erfolg', 'Transaktion wurde gelöscht');
            } catch (error) {
              // Error is handled by Redux
            }
          },
        },
      ]
    );
  }, [dispatch]);

  const renderTransactionItem = useCallback(({ item }: { item: Transaction }) => (
    <TransactionItem
      transaction={item}
      onPress={() => onTransactionPress?.(item)}
      onDelete={() => handleDeleteTransaction(item)}
    />
  ), [onTransactionPress, handleDeleteTransaction]);

  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Weitere Transaktionen laden...
        </Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        Keine Transaktionen
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        {filters && Object.keys(filters).length > 0
          ? 'Keine Transaktionen für die gewählten Filter gefunden'
          : 'Fügen Sie Ihre erste Transaktion hinzu'}
      </Text>
      {showAddButton && onAddPress && (
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          onPress={onAddPress}
        >
          <Text style={styles.addButtonText}>Erste Transaktion hinzufügen</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
        Transaktionen
      </Text>
      {totalCount > 0 && (
        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
          {totalCount} Transaktion{totalCount !== 1 ? 'en' : ''}
        </Text>
      )}
    </View>
  );

  if (loading && transactions.length === 0) {
    return <LoadingScreen />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={transactions}
        renderItem={renderTransactionItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        contentContainerStyle={[
          styles.listContent,
          transactions.length === 0 && styles.emptyContent
        ]}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={20}
        updateCellsBatchingPeriod={50}
        windowSize={10}
      />

      {showAddButton && onAddPress && transactions.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={onAddPress}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  emptyContent: {
    flexGrow: 1,
  },
  header: {
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionLeft: {
    flex: 1,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  categoryName: {
    fontSize: 14,
  },
  date: {
    fontSize: 12,
    marginTop: 4,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  notes: {
    fontSize: 12,
    maxWidth: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  addButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabIcon: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
});
