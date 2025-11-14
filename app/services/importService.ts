import { parseCsv, csvRowToTransaction } from '../services/csvParser';
import { Transaction as ModelTransaction } from './models';

export type ImportResult = {
    created: number;
    skipped: number;
    errors: { row: number; error: string }[];
};

export async function importCsvToRepo(text: string, repo: any): Promise<ImportResult> {
    const rows = parseCsv(text);
    const result: ImportResult = { created: 0, skipped: 0, errors: [] };
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
            const parsed = csvRowToTransaction(row);
            const tx: ModelTransaction = {
                id: parsed.id,
                amountCents: parsed.amountCents,
                date: parsed.date,
                category: parsed.category,
                merchant: parsed.merchant,
                notes: parsed.notes,
                createdAt: parsed.createdAt,
                recurrence: null
            } as any;
            await repo.create(tx);
            result.created++;
        } catch (err: any) {
            const msg = err && err.message ? err.message : String(err);
            const code = err && err.code ? String(err.code) : '';
            // detect common sqlite unique constraint error patterns
            if (msg.toLowerCase().includes('unique') || msg.toLowerCase().includes('constraint') || code.toUpperCase().includes('CONSTRAINT') || msg.toLowerCase().includes('duplicate')) {
                result.skipped++;
            } else {
                result.errors.push({ row: i + 1, error: msg });
            }
        }
    }
    return result;
}
