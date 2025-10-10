-- Tabell för att spåra klick på affiliate-länkar
CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(100) NOT NULL,
  contract_type VARCHAR(20) NOT NULL CHECK (contract_type IN ('rorligt', 'fastpris')),
  url TEXT NOT NULL,
  session_id VARCHAR(255),
  user_agent TEXT,
  referer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index för bättre prestanda
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_provider ON affiliate_clicks(provider);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_contract_type ON affiliate_clicks(contract_type);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_created_at ON affiliate_clicks(created_at);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_session_id ON affiliate_clicks(session_id);

-- RLS (Row Level Security) - tillåt alla att läsa och skriva för tracking
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;

-- Policy för att tillåta alla att läsa (för admin-sidan)
CREATE POLICY "Allow all to read affiliate_clicks" ON affiliate_clicks
  FOR SELECT USING (true);

-- Policy för att tillåta alla att skriva (för tracking)
CREATE POLICY "Allow all to insert affiliate_clicks" ON affiliate_clicks
  FOR INSERT WITH CHECK (true);

-- Funktion för att rensa gamla poster (äldre än 1 år)
CREATE OR REPLACE FUNCTION cleanup_old_affiliate_clicks()
RETURNS void AS $$
BEGIN
  DELETE FROM affiliate_clicks 
  WHERE created_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;

-- Kommentarer för dokumentation
COMMENT ON TABLE affiliate_clicks IS 'Spårar klick på affiliate-länkar till elleverantörer';
COMMENT ON COLUMN affiliate_clicks.provider IS 'Namnet på leverantören (t.ex. Cheap Energy, Svekraft)';
COMMENT ON COLUMN affiliate_clicks.contract_type IS 'Typ av kontrakt (rorligt/fastpris)';
COMMENT ON COLUMN affiliate_clicks.url IS 'Affiliate-länken som användaren klickade på';
COMMENT ON COLUMN affiliate_clicks.session_id IS 'Session ID för att spåra användare';

