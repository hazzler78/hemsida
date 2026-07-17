-- ============================================================================
-- Social click attribution — UTM per post + koppling till page_views
-- ============================================================================
-- Idempotent. Inga DROP/DELETE/TRUNCATE.
-- Kör i Supabase SQL Editor efter supabase-social-posts.sql
-- ============================================================================

-- 1) page_views: spara utm_content (post/tracking-kod)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'page_views' AND column_name = 'utm_content'
  ) THEN
    ALTER TABLE page_views ADD COLUMN utm_content VARCHAR(150);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_page_views_utm_content ON page_views(utm_content);
CREATE INDEX IF NOT EXISTS idx_page_views_utm_source_campaign
  ON page_views(utm_source, utm_campaign);

COMMENT ON COLUMN page_views.utm_content IS 'utm_content — t.ex. social tracking_code för Reel/post';

-- 2) contract_clicks: spara utm_content
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contract_clicks' AND column_name = 'utm_content'
  ) THEN
    ALTER TABLE contract_clicks ADD COLUMN utm_content VARCHAR(150);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_contract_clicks_utm_content ON contract_clicks(utm_content);

COMMENT ON COLUMN contract_clicks.utm_content IS 'utm_content från landning (social tracking_code)';

-- 3) social_posts: tracking-fält
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'social_posts' AND column_name = 'tracking_code'
  ) THEN
    ALTER TABLE social_posts ADD COLUMN tracking_code VARCHAR(80);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'social_posts' AND column_name = 'utm_source'
  ) THEN
    ALTER TABLE social_posts ADD COLUMN utm_source VARCHAR(100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'social_posts' AND column_name = 'utm_medium'
  ) THEN
    ALTER TABLE social_posts ADD COLUMN utm_medium VARCHAR(100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'social_posts' AND column_name = 'utm_campaign'
  ) THEN
    ALTER TABLE social_posts ADD COLUMN utm_campaign VARCHAR(100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'social_posts' AND column_name = 'utm_content'
  ) THEN
    ALTER TABLE social_posts ADD COLUMN utm_content VARCHAR(150);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_social_posts_tracking_code
  ON social_posts(tracking_code)
  WHERE tracking_code IS NOT NULL;

COMMENT ON COLUMN social_posts.tracking_code IS 'Unik kod i utm_content för att koppla klick till posten';
COMMENT ON COLUMN social_posts.cta_url IS 'Full CTA-URL inkl. UTM-parametrar';

-- 4) Performance-vy: post + senaste insights + klick
CREATE OR REPLACE VIEW social_post_performance AS
SELECT
  p.id,
  p.platform,
  p.format,
  p.post_id,
  p.post_url,
  p.theme,
  p.theme_id,
  p.tracking_code,
  p.cta_url,
  p.utm_source,
  p.utm_medium,
  p.utm_campaign,
  p.utm_content,
  p.posted_at,
  i.views AS latest_views,
  i.reach AS latest_reach,
  i.reactions AS latest_reactions,
  i.comments AS latest_comments,
  i.shares AS latest_shares,
  i.fetched_at AS insights_fetched_at,
  (
    SELECT COUNT(*)::bigint
    FROM page_views pv
    WHERE pv.is_bot IS DISTINCT FROM TRUE
      AND pv.is_preview IS DISTINCT FROM TRUE
      AND (
        (p.tracking_code IS NOT NULL AND pv.utm_content = p.tracking_code)
        OR (p.utm_content IS NOT NULL AND pv.utm_content = p.utm_content)
        OR (p.post_id IS NOT NULL AND pv.utm_content = p.post_id)
      )
  ) AS landing_page_views,
  (
    SELECT COUNT(*)::bigint
    FROM contract_clicks cc
    WHERE (
      (p.tracking_code IS NOT NULL AND cc.utm_content = p.tracking_code)
      OR (p.utm_content IS NOT NULL AND cc.utm_content = p.utm_content)
      OR (p.post_id IS NOT NULL AND cc.utm_content = p.post_id)
    )
  ) AS contract_clicks_count
FROM social_posts p
LEFT JOIN LATERAL (
  SELECT s.*
  FROM social_post_insights s
  WHERE s.social_post_id = p.id
     OR (s.platform = p.platform AND s.post_id = p.post_id)
  ORDER BY s.fetched_at DESC
  LIMIT 1
) i ON true;

COMMENT ON VIEW social_post_performance IS 'Social post + metrics + landningar/kontraktsklick via utm_content/tracking_code';
