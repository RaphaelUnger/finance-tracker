import React, { useState } from 'react';
import { View, Text, Image, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import ThemedButton from '../components/ThemedButton';
import type { NavProps } from '../types/navigation';
import { detectText } from '../services/ocrService';
import { useI18n } from '../i18n/react';
import receiptParser from '../services/receiptParser';
import { increment } from '../services/analytics';

type Props = NavProps;

function Scan({ navigation }: Props) {
    const [busy, setBusy] = useState(false);
    const [imageUri, setImageUri] = useState(null as string | null);
    const { t } = useI18n();
    const theme = useTheme();

    async function pickImage() {
        setBusy(true);
        try {
            const ImagePicker = await import('expo-image-picker');
            // Request media library permissions. Some versions expose different names; try both.
            let perm: any;
            if (typeof (ImagePicker as any).requestMediaLibraryPermissionsAsync === 'function') {
                perm = await (ImagePicker as any).requestMediaLibraryPermissionsAsync();
            } else if (typeof (ImagePicker as any).getMediaLibraryPermissionsAsync === 'function') {
                perm = await (ImagePicker as any).getMediaLibraryPermissionsAsync();
            } else {
                // Fallback to camera permissions as a last resort
                perm = await (ImagePicker as any).requestCameraPermissionsAsync();
            }
            if (!perm || !perm.granted) {
                Alert.alert(t('scan.permission_required'), t('scan.camera_permission_required'));
                return;
            }
            const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
            // handle both 'cancelled' and 'canceled' return shapes
            if ((res as any).cancelled || (res as any).canceled) return;
            // @ts-ignore
            const pickedUri = (res as any).uri || ((res as any).assets && (res as any).assets[0] && (res as any).assets[0].uri);
            if (!pickedUri) return;
            setImageUri(pickedUri);
            // run OCR using the picked URI
            const ocr = await detectText(pickedUri);
            if (ocr.error) {
                // OCR backend not available or failed
                Alert.alert(t('scan.ocr_error'), ocr.error + '\n\n' + (t('scan.ocr_install_hint') || "Install 'tesseract.js' or provide a native OCR implementation."));
                await increment('ocr_failure');
                return;
            }
            const suggestion = receiptParser.parseReceiptText(ocr.text || '');
            await increment('ocr_success');
            navigation.navigate('ScanReview', { suggestion, imageUri: pickedUri });
        } catch (e: any) {
            Alert.alert(t('scan.ocr_error'), e && e.message ? e.message : String(e));
        } finally {
            setBusy(false);
        }
    }

    async function takePhoto() {
        setBusy(true);
        try {
            const Camera = await import('expo-image-picker');
            const perm = await Camera.requestCameraPermissionsAsync();
            if (!perm.granted) { Alert.alert(t('scan.permission_required'), t('scan.camera_permission_required')); return; }
            const res = await Camera.launchCameraAsync({ quality: 0.8 });
            if ((res as any).cancelled || (res as any).canceled) return;
            const photoUri = (res as any).uri || ((res as any).assets && (res as any).assets[0] && (res as any).assets[0].uri);
            if (!photoUri) return;
            setImageUri(photoUri);
            const ocr = await detectText(photoUri);
            if (ocr.error) {
                Alert.alert(t('scan.ocr_error'), ocr.error + '\n\n' + (t('scan.ocr_install_hint') || "Install 'tesseract.js' or provide a native OCR implementation."));
                await increment('ocr_failure');
                return;
            }
            const suggestion = receiptParser.parseReceiptText(ocr.text || '');
            await increment('ocr_success');
            navigation.navigate('ScanReview', { suggestion, imageUri: photoUri });
        } catch (e: any) {
            await increment('ocr_failure');
            Alert.alert(t('scan.ocr_error'), e && e.message ? e.message : String(e));
        } finally {
            setBusy(false);
        }
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder }]}>
                <ThemedButton color={theme.colors.primary} title={t('scan.pick_from_gallery') || 'Pick image from gallery'} onPress={pickImage} />
                <View style={{ height: 12 }} />
                <ThemedButton color={theme.colors.primary} title={t('scan.take_photo') || 'Take photo'} onPress={takePhoto} />
                <View style={{ height: 16 }} />
                {busy ? <ActivityIndicator /> : null}
                {imageUri ? <Image source={{ uri: imageUri }} style={[styles.previewImage, { borderColor: theme.colors.cardBorder }]} /> : null}
            </View>
        </View>
    );
};

export default Scan;

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    screenHeader: { padding: 12, borderTopLeftRadius: 8, borderTopRightRadius: 8 },
    screenHeaderTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
    card: { padding: 14, borderRadius: 12, borderWidth: 1, margin: 6, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
    previewImage: { width: 220, height: 220, marginTop: 12, borderRadius: 10, borderWidth: 1 },
});
