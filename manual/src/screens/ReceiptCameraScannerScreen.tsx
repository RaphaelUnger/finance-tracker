import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  Modal,
  ActivityIndicator,
  Dimensions,
  Platform
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useTheme } from '../hooks/useTheme';
import OCRService, { OCRResult } from '../services/ocrService';
import ReceiptParser, { ParsedReceipt } from '../services/receiptParser';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { Transaction } from '../types';
import { useDispatch } from 'react-redux';
import { addTransaction } from '../store/slices/transactionsSlice';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ReceiptCameraScannerProps {
  navigation: any;
  route?: {
    params?: {
      onReceiptScanned?: (transaction: Partial<Transaction>) => void;
    };
  };
}

const ReceiptCameraScannerScreen: React.FC<ReceiptCameraScannerProps> = ({
  navigation,
  route
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const cameraRef = useRef<Camera>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] = useState(CameraType.back);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [parsedReceipt, setParsedReceipt] = useState<ParsedReceipt | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Partial<Transaction> | null>(null);

  const styles = createStyles(theme);

  useEffect(() => {
    getCameraPermissions();
  }, []);

  const getCameraPermissions = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');

      if (status !== 'granted') {
        Alert.alert(
          'Kamera-Berechtigung erforderlich',
          'Bitte erlauben Sie den Zugriff auf die Kamera, um Belege zu scannen.',
          [
            { text: 'Einstellungen', onPress: () => {/* Open settings */} },
            { text: 'Abbrechen', onPress: () => navigation.goBack() }
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      setHasPermission(false);
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current || isCapturing) return;

    try {
      setIsCapturing(true);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: false,
      });

      setCapturedImage(photo.uri);
      processReceipt(photo.uri);

    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Fehler', 'Foto konnte nicht aufgenommen werden.');
    } finally {
      setIsCapturing(false);
    }
  };

  const processReceipt = async (imageUri: string) => {
    try {
      setIsProcessing(true);

      // Initialize OCR if needed
      await OCRService.initialize('deu+eng');

      // Perform OCR
      const ocrResult = await OCRService.recognizeText(imageUri, {
        preprocessing: true,
        confidence: 0.3
      });

      setOcrResult(ocrResult);

      // Parse receipt data
      const parsedResult = await ReceiptParser.parseReceipt(
        ocrResult.text,
        ocrResult.confidence
      );

      setParsedReceipt(parsedResult);

      // Set up editable transaction
      if (parsedResult.suggestedTransaction) {
        setEditingTransaction(parsedResult.suggestedTransaction);
      }

      setShowResultModal(true);

    } catch (error) {
      console.error('Error processing receipt:', error);

      Alert.alert(
        'OCR-Fehler',
        `Der Beleg konnte nicht verarbeitet werden: ${error.message}`,
        [
          { text: 'Erneut versuchen', onPress: () => retryCapture() },
          { text: 'Manuell eingeben', onPress: () => createManualTransaction() },
          { text: 'Abbrechen' }
        ]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const retryCapture = () => {
    setCapturedImage(null);
    setOcrResult(null);
    setParsedReceipt(null);
    setEditingTransaction(null);
    setShowResultModal(false);
  };

  const createManualTransaction = () => {
    setEditingTransaction({
      amount: 0,
      description: '',
      date: Date.now(),
      type: 'expense',
      categoryId: '',
      notes: 'Manuell eingegeben - OCR fehlgeschlagen'
    });
    setShowResultModal(true);
  };

  const saveTransaction = async () => {
    if (!editingTransaction || !editingTransaction.amount || editingTransaction.amount <= 0) {
      Alert.alert('Fehler', 'Bitte geben Sie einen gültigen Betrag ein.');
      return;
    }

    if (!editingTransaction.description?.trim()) {
      Alert.alert('Fehler', 'Bitte geben Sie eine Beschreibung ein.');
      return;
    }

    try {
      const transaction: Transaction = {
        id: Date.now().toString(),
        amount: editingTransaction.amount,
        description: editingTransaction.description.trim(),
        date: editingTransaction.date || Date.now(),
        type: editingTransaction.type || 'expense',
        categoryId: editingTransaction.categoryId || '',
        notes: editingTransaction.notes || '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deletedAt: null
      };

      // Save receipt image if available
      if (capturedImage) {
        try {
          const savedImagePath = await OCRService.saveReceiptImage(
            capturedImage,
            transaction.id
          );
          transaction.notes += `\nReceipt image: ${savedImagePath}`;
        } catch (error) {
          console.warn('Failed to save receipt image:', error);
        }
      }

      // Dispatch to store
      dispatch(addTransaction(transaction));

      // Call callback if provided
      if (route?.params?.onReceiptScanned) {
        route.params.onReceiptScanned(transaction);
      }

      Alert.alert(
        'Erfolg',
        'Transaktion wurde erfolgreich erstellt!',
        [
          { text: 'Weitere scannen', onPress: () => retryCapture() },
          { text: 'Fertig', onPress: () => navigation.goBack() }
        ]
      );

    } catch (error) {
      console.error('Error saving transaction:', error);
      Alert.alert('Fehler', 'Transaktion konnte nicht gespeichert werden.');
    }
  };

  const flipCamera = () => {
    setCameraType(
      cameraType === CameraType.back ? CameraType.front : CameraType.back
    );
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <LoadingOverlay visible={true} message="Kamera wird geladen..." />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <View style={styles.noPermissionContainer}>
          <Icon name="camera-alt" size={64} color={theme.colors.textSecondary} />
          <Text style={styles.noPermissionText}>
            Keine Kamera-Berechtigung
          </Text>
          <Text style={styles.noPermissionSubtext}>
            Bitte erlauben Sie den Zugriff auf die Kamera in den Einstellungen.
          </Text>
          <Button
            title="Zu den Einstellungen"
            onPress={getCameraPermissions}
            style={styles.permissionButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!capturedImage ? (
        <>
          <Camera
            ref={cameraRef}
            style={styles.camera}
            type={cameraType}
            autoFocus={Camera.Constants.AutoFocus.on}
          />

          {/* Camera overlay */}
          <View style={styles.cameraOverlay}>
            {/* Receipt frame guide */}
            <View style={styles.receiptFrame}>
              <View style={styles.frameCorner} />
              <View style={[styles.frameCorner, styles.frameCornerTopRight]} />
              <View style={[styles.frameCorner, styles.frameCornerBottomLeft]} />
              <View style={[styles.frameCorner, styles.frameCornerBottomRight]} />
            </View>

            {/* Instructions */}
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsText}>
                Positionieren Sie den Beleg innerhalb des Rahmens
              </Text>
              <Text style={styles.instructionsSubtext}>
                Achten Sie auf gute Beleuchtung und scharfen Text
              </Text>
            </View>
          </View>

          {/* Camera controls */}
          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="close" size={24} color={theme.colors.onPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePicture}
              disabled={isCapturing}
            >
              {isCapturing ? (
                <ActivityIndicator size="large" color={theme.colors.onPrimary} />
              ) : (
                <View style={styles.captureButtonInner} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={flipCamera}
            >
              <Icon name="flip-camera-ios" size={24} color={theme.colors.onPrimary} />
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedImage }} style={styles.previewImage} />

          <View style={styles.previewControls}>
            <Button
              title="Erneut scannen"
              variant="outline"
              onPress={retryCapture}
              style={styles.previewButton}
            />

            <Button
              title="Verwenden"
              onPress={() => setShowResultModal(true)}
              style={styles.previewButton}
              disabled={isProcessing}
            />
          </View>
        </View>
      )}

      {/* Processing overlay */}
      <LoadingOverlay
        visible={isProcessing}
        message="Beleg wird verarbeitet..."
      />

      {/* Results modal */}
      <Modal
        visible={showResultModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowResultModal(false)}
      >
        <ScrollView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Beleg-Details</Text>
            <TouchableOpacity
              onPress={() => setShowResultModal(false)}
              style={styles.modalCloseButton}
            >
              <Icon name="close" size={24} color={theme.colors.onSurface} />
            </TouchableOpacity>
          </View>

          {/* OCR Results */}
          {ocrResult && (
            <View style={styles.resultSection}>
              <Text style={styles.sectionTitle}>
                OCR-Ergebnis (Vertrauen: {Math.round(ocrResult.confidence * 100)}%)
              </Text>
              <ScrollView style={styles.ocrTextContainer}>
                <Text style={styles.ocrText}>{ocrResult.text}</Text>
              </ScrollView>
            </View>
          )}

          {/* Parsed Data */}
          {parsedReceipt && (
            <View style={styles.resultSection}>
              <Text style={styles.sectionTitle}>Extrahierte Daten</Text>

              {parsedReceipt.parseErrors.length > 0 && (
                <View style={styles.errorsContainer}>
                  <Text style={styles.errorsTitle}>Warnungen:</Text>
                  {parsedReceipt.parseErrors.map((error, index) => (
                    <Text key={index} style={styles.errorText}>• {error}</Text>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Editable transaction form */}
          {editingTransaction && (
            <View style={styles.resultSection}>
              <Text style={styles.sectionTitle}>Transaktion bearbeiten</Text>

              <Input
                label="Betrag (€)"
                value={editingTransaction.amount?.toString() || ''}
                onChangeText={(text) => setEditingTransaction({
                  ...editingTransaction,
                  amount: parseFloat(text) || 0
                })}
                keyboardType="decimal-pad"
                style={styles.input}
              />

              <Input
                label="Beschreibung"
                value={editingTransaction.description || ''}
                onChangeText={(text) => setEditingTransaction({
                  ...editingTransaction,
                  description: text
                })}
                style={styles.input}
              />

              <Input
                label="Notizen"
                value={editingTransaction.notes || ''}
                onChangeText={(text) => setEditingTransaction({
                  ...editingTransaction,
                  notes: text
                })}
                multiline
                numberOfLines={3}
                style={styles.input}
              />

              <View style={styles.modalButtons}>
                <Button
                  title="Abbrechen"
                  variant="outline"
                  onPress={() => setShowResultModal(false)}
                  style={styles.modalButton}
                />

                <Button
                  title="Transaktion erstellen"
                  onPress={saveTransaction}
                  style={styles.modalButton}
                />
              </View>
            </View>
          )}
        </ScrollView>
      </Modal>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  camera: {
    flex: 1
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center'
  },
  receiptFrame: {
    width: screenWidth * 0.8,
    height: screenHeight * 0.6,
    position: 'relative'
  },
  frameCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: theme.colors.primary,
    top: 0,
    left: 0
  },
  frameCornerTopRight: {
    transform: [{ rotate: '90deg' }],
    top: 0,
    right: 0,
    left: undefined
  },
  frameCornerBottomLeft: {
    transform: [{ rotate: '-90deg' }],
    bottom: 0,
    top: undefined
  },
  frameCornerBottomRight: {
    transform: [{ rotate: '180deg' }],
    bottom: 0,
    right: 0,
    top: undefined,
    left: undefined
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  instructionsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4
  },
  instructionsSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textAlign: 'center'
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white'
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white'
  },
  previewContainer: {
    flex: 1
  },
  previewImage: {
    flex: 1,
    resizeMode: 'contain'
  },
  previewControls: {
    flexDirection: 'row',
    padding: 20,
    justifyContent: 'space-around',
    backgroundColor: theme.colors.surface
  },
  previewButton: {
    flex: 1,
    marginHorizontal: 8
  },
  noPermissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  noPermissionText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center'
  },
  noPermissionSubtext: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24
  },
  permissionButton: {
    minWidth: 200
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
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.onSurface
  },
  modalCloseButton: {
    padding: 4
  },
  resultSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 12
  },
  ocrTextContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 12,
    maxHeight: 150
  },
  ocrText: {
    fontSize: 12,
    color: theme.colors.onSurface,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  errorsContainer: {
    backgroundColor: theme.colors.errorContainer,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12
  },
  errorsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onErrorContainer,
    marginBottom: 8
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.onErrorContainer,
    marginBottom: 4
  },
  input: {
    marginBottom: 12
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20
  },
  modalButton: {
    flex: 1
  }
});

export default ReceiptCameraScannerScreen;
