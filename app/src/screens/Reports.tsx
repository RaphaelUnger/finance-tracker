import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, TextInput, Alert, ScrollView } from 'react-native';
import type { NavProps } from '../types/navigation';
import { exportMonthToCsv, importCsvToTransactions, parseCsv, importCsvWithMapping, validateRow } from '../services/exportService';
import { Picker } from '@react-native-picker/picker';
import { BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { TransactionService } from '../services/transactionService';

type Props = NavProps;

function Reports({ navigation }: Props) {
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [summary, setSummary] = useState({} as { [k: string]: number });
    const [csvIn, setCsvIn] = useState('');
    const [preview, setPreview] = useState({ header: [] as string[], rows: [] as string[][] });
    const [validation, setValidation] = useState([] as Array<{ valid: boolean; errors: string[] }>);
    const [mapping, setMapping] = useState({ title: undefined, amount: undefined, date: undefined, category: undefined, merchant: undefined, notes: undefined } as Record<string, string | undefined>);

    useEffect(() => {
        const load = async () => {
            const svc = await TransactionService.getInstanceAsync();
            const all = await svc.list();
            const map: any = {};
            for (const t of all) {
                try {
                    const d = new Date(t.date);
                    if (d.getFullYear() === year && (d.getMonth() + 1) === month) {
                        const cat = t.category || 'uncategorized';
                        map[cat] = (map[cat] || 0) + (t.amount || 0);
                    }
                } catch (e) { }
            }
            setSummary(map);
        };
        load();
    }, [year, month]);

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.h1}>Monthly report</Text>
            <View style={styles.row}>
                <Text>Year:</Text>
                <TextInput style={styles.input} value={String(year)} onChangeText={(v: string) => setYear(Number(v) || year)} keyboardType="numeric" />
                <Text>Month:</Text>
                <TextInput style={styles.input} value={String(month)} onChangeText={(v: string) => setMonth(Number(v) || month)} keyboardType="numeric" />
                <Button title="Export CSV" onPress={async () => {
                    try {
                        const csv = await exportMonthToCsv(year, month);
                        // for now, just show an alert with the CSV length and copy to clipboard could be added
                        Alert.alert('CSV Export', `Generated CSV with ${csv.split('\n').length} lines`);
                    } catch (e: any) {
                        Alert.alert('Export failed', e.message || String(e));
                    }
                }} />
            </View>
            <View style={{ marginVertical: 12 }}>
                <Text style={styles.h2}>Category totals</Text>
                {Object.keys(summary).length === 0 ? <Text>No data for this month</Text> : (
                    <View>
                        {Object.entries(summary).map(([k, v]) => (
                            <View key={k} style={styles.catRow}><Text>{k}</Text><Text>€{(Number(v) / 100).toFixed(2)}</Text></View>
                        ))}
                        {/* cast to any to satisfy TS until chart types are added */}
                        <BarChart
                            data={{
                                labels: Object.keys(summary),
                                datasets: [{ data: Object.values(summary).map(n => Number(n) / 100) }]
                            }}
                            width={(Dimensions.get('window').width - 32) as any}
                            height={220}
                            yAxisLabel="€"
                            chartConfig={{
                                backgroundGradientFrom: '#fff',
                                backgroundGradientTo: '#fff',
                                decimalPlaces: 2,
                                color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
                                labelColor: () => '#333'
                            }}
                            style={{ marginTop: 12 }}
                        />
                    </View>
                )}
            </View>

            <View style={{ marginTop: 16 }}>
                <Text style={styles.h2}>Import CSV</Text>
                <Text>Paste CSV content below and press Import. Header should include at least: title,amount,date</Text>
                <TextInput value={csvIn} onChangeText={setCsvIn} multiline style={styles.textarea} placeholder="title,amount,date,category,merchant,notes" />
                <View style={{ marginVertical: 8 }}>
                    <Button title="Preview CSV" onPress={() => {
                        if (!csvIn.trim()) return Alert.alert('No CSV', 'Please paste CSV content');
                        const p = parseCsv(csvIn);
                        setPreview({ header: p.header, rows: p.rows.map(r => p.header.map(h => r[h] || '')) });
                        // reset mapping
                        const suggest = { title: p.header[0] || undefined, amount: p.header.find(h => /amount|amt|value/i.test(h)) || undefined, date: p.header.find(h => /date/i.test(h)) || undefined, category: p.header.find(h => /cat/i.test(h)) || undefined, merchant: p.header.find(h => /merchant|vendor|payee/i.test(h)) || undefined, notes: p.header.find(h => /note|memo/i.test(h)) || undefined };
                        setMapping(suggest as any);
                        // compute validation array
                        const vals = p.rows.map((r) => validateRow(r, suggest as any));
                        setValidation(vals);
                    }} />
                    <View style={{ height: 8 }} />
                    <Button title="Pick CSV file" onPress={async () => {
                        try {
                            // dynamic import to avoid hard dependency
                            const docPicker = await import('expo-document-picker');
                            const res = await docPicker.getDocumentAsync({ type: 'text/*' });
                            if (res.type !== 'success' || !res.uri) return;
                            const fs = await import('expo-file-system');
                            const text = await fs.readAsStringAsync(res.uri, { encoding: fs.EncodingType.UTF8 });
                            setCsvIn(text);
                            const p = parseCsv(text);
                            setPreview(p);
                            setMapping({ title: p.header[0] || undefined, amount: p.header.find(h => /amount|amt|value/i.test(h)) || undefined, date: p.header.find(h => /date/i.test(h)) || undefined, category: p.header.find(h => /cat/i.test(h)) || undefined, merchant: p.header.find(h => /merchant|vendor|payee/i.test(h)) || undefined, notes: p.header.find(h => /note|memo/i.test(h)) || undefined });
                        } catch (e: any) {
                            Alert.alert('Pick failed', "Install 'expo-document-picker' and 'expo-file-system' or paste CSV manually.");
                        }
                    }} />
                </View>
                {preview.header.length > 0 ? (
                    <View style={{ marginVertical: 8 }}>
                        <Text style={{ fontWeight: '600' }}>Header</Text>
                        <Text>{preview.header.join(', ')}</Text>
                        <Text style={{ fontWeight: '600', marginTop: 8 }}>Preview rows</Text>
                        {preview.rows.slice(0, 5).map((r: string[], i: number) => (<Text key={i}>{r.join(' , ')}</Text>))}

                        <Text style={{ fontWeight: '600', marginTop: 8 }}>Validation (first 10 rows)</Text>
                        {validation.slice(0, 10).map((v: { valid: boolean; errors: string[] }, i: number) => (<Text key={i} style={{ color: v.valid ? 'green' : 'red' }}>{v.valid ? 'OK' : v.errors.join('; ')}</Text>))}

                        <Text style={{ fontWeight: '600', marginTop: 8 }}>Map columns</Text>
                        {['title', 'amount', 'date', 'category', 'merchant', 'notes'].map((field) => (
                            <View key={field} style={{ marginVertical: 4 }}>
                                <Text>{field}</Text>
                                <View style={{ borderWidth: 1, borderColor: '#ddd', padding: 6 }}>
                                    <Picker selectedValue={mapping[field as any]} onValueChange={(v: string | undefined) => setMapping({ ...mapping, [field]: v })}>
                                        <Picker.Item label="(none)" value={undefined} />
                                        {preview.header.map((h: string) => <Picker.Item key={h} label={h} value={h} />)}
                                    </Picker>
                                </View>
                            </View>
                        ))}

                        <Button title="Import mapped CSV" onPress={async () => {
                            try {
                                const res = await importCsvWithMapping(csvIn, mapping as any);
                                Alert.alert('Import complete', `Imported ${res.created} transactions. ${res.errors} errors.`);
                                setCsvIn(''); setPreview({ header: [], rows: [] }); setValidation([]);
                            } catch (e: any) {
                                Alert.alert('Import failed', e.message || String(e));
                            }
                        }} />
                    </View>
                ) : null}
            </View>
        </ScrollView>
    );
};

export default Reports;

const styles = StyleSheet.create({
    container: { flex: 1, padding: 12 },
    h1: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
    h2: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    input: { borderWidth: 1, borderColor: '#ddd', padding: 6, width: 64, marginHorizontal: 8 },
    catRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
    textarea: { borderWidth: 1, borderColor: '#ddd', minHeight: 120, padding: 8 }
});
