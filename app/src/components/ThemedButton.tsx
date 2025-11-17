import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
// Use the component props type for TouchableOpacity to avoid namespace issues
import { useTheme } from '../theme';

// Use a permissive type here to avoid compatibility issues with the project's TS setup
type Props = any & { title: string; textStyle?: any };

export default function ThemedButton({ title, style, textStyle, ...rest }: Props) {
    const theme = useTheme();
    return (
        <TouchableOpacity {...rest} style={[styles.btn, { backgroundColor: theme.colors.primary }, style]}>
            <Text style={[styles.label, { color: theme.colors.onPrimary || '#fff' }, textStyle]}>{title}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    btn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    label: { fontWeight: '600' }
});
