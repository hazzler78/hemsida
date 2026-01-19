# Kundflöde - Förklaring av hela resan

## Översikt

Detta dokument förklarar hela kundresan från första kontakt till affiliate-klick, vilket är det **sista vi spårar** på Elchef.se. Efter affiliate-klick lämnar kunden vår sida och går vidare till leverantörens registreringsformulär.

---

## Hela Kundflödet (Steg för Steg)

### 🎯 Steg 1: Användaren kommer till sidan

**Möjliga ingångar:**
- **Direktbesök**: Användaren skriver in `elchef.se` direkt
- **Sökning**: Google, Bing, DuckDuckGo etc.
- **Sociala medier**: Facebook, Instagram, TikTok, LinkedIn
- **Robin Hood-länk**: `/robinhood` → omdirigerar till startsidan
- **UTM-parametrar**: Spåras för att veta varifrån trafiken kommer

**Vad som händer:**
- `usePageView` hook körs automatiskt
- Skickar POST till `/api/events/page-view`
- Sparas i `page_views` tabellen i Supabase
- Skapar/uppdaterar `session_id` i localStorage
- Om användaren kom via `/robinhood`: Sätter `came_via_robinhood` flagga i localStorage (giltig i 24 timmar)

**Data som sparas:**
```typescript
{
  path: "/",                    // Vilken sida
  session_id: "abc123...",      // Unikt ID för besöket
  user_agent: "...",           // Webbläsare/enhet
  referer: "...",              // Varifrån de kom
  utm_source: "facebook",      // UTM-parametrar
  utm_medium: "social",
  utm_campaign: "sommar2024",
  created_at: "2024-01-15..."
}
```

---

### 🏠 Steg 2: Startsida (/) - Hero-komponenten

**Vad användaren ser:**
- Hero-sektion med två huvudknappar:
  - **"Rörligt avtal"** → `/rorligt-avtal`
  - **"Fastpris"** → `/fastpris-avtal`
- A/B-testning: Två varianter (A och B) testas för att se vilken som ger bäst konvertering

**Vad som händer när användaren klickar:**
- `trackHeroClick()` körs
- Skickar POST till `/api/events/hero-click`
- Sparas i `hero_clicks` tabellen
- Sparar vilken variant (A eller B) som klickades
- Lägger till UTM-parametrar automatiskt
- Omdirigerar till kontraktsidan

**Data som sparas:**
```typescript
{
  variant: "A" eller "B",       // Vilken variant som klickades
  target: "rorligt" eller "fastpris",
  session_id: "abc123...",
  created_at: "2024-01-15..."
}
```

---

### 📄 Steg 3: Kontraktsida (/rorligt-avtal eller /fastpris-avtal)

**Vad användaren ser:**
- Grid med alla tillgängliga leverantörer för vald avtalstyp
- Varje leverantör visar:
  - Logo
  - Namn
  - Beskrivning (pris, avgifter, bindningstid)
  - "Välj [Provider]" knapp

**Vilka leverantörer finns:**
- **Rörligt avtal**: Cheap Energy, Svekraft, Tibber, Telinet Energi, Fortum, etc.
- **Fastpris**: Svealands Elbolag, Cheap Energy, Stockholms Elbolag, Svekraft, etc.
- Leverantörer hanteras i `page_providers` tabellen och kan administreras via `/admin/providers`

**Vad som händer:**
- Sidan laddas → TikTok tracking event `ViewContent` skickas
- Användaren scrollar och tittar på alternativ
- **Detta är där användaren tar sitt beslut**
- **VIKTIGT:** Varje leverantör har sin egen affiliate-länk och spåras individuellt

**Alternativa flöden:**
- **V2-sidan** (`/rorligt-avtal-v2`): 
  - Steg 1: Personaliseringsfrågor (årsförbrukning, preferenser)
  - Steg 2: Personliga rekommendationer baserat på svar
  - Trust signals och besparingskalkylator

---

### 🔗 Steg 4: Affiliate-klick (DET SISTA VI SPÅRAR)

**Vad händer när användaren klickar på en leverantör:**

1. **Användaren klickar på "Välj [Provider]" knapp**

