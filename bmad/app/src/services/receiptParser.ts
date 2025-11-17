// Lightweight receipt parser heuristics: extract total amount, date, merchant from OCR text.
export type ReceiptSuggestion = {
    title?: string; // merchant
    amount?: number; // in cents
    date?: string; // YYYY-MM-DD
    rawText?: string;
};

function findAmount(text: string): number | undefined {
    // find all money-like patterns and pick the largest value (heuristic)
    const moneyRe = /\b(?:€|EUR|USD|\$)?\s?([0-9]+(?:[.,][0-9]{1,2})?)\b/g;
    let m: RegExpExecArray | null;
    const vals: number[] = [];
    while ((m = moneyRe.exec(text)) !== null) {
        const s = m[1].replace(',', '.');
        const n = parseFloat(s);
        if (Number.isFinite(n)) vals.push(n);
    }
    if (vals.length === 0) return undefined;
    const max = Math.max(...vals);
    return Math.round(max * 100);
}

function findDate(text: string): string | undefined {
    // common date patterns: YYYY-MM-DD, DD/MM/YYYY, DD.MM.YYYY, MM/DD/YYYY
    const iso = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
    if (iso) return iso[1];
    const dmy = text.match(/\b(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4})\b/);
    if (dmy) {
        const parts = dmy[1].split(/[\/\.\-]/).map(p => p.padStart(2, '0'));
        // try to normalize: if year is last and has 4 digits assume DMY or MDY ambiguity default to DMY
        if (parts[2].length === 4) {
            const [p1, p2, p3] = parts;
            // try to build YYYY-MM-DD assuming DMY
            return `${p3}-${p2}-${p1}`;
        } else {
            // two-digit year -> prefix 20
            const [p1, p2, p3] = parts;
            return `20${p3}-${p2}-${p1}`;
        }
    }
    return undefined;
}

function findMerchant(text: string): string | undefined {
    // Heuristic: merchant often occurs on the first non-empty line and is short.
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return undefined;
    // skip lines that look like headers or totals
    for (let i = 0; i < Math.min(5, lines.length); i++) {
        const l = lines[i];
        if (/receipt|invoice|total|vat|tax/i.test(l)) continue;
        if (l.length > 2 && l.length < 80) return l;
    }
    return lines[0];
}

export function parseReceiptText(text: string): ReceiptSuggestion {
    const raw = text || '';
    const suggestion: ReceiptSuggestion = { rawText: raw };
    const amt = findAmount(raw);
    if (amt !== undefined) suggestion.amount = amt;
    const dt = findDate(raw);
    if (dt) suggestion.date = dt;
    const m = findMerchant(raw);
    if (m) suggestion.title = m;
    return suggestion;
}

export default { parseReceiptText };
