# Fix Campaign Columns - Migration Guide

## Problem
Felet "Could not find the 'validFrom' column of 'ai_campaigns' in the schema cache" uppstår eftersom databasen har camelCase kolumnnamn (`validFrom`, `validTo`) men Supabase förväntar sig snake_case (`valid_from`, `valid_to`).

## Lösning

### Steg 1: Kör migration i Supabase

1. Gå till [Supabase Dashboard](https://app.supabase.com)
2. Välj ditt projekt
3. Gå till **SQL Editor** i vänstermenyn
4. Öppna filen `supabase-fix-campaign-columns.sql` från detta projekt
5. Kopiera HELA innehållet
6. Klistra in i SQL Editor
7. Klicka på **Run** (eller tryck Ctrl+Enter)
8. Verifiera att kolumnerna har bytt namn genom att köra:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ai_campaigns' 
AND table_schema = 'public'
ORDER BY ordinal_position;
```

Du bör nu se `valid_from` och `valid_to` istället för `validFrom` och `validTo`.

### Steg 2: Testa igen

Efter att migrationen är klar:
1. Gå till `/admin/knowledge`
2. Försök ändra datumet för en kampanj
3. Det bör nu fungera!

## Vad migrationen gör

- Kontrollerar om kolumnerna `validFrom` och `validTo` finns
- Byter namn på dem till `valid_from` och `valid_to` (snake_case)
- Återskapar indexet med de nya kolumnnamnen
- Verifierar ändringarna

## Alternativ: Om du vill behålla camelCase

Om du av någon anledning vill behålla camelCase kolumner, måste du:
1. Använda citattecken i SQL: `"validFrom"` och `"validTo"`
2. Uppdatera Supabase schema cache (kan kräva support)
3. Detta rekommenderas INTE eftersom det strider mot PostgreSQL/Supabase konventioner

## Varför snake_case?

- PostgreSQL/Supabase standard är snake_case
- Bättre kompatibilitet med Supabase schema cache
- Konsistent med andra tabeller i projektet (`last_updated`, `created_at`, etc.)
- Undviker problem med case-sensitivity