2. **`handleProviderClick()` körs för ALLA leverantörer:**
   ```typescript
   // Hämtar session ID från localStorage
   const sessionId = localStorage.getItem('invoice_session_id');
   
   // Kontrollerar om användaren kom via Robin Hood (giltig i 24h)
   const cameViaRobinhood = checkRobinhoodFlag();
   
   // Skickar tracking-event för VILKEN SOM HELST leverantör
   fetch('/api/events/affiliate-click', {
     method: 'POST',
     body: JSON.stringify({
       provider: providerName,  // Ex: "Cheap Energy", "Svekraft", "Svealands Elbolag", etc.
       contractType: "rorligt",  // eller "fastpris"
       url: providerUrl,         // Leverantörens affiliate-länk
       sessionId: "abc123...",
       cameViaRobinhood: true/false
     })
   });
   ```

3. **API:et (`/api/events/affiliate-click`) sparar ALLA klick i Supabase:**
   ```typescript
   {
     provider: "Cheap Energy",           // Vilken leverantör (kan vara vilken som helst)
     contract_type: "rorligt",           // Typ av avtal (rorligt/fastpris)
     url: "https://...",                  // Affiliate-länken
     session_id: "abc123...",            // Koppling till session
     user_agent: "...",                  // Teknisk info
     referer: "elchef.se/rorligt-avtal", // Varifrån klicket kom
     came_via_robinhood: true/false,     // Kom de via Robin Hood?
     created_at: "2024-01-15..."         // När klicket skedde
   }
   ```
   
   **Viktigt:** Varje klick på en leverantör spåras separat. Om en användare klickar på flera leverantörer spåras varje klick individuellt.

4. **Affiliate-länken öppnas i nytt fönster:**
   - Användaren lämnar Elchef.se
   - Går till leverantörens registreringsformulär
   - **Här slutar vår tracking**

---

## Vad händer EFTER affiliate-klick?

### ❓ Detta vet vi INTE (utan webhook):

- Om användaren faktiskt registrerar sig hos leverantören
- Om de slutför registreringen
- Om de byter leverantör
- Hur länge de stannar på leverantörens sida
- Om de kommer tillbaka till Elchef.se

### ✅ Detta vet vi:

- **Totalt antal affiliate-klick** (alla länkar på sidan, alla leverantörer)
- **Vilka leverantörer** som klickas mest (t.ex. Cheap Energy, Svekraft, Svealands Elbolag, etc.)
- **Vilken avtalstyp** (rörligt/fastpris) som är populärast
- **Vilka källor** som ger mest klick (Robin Hood, sociala medier, etc.)
- **När** klicken skedde (datum/tid)
- **Session-ID** för att koppla ihop flera klick från samma besökare
- **Varje leverantör spåras individuellt** - om en användare klickar på flera leverantörer spåras varje klick separat
- **Unikt tracking-ID** för varje affiliate-klick (för att koppla försäljningar)

### ✅ Detta kan vi veta (med försäljningstracking):

- **Vilka affiliate-klick som ledde till försäljningar** (via tracking-ID)
- **Konverteringsgrad per leverantör** (försäljningar / affiliate-klick)
- **Vilka leverantörer som ger mest försäljningar**
- **Tid från klick till försäljning**

**Se `docs/FORSALJNINGSTRACKING.md` för mer information om försäljningstracking.**

---

## Dataflöde och Tracking

### Databaser som används:

1. **Supabase** (PostgreSQL):
   - `page_views` - Alla sidvisningar
   - `affiliate_clicks` - Alla affiliate-klick ⭐ **VIKTIGAST**
   - `contract_clicks` - Klick på kontraktsknappar
   - `hero_clicks` - Klick på hero-knappar
   - `hero_impressions` - Visningar av hero-komponenten

2. **Cloudflare D1** (SQLite):
   - `robinhood_clicks` - Besök via Robin Hood-länken

### Session-spårning:

- **`session_id`**: Skapas första gången användaren besöker sidan
- Sparas i `localStorage` som `invoice_session_id`
- Används för att koppla ihop alla events från samma besökare
- Giltig tills användaren rensar sin webbläsare

