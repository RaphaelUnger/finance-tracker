import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'ft_analytics_v1';

export async function increment(event: string) {
    try {
        const raw = await AsyncStorage.getItem(KEY);
        const obj = raw ? JSON.parse(raw) : {};
        obj[event] = (obj[event] || 0) + 1;
        await AsyncStorage.setItem(KEY, JSON.stringify(obj));
    } catch (e) {
        // swallow
    }
}

export async function getAll() {
    try {
        const raw = await AsyncStorage.getItem(KEY);
        return raw ? JSON.parse(raw) : {};
    } catch (e) {
        return {};
    }
}

export default { increment, getAll };
