import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, ScrollView, TouchableOpacity as RNTouchableOpacity, Alert } from 'react-native';
import type { NavProps } from '../types/navigation';
import { TransactionService } from '../services/transactionService';
import { runGenerator } from '../services/recurrenceService';
import type { Transaction } from '../services/transactionService';
import { useI18n } from '../i18n/react';
import { useTheme } from '../theme';
import ThemedButton from '../components/ThemedButton';

type Props = NavProps;

export default function TransactionList({ navigation }: Props) {
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
    const theme = useTheme();
    const listRef = React.useRef(null as any);

    const addSampleData = useCallback(async () => {
        const svc = await TransactionService.getInstanceAsync();
        const today = new Date();
        const iso = (d: Date) => d.toISOString().slice(0, 10);
        await svc.create({ title: 'Coffee', amount: 350, date: iso(today), category: 'food' });
        const y = new Date(); y.setDate(y.getDate() - 1);
        await svc.create({ title: 'Groceries', amount: 4599, date: iso(y), category: 'groceries' });
        const last = new Date(); last.setMonth(last.getMonth() - 1);
        await svc.create({ title: 'Internet Bill', amount: 2999, date: iso(last), category: 'utilities', notes: 'Monthly bill' });
        await load();
    }, [load]);

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.topArea}>
                <ScrollView horizontal contentContainerStyle={[styles.toolbarScroll, { paddingRight: 24 }]} showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                    <ThemedButton title={t('list.scan')} onPress={() => navigation.navigate('Scan')} style={styles.toolbarButton} />
                    <ThemedButton title={t('list.recurrences')} onPress={() => navigation.navigate('Recurrences')} style={styles.toolbarButton} />
                    <ThemedButton title={t('list.generateRecurring')} onPress={async () => {
                        try {
                            const svc = await TransactionService.getInstanceAsync();
                            const all = await svc.list();
                            const rules = all.filter(x => x.recurrence);
                            if (!rules || rules.length === 0) {
                                return Alert.alert(t('recurrences.noRules') || 'No recurring rules.');
                            }
                            // run generator
                            const count = await runGenerator(60);
                            await load();
                            if (typeof count === 'number') {
                                const msg = t('recurrences.generated', { count }) || `Generated ${count} recurring transactions`;
                                Alert.alert(msg);
                                if (count > 0 && listRef.current && typeof listRef.current.scrollToOffset === 'function') {
                                    listRef.current.scrollToOffset({ offset: 0, animated: true });
                                }
                            }
                        } catch (e: any) {
                            Alert.alert(t('error') || 'Error', e?.message || String(e));
                        }
                    }} style={styles.toolbarButton} />
                </ScrollView>

                {items.length === 0 && (
                    <View style={styles.emptyTop}>
                        <Text style={styles.emptyText}>{t('no_transactions_yet')}</Text>
                        <ThemedButton accessibilityLabel="add-sample-data" title={t('add_sample_data')} onPress={addSampleData} style={{ marginTop: 8 }} />
                    </View>
                )}
            </View>

            {items.length > 0 && (
                <FlatList
                    style={{ flex: 1 }}
                    ref={listRef}
                    data={items}
                    keyExtractor={(item: Transaction) => item.id}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    renderItem={({ item }: { item: Transaction }) => (
                        <RNTouchableOpacity onPress={() => navigation.navigate('Form', { id: item.id })}>
                            <View style={[styles.item, { backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder, shadowColor: '#000' }]}>
                                <View style={styles.cardLeft}>
                                    <View style={[styles.thumb, { backgroundColor: '#eef2ff' }]} />
                                    <View>
                                        <Text style={[styles.title, { color: theme.colors.text }]}>{item.title}</Text>
                                        <Text style={[styles.date, { color: theme.colors.muted }]}>{item.date}</Text>
                                        {item.recurrence ? (
                                            <Text style={[styles.recurrence, { color: theme.colors.muted }]}>{item.recurrence.interval && item.recurrence.interval > 1 ? `Every ${item.recurrence.interval} ${item.recurrence.frequency}` : `${item.recurrence.frequency}`}</Text>
                                        ) : null}
                                    </View>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={[styles.amount, { color: theme.colors.primary }]}>{(item.amount / 100).toFixed(2)}</Text>
                                    <View style={[styles.chip, { backgroundColor: '#f6faf8' }]}>
                                        <Text style={{ color: theme.colors.primary, fontSize: 12 }}>{item.category || 'Uncategorized'}</Text>
                                    </View>
                                </View>
                            </View>
                        </RNTouchableOpacity>
                    )}
                />
            )}

            {/* FAB */}
            <RNTouchableOpacity style={[styles.fab, { backgroundColor: theme.colors.accent }]} onPress={() => navigation.navigate('Form')}>
                <Text style={{ color: theme.colors.onPrimary || '#fff', fontWeight: '700' }}>+ Add</Text>
            </RNTouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 18, justifyContent: 'flex-start', alignItems: 'stretch' },
    toolbarScroll: { paddingHorizontal: 12, alignItems: 'flex-start' },
    toolbarButton: { marginRight: 8 },
    topArea: { marginBottom: 12 },
    emptyTop: { alignItems: 'flex-start', paddingHorizontal: 6 },
    item: { padding: 14, borderWidth: 1, borderRadius: 14, borderColor: '#e6e9ee', marginBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
    cardLeft: { flexDirection: 'row', alignItems: 'center' },
    thumb: { width: 56, height: 48, borderRadius: 10, marginRight: 14 },
    title: { fontSize: 17, fontWeight: '700' },
    amount: { fontSize: 17, fontWeight: '800' },
    recurrence: { fontSize: 12 },
    empty: { alignItems: 'center', padding: 24 },
    emptyText: { marginBottom: 12 },
    date: { fontSize: 12 },
    chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, marginTop: 8 },
    fab: { position: 'absolute', right: 18, bottom: 28, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 30, elevation: 6 }
});
