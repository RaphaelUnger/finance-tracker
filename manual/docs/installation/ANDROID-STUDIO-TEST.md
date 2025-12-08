# 🚀 Android Studio Setup - Live Test

## ✅ SCHRITT-FÜR-SCHRITT ANLEITUNG

### Schritt 1: Android Studio öffnen
- Starten Sie Android Studio
- Falls noch nicht installiert: https://developer.android.com/studio

### Schritt 2: Projekt öffnen
1. **"Open an existing project"** klicken
2. Navigieren zu: `C:\Users\emila\IdeaProjects\finance-tracker\manual\android`
3. **"Open"** klicken

### Schritt 3: Gradle Sync abwarten
- Android Studio lädt automatisch das Projekt
- **Wichtig:** Warten Sie, bis "Gradle Sync" fertig ist (kann 2-5 Minuten dauern)
- Unten rechts sehen Sie einen Fortschrittsbalken

### Schritt 4: Device Manager öffnen
1. Suchen Sie das **📱 Device Manager Symbol** (rechts oben)
2. Klicken Sie darauf
3. Falls nicht sichtbar: **Tools → Device Manager**

### Schritt 5: Virtual Device erstellen
1. **"Create device"** klicken
2. **Phone → Pixel 4** wählen
3. **"Next"** klicken
4. **API Level 30 oder höher** wählen (z.B. "R API 30")
5. **"Next"** → **"Finish"**

### Schritt 6: Emulator starten
- In Device Manager: **▶️ Play-Button** neben dem erstellten Gerät
- Emulator startet (dauert 1-2 Minuten)

### Schritt 7: App ausführen
- **Grünen "Run" Button** in Android Studio klicken (▶️)
- **Oder:** Menü → Run → Run 'app'

---

## ⏱️ ZEITPLAN:
- **Gradle Sync:** 2-5 Minuten
- **Emulator Start:** 1-2 Minuten  
- **App Build:** 1-3 Minuten
- **Gesamt:** ~5-10 Minuten

---

## 🔍 WAS SIE SEHEN SOLLTEN:

### Gradle Sync erfolgreich:
```
BUILD SUCCESSFUL
Gradle sync finished
```

### Emulator gestartet:
- Android-Gerät öffnet sich in separatem Fenster
- Android-Homescreen wird angezeigt

### App Installation:
```
Installing APK 'app-debug.apk'...
APK installed successfully
Starting activity...
```

### App läuft:
- **Finance Tracker App** öffnet sich im Emulator
- Sie sehen den App-Splash Screen oder Setup

---

## 🚨 HÄUFIGE PROBLEME & LÖSUNGEN:

### Problem: "Gradle Sync failed"
```
File → Sync Project with Gradle Files
```

### Problem: "No Android SDK"
```
File → Project Structure → SDK Location
SDK path setzen auf: C:\Users\emila\AppData\Local\Android\Sdk
```

### Problem: "Emulator doesn't start"
```
Tools → AVD Manager → Delete device → Create new device
```

### Problem: "Build failed"
```
Build → Clean Project
Build → Rebuild Project
```

---

## ✅ ERFOLGS-CHECKPUNKT:

Nach erfolgreichem Setup sehen Sie:
1. ✅ Gradle Sync completed
2. ✅ Emulator läuft
3. ✅ Finance Tracker App ist sichtbar
4. ✅ App reagiert auf Touches

---

**STARTEN SIE JETZT Android Studio und folgen Sie den Schritten!** 

**Melden Sie sich, wenn Sie Probleme haben oder wenn die App erfolgreich läuft!** 📱✅
