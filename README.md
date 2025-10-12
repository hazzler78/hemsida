# Elchef.se

Elchef är en svensk tjänst för att jämföra och byta elavtal – enkelt och tryggt. Hitta marknadens bästa elavtal för just dina behov och byt direkt online.

## Funktioner
- Jämför elpriser i realtid baserat på postnummer
- Byt elavtal direkt via tjänsten
- Få expertråd och svar på vanliga frågor
- GDPR- och cookie-kompatibel
- Mobilvänlig design med bottennavigering
- Flera informationssidor (Om oss, Företag, Kontakt, Blogg, m.fl.)

## Installation & utveckling

```bash
npm install
npm run dev
```

Öppna [http://localhost:3000](http://localhost:3000) i din webbläsare.

## Bygg & deploy

### Cloudflare Pages (Next.js on Pages)

För produktion på Cloudflare Pages med `@cloudflare/next-on-pages`:

1) Installera beroenden
```bash
npm install
```

2) Bygg för Cloudflare
```bash
npm run cf:build
```

3) Lokal preview
```bash
npm run cf:preview
```

4) Deploy till Pages
```bash
npm run cf:deploy
```

Konfigurationen styrs via `wrangler.toml` (ange `account_id`, projektets namn under `[pages]`, samt miljövariabler under `[vars]`).

### Miljövariabler
Sätt följande variabler i Cloudflare Pages-projektet (Production och Preview):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_IDS`
- `MAILERLITE_API_KEY`
- `MAILERLITE_GROUP_ID`
- `OPENAI_API_KEY`
- `XAI_API_KEY`

### Cronersättning
Tidigare Vercel-crons (`vercel.json`) ersätts av en Cloudflare Worker (`functions/cron-worker.ts`) som schemaläggs via `wrangler.toml` `triggers.crons`. Den pingar:
- `/api/reminders/send`
- `/api/update-prices`

Sätt `CRON_TARGET_BASE_URL` i Pages miljövariabler till din publik URL (t.ex. `https://www.elchef.se`).

## Preview-deploy

Denna notering är tillagd för att trigga en Vercel preview-deploy för branchen `preview-form`.

## Teknikstack
- [Next.js](https://nextjs.org/) (App Router)
- [React](https://react.dev/)
- [styled-components](https://styled-components.com/)
- [TypeScript]
- Hosting: Cloudflare Pages

## Kontakt
- E-post: info@elchef.se
- Telefon: 073-686 23 60
- [elchef.se](https://elchef.se)

---

*Denna README är en grund – fyll gärna på med mer info om API, Grok AI, bidrag, licens m.m. vid behov.*
