// ============================================================================
// Types
// ============================================================================

/**
 * Extracted data from receipt OCR text
 */
export interface ReceiptSuggestion {
    /** Merchant name extracted from receipt */
    title?: string;
    /** Amount in cents */
    amount?: number;
    /** Date in YYYY-MM-DD format */
    date?: string;
    /** Original OCR text */
    rawText?: string;
}

// ============================================================================
// Amount Extraction
// ============================================================================

/** Pattern to match currency amounts (supports €, EUR, USD, $) */
const MONEY_PATTERN = /\b(?:€|EUR|USD|\$)?\s?([0-9]+(?:[.,][0-9]{1,2})?)\b/g;

/**
 * Extract the likely total amount from receipt text.
 * Uses heuristic: largest value found is typically the total.
 */
function findAmount(text: string): number | undefined {
    const values: number[] = [];
    let match: RegExpExecArray | null;

    while ((match = MONEY_PATTERN.exec(text)) !== null) {
        const normalized = match[1].replace(',', '.');
        const value = parseFloat(normalized);
        if (Number.isFinite(value)) {
            values.push(value);
        }
    }

    if (values.length === 0) return undefined;

    const maxValue = Math.max(...values);
    return Math.round(maxValue * 100);
}

// ============================================================================
// Date Extraction
// ============================================================================

/** ISO date pattern: YYYY-MM-DD */
const ISO_DATE_PATTERN = /\b(\d{4}-\d{2}-\d{2})\b/;

/** Common date patterns: DD/MM/YYYY, DD.MM.YYYY, MM/DD/YYYY */
const COMMON_DATE_PATTERN = /\b(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4})\b/;

/**
 * Normalize a date string to YYYY-MM-DD format
 */
function normalizeDateParts(parts: string[]): string {
    const [p1, p2, p3] = parts.map(p => p.padStart(2, '0'));

    // If year has 4 digits, assume DMY format
    if (p3.length === 4) {
        return `${p3}-${p2}-${p1}`;
    }

    // Two-digit year: prefix with 20
    return `20${p3}-${p2}-${p1}`;
}

/**
 * Extract a date from receipt text
 */
function findDate(text: string): string | undefined {
    // Try ISO format first
    const isoMatch = text.match(ISO_DATE_PATTERN);
    if (isoMatch) return isoMatch[1];

    // Try common formats
    const commonMatch = text.match(COMMON_DATE_PATTERN);
    if (commonMatch) {
        const parts = commonMatch[1].split(/[\/\.\-]/);
        return normalizeDateParts(parts);
    }

    return undefined;
}

// ============================================================================
// Merchant Extraction
// ============================================================================

/** Keywords to skip when looking for merchant name */
const SKIP_KEYWORDS = /receipt|invoice|total|vat|tax/i;

/** Maximum number of lines to search for merchant */
const MAX_MERCHANT_SEARCH_LINES = 5;

/** Merchant name length constraints */
const MIN_MERCHANT_LENGTH = 3;
const MAX_MERCHANT_LENGTH = 80;

/**
 * Extract the merchant name from receipt text.
 * Heuristic: merchant is often on one of the first non-header lines.
 */
function findMerchant(text: string): string | undefined {
    const lines = text
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(Boolean);

    if (lines.length === 0) return undefined;

    // Search first few lines for a suitable merchant name
    const searchLimit = Math.min(MAX_MERCHANT_SEARCH_LINES, lines.length);
    for (let i = 0; i < searchLimit; i++) {
        const line = lines[i];

        // Skip header/total lines
        if (SKIP_KEYWORDS.test(line)) continue;

        // Accept lines within length constraints
        if (line.length >= MIN_MERCHANT_LENGTH && line.length < MAX_MERCHANT_LENGTH) {
            return line;
        }
    }

    // Fallback to first line
    return lines[0];
}

// ============================================================================
// Main Parser
// ============================================================================

/**
 * Parse OCR text from a receipt and extract structured data
 */
export function parseReceiptText(text: string): ReceiptSuggestion {
    const rawText = text || '';
    const suggestion: ReceiptSuggestion = { rawText };

    const amount = findAmount(rawText);
    if (amount !== undefined) {
        suggestion.amount = amount;
    }

    const date = findDate(rawText);
    if (date) {
        suggestion.date = date;
    }

    const merchant = findMerchant(rawText);
    if (merchant) {
        suggestion.title = merchant;
    }

    return suggestion;
}

// ============================================================================
// Default Export
// ============================================================================

export default { parseReceiptText };
