import React, { useState } from 'react';
import { View, Text, TextInput, Button, Image, Alert } from 'react-native';
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

    return (
        <View style={{ flex: 1, padding: 16 }}>
            {imageUri ? <Image source={{ uri: imageUri }} style={{ width: 200, height: 200 }} /> : null}
            <Text accessibilityRole="header">{t('merchant') || 'Merchant'}</Text>
            <TextInput accessibilityLabel="merchant-input" value={title} onChangeText={setTitle} style={{ borderWidth: 1, borderColor: '#ddd', padding: 8, marginBottom: 8 }} />
            <Text>{t('amount') || 'Amount'}</Text>
            <TextInput accessibilityLabel="amount-input" value={amount} onChangeText={setAmount} keyboardType="numeric" style={{ borderWidth: 1, borderColor: '#ddd', padding: 8, marginBottom: 8 }} />
            <Text>{t('date') || 'Date'}</Text>
            <TextInput accessibilityLabel="date-input" value={date} onChangeText={setDate} style={{ borderWidth: 1, borderColor: '#ddd', padding: 8, marginBottom: 8 }} />
            <Button accessibilityLabel="save-transaction" title={t('save_transaction') || 'Save Transaction'} onPress={save} />
        </View>
    );
};

export default ScanReview;
