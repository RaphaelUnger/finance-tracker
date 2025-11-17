import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, Platform, Switch, ScrollView } from 'react-native';
import ThemedButton from '../components/ThemedButton';
import { useTheme } from '../theme';
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
    const [category, setCategory] = useState('');
    const [showPicker, setShowPicker] = useState(false);
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);
    const [recurring, setRecurring] = useState(false);
    const [frequency, setFrequency] = useState('monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly');
    const [interval, setInterval] = useState('1');
    const [showRecurrenceEditor, setShowRecurrenceEditor] = useState(false);
    const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);

    useEffect(() => {
        // load transaction when either the id or the service becomes available
        if (id && svc) {
            (async () => {
                try {
                    const tx = await svc.get(id);
                    if (tx) {
                        setTitle(tx.title || '');
                        setAmount(tx.amount !== undefined ? (tx.amount / 100).toFixed(2) : '0.00');
                        setDate(tx.date || '');
                        setCategory(tx.category || '');
                        if (tx.recurrence) {
                            setRecurring(true);
                            setFrequency(tx.recurrence.frequency || 'monthly');
                            setInterval(String(tx.recurrence.interval || 1));
                        } else {
                            setRecurring(false);
                        }
                    }
                } catch (e) {
                    // ignore load errors
                }
            })();
        }
    }, [id, svc]);

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
                await svc.update(id, { title, amount: amt, date, recurrence: recObj, category });
            } else {
                await svc.create({ title, amount: amt, date, recurrence: recObj, category });
            }
            // pop the form instead of navigating to List to avoid stacking routes
            // navigation.goBack may not be present on the narrow NavProps typing, so call if available
            // otherwise fall back to navigate
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            if (typeof navigation.goBack === 'function') navigation.goBack(); else navigation.navigate('List');
        } catch (err: any) {
            Alert.alert(t('error'), err.message || t('failed_to_save'));
        }
    };

    const remove = async () => {
        if (!id) return;
        Alert.alert(t('confirm_delete'), t('confirm_delete_msg'), [
            { text: 'Cancel', style: 'cancel' },
            {
                text: t('delete'), style: 'destructive', onPress: async () => {
                    if (!svc) return Alert.alert(t('error'), t('service_not_ready')); await svc.delete(id); /* prefer goBack to avoid pushing list */ // @ts-ignore
                    if (typeof navigation.goBack === 'function') navigation.goBack(); else navigation.navigate('List');
                }
            }
        ]);
    };

    const theme = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder }]}>
                    <Text style={[styles.label, { color: theme.colors.muted }]}>{t('title') || 'Title'}</Text>
                    <TextInput accessibilityLabel="title-input" style={[styles.input, { backgroundColor: theme.colors.surface }]} value={title} onChangeText={setTitle} />
                    <Text style={[styles.label, { color: theme.colors.muted }]}>{t('category') || 'Category'}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, justifyContent: 'space-between' }}>
                        <Text style={{ color: theme.colors.text }}>{category ? t(`cat.${category}`) : (t('cat.uncategorized') || 'Uncategorized')}</Text>
                        <ThemedButton title={t('choose') || 'Choose'} onPress={() => setShowCategoryPicker(true)} style={{ paddingVertical: 6 }} />
                    </View>

                    {showCategoryPicker && (
                        <View style={[styles.pickerCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder }]}>
                            <View style={[styles.pickerHeader, { backgroundColor: theme.colors.primary, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                                <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{t('choose_category') || 'Choose category'}</Text>
                                <ThemedButton title={t('done') || 'Done'} onPress={() => setShowCategoryPicker(false)} style={{ backgroundColor: 'transparent', paddingVertical: 6, paddingHorizontal: 8 }} textStyle={{ color: theme.colors.text, fontWeight: '600' }} />
                            </View>
                            <View style={[styles.pickerInner, { backgroundColor: theme.colors.surface }]}>
                                <Picker selectedValue={category} onValueChange={(v: any) => setCategory(v)} style={{ color: theme.colors.text }} itemStyle={{ color: theme.colors.text }}>
                                    <Picker.Item label={t('cat.uncategorized') || 'Uncategorized'} value={''} color={theme.colors.text} />
                                    <Picker.Item label={t('cat.food') || 'Food'} value={'food'} color={theme.colors.text} />
                                    <Picker.Item label={t('cat.groceries') || 'Groceries'} value={'groceries'} color={theme.colors.text} />
                                    <Picker.Item label={t('cat.utilities') || 'Utilities'} value={'utilities'} color={theme.colors.text} />
                                    <Picker.Item label={t('cat.transport') || 'Transport'} value={'transport'} color={theme.colors.text} />
                                    <Picker.Item label={t('cat.income') || 'Income'} value={'income'} color={theme.colors.text} />
                                    <Picker.Item label={t('cat.other') || 'Other'} value={'other'} color={theme.colors.text} />
                                </Picker>
                            </View>
                        </View>
                    )}

                    <Text style={[styles.label, { color: theme.colors.muted }]}>{t('amount') || 'Amount (EUR)'}</Text>
                    <TextInput accessibilityLabel="amount-input" style={[styles.input, { backgroundColor: theme.colors.surface }]} value={amount} onChangeText={setAmount} keyboardType="numeric" />

                    <Text style={[styles.label, { color: theme.colors.muted }]}>{t('date') || 'Date'}</Text>
                    <View style={styles.dateRow}>
                        <Text style={[styles.dateText, { color: theme.colors.text }]}>{date ? format(new Date(date), 'yyyy-MM-dd') : (t('choose_date') || 'Choose date')}</Text>
                        <ThemedButton textStyle={{ color: theme.colors.text }} style={[styles.dateButton, { backgroundColor: theme.colors.accent }]} title={t('choose') || 'Choose'} onPress={() => setShowPicker(true)} />
                    </View>

                    {showPicker && (
                        <View style={[styles.pickerCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder }]}>
                            <View style={[styles.pickerHeader, { backgroundColor: theme.colors.primary, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                                <Text style={{ color: theme.colors.onPrimary, fontWeight: '600' }}>{t('choose_date') || 'Choose date'}</Text>
                                <ThemedButton title={t('done') || 'Done'} onPress={() => setShowPicker(false)} style={{ backgroundColor: 'transparent', paddingVertical: 6, paddingHorizontal: 8 }} textStyle={{ color: theme.colors.onPrimary, fontWeight: '600' }} />
                            </View>
                            <View style={[styles.pickerInner, { backgroundColor: theme.colors.surface }]}>
                                <DateTimePicker
                                    value={date ? new Date(date) : new Date()}
                                    mode="date"
                                    display={Platform.OS === 'android' ? 'calendar' : 'spinner'}
                                    onChange={(e: any, d: any) => {
                                        setShowPicker(Platform.OS === 'ios');
                                        if (d) setDate(format(d, 'yyyy-MM-dd'));
                                    }}
                                    {...(Platform.OS === 'ios' ? { textColor: theme.colors.text } : {})}
                                />
                            </View>
                        </View>
                    )}

                    <View style={{ marginVertical: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                            <Text style={{ marginRight: 8, color: theme.colors.text }}>{t('recurring_label') || 'Recurring'}</Text>
                            <Switch value={recurring} onValueChange={(v: boolean) => { setRecurring(v); if (v) setShowRecurrenceEditor(true); }} />
                            <View style={{ width: 8 }} />
                            <ThemedButton title={t('configure') || 'Configure'} onPress={() => setShowRecurrenceEditor(true)} style={{ paddingVertical: 6 }} />
                        </View>
                    </View>

                    {showRecurrenceEditor && (
                        <View style={[styles.pickerCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder }]}>
                            <View style={[styles.pickerHeader, { backgroundColor: theme.colors.primary, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                                <Text style={{ color: theme.colors.onPrimary, fontWeight: '600' }}>{t('recurrence.configure') || 'Configure recurrence'}</Text>
                                <ThemedButton title={t('done') || 'Done'} onPress={() => { setShowRecurrenceEditor(false); setRecurring(true); }} style={{ backgroundColor: 'transparent', paddingVertical: 6, paddingHorizontal: 8 }} textStyle={{ color: theme.colors.onPrimary, fontWeight: '600' }} />
                            </View>
                            <View style={[styles.pickerInner, { backgroundColor: theme.colors.surface }]}>
                                <Text style={{ color: theme.colors.muted, marginBottom: 6 }}>{t('frequency') || 'Frequency'}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <Text style={{ color: theme.colors.text }}>{t(`freq.${frequency}`) || frequency}</Text>
                                    <ThemedButton title={t('choose') || 'Choose'} onPress={() => setShowFrequencyPicker(true)} style={{ paddingVertical: 6 }} />
                                </View>
                                <Text style={{ color: theme.colors.muted }}>{t('interval') || 'Interval'}</Text>
                                <TextInput accessibilityLabel="interval-input" style={[styles.input, { backgroundColor: theme.colors.surface }]} value={interval} onChangeText={setInterval} keyboardType="numeric" />
                            </View>
                        </View>
                    )}

                    <View style={styles.buttons}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <ThemedButton accessibilityLabel="save-button" title={t('save') || 'Save'} onPress={save} />
                        </View>
                        {id ? <View style={{ width: 120 }}><ThemedButton accessibilityLabel="delete-button" title={t('delete') || 'Delete'} onPress={remove} style={{ backgroundColor: '#c00' }} /></View> : null}
                    </View>
                </View>
                {showFrequencyPicker && (
                    <View style={[styles.pickerCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder }]}>
                        <View style={[styles.pickerHeader, { backgroundColor: theme.colors.primary, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                            <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{t('choose_frequency') || 'Choose frequency'}</Text>
                            <ThemedButton title={t('done') || 'Done'} onPress={() => setShowFrequencyPicker(false)} style={{ backgroundColor: 'transparent', paddingVertical: 6, paddingHorizontal: 8 }} textStyle={{ color: theme.colors.text, fontWeight: '600' }} />
                        </View>
                        <View style={[styles.pickerInner, { backgroundColor: theme.colors.surface }]}>
                            <Picker selectedValue={frequency} onValueChange={(v: any) => setFrequency(v as any)} style={{ color: theme.colors.text }} itemStyle={{ color: theme.colors.text }}>
                                <Picker.Item label={t('freq.daily') || 'Daily'} value="daily" color={theme.colors.text} />
                                <Picker.Item label={t('freq.weekly') || 'Weekly'} value="weekly" color={theme.colors.text} />
                                <Picker.Item label={t('freq.monthly') || 'Monthly'} value="monthly" color={theme.colors.text} />
                                <Picker.Item label={t('freq.yearly') || 'Yearly'} value="yearly" color={theme.colors.text} />
                            </Picker>
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

export default TransactionForm;

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    input: { borderWidth: 1, borderColor: '#ddd', padding: 8, marginBottom: 12 },
    buttons: { flexDirection: 'row', justifyContent: 'space-between' }
    ,
    pickerCard: { borderWidth: 1, borderRadius: 10, overflow: 'hidden', marginVertical: 8 },
    pickerHeader: { padding: 10, alignItems: 'center', justifyContent: 'center' },
    pickerInner: { padding: 6 }
});
