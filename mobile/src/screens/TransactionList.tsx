import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Button, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { TransactionService } from '../services/transactionService';
import type { Transaction } from '../services/transactionService';

type Props = NativeStackScreenProps<RootStackParamList, 'List'>;

const TransactionList: React.FC<Props> = ({ navigation }) => {
    const [items, setItems] = useState<Transaction[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        const svc = TransactionService.getInstance();
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

    return (
        <View style={styles.container}>
            <Button title="Add" onPress={() => navigation.navigate('Form')} />
            {items.length === 0 ? (
                <View style={styles.empty}>
                    <Text style={styles.emptyText}>No transactions yet.</Text>
                    <Button title="Add sample data" onPress={async () => { const svc = TransactionService.getInstance(); await svc.create({ title: 'Coffee', amount: 350, date: new Date().toISOString().slice(0, 10) }); await svc.create({ title: 'Groceries', amount: 4599, date: new Date().toISOString().slice(0, 10) }); await load(); }} />
                </View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(item) => item.id}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => navigation.navigate('Form', { id: item.id })}>
                            <View style={styles.item}>
                                <View>
                                    <Text style={styles.title}>{item.title}</Text>
                                    <Text style={styles.date}>{item.date}</Text>
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
    amount: { fontSize: 16, fontWeight: '600' }
});
