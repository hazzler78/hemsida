-- ============================================================================
-- Conversion experiment snapshots (före/efter-mätning)
-- Kör i Supabase SQL Editor innan ni sparar baseline i admin.
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversion_experiment_snapshots (
  id SERIAL PRIMARY KEY,
  experiment_id VARCHAR(100) NOT NULL,
  kind VARCHAR(30) NOT NULL CHECK (kind IN ('baseline', 'checkpoint', 'live_start')),
  label TEXT NOT NULL,
  window_days INTEGER NOT NULL DEFAULT 14,
  period_from TIMESTAMPTZ NOT NULL,
  period_to TIMESTAMPTZ NOT NULL,
  metrics JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversion_exp_snapshots_experiment
  ON conversion_experiment_snapshots(experiment_id);
CREATE INDEX IF NOT EXISTS idx_conversion_exp_snapshots_kind
  ON conversion_experiment_snapshots(kind);
CREATE INDEX IF NOT EXISTS idx_conversion_exp_snapshots_created
  ON conversion_experiment_snapshots(created_at DESC);

ALTER TABLE conversion_experiment_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read conversion_experiment_snapshots" ON conversion_experiment_snapshots;
CREATE POLICY "Allow read conversion_experiment_snapshots"
  ON conversion_experiment_snapshots FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert conversion_experiment_snapshots" ON conversion_experiment_snapshots;
CREATE POLICY "Allow insert conversion_experiment_snapshots"
  ON conversion_experiment_snapshots FOR INSERT WITH CHECK (true);

COMMENT ON TABLE conversion_experiment_snapshots IS
  'Sparade KPI-snapshots för konverterings-experiment (baseline före ändring + checkpoints efter)';
