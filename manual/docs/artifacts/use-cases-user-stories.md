# Use Cases & User Stories - Finance Tracker App

## Überblick
Dieses Dokument beschreibt die Use Cases und User Stories für die Finance Tracker App aus Anwendersicht. Die Beschreibungen folgen den definierten funktionalen Anforderungen und bilden die Grundlage für die Implementierung.

## Akteure
- **Endbenutzer (Primary Actor)**: Privatperson, die ihre persönlichen Finanzen verwalten möchte
- **System**: Finance Tracker Mobile App
- **Mobile Device**: Smartphone/Tablet mit Kamera (für Receipt Scanning)

## Use Cases

### UC1 - Transaktion erfassen
**Akteur**: Endbenutzer  
**Ziel**: Eine neue Einnahme oder Ausgabe in der App dokumentieren  
**Vorbedingung**: App ist installiert und geöffnet  
**Nachbedingung**: Transaktion ist gespeichert und in der Liste sichtbar  

**Hauptablauf**:
1. Benutzer öffnet das Formular zum Hinzufügen einer Transaktion
2. System zeigt Eingabemaske mit Feldern: Betrag, Beschreibung, Datum, Kategorie, Typ
3. Benutzer gibt Betrag und Beschreibung ein
4. Benutzer wählt Datum (Standard: heute)
5. Benutzer wählt Kategorie aus vordefinierten oder eigenen Kategorien
6. Benutzer wählt Transaktionstyp (Einnahme/Ausgabe)
7. Benutzer bestätigt die Eingabe
8. System validiert und speichert die Transaktion
9. System zeigt Bestätigung und kehrt zur Transaktionsliste zurück

**Alternative Abläufe**:
- 3a. Benutzer scannt einen Beleg → UC4 (Receipt Scanning)
- 8a. Validierungsfehler → System zeigt Fehlermeldung, Benutzer korrigiert Eingabe
- 7a. Benutzer fügt Notiz hinzu (optional)

### UC2 - Transaktionen verwalten
**Akteur**: Endbenutzer  
**Ziel**: Bestehende Transaktionen einsehen, bearbeiten oder löschen  
**Vorbedingung**: Mindestens eine Transaktion ist vorhanden  

**Hauptablauf**:
1. Benutzer öffnet die Transaktionsliste
2. System zeigt chronologisch sortierte Liste aller Transaktionen
3. Benutzer wählt eine Transaktion aus
4. System zeigt Transaktionsdetails
5. Benutzer wählt Aktion: Bearbeiten, Löschen oder Schließen

**Subablauf 5a - Bearbeiten**:
5a.1. System öffnet Bearbeitungsformular mit vorausgefüllten Daten
5a.2. Benutzer ändert gewünschte Felder
5a.3. Benutzer bestätigt Änderungen
5a.4. System validiert und speichert Änderungen

**Subablauf 5b - Löschen**:
5b.1. System zeigt Bestätigungsdialog
5b.2. Benutzer bestätigt Löschung
5b.3. System entfernt Transaktion (Soft Delete)

### UC3 - Wiederkehrende Zahlungen einrichten
**Akteur**: Endbenutzer  
**Ziel**: Automatische Erstellung regelmäßiger Transaktionen konfigurieren  
**Vorbedingung**: App ist geöffnet  

**Hauptablauf**:
1. Benutzer navigiert zu "Wiederkehrende Transaktionen"
2. System zeigt Liste bestehender Wiederholungen und "Neu hinzufügen" Button
3. Benutzer wählt "Neu hinzufügen"
4. System öffnet Konfigurationsformular
5. Benutzer gibt Transaktionsdaten ein (wie UC1)
6. Benutzer wählt Wiederholungsmuster (täglich/wöchentlich/monatlich/jährlich)
7. Benutzer setzt Startdatum und optional Enddatum
8. Benutzer bestätigt Konfiguration
9. System speichert Wiederholungsregel
10. System plant erste automatische Erstellung

**Alternative Abläufe**:
- 6a. Benutzerdefinierte Wiederholung → Benutzer gibt spezifische Intervalle an
- 9a. Sofortige Erstellung → System erstellt erste Transaktion sofort

### UC4 - Beleg scannen
**Akteur**: Endbenutzer  
**Ziel**: Transaktionsdaten automatisch aus fotografiertem Beleg extrahieren  
**Vorbedingung**: Gerät hat Kamera, App hat Kamera-Berechtigung  

