-- Lägg till kolumn för att spåra om affiliate-klick kom via robinhood-länken
ALTER TABLE affiliate_clicks 
ADD COLUMN IF NOT EXISTS came_via_robinhood BOOLEAN DEFAULT FALSE;

-- Index för bättre prestanda vid filtrering
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_robinhood ON affiliate_clicks(came_via_robinhood, created_at);

-- Kommentar
COMMENT ON COLUMN affiliate_clicks.came_via_robinhood IS 'Indikerar om användaren kom via robinhood-länken innan de klickade på affiliate-länken';
