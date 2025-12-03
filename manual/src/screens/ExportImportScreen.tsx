import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Share,
  StyleSheet
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';

import { RootState } from '../store';
import ExportService, { ExportOptions, ImportResult } from '../services/exportService';
import { useTheme } from '../hooks/useTheme';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { LoadingOverlay } from '../components/LoadingOverlay';

interface ExportImportScreenProps {
  navigation: any;
}

const ExportImportScreen: React.FC<ExportImportScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const { categories } = useSelector((state: RootState) => state.categories);
  const [loading, setLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf' | 'backup'>('csv');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1), // Start of year
    endDate: new Date()
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [backupPassword, setBackupPassword] = useState('');

  const styles = createStyles(theme);

  const handleExport = async () => {
    try {
      setLoading(true);

      const options: ExportOptions = {
        format: exportFormat,
        dateRange,
        categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        password: exportFormat === 'backup' ? backupPassword : undefined
      };

      // Validate backup password
      if (exportFormat === 'backup' && !backupPassword) {
        Alert.alert('Fehler', 'Passwort für Backup erforderlich');
        return;
      }

      let fileContent: string | Blob;
      let fileName: string;
      let mimeType: string;

      switch (exportFormat) {
        case 'csv':
          fileContent = await ExportService.exportToCSV(options);
          fileName = `transactions_${formatDateForFilename(new Date())}.csv`;
          mimeType = 'text/csv';
          break;
        case 'pdf':
          fileContent = await ExportService.exportToPDF(options);
          fileName = `report_${formatDateForFilename(new Date())}.pdf`;
          mimeType = 'application/pdf';
          break;
        case 'backup':
          fileContent = await ExportService.exportBackup(options);
          fileName = `backup_${formatDateForFilename(new Date())}.ftb`;
          mimeType = 'application/json';
          break;
      }

      await saveAndShareFile(fileContent, fileName, mimeType);

      Alert.alert(
        'Export erfolgreich',
        `${exportFormat.toUpperCase()} wurde erfolgreich erstellt und gespeichert.`
      );

    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Fehler', `Export fehlgeschlagen: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [
          DocumentPicker.types.csv,
          DocumentPicker.types.allFiles
        ],
        allowMultiSelection: false
      });

      if (result.length === 0) return;

      const file = result[0];
      setLoading(true);

      // Read file content
      const fileContent = await RNFS.readFile(file.uri, 'utf8');

      let importResult: ImportResult;

      if (file.name?.endsWith('.ftb') || file.type?.includes('json')) {
        // Backup file
        const password = await promptForPassword();
        if (!password) return;

        const blob = new Blob([fileContent], { type: 'application/json' });
        importResult = await ExportService.importFromBackup(blob, password);
      } else {
        // CSV file
        importResult = await ExportService.importFromCSV(fileContent);
      }

      showImportResult(importResult);

    } catch (error) {
      console.error('Import error:', error);
      if (error.message.includes('User canceled')) return;

      Alert.alert('Fehler', `Import fehlgeschlagen: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const saveAndShareFile = async (content: string | Blob, fileName: string, mimeType: string) => {
    try {
      let filePath: string;

      if (Platform.OS === 'ios') {
        filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      } else {
        filePath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
      }

      // Convert blob to string if needed
      const fileContent = typeof content === 'string'
        ? content
        : await blobToBase64(content);

      // Write file
      await RNFS.writeFile(
        filePath,
        typeof content === 'string' ? fileContent : fileContent.split(',')[1],
        typeof content === 'string' ? 'utf8' : 'base64'
      );

      // Share file
      if (Platform.OS === 'ios') {
        await Share.share({
          url: `file://${filePath}`,
          title: fileName
        });
      } else {
        await Share.share({
          url: `file://${filePath}`,
          title: 'Export',
          message: `Exported file: ${fileName}`
        });
      }

    } catch (error) {
      console.error('Save and share error:', error);
      throw new Error('Datei konnte nicht gespeichert werden');
    }
  };

  const promptForPassword = (): Promise<string | null> => {
    return new Promise((resolve) => {
      Alert.prompt(
        'Backup-Passwort',
        'Bitte geben Sie das Passwort für das Backup ein:',
        [
          {
            text: 'Abbrechen',
            style: 'cancel',
            onPress: () => resolve(null)
          },
          {
            text: 'OK',
            onPress: (password) => resolve(password || null)
          }
        ],
        'secure-text'
      );
    });
  };

  const showImportResult = (result: ImportResult) => {
    const message = [
      `Importiert: ${result.imported} Transaktionen`,
      result.duplicates > 0 ? `Duplikate übersprungen: ${result.duplicates}` : '',
      result.errors.length > 0 ? `Fehler: ${result.errors.length}` : ''
    ].filter(Boolean).join('\n');

    if (result.errors.length > 0) {
      Alert.alert(
        result.success ? 'Import teilweise erfolgreich' : 'Import fehlgeschlagen',
        message,
        [
          {
            text: 'Details anzeigen',
            onPress: () => showErrorDetails(result.errors)
          },
          { text: 'OK' }
        ]
      );
    } else {
      Alert.alert('Import erfolgreich', message);
    }
  };

  const showErrorDetails = (errors: string[]) => {
    Alert.alert(
      'Import-Fehler Details',
      errors.slice(0, 10).join('\n') + (errors.length > 10 ? `\n... und ${errors.length - 10} weitere` : ''),
      [{ text: 'OK' }]
    );
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const formatDateForFilename = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const toggleCategorySelection = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <LoadingOverlay visible={loading} />

      {/* Export Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Export</Text>

        {/* Format Selection */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Format</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={exportFormat}
              onValueChange={setExportFormat}
              style={styles.picker}
            >
              <Picker.Item label="CSV (Excel-kompatibel)" value="csv" />
              <Picker.Item label="PDF-Bericht" value="pdf" />
              <Picker.Item label="Verschlüsseltes Backup" value="backup" />
            </Picker>
          </View>
        </View>

        {/* Date Range */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Zeitraum</Text>
          <View style={styles.dateRangeContainer}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>
                Von: {dateRange.startDate.toLocaleDateString('de-DE')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>
                Bis: {dateRange.endDate.toLocaleDateString('de-DE')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Category Filter */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Kategorien (optional)</Text>
          <ScrollView style={styles.categoryList} showsVerticalScrollIndicator={false}>
            {categories.map(category => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryItem,
                  selectedCategories.includes(category.id) && styles.categoryItemSelected
                ]}
                onPress={() => toggleCategorySelection(category.id)}
              >
                <Text style={[
                  styles.categoryText,
                  selectedCategories.includes(category.id) && styles.categoryTextSelected
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Backup Password */}
        {exportFormat === 'backup' && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Backup-Passwort *</Text>
            <Input
              value={backupPassword}
              onChangeText={setBackupPassword}
              placeholder="Sicheres Passwort eingeben"
              secureTextEntry
              style={styles.input}
            />
          </View>
        )}

        <Button
          title="Exportieren"
          onPress={handleExport}
          style={styles.exportButton}
        />
      </View>

      {/* Import Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Import</Text>

        <Text style={styles.importDescription}>
          Unterstützte Formate: CSV-Dateien und verschlüsselte Backups (.ftb)
        </Text>

        <Button
          title="Datei auswählen und importieren"
          onPress={handleImport}
          variant="outline"
          style={styles.importButton}
        />
      </View>

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={dateRange.startDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(false);
            if (selectedDate) {
              setDateRange(prev => ({ ...prev, startDate: selectedDate }));
            }
          }}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={dateRange.endDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowEndDatePicker(false);
            if (selectedDate) {
              setDateRange(prev => ({ ...prev, endDate: selectedDate }));
            }
          }}
        />
      )}
    </ScrollView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 16
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 16
  },
  formGroup: {
    marginBottom: 16
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurface,
    marginBottom: 8
  },
  pickerContainer: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.outline
  },
  picker: {
    height: 50,
    color: theme.colors.onSurface
  },
  dateRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12
  },
  dateButton: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    padding: 12,
    alignItems: 'center'
  },
  dateButtonText: {
    color: theme.colors.onSurface,
    fontSize: 14
  },
  categoryList: {
    maxHeight: 120,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    padding: 4
  },
  categoryItem: {
    padding: 8,
    borderRadius: 6,
    marginVertical: 2
  },
  categoryItemSelected: {
    backgroundColor: theme.colors.primary + '20'
  },
  categoryText: {
    color: theme.colors.onSurface,
    fontSize: 14
  },
  categoryTextSelected: {
    color: theme.colors.primary,
    fontWeight: '500'
  },
  input: {
    marginBottom: 0
  },
  exportButton: {
    marginTop: 8
  },
  importDescription: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 16,
    lineHeight: 20
  },
  importButton: {
    marginTop: 8
  }
});

export default ExportImportScreen;
