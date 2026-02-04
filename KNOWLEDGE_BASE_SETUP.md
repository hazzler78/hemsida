# AI Kunskapsbas Setup Guide

## Översikt
Denna guide hjälper dig att sätta upp en dynamisk kunskapsbas för AI-chatten som kan uppdateras enkelt utan att ändra koden.

## Databas Setup

### 1. Skapa tabeller i Supabase
Kör följande SQL i Supabase SQL Editor:

```sql
-- Skapa ai_knowledge tabell
CREATE TABLE ai_knowledge (
  id SERIAL PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  -- Använd snake_case i databasen för konsekvens
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skapa ai_campaigns tabell
CREATE TABLE ai_campaigns (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  validFrom DATE NOT NULL,
  validTo DATE NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skapa ai_providers tabell
CREATE TABLE ai_providers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('rorligt', 'fastpris', 'foretag')),
  features TEXT[] NOT NULL DEFAULT '{}',
  url TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skapa index för effektiv sökning
CREATE INDEX idx_knowledge_category ON ai_knowledge(category, active);
CREATE INDEX idx_knowledge_keywords ON ai_knowledge USING GIN(keywords);
CREATE INDEX idx_campaigns_dates ON ai_campaigns(validFrom, validTo, active);
CREATE INDEX idx_providers_type ON ai_providers(type, active);
```

### 2. Lägg till exempeldata
Kör följande SQL för att lägga till grundläggande kunskap:

```sql
-- Lägg till exempel kunskapsartiklar
INSERT INTO ai_knowledge (category, question, answer, keywords, active) VALUES
('elavtal', 'Hur hittar jag bra elavtal?', 'Registrera din e-post i formuläret i foten av sidan för att få tidiga erbjudanden innan de blir fullbokade.', ARRAY['hitta', 'bra', 'erbjudanden', 'registrera', 'e-post'], true),
('elavtal', 'Vad ska jag välja - Fastpris eller Rörligt?', '**Fastpris**: Förutsägbart under hela avtalsperioden, bra om du vill undvika prisschocker. **Rörligt**: Följer marknaden, historiskt billigare över tid men kan variera. Fundera: Tror du elpriserna blir billigare eller dyrare framöver?', ARRAY['fastpris', 'rorligt', 'val', 'prisschocker', 'marknad'], true),
('byte', 'Måste jag säga upp mitt gamla elavtal om jag byter leverantör?', 'Nej, du behöver oftast inte säga upp ditt gamla elavtal själv. När du byter elleverantör hanterar den nya leverantören vanligtvis bytet åt dig, inklusive uppsägningen av ditt tidigare avtal.', ARRAY['uppsaga', 'gamla', 'avtal', 'byte', 'leverantör'], true),
('avgifter', 'Är det någon avgift för att säga upp ett elavtal?', 'Rörliga elavtal kan oftast sägas upp utan avgift och har normalt en uppsägningstid på en månad. Fastprisavtal däremot har en bindningstid, och om du vill avsluta avtalet i förtid kan det tillkomma en brytavgift (även kallad lösenavgift).', ARRAY['avgift', 'uppsaga', 'brytavgift', 'lösenavgift', 'bindningstid'], true),
('elomraden', 'Vilket Elområde/Elzon tillhör jag?', 'Sverige är indelat i fyra elområden: **SE1** - Norra Sverige, **SE2** - Norra Mellansverige, **SE3** - Södra Mellansverige, **SE4** - Södra Sverige. Vilket elområde du tillhör beror på var du bor och påverkar elpriset i din region.', ARRAY['elområde', 'elzon', 'SE1', 'SE2', 'SE3', 'SE4', 'region'], true),
('angerratt', 'Kan jag ångra mitt elavtal?', 'Ja, enligt distansavtalslagen har du ångerrätt i 14 dagar när du tecknar ett avtal på distans. Det innebär att du kan ångra avtalet utan kostnad inom denna period. Undantag: betald förbrukad el under ångerperioden.', ARRAY['ångra', 'avtal', '14 dagar', 'distansavtalslagen', 'kostnad'], true);

-- Lägg till exempel kampanjer
INSERT INTO ai_campaigns (title, description, validFrom, validTo, active) VALUES
('Rörligt avtal - 0 kr i avgifter', '0 kr i avgifter första året – utan bindningstid', '2025-01-01', '2025-12-31', true),
('Fastprisavtal med prisgaranti', 'Prisgaranti med valfri bindningstid (1-3 år)', '2025-01-01', '2025-12-31', true),
('Företagsavtal via Energi2.se', 'Särskilda företagsavtal för företag', '2025-01-01', '2025-12-31', true);

-- Lägg till exempel leverantörer
INSERT INTO ai_providers (name, type, features, url, active) VALUES
('Cheap Energy', 'rorligt', ARRAY['0 kr månadsavgift', '0 öre påslag', 'Ingen bindningstid'], 'https://www.cheapenergy.se/teckna-elavtal/?src=Elchef', true),
 ('Svealands Elbolag', 'fastpris', ARRAY['Prisgaranti', 'Valfri bindningstid', 'Inga dolda avgifter'], 'https://www.svealandselbolag.se/teckna-avtal/?src=Elchef', true),
('Energi2.se', 'foretag', ARRAY['Företagsavtal', 'Skräddarsydda lösningar', 'Volymrabatter'], 'https://energi2.se/elchef/', true);
```