**Hauptablauf**:
1. Benutzer startet Scan-Funktion
2. System öffnet Kameraansicht
3. Benutzer positioniert Beleg im Rahmen
4. Benutzer löst Aufnahme aus
5. System erfasst Bild und führt OCR-Verarbeitung durch
6. System extrahiert: Betrag, Datum, Merchant/Beschreibung
7. System schlägt Kategorie basierend auf Merchant vor
8. System zeigt Vorschau mit extrahierten Daten
9. Benutzer überprüft und korrigiert bei Bedarf
10. Benutzer bestätigt Transaktion
11. System speichert Transaktion mit Original-Beleg als Anhang

**Alternative Abläufe**:
- 5a. OCR-Fehler → System zeigt Fehlermeldung, Benutzer kann manuell eingeben
- 6a. Unvollständige Erkennung → Benutzer ergänzt fehlende Daten
- 8a. Niedrige Konfidenz → System markiert unsichere Erkennungen

### UC5 - Berichte erstellen
**Akteur**: Endbenutzer  
**Ziel**: Finanzübersichten und Analysen für verschiedene Zeiträume anzeigen  
**Vorbedingung**: Transaktionsdaten sind vorhanden  

**Hauptablauf**:
1. Benutzer navigiert zum Berichts-Bereich
2. System zeigt Berichts-Dashboard mit Schnellübersicht
3. Benutzer wählt Berichtstyp (Monat/Jahr/Kategorie/Benutzerdefiniert)
4. Benutzer wählt Zeitraum
5. System generiert Bericht mit Grafiken und Tabellen
6. System zeigt Aufschlüsselung nach Kategorien
7. Benutzer kann Details durch Tap auf Kategorien anzeigen
8. Optional: Benutzer exportiert Bericht

**Alternative Abläufe**:
- 4a. Vergleichszeitraum → Benutzer wählt zwei Zeiträume zum Vergleich
- 8a. Export → Benutzer wählt Format (PDF/CSV) und Speicherort

### UC6 - App-Zugang sichern
**Akteur**: Endbenutzer  
**Ziel**: Unbefugten Zugang zur App und den Finanzdaten verhindern  
**Vorbedingung**: App ist installiert  

**Hauptablauf (Ersteinrichtung)**:
1. Benutzer startet App zum ersten Mal
2. System zeigt Sicherheits-Setup
3. Benutzer wählt Authentifizierungsmethode (PIN/Biometrie)
4. Benutzer richtet gewählte Methode ein
5. System aktiviert Sicherheitsfeatures
6. System verschlüsselt lokale Datenbank

**Hauptablauf (Tägliche Nutzung)**:
1. Benutzer startet App
2. System zeigt Sperrbildschirm
3. Benutzer authentifiziert sich
4. System gewährt Zugang zur App

**Alternative Abläufe**:
- 3a. Fehlversuche → System sperrt App temporär nach mehreren Fehlversuchen
- 3b. Biometrie fehlgeschlagen → System bietet PIN als Fallback

### UC7 - Daten exportieren/importieren
**Akteur**: Endbenutzer  
**Ziel**: Datenbackup erstellen oder Daten von anderen Quellen importieren  

**Hauptablauf Export**:
1. Benutzer navigiert zu Einstellungen → Daten-Management
2. System zeigt Export/Import Optionen
3. Benutzer wählt "Export"
4. System zeigt Format-Optionen (Backup/CSV/PDF)
5. Benutzer wählt Format und Datenbereich
6. System erstellt Export-Datei
7. System zeigt Speichern/Teilen-Dialog
8. Benutzer speichert Datei oder teilt sie

**Hauptablauf Import**:
1. Benutzer wählt "Import" 
2. System zeigt unterstützte Formate
3. Benutzer wählt Datei aus
4. System validiert und analysiert Datei
5. System zeigt Vorschau der zu importierenden Daten
6. Benutzer bestätigt Import
7. System importiert Daten und zeigt Zusammenfassung

## User Stories

### Epic 1: Grundlegende Transaktionsverwaltung

#### Story 1.1: Schnelle Ausgabe erfassen
**Als** Benutzer  
**möchte ich** schnell eine Ausgabe erfassen  
**damit** ich alle Ausgaben zeitnah dokumentiere und nichts vergesse.

