import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Button, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import type { NavProps } from '../types/navigation';
import { TransactionService } from '../services/transactionService';
import { runGenerator } from '../services/recurrenceService';
import type { Transaction } from '../services/transactionService';
import { useI18n } from '../i18n/react';

type Props = NavProps;

function TransactionList({ navigation }: Props) {
    const [items, setItems] = useState([] as Transaction[]);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        const svc = await TransactionService.getInstanceAsync();
        const list = await svc.list();
        setItems(list);
    }, []);

    useEffect(() => {
        const unsub = navigation.addListener('focus', load);
        load();
        return unsub;
    }, [navigation, load]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    }, [load]);

    const { t } = useI18n();

    return (
        <View style={styles.container}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Button title={t('list.add')} onPress={() => navigation.navigate('Form')} />
                <Button title={t('list.scan')} onPress={() => navigation.navigate('Scan')} />
                <Button title={t('list.recurrences')} onPress={() => navigation.navigate('Recurrences')} />
                <Button title={t('list.generateRecurring')} onPress={async () => { await runGenerator(60); await load(); }} />
            </View>
            {items.length === 0 ? (
                <View style={styles.empty}>
                    <Text style={styles.emptyText}>{t('no_transactions_yet')}</Text>
                    <Button accessibilityLabel="add-sample-data" title={t('add_sample_data')} onPress={async () => { const svc = TransactionService.getInstance(); await svc.create({ title: 'Coffee', amount: 350, date: new Date().toISOString().slice(0, 10) }); await svc.create({ title: 'Groceries', amount: 4599, date: new Date().toISOString().slice(0, 10) }); await load(); }} />
                </View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(item: Transaction) => item.id}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    renderItem={({ item }: { item: Transaction }) => (
                        <TouchableOpacity onPress={() => navigation.navigate('Form', { id: item.id })}>
                            <View style={styles.item}>
                                <View>
                                    <Text style={styles.title}>{item.title}</Text>
                                    <Text style={styles.date}>{item.date}</Text>
                                    {item.recurrence ? (
                                        <Text style={styles.recurrence}>{item.recurrence.interval && item.recurrence.interval > 1 ? `Every ${item.recurrence.interval} ${item.recurrence.frequency}` : `${item.recurrence.frequency}`}</Text>
                                    ) : null}
                                </View>
                                <Text style={styles.amount}>€{(item.amount / 100).toFixed(2)}</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );
};

export default TransactionList;

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    item: { padding: 12, borderBottomWidth: 1, borderColor: '#eee', flexDirection: 'row', justifyContent: 'space-between' },
    title: { fontSize: 16 },
    amount: { fontSize: 16, fontWeight: '600' },
    recurrence: { fontSize: 12, color: '#666' },
    empty: { alignItems: 'center', padding: 24 },
    emptyText: { marginBottom: 12, color: '#666' },
    date: { fontSize: 12, color: '#444' }
});