## Användning

### 1. Admin-sida
Gå till `/admin/knowledge` för att hantera kunskapsbasen:
- **Lösenord**: `grodan2025`
- **Kunskapsartiklar**: Lägg till, redigera eller ta bort FAQ-artiklar
- **Kampanjer**: Hantera aktiva kampanjer och erbjudanden
- **Leverantörer**: Uppdatera leverantörsinformation

### 2. Automatisk uppdatering
Kunskapsbasen uppdateras automatiskt när du:
- Lägger till nya kunskapsartiklar
- Aktiverar/inaktiverar kampanjer
- Uppdaterar leverantörsinformation

### 3. AI-chatten använder kunskapsbasen
AI-chatten kommer automatiskt att:
- Hämta aktuell information från databasen
- Ge svar baserat på den senaste kunskapsbasen
- Inkludera aktuella kampanjer och erbjudanden

## Fördelar med denna lösning

✅ **Enkel uppdatering**: Uppdatera kunskap utan att ändra kod
✅ **Realtidsinformation**: AI:n får alltid senaste informationen
✅ **Strukturerad data**: Organiserad kunskapsbas med kategorier
✅ **Admin-gränssnitt**: Användarvänligt gränssnitt för uppdateringar
✅ **Automatisk synkronisering**: Ingen omstart av servern krävs

## Framtida utbyggnad

### 1. API-integration
Skapa API-endpoints för att:
- Hämta kunskap baserat på nyckelord
- Få aktuella kampanjer
- Hämta leverantörsinformation

### 2. Automatisk uppdatering
Implementera:
- Schemalagda uppdateringar
- Webhook-integration
- Import från externa källor

### 3. Analys och rapporter
Lägg till:
- Användningsstatistik
- Populära frågor
- Effektivitetsmätning

## Felsökning

### Vanliga problem:

**"Table does not exist"**
- Kontrollera att du körde SQL-koden i rätt databas
- Verifiera att tabellerna skapades korrekt

**"Permission denied"**
- Kontrollera att din Supabase-nyckel har rätt behörigheter
- Verifiera RLS-policies om de är aktiverade

**"Data not loading"**
- Kontrollera nätverksanslutningen
- Verifiera att miljövariablerna är korrekt inställda

## Support

Om du stöter på problem:
1. Kontrollera Supabase-loggarna
2. Verifiera databasanslutningen
3. Testa med en enkel fråga först
4. Kontrollera att alla tabeller finns och har rätt struktur
