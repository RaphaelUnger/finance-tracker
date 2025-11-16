import React, { useEffect, useState } from 'react';
import { View, Button, Alert, Modal, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as BackupService from '../services/backupService';
import * as LockService from '../services/lockService';
import i18n from '../i18n';
import { useI18n } from '../i18n/react';
import { Picker } from '@react-native-picker/picker';


export default function SettingsScreen() {
    const [biometricAvailable, setBiometricAvailable] = useState(false as boolean);
    const [biometricEnabled, setBiometricEnabled] = useState(false as boolean);
    const [availableLocales, setAvailableLocales] = useState([] as string[]);
    const [locale, setLocale] = useState(i18n.getLocale() as string);
    const { t, setLocale: setLocaleCtx } = useI18n();

    useEffect(() => {
        (async () => {
            const avail = await LockService.isBiometricAvailable();
            const enabled = await LockService.isBiometricEnabled();
            setBiometricAvailable(avail);
            setBiometricEnabled(enabled);
            // init i18n and load available locales
            try { await i18n.initI18n(); } catch (e) { }
            setAvailableLocales(i18n.getAvailableLocales());
            setLocale(i18n.getLocale());
        })();
    }, []);
    const [exportModalVisible, setExportModalVisible] = useState(false);
    const [exportPassword, setExportPassword] = useState('');
    const [exportPasswordConfirm, setExportPasswordConfirm] = useState('');

    const [importModalVisible, setImportModalVisible] = useState(false);
    const [importPassword, setImportPassword] = useState('');
    const [importFileContent, setImportFileContent] = useState(null as string | null);

    const setPin = async () => {
        await LockService.setPin('1234');
        Alert.alert(t('settings.demoPinSet'));
    };

    const toggleBiometric = async () => {
        if (!biometricAvailable) return Alert.alert('Biometrics not available');
        await LockService.enableBiometric(!biometricEnabled);
        setBiometricEnabled(!biometricEnabled);
        Alert.alert((t('settings.biometricToggled') || 'Biometric {state}').replace('{state}', !biometricEnabled ? 'enabled' : 'disabled'));
    };

    const onOpenExport = () => {
        setExportPassword(''); setExportPasswordConfirm(''); setExportModalVisible(true);
    };

    const onConfirmExport = async () => {
        if (!exportPassword || exportPassword.length < 6) return Alert.alert(t('password_too_short'));
        if (exportPassword !== exportPasswordConfirm) return Alert.alert(t('password_mismatch'));
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
            Alert.alert(t('settings.backup_saved'), t('settings.backup_saved_msg').replace('{path}', path));
        } catch (e: any) {
            Alert.alert(t('settings.export_failed'), e.message || String(e));
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
            Alert.alert(t('settings.import_failed'), e.message || String(e));
        }
    };

    const onConfirmImport = async () => {
        if (!importFileContent) return Alert.alert(t('settings.no_file_selected'));
        if (!importPassword) return Alert.alert(t('settings.backup_password_prompt'));
        try {
            const res = await BackupService.restoreFromEncrypted(importFileContent, importPassword);
            setImportModalVisible(false);
            setImportFileContent(null);
            Alert.alert(t('settings.import_complete'), t('settings.import_complete_msg').replace('{created}', String(res.created)).replace('{errors}', String(res.errors)));
        } catch (e: any) {
            Alert.alert(t('settings.import_failed'), e.message || String(e));
        }
    };

    return (
        <View style={{ padding: 16 }}>
            <Text style={{ marginBottom: 8, fontWeight: '600' }}>{t('settings.locale')}</Text>
            <View style={{ borderWidth: 1, borderColor: '#ddd', marginBottom: 12 }}>
                <Picker selectedValue={locale} onValueChange={async (v: string) => {
                    setLocale(v);
                    setLocaleCtx(v);
                }}>
                    {availableLocales.map((l: string) => <Picker.Item key={l} label={l} value={l} />)}
                </Picker>
            </View>
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
                        <Text style={styles.modalTitle}>{t('settings.enter_backup_password')}</Text>
                        <TextInput value={exportPassword} onChangeText={setExportPassword} secureTextEntry placeholder={t('settings.password')} style={styles.input} />
                        <TextInput value={exportPasswordConfirm} onChangeText={setExportPasswordConfirm} secureTextEntry placeholder={t('settings.confirm_password')} style={styles.input} />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <TouchableOpacity onPress={() => setExportModalVisible(false)} style={styles.modalButton}><Text>{t('settings.cancel')}</Text></TouchableOpacity>
                            <TouchableOpacity onPress={onConfirmExport} style={styles.modalButton}><Text>{t('settings.export')}</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Import modal */}
            <Modal visible={importModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{t('settings.enter_backup_password_restore')}</Text>
                        <TextInput value={importPassword} onChangeText={setImportPassword} secureTextEntry placeholder={t('settings.password')} style={styles.input} />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <TouchableOpacity onPress={() => setImportModalVisible(false)} style={styles.modalButton}><Text>{t('settings.cancel')}</Text></TouchableOpacity>
                            <TouchableOpacity onPress={onConfirmImport} style={styles.modalButton}><Text>{t('settings.restore')}</Text></TouchableOpacity>
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
