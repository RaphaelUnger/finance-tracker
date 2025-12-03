import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { useTheme } from '../hooks/useTheme';
import Button from './Button';
import {
  TransactionFilter,
  TransactionType,
  Category,
  CategoryType
} from '../types/transaction';
import { fetchCategories } from '../store/slices/categoriesSlice';
import { formatCurrency, formatDate } from '../utils/helpers';

interface DateRange {
  start: number;
  end: number;
  label: string;
}

interface FilterModalProps {
  visible: boolean;
  currentFilter: TransactionFilter;
  onApplyFilter: (filter: TransactionFilter) => void;
  onClearFilter: () => void;
  onClose: () => void;
}

function FilterModal({ visible, currentFilter, onApplyFilter, onClearFilter, onClose }: FilterModalProps) {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { categories } = useAppSelector(state => state.categories);

  const [filter, setFilter] = useState<TransactionFilter>(currentFilter);
  const [selectedDateRange, setSelectedDateRange] = useState<string>('');

  useEffect(() => {
    if (visible) {
      dispatch(fetchCategories());
    }
  }, [visible, dispatch]);

  useEffect(() => {
    setFilter(currentFilter);
  }, [currentFilter]);

  const dateRanges: DateRange[] = [
    {
      start: new Date(new Date().setDate(new Date().getDate() - 7)).getTime(),
      end: new Date().getTime(),
      label: 'Letzte 7 Tage',
    },
    {
      start: new Date(new Date().setDate(new Date().getDate() - 30)).getTime(),
      end: new Date().getTime(),
      label: 'Letzte 30 Tage',
    },
    {
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime(),
      end: new Date().getTime(),
      label: 'Aktueller Monat',
    },
    {
      start: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).getTime(),
      end: new Date(new Date().getFullYear(), new Date().getMonth(), 0).getTime(),
      label: 'Letzter Monat',
    },
    {
      start: new Date(new Date().getFullYear(), 0, 1).getTime(),
      end: new Date().getTime(),
      label: 'Aktuelles Jahr',
    },
  ];

  const amountRanges = [
    { min: 0, max: 10, label: '0 - 10 €' },
    { min: 10, max: 50, label: '10 - 50 €' },
    { min: 50, max: 100, label: '50 - 100 €' },
    { min: 100, max: 500, label: '100 - 500 €' },
    { min: 500, max: null, label: '500 € +' },
  ];

  const handleDateRangeSelect = (range: DateRange) => {
    setFilter({
      ...filter,
      startDate: range.start,
      endDate: range.end,
    });
    setSelectedDateRange(range.label);
  };

  const handleAmountRangeSelect = (range: typeof amountRanges[0]) => {
    setFilter({
      ...filter,
      minAmount: range.min,
      maxAmount: range.max || undefined,
    });
  };

  const handleCategoryToggle = (categoryId: string) => {
    const currentCategories = filter.categoryIds || [];
    let newCategories: string[];

    if (currentCategories.includes(categoryId)) {
      newCategories = currentCategories.filter(id => id !== categoryId);
    } else {
      newCategories = [...currentCategories, categoryId];
    }

    setFilter({
      ...filter,
      categoryIds: newCategories.length > 0 ? newCategories : undefined,
    });
  };

  const handleApply = () => {
    onApplyFilter(filter);
    onClose();
  };

  const handleClear = () => {
    const emptyFilter: TransactionFilter = {};
    setFilter(emptyFilter);
    setSelectedDateRange('');
    onClearFilter();
    onClose();
  };

  const activeFiltersCount = [
    filter.type,
    filter.categoryIds?.length,
    filter.startDate,
    filter.minAmount,
    filter.hasReceipt,
    filter.isRecurring,
    filter.searchQuery,
  ].filter(Boolean).length;

  const incomeCategories = categories.filter(cat => cat.type === 'income' || cat.type === 'both');
  const expenseCategories = categories.filter(cat => cat.type === 'expense' || cat.type === 'both');

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet">
      <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.headerButton, { color: theme.colors.textSecondary }]}>
              Schließen
            </Text>
          </TouchableOpacity>

          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
            Filter ({activeFiltersCount})
          </Text>

          <TouchableOpacity onPress={handleClear}>
            <Text style={[styles.headerButton, { color: theme.colors.primary }]}>
              Zurücksetzen
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Transaction Type Filter */}
          <View style={styles.filterSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Transaktionstyp
            </Text>
            <View style={styles.typeButtons}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  {
                    backgroundColor: !filter.type
                      ? theme.colors.primary
                      : theme.colors.surface,
                    borderColor: theme.colors.border,
                  }
                ]}
                onPress={() => setFilter({ ...filter, type: undefined })}
              >
                <Text style={[
                  styles.typeButtonText,
                  { color: !filter.type ? '#FFFFFF' : theme.colors.text }
                ]}>
                  Alle
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeButton,
                  {
                    backgroundColor: filter.type === 'income'
                      ? theme.colors.primary
                      : theme.colors.surface,
                    borderColor: theme.colors.border,
                  }
                ]}
                onPress={() => setFilter({ ...filter, type: 'income' })}
              >
                <Text style={[
                  styles.typeButtonText,
                  { color: filter.type === 'income' ? '#FFFFFF' : theme.colors.text }
                ]}>
                  Einnahmen
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeButton,
                  {
                    backgroundColor: filter.type === 'expense'
                      ? theme.colors.primary
                      : theme.colors.surface,
                    borderColor: theme.colors.border,
                  }
                ]}
                onPress={() => setFilter({ ...filter, type: 'expense' })}
              >
                <Text style={[
                  styles.typeButtonText,
                  { color: filter.type === 'expense' ? '#FFFFFF' : theme.colors.text }
                ]}>
                  Ausgaben
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Date Range Filter */}
          <View style={styles.filterSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Zeitraum
            </Text>
            <View style={styles.dateRanges}>
              {dateRanges.map((range, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dateRangeButton,
                    {
                      backgroundColor: selectedDateRange === range.label
                        ? theme.colors.primary + '20'
                        : theme.colors.surface,
                      borderColor: selectedDateRange === range.label
                        ? theme.colors.primary
                        : theme.colors.border,
                    }
                  ]}
                  onPress={() => handleDateRangeSelect(range)}
                >
                  <Text style={[
                    styles.dateRangeText,
                    {
                      color: selectedDateRange === range.label
                        ? theme.colors.primary
                        : theme.colors.text
                    }
                  ]}>
                    {range.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {filter.startDate && filter.endDate && (
              <View style={styles.selectedDateRange}>
                <Text style={[styles.selectedDateText, { color: theme.colors.textSecondary }]}>
                  {formatDate(filter.startDate)} - {formatDate(filter.endDate)}
                </Text>
              </View>
            )}
          </View>

          {/* Amount Range Filter */}
          <View style={styles.filterSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Betrag
            </Text>
            <View style={styles.amountRanges}>
              {amountRanges.map((range, index) => {
                const isSelected = filter.minAmount === range.min &&
                                 (range.max === null ? !filter.maxAmount : filter.maxAmount === range.max);

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.amountRangeButton,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.primary + '20'
                          : theme.colors.surface,
                        borderColor: isSelected
                          ? theme.colors.primary
                          : theme.colors.border,
                      }
                    ]}
                    onPress={() => handleAmountRangeSelect(range)}
                  >
                    <Text style={[
                      styles.amountRangeText,
                      {
                        color: isSelected
                          ? theme.colors.primary
                          : theme.colors.text
                      }
                    ]}>
                      {range.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Categories Filter */}
          <View style={styles.filterSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Kategorien
            </Text>

            {/* Income Categories */}
            {incomeCategories.length > 0 && (
              <>
                <Text style={[styles.subsectionTitle, { color: theme.colors.textSecondary }]}>
                  Einnahmen-Kategorien
                </Text>
                <View style={styles.categoryList}>
                  {incomeCategories.map(category => {
                    const isSelected = filter.categoryIds?.includes(category.id) || false;

                    return (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.categoryItem,
                          {
                            backgroundColor: isSelected
                              ? theme.colors.primary + '20'
                              : theme.colors.surface,
                            borderColor: isSelected
                              ? theme.colors.primary
                              : theme.colors.border,
                          }
                        ]}
                        onPress={() => handleCategoryToggle(category.id)}
                      >
                        <Text style={styles.categoryIcon}>{category.icon}</Text>
                        <Text style={[
                          styles.categoryName,
                          {
                            color: isSelected
                              ? theme.colors.primary
                              : theme.colors.text
                          }
                        ]}>
                          {category.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* Expense Categories */}
            {expenseCategories.length > 0 && (
              <>
                <Text style={[styles.subsectionTitle, { color: theme.colors.textSecondary }]}>
                  Ausgaben-Kategorien
                </Text>
                <View style={styles.categoryList}>
                  {expenseCategories.map(category => {
                    const isSelected = filter.categoryIds?.includes(category.id) || false;

                    return (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.categoryItem,
                          {
                            backgroundColor: isSelected
                              ? theme.colors.primary + '20'
                              : theme.colors.surface,
                            borderColor: isSelected
                              ? theme.colors.primary
                              : theme.colors.border,
                          }
                        ]}
                        onPress={() => handleCategoryToggle(category.id)}
                      >
                        <Text style={styles.categoryIcon}>{category.icon}</Text>
                        <Text style={[
                          styles.categoryName,
                          {
                            color: isSelected
                              ? theme.colors.primary
                              : theme.colors.text
                          }
                        ]}>
                          {category.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}
          </View>

          {/* Additional Filters */}
          <View style={styles.filterSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Weitere Filter
            </Text>

            <View style={styles.switchOption}>
              <Text style={[styles.switchLabel, { color: theme.colors.text }]}>
                Nur mit Belegen
              </Text>
              <Switch
                value={filter.hasReceipt || false}
                onValueChange={(value) => setFilter({ ...filter, hasReceipt: value || undefined })}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.switchOption}>
              <Text style={[styles.switchLabel, { color: theme.colors.text }]}>
                Wiederkehrende Transaktionen
              </Text>
              <Switch
                value={filter.isRecurring || false}
                onValueChange={(value) => setFilter({ ...filter, isRecurring: value || undefined })}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </ScrollView>

        <View style={[styles.modalFooter, { borderTopColor: theme.colors.border }]}>
          <Button
            title="Filter anwenden"
            onPress={handleApply}
            style={styles.applyButton}
          />
        </View>
      </View>
    </Modal>
  );
}

interface TransactionFilterBarProps {
  currentFilter: TransactionFilter;
  onFilterChange: (filter: TransactionFilter) => void;
  onClearFilter: () => void;
}

export default function TransactionFilterBar({
  currentFilter,
  onFilterChange,
  onClearFilter
}: TransactionFilterBarProps) {
  const theme = useTheme();
  const [showFilterModal, setShowFilterModal] = useState(false);

  const activeFiltersCount = [
    currentFilter.type,
    currentFilter.categoryIds?.length,
    currentFilter.startDate,
    currentFilter.minAmount,
    currentFilter.hasReceipt,
    currentFilter.isRecurring,
    currentFilter.searchQuery,
  ].filter(Boolean).length;

  const hasActiveFilters = activeFiltersCount > 0;

  const getFilterSummary = (): string => {
    const summaryParts: string[] = [];

    if (currentFilter.type) {
      summaryParts.push(currentFilter.type === 'income' ? 'Einnahmen' : 'Ausgaben');
    }

    if (currentFilter.categoryIds?.length) {
      summaryParts.push(`${currentFilter.categoryIds.length} Kategorie${currentFilter.categoryIds.length > 1 ? 'n' : ''}`);
    }

    if (currentFilter.startDate && currentFilter.endDate) {
      summaryParts.push('Zeitraum');
    }

    if (currentFilter.minAmount !== undefined || currentFilter.maxAmount !== undefined) {
      summaryParts.push('Betrag');
    }

    return summaryParts.length > 0 ? summaryParts.join(', ') : 'Alle Transaktionen';
  };

  return (
    <>
      <View style={[styles.filterBar, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            {
              backgroundColor: hasActiveFilters
                ? theme.colors.primary + '20'
                : theme.colors.background,
              borderColor: hasActiveFilters
                ? theme.colors.primary
                : theme.colors.border,
            }
          ]}
          onPress={() => setShowFilterModal(true)}
        >
          <Text style={styles.filterIcon}>🔍</Text>
          <View style={styles.filterTextContainer}>
            <Text style={[
              styles.filterButtonText,
              {
                color: hasActiveFilters
                  ? theme.colors.primary
                  : theme.colors.text
              }
            ]}>
              Filter {hasActiveFilters && `(${activeFiltersCount})`}
            </Text>
            <Text style={[
              styles.filterSummary,
              {
                color: hasActiveFilters
                  ? theme.colors.primary
                  : theme.colors.textSecondary
              }
            ]}>
              {getFilterSummary()}
            </Text>
          </View>
        </TouchableOpacity>

        {hasActiveFilters && (
          <TouchableOpacity
            style={[styles.clearButton, { backgroundColor: theme.colors.error + '20' }]}
            onPress={onClearFilter}
          >
            <Text style={[styles.clearButtonText, { color: theme.colors.error }]}>
              Löschen
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <FilterModal
        visible={showFilterModal}
        currentFilter={currentFilter}
        onApplyFilter={onFilterChange}
        onClearFilter={onClearFilter}
        onClose={() => setShowFilterModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  filterIcon: {
    fontSize: 18,
  },
  filterTextContainer: {
    flex: 1,
  },
  filterButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  filterSummary: {
    fontSize: 12,
  },
  clearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '500',
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
  headerButton: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
  },
  applyButton: {
    width: '100%',
  },
  filterSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 8,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dateRanges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateRangeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  dateRangeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedDateRange: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  selectedDateText: {
    fontSize: 14,
    textAlign: 'center',
  },
  amountRanges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amountRangeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  amountRangeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
  },
  switchOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  switchLabel: {
    fontSize: 16,
  },
});
