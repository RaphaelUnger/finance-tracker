import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function TransactionsScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">💳 Transaktionen</ThemedText>
        <TouchableOpacity style={styles.addButton}>
          <MaterialIcons name="add" size={24} color="white" />
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.filterBar}>
        <TouchableOpacity style={styles.filterButton}>
          <MaterialIcons name="filter-list" size={20} color="#007AFF" />
          <Text style={styles.filterText}>Filter</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton}>
          <MaterialIcons name="sort" size={20} color="#007AFF" />
          <Text style={styles.filterText}>Sortieren</Text>
        </TouchableOpacity>
      </ThemedView>

      <ScrollView style={styles.transactionsList}>
        <ThemedView style={styles.dateGroup}>
          <ThemedText style={styles.dateHeader}>Heute</ThemedText>

          <View style={styles.transactionItem}>
            <View style={[styles.categoryIcon, { backgroundColor: '#FFE0E0' }]}>
              <MaterialIcons name="shopping-cart" size={20} color="#F44336" />
            </View>
            <View style={styles.transactionDetails}>
              <ThemedText style={styles.description}>REWE Supermarkt</ThemedText>
              <ThemedText style={styles.category}>Lebensmittel • 14:30</ThemedText>
              <ThemedText style={styles.notes}>Wocheneinkauf</ThemedText>
            </View>
            <View style={styles.amountContainer}>
              <ThemedText style={[styles.amount, styles.expense]}>-€ 45,67</ThemedText>
              <MaterialIcons name="receipt" size={16} color="#999" />
            </View>
          </View>

          <View style={styles.transactionItem}>
            <View style={[styles.categoryIcon, { backgroundColor: '#E3F2FD' }]}>
              <MaterialIcons name="local-gas-station" size={20} color="#2196F3" />
            </View>
            <View style={styles.transactionDetails}>
              <ThemedText style={styles.description}>Shell Tankstelle</ThemedText>
              <ThemedText style={styles.category}>Transport • 12:15</ThemedText>
            </View>
            <View style={styles.amountContainer}>
              <ThemedText style={[styles.amount, styles.expense]}>-€ 62,30</ThemedText>
            </View>
          </View>
        </ThemedView>

        <ThemedView style={styles.dateGroup}>
          <ThemedText style={styles.dateHeader}>Gestern</ThemedText>

          <View style={styles.transactionItem}>
            <View style={[styles.categoryIcon, { backgroundColor: '#E8F5E8' }]}>
              <MaterialIcons name="account-balance-wallet" size={20} color="#4CAF50" />
            </View>
            <View style={styles.transactionDetails}>
              <ThemedText style={styles.description}>Gehalt</ThemedText>
              <ThemedText style={styles.category}>Einkommen • 09:00</ThemedText>
              <ThemedText style={styles.notes}>Monatsgehalt Dezember</ThemedText>
            </View>
            <View style={styles.amountContainer}>
              <ThemedText style={[styles.amount, styles.income]}>+€ 2.850,00</ThemedText>
            </View>
          </View>

          <View style={styles.transactionItem}>
            <View style={[styles.categoryIcon, { backgroundColor: '#FFF3E0' }]}>
              <MaterialIcons name="restaurant" size={20} color="#FF9800" />
            </View>
            <View style={styles.transactionDetails}>
              <ThemedText style={styles.description}>McDonald's</ThemedText>
              <ThemedText style={styles.category}>Restaurant • 19:45</ThemedText>
            </View>
            <View style={styles.amountContainer}>
              <ThemedText style={[styles.amount, styles.expense]}>-€ 12,90</ThemedText>
            </View>
          </View>
        </ThemedView>

        <ThemedView style={styles.dateGroup}>
          <ThemedText style={styles.dateHeader}>2. Dezember</ThemedText>

          <View style={styles.transactionItem}>
            <View style={[styles.categoryIcon, { backgroundColor: '#F3E5F5' }]}>
              <MaterialIcons name="local-pharmacy" size={20} color="#9C27B0" />
            </View>
            <View style={styles.transactionDetails}>
              <ThemedText style={styles.description}>Apotheke</ThemedText>
              <ThemedText style={styles.category}>Gesundheit • 16:20</ThemedText>
            </View>
            <View style={styles.amountContainer}>
              <ThemedText style={[styles.amount, styles.expense]}>-€ 18,45</ThemedText>
            </View>
          </View>

          <View style={styles.transactionItem}>
            <View style={[styles.categoryIcon, { backgroundColor: '#FFE0E0' }]}>
              <MaterialIcons name="shopping-bag" size={20} color="#F44336" />
            </View>
            <View style={styles.transactionDetails}>
              <ThemedText style={styles.description}>H&M</ThemedText>
              <ThemedText style={styles.category}>Kleidung • 14:00</ThemedText>
            </View>
            <View style={styles.amountContainer}>
              <ThemedText style={[styles.amount, styles.expense]}>-€ 79,99</ThemedText>
            </View>
          </View>
        </ThemedView>

        <View style={styles.loadMoreContainer}>
          <TouchableOpacity style={styles.loadMoreButton}>
            <ThemedText style={styles.loadMoreText}>Weitere Transaktionen laden</ThemedText>
            <MaterialIcons name="expand-more" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterText: {
    color: '#007AFF',
    marginLeft: 5,
    fontWeight: '500',
  },
  transactionsList: {
    flex: 1,
  },
  dateGroup: {
    marginBottom: 20,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#E9ECEF',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  transactionDetails: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    fontWeight: '500',
  },
  category: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  notes: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
    fontStyle: 'italic',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  income: {
    color: '#4CAF50',
  },
  expense: {
    color: '#F44336',
  },
  loadMoreContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadMoreText: {
    color: '#007AFF',
    fontWeight: '500',
    marginRight: 5,
  },
});
