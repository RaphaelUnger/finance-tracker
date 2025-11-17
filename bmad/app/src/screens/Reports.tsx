import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, ScrollView } from 'react-native';
import ThemedButton from '../components/ThemedButton';
import { useTheme } from '../theme';
import type { NavProps } from '../types/navigation';
import { exportMonthToCsv, importCsvToTransactions, parseCsv, importCsvWithMapping, importCsvWithMappingWithStats, validateRow } from '../services/exportService';
import { Picker } from '@react-native-picker/picker';
import { BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { TransactionService } from '../services/transactionService';
import { useI18n } from '../i18n/react';

type Props = NavProps;

function Reports({ navigation }: Props) {
    const [year, setYear] = useState(new Date().getFullYear() as number);
    const [month, setMonth] = useState(new Date().getMonth() + 1 as number);
    const [summary, setSummary] = useState({} as { [k: string]: number });
    const [csvIn, setCsvIn] = useState('' as string);
    const [preview, setPreview] = useState({ header: [] as string[], rows: [] as string[][] } as any);
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

    const { t } = useI18n();

    const theme = useTheme();

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.screenHeader, { backgroundColor: theme.colors.primary }]}>
                <Text style={[styles.screenHeaderTitle, { color: theme.colors.onPrimary }]}>{t('reports.monthlyReport')}</Text>
            </View>
            <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder }]}>
                <View style={styles.row}>
                    <Text>{t('reports.year')}</Text>
                    <TextInput style={styles.input} value={String(year)} onChangeText={(v: string) => setYear(Number(v) || year)} keyboardType="numeric" />
                    <Text>{t('reports.month')}</Text>
                    <TextInput style={styles.input} value={String(month)} onChangeText={(v: string) => setMonth(Number(v) || month)} keyboardType="numeric" />
                    <ThemedButton accessibilityLabel={t('reports.exportCsv')} title={t('reports.exportCsv')} onPress={async () => {
                        try {
                            const csv = await exportMonthToCsv(year, month);
                            Alert.alert(t('reports.csvExportTitle'), `${t('reports.generatedLines')}: ${csv.split('\n').length}`);
                        } catch (e: any) {
                            Alert.alert(t('reports.exportFailed'), e.message || String(e));
                        }
                    }} />
                </View>
            </View>
            <View style={{ marginVertical: 12 }}>
                <Text style={styles.h2}>{t('reports.categoryTotals')}</Text>
                {Object.keys(summary).length === 0 ? <Text>{t('reports.noDataForMonth')}</Text> : (
                    <View>
                        {Object.entries(summary).map(([k, v]) => (
                            <View key={k} style={styles.catRow}><Text>{k}</Text><Text>
                                {t('currency_symbol')}{(Number(v) / 100).toFixed(2)}</Text></View>
                        ))}
                        {/* accessible textual summary for screen readers */}
                        <View accessible accessibilityLabel={t('reports.chartSummary') || 'Category totals'}>
                            <Text style={{ marginTop: 8, fontWeight: '600' }}>{t('reports.categoryTotals')}</Text>
                            {Object.entries(summary).map(([k, v]) => (
                                <Text key={`sum-${k}`}>{k}: {t('currency_symbol')}{(Number(v) / 100).toFixed(2)}</Text>
                            ))}
                        </View>
                        {/* cast to any to satisfy TS until chart types are added */}
                        {/* BarChart types are incompatible in this TS setup; cast to any */}
                        {/* Lightweight fallback chart for environments where native chart types are unavailable */}
                        <View style={{ marginTop: 12 }}>
                            {Object.entries(summary).map(([k, v]) => (
                                <View key={`bar-${k}`} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 4 }}>
                                    <View style={{ width: 8, height: 20, backgroundColor: '#007AFF', marginRight: 8 }} />
                                    <Text>{k}: {t('currency_symbol')}{(Number(v) / 100).toFixed(2)}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}
            </View>

            <View style={{ marginTop: 16 }}>
                <Text style={styles.h2}>{t('reports.importCsv')}</Text>
                <Text>{t('reports.importInstructions')}</Text>
                <TextInput accessibilityLabel={t('reports.csvInput')} value={csvIn} onChangeText={setCsvIn} multiline style={styles.textarea} placeholder={t('reports.csvPlaceholder')} />
                <View style={{ marginVertical: 8 }}>
                    <ThemedButton accessibilityLabel={t('reports.previewCsv')} title={t('reports.previewCsv')} onPress={() => {
                        if (!csvIn.trim()) return Alert.alert(t('reports.noCsv'), t('reports.pleasePasteCsv'));
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
                    <ThemedButton accessibilityLabel={t('reports.pickCsvFile')} title={t('reports.pickCsvFile')} onPress={async () => {
                        try {
                            // dynamic import to avoid hard dependency
                            const docPicker: any = await import('expo-document-picker');
                            const res = await docPicker.getDocumentAsync({ type: 'text/*' });
                            if (res.type !== 'success' || !res.uri) return;
                            const fs: any = await import('expo-file-system');
                            const text = await fs.readAsStringAsync(res.uri, { encoding: fs.EncodingType.UTF8 });
                            setCsvIn(text);
                            const p = parseCsv(text);
                            setPreview({ header: p.header, rows: p.rows.map((r: Record<string, string>) => p.header.map(h => r[h] || '')) });
                            setMapping({ title: p.header[0] || undefined, amount: p.header.find(h => /amount|amt|value/i.test(h)) || undefined, date: p.header.find(h => /date/i.test(h)) || undefined, category: p.header.find(h => /cat/i.test(h)) || undefined, merchant: p.header.find(h => /merchant|vendor|payee/i.test(h)) || undefined, notes: p.header.find(h => /note|memo/i.test(h)) || undefined });
                        } catch (e: any) {
                            Alert.alert(t('reports.pickFailed'), t('reports.pickFailedHelp'));
                        }
                    }} />
                </View>
                {preview.header.length > 0 ? (
                    <View style={{ marginVertical: 8 }}>
                        <Text style={{ fontWeight: '600' }}>{t('reports.header')}</Text>
                        <Text>{preview.header.join(', ')}</Text>
                        <Text style={{ fontWeight: '600', marginTop: 8 }}>{t('reports.previewRows')}</Text>
                        {preview.rows.slice(0, 5).map((r: string[], i: number) => (<Text key={i}>{r.join(' , ')}</Text>))}

                        <Text style={{ fontWeight: '600', marginTop: 8 }}>{t('reports.validationFirstRows')}</Text>
                        {validation.slice(0, 10).map((v: { valid: boolean; errors: string[] }, i: number) => (<Text key={i} style={{ color: v.valid ? 'green' : 'red' }}>{v.valid ? 'OK' : v.errors.join('; ')}</Text>))}

                        <Text style={{ fontWeight: '600', marginTop: 8 }}>{t('reports.mapColumns')}</Text>
                        {['title', 'amount', 'date', 'category', 'merchant', 'notes'].map((field) => (
                            <View key={field} style={{ marginVertical: 4 }}>
                                <Text>{t(`fields.${field}`) || field}</Text>
                                <View style={{ borderWidth: 1, borderColor: '#ddd', padding: 6 }}>
                                    <Picker selectedValue={mapping[field as any]} onValueChange={(v: string | undefined) => setMapping({ ...mapping, [field]: v })}>
                                        <Picker.Item label="(none)" value={undefined} />
                                        {preview.header.map((h: string) => <Picker.Item key={h} label={h} value={h} />)}
                                    </Picker>
                                </View>
                            </View>
                        ))}

                        <ThemedButton accessibilityLabel={t('reports.importMappedCsv')} title={t('reports.importMappedCsv')} onPress={async () => {
                            try {
                                const res = await importCsvWithMappingWithStats(csvIn, mapping as any);
                                Alert.alert(t('reports.importComplete'), `${t('reports.importedTransactions')}: ${res.created}. ${t('reports.importErrors')}: ${res.errors}.`);
                                setCsvIn(''); setPreview({ header: [], rows: [] }); setValidation([]);
                            } catch (e: any) {
                                Alert.alert(t('reports.importFailed'), e.message || String(e));
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
    screenHeader: { padding: 12, borderTopLeftRadius: 8, borderTopRightRadius: 8 },
    screenHeaderTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
    h1: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
    h2: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    input: { borderWidth: 1, borderColor: '#ddd', padding: 6, width: 64, marginHorizontal: 8 },
    catRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
    textarea: { borderWidth: 1, borderColor: '#ddd', minHeight: 120, padding: 8 }
});
