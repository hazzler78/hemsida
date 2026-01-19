# Försäljningstracking - Koppla försäljningar till affiliate-klick

## Problem

Vi vet att vi har fått försäljningar från affiliate-klick, men vi vet inte **vilka** affiliate-länkar som ledde till försäljningarna.

**Exempel:**
- 181 besök → 27 affiliate-klick → 2 försäljningar
- Men vilka av de 27 klicken ledde till de 2 försäljningarna?

## Lösning

Vi har implementerat ett tracking-system som kopplar försäljningar till affiliate-klick via unika tracking-ID:n.

---

## Hur det fungerar

### 1. När användaren klickar på affiliate-länk

**Vad som händer:**
1. Ett unikt tracking-ID genereras: `elchef_20240115_143022_ABC123`
2. Tracking-ID sparas i `affiliate_clicks` tabellen
3. Tracking-ID läggs till i affiliate-länken som `?elchef_ref=elchef_20240115_143022_ABC123`
4. Användaren skickas till leverantörens sida med tracking-ID i URL:en

**Exempel på affiliate-länk:**
```
https://cheapenergy.se/elchef-rorligt/?elchef_ref=elchef_20240115_143022_ABC123
```

### 2. När en försäljning sker

**Alternativ A: Automatisk via webhook (rekommenderat)**
- Leverantören anropar vår webhook när en försäljning sker
- Webhook: `POST /api/webhooks/sales`
- Leverantören skickar tracking-ID:t från URL:en

**Alternativ B: Manuell registrering**
- Du registrerar försäljningen manuellt via admin-sidan eller API
- Använd tracking-ID:t för att koppla till affiliate-klicket

---

## Setup

### Steg 1: Kör SQL-scriptet

Kör `supabase-sales-tracking.sql` i Supabase SQL Editor:

```sql
-- Detta skapar:
-- 1. tracking_id kolumn i affiliate_clicks
-- 2. affiliate_sales tabell för försäljningar
-- 3. Automatisk koppling mellan försäljningar och affiliate-klick
```

### Steg 2: Uppdatera leverantörer (om de stödjer webhooks)

Kontakta leverantörerna och be dem:
1. Läsa `elchef_ref` parametern från URL:en när kunden registrerar sig
2. Anropa vår webhook när en försäljning sker:
   ```
   POST https://elchef.se/api/webhooks/sales
   {
     "trackingId": "elchef_20240115_143022_ABC123",
     "provider": "Cheap Energy",
     "contractType": "rorligt",
     "saleAmount": 15000.00,  // Valfritt
     "customerEmail": "kund@example.com"  // Valfritt
   }
   ```

---

## Webhook API

### Endpoint: `POST /api/webhooks/sales`

**Request Body:**
```json
{
  "trackingId": "elchef_20240115_143022_ABC123",  // Krävs - från affiliate-länken
  "provider": "Cheap Energy",                      // Krävs - leverantörens namn
  "contractType": "rorligt",                       // Krävs - "rorligt" eller "fastpris"
  "saleAmount": 15000.00,                          // Valfritt - belopp för försäljningen
  "customerEmail": "kund@example.com",             // Valfritt - kunds e-post
  "notes": "Försäljning genomförd"                 // Valfritt - ytterligare info
}
```

**Response (Success):**
```json
{
  "ok": true,
  "saleId": 123,
  "message": "Försäljning registrerad",
  "affiliateClickId": 456
}
```

**Response (Error):**
```json
{
  "error": "trackingId krävs"
}
```

---

## Manuell registrering av försäljningar

Om leverantörerna inte stödjer webhooks kan du registrera försäljningar manuellt:

### Via SQL:
```sql
INSERT INTO affiliate_sales (
  tracking_id,
  provider,
  contract_type,
  sale_amount,
  source
) VALUES (
  'elchef_20240115_143022_ABC123',  -- Hitta detta från affiliate_clicks tabellen
  'Cheap Energy',
  'rorligt',
  15000.00,
  'manual'
);
```

### Via API (kommer snart):
```bash
POST /api/admin/sales
Authorization: Bearer <admin-token>
{
  "trackingId": "elchef_20240115_143022_ABC123",
  "provider": "Cheap Energy",
  "contractType": "rorligt",
  "saleAmount": 15000.00
}
```

---

## Analysera försäljningar

### Hitta vilka affiliate-klick som ledde till försäljningar:

```sql
SELECT 
  ac.id as click_id,
  ac.tracking_id,
  ac.provider,
  ac.contract_type,
  ac.created_at as click_tid,
  s.id as sale_id,
  s.sale_amount,
  s.sale_date,
  EXTRACT(EPOCH FROM (s.sale_date - ac.created_at)) / 3600 as timmar_mellan_klick_och_forsaljning
FROM affiliate_clicks ac
INNER JOIN affiliate_sales s ON ac.tracking_id = s.tracking_id
ORDER BY s.sale_date DESC;
```

### Konverteringsgrad per leverantör:

```sql
SELECT 
  provider,
  COUNT(DISTINCT ac.id) as total_klick,
  COUNT(DISTINCT s.id) as total_forsaljningar,
  ROUND(COUNT(DISTINCT s.id) * 100.0 / COUNT(DISTINCT ac.id), 2) as konverteringsgrad_procent
FROM affiliate_clicks ac
LEFT JOIN affiliate_sales s ON ac.tracking_id = s.tracking_id
WHERE ac.created_at >= NOW() - INTERVAL '30 days'
GROUP BY provider
ORDER BY konverteringsgrad_procent DESC;
```

