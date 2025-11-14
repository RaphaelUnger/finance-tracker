import React, { useState } from 'react';
import { View, Text, TextInput, Button, Image, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { TransactionService } from '../services/transactionService';
import { increment } from '../services/analytics';

type Props = NativeStackScreenProps<RootStackParamList, 'ScanReview'> & any;

const ScanReview: React.FC<Props> = ({ navigation, route }) => {
    const suggestion = route.params?.suggestion || {};
    const imageUri = route.params?.imageUri;
    const [title, setTitle] = useState(suggestion.title || '');
    const [amount, setAmount] = useState(suggestion.amount ? (suggestion.amount / 100).toFixed(2) : '0.00');
    const [date, setDate] = useState(suggestion.date || new Date().toISOString().slice(0, 10));

    async function save() {
        try {
            const parsed = Number(parseFloat(amount));
            if (!Number.isFinite(parsed)) return Alert.alert('Validation', 'Amount must be numeric');
            const cents = Math.round(parsed * 100);
            const svc = await TransactionService.getInstanceAsync();
            await svc.create({ title: title || 'Scanned', amount: cents, date });
            await increment('ocr_saved');
            navigation.navigate('List');
        } catch (e: any) {
            Alert.alert('Error', e && e.message ? e.message : String(e));
        }
    }

    return (
        <View style={{ flex: 1, padding: 16 }}>
            {imageUri ? <Image source={{ uri: imageUri }} style={{ width: 200, height: 200 }} /> : null}
            <Text>Merchant</Text>
            <TextInput value={title} onChangeText={setTitle} style={{ borderWidth: 1, borderColor: '#ddd', padding: 8, marginBottom: 8 }} />
            <Text>Amount</Text>
            <TextInput value={amount} onChangeText={setAmount} keyboardType="numeric" style={{ borderWidth: 1, borderColor: '#ddd', padding: 8, marginBottom: 8 }} />
            <Text>Date</Text>
            <TextInput value={date} onChangeText={setDate} style={{ borderWidth: 1, borderColor: '#ddd', padding: 8, marginBottom: 8 }} />
            <Button title="Save Transaction" onPress={save} />
        </View>
    );
};

export default ScanReview;
