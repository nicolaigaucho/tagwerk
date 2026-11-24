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
| `sw.js` | Service Worker: Offline-Cache und Push-Anzeige. **Bei jeder Änderung an App-Dateien die Version überall hochzählen:** `CACHE` in `sw.js` (`tagwerk-vN`), die `?v=N` an allen Dateien in `index.html` und `window.TAGWERK_VERSION` (wird in den Einstellungen angezeigt) |
| `scripts/daily.mjs` + `.github/workflows/daily.yml` | Täglicher Push gegen 10 Uhr Berlin (GitHub Action, zwei Crons, Skript prüft Uhrzeit und sendet einmal pro Tag) |
| `supabase/setup.sql` | Einmaliges Datenbank-Setup |
| `supabase/functions/food-photo/index.ts` + `.github/workflows/functions.yml` | Foto-Erkennung: Edge Function ruft Claude Opus 5.5 (Bild + Lebensmittel-Liste, strukturierte JSON-Antwort, `fallbacks: "default"`). Wird per GitHub Action mit der Supabase CLI veröffentlicht |
| `supabase/functions/garmin-sync/index.ts` | Garmin Connect Personal API: tauscht Secret `GARMIN_API_KEY` gegen 24-h-Token (`POST personal.connectapi.garmin.com/personalapitoken-service/personal-api/personal-api-key/token`, Header `Authorization: ApiKey …`, Antwort = JWT als Text), liest `/activitylist-service/activities/search/activities` und schreibt Läufe als Nutzer (RLS) |

## Mehrere Konten
- Weitere Personen registrieren sich über die Login-Maske und haben über RLS komplett eigene Daten. Der Push (`daily.mjs`) läuft für alle Konten.
- **Hauptkonto** = Konto angelegt vor `2026-11-24T00:00:00Z` (`OWNER_BEFORE` in `food-photo`, gleiche Grenze in `garmin-sync` und `TW.isMain()` in `store.js`).
- **Garmin** nur für das Hauptkonto (Funktion antwortet sonst `not_owner`, App blendet Karte und Auto-Abruf aus).
- **KI-Limit:** weitere Konten 50 Anfragen pro Monat (`MONTH_LIMIT`), gezählt in Dokument `aiusage` (`{month, n, limit}`) nach jedem Claude-Aufruf. Fehler `limit` zeigt die App als Toast, Rest steht unter „Was hast du gegessen?“ und in den Einstellungen (`aiLeft`).
- **Einrichtung beim ersten Start** (`needsSetup`, `vSetup`, `setupNext`, `setupSave`): erscheint, wenn nach dem Laden vom Server (`TW.loaded()`) weder `settings` noch `plan`, Läufe, Krafteinheiten oder Lebensmittel existieren. 4 Schritte: Körperdaten und Ziel, Tagesziele (Mifflin-St Jeor × Aktivität, Aufbau +300, Abnehmen −400 kcal, Eiweiß 2 g/kg, Fett 0,9 g/kg, Wasser 35 ml/kg), Wochenplan mit Laufstrecken, Schwerpunkt je Krafttag (leere Vorlagen `Kraft A · …`). Speichert `settings` (mit `body`, `onboarded`), `plan` und ein erstes Gewicht. Keine Voreinstellungen für Lebensmittel, Gerichte oder Haushalt.
- Doc-Snapshots in `store.js` feuern auch für fehlende Dokumente einmal (`exists: false`).

