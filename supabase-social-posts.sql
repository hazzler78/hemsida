-- ============================================================================
-- SOCIAL POSTS + INSIGHTS — Elchef Facebook/Reels tracking
-- ============================================================================
-- Syfte:
--   1) Logga varje publicerat socialt inlägg (n8n Reels/foto)
--   2) Spara insights-snapshots över tid (views, reach, engagement)
--
-- Kör i Supabase SQL Editor (idempotent: IF NOT EXISTS / policy-guards).
-- Inga DROP/TRUNCATE/DELETE.
--
-- Mönster: samma stil som supabase-affiliate-clicks.sql / supabase-share-tracking.sql
-- ============================================================================

-- 1) Post-logg -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform VARCHAR(20) NOT NULL DEFAULT 'facebook'
    CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'tiktok', 'youtube', 'other')),
  format VARCHAR(40) NOT NULL DEFAULT 'unknown',
  -- t.ex. reel_video_9x16 | photo | video | link
  page_id VARCHAR(64),
  post_id VARCHAR(128) NOT NULL,
  post_url TEXT,
  theme VARCHAR(120),
  theme_id VARCHAR(64),
  core_message TEXT,
  caption TEXT,
  cta_url TEXT,
  workflow_id VARCHAR(64),
  execution_id VARCHAR(64),
  status VARCHAR(20) NOT NULL DEFAULT 'posted'
    CHECK (status IN ('posted', 'failed', 'deleted', 'draft')),
  posted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  meta JSONB DEFAULT '{}'::jsonb,
  CONSTRAINT social_posts_platform_post_unique UNIQUE (platform, post_id)
);

CREATE INDEX IF NOT EXISTS idx_social_posts_posted_at ON social_posts(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_posts_theme_id ON social_posts(theme_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_format ON social_posts(format);
CREATE INDEX IF NOT EXISTS idx_social_posts_platform ON social_posts(platform);
CREATE INDEX IF NOT EXISTS idx_social_posts_workflow_id ON social_posts(workflow_id);

COMMENT ON TABLE social_posts IS 'Logg över publicerade sociala inlägg (Elchef n8n m.m.)';
COMMENT ON COLUMN social_posts.format IS 'Innehållsformat: reel_video_9x16, photo, video, link';
COMMENT ON COLUMN social_posts.post_id IS 'Plattformens post/video-id (Facebook graph id)';
COMMENT ON COLUMN social_posts.cta_url IS 'Länk i första kommentar / primär CTA';
COMMENT ON COLUMN social_posts.meta IS 'Extra fält från n8n (image_url, video_url, raw ids)';

-- 2) Insights-snapshots --------------------------------------------------------
CREATE TABLE IF NOT EXISTS social_post_insights (
  id BIGSERIAL PRIMARY KEY,
  social_post_id UUID REFERENCES social_posts(id) ON DELETE CASCADE,
  platform VARCHAR(20) NOT NULL DEFAULT 'facebook',
  post_id VARCHAR(128) NOT NULL,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  -- Vanliga FB/IG-metrics (null om API ej ger fältet)
  impressions BIGINT,
  reach BIGINT,
  views BIGINT,
  -- video views / 3s plays beroende på endpoint
  plays BIGINT,
  reactions BIGINT,
  comments BIGINT,
  shares BIGINT,
  clicks BIGINT,
  watch_time_sec NUMERIC(12, 2),
  avg_watch_time_sec NUMERIC(12, 2),
  raw JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_post_insights_post_id ON social_post_insights(post_id);
CREATE INDEX IF NOT EXISTS idx_social_post_insights_social_post_id ON social_post_insights(social_post_id);
CREATE INDEX IF NOT EXISTS idx_social_post_insights_fetched_at ON social_post_insights(fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_post_insights_platform_post ON social_post_insights(platform, post_id);

COMMENT ON TABLE social_post_insights IS 'Tidsstämplade metrics-snapshots per social post';
COMMENT ON COLUMN social_post_insights.raw IS 'Rått API-svar för felsökning/framtida fält';

-- 3) updated_at trigger (social_posts) -----------------------------------------
CREATE OR REPLACE FUNCTION update_social_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_social_posts_updated_at ON social_posts;
CREATE TRIGGER trigger_update_social_posts_updated_at
  BEFORE UPDATE ON social_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_social_posts_updated_at();

-- 4) RLS -----------------------------------------------------------------------
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_post_insights ENABLE ROW LEVEL SECURITY;

-- social_posts: service role / backend skriver; läsning för admin-liknande användning
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Allow all to read social_posts'
      AND schemaname = 'public'
      AND tablename = 'social_posts'
  ) THEN
    CREATE POLICY "Allow all to read social_posts" ON social_posts
      FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Allow all to insert social_posts'
      AND schemaname = 'public'
      AND tablename = 'social_posts'
  ) THEN
    CREATE POLICY "Allow all to insert social_posts" ON social_posts
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Allow all to update social_posts'
      AND schemaname = 'public'
      AND tablename = 'social_posts'
  ) THEN
    CREATE POLICY "Allow all to update social_posts" ON social_posts
      FOR UPDATE USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Allow all to read social_post_insights'
      AND schemaname = 'public'
      AND tablename = 'social_post_insights'
  ) THEN
    CREATE POLICY "Allow all to read social_post_insights" ON social_post_insights
      FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Allow all to insert social_post_insights'
      AND schemaname = 'public'
      AND tablename = 'social_post_insights'
  ) THEN
    CREATE POLICY "Allow all to insert social_post_insights" ON social_post_insights
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- 5) Hjälpvy: senaste snapshot per post ----------------------------------------
CREATE OR REPLACE VIEW social_posts_with_latest_insights AS
SELECT
  p.*,
  i.fetched_at AS insights_fetched_at,
  i.impressions,
  i.reach,
  i.views,
  i.plays,
  i.reactions,
  i.comments,
  i.shares,
  i.clicks,
  i.watch_time_sec,
  i.avg_watch_time_sec
FROM social_posts p
LEFT JOIN LATERAL (
  SELECT *
  FROM social_post_insights s
  WHERE s.social_post_id = p.id
     OR (s.platform = p.platform AND s.post_id = p.post_id)
  ORDER BY s.fetched_at DESC
  LIMIT 1
) i ON true;

COMMENT ON VIEW social_posts_with_latest_insights IS 'Poster + senaste insights-snapshot';
