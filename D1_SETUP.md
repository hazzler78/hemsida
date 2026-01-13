# D1 Database Setup för Robinhood Tracking

Denna guide beskriver hur du sätter upp Cloudflare D1-databasen för att spåra klick på `/robinhood`-länken.

## Steg 1: Skapa D1-databasen

Kör följande kommando för att skapa D1-databasen:

```bash
wrangler d1 create elchef-tracking
```

Detta kommer att ge dig ett `database_id`. Kopiera detta ID (det ser ut som: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`).

**Exempel på output:**
```
✅ Successfully created DB 'elchef-tracking'!
Created your database using D1's new storage backend. The new storage backend is not yet recommended for production workloads, but backs up your data via snapshots to R2.

[[d1_databases]]
binding = "DB"
database_name = "elchef-tracking"
database_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

## Steg 2: Uppdatera wrangler.toml

Öppna `wrangler.toml` och uppdatera `database_id` med det ID du fick från steg 1:

```toml
[[d1_databases]]
binding = "DB"
database_name = "elchef-tracking"
database_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"  # Ersätt med ditt faktiska ID
```

## Steg 3: Skapa tabellen (lokal utveckling)

För lokal utveckling, kör SQL-schemat:

```bash
# Lokal databas
wrangler d1 execute elchef-tracking --local --file=./d1-schema.sql

# Remote databas (efter att du har konfigurerat i Cloudflare Dashboard)
wrangler d1 execute elchef-tracking --remote --file=./d1-schema.sql
```

Eller kör SQL-kommandot manuellt:

```sql
CREATE TABLE IF NOT EXISTS robinhood_clicks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_agent TEXT,
  referer TEXT,
  ip_address TEXT,
  session_id TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_robinhood_clicks_created_at ON robinhood_clicks(created_at);
CREATE INDEX IF NOT EXISTS idx_robinhood_clicks_session_id ON robinhood_clicks(session_id);
```

## Steg 4: Konfigurera i Cloudflare Pages Dashboard

**VIKTIGT:** För Cloudflare Pages måste du konfigurera D1 i Dashboard, inte bara i wrangler.toml.

1. Gå till [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Välj ditt konto
3. Gå till **Workers & Pages** → **D1**
4. Kontrollera att `elchef-tracking` finns i listan (skapad i steg 1)
5. Gå till ditt **Pages-projekt** (elchef-pages)
6. Gå till **Settings** → **Functions**
7. Scrolla ner till **D1 Database bindings**
8. Klicka på **Add binding**
9. Fyll i:
   - **Variable name**: `DB`
   - **D1 Database**: Välj `elchef-tracking` från dropdown
10. Klicka på **Save**

## Steg 5: Skapa tabellen i produktion

Efter att du har konfigurerat D1 i Dashboard, skapa tabellen i remote-databasen:

```bash
wrangler d1 execute elchef-tracking --remote --file=./d1-schema.sql
```

## Steg 6: Testa lokalt (valfritt)

För att testa lokalt med D1:

```bash
# Skapa tabellen i lokal D1-databas
wrangler d1 execute elchef-tracking --local --file=./d1-schema.sql

# Kör preview med lokal D1
npm run cf:preview
```

## Steg 7: Verifiera att det fungerar

1. Besök `http://localhost:3000/robinhood` (eller din produktions-URL)
2. Du ska omdirigeras till startsidan
3. Kontrollera att klicket sparades i D1:

```bash
# Hämta alla klick
wrangler d1 execute elchef-tracking --command="SELECT * FROM robinhood_clicks ORDER BY created_at DESC LIMIT 10"
```

## Frågor klick i D1

För att se alla klick:

```bash
# Lokal
wrangler d1 execute elchef-tracking --local --command="SELECT COUNT(*) as total_clicks FROM robinhood_clicks"

# Remote
wrangler d1 execute elchef-tracking --remote --command="SELECT COUNT(*) as total_clicks FROM robinhood_clicks"
```

För att se klick per dag:

```bash
# Lokal
wrangler d1 execute elchef-tracking --local --command="SELECT date(datetime(created_at, 'unixepoch')) as date, COUNT(*) as clicks FROM robinhood_clicks GROUP BY date ORDER BY date DESC"

# Remote
wrangler d1 execute elchef-tracking --remote --command="SELECT date(datetime(created_at, 'unixepoch')) as date, COUNT(*) as clicks FROM robinhood_clicks GROUP BY date ORDER BY date DESC"
```

## Admin-sida (framtida utveckling)

Du kan skapa en admin-sida för att visa klick-statistik genom att skapa en API-route som läser från D1 och visar resultatet.
