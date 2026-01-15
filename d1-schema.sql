-- D1 Database schema for tracking robinhood clicks
-- Run this after creating the D1 database: wrangler d1 execute elchef-tracking --file=./d1-schema.sql

CREATE TABLE IF NOT EXISTS robinhood_clicks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_agent TEXT,
  referer TEXT,
  ip_address TEXT,
  session_id TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_robinhood_clicks_created_at ON robinhood_clicks(created_at);
CREATE INDEX IF NOT EXISTS idx_robinhood_clicks_session_id ON robinhood_clicks(session_id);

-- Page providers table (temporary storage while Supabase is full)
CREATE TABLE IF NOT EXISTS page_providers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('rorligt', 'fastpris')),
  logo_url TEXT NOT NULL,
  description TEXT NOT NULL,
  url TEXT NOT NULL,
  is_recommended INTEGER DEFAULT 0 CHECK (is_recommended IN (0, 1)),
  display_order INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1 CHECK (active IN (0, 1)),
  campaign_text TEXT,
  campaign_bold INTEGER DEFAULT 0 CHECK (campaign_bold IN (0, 1)),
  campaign_italic INTEGER DEFAULT 0 CHECK (campaign_italic IN (0, 1)),
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_page_providers_type ON page_providers(type, active);
CREATE INDEX IF NOT EXISTS idx_page_providers_order ON page_providers(type, display_order, active);