import React, { useState } from 'react';
import { View, Text, Button, Image, ActivityIndicator, Alert } from 'react-native';
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

    async function pickImage() {
        setBusy(true);
        try {
            const ImagePicker = await import('expo-image-picker');
            const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
            if (res.cancelled) return;
            // @ts-ignore
            setImageUri(res.uri);
            // run OCR
            const ocr = await detectText(res.uri).catch((e) => { throw e; });
            const suggestion = receiptParser.parseReceiptText(ocr.text || '');
            await increment('ocr_success');
            navigation.navigate('ScanReview', { suggestion, imageUri: res.uri });
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
            if (res.cancelled) return;
            // @ts-ignore
            setImageUri(res.uri);
            const ocr = await detectText(res.uri);
            const suggestion = receiptParser.parseReceiptText(ocr.text || '');
            await increment('ocr_success');
            navigation.navigate('ScanReview', { suggestion, imageUri: res.uri });
        } catch (e: any) {
            await increment('ocr_failure');
            Alert.alert(t('scan.ocr_error'), e && e.message ? e.message : String(e));
        } finally {
            setBusy(false);
        }
    }

    return (
        <View style={{ flex: 1, padding: 16 }}>
            <Button title={t('scan.pick_from_gallery') || 'Pick image from gallery'} onPress={pickImage} />
            <View style={{ height: 12 }} />
            <Button title={t('scan.take_photo') || 'Take photo'} onPress={takePhoto} />
            <View style={{ height: 16 }} />
            {busy ? <ActivityIndicator /> : null}
            {imageUri ? <Image source={{ uri: imageUri }} style={{ width: 200, height: 200, marginTop: 12 }} /> : null}
        </View>
    );
};

export default Scan;
