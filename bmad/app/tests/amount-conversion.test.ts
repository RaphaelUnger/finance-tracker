describe('amount conversion rounding', () => {
    function toCents(s: string) {
        const parsed = parseFloat(s);
        return Math.round(parsed * 100);
    }

    it('rounds 0.005 to 1 cent', () => {
        expect(toCents('0.005')).toBe(1);
    });

    it('rounds 0.0049 to 0 cents', () => {
        expect(toCents('0.0049')).toBe(0);
    });

    it('rounds 1.235 to 124 cents? (checks common float cases)', () => {
        // 1.235 * 100 = 123.5 -> Math.round -> 124
        expect(toCents('1.235')).toBe(124);
    });

    it('handles comma decimal separators by replace to dot', () => {
        const s = '2,50'.replace(',', '.');
        expect(toCents(s)).toBe(250);
    });
});