## Daten
- Eine Tabelle `docs (user_id, path, data jsonb)`, Zugriff per RLS nur auf eigene Zeilen, Realtime aktiv.
- Pfade sind relativ zum Nutzer: Einzeldokumente `plan`, `settings`, `autoshop`, `shopstats`, `pushstate`; Sammlungen `<name>/items/<id>` für `shop`, `lifts`, `runs`, `chores`, `foods`, `dishes`, `meals` (ID = Datum), `days` (ID = Datum, Ernährungs-Tagebuch), `trips`, `fuel`, `pantry`, `recipes`, `pushsubs`.
- Import-Format für größere Inhaltsänderungen: `{"replace": ["dishes/items/"], "docs": [{"path": "dishes/items/g16", "data": {...}}]}`. Nutzer importiert über Einstellungen › Daten importieren. `replace` (optional, Präfixe mit `/` am Ende) löscht diese Sammlungen vorher, danach Upsert aller `docs`. Ein Eintrag mit `"merge": true` wird tief in das bestehende Dokument gemischt statt es zu ersetzen (z. B. für `plan`).
- **Lebensmittel** (`foods`): Nährwerte pro 100 g, `portion` (g), `plabel` (Anzeige, z. B. „1 Ei“), optional `unit` (Stück, Scheiben, Packung) für Mengenangaben, `order`. Der Nutzer isst nur aus seinem festen Lebensmittel-Set (Eier, Hackfleisch, Hähnchenbrust, Aufschnitt, Frischkäse, Nudeln, Reis, Pommes, Brot, TK-Pizza, Paprika, Karotten, Lasagne, Toast, Toastkäse, Salat, Gurke).
- **Gerichte** (`dishes`): `parts: [{food, g}]` aus diesen Lebensmitteln, daraus berechnet `kcal/p/c/f` und `ingr` („Name Menge“, für Einkaufsliste). Hauptmahlzeit etwa 850 bis 950 kcal.
- Aus der Cloud-Sitzung ist Supabase per Netzwerk nicht erreichbar: Inhalte also als Import-Datei liefern, nicht direkt schreiben.

## Fachlogik (in `app.js` und für den Push in `daily.mjs` doppelt, beide anpassen)
- **Lauf-Rotation:** `plan.rotation` (Standard 5, 8, 10 km); nächste Distanz folgt auf den Wert, der dem letzten Lauf am nächsten liegt.
- **Wäsche-Rotation:** `chores` mit `kind: waesche`, `every > 0`, sortiert nach `order`; nächste = Nachfolger der zuletzt gewaschenen (`last`, bei Gleichstand `doneAt`). `every: 0` heißt bei Bedarf.
- **Gerichte-Rotation:** `dishes` nach `order`; Gericht eines Tages = ab dem letzten `meals`-Eintrag (fest gewählt oder `anchor`) fortlaufend weitergezählt. Eine Hauptmahlzeit pro Tag.
- **Auto-Einkauf:** alle 2 Tage ab `autoshop.anchor` (2026-11-04) Zutaten für heute und morgen, IDs `auto-<fenster>-<slug>`, Vorrat wird abgezogen.

## Körperdaten und Ziele (InBody 03.11.2026)
- 194 cm, 27 Jahre, 87,5 kg, 8,7 % Körperfett, Skelettmuskulatur 46,3 kg (seit 08/2026 −1,3 kg), fettfreie Masse 79,9 kg, Grundumsatz etwa 2.100 kcal.
- Ziel: **Muskelaufbau**. Tagesziele 3.600 kcal, 175 g Eiweiß, 500 g KH, 100 g Fett, 3,5 l Wasser.
- Training: Oberkörper 3x (A Brust/Trizeps, B Rücken/Bizeps, C Schultern/Arme), bewusst ohne Beintraining (Wunsch des Nutzers). Läufe 3x mit Rotation 5, 6, 8 km.
- **Prognose / doppelte Progression** (`progTarget`, `liftRows`): Vorlagen in `plan.templates[titel]` mit `sets`, `min`, `max` (Wdh.-Bereich), `step` (kg), `hint`. Grundlage ist die letzte Einheit **desselben Plans** (Ersatz: irgendein Plan), je Satz aus `log` (Nicht-Drop-Sätze beim Höchstgewicht). Ergebnis `targets` (Wdh. je Satz), `kg`, `up`, `note`. Regeln in dieser Reihenfolge:
  1. 3x in Folge kein Fortschritt (gleiches kg, Summe Wdh. nicht gestiegen): `deload`, etwa −10 % auf `step` gerundet
  2. Ø Wdh. unter `min`: `down`, −`step`
  3. alle Sätze ≥ `max`: `kg`, +`step` und alle auf `min`
  4. 2x kein Fortschritt: `hold`, Ziel der vorletzten Einheit noch einmal
  5. sonst `reps`: jeder Satz +1 (begrenzt auf `max`)
  Anzeige: `progPill`, `tgtText`, `prevText`, `prevBox`. Vorschau auf der Kraft-Übersicht (Plan-Zeile antippen, `plan-prev`) und nach dem Abschließen (`shNext`). Im Live-Training startet der Stepper je Satz mit `targets[k]`. „Geschafft“ speichert die Ziele direkt (inkl. `log`).

