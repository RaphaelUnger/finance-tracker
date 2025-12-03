import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { useTheme } from '../hooks/useTheme';
import Button from './Button';
import LoadingScreen from './LoadingScreen';
import {
  fetchCategories,
  searchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  fetchPopularCategories,
  setSearchQuery,
  setSelectedType,
  setSortOptions,
  showCreateModal,
  hideCreateModal,
  showEditModal,
  hideEditModal,
  clearError,
} from '../store/slices/categoriesSlice';
import { Category, CategoryType, CreateCategoryInput, UpdateCategoryInput } from '../types/transaction';

interface CategoryItemProps {
  category: Category;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function CategoryItem({ category, onPress, onEdit, onDelete }: CategoryItemProps) {
  const theme = useTheme();

  const handleLongPress = () => {
    if (category.isCustom) {
      Alert.alert(
        category.name,
        'Was möchten Sie tun?',
        [
          { text: 'Abbrechen', style: 'cancel' },
          { text: 'Bearbeiten', onPress: onEdit },
          { text: 'Löschen', style: 'destructive', onPress: onDelete },
        ]
      );
    } else {
      Alert.alert(
        'Standard-Kategorie',
        'Diese Kategorie kann nicht bearbeitet oder gelöscht werden.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <TouchableOpacity
      style={[styles.categoryItem, { backgroundColor: theme.colors.surface }]}
      onPress={onPress}
      onLongPress={handleLongPress}
    >
      <View style={styles.categoryInfo}>
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

        <View style={styles.categoryDetails}>
          <Text style={[styles.categoryName, { color: theme.colors.text }]}>
            {category.name}
          </Text>

          <View style={styles.categoryMeta}>
            <Text style={[styles.categoryType, { color: theme.colors.textSecondary }]}>
              {category.type === 'both' ? 'Beide' :
               category.type === 'income' ? 'Einnahmen' : 'Ausgaben'}
            </Text>

            {category.usageCount !== undefined && category.usageCount > 0 && (
              <>
                <Text style={[styles.metaSeparator, { color: theme.colors.textSecondary }]}>•</Text>
                <Text style={[styles.usageCount, { color: theme.colors.textSecondary }]}>
                  {category.usageCount} Verwendung{category.usageCount !== 1 ? 'en' : ''}
                </Text>
              </>
            )}

            {category.isCustom && (
              <>
                <Text style={[styles.metaSeparator, { color: theme.colors.textSecondary }]}>•</Text>
                <Text style={[styles.customBadge, { color: theme.colors.primary }]}>
                  Benutzerdefiniert
                </Text>
              </>
            )}
          </View>

          {category.description && (
            <Text style={[styles.categoryDescription, { color: theme.colors.textSecondary }]}>
              {category.description}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.categoryActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.primary + '10' }]}
          onPress={onPress}
        >
          <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>
            Auswählen
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

interface CategoryFormProps {
  visible: boolean;
  category?: Category;
  onSave: (data: CreateCategoryInput | UpdateCategoryInput) => void;
  onCancel: () => void;
}

function CategoryForm({ visible, category, onSave, onCancel }: CategoryFormProps) {
  const theme = useTheme();
  const [formData, setFormData] = useState<CreateCategoryInput>({
    name: '',
    icon: '📁',
    color: '#3B82F6',
    type: 'expense',
    description: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        icon: category.icon,
        color: category.color,
        type: category.type,
        description: category.description || '',
      });
    } else {
      setFormData({
        name: '',
        icon: '📁',
        color: '#3B82F6',
        type: 'expense',
        description: '',
      });
    }
    setErrors({});
  }, [category, visible]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name ist erforderlich';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Name darf maximal 50 Zeichen lang sein';
    }

    if (!formData.icon.trim()) {
      newErrors.icon = 'Icon ist erforderlich';
    }

    if (!formData.color) {
      newErrors.color = 'Farbe ist erforderlich';
    }

    if (formData.description && formData.description.length > 200) {
      newErrors.description = 'Beschreibung darf maximal 200 Zeichen lang sein';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    if (category) {
      onSave({
        id: category.id,
        ...formData,
      } as UpdateCategoryInput);
    } else {
      onSave(formData);
    }
  };

  const predefinedIcons = ['📁', '🍔', '🚗', '🏠', '💼', '🎯', '🛒', '💰', '🎮', '📚', '💊', '✈️'];
  const predefinedColors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet">
      <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
            {category ? 'Kategorie bearbeiten' : 'Neue Kategorie'}
          </Text>

          <TouchableOpacity onPress={onCancel}>
            <Text style={[styles.cancelButton, { color: theme.colors.textSecondary }]}>
              Abbrechen
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.formContent}>
          {/* Name Input */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Name *
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderColor: errors.name ? theme.colors.error : theme.colors.border,
                }
              ]}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Kategoriename eingeben"
              placeholderTextColor={theme.colors.textSecondary}
              maxLength={50}
            />
            {errors.name && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.name}
              </Text>
            )}
          </View>

          {/* Type Selection */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Typ *
            </Text>
            <View style={styles.typeButtons}>
              {[
                { value: 'expense' as CategoryType, label: 'Ausgaben' },
                { value: 'income' as CategoryType, label: 'Einnahmen' },
                { value: 'both' as CategoryType, label: 'Beide' },
              ].map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeButton,
                    {
                      backgroundColor: formData.type === type.value
                        ? theme.colors.primary
                        : theme.colors.surface,
                      borderColor: theme.colors.border,
                    }
                  ]}
                  onPress={() => setFormData({ ...formData, type: type.value })}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      {
                        color: formData.type === type.value
                          ? '#FFFFFF'
                          : theme.colors.text
                      }
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Icon Selection */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Icon *
            </Text>
            <View style={styles.iconGrid}>
              {predefinedIcons.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    styles.iconButton,
                    {
                      backgroundColor: formData.icon === icon
                        ? theme.colors.primary + '20'
                        : theme.colors.surface,
                      borderColor: formData.icon === icon
                        ? theme.colors.primary
                        : theme.colors.border,
                    }
                  ]}
                  onPress={() => setFormData({ ...formData, icon })}
                >
                  <Text style={styles.iconText}>{icon}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Color Selection */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Farbe *
            </Text>
            <View style={styles.colorGrid}>
              {predefinedColors.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorButton,
                    {
                      backgroundColor: color,
                      borderColor: formData.color === color
                        ? theme.colors.text
                        : 'transparent',
                      borderWidth: formData.color === color ? 3 : 0,
                    }
                  ]}
                  onPress={() => setFormData({ ...formData, color })}
                />
              ))}
            </View>
          </View>

          {/* Description Input */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Beschreibung (optional)
            </Text>
            <TextInput
              style={[
                styles.textInput,
                styles.textArea,
                {
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderColor: errors.description ? theme.colors.error : theme.colors.border,
                }
              ]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Optionale Beschreibung"
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              numberOfLines={3}
              maxLength={200}
            />
            {errors.description && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.description}
              </Text>
            )}
          </View>

          <View style={styles.formActions}>
            <Button
              title={category ? 'Speichern' : 'Erstellen'}
              onPress={handleSave}
              style={styles.saveButton}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

