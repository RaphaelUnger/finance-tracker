import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import * as LockService from '../services/lockService';
import { useI18n } from '../i18n/react';

export default function LockScreen({ onUnlock }: { onUnlock: () => void }) {
    const [pin, setPin] = useState('');
    const [mode, setMode] = useState<'enter' | 'set'>('enter');
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [biometricEnabled, setBiometricEnabled] = useState(false);

    const { t } = useI18n();

    React.useEffect(() => {
        (async () => {
            const stored = await LockService.getPin();
            setMode(stored ? 'enter' : 'set');
            const avail = await LockService.isBiometricAvailable();
            const enabled = await LockService.isBiometricEnabled();
            setBiometricAvailable(avail);
            setBiometricEnabled(enabled);
            if (avail && enabled) {
                const ok = await LockService.authenticateBiometric();
                if (ok) onUnlock();
            }
        })();
    }, []);

    const submit = async () => {
        if (mode === 'set') {
            if (pin.length < 4) { Alert.alert(t('pin_too_short') || 'PIN must be at least 4 digits'); return; }
            await LockService.setPin(pin);
            Alert.alert(t('pin_set'));
            onUnlock();
            return;
        }
        const ok = await LockService.checkPin(pin);
        if (ok) onUnlock();
        else Alert.alert(t('wrong_pin'));
    };

    const tryBiometric = async () => {
        const ok = await LockService.authenticateBiometric();
        if (ok) onUnlock();
        else Alert.alert(t('biometric_auth_failed'));
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{mode === 'set' ? t('set_app_pin') : t('enter_pin_to_unlock')}</Text>
            <TextInput
                value={pin}
                onChangeText={setPin}
                keyboardType="numeric"
                secureTextEntry
                style={styles.input}
                placeholder={t('enter_pin_to_unlock')}
            />
            <Button title={mode === 'set' ? t('set_app_pin') : t('unlock')} onPress={submit} />
            {biometricAvailable && biometricEnabled ? (
                <View style={{ marginTop: 12 }}>
                    <Button title={t('unlock_with_biometrics')} onPress={tryBiometric} />
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
    title: { fontSize: 18, marginBottom: 12 },
    input: { width: '80%', padding: 8, borderWidth: 1, borderColor: '#ccc', marginBottom: 12, borderRadius: 4 }
});
