# Chemie-Rechner V2

Statische Website für GitHub Pages. Es gibt keinen Server, keine Datenbank und keinen Build-Schritt.

## Dateien

- `index.html`: Seitenstruktur
- `assets/css/style.css`: Dark-Mode-Design
- `assets/js/data/catalog.js`: Rezepte, Preise und Craft-Einstellungen
- `assets/js/core/calculator.js`: reine Berechnungslogik
- `assets/js/ui/render.js`: Ausgabe im HTML
- `assets/js/app.js`: Events, Local Storage und Verknüpfung der Module
- `tests/calculator.test.mjs`: Tests für die Craft-Berechnung

## Craft-Zeit konfigurieren

Jedes Rezept hat einen eigenen Block:

```js
crafting: {
  outputPerCraft: 3,
  secondsPerProcess: 15,
  craftsPerProcess: 5,
},
```

Bedeutung:

- `outputPerCraft`: Endprodukte pro einzelner Herstellung
- `secondsPerProcess`: Dauer eines Zeitblocks
- `craftsPerProcess`: Wie viele Herstellungen gleichzeitig in diesen Zeitblock passen

Beispiel Adrenalin-Spritze:

- 1 bis 5 Herstellungen: 15 Sekunden
- 6 bis 10 Herstellungen: 30 Sekunden
- 11 bis 15 Herstellungen: 45 Sekunden

Formel:

```text
Prozesse = aufrunden(Herstellungen / craftsPerProcess)
Zeit = Prozesse × secondsPerProcess
```

## Lokal starten

ES-Module sollten über einen kleinen lokalen Webserver geöffnet werden:

```bash
python -m http.server 8000
```

Danach `http://localhost:8000` öffnen.

## Tests

Node.js muss installiert sein:

```bash
npm test
```

## GitHub Pages

Die Dateien direkt in den Branch `main` legen. Unter **Settings > Pages** als Quelle `Deploy from a branch`, Branch `main` und Ordner `/ (root)` auswählen.
