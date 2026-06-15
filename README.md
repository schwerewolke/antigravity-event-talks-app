# BigQuery Release Hub 🚀

Ein moderner, responsiver Web-Dashboard-Tracker, entwickelt mit **Python Flask** (Backend) und plain vanilla **HTML, CSS und JavaScript** (Frontend). Die Anwendung lädt automatisch den offiziellen RSS-Atom-Feed der Google Cloud BigQuery Release Notes, bereitet die Einträge strukturiert auf und bietet eine integrierte Funktion zum Teilen einzelner Updates auf X (ehemals Twitter).

## Features

- **Live-Synchronisierung:** Lädt Release-Einträge direkt aus dem Google Cloud RSS-Feed.
- **In-Memory Caching:** Schont externe Server durch einen integrierten 1-Stunden-Cache im Backend.
- **Manueller Force-Refresh:** Aktualisiere die Daten jederzeit direkt aus der Benutzeroberfläche über einen Refresh-Button mit animiertem Lade-Spinner.
- **Intelligente Aufteilung:** Splittet kombinierte Tages-Updates mittels HTML-Parsing in atomare Einzelmeldungen auf.
- **Visuelle Kategorisierung:** Jedes Update erhält je nach Typ farblich kodierte Badges (`Feature` 🟢, `Breaking Change` 🔴, `Change` 🔵, `Announcement` 🟣, `Issue` 🟡).
- **Such- & Filter-Dashboard:** 
  - Echtzeit-Volltextsuche in Titeln, Daten und Inhalten.
  - Filterung nach einzelnen Kategorien.
  - Sortierfunktion (Neueste zuerst / Älteste zuerst).
- **Interaktiver Tweet-Composer:**
  - Wähle ein beliebiges Update aus, um die Composer-Seitenleiste zu öffnen.
  - Wähle aus verschiedenen Vorlagen (Professional, Excited, Minimalist).
  - Automatische Längenberechnung (inklusive URL-Kompensation) zur Einhaltung des 280-Zeichen-Limits.
  - Direktes Posten auf X via Web-Intent oder Kopieren in die Zwischenablage.

---

## Projektstruktur

- [app.py](file:///Users/stefan/src/agy-cli-projects/bg-release-notes/app.py) – Flask-Webserver, Cache-Verwaltung, XML-Parser und API-Endpunkte.
- [templates/index.html](file:///Users/stefan/src/agy-cli-projects/bg-release-notes/templates/index.html) – Das visuelle HTML-Layout des Dashboards samt Seitenleisten.
- [static/css/styles.css](file:///Users/stefan/src/agy-cli-projects/bg-release-notes/static/css/styles.css) – Die Stylesheets (Dark-Mode-Designsystem, Animationen, responsive Layouts).
- [static/js/app.js](file:///Users/stefan/src/agy-cli-projects/bg-release-notes/static/js/app.js) – Clientseitige Logik (Fuzzy-Suche, Rendering, Composer-Steuerung und Twitter-Integration).
- [.gitignore](file:///Users/stefan/src/agy-cli-projects/bg-release-notes/.gitignore) – Ignoriert Python-Caches, virtuelle Umgebungen (`.venv`) und Systemdateien.

---

## Technische Voraussetzungen

- **Python** (Version 3.10 oder neuer empfohlen)
- **pip** (Python Paketmanager)

---

## Installation und Start

### 1. Repository klonen oder in das Verzeichnis wechseln
Stelle sicher, dass du dich im Projektordner befindest:
```bash
cd bg-release-notes
```

### 2. Virtuelle Umgebung einrichten (empfohlen)
Erstelle und aktiviere eine virtuelle Umgebung, um Abhängigkeiten isoliert zu installieren:
```bash
# Virtuelle Umgebung erstellen
python3 -m venv .venv

# Aktivieren (macOS/Linux)
source .venv/bin/activate

# Aktivieren (Windows cmd)
.venv\Scripts\activate.bat

# Aktivieren (Windows PowerShell)
.venv\Scripts\Activate.ps1
```

### 3. Abhängigkeiten installieren
Installiere die benötigten Python-Bibliotheken:
```bash
pip install flask requests beautifulsoup4
```

### 4. Flask-Server starten
Starte das Backend mit:
```bash
python3 app.py
```

Das Terminal zeigt dir an, dass der Server läuft:
```text
 * Serving Flask app 'app'
 * Running on http://127.0.0.1:5001
```

### 5. Im Browser öffnen
Navigiere in deinem Webbrowser zu:
👉 **[http://127.0.0.1:5001](http://127.0.0.1:5001)**

*(Hinweis: Die Anwendung läuft auf Port `5001`, um Konflikte mit dem macOS-eigenen AirPlay-Empfänger zu vermeiden, welcher standardmäßig Port `5000` belegt).*

---

## API-Referenz

### `GET /`
Rendert und liefert das Frontend-Dashboard.

### `GET /api/notes`
Liefert die verarbeiteten Release Notes als JSON-Struktur zurück.
- **Parameter**: `refresh=true` (optional) – Erzwingt das Umgehen des lokalen Cache und lädt die Daten live von Google neu.
- **Antwortbeispiel (Erfolgreich)**:
  ```json
  {
    "title": "BigQuery - Release notes",
    "fetched_at": 1781561220.0,
    "entries": [
      {
        "id": "tag:google.com,2016:...",
        "date": "June 15, 2026",
        "link": "https://docs.cloud.google.com/...",
        "updates": [
          {
            "type": "Feature",
            "html": "<p>Use Gemini Cloud Assist...</p>",
            "text": "Use Gemini Cloud Assist..."
          }
        ]
      }
    ]
  }
  ```