**Akzeptanzkriterien**:
- Eingabe von Betrag, Beschreibung und Kategorie in unter 30 Sekunden
- Vorauswahl des heutigen Datums
- Top-5 Kategorien sind sofort sichtbar
- Speichern mit einem Tap möglich

#### Story 1.2: Einnahmen dokumentieren
**Als** Benutzer  
**möchte ich** meine Einnahmen separat von Ausgaben erfassen  
**damit** ich einen vollständigen Überblick über meine Finanzen habe.

**Akzeptanzkriterien**:
- Klare Unterscheidung zwischen Einnahme und Ausgabe im UI
- Separate Kategorien für Einnahmen
- Positive Beträge werden grün dargestellt
- Einnahmen fließen positiv in Berechnungen ein

#### Story 1.3: Transaktionen korrigieren
**Als** Benutzer  
**möchte ich** Fehler in bereits erfassten Transaktionen korrigieren  
**damit** meine Finanzdaten korrekt und zuverlässig sind.

**Akzeptanzkriterien**:
- Alle Felder einer Transaktion sind editierbar
- Änderungen werden sofort gespeichert
- Bestätigung bei kritischen Änderungen (Betrag > 100€)
- Original-Transaktion bleibt in History verfügbar

#### Story 1.4: Überblick behalten
**Als** Benutzer  
**möchte ich** eine chronologische Liste aller Transaktionen sehen  
**damit** ich nachvollziehen kann, wann ich was ausgegeben habe.

**Akzeptanzkriterien**:
- Transaktionen nach Datum sortiert (neueste zuerst)
- Gruppierung nach Tag/Woche/Monat umschaltbar
- Schnelle Suche nach Beschreibung oder Betrag
- Infinite Scrolling für große Datenmengen

### Epic 2: Intelligente Kategorisierung

#### Story 2.1: Vordefinierte Kategorien nutzen
**Als** Benutzer  
**möchte ich** aus sinnvollen Standardkategorien wählen  
**damit** ich nicht selbst alle Kategorien definieren muss.

**Akzeptanzkriterien**:
- Mindestens 15 vordefinierte Kategorien verfügbar
- Icons und Farben für bessere Erkennbarkeit
- Häufigste Kategorien werden priorisiert angezeigt
- Deutsche Kategorienamen

#### Story 2.2: Eigene Kategorien erstellen
**Als** Benutzer  
**möchte ich** eigene Kategorien anlegen  
**damit** ich meine spezifischen Ausgaben besser strukturieren kann.

**Akzeptanzkriterien**:
- Kategoriename frei wählbar (max. 30 Zeichen)
- Auswahl aus Icon-Set möglich
- Farbauswahl für visuelle Unterscheidung
- Eigene Kategorien erscheinen in Auswahllisten

#### Story 2.3: Automatische Kategorisierung
**Als** Benutzer  
**möchte ich** dass häufige Ausgaben automatisch kategorisiert werden  
**damit** ich Zeit beim Erfassen spare.

**Akzeptanzkriterien**:
- System lernt aus vergangenen Zuordnungen
- Ähnliche Beschreibungen werden erkannt
- Automatische Vorschläge mit Konfidenz-Anzeige
- Möglichkeit zur Korrektur und Neu-Training

### Epic 3: Wiederkehrende Transaktionen

#### Story 3.1: Gehalt automatisch erfassen
**Als** Angestellter  
**möchte ich** mein monatliches Gehalt automatisch erfassen lassen  
**damit** ich es nicht jeden Monat manuell eintragen muss.

**Akzeptanzkriterien**:
- Monatliche Wiederholung mit festem Datum
- Anpassung bei Gehaltsänderungen möglich
- Automatische Erstellung mit Bestätigung
- Sichtbar in separater Wiederholungs-Liste

#### Story 3.2: Regelmäßige Ausgaben verwalten
**Als** Benutzer  
**möchte ich** regelmäßige Ausgaben wie Miete und Versicherung automatisieren  
**damit** ich alle festen Kosten im Blick behalte.

**Akzeptanzkriterien**:
- Flexible Wiederholungsmuster (täglich bis jährlich)
- Unterschiedliche Beträge pro Wiederholung möglich
- Pausieren und Wiederaktivieren von Wiederholungen
- Übersicht aller aktiven und pausierten Wiederholungen

