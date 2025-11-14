import { addDays, addWeeks, addMonths, addYears, isBefore, parseISO, format } from 'date-fns';
import { TransactionService } from './transactionService';
import type { Recurrence } from './models';

export function nextOccurrence(fromDate: string, recurrence: Recurrence): string {
    const d = parseISO(fromDate);
    const interval = recurrence.interval && recurrence.interval > 0 ? recurrence.interval : 1;
    switch (recurrence.frequency) {
        case 'daily': return format(addDays(d, interval), 'yyyy-MM-dd');
        case 'weekly': return format(addWeeks(d, interval), 'yyyy-MM-dd');
        case 'monthly': return format(addMonths(d, interval), 'yyyy-MM-dd');
        case 'yearly': return format(addYears(d, interval), 'yyyy-MM-dd');
        default: return format(addMonths(d, interval), 'yyyy-MM-dd');
    }
}

// Compute occurrences starting from a given start date (inclusive/exclusive) up to windowEnd (YYYY-MM-DD).
export function computeOccurrences(startISO: string, recurrence: Recurrence, windowEndISO: string): string[] {
    const results: string[] = [];
    let cur = startISO;
    const end = parseISO(windowEndISO);
    // Use recurrence.nextRun if present and after start
    if (recurrence.nextRun) {
        cur = recurrence.nextRun;
    }
    while (true) {
        const curDate = parseISO(cur);
        if (!isBefore(curDate, addDays(end, 1))) {
            break;
        }
        // if endDate set and cur > endDate, stop
        if (recurrence.endDate) {
            const ed = parseISO(recurrence.endDate);
            if (!isBefore(curDate, addDays(ed, 1))) break;
        }
        results.push(format(curDate, 'yyyy-MM-dd'));
        // advance
        cur = nextOccurrence(cur, recurrence);
    }
    return results;
}

// Runner: materialize occurrences for all recurring rules within the next `days` days.
export async function runGenerator(days = 30) {
    const svc = await TransactionService.getInstanceAsync();
    const all = await svc.list();
    const today = new Date();
    const windowEnd = format(addDays(today, days), 'yyyy-MM-dd');

    for (const t of all) {
        if (!t.recurrence) continue;
        const sourceId = t.id;
        // compute occurrences starting from either t.recurrence.nextRun or t.date
        const start = t.recurrence.nextRun || t.date;
        const occ = computeOccurrences(start, t.recurrence, windowEnd);
        for (const occDate of occ) {
            // Avoid duplicates: prefer checking generatedFrom; otherwise fallback to title+amount+date
            const existingList = await svc.list();
            const existing = existingList.find(x => x.generatedFrom === sourceId && x.date === occDate);
            if (existing) continue;
            const fallback = existingList.find(x => x.date === occDate && x.title === t.title && x.amount === t.amount);
            if (fallback) continue;
            await svc.create({ title: t.title, amount: t.amount, date: occDate, generatedFrom: sourceId, generatedAt: new Date().toISOString() });
            // advance nextRun on rule to the next occurrence after occDate
            const next = nextOccurrence(occDate, t.recurrence);
            const updatedRec = { ...t.recurrence, nextRun: next } as Recurrence;
            try {
                await svc.update(t.id, { recurrence: updatedRec });
            } catch (e) {
                // ignore update errors
            }
        }
    }
}

// rollback: remove generated instances for a given recurrence rule id
export async function rollbackGeneratedFor(ruleId: string, restoreNextRun?: string | null) {
    const svc = await TransactionService.getInstanceAsync();
    const all = await svc.list();
    const toDelete = all.filter(t => t.generatedFrom === ruleId);
    for (const d of toDelete) {
        try { await svc.delete(d.id); } catch (e) { /* ignore */ }
    }
    if (restoreNextRun) {
        try {
            await svc.update(ruleId, { recurrence: { ...((await svc.get(ruleId))?.recurrence || {}), nextRun: restoreNextRun } as Recurrence });
        } catch (e) { /* ignore */ }
    }
}

export default { computeOccurrences, runGenerator, nextOccurrence };