### Robin Hood-spårning:

- När användaren besöker `/robinhood`:
  - Sätter `came_via_robinhood = true` i localStorage
  - Sparar tidsstämpel (`came_via_robinhood_time`)
  - Giltig i **24 timmar**
- När användaren klickar på affiliate-länk:
  - Kontrollerar om flaggan finns och är giltig
  - Markerar affiliate-klicket med `came_via_robinhood = true`

---

## Konverteringsfunnel

```
1. Besökare (page_views)
   ↓
2. Hero-klick (hero_clicks)
   ↓
3. Kontraktsida-visning (page_views på /rorligt-avtal eller /fastpris-avtal)
   ↓
4. Affiliate-klick (affiliate_clicks) ⭐ SLUTPUNKT
   ↓
5. ??? (Vi vet inte vad som händer här)
```

### Konverteringsgrad:

- **Hero → Kontraktsida**: `hero_clicks / page_views` på startsidan
- **Kontraktsida → Affiliate-klick**: `affiliate_clicks / page_views` på kontraktsidan
- **Totalt**: `affiliate_clicks / page_views` på startsidan

---

## Exempel: En komplett kundresa

### Scenario: Användare från Robin Hood

1. **10:00** - Användaren klickar på Robin Hood-länk
   - Besöker `/robinhood`
   - Omdirigeras till `/`
   - `came_via_robinhood` flagga sätts (giltig till 10:00 nästa dag)
   - Sparas i `robinhood_clicks` (D1)
   - Sparas i `page_views` (Supabase)

2. **10:01** - Användaren ser startsidan
   - Hero-komponenten visas
   - Sparas i `hero_impressions` (Supabase)

3. **10:02** - Användaren klickar på "Rörligt avtal"
   - Sparas i `hero_clicks` (Supabase)
   - Omdirigeras till `/rorligt-avtal`

4. **10:03** - Användaren ser kontraktsidan
   - Scrollar och tittar på leverantörer
   - Sparas i `page_views` (Supabase)

5. **10:05** - Användaren klickar på "Välj Cheap Energy" (eller vilken annan leverantör som helst)
   - `handleProviderClick()` körs med leverantörens namn och URL
   - Kontrollerar `came_via_robinhood` flagga → **TRUE** (inom 24h)
   - Skickar till `/api/events/affiliate-click`
   - Sparas i `affiliate_clicks` med:
     ```json
     {
       "provider": "Cheap Energy",  // eller "Svekraft", "Svealands Elbolag", etc.
       "contract_type": "rorligt",
       "came_via_robinhood": true,
       "session_id": "abc123...",
       "url": "https://cheapenergy.se/..."
     }
     ```
   - Affiliate-länken öppnas i nytt fönster
   - **SLUTPUNKT - Vi vet inget mer**
   
   **OBS:** Om användaren klickar på flera leverantörer spåras varje klick separat. Till exempel:
   - Klick på "Cheap Energy" → Sparas som ett affiliate-klick
   - Klick på "Svekraft" → Sparas som ett annat affiliate-klick
   - Totalt: 2 affiliate-klick från samma session

---

## Varför är affiliate-klick viktigt?

### Affiliate-klick är vår "konvertering" eftersom:

1. **Det är det sista vi kan spåra** - Efter detta lämnar kunden vår sida
2. **Det visar intresse** - Användaren har valt en specifik leverantör
3. **Det är mätbart** - Vi kan räkna exakt antal klick
4. **Det kopplar till källa** - Vi vet varifrån trafiken kom (Robin Hood, sociala medier, etc.)

### Vad vi INTE kan mäta:

- **Faktisk registrering** - Leverantören har denna data
- **Avslutad bytning** - Leverantören har denna data
- **Återkommande besökare** - Om de inte använder samma enhet/session

---

## Förbättringar för att öka affiliate-klick

### Nuvarande problem:
- **500 besökare → 0 konverteringar** (från sociala medier)
- För många alternativ utan vägledning
- Ingen personalisering
- Brist på trust signals

