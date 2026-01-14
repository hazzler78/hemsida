# D1 Providers Setup - Temporär lagring för leverantörer

Denna guide beskriver hur du sätter upp Cloudflare D1-databasen som temporär lagring för leverantörer medan Supabase-databasen är full.

## Översikt

Eftersom Supabase-databasen är full har vi implementerat en temporär lösning där leverantörer lagras i Cloudflare D1 istället. När ni har uppgraderat Supabase kan ni migrera tillbaka data.

## Steg 1: Skapa tabellen i D1

Kör följande kommando för att skapa `page_providers` tabellen i D1:

```bash
# Lokal utveckling
wrangler d1 execute elchef-tracking --local --file=./d1-schema.sql

# Produktion (efter att du har konfigurerat i Cloudflare Dashboard)
wrangler d1 execute elchef-tracking --remote --file=./d1-schema.sql
```

## Steg 2: Migrera befintliga leverantörer från Supabase till D1

Om du har befintliga leverantörer i Supabase som du vill migrera till D1:

### 2.1 Exportera från Supabase

1. Gå till Supabase Dashboard → SQL Editor
2. Kör följande SQL för att exportera leverantörer:

```sql
SELECT 
  id,
  name,
  type,
  logo_url,
  description,
  url,
  is_recommended,
  display_order,
  active,
  EXTRACT(EPOCH FROM created_at)::bigint as created_at_unix,
  EXTRACT(EPOCH FROM updated_at)::bigint as updated_at_unix
FROM page_providers
ORDER BY type, display_order;
```

3. Kopiera resultatet (JSON-format eller CSV)

### 2.2 Importera till D1

Skapa en temporär SQL-fil med INSERT-statements:

```sql
-- Exempel (ersätt med dina faktiska värden)
INSERT INTO page_providers 
  (name, type, logo_url, description, url, is_recommended, display_order, active, created_at, updated_at)
VALUES
  ('Cheap Energy', 'rorligt', '/cheap-logo.png', 'Beskrivning...', 'https://...', 1, 1, 1, 1704067200, 1704067200),
  ('Svekraft', 'rorligt', '/svekraft-logo.png', 'Beskrivning...', 'https://...', 0, 2, 1, 1704067200, 1704067200);
-- Lägg till fler rader...
```

Kör sedan:

```bash
wrangler d1 execute elchef-tracking --remote --file=./migrate-providers.sql
```

**Alternativt:** Använd admin-sidan på `/admin/providers` för att lägga till leverantörer manuellt.

## Steg 3: Verifiera att det fungerar

1. Gå till `/admin/providers` och logga in
2. Kontrollera att leverantörer visas korrekt
3. Testa att lägga till en ny leverantör
4. Besök `/rorligt-avtal` och `/fastpris-avtal` för att verifiera att leverantörer visas på frontend-sidorna

## Steg 4: Fråga leverantörer från D1

För att se alla leverantörer i D1:

```bash
# Lokal
wrangler d1 execute elchef-tracking --local --command="SELECT * FROM page_providers ORDER BY type, display_order"

# Remote
wrangler d1 execute elchef-tracking --remote --command="SELECT * FROM page_providers ORDER BY type, display_order"
```

## Migrera tillbaka till Supabase (när ni har uppgraderat)

När ni har uppgraderat Supabase och har mer utrymme:

1. Exportera leverantörer från D1:

```bash
wrangler d1 execute elchef-tracking --remote --command="SELECT * FROM page_providers ORDER BY type, display_order" --json > providers-export.json
```

2. Importera tillbaka till Supabase via admin-sidan eller direkt SQL

3. Uppdatera koden för att använda Supabase igen (reversera ändringarna i denna implementation)

## API Endpoints

Leverantörer kan nu hanteras via följande API-endpoints:

- `GET /api/providers?type=rorligt&active=true` - Hämta leverantörer
- `POST /api/providers` - Skapa ny leverantör
- `PUT /api/providers` - Uppdatera leverantör
- `DELETE /api/providers?id=123` - Radera leverantör

## Noteringar

- D1 är en SQLite-databas, så vissa PostgreSQL-funktioner fungerar inte
- Boolean-värden lagras som INTEGER (0 eller 1) i D1
- Timestamps lagras som Unix timestamps (sekunder sedan epoch)
- Tabellen `page_providers` i D1 har samma struktur som Supabase-versionen
