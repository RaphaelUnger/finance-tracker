import React, { useState } from 'react';
import { View, StyleSheet, Platform, Modal, Text, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useI18n } from '../i18n/react';
import i18n from '../i18n';
import { useTheme } from '../theme';
import ThemedButton from './ThemedButton';

const LOCALE_LABELS: Record<string, string> = { en: 'English', de: 'Deutsch' };

export default function LocaleSelector() {
    const { locale, setLocale: setLocaleCtx } = useI18n();
    const theme = useTheme();
    const available = i18n.getAvailableLocales();
    const [visible, setVisible] = useState(false);

    const onChange = async (v: string) => {
        setLocaleCtx(v);
        try { await i18n.persistLocale(v); } catch (e) { /* ignore */ }
        setVisible(false);
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => setVisible(true)} style={styles.button}>
                <Text style={[styles.buttonText, { color: theme.colors.onPrimary || theme.colors.text }]}>{LOCALE_LABELS[locale] || locale}</Text>
            </TouchableOpacity>

            <Modal visible={visible} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder }]}>
                        <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Select language</Text>
                        <Picker selectedValue={locale} onValueChange={onChange} style={{ color: theme.colors.text }} itemStyle={{ color: theme.colors.text }}>
                            {available.map((l) => <Picker.Item key={l} label={LOCALE_LABELS[l] || l} value={l} />)}
                        </Picker>
                        <View style={{ height: 8 }} />
                        <ThemedButton title="Close" onPress={() => setVisible(false)} />
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { marginRight: 8 },
    button: { paddingHorizontal: 8, paddingVertical: 6 },
    buttonText: { fontWeight: '600' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
    modalCard: { width: '80%', borderRadius: 10, padding: 12, borderWidth: 1 },
    modalTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 }
});
