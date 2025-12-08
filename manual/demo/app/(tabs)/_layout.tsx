import { Tabs } from 'expo-router';
import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : 'white',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <MaterialIcons name="dashboard" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transaktionen',
          tabBarIcon: ({ color }) => <MaterialIcons name="list" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Berichte',
          tabBarIcon: ({ color }) => <MaterialIcons name="bar-chart" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Einstellungen',
          tabBarIcon: ({ color }) => <MaterialIcons name="settings" size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}
