-- Fix ai_campaigns table: Rename camelCase columns to snake_case
-- This fixes the "Could not find the 'validFrom' column" error

-- First, let's see what columns actually exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ai_campaigns' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Rename columns (PostgreSQL converts unquoted identifiers to lowercase)
-- So "validFrom" stays as validFrom, but validFrom becomes validfrom
DO $$
BEGIN
  -- Try to rename "validFrom" (with quotes, case-sensitive)
  BEGIN
    ALTER TABLE ai_campaigns RENAME COLUMN "validFrom" TO valid_from;
    RAISE NOTICE 'Renamed "validFrom" to valid_from';
  EXCEPTION WHEN undefined_column THEN
    -- Column doesn't exist with quotes, try lowercase
    BEGIN
      ALTER TABLE ai_campaigns RENAME COLUMN validfrom TO valid_from;
      RAISE NOTICE 'Renamed validfrom to valid_from';
    EXCEPTION WHEN undefined_column THEN
      RAISE NOTICE 'Column validFrom/validfrom does not exist, skipping...';
    END;
  END;

  -- Try to rename "validTo" (with quotes, case-sensitive)
  BEGIN
    ALTER TABLE ai_campaigns RENAME COLUMN "validTo" TO valid_to;
    RAISE NOTICE 'Renamed "validTo" to valid_to';
  EXCEPTION WHEN undefined_column THEN
    -- Column doesn't exist with quotes, try lowercase
    BEGIN
      ALTER TABLE ai_campaigns RENAME COLUMN validto TO valid_to;
      RAISE NOTICE 'Renamed validto to valid_to';
    EXCEPTION WHEN undefined_column THEN
      RAISE NOTICE 'Column validTo/validto does not exist, skipping...';
    END;
  END;
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
