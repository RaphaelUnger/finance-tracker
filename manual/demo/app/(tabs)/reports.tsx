import React from 'react';
import { StyleSheet, View, ScrollView, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const { width } = Dimensions.get('window');

export default function ReportsScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">📊 Berichte</ThemedText>
      </ThemedView>

      <ScrollView style={styles.content}>
        {/* Monthly Summary */}
        <ThemedView style={styles.summaryCard}>
          <ThemedText style={styles.cardTitle}>Monatsübersicht Dezember</ThemedText>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <MaterialIcons name="trending-up" size={24} color="#4CAF50" />
              <ThemedText style={styles.summaryLabel}>Einnahmen</ThemedText>
              <ThemedText style={[styles.summaryAmount, { color: '#4CAF50' }]}>€ 2.850,00</ThemedText>
            </View>
            <View style={styles.summaryItem}>
              <MaterialIcons name="trending-down" size={24} color="#F44336" />
              <ThemedText style={styles.summaryLabel}>Ausgaben</ThemedText>
              <ThemedText style={[styles.summaryAmount, { color: '#F44336' }]}>€ 1.615,44</ThemedText>
            </View>
            <View style={styles.summaryItem}>
              <MaterialIcons name="account-balance-wallet" size={24} color="#007AFF" />
              <ThemedText style={styles.summaryLabel}>Ersparnis</ThemedText>
              <ThemedText style={[styles.summaryAmount, { color: '#007AFF' }]}>€ 1.234,56</ThemedText>
            </View>
          </View>
        </ThemedView>

        {/* Chart Placeholder */}
        <ThemedView style={styles.chartCard}>
          <ThemedText style={styles.cardTitle}>Ausgaben-Trend (Letzte 6 Monate)</ThemedText>
          <View style={styles.chartPlaceholder}>
            <MaterialIcons name="show-chart" size={60} color="#E0E0E0" />
            <ThemedText style={styles.chartText}>Interaktives Diagramm</ThemedText>
            <ThemedText style={styles.chartSubtext}>Zeigt Ausgaben-Trends über Zeit</ThemedText>
          </View>
        </ThemedView>

        {/* Categories Breakdown */}
        <ThemedView style={styles.categoriesCard}>
          <ThemedText style={styles.cardTitle}>Ausgaben nach Kategorien</ThemedText>

          <View style={styles.categoryItem}>
            <View style={styles.categoryInfo}>
              <View style={[styles.categoryDot, { backgroundColor: '#FF9800' }]} />
              <ThemedText style={styles.categoryName}>Lebensmittel</ThemedText>
            </View>
            <View style={styles.categoryAmount}>
              <ThemedText style={styles.categoryValue}>€ 456,78</ThemedText>
              <ThemedText style={styles.categoryPercent}>28%</ThemedText>
            </View>
          </View>

          <View style={styles.categoryItem}>
            <View style={styles.categoryInfo}>
              <View style={[styles.categoryDot, { backgroundColor: '#2196F3' }]} />
              <ThemedText style={styles.categoryName}>Transport</ThemedText>
            </View>
            <View style={styles.categoryAmount}>
              <ThemedText style={styles.categoryValue}>€ 320,50</ThemedText>
              <ThemedText style={styles.categoryPercent}>20%</ThemedText>
            </View>
          </View>

          <View style={styles.categoryItem}>
            <View style={styles.categoryInfo}>
              <View style={[styles.categoryDot, { backgroundColor: '#E91E63' }]} />
              <ThemedText style={styles.categoryName}>Kleidung</ThemedText>
            </View>
            <View style={styles.categoryAmount}>
              <ThemedText style={styles.categoryValue}>€ 245,60</ThemedText>
              <ThemedText style={styles.categoryPercent}>15%</ThemedText>
            </View>
          </View>

          <View style={styles.categoryItem}>
            <View style={styles.categoryInfo}>
              <View style={[styles.categoryDot, { backgroundColor: '#9C27B0' }]} />
              <ThemedText style={styles.categoryName}>Gesundheit</ThemedText>
            </View>
            <View style={styles.categoryAmount}>
              <ThemedText style={styles.categoryValue}>€ 180,20</ThemedText>
              <ThemedText style={styles.categoryPercent}>11%</ThemedText>
            </View>
          </View>

          <View style={styles.categoryItem}>
            <View style={styles.categoryInfo}>
              <View style={[styles.categoryDot, { backgroundColor: '#4CAF50' }]} />
              <ThemedText style={styles.categoryName}>Unterhaltung</ThemedText>
            </View>
            <View style={styles.categoryAmount}>
              <ThemedText style={styles.categoryValue}>€ 156,90</ThemedText>
              <ThemedText style={styles.categoryPercent}>10%</ThemedText>
            </View>
          </View>

          <View style={styles.categoryItem}>
            <View style={styles.categoryInfo}>
              <View style={[styles.categoryDot, { backgroundColor: '#795548' }]} />
              <ThemedText style={styles.categoryName}>Sonstiges</ThemedText>
            </View>
            <View style={styles.categoryAmount}>
              <ThemedText style={styles.categoryValue}>€ 255,46</ThemedText>
              <ThemedText style={styles.categoryPercent}>16%</ThemedText>
            </View>
          </View>
        </ThemedView>

        {/* Quick Stats */}
        <ThemedView style={styles.statsCard}>
          <ThemedText style={styles.cardTitle}>Wichtige Kennzahlen</ThemedText>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <MaterialIcons name="receipt-long" size={24} color="#007AFF" />
              <ThemedText style={styles.statValue}>47</ThemedText>
              <ThemedText style={styles.statLabel}>Transaktionen</ThemedText>
            </View>

            <View style={styles.statItem}>
              <MaterialIcons name="trending-up" size={24} color="#4CAF50" />
              <ThemedText style={styles.statValue}>+8%</ThemedText>
              <ThemedText style={styles.statLabel}>vs. Vormonat</ThemedText>
            </View>

            <View style={styles.statItem}>
              <MaterialIcons name="savings" size={24} color="#FF9800" />
              <ThemedText style={styles.statValue}>43%</ThemedText>
              <ThemedText style={styles.statLabel}>Sparquote</ThemedText>
            </View>

            <View style={styles.statItem}>
              <MaterialIcons name="calendar-month" size={24} color="#9C27B0" />
              <ThemedText style={styles.statValue}>€ 54,18</ThemedText>
              <ThemedText style={styles.statLabel}>Ø pro Tag</ThemedText>
            </View>
          </View>
        </ThemedView>

        <View style={styles.spacer} />
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
    padding: 20,
    paddingTop: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  },
  chartCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartPlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  chartText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  chartSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  categoriesCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    flex: 1,
  },
  categoryAmount: {
    alignItems: 'flex-end',
  },
  categoryValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoryPercent: {
    fontSize: 12,
    color: '#666',
  },
  statsCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    marginBottom: 10,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  spacer: {
    height: 20,
  },
});