interface CategoryManagementProps {
  onCategorySelect?: (category: Category) => void;
  filterType?: CategoryType;
  showCreateButton?: boolean;
}

export default function CategoryManagement({
  onCategorySelect,
  filterType,
  showCreateButton = true
}: CategoryManagementProps) {
  const dispatch = useAppDispatch();
  const theme = useTheme();

  const {
    categories,
    popularCategories,
    searchQuery,
    selectedType,
    sortBy,
    sortOrder,
    isLoading,
    error,
    totalCount,
    hasMore,
    showCreateModal,
    showEditModal,
    selectedCategoryId,
  } = useAppSelector(state => state.categories);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCategories();
    dispatch(fetchPopularCategories({ type: filterType }));
  }, [dispatch, filterType, selectedType, sortBy, sortOrder]);

  useEffect(() => {
    if (filterType && filterType !== selectedType) {
      dispatch(setSelectedType(filterType));
    }
  }, [filterType, selectedType, dispatch]);

  const loadCategories = async () => {
    try {
      await dispatch(fetchCategories({
        type: selectedType || filterType,
        sortBy,
        sortOrder,
        limit: 20,
      })).unwrap();
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleSearch = (query: string) => {
    dispatch(setSearchQuery(query));

    if (query.trim()) {
      dispatch(searchCategories({
        query: query.trim(),
        type: selectedType || filterType,
        limit: 50
      }));
    } else {
      loadCategories();
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCategories();
    setRefreshing(false);
  };

  const handleCreateCategory = async (data: CreateCategoryInput) => {
    try {
      await dispatch(createCategory(data)).unwrap();
    } catch (error) {
      Alert.alert('Fehler', 'Kategorie konnte nicht erstellt werden.');
    }
  };

  const handleUpdateCategory = async (data: UpdateCategoryInput) => {
    try {
      await dispatch(updateCategory(data)).unwrap();
    } catch (error) {
      Alert.alert('Fehler', 'Kategorie konnte nicht aktualisiert werden.');
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    Alert.alert(
      'Kategorie löschen',
      'Sind Sie sicher, dass Sie diese Kategorie löschen möchten?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: () => {
            dispatch(deleteCategory(categoryId));
          },
        },
      ]
    );
  };

  const selectedCategory = selectedCategoryId
    ? categories.find(cat => cat.id === selectedCategoryId)
    : undefined;

  if (isLoading && categories.length === 0) {
    return <LoadingScreen />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Search Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: theme.colors.background,
              color: theme.colors.text,
              borderColor: theme.colors.border,
            }
          ]}
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder="Kategorien suchen..."
          placeholderTextColor={theme.colors.textSecondary}
        />

        {showCreateButton && (
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => dispatch(showCreateModal())}
          >
            <Text style={styles.createButtonText}>+</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Popular Categories */}
      {popularCategories.length > 0 && !searchQuery && (
        <View style={styles.popularSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Häufig verwendet
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.popularList}
          >
            {popularCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[styles.popularItem, { backgroundColor: theme.colors.surface }]}
                onPress={() => onCategorySelect?.(category)}
              >
                <Text style={styles.popularIcon}>{category.icon}</Text>
                <Text style={[styles.popularName, { color: theme.colors.text }]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Categories List */}
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CategoryItem
            category={item}
            onPress={() => onCategorySelect?.(item)}
            onEdit={() => dispatch(showEditModal(item.id))}
            onDelete={() => handleDeleteCategory(item.id)}
          />
        )}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        style={styles.categoriesList}
        contentContainerStyle={styles.categoriesContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {searchQuery
                ? `Keine Kategorien gefunden für "${searchQuery}"`
                : 'Keine Kategorien verfügbar'
              }
            </Text>
          </View>
        }
      />

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

      {/* Create/Edit Modal */}
      <CategoryForm
        visible={showCreateModal || showEditModal}
        category={selectedCategory}
        onSave={selectedCategory ? handleUpdateCategory : handleCreateCategory}
        onCancel={() => {
          dispatch(hideCreateModal());
          dispatch(hideEditModal());
        }}
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
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  popularSection: {
    padding: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  popularList: {
    flexGrow: 0,
  },
  popularItem: {
    alignItems: 'center',
    padding: 12,
    marginRight: 12,
    borderRadius: 12,
    minWidth: 80,
  },
  popularIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  popularName: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  categoriesList: {
    flex: 1,
  },
  categoriesContent: {
    padding: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  categoryInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryIconText: {
    fontSize: 20,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  categoryType: {
    fontSize: 14,
    textTransform: 'capitalize',
  },
  metaSeparator: {
    marginHorizontal: 8,
    fontSize: 12,
  },
  usageCount: {
    fontSize: 12,
  },
  customBadge: {
    fontSize: 12,
    fontWeight: '500',
  },
  categoryDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  categoryActions: {
    marginLeft: 12,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    margin: 16,
    borderRadius: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
  },
  errorDismiss: {
    fontSize: 14,
    fontWeight: '600',
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
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  cancelButton: {
    fontSize: 16,
  },
  formContent: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 20,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  formActions: {
    paddingTop: 16,
    marginBottom: 32,
  },
  saveButton: {
    width: '100%',
  },
});
