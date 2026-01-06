-- Fix ai_campaigns table: Rename camelCase columns to snake_case
-- This fixes the "Could not find the 'validFrom' column" error

-- Check if columns exist and rename them
DO $$
BEGIN
  -- Rename validFrom to valid_from if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ai_campaigns' 
    AND column_name = 'validFrom'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE ai_campaigns RENAME COLUMN "validFrom" TO valid_from;
    RAISE NOTICE 'Renamed validFrom to valid_from';
  END IF;

  -- Rename validTo to valid_to if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ai_campaigns' 
    AND column_name = 'validTo'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE ai_campaigns RENAME COLUMN "validTo" TO valid_to;
    RAISE NOTICE 'Renamed validTo to valid_to';
  END IF;
END $$;

-- Recreate index with new column names
DROP INDEX IF EXISTS idx_campaigns_dates;
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON ai_campaigns(valid_from, valid_to, active);

-- Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ai_campaigns' 
AND table_schema = 'public'
ORDER BY ordinal_position;
