import React, { useEffect, useState } from 'react';
import { View, Button, Alert, Modal, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as BackupService from '../services/backupService';
import * as LockService from '../services/lockService';
import { t } from '../i18n';


export default function SettingsScreen() {
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [biometricEnabled, setBiometricEnabled] = useState(false);

    useEffect(() => {
        (async () => {
            const avail = await LockService.isBiometricAvailable();
            const enabled = await LockService.isBiometricEnabled();
            setBiometricAvailable(avail);
            setBiometricEnabled(enabled);
        })();
    }, []);
    const [exportModalVisible, setExportModalVisible] = useState(false);
    const [exportPassword, setExportPassword] = useState('');
    const [exportPasswordConfirm, setExportPasswordConfirm] = useState('');

    const [importModalVisible, setImportModalVisible] = useState(false);
    const [importPassword, setImportPassword] = useState('');
    const [importFileContent, setImportFileContent] = useState<string | null>(null);

    const setPin = async () => {
        await LockService.setPin('1234');
        Alert.alert('PIN set to 1234 (demo)');
    };

    const toggleBiometric = async () => {
        if (!biometricAvailable) return Alert.alert('Biometrics not available');
        await LockService.enableBiometric(!biometricEnabled);
        setBiometricEnabled(!biometricEnabled);
        Alert.alert('Biometric ' + (!biometricEnabled ? 'enabled' : 'disabled'));
    };

    const onOpenExport = () => {
        setExportPassword(''); setExportPasswordConfirm(''); setExportModalVisible(true);
    };

    const onConfirmExport = async () => {
        if (!exportPassword || exportPassword.length < 6) return Alert.alert('Password must be at least 6 characters');
        if (exportPassword !== exportPasswordConfirm) return Alert.alert('Passwords do not match');
        try {
            const envelope = await BackupService.createBackup(exportPassword);
            const fs = await import('expo-file-system');
            const path = `${fs.documentDirectory}ft-backup-${Date.now()}.ftbak`;
            await fs.writeAsStringAsync(path, envelope, { encoding: fs.EncodingType.UTF8 });
            try {
                const sharing = await import('expo-sharing');
                if (sharing.isAvailableAsync) {
                    const avail = await sharing.isAvailableAsync();
                    if (avail) await sharing.shareAsync(path);
                }
            } catch (e) { /* ignore */ }
            setExportModalVisible(false);
            Alert.alert('Backup saved', `Saved to ${path}`);
        } catch (e: any) {
            Alert.alert('Export failed', e.message || String(e));
        }
    };

    const onPickImportFile = async () => {
        try {
            const docPicker = await import('expo-document-picker');
            const res = await docPicker.getDocumentAsync({ type: '*/*' });
            if (res.type !== 'success' || !res.uri) return;
            const fs = await import('expo-file-system');
            const text = await fs.readAsStringAsync(res.uri, { encoding: fs.EncodingType.UTF8 });
            setImportFileContent(text);
            setImportPassword('');
            setImportModalVisible(true);
        } catch (e: any) {
            Alert.alert('Import failed', e.message || String(e));
        }
    };

    const onConfirmImport = async () => {
        if (!importFileContent) return Alert.alert('No file selected');
        if (!importPassword) return Alert.alert('Please enter the backup password');
        try {
            const res = await BackupService.restoreFromEncrypted(importFileContent, importPassword);
            setImportModalVisible(false);
            setImportFileContent(null);
            Alert.alert('Import complete', `Imported ${res.created} transactions, ${res.errors} errors.`);
        } catch (e: any) {
            Alert.alert('Import failed', e.message || String(e));
        }
    };

    return (
        <View style={{ padding: 16 }}>
            <Button title={t('create_backup')} onPress={onOpenExport} />
            <View style={{ height: 12 }} />
            <Button title={t('import_backup')} onPress={onPickImportFile} />
            <View style={{ height: 12 }} />
            <Button title={t('set_demo_pin')} onPress={setPin} />
            <View style={{ height: 12 }} />
            {biometricAvailable ? (
                <Button title={biometricEnabled ? t('disable_biometrics') : t('enable_biometrics')} onPress={toggleBiometric} />
            ) : null}

            {/* Export modal */}
            <Modal visible={exportModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Enter password for backup</Text>
                        <TextInput value={exportPassword} onChangeText={setExportPassword} secureTextEntry placeholder="Password" style={styles.input} />
                        <TextInput value={exportPasswordConfirm} onChangeText={setExportPasswordConfirm} secureTextEntry placeholder="Confirm password" style={styles.input} />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <TouchableOpacity onPress={() => setExportModalVisible(false)} style={styles.modalButton}><Text>Cancel</Text></TouchableOpacity>
                            <TouchableOpacity onPress={onConfirmExport} style={styles.modalButton}><Text>Export</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Import modal */}
            <Modal visible={importModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Enter password to restore backup</Text>
                        <TextInput value={importPassword} onChangeText={setImportPassword} secureTextEntry placeholder="Backup password" style={styles.input} />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <TouchableOpacity onPress={() => setImportModalVisible(false)} style={styles.modalButton}><Text>Cancel</Text></TouchableOpacity>
                            <TouchableOpacity onPress={onConfirmImport} style={styles.modalButton}><Text>Restore</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '90%', backgroundColor: '#fff', padding: 16, borderRadius: 8 },
    modalTitle: { fontWeight: '600', marginBottom: 12 },
    input: { borderWidth: 1, borderColor: '#ddd', padding: 8, marginBottom: 12 },
    modalButton: { padding: 12 }
});
