-- ============================================================================
-- FIX AI KNOWLEDGE BASE RLS POLICIES
-- ============================================================================
-- Detta script fixar RLS-policies för AI-tabellerna så att admin-sidan kan spara data

-- ai_knowledge - Lägg till INSERT/UPDATE/DELETE policies
DROP POLICY IF EXISTS "Allow all to read ai_knowledge" ON ai_knowledge;
DROP POLICY IF EXISTS "Allow all operations for ai_knowledge" ON ai_knowledge;

CREATE POLICY "Allow all operations for ai_knowledge" ON ai_knowledge
  FOR ALL USING (true) WITH CHECK (true);

-- ai_campaigns - Lägg till INSERT/UPDATE/DELETE policies  
DROP POLICY IF EXISTS "Allow all to read ai_campaigns" ON ai_campaigns;
DROP POLICY IF EXISTS "Allow all operations for ai_campaigns" ON ai_campaigns;

CREATE POLICY "Allow all operations for ai_campaigns" ON ai_campaigns
  FOR ALL USING (true) WITH CHECK (true);

-- ai_providers - Lägg till INSERT/UPDATE/DELETE policies
DROP POLICY IF EXISTS "Allow all to read ai_providers" ON ai_providers;
DROP POLICY IF EXISTS "Allow all operations for ai_providers" ON ai_providers;

CREATE POLICY "Allow all operations for ai_providers" ON ai_providers
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- VERIFIERA ATT POLICIES ÄR KORREKTA
-- ============================================================================

-- Visa alla policies för AI-tabellerna
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('ai_knowledge', 'ai_campaigns', 'ai_providers')
ORDER BY tablename, policyname;

-- Testa att policies fungerar (detta ska returnera true för alla tabeller)
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN 'RLS Enabled' ELSE 'RLS Disabled' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('ai_knowledge', 'ai_campaigns', 'ai_providers')
ORDER BY tablename;
