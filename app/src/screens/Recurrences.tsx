import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, FlatList, Button, StyleSheet, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { TransactionService } from '../services/transactionService';
import type { Transaction } from '../services/transactionService';
import { rollbackGeneratedFor } from '../services/recurrenceService';

type Props = NativeStackScreenProps<RootStackParamList, 'Recurrences'>;

const Recurrences: React.FC<Props> = ({ navigation }) => {
    const [rules, setRules] = useState<Transaction[]>([]);

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

    return (
        <View style={styles.container}>
            <Button title="Add rule" onPress={() => navigation.navigate('Form')} />
            {rules.length === 0 ? (
                <View style={styles.empty}><Text style={styles.emptyText}>No recurring rules.</Text></View>
            ) : (
                <FlatList
                    data={rules}
                    keyExtractor={r => r.id}
                    renderItem={({ item }) => (
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.title}>{item.title}</Text>
                                <Text style={styles.meta}>{item.recurrence?.interval && item.recurrence.interval > 1 ? `Every ${item.recurrence?.interval} ${item.recurrence?.frequency}` : item.recurrence?.frequency}</Text>
                                <Text style={styles.meta}>Next: {item.recurrence?.nextRun || item.date}</Text>
                            </View>
                            <View style={styles.actions}>
                                <Button title="Edit" onPress={() => navigation.navigate('Form', { id: item.id })} />
                                <Button title="Disable" onPress={async () => {
                                    const svc = await TransactionService.getInstanceAsync();
                                    await svc.update(item.id, { recurrence: null });
                                    await load();
                                }} />
                                <Button title="Rollback" color="#c00" onPress={() => {
                                    Alert.alert('Rollback generated', 'Remove all generated instances for this rule?', [
                                        { text: 'Cancel', style: 'cancel' },
                                        { text: 'Yes', style: 'destructive', onPress: async () => { await rollbackGeneratedFor(item.id); await load(); } }
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
