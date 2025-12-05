import { increment, getAll } from '../src/services/analytics';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('analytics', () => {
    beforeEach(async () => {
        // Clear analytics storage
        await AsyncStorage.removeItem('ft_analytics_v1');
    });

    it('should increment event counter', async () => {
        await increment('button_click');
        await increment('button_click');
        await increment('button_click');

        const all = await getAll();
        expect(all.button_click).toBe(3);
    });

    it('should track multiple events independently', async () => {
        await increment('event_a');
        await increment('event_b');
        await increment('event_a');

        const all = await getAll();
        expect(all.event_a).toBe(2);
        expect(all.event_b).toBe(1);
    });

    it('should return empty object when no events tracked', async () => {
        const all = await getAll();
        expect(all).toEqual({});
    });

    it('should handle new events correctly', async () => {
        await increment('new_event');

        const all = await getAll();
        expect(all.new_event).toBe(1);
    });

    it('should persist events across getAll calls', async () => {
        await increment('persist_test');

        const first = await getAll();
        const second = await getAll();

        expect(first.persist_test).toBe(1);
        expect(second.persist_test).toBe(1);
    });
});
