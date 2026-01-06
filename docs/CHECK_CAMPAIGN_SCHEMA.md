# Kontrollera ai_campaigns Schema

## Problem
Felet "Could not find the 'validFrom' column of 'ai_campaigns' in the schema cache" indikerar att kolumnnamnet inte matchar mellan koden och databasen.

## Lösningar

### Metod 1: Kontrollera via Supabase Dashboard (Rekommenderat)

1. Gå till [Supabase Dashboard](https://app.supabase.com)
2. Välj ditt projekt
3. Gå till **Table Editor** i vänstermenyn
4. Välj tabellen `ai_campaigns`
5. Kontrollera kolumnnamnen - leta efter kolumner som heter:
   - `validFrom` (camelCase)
   - `valid_from` (snake_case)
   - `validTo` (camelCase)
   - `valid_to` (snake_case)

### Metod 2: Kontrollera via SQL Editor

1. Gå till **SQL Editor** i Supabase Dashboard
2. Kör följande query:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ai_campaigns' 
AND table_schema = 'public'
ORDER BY ordinal_position;
```

Detta visar alla kolumner i tabellen med deras exakta namn.

### Metod 3: Använd API-endpointen

Jag har skapat en API-endpoint som kontrollerar schemat automatiskt:

1. Starta utvecklingsservern: `npm run dev`
2. Öppna i webbläsaren: `http://localhost:3000/api/check-schema`
3. Detta visar alla kolumnnamn som faktiskt finns i databasen

### Metod 4: Kontrollera via Browser Console

1. Öppna admin-sidan: `/admin/knowledge`
2. Öppna Developer Tools (F12)
3. Gå till Console-fliken
4. Loggarna visar kolumnnamnen när kampanjer hämtas

## Åtgärder baserat på resultat

### Om kolumnerna heter `valid_from` och `valid_to` (snake_case):
Koden är redan uppdaterad för att hantera detta. Testa att spara en kampanj igen.

### Om kolumnerna heter `validFrom` och `validTo` (camelCase):
Koden har fallback för detta också. Om det fortfarande inte fungerar, kan vi behöva uppdatera databasen.

### Om kolumnerna saknas helt:
Du behöver köra migrationen för att skapa kolumnerna. Se `supabase-complete-restore.sql` eller `KNOWLEDGE_BASE_SETUP.md`.

## Nästa steg

Efter att du har kontrollerat schemat, meddela mig vilka kolumnnamn som faktiskt finns så kan jag justera koden därefter.
