# Quick Start - Finance Tracker

## 🚀 Schnellstart in 5 Minuten

### 1. Voraussetzungen installieren
```bash
# Node.js (Version 18+) von nodejs.org herunterladen
# React Native CLI installieren
npm install -g @react-native-community/cli
```

### 2. Projekt starten
```bash
# Repository klonen
git clone <repository-url>
cd finance-tracker/manual

# Dependencies installieren
npm install

# iOS Pods installieren (nur macOS)
cd ios && pod install && cd ..
```

### 3. App starten

#### Android:
```bash
# Terminal 1: Metro starten
npm start

# Terminal 2: Android App
npm run android
```

#### iOS (nur macOS):
```bash
# Terminal 1: Metro starten  
npm start

# Terminal 2: iOS App
npm run ios
```

### 4. Entwicklung
- **Hot Reload**: Automatisch bei Datei-Änderungen
- **Debugging**: Shake-Geste → Developer Menu
- **Tests**: `npm test`

## 🛠️ Häufige Befehle

```bash
# App starten
npm start                 # Metro Bundler
npm run android          # Android App
npm run ios             # iOS App

# Entwicklung
npm test                # Tests ausführen
npm run lint           # Code-Analyse
npm run format         # Code formatieren

# Build
npm run build          # Release Build
```

## 🚨 Probleme?

```bash
# Cache leeren
npm start -- --reset-cache

# Clean install
rm -rf node_modules && npm install

# Build clean (Android)
cd android && ./gradlew clean && cd ..

# Pods neu installieren (iOS)
cd ios && pod install && cd ..
```

---

**Fertig!** Die App sollte jetzt im Simulator/Emulator laufen. 🎉