### Konverteringsgrad totalt:

```sql
SELECT 
  COUNT(DISTINCT ac.id) as total_affiliate_klick,
  COUNT(DISTINCT s.id) as total_forsaljningar,
  ROUND(COUNT(DISTINCT s.id) * 100.0 / COUNT(DISTINCT ac.id), 2) as konverteringsgrad_procent
FROM affiliate_clicks ac
LEFT JOIN affiliate_sales s ON ac.tracking_id = s.tracking_id
WHERE ac.created_at >= NOW() - INTERVAL '30 days';
```

---

## Exempel: Dina siffror

**Nuvarande situation:**
- 181 besök
- 27 affiliate-klick
- 2 försäljningar
- **Men vi vet inte vilka klick som ledde till försäljningarna**

**Efter implementering:**
- Varje affiliate-klick får ett unikt tracking-ID
- När en försäljning sker kan vi koppla den till rätt klick
- Vi kan se exakt vilka leverantörer och länkar som ger försäljningar

**Exempel på data efter implementering:**
```
Affiliate-klick:
- elchef_20240115_143022_ABC123 → Cheap Energy (rorligt)
- elchef_20240115_143022_DEF456 → Svekraft (rorligt)
- elchef_20240115_143022_GHI789 → Cheap Energy (rorligt)
... (27 totalt)

Försäljningar:
- elchef_20240115_143022_ABC123 → Försäljning #1 (Cheap Energy)
- elchef_20240115_143022_GHI789 → Försäljning #2 (Cheap Energy)

Resultat:
- Cheap Energy: 2 försäljningar av X klick = Y% konvertering
- Svekraft: 0 försäljningar av Y klick = 0% konvertering
```

---

## Nästa steg

1. ✅ **Kör SQL-scriptet** (`supabase-sales-tracking.sql`)
2. ✅ **Koden är redan uppdaterad** - tracking-ID läggs automatiskt till i affiliate-länkar
3. ⏳ **Kontakta leverantörer** - Be dem implementera webhook-anrop när försäljningar sker
4. ⏳ **Registrera befintliga försäljningar** - Om möjligt, koppla de 2 försäljningarna manuellt
5. ⏳ **Skapa admin-sida** - För att enkelt registrera och se försäljningar

---

## Hantera befintliga försäljningar

Om du har försäljningar som skedde innan tracking-ID implementerades:

### Alternativ 1: Registrera utan tracking-ID (om du vet vilken leverantör)

```sql
INSERT INTO affiliate_sales (
  tracking_id,
  provider,
  contract_type,
  source,
  notes
) VALUES (
  'manual_' || NOW()::text || '_' || RANDOM()::text,  -- Generera unikt ID
  'Cheap Energy',  -- Vilken leverantör?
  'rorligt',  -- Vilken avtalstyp?
  'manual',
  'Försäljning registrerad manuellt - saknar tracking-ID'
);
```

### Alternativ 2: Försök matcha baserat på tid och leverantör

Om du vet ungefär när försäljningen skedde och vilken leverantör:

```sql
-- Hitta affiliate-klick som matchar tidsintervall och leverantör
SELECT 
  id,
  tracking_id,
  provider,
  contract_type,
  created_at
FROM affiliate_clicks
WHERE provider = 'Cheap Energy'
  AND contract_type = 'rorligt'
  AND created_at BETWEEN '2024-01-15 10:00:00' AND '2024-01-15 18:00:00'
ORDER BY created_at DESC;

-- Använd tracking_id från resultatet för att registrera försäljningen
INSERT INTO affiliate_sales (
  tracking_id,
  affiliate_click_id,
  provider,
  contract_type,
  source,
  notes
) VALUES (
  'elchef_20240115_143022_ABC123',  -- Från ovanstående query
  123,  -- affiliate_click_id från ovanstående query
  'Cheap Energy',
  'rorligt',
  'manual',
  'Försäljning kopplad manuellt baserat på tid och leverantör'
);
```

### Alternativ 3: Registrera som "Okänd källa"

Om du inte vet vilken leverantör eller när:

```sql
INSERT INTO affiliate_sales (
  tracking_id,
  provider,
  contract_type,
  source,
  notes
) VALUES (
  'unknown_' || NOW()::text || '_' || RANDOM()::text,
  'Okänd',  -- Eller den mest troliga leverantören
  'rorligt',  -- Eller den mest troliga avtalstypen
  'manual',
  'Försäljning registrerad manuellt - saknar tracking-data'
);
```

---

## Viktiga poänger

- **Tracking-ID är unikt** - Varje affiliate-klick får sitt eget ID
- **Tracking-ID finns i URL:en** - Leverantören kan läsa det från `elchef_ref` parametern
- **Automatisk koppling** - Om tracking-ID matchar kopplas försäljningen automatiskt till affiliate-klicket
- **Manuell registrering** - Om webhook inte fungerar kan du registrera försäljningar manuellt
- **Ingen dubbelregistrering** - Systemet förhindrar att samma försäljning registreras två gånger

---

## Begränsningar

- **Leverantörer måste stödja webhooks** - Om de inte gör det måste du registrera manuellt
- **Tracking-ID måste finnas i URL:en** - Om användaren kopierar länken utan parametrar försvinner tracking-ID:t
- **Tidsbegränsning** - Försäljningar kan skapa flera dagar efter klicket (detta är OK, systemet hanterar det)
