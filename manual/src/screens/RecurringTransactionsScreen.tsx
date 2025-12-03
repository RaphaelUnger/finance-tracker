import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Modal
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useTheme } from '../hooks/useTheme';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import RecurrenceService, { RecurringTransaction, UpcomingRecurrence } from '../services/recurrenceService';
import { Button } from '../components/Button';
import { LoadingOverlay } from '../components/LoadingOverlay';

interface RecurringTransactionsScreenProps {
  navigation: any;
}

const RecurringTransactionsScreen: React.FC<RecurringTransactionsScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [recurrences, setRecurrences] = useState<RecurringTransaction[]>([]);
  const [upcomingRecurrences, setUpcomingRecurrences] = useState<UpcomingRecurrence[]>([]);
  const [selectedTab, setSelectedTab] = useState<'active' | 'upcoming' | 'history'>('upcoming');

  const styles = createStyles(theme);

  useEffect(() => {
    loadRecurrences();

    // Subscribe to recurrence updates
    const unsubscribe = RecurrenceService.addListener((upcoming) => {
      setUpcomingRecurrences(upcoming);
    });

    return unsubscribe;
  }, []);

  const loadRecurrences = async () => {
    try {
      setLoading(true);
      const [allRecurrences, upcoming] = await Promise.all([
        RecurrenceService.getRecurrences(),
        RecurrenceService.getUpcomingRecurrences(30)
      ]);

      setRecurrences(allRecurrences);
      setUpcomingRecurrences(upcoming);
    } catch (error) {
      console.error('Error loading recurrences:', error);
      Alert.alert('Fehler', 'Wiederkehrende Transaktionen konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteNow = async (recurrenceId: string) => {
    try {
      Alert.alert(
        'Jetzt ausführen',
        'Möchten Sie diese wiederkehrende Transaktion jetzt ausführen?',
        [
          { text: 'Abbrechen', style: 'cancel' },
          {
            text: 'Ausführen',
            onPress: async () => {
              try {
                setLoading(true);
                await RecurrenceService.executeRecurrence(recurrenceId);
                await loadRecurrences();
                Alert.alert('Erfolg', 'Transaktion wurde erfolgreich erstellt!');
              } catch (error) {
                console.error('Error executing recurrence:', error);
                Alert.alert('Fehler', `Ausführung fehlgeschlagen: ${error.message}`);
              } finally {
                setLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error in execute now:', error);
    }
  };

  const handleToggleActive = async (recurrenceId: string, isActive: boolean) => {
    try {
      setLoading(true);
      await RecurrenceService.updateRecurrence(recurrenceId, { isActive });
      await loadRecurrences();
    } catch (error) {
      console.error('Error toggling recurrence:', error);
      Alert.alert('Fehler', `Status konnte nicht geändert werden: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecurrence = async (recurrenceId: string, name: string) => {
    Alert.alert(
      'Wiederkehrende Transaktion löschen',
      `Möchten Sie "${name}" wirklich löschen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Nur Wiederholung',
          onPress: async () => {
            try {
              setLoading(true);
              await RecurrenceService.deleteRecurrence(recurrenceId, false);
              await loadRecurrences();
            } catch (error) {
              Alert.alert('Fehler', `Löschen fehlgeschlagen: ${error.message}`);
            } finally {
              setLoading(false);
            }
          }
        },
        {
          text: 'Mit Transaktionen',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await RecurrenceService.deleteRecurrence(recurrenceId, true);
              await loadRecurrences();
            } catch (error) {
              Alert.alert('Fehler', `Löschen fehlgeschlagen: ${error.message}`);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleAddRecurrence = () => {
    navigation.navigate('CreateRecurrence');
  };

  const handleEditRecurrence = (recurrence: RecurringTransaction) => {
    navigation.navigate('EditRecurrence', { recurrenceId: recurrence.id });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  const getDaysUntilText = (days: number): string => {
    if (days <= 0) return 'Fällig';
    if (days === 1) return 'Morgen';
    if (days <= 7) return `In ${days} Tagen`;
    if (days <= 30) return `In ${Math.round(days / 7)} Wochen`;
    return `In ${Math.round(days / 30)} Monaten`;
  };

  const getActiveRecurrences = () => recurrences.filter(r => r.isActive);
  const getInactiveRecurrences = () => recurrences.filter(r => !r.isActive);

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, selectedTab === 'upcoming' && styles.activeTab]}
        onPress={() => setSelectedTab('upcoming')}
      >
        <Text style={[styles.tabText, selectedTab === 'upcoming' && styles.activeTabText]}>
          Anstehend ({upcomingRecurrences.filter(u => u.daysUntil <= 7).length})
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, selectedTab === 'active' && styles.activeTab]}
        onPress={() => setSelectedTab('active')}
      >
        <Text style={[styles.tabText, selectedTab === 'active' && styles.activeTabText]}>
          Aktiv ({getActiveRecurrences().length})
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, selectedTab === 'history' && styles.activeTab]}
        onPress={() => setSelectedTab('history')}
      >
        <Text style={[styles.tabText, selectedTab === 'history' && styles.activeTabText]}>
          Inaktiv ({getInactiveRecurrences().length})
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderUpcomingRecurrence = (upcoming: UpcomingRecurrence) => {
    const { recurrence, scheduledDate, daysUntil, canExecuteNow } = upcoming;
    const isOverdue = daysUntil < 0;
    const isDueToday = daysUntil === 0;

    return (
      <View key={`${recurrence.id}-${scheduledDate.getTime()}`} style={styles.recurrenceCard}>
        <View style={styles.recurrenceHeader}>
          <View style={styles.recurrenceInfo}>
            <Text style={styles.recurrenceName}>{recurrence.name}</Text>
            <Text style={styles.recurrenceDescription}>
              {recurrence.templateTransaction.description}
            </Text>
            <Text style={styles.recurrencePattern}>
              {RecurrenceService.getPatternDescription(recurrence.pattern)}
            </Text>
          </View>

          <View style={styles.recurrenceAmount}>
            <Text style={[
              styles.amount,
              recurrence.templateTransaction.type === 'income' ? styles.incomeAmount : styles.expenseAmount
            ]}>
              {recurrence.templateTransaction.type === 'income' ? '+' : '-'}
              {formatCurrency(recurrence.templateTransaction.amount)}
            </Text>

            <View style={[
              styles.dueBadge,
              isOverdue ? styles.overdueBadge :
              isDueToday ? styles.todayBadge : styles.upcomingBadge
            ]}>
              <Text style={styles.dueText}>
                {getDaysUntilText(daysUntil)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.recurrenceFooter}>
          <Text style={styles.scheduledDate}>
            Geplant: {formatDate(scheduledDate)}
          </Text>

          {canExecuteNow && (
            <TouchableOpacity
              style={styles.executeButton}
              onPress={() => handleExecuteNow(recurrence.id)}
            >
              <Icon name="play-arrow" size={16} color={theme.colors.onPrimary} />
              <Text style={styles.executeButtonText}>Jetzt ausführen</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderActiveRecurrence = (recurrence: RecurringTransaction) => (
    <View key={recurrence.id} style={styles.recurrenceCard}>
      <View style={styles.recurrenceHeader}>
        <View style={styles.recurrenceInfo}>
          <Text style={styles.recurrenceName}>{recurrence.name}</Text>
          <Text style={styles.recurrenceDescription}>
            {recurrence.templateTransaction.description}
          </Text>
          <Text style={styles.recurrencePattern}>
            {RecurrenceService.getPatternDescription(recurrence.pattern)}
          </Text>

          {recurrence.lastExecutionDate && (
            <Text style={styles.lastExecuted}>
              Zuletzt: {formatDate(recurrence.lastExecutionDate)}
            </Text>
          )}
        </View>

        <View style={styles.recurrenceAmount}>
          <Text style={[
            styles.amount,
            recurrence.templateTransaction.type === 'income' ? styles.incomeAmount : styles.expenseAmount
          ]}>
            {recurrence.templateTransaction.type === 'income' ? '+' : '-'}
            {formatCurrency(recurrence.templateTransaction.amount)}
          </Text>

          <Text style={styles.nextExecution}>
            Nächste: {formatDate(recurrence.nextExecutionDate)}
          </Text>
        </View>
      </View>

      <View style={styles.recurrenceFooter}>
        <View style={styles.recurrenceControls}>
          <Switch
            value={recurrence.isActive}
            onValueChange={(value) => handleToggleActive(recurrence.id, value)}
            trackColor={{ false: theme.colors.outline, true: theme.colors.primary + '40' }}
            thumbColor={recurrence.isActive ? theme.colors.primary : theme.colors.onSurfaceVariant}
          />
          <Text style={styles.switchLabel}>Aktiv</Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditRecurrence(recurrence)}
          >
            <Icon name="edit" size={20} color={theme.colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteRecurrence(recurrence.id, recurrence.name)}
          >
            <Icon name="delete" size={20} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderContent = () => {
    switch (selectedTab) {
      case 'upcoming':
        const nextWeek = upcomingRecurrences.filter(u => u.daysUntil <= 7);
        if (nextWeek.length === 0) {
          return (
            <View style={styles.emptyState}>
              <Icon name="schedule" size={64} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.emptyStateText}>
                Keine anstehenden Transaktionen in den nächsten 7 Tagen
              </Text>
            </View>
          );
        }
        return nextWeek.map(renderUpcomingRecurrence);

      case 'active':
        const activeRecurrences = getActiveRecurrences();
        if (activeRecurrences.length === 0) {
          return (
            <View style={styles.emptyState}>
              <Icon name="repeat" size={64} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.emptyStateText}>
                Keine aktiven wiederkehrenden Transaktionen
              </Text>
              <Button
                title="Erste Wiederholung erstellen"
                onPress={handleAddRecurrence}
                style={styles.emptyStateButton}
              />
            </View>
          );
        }
        return activeRecurrences.map(renderActiveRecurrence);

      case 'history':
        const inactiveRecurrences = getInactiveRecurrences();
        if (inactiveRecurrences.length === 0) {
          return (
            <View style={styles.emptyState}>
              <Icon name="history" size={64} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.emptyStateText}>
                Keine inaktiven wiederkehrenden Transaktionen
              </Text>
            </View>
          );
        }
        return inactiveRecurrences.map(renderActiveRecurrence);

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <LoadingOverlay visible={loading} />

      {renderTabBar()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderContent()}
      </ScrollView>

      <View style={styles.fab}>
        <TouchableOpacity style={styles.fabButton} onPress={handleAddRecurrence}>
          <Icon name="add" size={24} color={theme.colors.onPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
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
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center'
  },
  activeTab: {
    backgroundColor: theme.colors.primary
  },
  tabText: {
    fontSize: 12,
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
  recurrenceCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.outline
  },
  recurrenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  recurrenceInfo: {
    flex: 1,
    marginRight: 16
  },
  recurrenceName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 4
  },
  recurrenceDescription: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4
  },
  recurrencePattern: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500'
  },
  lastExecuted: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4
  },
  recurrenceAmount: {
    alignItems: 'flex-end'
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4
  },
  incomeAmount: {
    color: theme.colors.success
  },
  expenseAmount: {
    color: theme.colors.error
  },
  dueBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4
  },
  overdueBadge: {
    backgroundColor: theme.colors.error
  },
  todayBadge: {
    backgroundColor: theme.colors.warning
  },
  upcomingBadge: {
    backgroundColor: theme.colors.primaryContainer
  },
  dueText: {
    fontSize: 10,
    fontWeight: '500',
    color: theme.colors.onPrimary
  },
  nextExecution: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant
  },
  recurrenceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline
  },
  scheduledDate: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant
  },
  executeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4
  },
  executeButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.onPrimary
  },
  recurrenceControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  switchLabel: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16
  },
  actionButton: {
    padding: 8
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40
  },
  emptyStateText: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24
  },
  emptyStateButton: {
    marginTop: 24
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4
  }
});

export default RecurringTransactionsScreen;
