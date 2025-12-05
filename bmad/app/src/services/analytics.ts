import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// Types
// ============================================================================

/** Event counts stored in analytics */
export type AnalyticsData = Record<string, number>;

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'ft_analytics_v1';

// ============================================================================
// Analytics Functions
// ============================================================================

/**
 * Increment the count for an analytics event
 */
export async function increment(event: string): Promise<void> {
    try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const data: AnalyticsData = raw ? JSON.parse(raw) : {};
        data[event] = (data[event] || 0) + 1;
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
        // Silently ignore analytics failures
    }
}

/**
 * Retrieve all analytics event counts
 */
export async function getAll(): Promise<AnalyticsData> {
    try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

/**
 * Clear all analytics data
 */
export async function clear(): Promise<void> {
    try {
        await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
        // Silently ignore
    }
}

// ============================================================================
// Default Export
// ============================================================================

export default { increment, getAll, clear };
