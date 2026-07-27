-- Funnel steps: landing → OCR → contract click (Elchef)
-- Run in Supabase SQL Editor once.

CREATE TABLE IF NOT EXISTS funnel_events (
  id BIGSERIAL PRIMARY KEY,
  event TEXT NOT NULL,
  path TEXT,
  session_id TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  meta JSONB,
  user_agent TEXT,
  referer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_funnel_events_event_created
  ON funnel_events (event, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_funnel_events_session
  ON funnel_events (session_id);
CREATE INDEX IF NOT EXISTS idx_funnel_events_utm_content
  ON funnel_events (utm_content)
  WHERE utm_content IS NOT NULL;

ALTER TABLE funnel_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow service read funnel_events" ON funnel_events;
DROP POLICY IF EXISTS "Allow service insert funnel_events" ON funnel_events;
DROP POLICY IF EXISTS "Allow all to read funnel_events" ON funnel_events;
DROP POLICY IF EXISTS "Allow all to insert funnel_events" ON funnel_events;

CREATE POLICY "Allow all to read funnel_events" ON funnel_events
  FOR SELECT USING (true);
CREATE POLICY "Allow all to insert funnel_events" ON funnel_events
  FOR INSERT WITH CHECK (true);

-- Ensure utm_content exists on page_views / contract_clicks (idempotent)
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS utm_content TEXT;
ALTER TABLE contract_clicks ADD COLUMN IF NOT EXISTS utm_content TEXT;

CREATE INDEX IF NOT EXISTS idx_page_views_utm_content
  ON page_views (utm_content)
  WHERE utm_content IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contract_clicks_utm_content
  ON contract_clicks (utm_content)
  WHERE utm_content IS NOT NULL;

COMMENT ON TABLE funnel_events IS 'Elchef conversion funnel: landing_fakturaanalys, ocr_started, ocr_completed, ocr_failed, contract_click';
