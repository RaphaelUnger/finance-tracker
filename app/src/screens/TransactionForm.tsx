import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Platform, Switch } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useI18n } from '../i18n/react';
import { nextOccurrence } from '../services/recurrenceService';
import type { NavProps } from '../types/navigation';
import { TransactionService } from '../services/transactionService';
import { Picker } from '@react-native-picker/picker';

type Props = NavProps;

function TransactionForm({ navigation, route }: Props) {
    const [svc, setSvc] = useState(null as any);
    useEffect(() => {
        TransactionService.getInstanceAsync().then((s) => setSvc(s));
    }, []);
    const id = route.params?.id;
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('0.00');
    const [date, setDate] = useState('');
    const [showPicker, setShowPicker] = useState(false);
    const [recurring, setRecurring] = useState(false);
    const [frequency, setFrequency] = useState('monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly');
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

    const { t } = useI18n();

    const save = async () => {
        // validation
        if (!title.trim()) return Alert.alert(t('validation'), t('title_required'));
        const parsed = Number(parseFloat(amount));
        if (!Number.isFinite(parsed)) return Alert.alert(t('validation'), t('amount_must_number'));
        const amt = Math.round(parsed * 100);
        if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date)) return Alert.alert(t('validation'), t('date_must_format'));
        try {
            if (!svc) return Alert.alert(t('error'), t('service_not_ready'));
            const recObj = recurring ? { frequency, interval: Number(interval), nextRun: nextOccurrence(date, { frequency, interval: Number(interval) } as any) } : null;
            if (id) {
                await svc.update(id, { title, amount: amt, date, recurrence: recObj });
            } else {
                await svc.create({ title, amount: amt, date, recurrence: recObj });
            }
            navigation.navigate('List');
        } catch (err: any) {
            Alert.alert(t('error'), err.message || t('failed_to_save'));
        }
    };

    const remove = async () => {
        if (!id) return;
        Alert.alert(t('confirm_delete'), t('confirm_delete_msg'), [
            { text: 'Cancel', style: 'cancel' },
            { text: t('delete'), style: 'destructive', onPress: async () => { if (!svc) return Alert.alert(t('error'), t('service_not_ready')); await svc.delete(id); navigation.navigate('List'); } }
        ]);
    };

    return (
        <View style={styles.container}>
            <Text>{t('title') || 'Title'}</Text>
            <TextInput accessibilityLabel="title-input" style={styles.input} value={title} onChangeText={setTitle} />
            <Text>{t('amount') || 'Amount (EUR)'}</Text>
            <TextInput accessibilityLabel="amount-input" style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" />
            <Text>{t('date') || 'Date'}</Text>
            <View style={{ marginBottom: 12 }}>
                <Button title={date ? format(new Date(date), 'yyyy-MM-dd') : t('choose_date') || 'Choose date'} onPress={() => setShowPicker(true)} />
            </View>
            {showPicker && (
                <DateTimePicker
                    value={date ? new Date(date) : new Date()}
                    mode="date"
                    display={Platform.OS === 'android' ? 'calendar' : 'spinner'}
                    onChange={(e: any, d: any) => {
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
                        <Text>{t('frequency') || 'Frequency'}</Text>
                        <View style={{ borderWidth: 1, borderColor: '#ddd', marginBottom: 8 }}>
                            <Picker selectedValue={frequency} onValueChange={(v: any) => setFrequency(v as any)}>
                                <Picker.Item label={t('freq.daily') || 'Daily'} value="daily" />
                                <Picker.Item label={t('freq.weekly') || 'Weekly'} value="weekly" />
                                <Picker.Item label={t('freq.monthly') || 'Monthly'} value="monthly" />
                                <Picker.Item label={t('freq.yearly') || 'Yearly'} value="yearly" />
                            </Picker>
                        </View>
                        <Text>{t('interval') || 'Interval'}</Text>
                        <TextInput accessibilityLabel="interval-input" style={styles.input} value={interval} onChangeText={setInterval} keyboardType="numeric" />
                    </View>
                ) : null}
            </View>
            <View style={styles.buttons}>
                <Button accessibilityLabel="save-button" title={t('save') || 'Save'} onPress={save} />
                {id ? <Button accessibilityLabel="delete-button" title={t('delete') || 'Delete'} color="#c00" onPress={remove} /> : null}
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