## Kraft-Reiter und Live-Training
- **Übersicht** (`vStrength`): Kennzahlen (Woche, Volumen, Rekorde 30 Tage, Ø Dauer), die Trainingspläne aus `plan.templates` mit „▶ Start“, Übungsliste mit Trend (Tipp öffnet `shExercise`: Verlauf, Bestwert, letzte Einheiten mit allen Sätzen), Volumen-Diagramm, Verlauf.
- **Live-Training** (`woStart`, `vWorkout`, `woFinish`): laufendes Training im Dokument `workout` (übersteht App-Neustart), je Übung Ziel aus `liftRows` und Satz-Eintrag mit Steppern, Pausen- und Gesamtuhr (`woTicker`). Beim Abschließen wird eine Einheit in `lifts` gespeichert, jede Übung mit `log: [{reps, kg, t}]` sowie `sets`/`reps`/`kg` als Zusammenfassung (Höchstgewicht, geringste Wdh. bei diesem Gewicht, damit die Progression nur bei geschafften Sätzen steigert), dazu `start`, `end`, `dur`.
- **Dropsätze** (`wo-drop`, nur im Live-Training, sobald die Übung einen Satz hat): Gewicht ≈ 80 % des letzten Satzes, gerundet auf `step`. Geloggt als `{reps, kg, t, drop: true}`. Zählen nicht als Satz (`workSets`) und nicht für die Progression (Zusammenfassung in `woFinish` nur aus Nicht-Drop-Sätzen), fließen aber ins Volumen ein. Anzeige mit ↓.
- **Plan-Editor** (`shPlanEdit`, `shExPick`, `shExEdit`, `pickExercise`, Katalog `EX_CAT` nach Muskelgruppen): auf der Kraft-Übersicht Plan-Zeile ← wischen = bearbeiten, → = starten. Im Editor je Übung → tauschen, ← entfernen, antippen = Sätze/Wdh.-Bereich/Startgewicht/Schritt, ↑ umsortieren, hinzufügen. Gespeichert in `plan.templates[titel]` (`savePlanTpl`, mit Rückgängig). Im Live-Training → wischen tauscht eine Übung nur für dieses Training.
- `liftRows(titel)` nimmt immer alle Übungen der Vorlage (plus Zusatzübungen der letzten Einheit) und je Übung den letzten Stand aus irgendeiner Einheit. Ausgelassene Übungen verschwinden so nicht.

## Garmin (Forerunner 265)
- Läufe kommen über `garmin-sync` nach `runs/items/g<activityId>` mit `source: 'garmin'`, `km`, `sec` (Garmin `duration`), optional `hr`, `hrMax`, `elev`, `kcal`, `cad`. Bestehende Einträge werden nie überschrieben. Ein Handeintrag am selben Tag mit ±20 % Distanz wird ersetzt.
- Status im Dokument `garminsync` (`last`, `added`, `replaced`, `found`, `keys` = Feldnamen der ersten Aktivität zur Kontrolle). App ruft automatisch auf Heute/Training ab (höchstens alle 15 Min., `garminAuto`), Knopf „Abrufen“ in Läufe (`garminCard`). Ist Garmin verbunden, entfällt dort der Knopf „✓ km gelaufen“.
- Schlüssel erstellt der Nutzer unter connect.garmin.com/app/settings/personalApiToken (max. 1 Jahr gültig), GitHub-Secret `GARMIN_API_KEY`.

