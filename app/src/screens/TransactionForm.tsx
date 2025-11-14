import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Platform, Switch } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { format } from 'date-fns';
import { nextOccurrence } from '../services/recurrenceService';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { TransactionService } from '../services/transactionService';
import { Picker } from '@react-native-picker/picker';

type Props = NativeStackScreenProps<RootStackParamList, 'Form'>;

const TransactionForm: React.FC<Props> = ({ navigation, route }) => {
    const [svc, setSvc] = useState<any>(null);
    useEffect(() => {
        TransactionService.getInstanceAsync().then((s) => setSvc(s));
    }, []);
    const id = route.params?.id;
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('0.00');
    const [date, setDate] = useState('');
    const [showPicker, setShowPicker] = useState(false);
    const [recurring, setRecurring] = useState(false);
    const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
    const [interval, setInterval] = useState('1');

    useEffect(() => {
        if (id && svc) {
            svc.get(id).then((tx: any) => {
                if (tx) {
                    setTitle(tx.title);
                    setAmount((tx.amount / 100).toFixed(2));
                    setDate(tx.date);
                    if (tx.recurrence) {
                        setRecurring(true);
                        setFrequency(tx.recurrence.frequency || 'monthly');
                        setInterval(String(tx.recurrence.interval || 1));
                    }
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
            if (!svc) return Alert.alert('Error', 'Service not ready');
            const recObj = recurring ? { frequency, interval: Number(interval), nextRun: nextOccurrence(date, { frequency, interval: Number(interval) } as any) } : null;
            if (id) {
                await svc.update(id, { title, amount: amt, date, recurrence: recObj });
            } else {
                await svc.create({ title, amount: amt, date, recurrence: recObj });
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
            { text: 'Delete', style: 'destructive', onPress: async () => { if (!svc) return Alert.alert('Error', 'Service not ready'); await svc.delete(id); navigation.navigate('List'); } }
        ]);
    };

    return (
        <View style={styles.container}>
            <Text>Title</Text>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} />
            <Text>Amount (EUR)</Text>
            <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" />
            <Text>Date</Text>
            <View style={{ marginBottom: 12 }}>
                <Button title={date ? format(new Date(date), 'yyyy-MM-dd') : 'Choose date'} onPress={() => setShowPicker(true)} />
            </View>
            {showPicker && (
                <DateTimePicker
                    value={date ? new Date(date) : new Date()}
                    mode="date"
                    display={Platform.OS === 'android' ? 'calendar' : 'spinner'}
                    onChange={(e, d) => {
                        setShowPicker(Platform.OS === 'ios');
                        if (d) setDate(format(d, 'yyyy-MM-dd'));
                    }}
                />
            )}
            <View style={{ marginVertical: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ marginRight: 8 }}>Recurring</Text>
                    <Switch value={recurring} onValueChange={setRecurring} />
                </View>
                {recurring ? (
                    <View style={{ marginBottom: 8 }}>
                        <Text>Frequency</Text>
                        <View style={{ borderWidth: 1, borderColor: '#ddd', marginBottom: 8 }}>
                            <Picker selectedValue={frequency} onValueChange={(v) => setFrequency(v as any)}>
                                <Picker.Item label="Daily" value="daily" />
                                <Picker.Item label="Weekly" value="weekly" />
                                <Picker.Item label="Monthly" value="monthly" />
                                <Picker.Item label="Yearly" value="yearly" />
                            </Picker>
                        </View>
                        <Text>Interval</Text>
                        <TextInput style={styles.input} value={interval} onChangeText={setInterval} keyboardType="numeric" />
                    </View>
                ) : null}
            </View>
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
