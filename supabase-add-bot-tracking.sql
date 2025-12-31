-- Migration: Lägg till bot-tracking i page_views tabellen
-- Detta gör det möjligt att filtrera bort botar och preview-deployments

-- Lägg till kolumner om de inte redan finns
DO $$ 
BEGIN
  -- Lägg till is_bot kolumn
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'page_views' AND column_name = 'is_bot'
  ) THEN
    ALTER TABLE page_views ADD COLUMN is_bot BOOLEAN DEFAULT FALSE;
  END IF;

  -- Lägg till is_preview kolumn
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'page_views' AND column_name = 'is_preview'
  ) THEN
    ALTER TABLE page_views ADD COLUMN is_preview BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Uppdatera befintliga rader baserat på user_agent
-- (Detta är en engångs-uppdatering för befintlig data)
UPDATE page_views 
SET is_bot = TRUE
WHERE (
  user_agent ILIKE '%bot%' 
  OR user_agent ILIKE '%crawler%' 
  OR user_agent ILIKE '%spider%' 
  OR user_agent ILIKE '%scraper%'
  OR user_agent ILIKE '%googlebot%'
  OR user_agent ILIKE '%bingbot%'
  OR user_agent ILIKE '%slurp%'
  OR user_agent ILIKE '%duckduckbot%'
  OR user_agent ILIKE '%baiduspider%'
  OR user_agent ILIKE '%yandexbot%'
  OR user_agent ILIKE '%gptbot%'
  OR user_agent ILIKE '%perplexitybot%'
  OR user_agent ILIKE '%facebookexternalhit%'
  OR user_agent ILIKE '%twitterbot%'
  OR user_agent ILIKE '%linkedinbot%'
  OR user_agent ILIKE '%applebot%'
  OR user_agent ILIKE '%ahrefsbot%'
  OR user_agent ILIKE '%semrushbot%'
)
AND is_bot IS NULL OR is_bot = FALSE;

-- Uppdatera preview-deployments
UPDATE page_views 
SET is_preview = TRUE
WHERE (
  referer ILIKE '%preview%' 
  OR referer ILIKE '%localhost%' 
  OR referer ILIKE '%127.0.0.1%'
)
AND is_preview IS NULL OR is_preview = FALSE;

-- Skapa index för bättre prestanda vid filtrering
CREATE INDEX IF NOT EXISTS idx_page_views_is_bot ON page_views(is_bot);
CREATE INDEX IF NOT EXISTS idx_page_views_is_preview ON page_views(is_preview);
CREATE INDEX IF NOT EXISTS idx_page_views_real_visits ON page_views(created_at) WHERE is_bot = FALSE AND is_preview = FALSE;

-- Kommentarer
COMMENT ON COLUMN page_views.is_bot IS 'Om besöket kommer från en bot/crawler';
COMMENT ON COLUMN page_views.is_preview IS 'Om besöket kommer från en preview-deployment eller localhost';

