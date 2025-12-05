import { TransactionService } from './transactionService';
import { parseISO } from 'date-fns';
import Papa from 'papaparse';

// ============================================================================
// Types
// ============================================================================

/** Column mapping from target fields to CSV header names */
export type ColumnMapping = Record<string, string | undefined>;

/** Import result with statistics */
export interface ImportResult {
    created: number;
    errors: number;
}

/** Parsed CSV data */
export interface ParsedCsv {
    header: string[];
    rows: Record<string, string>[];
}

/** Validation result for a CSV row */
export interface ValidationResult {
    valid: boolean;
    errors: string[];
}

// ============================================================================
// Constants
// ============================================================================

const EXPORT_HEADERS = ['id', 'title', 'amount', 'date', 'category', 'merchant', 'notes', 'createdAt'] as const;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Escapes a value for CSV (replaces commas with spaces)
 */
function escapeForCsv(value: string | undefined): string {
    return (value || '').replace(/,/g, ' ');
}

/**
 * Converts cents to decimal amount string
 */
function centsToDecimal(cents: number): string {
    return (cents / 100).toFixed(2);
}

/**
 * Converts decimal amount to cents
 */
function decimalToCents(decimal: string): number {
    const amountFloat = parseFloat(decimal || '0');
    return Math.round(amountFloat * 100);
}

// ============================================================================
// Export Functions
// ============================================================================

/**
 * Export transactions for a specific month to CSV format
 */
export async function exportMonthToCsv(year: number, month: number): Promise<string> {
    const svc = await TransactionService.getInstanceAsync();
    const all = await svc.list();

    // Filter by year/month
    const rows = all.filter(t => {
        try {
            const d = parseISO(t.date);
            return d.getFullYear() === year && (d.getMonth() + 1) === month;
        } catch {
            return false;
        }
    });

    const lines = [EXPORT_HEADERS.join(',')];
    for (const r of rows) {
        const cols = [
            r.id,
            escapeForCsv(r.title),
            centsToDecimal(r.amount),
            r.date,
            r.category || '',
            r.merchant || '',
            escapeForCsv(r.notes),
            r.createdAt || ''
        ];
        lines.push(cols.join(','));
    }
    return lines.join('\n');
}

// ============================================================================
// Import Functions (Simple)
// ============================================================================

/**
 * Simple CSV import with naive column mapping (expects header to match field names)
 */
export async function importCsvToTransactions(csvText: string, opts?: { skipHeader?: boolean }): Promise<number> {
    const svc = await TransactionService.getInstanceAsync();
    const lines = csvText.split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) return 0;

    const header = lines[0].split(',').map(h => h.trim());
    const body = opts?.skipHeader ? lines : lines.slice(1);
    let created = 0;

    for (const line of body) {
        const cols = line.split(',');
        const obj: Record<string, string> = {};
        for (let i = 0; i < header.length; i++) {
            obj[header[i]] = (cols[i] || '').trim();
        }

        const cents = decimalToCents(obj.amount);
        const date = obj.date || new Date().toISOString().slice(0, 10);

        try {
            await svc.create({
                title: obj.title || 'Imported',
                amount: cents,
                date,
                category: obj.category || undefined,
                merchant: obj.merchant || undefined,
                notes: obj.notes || undefined
            });
            created++;
        } catch {
            // Skip failures silently
        }
    }
    return created;
}

export default { exportMonthToCsv, importCsvToTransactions };

// ============================================================================
// CSV Parsing & Validation
// ============================================================================

/**
 * Parse CSV text using PapaParse
 */
export function parseCsv(csvText: string): ParsedCsv {
    const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    const header = parsed.meta.fields || [];
    const rows = (parsed.data as Record<string, unknown>[]).map(r => {
        const out: Record<string, string> = {};
        for (const k of header) {
            out[k] = (r[k] || '').toString();
        }
        return out;
    });
    return { header, rows };
}

/**
 * Validate a CSV row against the expected mapping
 */
export function validateRow(row: Record<string, string>, mapping: ColumnMapping): ValidationResult {
    const errs: string[] = [];
    const title = mapping.title ? row[mapping.title] : undefined;
    const amount = mapping.amount ? row[mapping.amount] : undefined;
    const date = mapping.date ? row[mapping.date] : undefined;

    if (!title || !title.trim()) errs.push('title missing');
    if (!amount || isNaN(Number(amount))) errs.push('amount invalid');
    if (!date || isNaN(Date.parse(date))) errs.push('date invalid');

    return { valid: errs.length === 0, errors: errs };
}

// ============================================================================
// Import Functions (With Mapping)
// ============================================================================

/**
 * Import CSV with custom column mapping and return statistics
 */
export async function importCsvWithMappingWithStats(
    csvText: string,
    mapping: ColumnMapping,
    _opts?: { skipHeader?: boolean }
): Promise<ImportResult> {
    const svc = await TransactionService.getInstanceAsync();
    const { rows } = parseCsv(csvText);
    let created = 0;
    let errors = 0;

    for (const row of rows) {
        // Map CSV columns to target fields
        const obj: Record<string, string> = {};
        for (const target of Object.keys(mapping)) {
            const headerName = mapping[target];
            if (headerName) {
                obj[target] = row[headerName] || '';
            }
        }

        // Validate the row
        const validation = validateRow(row, mapping);
        if (!validation.valid) {
            errors++;
            continue;
        }

        // Create the transaction
        const cents = decimalToCents(obj.amount);
        const date = obj.date || new Date().toISOString().slice(0, 10);

        try {
            await svc.create({
                title: obj.title || 'Imported',
                amount: cents,
                date,
                category: obj.category || undefined,
                merchant: obj.merchant || undefined,
                notes: obj.notes || undefined
            });
            created++;
        } catch {
            errors++;
        }
    }

    return { created, errors };
}

/**
 * Import CSV with custom column mapping (backwards-compatible, returns count only)
 */
export async function importCsvWithMapping(
    csvText: string,
    mapping: ColumnMapping,
    opts?: { skipHeader?: boolean }
): Promise<number> {
    const res = await importCsvWithMappingWithStats(csvText, mapping, opts);
    return res.created;
}
