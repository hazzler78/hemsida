# Lokal setup av leverantörer

För att se leverantörer på `/rorligt-avtal` och `/fastpris-avtal` lokalt behöver du köra SQL-scriptet mot din Supabase-databas.

## Steg 1: Öppna Supabase SQL Editor

1. Gå till din Supabase Dashboard: https://supabase.com/dashboard
2. Välj ditt projekt
3. Klicka på **SQL Editor** i vänstermenyn
4. Klicka på **New query**

## Steg 2: Kör SQL-scriptet

1. Öppna filen `supabase-page-providers.sql` i projektet
2. Kopiera HELA innehållet
3. Klistra in i SQL Editor
4. Klicka på **Run** (eller tryck Ctrl+Enter)

## Steg 3: Verifiera

Efter att scriptet har körts kan du verifiera att leverantörerna finns genom att köra:

```sql
SELECT * FROM page_providers WHERE active = true ORDER BY type, display_order;
```

Du bör se:
- 5 leverantörer för `rorligt` (Cheap Energy, Svekraft, Tibber, Telinet Energi, Fortum)
- 4 leverantörer för `fastpris` (Svealands Elbolag, Cheap Energy, Stockholms Elbolag, Svekraft)

## Alternativ: Använd Admin-sidan

Du kan också lägga till leverantörer manuellt via admin-sidan:

1. Gå till `/admin/providers`
2. Logga in med lösenordet (finns i koden)
3. Lägg till leverantörer manuellt

## Felsökning

Om du fortfarande inte ser leverantörer efter att ha kört scriptet:

1. **Kontrollera konsolen i webbläsaren** - Öppna Developer Tools (F12) och kolla Console-fliken för felmeddelanden
2. **Kontrollera Supabase-anslutningen** - Verifiera att `NEXT_PUBLIC_SUPABASE_URL` och `NEXT_PUBLIC_SUPABASE_ANON_KEY` är korrekt satta i `.env.local`
3. **Kontrollera RLS-policies** - Se till att Row Level Security-policies är korrekt konfigurerade (scriptet skapar dessa automatiskt)
4. **Kontrollera tabellen** - Verifiera att tabellen `page_providers` finns och har data:
   ```sql
   SELECT COUNT(*) FROM page_providers;
   ```
