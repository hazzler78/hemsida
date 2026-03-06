# Kolumner för stad och adress i `contacts` (Otovo/solformulär)

För att solcellsformuläret ska kunna spara **Stad** (obligatoriskt) och **Adress** (valfritt) måste tabellen `contacts` ha motsvarande kolumner.

Kör i Supabase → **SQL Editor** (projekt där dina leads sparas). Kopiera och klistra in exakt denna rad:

    alter table public.contacts add column if not exists city text, add column if not exists address text;

(Efter det lagras stad och adress vid intresseanmälningar (sol/laddbox) och syns i Telegram och i admin-dashboard om du visar dem där.)
