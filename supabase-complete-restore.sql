-- ============================================================================
-- KOMPLETT SUPABASE DATABAS RESTAURERING FÖR ELCHEF.SE
-- ============================================================================
-- Detta skript återskapar ALLA tabeller, index, policies och funktioner
-- som behövs för din Elchef-hemsida efter en databasradering.
--
-- KÖR DETTA I SUPABASE SQL EDITOR
-- ============================================================================

-- ============================================================================
-- 1. INVOICE OCR - Huvudtabell för AI-analys av elräkningar
-- ============================================================================

CREATE TABLE IF NOT EXISTS invoice_ocr (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255),
  user_agent TEXT,
  file_mime VARCHAR(100),
  file_size INTEGER,
  image_sha256 TEXT,
  model VARCHAR(50),
  system_prompt_version VARCHAR(100),
  gpt_answer TEXT,
  is_correct BOOLEAN,
  correction_notes TEXT,
  corrected_total_extra DECIMAL(10,2),
  corrected_savings DECIMAL(10,2),
  consent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index för invoice_ocr
CREATE INDEX IF NOT EXISTS idx_invoice_ocr_session_id ON invoice_ocr(session_id);
CREATE INDEX IF NOT EXISTS idx_invoice_ocr_created_at ON invoice_ocr(created_at);
CREATE INDEX IF NOT EXISTS idx_invoice_ocr_image_sha256 ON invoice_ocr(image_sha256);
CREATE INDEX IF NOT EXISTS idx_invoice_ocr_consent ON invoice_ocr(consent);

-- RLS för invoice_ocr
ALTER TABLE invoice_ocr ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on invoice_ocr" ON invoice_ocr;
CREATE POLICY "Allow all operations on invoice_ocr" ON invoice_ocr
  FOR ALL USING (true);

-- Kommentarer
COMMENT ON TABLE invoice_ocr IS 'Huvudtabell för AI-analys av elräkningar med GPT-4';
COMMENT ON COLUMN invoice_ocr.image_sha256 IS 'SHA256 hash av bilden för deduplikering';
COMMENT ON COLUMN invoice_ocr.consent IS 'Om användaren gett samtycke till att spara bilden';

-- ============================================================================
-- 2.1 INVOICE OCR FILES - Referenser till uppladdade fakturabilder
-- ============================================================================

