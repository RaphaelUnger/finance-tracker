import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

export type Transaction = {
    id: string;
    title: string;
    amount: number; // cents
    date: string; // YYYY-MM-DD
};

const KEY = 'ft_transactions_v1';

export class TransactionService {
    private static instance: TransactionService | null = null;

    static getInstance() {
        if (!this.instance) this.instance = new TransactionService();
        return this.instance;
    }

    async list(): Promise<Transaction[]> {
        const raw = await AsyncStorage.getItem(KEY);
        if (!raw) return [];
        try {
            return JSON.parse(raw) as Transaction[];
        } catch (e) {
            return [];
        }
    }

    async get(id: string): Promise<Transaction | undefined> {
        const all = await this.list();
        return all.find((t) => t.id === id);
    }

    async create(input: Omit<Transaction, 'id'>): Promise<Transaction> {
        const tx: Transaction = { ...input, id: uuidv4() };
        const all = await this.list();
        all.unshift(tx);
        await AsyncStorage.setItem(KEY, JSON.stringify(all));
        return tx;
    }

    async update(id: string, patch: Partial<Omit<Transaction, 'id'>>): Promise<Transaction> {
        const all = await this.list();
        const idx = all.findIndex((t) => t.id === id);
        if (idx === -1) throw new Error('Not found');
        const updated = { ...all[idx], ...patch };
        all[idx] = updated;
        await AsyncStorage.setItem(KEY, JSON.stringify(all));
        return updated;
    }

    async delete(id: string): Promise<void> {
        const all = await this.list();
        const filtered = all.filter((t) => t.id !== id);
        await AsyncStorage.setItem(KEY, JSON.stringify(filtered));
    }
}