### Lösningar (implementerade i V2):
- ✅ Personaliseringsfrågor
- ✅ Personliga rekommendationer
- ✅ Trust signals och besparingskalkylator
- ✅ Tydlig hierarki med "Bäst för dig" markering

---

## Sammanfattning

**Kundflödet är:**
1. Användaren kommer till sidan → `page_views`
2. Klickar på hero-knapp → `hero_clicks`
3. Ser kontraktsida → `page_views`
4. Klickar på affiliate-länk → `affiliate_clicks` ⭐ **SLUTPUNKT**

**Efter affiliate-klick:**
- Användaren lämnar Elchef.se
- Går till leverantörens registreringsformulär
- Vi vet inget mer

**Viktigast att mäta:**
- **Totalt antal affiliate-klick** (alla länkar, alla leverantörer)
- **Affiliate-klick från Robin Hood** (delmängd av totalt)
- **Konverteringsgrad**: `affiliate_clicks / page_views`
- **Per leverantör**: Vilka leverantörer som klickas mest (t.ex. Cheap Energy vs Svekraft vs Svealands Elbolag)
- **Försäljningar**: Vilka affiliate-klick som leder till faktiska försäljningar (via tracking-ID)

**⚠️ VIKTIGT - Försäljningstracking:**
- Varje affiliate-klick får nu ett unikt tracking-ID som läggs till i länken
- Detta gör det möjligt att koppla försäljningar till specifika affiliate-klick
- Se `docs/FORSALJNINGSTRACKING.md` för mer information

**Exempel på data (realistiskt scenario):**
```
Senaste 24 timmarna:
- Totalt besök: 237
- Totalt affiliate-klick: 32
- Konverteringsgrad: 13.5% (mycket bra!)

Fördelning per leverantör (exempel):
- Cheap Energy: 12 klick (37.5%)
- Svekraft: 8 klick (25%)
- Svealands Elbolag: 6 klick (18.8%)
- Tibber: 4 klick (12.5%)
- Övriga: 2 klick (6.2%)

Från Robin Hood: 15 klick (46.9% av totalt)
```

**Vad är bra konverteringsgrad?**
- **1-5%**: Genomsnittligt för affiliate-sites
- **5-10%**: Bra
- **10-15%**: Mycket bra ⭐ (dina siffror!)
- **15%+**: Utmärkt

---

## Ytterligare Viktiga Analyser och Insikter

### 🔍 1. Användare som klickar på flera leverantörer

**Vad betyder det?**
- Om en användare klickar på flera leverantörer kan det betyda:
  - ✅ **Positivt**: Användaren jämför alternativ aktivt (engagerad)
  - ⚠️ **Negativt**: Användaren är osäker eller förvirrad (beslutsförlamning)

**Hur analysera:**
```sql
-- Hitta sessioner med flera affiliate-klick
SELECT 
  session_id,
  COUNT(*) as antal_klick,
  STRING_AGG(provider, ', ') as leverantörer
FROM affiliate_clicks
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY session_id
HAVING COUNT(*) > 1
ORDER BY antal_klick DESC;
```

**Insikter:**
- Om många användare klickar på flera leverantörer → Överväg att förbättra vägledning
- Om få användare gör det → Bra, de är beslutsamma

---

### 🚪 2. Användare som hoppar över startsidan

**Scenario:** Användare går direkt till `/rorligt-avtal` eller `/fastpris-avtal` (t.ex. från bokmärke eller direktlänk)

**Vad betyder det?**
- ✅ **Positivt**: Användaren vet vad de vill ha (kvalificerad trafik)
- ⚠️ **Tänk på**: De missar hero-komponenten och potentiell vägledning

**Hur analysera:**
```sql
-- Hitta användare som gick direkt till kontraktsida
SELECT 
  session_id,
  COUNT(*) as sidor_besökta,
  STRING_AGG(path, ' → ') as väg
FROM page_views
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY session_id
HAVING COUNT(*) = 1 AND (path LIKE '%rorligt-avtal%' OR path LIKE '%fastpris-avtal%');
```

---

### 📉 3. Bounce Rate (Användare som inte klickar)

**Vad är det?**
- Användare som kommer till sidan men lämnar utan att klicka på något

