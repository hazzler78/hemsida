-- Add image_url column to shared_cards table
-- Run this in Supabase SQL Editor

ALTER TABLE shared_cards 
ADD COLUMN IF NOT EXISTS image_url text;

-- Add comment for documentation
COMMENT ON COLUMN shared_cards.image_url IS 'URL to og:image extracted from shared link';

-- Make URL unique for upsert behavior
CREATE UNIQUE INDEX IF NOT EXISTS shared_cards_url_key ON shared_cards (url);

