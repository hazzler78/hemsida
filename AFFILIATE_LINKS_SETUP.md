# Affiliate-länkar Setup

## Översikt

Kundresan har uppdaterats så att kunder som klickar på "Rörligt avtal" eller "Fastpris" nu ser en lista med era leverantörer istället för att direkt gå till ett formulär.

## Ändringar som gjorts

### 1. Uppdaterade sidor

#### `/rorligt-avtal` - Rörligt avtal
Visar nu två leverantörer:
- **Cheap Energy** (Rekommenderat)
  - Text: "0 kr i månadsavgift – 0 öre i påslag i 12 månader. Du betalar endast för den el du använder. Ingen bindningstid."
  - Länk: https://www.cheapenergy.se/elchef-rorligt/
  - Logotyp: `/cheap-logo.png` ✅
  
- **Svekraft**
  - Text: "0 kr i månadsavgift i 12 månader – 7,99 öre i påslag. Du betalar endast för den el du använder. Ingen bindningstid."
  - Länk: https://www.svekraft.com/elchef-rorligt/
  - Logotyp: `/svekraft-logo.png` ✅

#### `/fastpris-avtal` - Fastpris
Visar nu fyra leverantörer (rekommenderad först):
- **Svealands Elbolag** (Rekommenderat) 🏷️
  - Länk: https://www.svealandselbolag.se/elchef-fastpris/
  - Logotyp: `/svealand-logo.png` ✅
  
- **Cheap Energy**
  - Länk: https://www.cheapenergy.se/elchef-fastpris/
  - Logotyp: `/cheap-logo.png` ✅
  
- **Stockholms Elbolag**
  - Länk: https://www.stockholmselbolag.se/elavtal-elchef-fastpris/
  - Logotyp: `/stockholms-elbolag-logo.png` ✅
  
- **Svekraft**
  - Länk: https://www.svekraft.com/elchef-fastpris/
  - Logotyp: `/svekraft-logo.png` ✅

### 2. Ny tracking för affiliate-klick

**API Endpoint:** `/api/events/affiliate-click`

Trackar följande information:
- Leverantörsnamn
- Kontraktstyp (rörligt/fastpris)
- URL som användaren klickade på
- Session ID
- User agent
- Referer

### 3. Supabase-tabell

**Fil:** `supabase-affiliate-clicks.sql`

Innehåller SQL för att skapa `affiliate_clicks`-tabellen.

## Setup - Klart! ✅

### ~~1. Lägg till saknade logotyper~~ ✅ KLART

Alla logotyper är nu på plats:
- ✅ `public/cheap-logo.png`
- ✅ `public/svealand-logo.png`
- ✅ `public/svekraft-logo.png`
- ✅ `public/stockholms-elbolag-logo.png`

### ~~2. Kör SQL-skriptet i Supabase~~ ✅ KLART

Tabellen `affiliate_clicks` är skapad och redo att användas.

### 3. Testa den nya kundresan (Rekommenderat)

1. Gå till hemsidan
2. Klicka på "Rörligt avtal" eller "Fastpris" i Hero-sektionen
3. Verifiera att leverantörslistan visas korrekt
4. Klicka på en leverantör och kontrollera att länken fungerar
5. Kontrollera att klicket spåras i `affiliate_clicks`-tabellen i Supabase

## Design och UX

- **Glassmorphism-stil** som matchar resten av sidan
- **Hover-effekter** på korten för bättre användarupplevelse
- **Responsiv design** som fungerar på mobil och desktop
- **"Rekommenderat"-badge** på Cheap Energy för att guida användare
- **2-kolumns grid** på desktop, 1 kolumn på mobil

## Tracking och Analytics

Alla klick på affiliate-länkar spåras med:
- TikTok Pixel (`ClickButton` event)
- Egen databas (`affiliate_clicks`-tabellen)
- Session ID för att kunna koppla klick till användare

## Nästa steg (valfritt)

1. **Admin-sida för affiliate-klick**
   - Skapa en admin-sida för att visa statistik över affiliate-klick
   - Gruppera per leverantör och kontraktstyp
   - Visa klick över tid

2. **A/B-testning**
   - Testa olika ordningar av leverantörer
   - Testa olika beskrivningar
   - Testa med/utan "Rekommenderat"-badge

3. **Lägg till fler leverantörer**
   - Enkelt att lägga till fler genom att kopiera en `<ProviderCard>`
   - Uppdatera grid om fler än 4 leverantörer (kanske 3-kolumns grid)

