-- ============================================================================
-- SALES TRACKING - Koppla försäljningar till affiliate-klick
-- ============================================================================
-- Detta script lägger till möjlighet att spåra vilka affiliate-klick som leder till försäljningar

-- 1. Lägg till tracking_id kolumn i affiliate_clicks (om den inte finns)
ALTER TABLE affiliate_clicks 
ADD COLUMN IF NOT EXISTS tracking_id VARCHAR(255) UNIQUE;

-- Skapa index för snabbare sökningar
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_tracking_id ON affiliate_clicks(tracking_id);

-- 2. Skapa tabell för försäljningar
CREATE TABLE IF NOT EXISTS affiliate_sales (
  id SERIAL PRIMARY KEY,
  tracking_id VARCHAR(255) NOT NULL UNIQUE,
  affiliate_click_id INTEGER REFERENCES affiliate_clicks(id),
  provider VARCHAR(100) NOT NULL,
  contract_type VARCHAR(20) NOT NULL CHECK (contract_type IN ('rorligt', 'fastpris')),
  sale_amount DECIMAL(10, 2), -- Valfritt: Belopp för försäljningen
  customer_email VARCHAR(255), -- Valfritt: Kunds e-post (om tillgängligt)
  sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source VARCHAR(50), -- 'webhook', 'manual', 'api'
  notes TEXT, -- Ytterligare information om försäljningen
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index för bättre prestanda
CREATE INDEX IF NOT EXISTS idx_affiliate_sales_tracking_id ON affiliate_sales(tracking_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_sales_affiliate_click_id ON affiliate_sales(affiliate_click_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_sales_provider ON affiliate_sales(provider);
CREATE INDEX IF NOT EXISTS idx_affiliate_sales_sale_date ON affiliate_sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_affiliate_sales_created_at ON affiliate_sales(created_at);

-- RLS (Row Level Security)
ALTER TABLE affiliate_sales ENABLE ROW LEVEL SECURITY;

-- Policy för att tillåta alla att läsa (för admin-sidan)
CREATE POLICY "Allow all to read affiliate_sales" ON affiliate_sales
  FOR SELECT USING (true);

-- Policy för att tillåta alla att skriva (för webhook)
CREATE POLICY "Allow all to insert affiliate_sales" ON affiliate_sales
  FOR INSERT WITH CHECK (true);

-- Policy för att tillåta uppdatering (för admin)
CREATE POLICY "Allow all to update affiliate_sales" ON affiliate_sales
  FOR UPDATE USING (true);

-- Funktion för att automatiskt uppdatera updated_at
CREATE OR REPLACE FUNCTION update_affiliate_sales_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger för att automatiskt uppdatera updated_at
DROP TRIGGER IF EXISTS trigger_update_affiliate_sales_updated_at ON affiliate_sales;
CREATE TRIGGER trigger_update_affiliate_sales_updated_at
  BEFORE UPDATE ON affiliate_sales
  FOR EACH ROW
  EXECUTE FUNCTION update_affiliate_sales_updated_at();

-- Funktion för att automatiskt koppla försäljning till affiliate-klick
CREATE OR REPLACE FUNCTION link_sale_to_click()
RETURNS TRIGGER AS $$
BEGIN
  -- Försök hitta affiliate-klicket baserat på tracking_id
  IF NEW.affiliate_click_id IS NULL AND NEW.tracking_id IS NOT NULL THEN
    UPDATE affiliate_sales
    SET affiliate_click_id = (
      SELECT id FROM affiliate_clicks 
      WHERE tracking_id = NEW.tracking_id 
      LIMIT 1
    )
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger för att automatiskt koppla försäljning till affiliate-klick
DROP TRIGGER IF EXISTS trigger_link_sale_to_click ON affiliate_sales;
CREATE TRIGGER trigger_link_sale_to_click
  AFTER INSERT ON affiliate_sales
  FOR EACH ROW
  EXECUTE FUNCTION link_sale_to_click();

-- Kommentarer för dokumentation
COMMENT ON TABLE affiliate_sales IS 'Spårar försäljningar från affiliate-klick';
COMMENT ON COLUMN affiliate_sales.tracking_id IS 'Unikt ID som skickas med i affiliate-länken';
COMMENT ON COLUMN affiliate_sales.affiliate_click_id IS 'Koppling till affiliate_clicks tabellen';
COMMENT ON COLUMN affiliate_sales.provider IS 'Leverantör som sålde avtalet';
COMMENT ON COLUMN affiliate_sales.contract_type IS 'Typ av avtal (rorligt/fastpris)';
COMMENT ON COLUMN affiliate_sales.sale_amount IS 'Värde på försäljningen (om känt)';
COMMENT ON COLUMN affiliate_sales.source IS 'Varifrån försäljningen kom (webhook/manual/api)';