#### Story 3.3: Variable wiederkehrende Kosten
**Als** Benutzer  
**möchte ich** wiederkehrende Kosten mit variablen Beträgen erfassen  
**damit** auch unregelmäßige aber planbare Ausgaben automatisiert werden.

**Akzeptanzkriterien**:
- Wiederholung mit Durchschnittsbetrag als Vorschlag
- Manuelle Anpassung bei jeder Erstellung möglich
- Historische Beträge werden zur Schätzung herangezogen
- Benachrichtigung vor automatischer Erstellung

### Epic 4: Receipt Scanning

#### Story 4.1: Beleg fotografieren und auswerten
**Als** Benutzer  
**möchte ich** einen Kassenbon fotografieren und die Daten automatisch extrahieren lassen  
**damit** ich schneller und fehlerfreier Transaktionen erfassen kann.

**Akzeptanzkriterien**:
- Kamera-Interface mit Beleg-Rahmen
- Automatische Erkennung von Betrag, Datum, Merchant
- Confidence-Score für erkannte Daten
- Manuell korrigierbar bei Fehlern

#### Story 4.2: Merchant-basierte Kategorisierung
**Als** Benutzer  
**möchte ich** dass Ausgaben basierend auf dem Geschäft automatisch kategorisiert werden  
**damit** wiederkehrende Einkäufe automatisch richtig zugeordnet werden.

**Akzeptanzkriterien**:
- Erkennung von Geschäftsnamen auf Belegen
- Mapping bekannter Merchants zu Kategorien
- Lernfähiges System für neue Merchants
- Manuelle Überschreibung möglich

#### Story 4.3: Belegarchiv
**Als** Benutzer  
**möchte ich** die Original-Belege zu meinen Transaktionen speichern  
**damit** ich bei Bedarf Nachweise vorweisen kann.

**Akzeptanzkriterien**:
- Beleg-Bild wird komprimiert gespeichert
- Verknüpfung zwischen Transaktion und Beleg
- Beleg in Transaktionsdetails anzeigbar
- Optional: OCR-Text zusätzlich speichern

### Epic 5: Berichte und Analytics

#### Story 5.1: Monatsübersicht
**Als** Benutzer  
**möchte ich** eine Übersicht über meine Einnahmen und Ausgaben des aktuellen Monats  
**damit** ich sehe, wie ich finanziell im Monat stehe.

**Akzeptanzkriterien**:
- Gegenüberstellung Einnahmen vs. Ausgaben
- Saldo (verfügbares Geld) prominent angezeigt
- Top-Ausgabenkategorien als Balkendiagramm
- Vergleich mit Vormonat

#### Story 5.2: Kategorien-Aufschlüsselung
**Als** Benutzer  
**möchte ich** sehen, wie viel ich in welcher Kategorie ausgegeben habe  
**damit** ich Sparpotentiale identifizieren kann.

**Akzeptanzkriterien**:
- Kreisdiagramm mit Kategorien-Anteilen
- Absolute Beträge und Prozentanteile
- Detail-Drill-Down in Kategorien
- Export als Grafik oder Tabelle

#### Story 5.3: Trend-Analyse
**Als** Benutzer  
**möchte ich** Trends in meinen Ausgaben über mehrere Monate erkennen  
**damit** ich mein Ausgabeverhalten besser verstehe.

**Akzeptanzkriterien**:
- Liniendiagramm für Ausgaben-Trends
- Auswahl verschiedener Zeiträume (3/6/12 Monate)
- Trend-Indikatoren (steigend/fallend/stabil)
- Saisonale Muster erkennbar

### Epic 6: Sicherheit und Datenschutz

#### Story 6.1: App-Zugang schützen
**Als** sicherheitsbewusster Benutzer  
**möchte ich** meine Finanzdaten vor unbefugtem Zugriff schützen  
**damit** meine privaten Daten sicher bleiben.

**Akzeptanzkriterien**:
- PIN oder biometrische Authentifizierung
- Automatische Sperre nach Inaktivität
- Fehlversuch-Begrenzung mit temporärer Sperre
- Sicherer Fallback bei biometrischen Problemen

#### Story 6.2: Lokale Datenhaltung
**Als** datenschutzbewusster Benutzer  
**möchte ich** dass alle meine Daten nur lokal gespeichert werden  
**damit** keine sensiblen Informationen das Gerät verlassen.

