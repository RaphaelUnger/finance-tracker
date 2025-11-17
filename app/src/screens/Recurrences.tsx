import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert } from 'react-native';
import ThemedButton from '../components/ThemedButton';
import { useTheme } from '../theme';
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

    const theme = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
            <ThemedButton title={t('recurrences.addRule') || 'Add rule'} onPress={() => navigation.navigate('Form')} />
            {rules.length === 0 ? (
                <View style={styles.empty}><Text style={styles.emptyText}>{t('recurrences.noRules') || 'No recurring rules.'}</Text></View>
            ) : (
                <FlatList
                    data={rules}
                    keyExtractor={(r: Transaction) => r.id}
                    renderItem={({ item }: { item: Transaction }) => (
                        <View style={[styles.row, { backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder }]}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.title, { color: theme.colors.text }]}>{item.title}</Text>
                                <Text style={[styles.meta, { color: theme.colors.muted }]}>{item.recurrence?.interval && item.recurrence.interval > 1 ? `Every ${item.recurrence?.interval} ${item.recurrence?.frequency}` : item.recurrence?.frequency}</Text>
                                <Text style={[styles.meta, { color: theme.colors.muted }]}>Next: {item.recurrence?.nextRun || item.date}</Text>
                            </View>
                            <View style={styles.actions}>
                                <ThemedButton title={t('edit') || 'Edit'} onPress={() => navigation.navigate('Form', { id: item.id })} style={styles.actionButton} />
                                <ThemedButton title={t('disable') || 'Disable'} onPress={async () => {
                                    const svc = await TransactionService.getInstanceAsync();
                                    await svc.update(item.id, { recurrence: null });
                                    await load();
                                }} style={styles.actionButton} />
                                <ThemedButton title={t('recurrences.rollback') || 'Rollback'} onPress={() => {
                                    Alert.alert(t('recurrences.rollback_generated') || 'Rollback generated', t('recurrences.rollback_generated_msg') || 'Remove all generated instances for this rule?', [
                                        { text: t('settings.cancel') || 'Cancel', style: 'cancel' },
                                        { text: t('yes') || 'Yes', style: 'destructive', onPress: async () => { await rollbackGeneratedFor(item.id); await load(); } }
                                    ]);
                                }} style={[styles.actionButton, { backgroundColor: '#c00' }]} />
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
    screenHeader: { padding: 12, borderTopLeftRadius: 8, borderTopRightRadius: 8 },
    screenHeaderTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
    row: { padding: 16, borderBottomWidth: 1, borderColor: '#eee', flexDirection: 'row', alignItems: 'center', marginBottom: 8, borderRadius: 8 },
    title: { fontSize: 16 },
    meta: { fontSize: 12, color: '#666' },
    actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
    actionButton: { marginLeft: 8 },
    empty: { marginTop: 32, alignItems: 'center' },
    emptyText: { color: '#666' }
});
