# Hur tracking fungerar - Förklaring

## Varifrån kommer datan?

**Det är INTE Google Analytics!** Det är vår egen tracking som körs direkt i webbläsaren.

### Så här fungerar det:

1. **När någon besöker sidan:**
   - JavaScript-koden (`usePageView`) körs i webbläsaren
   - Den skickar en POST-förfrågan till `/api/events/page-view`
   - Detta sparas i Supabase `page_views` tabellen

2. **Vad sparas:**
   - `path` - Vilken sida som besöktes (t.ex. `/`, `/jamfor-elpriser`)
   - `session_id` - Unikt ID för besöket (sparas i localStorage)
   - `user_agent` - Webbläsare och enhet
   - `referer` - Varifrån användaren kom
   - `utm_source`, `utm_medium`, `utm_campaign` - UTM-parametrar från URL
   - `created_at` - När besöket skedde

## Problem med nuvarande tracking

### 1. **Botar och crawlers räknas med**
- Googlebot (Google's crawler)
- Bingbot (Microsoft's crawler)
- GPTBot (OpenAI's crawler)
- PerplexityBot
- Andra automatiska crawlers

### 2. **Dubbelräkning**
- Om användaren refreshar sidan räknas det som nytt besök
- Om användaren navigerar mellan sidor räknas varje sida som separat besök

### 3. **Test-besök**
- Utvecklare som testar sidan
- Preview-deployments från Cloudflare Pages

## Hur man verifierar att det är riktiga besök

### 1. Filtrera bort botar

```typescript
// Lista över kända botar
const BOT_USER_AGENTS = [
  'googlebot',
  'bingbot',
  'slurp', // Yahoo
  'duckduckbot',
  'baiduspider',
  'yandexbot',
  'sogou',
  'exabot',
  'facebot',
  'ia_archiver',
  'gptbot',
  'perplexitybot',
  'anthropic-ai',
  'claude-web',
  'chatgpt-user',
  'facebookexternalhit',
  'twitterbot',
  'linkedinbot',
  'whatsapp',
  'telegrambot',
  'discordbot',
  'slackbot',
  'applebot',
  'petalbot',
  'ahrefsbot',
  'semrushbot',
  'mj12bot',
  'dotbot',
  'megaindex',
  'blexbot',
  'dotbot',
  'crawler',
  'spider',
  'bot',
  'scraper'
];

function isBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some(bot => ua.includes(bot));
}
```

### 2. Filtrera bort test-besök

```typescript
// Filtrera bort preview-deployments
function isPreviewDeployment(referer: string): boolean {
  return referer.includes('preview') || referer.includes('localhost');
}
```

### 3. Räkna unika sessioner istället för page views

```typescript
// Räkna unika sessioner istället för totala page views
const { data: uniqueSessions } = await supabase
  .from('page_views')
  .select('session_id')
  .gte('created_at', todayISO);

const uniqueVisitors = new Set(uniqueSessions?.map(pv => pv.session_id));
const realVisits = uniqueVisitors.size;
```

## Förbättringar som bör göras

1. **Filtrera botar i API:et**
   - Kontrollera `user_agent` innan man sparar
   - Spara en flagga `is_bot` i databasen

2. **Räkna unika besökare**
   - Använd `session_id` för att räkna unika besökare
   - Visa både "page views" och "unique visitors"

3. **Filtrera test-besök**
   - Identifiera preview-deployments
   - Möjlighet att markera test-data

4. **Jämför med Google Analytics**
   - Om ni har Google Analytics kan ni jämföra siffrorna
   - Det ger en bra indikation på om tracking stämmer

## SQL-fråga för att se botar

```sql
-- Se alla besök med botar
SELECT 
  user_agent,
  COUNT(*) as antal,
  path
FROM page_views
WHERE created_at >= CURRENT_DATE
GROUP BY user_agent, path
ORDER BY antal DESC;

-- Filtrera bort kända botar
SELECT COUNT(*) as riktiga_besok
FROM page_views
WHERE created_at >= CURRENT_DATE
  AND user_agent NOT ILIKE '%bot%'
  AND user_agent NOT ILIKE '%crawler%'
  AND user_agent NOT ILIKE '%spider%'
  AND user_agent NOT ILIKE '%scraper%';
```