**Akzeptanzkriterien**:
- Keine Internetverbindung für Kernfunktionen erforderlich
- Transparente Darstellung der Datenspeicherung
- Verschlüsselte lokale Datenbank
- Keine Telemetrie oder Tracking

#### Story 6.3: Sichere Datensicherung
**Als** Benutzer  
**möchte ich** meine Daten sicher exportieren können  
**damit** ich bei Geräteverlust nicht alle Finanzdaten verliere.

**Akzeptanzkriterien**:
- Verschlüsselter Export aller Daten
- Passwort-geschützte Backup-Dateien
- Vollständiger Import auf neuem Gerät möglich
- Validierung der Backup-Integrität

### Epic 7: Benutzerfreundlichkeit

#### Story 7.1: Intuitive Navigation
**Als** Benutzer  
**möchte ich** mich einfach und schnell in der App zurechtfinden  
**damit** ich ohne Einarbeitungszeit produktiv arbeiten kann.

**Akzeptanzkriterien**:
- Hauptfunktionen mit maximal 2 Taps erreichbar
- Konsistente Navigation durch die App
- Breadcrumbs bei tieferen Ebenen
- "Zurück"-Button immer verfügbar

#### Story 7.2: Schnelleingabe
**Als** vielbeschäftigter Benutzer  
**möchte ich** Transaktionen so schnell wie möglich erfassen  
**damit** ich auch in stressigen Situationen meine Ausgaben dokumentiere.

**Akzeptanzkriterien**:
- Häufigste Aktionen als Shortcuts verfügbar
- Intelligente Vorschläge basierend auf Kontext
- Spracheingabe für Beschreibungen (optional)
- Gestensteuerung für wiederkehrende Aktionen

#### Story 7.3: Mehrsprachigkeit
**Als** internationaler Benutzer  
**möchte ich** die App in meiner bevorzugten Sprache nutzen  
**damit** ich alle Funktionen vollständig verstehe.

**Akzeptanzkriterien**:
- Deutsche und englische Lokalisierung
- Dynamischer Sprachwechsel ohne App-Neustart
- Lokalisierte Währungs- und Datumsformate
- Kulturspezifische Kategorien-Vorschläge

## Akzeptanzkriterien (Global)

### Definition of Ready (DoR)
Eine User Story gilt als bereit für die Implementierung, wenn:
1. Akzeptanzkriterien sind spezifisch und testbar definiert
2. UI/UX Mockups sind verfügbar (falls erforderlich)
3. Technische Dependencies sind geklärt
4. Story ist vom Product Owner priorisiert
5. Aufwandsschätzung liegt vor

### Definition of Done (DoD)
Eine User Story gilt als abgeschlossen, wenn:
1. Alle Akzeptanzkriterien sind erfüllt und getestet
2. Code Review ist durchgeführt
3. Unit Tests sind implementiert (>90% Coverage)
4. Integration Tests bestehen
5. UI entspricht den Design-Spezifikationen
6. Performance-Anforderungen werden erfüllt
7. Dokumentation ist aktualisiert
8. Security Review ist bestanden (für sicherheitskritische Stories)

### Priorisierung nach MoSCoW

#### Must Have (Release 1.0)
- Epic 1: Grundlegende Transaktionsverwaltung (komplett)
- Epic 2: Intelligente Kategorisierung (Stories 2.1, 2.2)
- Epic 5: Berichte und Analytics (Stories 5.1, 5.2)
- Epic 6: Sicherheit und Datenschutz (komplett)
- Epic 7: Benutzerfreundlichkeit (Stories 7.1, 7.2)

#### Should Have (Release 1.1)
- Epic 2: Intelligente Kategorisierung (Story 2.3)
- Epic 3: Wiederkehrende Transaktionen (komplett)
- Epic 4: Receipt Scanning (Stories 4.1, 4.2)
- Epic 5: Berichte und Analytics (Story 5.3)

#### Could Have (Release 1.2+)
- Epic 4: Receipt Scanning (Story 4.3)
- Epic 7: Benutzerfreundlichkeit (Story 7.3)
- Erweiterte Reporting-Features
- Budgetplanung und -überwachung

#### Won't Have (Current Scope)
- Cloud-Synchronisation
- Multi-User Features
- Banking-API Integration
- Investment Portfolio Tracking
- Web-Interface
