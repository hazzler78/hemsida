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
