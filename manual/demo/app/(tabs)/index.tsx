import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function FinanceTrackerDashboard() {
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.demoHeader}>
        <ThemedText style={styles.demoLabel}>🚀 DEMO VERSION</ThemedText>
      </ThemedView>

      <ThemedView style={styles.header}>
        <ThemedText type="title">💰 Finance Tracker Demo</ThemedText>
        <ThemedText style={styles.subtitle}>Willkommen zur Demo-Version!</ThemedText>
      </ThemedView>

      <ThemedView style={styles.balanceCard}>
        <ThemedText style={styles.balanceLabel}>Aktuelles Saldo</ThemedText>
        <ThemedText style={styles.balanceAmount}>€ 1.234,56</ThemedText>
        <ThemedText style={styles.balanceChange}>+€ 156,78 diese Woche</ThemedText>
      </ThemedView>

      <ThemedView style={styles.statsContainer}>
        <View style={[styles.statCard, styles.incomeCard]}>
          <MaterialIcons name="trending-up" size={24} color="#4CAF50" />
          <ThemedText style={styles.statLabel}>Einnahmen</ThemedText>
          <ThemedText style={styles.statAmount}>€ 2.850,00</ThemedText>
        </View>
        <View style={[styles.statCard, styles.expenseCard]}>
          <MaterialIcons name="trending-down" size={24} color="#F44336" />
          <ThemedText style={styles.statLabel}>Ausgaben</ThemedText>
          <ThemedText style={styles.statAmount}>€ 1.615,44</ThemedText>
        </View>
      </ThemedView>

      <ThemedView style={styles.quickActions}>
        <ThemedText style={styles.sectionTitle}>Schnellaktionen</ThemedText>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionButton, styles.addButton]}>
            <MaterialIcons name="add" size={24} color="white" />
            <Text style={styles.actionText}>Hinzufügen</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.scanButton]}>
            <MaterialIcons name="camera-alt" size={24} color="white" />
            <Text style={styles.actionText}>Beleg scannen</Text>
          </TouchableOpacity>
        </View>
      </ThemedView>

      <ThemedView style={styles.recentTransactions}>
        <ThemedText style={styles.sectionTitle}>Letzte Transaktionen</ThemedText>

        <View style={styles.transactionItem}>
          <View style={styles.transactionIcon}>
            <MaterialIcons name="shopping-cart" size={20} color="#FF9800" />
          </View>
          <View style={styles.transactionDetails}>
            <ThemedText style={styles.transactionDescription}>REWE Einkauf</ThemedText>
            <ThemedText style={styles.transactionCategory}>Lebensmittel</ThemedText>
          </View>
          <ThemedText style={styles.transactionAmount}>-€ 45,67</ThemedText>
        </View>

        <View style={styles.transactionItem}>
          <View style={styles.transactionIcon}>
            <MaterialIcons name="local-gas-station" size={20} color="#2196F3" />
          </View>
          <View style={styles.transactionDetails}>
            <ThemedText style={styles.transactionDescription}>Shell Tankstelle</ThemedText>
            <ThemedText style={styles.transactionCategory}>Transport</ThemedText>
          </View>
          <ThemedText style={styles.transactionAmount}>-€ 62,30</ThemedText>
        </View>

        <View style={styles.transactionItem}>
          <View style={styles.transactionIcon}>
            <MaterialIcons name="account-balance-wallet" size={20} color="#4CAF50" />
          </View>
          <View style={styles.transactionDetails}>
            <ThemedText style={styles.transactionDescription}>Gehalt</ThemedText>
            <ThemedText style={styles.transactionCategory}>Einkommen</ThemedText>
          </View>
          <ThemedText style={styles.transactionAmount}>+€ 2.850,00</ThemedText>
        </View>
      </ThemedView>

      <ThemedView style={styles.footer}>
        <ThemedText style={styles.footerText}>
          🚀 DEMO VERSION - Alle Daten sind Beispieldaten{'\n'}
          🔒 In der echten App sind alle Daten lokal und verschlüsselt gespeichert
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  demoHeader: {
    backgroundColor: '#FF6B35',
    padding: 10,
    alignItems: 'center',
    marginHorizontal: -20,
    marginTop: -20,
    marginBottom: 20,
  },
  demoLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  balanceCard: {
    backgroundColor: '#007AFF',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    marginBottom: 20,
  },
  balanceLabel: {
    color: 'white',
    fontSize: 16,
    opacity: 0.9,
  },
  balanceAmount: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 5,
  },
  balanceChange: {
    color: '#90EE90',
    fontSize: 14,
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  incomeCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  expenseCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  statAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
  },
  quickActions: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  addButton: {
    backgroundColor: '#4CAF50',
  },
  scanButton: {
    backgroundColor: '#FF9800',
  },
  actionText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  recentTransactions: {
    flex: 1,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
  },
  transactionCategory: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});
