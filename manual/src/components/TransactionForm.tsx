import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { useTheme } from '../../hooks/useTheme';
import Button from '../Button';
import LoadingScreen from '../LoadingScreen';
import {
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
  Category
} from '../../types/transaction';
import {
  createTransaction,
  updateTransaction,
  fetchTransactionById,
  clearError
} from '../../store/slices/transactionsSlice';
import { fetchCategories } from '../../store/slices/categoriesSlice';
import { validateAmount, validateDescription, formatCurrency, formatDate, dateToTimestamp } from '../../utils/helpers';

interface TransactionFormProps {
  transactionId?: string;
  initialType?: 'income' | 'expense';
  onSuccess?: (transaction: Transaction) => void;
  onCancel?: () => void;
}

export default function TransactionForm({
  transactionId,
  initialType = 'expense',
  onSuccess,
  onCancel,
}: TransactionFormProps) {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { selectedTransaction, loading, error } = useAppSelector(state => state.transactions);
  const { categories } = useAppSelector(state => state.categories);

  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    type: initialType,
    categoryId: '',
    date: new Date(),
    notes: '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = Boolean(transactionId);
  const availableCategories = categories.filter(
    cat => cat.type === formData.type || cat.type === 'both'
  );

  useEffect(() => {
    dispatch(fetchCategories());

    if (transactionId) {
      dispatch(fetchTransactionById(transactionId));
    }
  }, [dispatch, transactionId]);

  useEffect(() => {
    if (isEditMode && selectedTransaction) {
      setFormData({
        amount: selectedTransaction.amount.toString(),
        description: selectedTransaction.description,
        type: selectedTransaction.type,
        categoryId: selectedTransaction.categoryId,
        date: new Date(selectedTransaction.date * 1000),
        notes: selectedTransaction.notes || '',
      });
    }
  }, [isEditMode, selectedTransaction]);

  useEffect(() => {
    if (error) {
      Alert.alert('Fehler', error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Amount validation
    const amountValidation = validateAmount(formData.amount);
    if (!amountValidation.isValid) {
      errors.amount = amountValidation.error!;
    }

    // Description validation
    const descriptionValidation = validateDescription(formData.description);
    if (!descriptionValidation.isValid) {
      errors.description = descriptionValidation.error!;
    }

    // Category validation
    if (!formData.categoryId) {
      errors.categoryId = 'Kategorie ist erforderlich';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const amountValidation = validateAmount(formData.amount);
      const transactionData = {
        amount: amountValidation.value!,
        description: formData.description.trim(),
        type: formData.type,
        categoryId: formData.categoryId,
        date: dateToTimestamp(formData.date),
        notes: formData.notes.trim() || undefined,
      };

      let result: Transaction;

      if (isEditMode && transactionId) {
        const updateData: UpdateTransactionInput = {
          id: transactionId,
          ...transactionData,
        };
        result = await dispatch(updateTransaction(updateData)).unwrap();
      } else {
        result = await dispatch(createTransaction(transactionData)).unwrap();
      }

      onSuccess?.(result);

      if (!isEditMode) {
        // Reset form for new transaction
        setFormData({
          amount: '',
          description: '',
          type: initialType,
          categoryId: '',
          date: new Date(),
          notes: '',
        });
      }

      Alert.alert(
        'Erfolg',
        isEditMode ? 'Transaktion wurde aktualisiert' : 'Transaktion wurde erstellt'
      );
    } catch (error) {
      // Error is handled by Redux and shown via useEffect
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTypeSelector = () => (
    <View style={styles.typeSelector}>
      <Text style={[styles.label, { color: theme.colors.text }]}>Typ</Text>
      <View style={styles.typeButtons}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            formData.type === 'expense' && styles.typeButtonActive,
            { borderColor: theme.colors.border }
          ]}
          onPress={() => setFormData(prev => ({ ...prev, type: 'expense', categoryId: '' }))}
        >
          <Text style={[
            styles.typeButtonText,
            formData.type === 'expense' && styles.typeButtonTextActive,
            { color: theme.colors.text }
          ]}>
            Ausgabe
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.typeButton,
            formData.type === 'income' && styles.typeButtonActive,
            { borderColor: theme.colors.border }
          ]}
          onPress={() => setFormData(prev => ({ ...prev, type: 'income', categoryId: '' }))}
        >
          <Text style={[
            styles.typeButtonText,
            formData.type === 'income' && styles.typeButtonTextActive,
            { color: theme.colors.text }
          ]}>
            Einnahme
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCategorySelector = () => (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: theme.colors.text }]}>Kategorie</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
      >
        {availableCategories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              formData.categoryId === category.id && styles.categoryChipActive,
              {
                backgroundColor: formData.categoryId === category.id
                  ? category.color
                  : theme.colors.surface,
                borderColor: category.color,
              }
            ]}
            onPress={() => setFormData(prev => ({ ...prev, categoryId: category.id }))}
          >
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text style={[
              styles.categoryName,
              formData.categoryId === category.id && styles.categoryNameActive,
              { color: formData.categoryId === category.id ? '#FFFFFF' : theme.colors.text }
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {validationErrors.categoryId && (
        <Text style={styles.errorText}>{validationErrors.categoryId}</Text>
      )}
    </View>
  );

  if (loading && isEditMode && !selectedTransaction) {
    return <LoadingScreen />;
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.form}>
        {renderTypeSelector()}

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Betrag (€)</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                borderColor: validationErrors.amount ? theme.colors.error : theme.colors.border,
              }
            ]}
            value={formData.amount}
            onChangeText={(text) => setFormData(prev => ({ ...prev, amount: text }))}
            placeholder="0,00"
            placeholderTextColor={theme.colors.placeholder}
            keyboardType="decimal-pad"
            returnKeyType="next"
          />
          {validationErrors.amount && (
            <Text style={styles.errorText}>{validationErrors.amount}</Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Beschreibung</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                borderColor: validationErrors.description ? theme.colors.error : theme.colors.border,
              }
            ]}
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            placeholder="z.B. Einkauf Supermarkt"
            placeholderTextColor={theme.colors.placeholder}
            maxLength={100}
            returnKeyType="next"
          />
          {validationErrors.description && (
            <Text style={styles.errorText}>{validationErrors.description}</Text>
          )}
        </View>

        {renderCategorySelector()}

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Datum</Text>
          <TouchableOpacity
            style={[
              styles.input,
              styles.dateButton,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }
            ]}
            onPress={() => {
              // TODO: Implement date picker
              Alert.alert('Info', 'Datums-Auswahl wird in Sprint 3 implementiert');
            }}
          >
            <Text style={{ color: theme.colors.text }}>
              {formatDate(dateToTimestamp(formData.date))}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Notizen (optional)</Text>
          <TextInput
            style={[
              styles.input,
              styles.notesInput,
              {
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              }
            ]}
            value={formData.notes}
            onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
            placeholder="Zusätzliche Notizen..."
            placeholderTextColor={theme.colors.placeholder}
            multiline
            maxLength={500}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title={isEditMode ? 'Aktualisieren' : 'Erstellen'}
            onPress={handleSubmit}
            loading={isSubmitting}
            style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
          />

          {onCancel && (
            <Button
              title="Abbrechen"
              onPress={onCancel}
              variant="outline"
              style={styles.cancelButton}
            />
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  typeSelector: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  dateButton: {
    justifyContent: 'center',
  },
  notesInput: {
    height: 80,
    paddingTop: 12,
  },
  categoryScroll: {
    maxHeight: 120,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryChipActive: {
    backgroundColor: '#2196F3',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryNameActive: {
    color: '#FFFFFF',
  },
  buttonContainer: {
    marginTop: 32,
    gap: 12,
  },
  submitButton: {
    marginBottom: 8,
  },
  cancelButton: {
    marginBottom: 16,
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
    marginTop: 4,
  },
});
