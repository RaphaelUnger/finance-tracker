import React, { createContext, useContext, useEffect, useState } from 'react';
import i18n from './index';

type I18nContextValue = {
    locale: string;
    setLocale: (l: string) => void;
    t: (k: string) => string;
    available: string[];
};

const ctx = createContext(null as I18nContextValue | null);

type I18nProviderProps = { children?: any };

export function I18nProvider({ children }: I18nProviderProps) {
    const [locale, setLocaleState] = useState(i18n.getLocale());

    useEffect(() => {
        (async () => {
            try { await i18n.initI18n(); } catch (e) { }
            setLocaleState(i18n.getLocale());
        })();
    }, []);

    const setLocale = (l: string) => {
        i18n.setLocale(l);
        i18n.persistLocale(l).catch(() => { });
        setLocaleState(l);
    };

    const value: I18nContextValue = { locale, setLocale, t: i18n.t, available: i18n.getAvailableLocales() };
    return <ctx.Provider value={value}>{children}</ctx.Provider>;
}

export function useI18n() {
    const v = useContext(ctx);
    if (!v) throw new Error('useI18n must be used within I18nProvider');
    return v;
}

export function useT() { return useI18n().t; }

export default { I18nProvider, useI18n, useT };
