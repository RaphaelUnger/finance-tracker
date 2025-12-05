import { addDays, addWeeks, addMonths, addYears, isBefore, parseISO, format } from 'date-fns';
import { TransactionService, Transaction } from './transactionService';
import type { Recurrence } from './models';

// ============================================================================
// Constants
// ============================================================================

/** Default number of days to look ahead when generating occurrences */
const DEFAULT_LOOKAHEAD_DAYS = 30;

/** Date format for storing/comparing dates */
const DATE_FORMAT = 'yyyy-MM-dd';

// ============================================================================
// Date Calculation Helpers
// ============================================================================

/**
 * Get the date addition function for a given frequency
 */
function getDateAddFn(frequency: string): (date: Date, amount: number) => Date {
    switch (frequency) {
        case 'daily': return addDays;
        case 'weekly': return addWeeks;
        case 'monthly': return addMonths;
        case 'yearly': return addYears;
        default: return addMonths;
    }
}

/**
 * Calculate the next occurrence date for a recurrence rule
 */
export function nextOccurrence(fromDate: string, recurrence: Recurrence): string {
    const d = parseISO(fromDate);
    const interval = recurrence.interval && recurrence.interval > 0 ? recurrence.interval : 1;
    const addFn = getDateAddFn(recurrence.frequency);
    return format(addFn(d, interval), DATE_FORMAT);
}

// ============================================================================
// Occurrence Computation
// ============================================================================

/**
 * Check if a date is before or equal to an end date (inclusive)
 */
function isBeforeOrEqual(date: Date, endDate: Date): boolean {
    return isBefore(date, addDays(endDate, 1));
}

/**
 * Compute all occurrence dates from a start date up to a window end date
 */
export function computeOccurrences(
    startISO: string,
    recurrence: Recurrence,
    windowEndISO: string
): string[] {
    const results: string[] = [];
    let cur = recurrence.nextRun || startISO;
    const windowEnd = parseISO(windowEndISO);
    const ruleEndDate = recurrence.endDate ? parseISO(recurrence.endDate) : null;

    while (true) {
        const curDate = parseISO(cur);

        // Stop if past window end
        if (!isBeforeOrEqual(curDate, windowEnd)) {
            break;
        }

        // Stop if past rule end date
        if (ruleEndDate && !isBeforeOrEqual(curDate, ruleEndDate)) {
            break;
        }

        results.push(format(curDate, DATE_FORMAT));
        cur = nextOccurrence(cur, recurrence);
    }

    return results;
}

// ============================================================================
// Generator Functions
// ============================================================================

/**
 * Check if an occurrence already exists (either by generatedFrom or by matching title/amount/date)
 */
function occurrenceExists(
    existingList: Transaction[],
    sourceId: string,
    occDate: string,
    title: string,
    amount: number
): boolean {
    // Primary check: explicit link via generatedFrom
    const byGeneratedFrom = existingList.find(
        x => x.generatedFrom === sourceId && x.date === occDate
    );
    if (byGeneratedFrom) return true;

    // Fallback check: matching title, amount, and date
    const byMatch = existingList.find(
        x => x.date === occDate && x.title === title && x.amount === amount
    );
    return !!byMatch;
}

/**
 * Materialize occurrences for all recurring rules within the specified window
 */
export async function runGenerator(days = DEFAULT_LOOKAHEAD_DAYS): Promise<number> {
    const svc = await TransactionService.getInstanceAsync();
    const all = await svc.list();
    const today = new Date();
    const windowEnd = format(addDays(today, days), DATE_FORMAT);
    let created = 0;

    for (const t of all) {
        if (!t.recurrence) continue;

        const sourceId = t.id;
        const start = t.recurrence.nextRun || t.date;
        const occurrences = computeOccurrences(start, t.recurrence, windowEnd);

        for (const occDate of occurrences) {
            // Check for existing occurrence
            const existingList = await svc.list();
            if (occurrenceExists(existingList, sourceId, occDate, t.title, t.amount)) {
                continue;
            }

            // Create the new occurrence
            await svc.create({
                title: t.title,
                amount: t.amount,
                date: occDate,
                generatedFrom: sourceId,
                generatedAt: new Date().toISOString()
            });
            created++;

            // Advance nextRun to the next occurrence
            const next = nextOccurrence(occDate, t.recurrence);
            const updatedRec: Recurrence = { ...t.recurrence, nextRun: next };
            try {
                await svc.update(t.id, { recurrence: updatedRec });
            } catch {
                // Ignore update errors
            }
        }
    }

    return created;
}

/**
 * Remove all generated instances for a given recurrence rule
 */
export async function rollbackGeneratedFor(
    ruleId: string,
    restoreNextRun?: string | null
): Promise<void> {
    const svc = await TransactionService.getInstanceAsync();
    const all = await svc.list();

    // Delete all transactions generated from this rule
    const toDelete = all.filter(t => t.generatedFrom === ruleId);
    for (const d of toDelete) {
        try {
            await svc.delete(d.id);
        } catch {
            // Ignore delete errors
        }
    }

    // Optionally restore the nextRun value
    if (restoreNextRun) {
        try {
            const rule = await svc.get(ruleId);
            if (rule?.recurrence) {
                const updatedRec: Recurrence = { ...rule.recurrence, nextRun: restoreNextRun };
                await svc.update(ruleId, { recurrence: updatedRec });
            }
        } catch {
            // Ignore update errors
        }
    }
}

// ============================================================================
// Default Export
// ============================================================================

export default {
    computeOccurrences,
    runGenerator,
    nextOccurrence,
    rollbackGeneratedFor
};