**Hur beräkna:**
```
Bounce Rate = (Besökare utan affiliate-klick) / (Totalt besök) × 100
```

**Med dina siffror:**
- 237 besök → 32 affiliate-klick
- Bounce Rate = (237 - 32) / 237 = 86.5%

**Vad betyder det?**
- Detta är normalt för affiliate-sites (många besökare är bara nyfikna)
- Men det finns utrymme för förbättring!

**Hur förbättra:**
- ✅ Personalisering (V2-sidan)
- ✅ Trust signals
- ✅ Tydligare call-to-action
- ✅ Besparingskalkylator

---

### ⏱️ 4. Tidsanalys: Hur lång tid tar det från besök till klick?

**Varför är det viktigt?**
- Snabba klick = Beslutsamma användare
- Långsamma klick = Användare som behöver mer information

**Hur analysera:**
```sql
-- Beräkna tid från första page_view till affiliate-klick per session
WITH session_times AS (
  SELECT 
    pv.session_id,
    MIN(pv.created_at) as första_besök,
    MIN(ac.created_at) as första_klick,
    EXTRACT(EPOCH FROM (MIN(ac.created_at) - MIN(pv.created_at))) / 60 as minuter_mellan
  FROM page_views pv
  LEFT JOIN affiliate_clicks ac ON pv.session_id = ac.session_id
  WHERE pv.created_at >= NOW() - INTERVAL '24 hours'
  GROUP BY pv.session_id
  HAVING MIN(ac.created_at) IS NOT NULL
)
SELECT 
  AVG(minuter_mellan) as genomsnitt_minuter,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY minuter_mellan) as median_minuter
FROM session_times;
```

---

### 🔄 5. Återkommande Besökare

**Hur spåras det?**
- Via `session_id` i localStorage
- Om användaren rensar sin webbläsare → Ny session
- Om användaren kommer tillbaka samma dag → Samma session (om localStorage finns kvar)

**Begränsningar:**
- Vi kan inte spåra användare mellan olika enheter
- Vi kan inte spåra användare som rensar localStorage
- Vi kan inte spåra användare som använder inkognito-läge

**Vad kan vi analysera:**
```sql
-- Sessioner med flera page_views (indikerar återkommande besök)
SELECT 
  session_id,
  COUNT(*) as antal_sidvisningar,
  MIN(created_at) as första_besök,
  MAX(created_at) as sista_besök,
  EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) / 3600 as timmar_mellan
FROM page_views
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY session_id
HAVING COUNT(*) > 1
ORDER BY antal_sidvisningar DESC;
```

---

### 📱 6. Enhet och Webbläsare

**Vad spåras:**
- `user_agent` innehåller information om enhet och webbläsare

**Hur analysera:**
```sql
-- Fördelning per enhetstyp
SELECT 
  CASE 
    WHEN user_agent LIKE '%Mobile%' OR user_agent LIKE '%Android%' OR user_agent LIKE '%iPhone%' THEN 'Mobil'
    WHEN user_agent LIKE '%Tablet%' OR user_agent LIKE '%iPad%' THEN 'Surfplatta'
    ELSE 'Desktop'
  END as enhetstyp,
  COUNT(*) as antal_klick,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM affiliate_clicks WHERE created_at >= NOW() - INTERVAL '24 hours'), 1) as procent
FROM affiliate_clicks
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY enhetstyp;
```

**Insikter:**
- Om många klick kommer från mobil → Säkerställ att sidan är mobilvänlig
- Om få klick kommer från mobil → Överväg att förbättra mobilupplevelsen

---

### 🎯 7. Kvalitet på Trafik (Bortom Antal Klick)

**Vad är kvalitet?**
- **Hög kvalitet**: Användare som klickar snabbt, klickar på rekommenderad leverantör
- **Låg kvalitet**: Användare som klickar på många leverantörer, tar lång tid, hoppar av

**Mätvärden:**
1. **Klick per session**: Färre = bättre (beslutsamma användare)
2. **Tid till första klick**: Snabbare = bättre
3. **Leverantörsval**: Klickar på rekommenderad = bättre

