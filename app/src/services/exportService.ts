import { TransactionService } from './transactionService';
import { format, parseISO } from 'date-fns';
import Papa from 'papaparse';

export async function exportMonthToCsv(year: number, month: number): Promise<string> {
    const svc = await TransactionService.getInstanceAsync();
    const all = await svc.list();
    // filter by year/month
    const rows = all.filter(t => {
        try {
            const d = parseISO(t.date);
            return d.getFullYear() === year && (d.getMonth() + 1) === month;
        } catch (e) { return false; }
    });
    const header = ['id', 'title', 'amount', 'date', 'category', 'merchant', 'notes', 'createdAt'];
    const lines = [header.join(',')];
    for (const r of rows) {
        const amount = (r.amount / 100).toFixed(2);
        const cols = [r.id, (r.title || '').replace(/,/g, ' '), amount, r.date, r.category || '', r.merchant || '', (r.notes || '').replace(/,/g, ' '), r.createdAt || ''];
        lines.push(cols.join(','));
    }
    return lines.join('\n');
}

// Very small import: parse CSV and create transactions. Mapping is naive (header columns expected).
export async function importCsvToTransactions(csvText: string, opts?: { skipHeader?: boolean }): Promise<number> {
    const svc = await TransactionService.getInstanceAsync();
    const lines = csvText.split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) return 0;
    const header = lines[0].split(',').map(h => h.trim());
    const body = opts?.skipHeader ? lines : lines.slice(1);
    let created = 0;
    for (const line of body) {
        const cols = line.split(',');
        const obj: any = {};
        for (let i = 0; i < header.length; i++) obj[header[i]] = (cols[i] || '').trim();
        const amountFloat = parseFloat(obj.amount || '0');
        const cents = Math.round(amountFloat * 100);
        const date = obj.date || new Date().toISOString().slice(0, 10);
        try {
            await svc.create({ title: obj.title || 'Imported', amount: cents, date, category: obj.category || undefined, merchant: obj.merchant || undefined, notes: obj.notes || undefined });
            created++;
        } catch (e) {
            // skip failures
        }
    }
    return created;
}

export default { exportMonthToCsv, importCsvToTransactions };

export function parseCsv(csvText: string): { header: string[]; rows: Record<string, string>[] } {
    const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    const header = parsed.meta.fields || [];
    const rows = (parsed.data as any[]).map(r => {
        const out: Record<string, string> = {};
        for (const k of header) out[k] = (r[k] || '').toString();
        return out;
    });
    return { header, rows };
}

export function validateRow(row: Record<string, string>, mapping: Record<string, string | undefined>): { valid: boolean; errors: string[] } {
    const errs: string[] = [];
    const title = mapping.title ? row[mapping.title] : undefined;
    const amount = mapping.amount ? row[mapping.amount] : undefined;
    const date = mapping.date ? row[mapping.date] : undefined;
    if (!title || !title.trim()) errs.push('title missing');
    if (!amount || isNaN(Number(amount))) errs.push('amount invalid');
    if (!date || isNaN(Date.parse(date))) errs.push('date invalid');
    return { valid: errs.length === 0, errors: errs };
}

// mapping: object where keys are target fields and values are header names
export async function importCsvWithMappingWithStats(csvText: string, mapping: Record<string, string | undefined>, opts?: { skipHeader?: boolean }): Promise<{ created: number; errors: number }> {
    const svc = await TransactionService.getInstanceAsync();
    const { header, rows } = parseCsv(csvText);
    let created = 0;
    let errors = 0;
    for (const row of rows) {
        const obj: any = {};
        for (const target of Object.keys(mapping)) {
            const h = mapping[target];
            if (!h) continue;
            obj[target] = row[h] || '';
        }
        const validation = validateRow(row, mapping);
        if (!validation.valid) { errors++; continue; }
        const amountFloat = parseFloat(obj.amount || '0');
        const cents = Math.round(amountFloat * 100);
        const date = obj.date || new Date().toISOString().slice(0, 10);
        try {
            await svc.create({ title: obj.title || 'Imported', amount: cents, date, category: obj.category || undefined, merchant: obj.merchant || undefined, notes: obj.notes || undefined });
            created++;
        } catch (e) { errors++; }
    }
    return { created, errors };
}

// Backwards-compatible wrapper: original callers/tests expect a number (created count)
export async function importCsvWithMapping(csvText: string, mapping: Record<string, string | undefined>, opts?: { skipHeader?: boolean }): Promise<number> {
    const res = await importCsvWithMappingWithStats(csvText, mapping, opts);
    return res.created;
}