CREATE TABLE IF NOT EXISTS invoice_ocr_files (
  id SERIAL PRIMARY KEY,
  invoice_ocr_id INTEGER NOT NULL REFERENCES invoice_ocr(id) ON DELETE CASCADE,
  storage_key TEXT NOT NULL,
  image_sha256 TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index för invoice_ocr_files
CREATE INDEX IF NOT EXISTS idx_invoice_ocr_files_invoice_id ON invoice_ocr_files(invoice_ocr_id);
CREATE INDEX IF NOT EXISTS idx_invoice_ocr_files_created_at ON invoice_ocr_files(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS ux_invoice_ocr_files_invoice_sha ON invoice_ocr_files(invoice_ocr_id, image_sha256);

-- RLS för invoice_ocr_files
ALTER TABLE invoice_ocr_files ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all to read invoice_ocr_files" ON invoice_ocr_files;
DROP POLICY IF EXISTS "Allow all to insert invoice_ocr_files" ON invoice_ocr_files;
CREATE POLICY "Allow all to read invoice_ocr_files" ON invoice_ocr_files FOR SELECT USING (true);
CREATE POLICY "Allow all to insert invoice_ocr_files" ON invoice_ocr_files FOR INSERT WITH CHECK (true);

-- Kommentarer
COMMENT ON TABLE invoice_ocr_files IS 'Mappar uppladdade fakturabilder i storage till invoice_ocr poster';
COMMENT ON COLUMN invoice_ocr_files.storage_key IS 'Nyckel i storage bucket invoice-ocr';

-- ============================================================================
-- 2. INVOICE OCR LOGS - Äldre loggningstabell
-- ============================================================================

CREATE TABLE IF NOT EXISTS invoice_ocr_logs (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255),
  file_name VARCHAR(255),
  file_size INTEGER,
  gpt_answer TEXT,
  processing_time_ms INTEGER,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index för invoice_ocr_logs
CREATE INDEX IF NOT EXISTS idx_invoice_ocr_logs_session_id ON invoice_ocr_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_invoice_ocr_logs_created_at ON invoice_ocr_logs(created_at);

-- RLS för invoice_ocr_logs
ALTER TABLE invoice_ocr_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on invoice_ocr_logs" ON invoice_ocr_logs;
CREATE POLICY "Allow all operations on invoice_ocr_logs" ON invoice_ocr_logs
  FOR ALL USING (true);

-- ============================================================================
-- 3. CONTRACT CLICKS - Spårning av kontraktsklick
-- ============================================================================

CREATE TABLE IF NOT EXISTS contract_clicks (
  id SERIAL PRIMARY KEY,
  contract_type VARCHAR(20) NOT NULL CHECK (contract_type IN ('rorligt', 'fastpris')),
  log_id INTEGER REFERENCES invoice_ocr(id) ON DELETE SET NULL,
  savings_amount DECIMAL(10,2),
  session_id VARCHAR(255),
  source VARCHAR(50) DEFAULT 'jamfor-elpriser',
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  user_agent TEXT,
  referer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index för contract_clicks
CREATE INDEX IF NOT EXISTS idx_contract_clicks_log_id ON contract_clicks(log_id);
CREATE INDEX IF NOT EXISTS idx_contract_clicks_contract_type ON contract_clicks(contract_type);
CREATE INDEX IF NOT EXISTS idx_contract_clicks_created_at ON contract_clicks(created_at);
CREATE INDEX IF NOT EXISTS idx_contract_clicks_source ON contract_clicks(source);

-- RLS för contract_clicks
ALTER TABLE contract_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all to read contract_clicks" ON contract_clicks
  FOR SELECT USING (true);
CREATE POLICY "Allow all to insert contract_clicks" ON contract_clicks
  FOR INSERT WITH CHECK (true);

-- Cleanup-funktion för gamla poster
CREATE OR REPLACE FUNCTION cleanup_old_contract_clicks()
RETURNS void AS $$
BEGIN
  DELETE FROM contract_clicks 
  WHERE created_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;

-- Kommentarer
COMMENT ON TABLE contract_clicks IS 'Spårar klick på kontraktsknappar från användare som har fått AI-analys';
COMMENT ON COLUMN contract_clicks.contract_type IS 'Typ av kontrakt som klickades på (rorligt/fastpris)';
COMMENT ON COLUMN contract_clicks.log_id IS 'Referens till invoice_ocr för att koppla till AI-analys';
COMMENT ON COLUMN contract_clicks.savings_amount IS 'Besparingsbelopp från AI-analysen';
COMMENT ON COLUMN contract_clicks.source IS 'Varifrån klicket kom (jamfor-elpriser, hero, etc.)';

-- ============================================================================
-- 4. PAGE VIEWS - Spårning av sidvisningar
-- ============================================================================

CREATE TABLE IF NOT EXISTS page_views (
  id SERIAL PRIMARY KEY,
  path TEXT,
  session_id VARCHAR(255),
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  user_agent TEXT,
  referer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index för page_views
CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(path);
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at);

-- RLS för page_views
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all to read page_views" ON page_views FOR SELECT USING (true);
CREATE POLICY "Allow all to insert page_views" ON page_views FOR INSERT WITH CHECK (true);

-- ============================================================================
-- 5. SHARE CLICKS - Spårning av social delning
-- ============================================================================

CREATE TABLE IF NOT EXISTS share_clicks (
  id SERIAL PRIMARY KEY,
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'twitter')),
  log_id INTEGER REFERENCES invoice_ocr_logs(id) ON DELETE SET NULL,
  savings_amount DECIMAL(10,2),
  session_id VARCHAR(255),
  user_agent TEXT,
  referer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index för share_clicks
CREATE INDEX IF NOT EXISTS idx_share_clicks_platform ON share_clicks(platform);
CREATE INDEX IF NOT EXISTS idx_share_clicks_created_at ON share_clicks(created_at);
CREATE INDEX IF NOT EXISTS idx_share_clicks_log_id ON share_clicks(log_id);

-- RLS för share_clicks
ALTER TABLE share_clicks ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. SHARED CALCULATIONS - Delade kalkyler
-- ============================================================================

CREATE TABLE IF NOT EXISTS shared_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id INTEGER REFERENCES invoice_ocr_logs(id) ON DELETE CASCADE,
  savings_amount DECIMAL(10,2) NOT NULL,
  platform VARCHAR(20) NOT NULL,
  is_anonymous BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index för shared_calculations
CREATE INDEX IF NOT EXISTS idx_shared_calculations_log_id ON shared_calculations(log_id);
CREATE INDEX IF NOT EXISTS idx_shared_calculations_expires_at ON shared_calculations(expires_at);

-- RLS för shared_calculations
ALTER TABLE shared_calculations ENABLE ROW LEVEL SECURITY;

-- Policies för social delning (idempotenta)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Allow all operations on share_clicks' 
      AND schemaname = 'public' 
      AND tablename = 'share_clicks'
  ) THEN
    CREATE POLICY "Allow all operations on share_clicks" ON share_clicks
      FOR ALL USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Allow read active shared calculations' 
      AND schemaname = 'public' 
      AND tablename = 'shared_calculations'
  ) THEN
    CREATE POLICY "Allow read active shared calculations" ON shared_calculations
      FOR SELECT USING (expires_at > NOW());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Allow insert shared calculations' 
      AND schemaname = 'public' 
      AND tablename = 'shared_calculations'
  ) THEN
    CREATE POLICY "Allow insert shared calculations" ON shared_calculations
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Cleanup-funktion för gamla delningar
CREATE OR REPLACE FUNCTION cleanup_expired_shared_calculations()
RETURNS void AS $$
BEGIN
  DELETE FROM shared_calculations WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Kommentarer
