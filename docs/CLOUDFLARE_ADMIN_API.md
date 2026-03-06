# Admin dashboard: Solceller‑leads och Cloudflare

Dashboarden hämtar nu **contacts** (solcells‑leads, kontaktförfrågningar, nyhetsbrev) **direkt från Supabase i webbläsaren** med anon‑nyckeln – **inga miljövariabler i Cloudflare behövs** för detta.

Du behöver bara **en SELECT‑policy i Supabase** så att anon får läsa `contacts`:

1. Supabase → **SQL Editor** → kör:
   ```sql
   create policy "Allow anon read contacts for dashboard"
   on public.contacts for select to anon using (true);
   ```
2. Spara. Efter det ska “Solceller‑leads” och kontaktlistorna visas i `/admin/dashboard` (välj t.ex. “Senaste 30 dagarna”).

---

## (Valfritt) Om du vill använda server‑API istället

För att `/admin/dashboard` ska använda API:t `/api/admin/contacts-stats` (server med service‑roll) i stället måste Cloudflare ha rätt miljövariabler.

API:t använder **endast** dessa miljövariabler (ingen D1, ingen annan Cloudflare‑databas):

- `SUPABASE_URL` eller `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- (valfritt) `ADMIN_DASHBOARD_PASSWORD`

## Steg i Cloudflare

1. Gå till **Cloudflare Dashboard** → **Workers & Pages** → ditt projekt (elchef).
2. Öppna **Settings** → **Environment variables**.
3. Välj **Production** (och ev. Preview om du vill samma beteende där).
4. Lägg till eller uppdatera:

| Namn | Värde | Kommentar |
|------|--------|-----------|
| `SUPABASE_URL` | `https://tptwyuywgchxcjxybmya.supabase.co` | Samma projekt som där dina leads finns |
| `SUPABASE_SERVICE_ROLE_KEY` | *Service role key från Supabase* | Supabase → Project Settings → API → Service role (secret) |
| `ADMIN_DASHBOARD_PASSWORD` | `grodan2025` | Samma som i admin‑inloggningen (valfritt om du redan använder default) |

5. Spara. Om variablerna gäller för **Functions** / runtime, se till att de är satta för **Runtime** (inte bara Build).
6. Trigga en **ny deploy** (Retry deployment eller pusha en commit).

Efter det ska anrop till `/api/admin/contacts-stats?from=...` med header `x-admin-password: grodan2025` returnera `solarLeads`, `contactRequests` och `newsletterSubscriptions` från **Supabase** (projekt `tptwyuywgchxcjxybmya`). Det finns ingen konflikt med D1 – admin‑API:t pratar bara med Supabase.

---

## Kontrollera att Cloudflare använder rätt projekt

Du kan inte se de faktiska nyckelvärdena i Cloudflare (de döljs). API:t returnerar därför en **hint** så du kan verifiera vilket projekt som används:

1. Öppna **Console** på `https://www.elchef.se/admin/dashboard`.
2. Kör:
   ```js
   fetch('/api/admin/contacts-stats?from=2025-01-01T00:00:00.000Z', {
     headers: { 'x-admin-password': 'grodan2025' }
   }).then(r => r.json()).then(console.log);
   ```
3. Titta i svaret på **`_supabaseProjectRef`**:
   - **`tptwyuywgchxcjxybmya`** → Cloudflare använder rätt projekt (dina leads ska då visas om det finns data).
   - **Något annat** (t.ex. `tmhakjwnfhbqkcrujpbl` eller `(url ej satt)`) → sätt eller rätta till `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL` i Cloudflare och deploya igen.

Inga nycklar exponeras – bara projekt‑ID:t som kommer från URL:en.
