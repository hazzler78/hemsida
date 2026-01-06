-- Refresh Supabase schema cache for ai_campaigns table
-- This helps Supabase recognize the column names correctly

-- Force refresh by querying the table structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'ai_campaigns'
ORDER BY ordinal_position;

-- Also try to touch the table to refresh cache
SELECT COUNT(*) FROM ai_campaigns;

-- Verify RLS policies are correct
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'ai_campaigns';
