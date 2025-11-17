import React, { useState } from 'react';
import { View, Text, TextInput, Image, Alert, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import ThemedButton from '../components/ThemedButton';
import { useI18n } from '../i18n/react';
import type { NavProps } from '../types/navigation';
import { TransactionService } from '../services/transactionService';
import { increment } from '../services/analytics';

type Props = NavProps;

function ScanReview({ navigation, route }: Props) {
    const suggestion = route.params?.suggestion || {};
    const imageUri = route.params?.imageUri;
    const [title, setTitle] = useState(suggestion.title || '');
    const [amount, setAmount] = useState(suggestion.amount ? (suggestion.amount / 100).toFixed(2) : '0.00');
    const [date, setDate] = useState(suggestion.date || new Date().toISOString().slice(0, 10));

    const { t } = useI18n();

    async function save() {
        try {
            const parsed = Number(parseFloat(amount));
            if (!Number.isFinite(parsed)) return Alert.alert(t('validation'), t('amount_must_numeric'));
            const cents = Math.round(parsed * 100);
            const svc = await TransactionService.getInstanceAsync();
            await svc.create({ title: title || t('scanned_default_title'), amount: cents, date });
            await increment('ocr_saved');
            navigation.navigate('List');
        } catch (e: any) {
            Alert.alert(t('error'), e && e.message ? e.message : String(e));
        }
    }

    const theme = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.screenHeader, { backgroundColor: theme.colors.primary }]}>
                <Text style={[styles.screenHeaderTitle, { color: theme.colors.onPrimary }]}>{t('scan.review') || 'Review'}</Text>
            </View>
            <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder }]}>
                {imageUri ? <Image source={{ uri: imageUri }} style={[styles.image, { borderColor: theme.colors.cardBorder }]} /> : null}
                <Text accessibilityRole="header" style={{ color: theme.colors.muted, marginTop: 8 }}>{t('merchant') || 'Merchant'}</Text>
                <TextInput accessibilityLabel="merchant-input" value={title} onChangeText={setTitle} style={[styles.input, { backgroundColor: theme.colors.surface }]} />
                <Text style={{ color: theme.colors.muted }}>{t('amount') || 'Amount'}</Text>
                <TextInput accessibilityLabel="amount-input" value={amount} onChangeText={setAmount} keyboardType="numeric" style={[styles.input, { backgroundColor: theme.colors.surface }]} />
                <Text style={{ color: theme.colors.muted }}>{t('date') || 'Date'}</Text>
                <TextInput accessibilityLabel="date-input" value={date} onChangeText={setDate} style={[styles.input, { backgroundColor: theme.colors.surface }]} />
                <View style={{ marginTop: 12 }}>
                    <ThemedButton accessibilityLabel="save-transaction" title={t('save_transaction') || 'Save Transaction'} onPress={save} />
                </View>
            </View>
        </View>
    );
};

export default ScanReview;

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    screenHeader: { padding: 12, borderTopLeftRadius: 8, borderTopRightRadius: 8 },
    screenHeaderTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
    card: { padding: 14, borderRadius: 12, borderWidth: 1, margin: 6, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
    image: { width: 220, height: 220, borderRadius: 8, borderWidth: 1 },
    input: { borderWidth: 1, borderColor: '#ddd', padding: 10, marginBottom: 8, borderRadius: 8 }
});
