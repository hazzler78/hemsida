-- Migration: Add campaign text fields to page_providers table
-- Run this in D1: wrangler d1 execute elchef-tracking --file=./migrate-providers-campaign-text.sql
-- This migration creates the table if it doesn't exist, and adds columns if they're missing

-- First, create the table if it doesn't exist (with all columns including the new ones)
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

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_page_providers_type ON page_providers(type, active);
CREATE INDEX IF NOT EXISTS idx_page_providers_order ON page_providers(type, display_order, active);

-- Note: SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
-- If the table already exists without these columns, you'll need to add them manually
-- or drop and recreate the table. For existing tables, run these commands separately:
-- ALTER TABLE page_providers ADD COLUMN campaign_text TEXT;
-- ALTER TABLE page_providers ADD COLUMN campaign_bold INTEGER DEFAULT 0 CHECK (campaign_bold IN (0, 1));
-- ALTER TABLE page_providers ADD COLUMN campaign_italic INTEGER DEFAULT 0 CHECK (campaign_italic IN (0, 1));
