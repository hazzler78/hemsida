# Cloudflare: miljövariabler för admin dashboard (solcells‑leads m.m.)

För att `/admin/dashboard` ska visa **Solceller‑leads**, kontaktförfrågningar och nyhetsbrev måste API:t `/api/admin/contacts-stats` kunna läsa från **Supabase** med service‑rollen.

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
