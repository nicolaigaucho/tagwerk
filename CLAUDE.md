# Tagwerk

Persönlicher Alltagsplaner (PWA) für das iPhone eines einzelnen Nutzers: Training, Haushalt, Essen, Einkauf, Auto.
Sprache der App und der Antworten: **Deutsch**. In Texten keine Gedankenstriche verwenden.

## Aufbau
| Datei | Zweck |
|---|---|
| `index.html` | Seitenrahmen, Login-Maske, Meta-Tags für Home-Bildschirm |
| `app.css` | Komplettes Design (iOS-Stil, nur hell). Die iOS-Regeln stehen am Ende und überschreiben ältere Regeln darüber |
| `js/app.js` | Gesamte App-Logik und Ansichten (Vanilla JS, Rendern per Template-Strings, Aktionen über `data-act`) |
| `js/store.js` | Datenschicht: Supabase, Offline-Cache, Push-Anmeldung, Import. Stellt `window.claude.use('db'|'user'|'downloads')` bereit, damit `app.js` unverändert aus der früheren claude.ai-Version läuft |
| `js/supabase.js` | Supabase-Client 2.45.4 (UMD, eingecheckt, nicht anfassen) |
| `config.js` | Öffentliche Werte: Supabase-URL, Publishable Key, VAPID Public Key |
| `sw.js` | Service Worker: Offline-Cache und Push-Anzeige. **Bei jeder Änderung an App-Dateien `CACHE` hochzählen** (`tagwerk-vN`) |
| `scripts/daily.mjs` + `.github/workflows/daily.yml` | Täglicher Push gegen 10 Uhr Berlin (GitHub Action, zwei Crons, Skript prüft Uhrzeit und sendet einmal pro Tag) |
| `supabase/setup.sql` | Einmaliges Datenbank-Setup |

## Daten
- Eine Tabelle `docs (user_id, path, data jsonb)`, Zugriff per RLS nur auf eigene Zeilen, Realtime aktiv.
- Pfade sind relativ zum Nutzer: Einzeldokumente `plan`, `settings`, `autoshop`, `shopstats`, `pushstate`; Sammlungen `<name>/items/<id>` für `shop`, `lifts`, `runs`, `chores`, `foods`, `dishes`, `meals` (ID = Datum), `days` (ID = Datum, Ernährungs-Tagebuch), `trips`, `fuel`, `pantry`, `recipes`, `pushsubs`.
- Import-Format für größere Inhaltsänderungen: `{"docs": [{"path": "dishes/items/d15", "data": {...}}]}`, Nutzer importiert über Einstellungen › Daten importieren (Upsert).
- Aus der Cloud-Sitzung ist Supabase per Netzwerk nicht erreichbar: Inhalte also als Import-Datei liefern, nicht direkt schreiben.

## Fachlogik (in `app.js` und für den Push in `daily.mjs` doppelt, beide anpassen)
- **Lauf-Rotation:** `plan.rotation` (Standard 5, 8, 10 km); nächste Distanz folgt auf den Wert, der dem letzten Lauf am nächsten liegt.
- **Wäsche-Rotation:** `chores` mit `kind: waesche`, `every > 0`, sortiert nach `order`; nächste = Nachfolger der zuletzt gewaschenen (`last`, bei Gleichstand `doneAt`). `every: 0` heißt bei Bedarf.
- **Gerichte-Rotation:** `dishes` nach `order`; Gericht eines Tages = ab dem letzten `meals`-Eintrag (fest gewählt oder `anchor`) fortlaufend weitergezählt. Eine Hauptmahlzeit pro Tag.
- **Auto-Einkauf:** alle 2 Tage ab `autoshop.anchor` (2026-11-04) Zutaten für heute und morgen, IDs `auto-<fenster>-<slug>`, Vorrat wird abgezogen.

## Arbeitsweise
- Änderungen testen: lokal `python3 -m http.server` und mit Playwright und einem Supabase-Stub (`window.supabase.createClient`) prüfen, Breite 390 px.
- Commit auf `main` und pushen, GitHub Pages veröffentlicht automatisch unter https://nicolaigaucho.github.io/tagwerk/
- Keine Geheimnisse ins Repository. Secrets der Action: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `VAPID_PRIVATE_KEY`.
