# Tagwerk

Persönlicher Alltagsplaner als Web-App (PWA) für das iPhone: Training, Haushalt, Essen, Einkauf und Auto.

- **App:** statische Seite (GitHub Pages), offline nutzbar
- **Daten:** Supabase (Tabelle `docs`, nur eigene Daten lesbar)
- **Push:** GitHub Action `Tagesüberblick`, täglich gegen 10 Uhr

## Einrichtung
1. `supabase/setup.sql` im Supabase SQL-Editor ausführen
2. In `config.js` Projekt-URL und Publishable Key eintragen
3. GitHub Pages aktivieren (Branch `main`, Ordner `/`)
4. Repository-Secrets: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`
