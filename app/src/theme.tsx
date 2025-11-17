import React, { createContext, useContext } from 'react';

export type Theme = {
    id: string;
    name: string;
    colors: {
        primary: string;
        accent: string;
        surface: string;
        card: string;
        onPrimary: string;
        text: string;
        muted: string;
        cardBorder: string;
    };
};

const themes: Theme[] = [
    {
        id: 'calm-teal',
        name: 'Calm Teal',
        colors: { primary: '#0B6E4F', accent: '#FF8A65', surface: '#F7F7F8', card: '#FFFFFF', onPrimary: '#FFFFFF', text: '#111827', muted: '#9AA3B2', cardBorder: '#E6E9EE' }
    },
    {
        id: 'warm-minimal',
        name: 'Warm Minimal',
        colors: { primary: '#1F2937', accent: '#FFB86B', surface: '#FFFFFF', card: '#FFFFFF', onPrimary: '#FFFFFF', text: '#0F172A', muted: '#9AA3B2', cardBorder: '#E6E9EE' }
    },
    {
        id: 'midnight',
        name: 'Midnight',
        colors: { primary: '#0F172A', accent: '#06B6D4', surface: '#0B1220', card: '#07101a', onPrimary: '#E6EEF6', text: '#E6EEF6', muted: '#7B8794', cardBorder: '#122433' }
    }
];

const defaultTheme = themes[0];

const ThemeContext = createContext(defaultTheme as Theme);

type ThemeProviderProps = { children?: any; themeId?: string };
export function ThemeProvider({ children, themeId }: ThemeProviderProps) {
    const theme = themes.find(t => t.id === themeId) || defaultTheme;
    return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    return useContext(ThemeContext);
}

export default { themes, ThemeProvider, useTheme };
