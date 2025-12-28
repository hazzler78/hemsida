-- ============================================================================
-- PAGE PROVIDERS - Leverantörer för /rorligt-avtal och /fastpris-avtal sidorna
-- ============================================================================
-- Denna tabell hanterar leverantörerna som visas på avtals-sidorna

CREATE TABLE IF NOT EXISTS page_providers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('rorligt', 'fastpris')),
  logo_url VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  url TEXT NOT NULL,
  is_recommended BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index för bättre prestanda
CREATE INDEX IF NOT EXISTS idx_page_providers_type ON page_providers(type, active);
CREATE INDEX IF NOT EXISTS idx_page_providers_order ON page_providers(type, display_order, active);

-- RLS (Row Level Security)
ALTER TABLE page_providers ENABLE ROW LEVEL SECURITY;

-- Ta bort befintliga policies om de finns (säkert - skapar nya efteråt)
DROP POLICY IF EXISTS "Allow all to read page_providers" ON page_providers;
DROP POLICY IF EXISTS "Allow all operations for page_providers" ON page_providers;

-- Policy för att tillåta alla att läsa (för publika sidor)
CREATE POLICY "Allow all to read page_providers" ON page_providers
  FOR SELECT USING (true);

-- Policy för att tillåta alla att skriva (för admin-sidan)
CREATE POLICY "Allow all operations for page_providers" ON page_providers
  FOR ALL USING (true) WITH CHECK (true);

-- Funktion för att uppdatera updated_at automatiskt
CREATE OR REPLACE FUNCTION update_page_providers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger för att automatiskt uppdatera updated_at
-- OBS: DROP TRIGGER är säkert här eftersom vi använder IF EXISTS och skapar en ny direkt efteråt
DROP TRIGGER IF EXISTS trigger_update_page_providers_updated_at ON page_providers;
CREATE TRIGGER trigger_update_page_providers_updated_at
  BEFORE UPDATE ON page_providers
  FOR EACH ROW
  EXECUTE FUNCTION update_page_providers_updated_at();

-- Lägg till befintliga leverantörer från /rorligt-avtal
-- OBS: Använder WHERE NOT EXISTS för att säkerställa att inga befintliga rader skrivs över
INSERT INTO page_providers (name, type, logo_url, description, url, is_recommended, display_order, active)
SELECT * FROM (VALUES
  ('Cheap Energy', 'rorligt', '/cheap-logo.png', '0 kr i månadsavgift, 0 öre i påslag i 12 månader. Ingen bindningstid.', 'https://www.cheapenergy.se/teckna-elavtal-cheap-elchef/', true, 1, true),
  ('Svekraft', 'rorligt', '/svekraft-logo.png', '0 kr i månadsavgift i 12 månader, 7,99 öre i påslag. Ingen bindningstid.', 'https://www.svekraft.com/elchef-rorligt/', false, 2, true),
  ('Tibber', 'rorligt', '/tibber.png', '49 kr i månadsavgift, 8,6 öre i påslag. Ingen bindningstid.', 'https://go.adt242.com/t/t?a=1590956516&as=2012933659&t=2&tk=1', false, 3, true),
  ('Telinet Energi', 'rorligt', '/telinet.png', '59 kr i månadsavgift, 13,33 öre i påslag. Ingen bindningstid.', 'https://at.telinet.se/t/t?a=1870484942&as=2012933659&t=2&tk=1', false, 4, true),
  ('Fortum', 'rorligt', '/fortum.png', '69 kr i månadsavgift, 12,38 öre i påslag. Ingen bindningstid.', 'https://ion.fortum.com/t/t?a=1312475339&as=2012933659&t=2&tk=1', false, 5, true)
) AS v(name, type, logo_url, description, url, is_recommended, display_order, active)
WHERE NOT EXISTS (
  SELECT 1 FROM page_providers 
  WHERE page_providers.name = v.name AND page_providers.type = v.type
);

-- Lägg till befintliga leverantörer från /fastpris-avtal
-- OBS: Använder WHERE NOT EXISTS för att säkerställa att inga befintliga rader skrivs över
INSERT INTO page_providers (name, type, logo_url, description, url, is_recommended, display_order, active)
SELECT * FROM (VALUES
  ('Svealands Elbolag', 'fastpris', '/svealand-logo.png', 'Om du hittar ett billigare fastprisavtal på elmarknaden matchas priset – och du får dessutom 1 öre/kWh i extra rabatt. Ett pålitligt val för dig som vill ha kontroll över elkostnaderna.', 'https://www.svealandselbolag.se/elchef-fastpris/', true, 1, true),
  ('Cheap Energy', 'fastpris', '/cheap-logo.png', 'Konkurrenskraftiga fastpriser. Trygghet och förutsägbarhet för din elförbrukning.', 'https://www.cheapenergy.se/elchef-fastpris/', false, 2, true),
  ('Stockholms Elbolag', 'fastpris', '/stockholms-elbolag-logo.png', 'Fast elpris med tydliga villkor. Perfekt för dig som vill ha förutsägbara elkostnader.', 'https://www.stockholmselbolag.se/elavtal-elchef-fastpris/', false, 3, true),
  ('Svekraft', 'fastpris', '/svekraft-logo.png', 'Stabila fastpriser för din trygghet. Låsta priser som ger dig kontroll över din elbudget.', 'https://www.svekraft.com/elchef-fastpris/', false, 4, true)
) AS v(name, type, logo_url, description, url, is_recommended, display_order, active)
WHERE NOT EXISTS (
  SELECT 1 FROM page_providers 
  WHERE page_providers.name = v.name AND page_providers.type = v.type
);

-- Kommentarer för dokumentation
COMMENT ON TABLE page_providers IS 'Leverantörer som visas på /rorligt-avtal och /fastpris-avtal sidorna';
COMMENT ON COLUMN page_providers.type IS 'Typ av avtal: rorligt eller fastpris';
COMMENT ON COLUMN page_providers.logo_url IS 'Sökväg till logotypen (t.ex. /cheap-logo.png)';
COMMENT ON COLUMN page_providers.is_recommended IS 'Om leverantören ska visa "Rekommenderat" badge';
COMMENT ON COLUMN page_providers.display_order IS 'Ordning på sidan (lägre nummer = högre upp)';