COMMENT ON TABLE share_clicks IS 'Spårar när användare delar sina AI-kalkyler på sociala medier';
COMMENT ON TABLE shared_calculations IS 'Lagrar delade kalkyler med begränsad livslängd för säkerhet';
COMMENT ON COLUMN share_clicks.platform IS 'Social media plattform där kalkylen delades';
COMMENT ON COLUMN share_clicks.savings_amount IS 'Besparingsbelopp från AI-analysen';
COMMENT ON COLUMN shared_calculations.expires_at IS 'När den delade kalkylen automatiskt tas bort';

-- ============================================================================
-- 7. AI KNOWLEDGE BASE - Kunskapsbas för AI-chatten
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_knowledge (
  id SERIAL PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index för ai_knowledge
CREATE INDEX IF NOT EXISTS idx_knowledge_category ON ai_knowledge(category, active);
CREATE INDEX IF NOT EXISTS idx_knowledge_keywords ON ai_knowledge USING GIN(keywords);

-- RLS för ai_knowledge
ALTER TABLE ai_knowledge ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all to read ai_knowledge" ON ai_knowledge FOR SELECT USING (true);

-- ============================================================================
-- 8. AI CAMPAIGNS - Kampanjer för AI-chatten
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_campaigns (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  validFrom DATE NOT NULL,
  validTo DATE NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index för ai_campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON ai_campaigns(validFrom, validTo, active);

-- RLS för ai_campaigns
ALTER TABLE ai_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all to read ai_campaigns" ON ai_campaigns FOR SELECT USING (true);

-- ============================================================================
-- 9. AI PROVIDERS - Elleverantörer för AI-chatten
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_providers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('rorligt', 'fastpris', 'foretag')),
  features TEXT[] NOT NULL DEFAULT '{}',
  url TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index för ai_providers
CREATE INDEX IF NOT EXISTS idx_providers_type ON ai_providers(type, active);

-- RLS för ai_providers
ALTER TABLE ai_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all to read ai_providers" ON ai_providers FOR SELECT USING (true);

-- ============================================================================
-- 10. CUSTOMER REMINDERS - Kundpåminnelser
-- ============================================================================

CREATE TABLE IF NOT EXISTS customer_reminders (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  contract_type VARCHAR(20) NOT NULL CHECK (contract_type IN ('12_months', '24_months', '36_months', 'variable')),
  contract_start_date DATE NOT NULL,
  reminder_date DATE NOT NULL,
  is_sent BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index för customer_reminders
CREATE INDEX IF NOT EXISTS idx_reminder_date ON customer_reminders(reminder_date, is_sent);
CREATE INDEX IF NOT EXISTS idx_customer_email ON customer_reminders(email);

-- RLS för customer_reminders
ALTER TABLE customer_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for customer_reminders" ON customer_reminders
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- 11. PENDING REMINDERS - Väntande påminnelser
-- ============================================================================

CREATE TABLE IF NOT EXISTS pending_reminders (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index för pending_reminders
CREATE INDEX IF NOT EXISTS idx_pending_created_at ON pending_reminders(created_at);

-- RLS för pending_reminders
ALTER TABLE pending_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for pending_reminders" ON pending_reminders
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- 12. AFFILIATE APPLICATIONS - Affiliateansökningar
-- ============================================================================

CREATE TABLE IF NOT EXISTS affiliate_applications (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  channel VARCHAR(255),
  followers VARCHAR(100),
  notes TEXT,
  ref VARCHAR(100),
  campaign_code VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index för affiliate_applications
CREATE INDEX IF NOT EXISTS idx_affiliate_email ON affiliate_applications(email);
CREATE INDEX IF NOT EXISTS idx_affiliate_created_at ON affiliate_applications(created_at);

-- RLS för affiliate_applications
ALTER TABLE affiliate_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all to insert affiliate_applications" ON affiliate_applications
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- 13. COMPANY PARTNER APPLICATIONS - Företagspartneransökningar
-- ============================================================================

CREATE TABLE IF NOT EXISTS company_partner_applications (
  id SERIAL PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  org_number VARCHAR(50),
  contact_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  website TEXT,
  partnership_type VARCHAR(100),
  est_volume VARCHAR(100),
  notes TEXT,
  ref VARCHAR(100),
  campaign_code VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index för company_partner_applications
CREATE INDEX IF NOT EXISTS idx_partner_email ON company_partner_applications(email);
CREATE INDEX IF NOT EXISTS idx_partner_created_at ON company_partner_applications(created_at);

-- RLS för company_partner_applications
ALTER TABLE company_partner_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all to insert company_partner_applications" ON company_partner_applications
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- 14. CONTACTS - Kontaktförfrågningar
-- ============================================================================

CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  message TEXT,
  ref VARCHAR(100),
  campaign_code VARCHAR(100),
  subscribe_newsletter BOOLEAN DEFAULT FALSE,
  form_type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index för contacts
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at);
CREATE INDEX IF NOT EXISTS idx_contacts_form_type ON contacts(form_type);

-- RLS för contacts
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all to insert contacts" ON contacts
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- EXEMPELDATA FÖR AI KUNSKAPSBAS
-- ============================================================================

-- Lägg till exempel kunskapsartiklar
INSERT INTO ai_knowledge (category, question, answer, keywords, active) VALUES
('elavtal', 'Hur hittar jag bra elavtal?', 'Registrera din e-post i formuläret i foten av sidan för att få tidiga erbjudanden innan de blir fullbokade.', ARRAY['hitta', 'bra', 'erbjudanden', 'registrera', 'e-post'], true),
('elavtal', 'Vad ska jag välja - Fastpris eller Rörligt?', '**Fastpris**: Förutsägbart under hela avtalsperioden, bra om du vill undvika prisschocker. **Rörligt**: Följer marknaden, historiskt billigare över tid men kan variera. Fundera: Tror du elpriserna blir billigare eller dyrare framöver?', ARRAY['fastpris', 'rorligt', 'val', 'prisschocker', 'marknad'], true),
('byte', 'Måste jag säga upp mitt gamla elavtal om jag byter leverantör?', 'Nej, du behöver oftast inte säga upp ditt gamla elavtal själv. När du byter elleverantör hanterar den nya leverantören vanligtvis bytet åt dig, inklusive uppsägningen av ditt tidigare avtal.', ARRAY['uppsaga', 'gamla', 'avtal', 'byte', 'leverantör'], true),
('avgifter', 'Är det någon avgift för att säga upp ett elavtal?', 'Rörliga elavtal kan oftast sägas upp utan avgift och har normalt en uppsägningstid på en månad. Fastprisavtal däremot har en bindningstid, och om du vill avsluta avtalet i förtid kan det tillkomma en brytavgift (även kallad lösenavgift).', ARRAY['avgift', 'uppsaga', 'brytavgift', 'lösenavgift', 'bindnistid'], true),
('elomraden', 'Vilket Elområde/Elzon tillhör jag?', 'Sverige är indelat i fyra elområden: **SE1** - Norra Sverige, **SE2** - Norra Mellansverige, **SE3** - Södra Mellansverige, **SE4** - Södra Sverige. Vilket elområde du tillhör beror på var du bor och påverkar elpriset i din region.', ARRAY['elområde', 'elzon', 'SE1', 'SE2', 'SE3', 'SE4', 'region'], true),
('angerratt', 'Kan jag ångra mitt elavtal?', 'Ja, enligt distansavtalslagen har du ångerrätt i 14 dagar när du tecknar ett avtal på distans. Det innebär att du kan ångra avtalet utan kostnad inom denna period. Undantag: betald förbrukad el under ångerperioden.', ARRAY['ångra', 'avtal', '14 dagar', 'distansavtalslagen', 'kostnad'], true)
ON CONFLICT DO NOTHING;

-- Lägg till exempel kampanjer
INSERT INTO ai_campaigns (title, description, validFrom, validTo, active) VALUES
('Rörligt avtal - 0 kr i avgifter', '0 kr i avgifter första året – utan bindningstid', '2025-01-01', '2025-12-31', true),
('Fastprisavtal med prisgaranti', 'Prisgaranti med valfri bindningstid (1-3 år)', '2025-01-01', '2025-12-31', true),
('Företagsavtal via Energi2.se', 'Särskilda företagsavtal för företag', '2025-01-01', '2025-12-31', true)
ON CONFLICT DO NOTHING;

-- Lägg till exempel leverantörer
INSERT INTO ai_providers (name, type, features, url, active) VALUES
('Cheap Energy', 'rorligt', ARRAY['0 kr månadsavgift', '0 öre påslag', 'Ingen bindningstid'], 'https://www.cheapenergy.se/teckna-elavtal/?src=Elchef', true),
('Svealands Elbolag', 'fastpris', ARRAY['Prisgaranti', 'Valfri bindningstid', 'Inga dolda avgifter'], 'https://www.svealandselbolag.se/teckna-avtal/?src=Elchef', true),
('Energi2.se', 'foretag', ARRAY['Företagsavtal', 'Skräddarsydda lösningar', 'Volymrabatter'], 'https://energi2.se/elchef/', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- FÄRDIGT!
-- ============================================================================

-- Verifiera att alla tabeller skapades korrekt
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Visa antalet policies
SELECT schemaname, tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

