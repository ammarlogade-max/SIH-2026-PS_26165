-- SIF Sentinel safety-report persistence
-- Run this once in the Supabase SQL Editor after the existing project schemas.
-- Server APIs use SUPABASE_SERVICE_ROLE_KEY; no browser write access is required.

CREATE TABLE IF NOT EXISTS sif_reports (
  id TEXT PRIMARY KEY,
  raw_text TEXT NOT NULL CHECK (char_length(raw_text) BETWEEN 1 AND 12000),
  site TEXT NOT NULL,
  activity TEXT NOT NULL,
  reported_date DATE NOT NULL,
  submitting_role TEXT,
  source TEXT NOT NULL CHECK (source IN ('manual', 'bulk_upload')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sif_classifications (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL REFERENCES sif_reports(id) ON DELETE CASCADE,
  layer TEXT NOT NULL CHECK (layer IN ('A', 'B')),
  is_sif_potential BOOLEAN NOT NULL,
  confidence NUMERIC(5,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  life_saving_rule TEXT,
  reasoning_terms JSONB NOT NULL DEFAULT '[]'::jsonb,
  reasoning_narrative TEXT,
  model_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sif_reports_created_at_idx ON sif_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS sif_reports_site_idx ON sif_reports(site);
CREATE INDEX IF NOT EXISTS sif_reports_reported_date_idx ON sif_reports(reported_date DESC);
CREATE INDEX IF NOT EXISTS sif_classifications_report_id_idx ON sif_classifications(report_id);
CREATE UNIQUE INDEX IF NOT EXISTS sif_classifications_report_layer_unique ON sif_classifications(report_id, layer);
CREATE INDEX IF NOT EXISTS sif_classifications_sif_idx ON sif_classifications(is_sif_potential);
CREATE INDEX IF NOT EXISTS sif_classifications_rule_idx ON sif_classifications(life_saving_rule);

ALTER TABLE sif_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE sif_classifications ENABLE ROW LEVEL SECURITY;

-- No anonymous policies are intentionally created. The Next.js server persists
-- safety data with the Supabase service-role key, while RLS protects direct client access.
