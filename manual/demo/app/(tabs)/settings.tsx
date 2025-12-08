import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Switch, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function SettingsScreen() {
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [biometricEnabled, setBiometricEnabled] = React.useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">⚙️ Einstellungen</ThemedText>
      </ThemedView>

      <ScrollView style={styles.content}>
        {/* Profile Section */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Profil</ThemedText>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="account-circle" size={24} color="#007AFF" />
              <ThemedText style={styles.settingLabel}>Benutzerprofil</ThemedText>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="backup" size={24} color="#007AFF" />
              <ThemedText style={styles.settingLabel}>Daten exportieren</ThemedText>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>
        </ThemedView>

        {/* Security Section */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Sicherheit</ThemedText>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="lock" size={24} color="#007AFF" />
              <ThemedText style={styles.settingLabel}>PIN ändern</ThemedText>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="fingerprint" size={24} color="#007AFF" />
              <View>
                <ThemedText style={styles.settingLabel}>Biometrische Authentifizierung</ThemedText>
                <ThemedText style={styles.settingDescription}>Touch ID / Face ID verwenden</ThemedText>
              </View>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={setBiometricEnabled}
              trackColor={{ false: '#D1D1D6', true: '#007AFF' }}
            />
          </View>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="schedule" size={24} color="#007AFF" />
              <ThemedText style={styles.settingLabel}>Auto-Sperre</ThemedText>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>5 Minuten</Text>
              <MaterialIcons name="chevron-right" size={24} color="#999" />
            </View>
          </TouchableOpacity>
        </ThemedView>

        {/* Appearance Section */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Darstellung</ThemedText>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="dark-mode" size={24} color="#007AFF" />
              <View>
                <ThemedText style={styles.settingLabel}>Dunkler Modus</ThemedText>
                <ThemedText style={styles.settingDescription}>App-Erscheinungsbild anpassen</ThemedText>
              </View>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={setIsDarkMode}
              trackColor={{ false: '#D1D1D6', true: '#007AFF' }}
            />
          </View>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="language" size={24} color="#007AFF" />
              <ThemedText style={styles.settingLabel}>Sprache</ThemedText>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>Deutsch</Text>
              <MaterialIcons name="chevron-right" size={24} color="#999" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="euro-symbol" size={24} color="#007AFF" />
              <ThemedText style={styles.settingLabel}>Währung</ThemedText>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>EUR (€)</Text>
              <MaterialIcons name="chevron-right" size={24} color="#999" />
            </View>
          </TouchableOpacity>
        </ThemedView>

        {/* Notifications Section */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Benachrichtigungen</ThemedText>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="notifications" size={24} color="#007AFF" />
              <View>
                <ThemedText style={styles.settingLabel}>Benachrichtigungen</ThemedText>
                <ThemedText style={styles.settingDescription}>Transaktions-Updates erhalten</ThemedText>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#D1D1D6', true: '#007AFF' }}
            />
          </View>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="repeat" size={24} color="#007AFF" />
              <ThemedText style={styles.settingLabel}>Wiederkehrende Transaktionen</ThemedText>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>
        </ThemedView>

        {/* Data Section */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Daten</ThemedText>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="cloud-download" size={24} color="#007AFF" />
              <ThemedText style={styles.settingLabel}>Backup erstellen</ThemedText>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="cloud-upload" size={24} color="#007AFF" />
              <ThemedText style={styles.settingLabel}>Backup wiederherstellen</ThemedText>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="category" size={24} color="#007AFF" />
              <ThemedText style={styles.settingLabel}>Kategorien verwalten</ThemedText>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>
        </ThemedView>

        {/* About Section */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Über die App</ThemedText>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="info" size={24} color="#007AFF" />
              <ThemedText style={styles.settingLabel}>Version</ThemedText>
            </View>
            <Text style={styles.settingValue}>1.0.0</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="help" size={24} color="#007AFF" />
              <ThemedText style={styles.settingLabel}>Hilfe & Support</ThemedText>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="privacy-tip" size={24} color="#007AFF" />
              <ThemedText style={styles.settingLabel}>Datenschutzrichtlinie</ThemedText>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>
        </ThemedView>

        {/* Danger Zone */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Erweitert</ThemedText>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="delete-forever" size={24} color="#F44336" />
              <View>
                <ThemedText style={[styles.settingLabel, { color: '#F44336' }]}>Alle Daten löschen</ThemedText>
                <ThemedText style={styles.settingDescription}>Kann nicht rückgängig gemacht werden</ThemedText>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>
        </ThemedView>

        <View style={styles.footer}>
          <ThemedText style={styles.footerText}>
            🔒 Finance Tracker{'\n'}
            Ihre Daten bleiben privat und sicher auf Ihrem Gerät
          </ThemedText>
        </View>

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
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 20,
    paddingBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    marginLeft: 15,
    flex: 1,
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    marginLeft: 15,
  },
  settingValue: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  spacer: {
    height: 20,
  },
});
