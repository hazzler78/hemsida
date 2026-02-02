-- Tabell för att logga Cheap Energy automation-steg
CREATE TABLE IF NOT EXISTS cheap_energy_automation_logs (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  step VARCHAR(50) NOT NULL, -- 'postnummer', 'forbrukning', 'personnummer', 'epost', 'completed', etc.
  step_data JSONB, -- Data för det aktuella steget
  status VARCHAR(20) DEFAULT 'in_progress', -- 'in_progress', 'completed', 'failed', 'dropped'
  error_message TEXT,
  signing_url TEXT, -- URL till signeringssidan när klar
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index för bättre prestanda
CREATE INDEX IF NOT EXISTS idx_automation_logs_session_id ON cheap_energy_automation_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_step ON cheap_energy_automation_logs(step);
CREATE INDEX IF NOT EXISTS idx_automation_logs_status ON cheap_energy_automation_logs(status);
CREATE INDEX IF NOT EXISTS idx_automation_logs_created_at ON cheap_energy_automation_logs(created_at);

-- RLS (Row Level Security)
ALTER TABLE cheap_energy_automation_logs ENABLE ROW LEVEL SECURITY;

-- Policy för att tillåta alla att läsa (för admin-sidan)
CREATE POLICY "Allow all to read automation_logs" ON cheap_energy_automation_logs
  FOR SELECT USING (true);

-- Policy för att tillåta alla att skriva (för automation)
CREATE POLICY "Allow all to insert automation_logs" ON cheap_energy_automation_logs
  FOR INSERT WITH CHECK (true);

-- Policy för att tillåta uppdateringar (för att uppdatera status)
CREATE POLICY "Allow all to update automation_logs" ON cheap_energy_automation_logs
  FOR UPDATE USING (true);

-- Funktion för att uppdatera updated_at automatiskt
CREATE OR REPLACE FUNCTION update_automation_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger för att uppdatera updated_at
CREATE TRIGGER update_automation_logs_updated_at
  BEFORE UPDATE ON cheap_energy_automation_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_automation_logs_updated_at();
