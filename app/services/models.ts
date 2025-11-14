export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Recurrence {
    frequency: Frequency;
    interval?: number; // e.g. every 2 months
    nextRun?: string; // ISO date
    endDate?: string | null; // ISO date or null
}

export interface Transaction {
    id: string;
    amountCents: number;
    date: string; // ISO date
    category?: string;
    merchant?: string;
    notes?: string;
    createdAt: string; // ISO
    recurrence?: Recurrence | null;
}