## Trainingsanalyse und Gewicht
- Reiter **Training › Analyse** (`vAnalysis`): Planerfüllung der letzten 4 Wochen, Kraftverlauf je Übung (geschätztes 1RM nach Epley, ohne Gewicht: Wdh.), bewegtes Gewicht pro Woche, neue Bestleistungen (`prList`), Lauf-Pace und Bestzeiten je Rotationsdistanz, Körpergewicht mit Wochentrend. Diagramme: `lineChart`, `barChart`.
- **Körpergewicht** in `weights/items/<datum>` (`{date, kg}`), Eintrag über `shWeight` (Analyse, Plus-Menü, Karte auf Heute). Erinnerung, wenn das letzte Wiegen 7 Tage oder länger her ist (`weighDue`), ebenso als Zeile im 10-Uhr-Push (`daily.mjs`).

## Essen-Bereich
- **Baukasten** (`shCombo`): Mahlzeit aus Lebensmitteln per Portionen (½-Schritte) zusammenstellen, als gegessen eintragen oder als Gericht in die Rotation speichern. Gerichte mit `parts` werden ebenfalls im Baukasten bearbeitet.
- **Vorrat**: Vorschläge kommen aus den Lebensmittel-Namen; „Daraus kannst du kochen“ vergleicht `parts` mit dem Vorrat (Namensgleichheit). Einkaufsliste und Vorrat gleichen Namen exakt ab, nicht per Wortanfang.
- KI-Rezepte sind in der eigenständigen Version aus (kein `sample`).
- **Foto-Erkennung** (`pickPhoto`, `analyzeFood`, `shPhotoEdit`, `TW.analyzePhoto`): Foto wird auf max. 1280 px als JPEG verkleinert, an `food-photo` geschickt. Erkannte Komponenten mit `food_id` werden mit den eigenen Nährwerten berechnet, Unbekanntes mit Claudes Schätzung. Eintrag sofort speichern (`photo: true`, `pid`, `items`), Toast mit Rückgängig/Ändern. Kosten trägt der Nutzer über sein API-Guthaben (Pro-Abo, 5 $ Monatslimit): sparsam bleiben, kein Bild doppelt senden.
- **Essen beschreiben** (`typeBox`, `analyzeFood(null, text)`): Freitext wie „2 Leberkäswecken“ geht an dieselbe Funktion (`text` statt `image`). Ergebnis wird als `typed: true` eingetragen und in `aimeals/items/<slug(text)>` gemerkt. Gleicher Text oder Tipp auf „Zuletzt geschätzt“ (`reAddEstimate`) trägt ohne neue API-Anfrage ein.

## Bedienung (möglichst wenige Klicks)
- **Sofort speichern statt Formular:** `quickRun`, `quickLift`, `eatToday`, `choreDone`, `quickFood`, Routen speichern direkt und zeigen `toast(msg, {undo, edit})` mit „Rückgängig“ und „Ändern“. Löschen über `delUndo`. Neue Aktionen nach diesem Muster bauen.
- **Plus-Knopf** (`.fab`, `shQuick`): Schnellmenü mit Kacheln (Wasser, Lauf, Kraft, Gegessen, Fahrt, Tanken), Routen, Lebensmitteln und Einkauf.
- **Wischgesten:** `.item` mit `data-sr` (nach rechts, z. B. erledigt) und `data-sl` (nach links, löschen) plus `data-id` oder `data-v`; optional `data-srl`/`data-sll` als Beschriftung.
- **Reiter:** Essen hat nur Ernährung und Kochplan. Vorrat ist Einkauf › Zuhause, Lebensmittel und Nährwerte liegen in den Einstellungen (`shFoods`).
- **Heute** sortiert die Karten nach Tageszeit, Erledigtes rutscht nach unten. Sonntag und Montag erscheint der Wochenrückblick (`weekreview.last`).
- In der Einkaufsliste bleibt der Bildschirm an (Wake Lock).

## Arbeitsweise
- Änderungen testen: lokal `python3 -m http.server` und mit Playwright und einem Supabase-Stub (`window.supabase.createClient`) prüfen, Breite 390 px.
- Commit auf `main` und pushen, GitHub Pages veröffentlicht automatisch unter https://nicolaigaucho.github.io/tagwerk/
- Keine Geheimnisse ins Repository. Secrets der Actions: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `VAPID_PRIVATE_KEY` (Push) sowie `SUPABASE_ACCESS_TOKEN`, `ANTHROPIC_API_KEY` (Foto-Erkennung), `GARMIN_API_KEY` (Garmin).
