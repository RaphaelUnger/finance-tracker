export type CSVRow = {
    id?: string;
    amount?: string;
    date?: string;
    category?: string;
    notes?: string;
    merchant?: string;
    createdAt?: string;
};

export type Transaction = {
    id: string;
    amountCents: number;
    date: string;
    category: string;
    notes: string;
    merchant: string;
    createdAt: string;
};

export function parseCsv(text: string): CSVRow[] {
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) return [];
    const header = lines.shift()!.split(',').map(h => h.trim());
    return lines.map(line => {
        const cols = line.split(',');
        const obj: any = {};
        for (let i = 0; i < header.length; i++) obj[header[i]] = (cols[i] || '').trim();
        return obj as CSVRow;
    });
}

export function csvRowToTransaction(row: CSVRow): Transaction {
    const amountFloat = parseFloat(row.amount || '0');
    const cents = Math.round(amountFloat * 100);
    return {
        id: row.id || 'uuid_' + Math.random().toString(36).slice(2, 10),
        amountCents: cents,
        date: row.date || new Date().toISOString(),
        category: row.category || '',
        notes: row.notes || '',
        merchant: row.merchant || '',
        createdAt: row.createdAt || new Date().toISOString()
    };
}
