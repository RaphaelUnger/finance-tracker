import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { useTheme } from '../hooks/useTheme';
import LoadingScreen from '../components/LoadingScreen';
import Button from '../components/Button';
import TransactionForm from '../components/TransactionForm';
import TransactionFilterBar from '../components/TransactionFilterBar';
import CategoryManagement from '../components/CategoryManagement';
import {
  fetchTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  setTransactionFilter,
  clearTransactionFilter,
  showCreateModal,
  hideCreateModal,
  showEditModal,
  hideEditModal,
} from '../store/slices/transactionsSlice';
import {
  fetchCategories,
  fetchPopularCategories,
} from '../store/slices/categoriesSlice';
import {
  Transaction,
  TransactionFilter,
  CreateTransactionInput,
  UpdateTransactionInput,
  Category,
} from '../types/transaction';
import { formatCurrency, formatDate } from '../utils/helpers';

interface TransactionItemProps {
  transaction: Transaction;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function TransactionItem({ transaction, onPress, onEdit, onDelete }: TransactionItemProps) {
  const theme = useTheme();
  const { categories } = useAppSelector(state => state.categories);

  const category = categories.find(cat => cat.id === transaction.categoryId);
  const isIncome = transaction.type === 'income';

  const handleLongPress = () => {
    Alert.alert(
      'Transaktion',
      transaction.description,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Bearbeiten', onPress: onEdit },
        { text: 'Löschen', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={[styles.transactionItem, { backgroundColor: theme.colors.surface }]}
      onPress={onPress}
      onLongPress={handleLongPress}
    >
      <View style={styles.transactionHeader}>
        {category && (
          <View
            style={[
              styles.categoryIcon,
              { backgroundColor: category.color + '20' }
            ]}
          >
            <Text style={[styles.categoryIconText, { color: category.color }]}>
              {category.icon}
            </Text>
          </View>
        )}

        <View style={styles.transactionInfo}>
          <Text style={[styles.transactionDescription, { color: theme.colors.text }]}>
            {transaction.description}
          </Text>

          <View style={styles.transactionMeta}>
            <Text style={[styles.transactionDate, { color: theme.colors.textSecondary }]}>
              {formatDate(transaction.date)}
            </Text>

            {category && (
              <>
                <Text style={[styles.metaSeparator, { color: theme.colors.textSecondary }]}>•</Text>
                <Text style={[styles.categoryName, { color: theme.colors.textSecondary }]}>
                  {category.name}
                </Text>
              </>
            )}

            {transaction.notes && (
              <>
                <Text style={[styles.metaSeparator, { color: theme.colors.textSecondary }]}>•</Text>
                <Text style={[styles.hasNotes, { color: theme.colors.primary }]}>
                  📝
                </Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.amountContainer}>
          <Text style={[
            styles.transactionAmount,
            {
              color: isIncome ? '#10B981' : '#EF4444',
            }
          ]}>
            {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
          </Text>
        </View>
      </View>

      {transaction.notes && (
        <View style={styles.notesContainer}>
          <Text style={[styles.notesText, { color: theme.colors.textSecondary }]}>
            {transaction.notes}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

interface TransactionsSummaryProps {
  transactions: Transaction[];
  filter: TransactionFilter;
}

function TransactionsSummary({ transactions, filter }: TransactionsSummaryProps) {
  const theme = useTheme();

  const summary = transactions.reduce(
    (acc, transaction) => {
      if (transaction.type === 'income') {
        acc.totalIncome += transaction.amount;
      } else {
        acc.totalExpense += transaction.amount;
      }
      acc.count += 1;
      return acc;
    },
    { totalIncome: 0, totalExpense: 0, count: 0 }
  );

  const netAmount = summary.totalIncome - summary.totalExpense;

  return (
    <View style={[styles.summaryContainer, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
            Einnahmen
          </Text>
          <Text style={[styles.summaryAmount, { color: '#10B981' }]}>
            {formatCurrency(summary.totalIncome)}
          </Text>
        </View>

        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
            Ausgaben
          </Text>
          <Text style={[styles.summaryAmount, { color: '#EF4444' }]}>
            {formatCurrency(summary.totalExpense)}
          </Text>
        </View>

        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
            Saldo
          </Text>
          <Text style={[
            styles.summaryAmount,
            {
              color: netAmount >= 0 ? '#10B981' : '#EF4444',
              fontWeight: 'bold',
            }
          ]}>
            {formatCurrency(netAmount)}
          </Text>
        </View>
      </View>

      <View style={styles.transactionCount}>
        <Text style={[styles.countText, { color: theme.colors.textSecondary }]}>
          {summary.count} Transaktion{summary.count !== 1 ? 'en' : ''}
        </Text>
      </View>
    </View>
  );
}

export default function TransactionsScreen() {
  const dispatch = useAppDispatch();
  const theme = useTheme();

  const {
    transactions,
    currentFilter,
    isLoading,
    error,
    hasMore,
    showCreateModal,
    showEditModal,
    selectedTransactionId,
  } = useAppSelector(state => state.transactions);

  const { categories } = useAppSelector(state => state.categories);

  const [refreshing, setRefreshing] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, [dispatch]);

  const loadInitialData = async () => {
    try {
      await Promise.all([
        dispatch(fetchTransactions()).unwrap(),
        dispatch(fetchCategories()).unwrap(),
        dispatch(fetchPopularCategories()).unwrap(),
      ]);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchTransactions()).unwrap();
    } catch (error) {
      console.error('Failed to refresh transactions:', error);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  const handleCreateTransaction = async (data: CreateTransactionInput) => {
    try {
      await dispatch(createTransaction(data)).unwrap();
    } catch (error) {
      Alert.alert('Fehler', 'Transaktion konnte nicht erstellt werden.');
    }
  };

  const handleUpdateTransaction = async (data: UpdateTransactionInput) => {
    try {
      await dispatch(updateTransaction(data)).unwrap();
    } catch (error) {
      Alert.alert('Fehler', 'Transaktion konnte nicht aktualisiert werden.');
    }
  };

  const handleDeleteTransaction = (transactionId: string) => {
    Alert.alert(
      'Transaktion löschen',
      'Sind Sie sicher, dass Sie diese Transaktion löschen möchten?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: () => {
            dispatch(deleteTransaction(transactionId));
          },
        },
      ]
    );
  };

  const handleFilterChange = (filter: TransactionFilter) => {
    dispatch(setTransactionFilter(filter));
    dispatch(fetchTransactions());
  };

  const handleClearFilter = () => {
    dispatch(clearTransactionFilter());
    dispatch(fetchTransactions());
  };

  const handleCategorySelect = (category: Category) => {
    setShowCategoryManager(false);
  };

  const selectedTransaction = selectedTransactionId
    ? transactions.find(t => t.id === selectedTransactionId)
    : undefined;

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TransactionItem
      transaction={item}
      onPress={() => dispatch(showEditModal(item.id))}
      onEdit={() => dispatch(showEditModal(item.id))}
      onDelete={() => handleDeleteTransaction(item.id)}
    />
  );

  const renderListHeader = () => (
    <>
      <TransactionFilterBar
        currentFilter={currentFilter}
        onFilterChange={handleFilterChange}
        onClearFilter={handleClearFilter}
      />

      <TransactionsSummary
        transactions={transactions}
        filter={currentFilter}
      />
    </>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        Keine Transaktionen
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        {Object.keys(currentFilter).length > 0
          ? 'Keine Transaktionen entsprechen den aktuellen Filtern'
          : 'Erstellen Sie Ihre erste Transaktion'
        }
      </Text>
      <View style={styles.emptyActions}>
        <Button
          title="Transaktion hinzufügen"
          onPress={() => dispatch(showCreateModal())}
          style={styles.emptyActionButton}
        />
        <Button
          title="Kategorien verwalten"
          onPress={() => setShowCategoryManager(true)}
          variant="outline"
          style={styles.emptyActionButton}
        />
      </View>
    </View>
  );

  if (isLoading && transactions.length === 0) {
    return <LoadingScreen />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransaction}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          transactions.length === 0 && styles.listContentEmpty
        ]}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => dispatch(showCreateModal())}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <View style={[styles.actionBar, { backgroundColor: theme.colors.surface }]}>
        <Button
          title="Kategorien"
          onPress={() => setShowCategoryManager(true)}
          variant="outline"
          style={styles.actionButton}
        />

        <Button
          title="Transaktion hinzufügen"
          onPress={() => dispatch(showCreateModal())}
          style={styles.actionButton}
        />
      </View>

      {error && (
        <View style={[styles.errorContainer, { backgroundColor: theme.colors.error + '10' }]}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error}
          </Text>
        </View>
      )}

      <TransactionForm
        visible={showCreateModal || showEditModal}
        transaction={selectedTransaction}
        onSave={selectedTransaction ? handleUpdateTransaction : handleCreateTransaction}
        onCancel={() => {
          dispatch(hideCreateModal());
          dispatch(hideEditModal());
        }}
      />

      <Modal
        visible={showCategoryManager}
        animationType="slide"
        presentationStyle="formSheet"
      >
        <CategoryManagement
          onCategorySelect={handleCategorySelect}
          showCreateButton={true}
        />
        <Button
          title="Schließen"
          onPress={() => setShowCategoryManager(false)}
          style={styles.closeButton}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 160,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  summaryContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  transactionCount: {
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  countText: {
    fontSize: 12,
  },
  transactionItem: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryIconText: {
    fontSize: 18,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  transactionDate: {
    fontSize: 14,
  },
  metaSeparator: {
    marginHorizontal: 8,
    fontSize: 12,
  },
  categoryName: {
    fontSize: 14,
  },
  hasNotes: {
    fontSize: 12,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  notesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  notesText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
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
  emptyActions: {
    gap: 12,
    width: '100%',
  },
  emptyActionButton: {
    width: '100%',
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  errorContainer: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    padding: 16,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  closeButton: {
    margin: 16,
  },
});
    setEditingTransaction(null);
    // Transaction list will refresh automatically via Redux
  };

  const handleAddCancel = () => {
    setShowAddModal(false);
  };

  const handleEditCancel = () => {
    setShowEditModal(false);
    setEditingTransaction(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TransactionList
        onTransactionPress={handleTransactionPress}
        onAddPress={handleAddPress}
        showAddButton={true}
      />

      {/* Add Transaction Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <TransactionForm
          onSuccess={handleAddSuccess}
          onCancel={handleAddCancel}
        />
      </Modal>

      {/* Edit Transaction Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        {editingTransaction && (
          <TransactionForm
            transactionId={editingTransaction.id}
            onSuccess={handleEditSuccess}
            onCancel={handleEditCancel}
          />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
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
    featuresTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
      alignSelf: 'flex-start',
    },
    featureCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      ...theme.shadows.sm,
    },
    featureIcon: {
      marginRight: theme.spacing.md,
    },
    featureContent: {
      flex: 1,
    },
    featureTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    featureDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
    comingSoonBadge: {
      backgroundColor: theme.colors.warning,
      borderRadius: theme.borderRadius.sm,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 2,
      marginLeft: theme.spacing.sm,
    },
    comingSoonText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Icon name="account-balance-wallet" size={64} color={theme.colors.primary} style={styles.icon} />
        <Text style={styles.title}>Transactions</Text>
        <Text style={styles.subtitle}>
          Manage your income and expenses with powerful tools
        </Text>

        <View style={styles.sprintInfo}>
          <Text style={styles.sprintTitle}>Sprint 2 - Coming Next!</Text>
          <Text style={styles.sprintText}>
            Transaction management will be implemented in the next sprint. This will include full CRUD operations,
            SQLite integration, form validation, and the foundation for all financial tracking features.
          </Text>
        </View>

        <Text style={styles.featuresTitle}>Planned Features</Text>

        {comingSoonFeatures.map((feature, index) => (
          <TouchableOpacity key={index} style={styles.featureCard}>
            <Icon
              name={feature.icon}
              size={24}
              color={theme.colors.primary}
              style={styles.featureIcon}
            />
            <View style={styles.featureContent}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>SOON</Text>
                </View>
              </View>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};
