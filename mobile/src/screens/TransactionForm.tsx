import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { TransactionService } from '../services/transactionService';

type Props = NativeStackScreenProps<RootStackParamList, 'Form'>;

const TransactionForm: React.FC<Props> = ({ navigation, route }) => {
    const svc = TransactionService.getInstance();
    const id = route.params?.id;
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('0.00');
    const [date, setDate] = useState('');

    useEffect(() => {
        if (id) {
            svc.get(id).then((tx) => {
                if (tx) {
                    setTitle(tx.title);
                    setAmount((tx.amount / 100).toFixed(2));
                    setDate(tx.date);
                }
            });
        }
    }, [id]);

    const save = async () => {
        // validation
        if (!title.trim()) return Alert.alert('Validation', 'Title is required');
        const parsed = Number(parseFloat(amount));
        if (!Number.isFinite(parsed)) return Alert.alert('Validation', 'Amount must be a number');
        const amt = Math.round(parsed * 100);
        if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date)) return Alert.alert('Validation', 'Date must be YYYY-MM-DD');
        try {
            if (id) {
                await svc.update(id, { title, amount: amt, date });
            } else {
                await svc.create({ title, amount: amt, date });
            }
            navigation.navigate('List');
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to save');
        }
    };

    const remove = async () => {
        if (!id) return;
        Alert.alert('Confirm delete', 'Are you sure you want to delete this transaction?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => { await svc.delete(id); navigation.navigate('List'); } }
        ]);
    };

    return (
        <View style={styles.container}>
            <Text>Title</Text>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} />
            <Text>Amount (EUR)</Text>
            <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" />
            <Text>Date (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} value={date} onChangeText={setDate} />
            <View style={styles.buttons}>
                <Button title="Save" onPress={save} />
                {id ? <Button title="Delete" color="#c00" onPress={remove} /> : null}
            </View>
        </View>
    );
};

export default TransactionForm;

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    input: { borderWidth: 1, borderColor: '#ddd', padding: 8, marginBottom: 12 },
    buttons: { flexDirection: 'row', justifyContent: 'space-between' }
});
