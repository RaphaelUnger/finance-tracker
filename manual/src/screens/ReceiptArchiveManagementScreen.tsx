import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  FlatList
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useTheme } from '../hooks/useTheme';
import MerchantRecognitionService, { MerchantInfo } from '../services/merchantRecognitionService';
import OCRService from '../services/ocrService';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { LoadingOverlay } from '../components/LoadingOverlay';

interface ReceiptArchiveManagementScreenProps {
  navigation: any;
}

const ReceiptArchiveManagementScreen: React.FC<ReceiptArchiveManagementScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'archive' | 'merchants' | 'learning' | 'stats'>('archive');

  // Archive state
  const [savedReceipts, setSavedReceipts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredReceipts, setFilteredReceipts] = useState<any[]>([]);

  // Merchants state
  const [merchants, setMerchants] = useState<MerchantInfo[]>([]);
  const [showAddMerchantModal, setShowAddMerchantModal] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<MerchantInfo | null>(null);

  // Learning state
  const [learningStats, setLearningStats] = useState<any>(null);
  const [ocrStats, setOcrStats] = useState<any>(null);

  const styles = createStyles(theme);

  useEffect(() => {
    loadData();
  }, [selectedTab]);

  useEffect(() => {
    // Filter receipts based on search query
    if (searchQuery.trim() === '') {
      setFilteredReceipts(savedReceipts);
    } else {
      const filtered = savedReceipts.filter(receipt =>
        receipt.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        receipt.merchant?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredReceipts(filtered);
    }
  }, [searchQuery, savedReceipts]);

  const loadData = async () => {
    try {
      setLoading(true);

      switch (selectedTab) {
        case 'archive':
          await loadReceiptArchive();
          break;
        case 'merchants':
          await loadMerchants();
          break;
        case 'learning':
        case 'stats':
          await loadStatistics();
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Fehler', 'Daten konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };

  const loadReceiptArchive = async () => {
    try {
      const receipts = await OCRService.getSavedReceipts();
      setSavedReceipts(receipts);
    } catch (error) {
      console.error('Error loading receipt archive:', error);
      setSavedReceipts([]);
    }
  };

  const loadMerchants = async () => {
    try {
      await MerchantRecognitionService.initialize();
      const merchantSuggestions = await MerchantRecognitionService.getMerchantSuggestions('', 50);
      setMerchants(merchantSuggestions);
    } catch (error) {
      console.error('Error loading merchants:', error);
      setMerchants([]);
    }
  };

  const loadStatistics = async () => {
    try {
      const [merchantStats, ocrStatsData] = await Promise.all([
        MerchantRecognitionService.getRecognitionStats(),
        OCRService.getOCRStats()
      ]);
      setLearningStats(merchantStats);
      setOcrStats(ocrStatsData);
    } catch (error) {
      console.error('Error loading statistics:', error);
      setLearningStats(null);
      setOcrStats(null);
    }
  };

  const handleDeleteReceipt = async (receiptId: string, imagePath: string) => {
    Alert.alert(
      'Beleg löschen',
      'Möchten Sie diesen Beleg wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await OCRService.deleteReceiptImage(imagePath);
              await loadReceiptArchive();
              Alert.alert('Erfolg', 'Beleg wurde gelöscht.');
            } catch (error) {
              console.error('Error deleting receipt:', error);
              Alert.alert('Fehler', 'Beleg konnte nicht gelöscht werden.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleAddMerchant = () => {
    setEditingMerchant(null);
    setShowAddMerchantModal(true);
  };

  const handleEditMerchant = (merchant: MerchantInfo) => {
    setEditingMerchant(merchant);
    setShowAddMerchantModal(true);
  };

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, selectedTab === 'archive' && styles.activeTab]}
        onPress={() => setSelectedTab('archive')}
      >
        <Icon name="folder" size={16} color={selectedTab === 'archive' ? theme.colors.onPrimary : theme.colors.onSurfaceVariant} />
        <Text style={[styles.tabText, selectedTab === 'archive' && styles.activeTabText]}>
          Archiv
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, selectedTab === 'merchants' && styles.activeTab]}
        onPress={() => setSelectedTab('merchants')}
      >
        <Icon name="store" size={16} color={selectedTab === 'merchants' ? theme.colors.onPrimary : theme.colors.onSurfaceVariant} />
        <Text style={[styles.tabText, selectedTab === 'merchants' && styles.activeTabText]}>
          Merchants
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, selectedTab === 'learning' && styles.activeTab]}
        onPress={() => setSelectedTab('learning')}
      >
        <Icon name="psychology" size={16} color={selectedTab === 'learning' ? theme.colors.onPrimary : theme.colors.onSurfaceVariant} />
        <Text style={[styles.tabText, selectedTab === 'learning' && styles.activeTabText]}>
          Lernen
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, selectedTab === 'stats' && styles.activeTab]}
        onPress={() => setSelectedTab('stats')}
      >
        <Icon name="analytics" size={16} color={selectedTab === 'stats' ? theme.colors.onPrimary : theme.colors.onSurfaceVariant} />
        <Text style={[styles.tabText, selectedTab === 'stats' && styles.activeTabText]}>
          Stats
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderArchiveTab = () => (
    <View style={styles.tabContent}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color={theme.colors.onSurfaceVariant} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Belege durchsuchen..."
          placeholderTextColor={theme.colors.onSurfaceVariant}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Icon name="clear" size={20} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
        )}
      </View>

      {/* Receipts List */}
      <FlatList
        data={filteredReceipts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.receiptCard}>
            <View style={styles.receiptHeader}>
              <View style={styles.receiptInfo}>
                <Text style={styles.receiptId}>ID: {item.id}</Text>
                <Text style={styles.receiptDate}>
                  {new Date(item.timestamp).toLocaleDateString('de-DE')}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => handleDeleteReceipt(item.id, item.path)}
                style={styles.deleteButton}
              >
                <Icon name="delete" size={20} color={theme.colors.error} />
              </TouchableOpacity>
            </View>

            <Text style={styles.receiptPath} numberOfLines={1}>
              {item.path}
            </Text>

            <View style={styles.receiptActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Icon name="visibility" size={16} color={theme.colors.primary} />
                <Text style={styles.actionButtonText}>Anzeigen</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <Icon name="text-fields" size={16} color={theme.colors.primary} />
                <Text style={styles.actionButtonText}>OCR</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Icon name="folder-open" size={64} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.emptyStateText}>
              {searchQuery ? 'Keine Belege gefunden' : 'Keine Belege im Archiv'}
            </Text>
            {searchQuery && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchButton}>
                <Text style={styles.clearSearchText}>Suche zurücksetzen</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        contentContainerStyle={filteredReceipts.length === 0 ? { flex: 1 } : undefined}
      />
    </View>
  );

  const renderMerchantsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Merchant-Datenbank</Text>
        <TouchableOpacity onPress={handleAddMerchant} style={styles.addButton}>
          <Icon name="add" size={20} color={theme.colors.onPrimary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={merchants}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.merchantCard}>
            <View style={styles.merchantHeader}>
              <View style={styles.merchantInfo}>
                <Text style={styles.merchantName}>{item.name}</Text>
                <Text style={styles.merchantCategory}>{item.category}</Text>
                <Text style={styles.merchantType}>{item.businessType}</Text>
              </View>

              <View style={styles.merchantActions}>
                <TouchableOpacity
                  onPress={() => handleEditMerchant(item)}
                  style={styles.merchantActionButton}
                >
                  <Icon name="edit" size={16} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {item.aliases.length > 0 && (
              <View style={styles.merchantAliases}>
                <Text style={styles.aliasesLabel}>Aliase:</Text>
                <Text style={styles.aliasesText}>{item.aliases.join(', ')}</Text>
              </View>
            )}

            {item.tags.length > 0 && (
              <View style={styles.merchantTags}>
                {item.tags.slice(0, 3).map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Icon name="store" size={64} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.emptyStateText}>Keine Merchants gefunden</Text>
          </View>
        )}
        contentContainerStyle={merchants.length === 0 ? { flex: 1 } : undefined}
      />
    </View>
  );

  const renderLearningTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Machine Learning Status</Text>

      {learningStats && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{learningStats.totalMerchants}</Text>
            <Text style={styles.statLabel}>Merchants Total</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{learningStats.activeMerchants}</Text>
            <Text style={styles.statLabel}>Aktive Merchants</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{learningStats.learningEntries}</Text>
            <Text style={styles.statLabel}>Lerneinträge</Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.subsectionTitle}>Top Kategorien</Text>
        {learningStats?.topCategories?.map((category: any, index: number) => (
          <View key={index} style={styles.categoryItem}>
            <Text style={styles.categoryName}>{category.category}</Text>
            <Text style={styles.categoryCount}>{category.count} Merchants</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.subsectionTitle}>Kürzliche Lernvorgänge</Text>
        {learningStats?.recentLearnings?.slice(0, 5).map((learning: any, index: number) => (
          <View key={index} style={styles.learningItem}>
            <Text style={styles.learningMerchant}>{learning.merchantName}</Text>
            <Text style={styles.learningCategory}>{learning.category}</Text>
            <Text style={styles.learningFrequency}>
              {learning.frequency}x erkannt
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderStatsTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>OCR Performance</Text>

      {ocrStats && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{ocrStats.totalProcessed}</Text>
            <Text style={styles.statLabel}>Verarbeitete Belege</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{(ocrStats.averageConfidence * 100).toFixed(1)}%</Text>
            <Text style={styles.statLabel}>Ø Konfidenz</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{(ocrStats.averageProcessingTime / 1000).toFixed(1)}s</Text>
            <Text style={styles.statLabel}>Ø Verarbeitung</Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.subsectionTitle}>Top erkannte Merchants</Text>
        {ocrStats?.topMerchants?.map((merchant: string, index: number) => (
          <View key={index} style={styles.topMerchantItem}>
            <Text style={styles.topMerchantRank}>#{index + 1}</Text>
            <Text style={styles.topMerchantName}>{merchant}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.subsectionTitle}>Genauigkeits-Trend</Text>
        <View style={styles.trendContainer}>
          {ocrStats?.accuracyTrend?.map((accuracy: number, index: number) => (
            <View key={index} style={styles.trendItem}>
              <View
                style={[
                  styles.trendBar,
                  { height: `${accuracy * 100}%`, backgroundColor: theme.colors.primary }
                ]}
              />
              <Text style={styles.trendLabel}>W{index + 1}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderContent = () => {
    switch (selectedTab) {
      case 'archive':
        return renderArchiveTab();
      case 'merchants':
        return renderMerchantsTab();
      case 'learning':
        return renderLearningTab();
      case 'stats':
        return renderStatsTab();
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <LoadingOverlay visible={loading} />

      {renderTabBar()}
      {renderContent()}

      {/* Add/Edit Merchant Modal */}
      <Modal
        visible={showAddMerchantModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddMerchantModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingMerchant ? 'Merchant bearbeiten' : 'Neuer Merchant'}
            </Text>
            <TouchableOpacity
              onPress={() => setShowAddMerchantModal(false)}
              style={styles.modalCloseButton}
            >
              <Icon name="close" size={24} color={theme.colors.onSurface} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Merchant form would go here */}
            <Text style={styles.modalPlaceholder}>
              Merchant-Formular wird hier implementiert
            </Text>
          </ScrollView>

          <View style={styles.modalActions}>
            <Button
              title="Abbrechen"
              variant="outline"
              onPress={() => setShowAddMerchantModal(false)}
              style={styles.modalButton}
            />
            <Button
              title={editingMerchant ? 'Aktualisieren' : 'Erstellen'}
              onPress={() => {
                // Handle save
                setShowAddMerchantModal(false);
              }}
              style={styles.modalButton}
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
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 6,
    gap: 4
  },
  activeTab: {
    backgroundColor: theme.colors.primary
  },
  tabText: {
    fontSize: 10,
    fontWeight: '500',
    color: theme.colors.onSurfaceVariant
  },
  activeTabText: {
    color: theme.colors.onPrimary
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.outline
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.onSurface
  },
  clearButton: {
    padding: 4
  },
  receiptCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.outline
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  receiptInfo: {
    flex: 1
  },
  receiptId: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary
  },
  receiptDate: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2
  },
  deleteButton: {
    padding: 4
  },
  receiptPath: {
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
    fontFamily: 'monospace',
    marginBottom: 8
  },
  receiptActions: {
    flexDirection: 'row',
    gap: 16
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  actionButtonText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500'
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  merchantCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.outline
  },
  merchantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  merchantInfo: {
    flex: 1
  },
  merchantName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface
  },
  merchantCategory: {
    fontSize: 12,
    color: theme.colors.primary,
    marginTop: 2
  },
  merchantType: {
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
    textTransform: 'capitalize'
  },
  merchantActions: {
    flexDirection: 'row'
  },
  merchantActionButton: {
    padding: 8
  },
  merchantAliases: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  aliasesLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.onSurfaceVariant,
    marginRight: 8,
    minWidth: 40
  },
  aliasesText: {
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
    flex: 1
  },
  merchantTags: {
    flexDirection: 'row',
    gap: 4
  },
  tag: {
    backgroundColor: theme.colors.primaryContainer,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  tagText: {
    fontSize: 9,
    color: theme.colors.onPrimaryContainer,
    fontWeight: '500'
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.outline
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center'
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 12
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline
  },
  categoryName: {
    fontSize: 14,
    color: theme.colors.onSurface
  },
  categoryCount: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant
  },
  learningItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline
  },
  learningMerchant: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurface
  },
  learningCategory: {
    fontSize: 12,
    color: theme.colors.primary,
    marginTop: 2
  },
  learningFrequency: {
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2
  },
  topMerchantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline
  },
  topMerchantRank: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginRight: 12,
    minWidth: 30
  },
  topMerchantName: {
    fontSize: 14,
    color: theme.colors.onSurface
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 60,
    gap: 8
  },
  trendItem: {
    flex: 1,
    alignItems: 'center'
  },
  trendBar: {
    width: '100%',
    minHeight: 4,
    borderRadius: 2,
    marginBottom: 4
  },
  trendLabel: {
    fontSize: 9,
    color: theme.colors.onSurfaceVariant
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60
  },
  emptyStateText: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    marginTop: 16,
    textAlign: 'center'
  },
  clearSearchButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.primaryContainer,
    borderRadius: 16
  },
  clearSearchText: {
    fontSize: 12,
    color: theme.colors.onPrimaryContainer,
    fontWeight: '500'
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface
  },
  modalCloseButton: {
    padding: 4
  },
  modalContent: {
    flex: 1,
    padding: 20
  },
  modalPlaceholder: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 40
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20
  },
  modalButton: {
    flex: 1
  }
});

export default ReceiptArchiveManagementScreen;