**Hur analysera:**
```sql
-- Kvalitetsindikator: Sessioner med 1 klick vs flera klick
SELECT 
  CASE 
    WHEN antal_klick = 1 THEN '1 klick (beslutsam)'
    WHEN antal_klick = 2 THEN '2 klick (jämför)'
    ELSE '3+ klick (osäker)'
  END as kategori,
  COUNT(*) as antal_sessioner,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(DISTINCT session_id) FROM affiliate_clicks WHERE created_at >= NOW() - INTERVAL '24 hours'), 1) as procent
FROM (
  SELECT session_id, COUNT(*) as antal_klick
  FROM affiliate_clicks
  WHERE created_at >= NOW() - INTERVAL '24 hours'
  GROUP BY session_id
) subquery
GROUP BY kategori;
```

---

### 🔗 8. Referer-Analys (Varifrån kommer användarna?)

**Vad spåras:**
- `referer` i `page_views` och `affiliate_clicks`

**Viktiga insikter:**
- Vilka externa sidor länkar till er?
- Vilka interna sidor leder till konvertering?
- Direktbesök vs externa länkar

**Hur analysera:**
```sql
-- Top referers som leder till affiliate-klick
SELECT 
  ac.referer,
  COUNT(*) as antal_klick,
  COUNT(DISTINCT ac.session_id) as unika_sessioner
FROM affiliate_clicks ac
WHERE ac.created_at >= NOW() - INTERVAL '24 hours'
  AND ac.referer IS NOT NULL
GROUP BY ac.referer
ORDER BY antal_klick DESC
LIMIT 10;
```

---

### 📊 9. Jämförelse: V2 vs Original

**V2-sidan spåras:**
- `source: 'rorligt-avtal-v2'` i affiliate-klick (om implementerat)
- Eller via `referer` som innehåller `/rorligt-avtal-v2`

**Hur jämföra:**
```sql
-- Jämför konvertering mellan V2 och original
SELECT 
  CASE 
    WHEN referer LIKE '%rorligt-avtal-v2%' THEN 'V2'
    WHEN referer LIKE '%rorligt-avtal%' THEN 'Original'
    ELSE 'Okänd'
  END as version,
  COUNT(*) as antal_klick,
  COUNT(DISTINCT session_id) as unika_sessioner
FROM affiliate_clicks
WHERE contract_type = 'rorligt'
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY version;
```

---

### ⚠️ 10. Felhantering och Data-kvalitet

**Vad händer om tracking misslyckas?**
- `fetch().catch(() => {})` → Tyst fel, ingen data sparas
- Användaren ser ingen skillnad, men vi missar tracking

**Förbättringar:**
- ✅ Använd `keepalive: true` för att säkerställa att request skickas
- ✅ Logga fel i konsolen för debugging
- ✅ Överväg retry-logik för kritiska events

**Data-kvalitet:**
- Kontrollera att alla affiliate-klick har `session_id`
- Kontrollera att `provider` inte är NULL
- Kontrollera att `created_at` är korrekt

---

### 💡 11. Actionable Insights från Dina Siffror

**Med 237 besök och 32 affiliate-klick (13.5% konvertering):**

**Bra saker:**
- ✅ Konverteringsgraden är mycket bra (över genomsnittet)
- ✅ Användare verkar hitta vad de letar efter

**Förbättringsområden:**
- 🔍 **86.5% bounce rate** → Många användare lämnar utan att klicka
  - **Lösning**: Förbättra hero-komponenten, tydligare värdeproposition
- 🔍 **205 användare klickade inte** → Vad stoppar dem?
  - **Lösning**: A/B-testa olika designs, lägg till trust signals
- 🔍 **Analysera vilka leverantörer som klickas** → Optimera layouten
  - **Lösning**: Placera populära leverantörer högre upp

**Nästa steg för analys:**
1. Kör SQL-frågorna ovan för att få djupare insikter
2. Jämför V2 vs Original om båda används
3. Analysera tidsfördelning (när klickar användare?)
4. Analysera enhetstyp (mobil vs desktop)
5. Analysera källor (vilka ger bäst konvertering?)
