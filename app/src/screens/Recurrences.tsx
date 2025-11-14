import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, FlatList, Button, StyleSheet, Alert } from 'react-native';
import type { NavProps } from '../types/navigation';
import { TransactionService } from '../services/transactionService';
import type { Transaction } from '../services/transactionService';
import { rollbackGeneratedFor } from '../services/recurrenceService';
import { useI18n } from '../i18n/react';

type Props = NavProps;

function Recurrences({ navigation }: Props) {
    const [rules, setRules] = useState([] as Transaction[]);

    const load = useCallback(async () => {
        const svc = await TransactionService.getInstanceAsync();
        const list = await svc.list();
        setRules(list.filter(r => r.recurrence));
    }, []);

    useEffect(() => {
        const unsub = navigation.addListener('focus', load);
        load();
        return unsub;
    }, [navigation, load]);

    const { t } = useI18n();

    return (
        <View style={styles.container}>
            <Button title={t('recurrences.addRule') || 'Add rule'} onPress={() => navigation.navigate('Form')} />
            {rules.length === 0 ? (
                <View style={styles.empty}><Text style={styles.emptyText}>{t('recurrences.noRules') || 'No recurring rules.'}</Text></View>
            ) : (
                <FlatList
                    data={rules}
                    keyExtractor={(r: Transaction) => r.id}
                    renderItem={({ item }: { item: Transaction }) => (
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.title}>{item.title}</Text>
                                <Text style={styles.meta}>{item.recurrence?.interval && item.recurrence.interval > 1 ? `Every ${item.recurrence?.interval} ${item.recurrence?.frequency}` : item.recurrence?.frequency}</Text>
                                <Text style={styles.meta}>Next: {item.recurrence?.nextRun || item.date}</Text>
                            </View>
                            <View style={styles.actions}>
                                <Button title={t('edit') || 'Edit'} onPress={() => navigation.navigate('Form', { id: item.id })} />
                                <Button title={t('disable') || 'Disable'} onPress={async () => {
                                    const svc = await TransactionService.getInstanceAsync();
                                    await svc.update(item.id, { recurrence: null });
                                    await load();
                                }} />
                                <Button title={t('recurrences.rollback') || 'Rollback'} color="#c00" onPress={() => {
                                    Alert.alert(t('recurrences.rollback_generated') || 'Rollback generated', t('recurrences.rollback_generated_msg') || 'Remove all generated instances for this rule?', [
                                        { text: t('settings.cancel') || 'Cancel', style: 'cancel' },
                                        { text: t('yes') || 'Yes', style: 'destructive', onPress: async () => { await rollbackGeneratedFor(item.id); await load(); } }
                                    ]);
                                }} />
                            </View>
                        </View>
                    )}
                />
            )}
        </View>
    );
};

export default Recurrences;

const styles = StyleSheet.create({
    container: { flex: 1, padding: 12 },
    row: { padding: 12, borderBottomWidth: 1, borderColor: '#eee', flexDirection: 'row' },
    title: { fontSize: 16 },
    meta: { fontSize: 12, color: '#666' },
    actions: { justifyContent: 'space-between' },
    empty: { marginTop: 32, alignItems: 'center' },
    emptyText: { color: '#666' }
});
