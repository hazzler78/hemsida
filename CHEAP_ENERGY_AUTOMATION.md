# Cheap Energy Automation - Dokumentation

## Översikt

Detta är en AI-driven automation-lösning som låter kunder teckna elavtal via Cheap Energy genom en chatt-baserad upplevelse. Kunden chattar med AI:n som i bakgrunden automatiskt fyller i formuläret på Cheap Energy's sida.

## Arkitektur

### Komponenter

1. **CheapEnergyChat** (`src/components/CheapEnergyChat.tsx`)
   - React-komponent som hanterar chatten med kunden
   - Samlar information steg-för-steg
   - Anropar automation API när data är klar

2. **Automation API** (`src/app/api/cheap-energy-automation/route.ts`)
   - Playwright-baserad browser automation
   - Fyller i formulär på Cheap Energy's sida
   - Loggar varje steg till Supabase

3. **Supabase Tabell** (`supabase-cheap-energy-automation.sql`)
   - Loggar alla automation-steg
   - Spårar var kunder droppar av
   - Lagrar signeringslänkar

## Installation

1. **Installera Playwright:**
```bash
npm install playwright @playwright/test
npx playwright install chromium
```

2. **Skapa Supabase-tabell:**
Kör SQL-filen `supabase-cheap-energy-automation.sql` i Supabase SQL Editor.

3. **Miljövariabler:**
Se till att följande är satta:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Användning

### I en React-komponent:

```tsx
import CheapEnergyChat from '@/components/CheapEnergyChat';

export default function MyPage() {
  return (
    <div>
      <CheapEnergyChat />
      {/* Resten av din sida */}
    </div>
  );
}
```

### Flöde

1. **Kunden startar chatten** → AI frågar efter postnummer
2. **Postnummer** → AI fyller i på Cheap-sidan
3. **Årsförbrukning** → Kunden väljer 1, 2 eller 3 → AI klickar rätt knapp
4. **Rörligt timpris** → AI väljer automatiskt (ingen fråga)
5. **Personnummer** → AI fyller i → Adress hämtas automatiskt
6. **Adressbekräftelse** → Kunden svarar Ja/Nej → AI klickar rätt knapp
7. **Kontaktuppgifter** → AI frågar stegvis om:
   - E-postadress
   - Telefonnummer
   - Tillträdesdatum
   - Betalsätt
8. **Skicka formulär** → AI validerar och skickar
9. **Signeringslänk** → AI får URL och skickar till kunden

## API Endpoints

### POST `/api/cheap-energy-automation`

#### Kör flera steg i sekvens (rekommenderat):

```json
{
  "sessionId": "abc123",
  "steps": [
    { "action": "fill_postnummer", "data": { "postnummer": "12345" } },
    { "action": "fill_forbrukning", "data": { "forbrukning": "5000" } },
    { "action": "select_contract_type", "data": {} },
    { "action": "fill_personnummer", "data": { "personnummer": "199001011234" } },
    { "action": "confirm_address", "data": { "confirmed": true } },
    { "action": "fill_contact_details", "data": { "email": "test@example.com", ... } },
    { "action": "submit_form", "data": {} }
  ]
}
```

#### Kör ett steg i taget (bakåtkompatibilitet):

```json
{
  "sessionId": "abc123",
  "action": "fill_postnummer",
  "data": { "postnummer": "12345" }
}
```

## Tracking

Alla steg loggas till `cheap_energy_automation_logs` tabellen i Supabase:

- `session_id` - Unikt ID för varje kundsession
- `step` - Vilket steg som kördes
- `step_data` - Data för steget (JSONB)
- `status` - 'in_progress', 'completed', 'failed'
- `error_message` - Felmeddelande om något gick fel
- `signing_url` - URL till signeringssidan när klar
- `created_at` / `updated_at` - Timestamps

## Dashboard Integration

För att visa automation-statistik i admin-dashboarden, lägg till:

```typescript
// Hämta automation-loggning
const { data: automationLogs } = await supabase
  .from('cheap_energy_automation_logs')
  .select('*')
  .order('created_at', { ascending: false });

// Analysera var kunder droppar av
const dropOffPoints = automationLogs.reduce((acc, log) => {
  if (log.status === 'failed' || log.status === 'in_progress') {
    acc[log.step] = (acc[log.step] || 0) + 1;
  }
  return acc;
}, {});
```

## ⚠️ VIKTIGT: Cloudflare Pages Kompatibilitet

**Playwright fungerar INTE på Cloudflare Pages** eftersom:
- Cloudflare Pages kräver Edge Runtime för alla routes
- Playwright kräver Node.js runtime
- Edge Runtime stöder inte Playwright's browser automation

### Lösningar:

#### Alternativ 1: Separerad Automation Server (REKOMMENDERAT)
Kör automationen på en separat Node.js-server:
- **Vercel**: Skapa ett separat projekt med Node.js runtime
- **Railway**: Enkel Node.js deployment
- **Render**: Gratis tier för Node.js apps
- **Fly.io**: Bra för Docker-containers

#### Alternativ 2: Browser Automation Service
Använd en extern tjänst:
- **Browserless.io**: Managed browser automation
- **ScrapingBee**: API-baserad browser automation
- **Puppeteer-as-a-Service**: Hosted Puppeteer

#### Alternativ 3: Cloudflare Workers med Node.js Compat
Använd Cloudflare Workers med `nodejs_compat` flag, men detta har begränsningar.

## Felsökning

### Playwright fungerar inte

- Kontrollera att Playwright är installerat: `npx playwright --version`
- Installera browsers: `npx playwright install chromium`
- **För Cloudflare Pages**: Använd en separat Node.js-server för automation

### Selectors hittas inte

- Cheap Energy's formulär kan ändras
- Uppdatera selectors i `route.ts` baserat på faktisk HTML-struktur
- Använd Playwright's `page.screenshot()` för att debugga

### Timeout-fel

- Öka timeout-värden i `waitForSelector()` och `waitForNavigation()`
- Cheap Energy-sidan kan ha långa laddtider (~5 sekunder)

## Nästa steg

1. **Testa med riktiga data** - Verifiera att alla selectors fungerar
2. **Förbättra error handling** - Ge bättre felmeddelanden till kunden
3. **Lägg till retry-logik** - Försök igen vid tillfälliga fel
4. **Optimera prestanda** - Cacha browser-instanser om möjligt
5. **Lägg till analytics** - Spåra konvertering och drop-off points

## Säkerhet

- **Personnummer** - Hantera känslig data säkert
- **Rate limiting** - Begränsa antal requests per session
- **Validation** - Validera all input innan automation
- **Error logging** - Logga fel utan att exponera känslig data
