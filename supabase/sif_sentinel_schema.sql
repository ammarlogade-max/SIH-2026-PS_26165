-- ==============================================================================
-- SIF Sentinel Production Database Schema (Supabase / PostgreSQL)
-- Canonical Schema for Serious Injury & Fatality (SIF) Precursor Intelligence
-- Oil India Limited Operational Asset Safety Architecture
-- Server APIs use SUPABASE_SERVICE_ROLE_KEY; RLS is enabled on all tables.
-- ==============================================================================

-- 1. Safety Reports & Observations Table
CREATE TABLE IF NOT EXISTS sif_reports (
  id TEXT PRIMARY KEY,
  raw_text TEXT NOT NULL CHECK (char_length(raw_text) BETWEEN 1 AND 12000),
  site TEXT NOT NULL,
  activity TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'Unsafe Condition' CHECK (event_type IN ('Unsafe Act', 'Unsafe Condition', 'Near-Miss', 'Incident')),
  shift_timing TEXT DEFAULT 'day_shift' CHECK (shift_timing IN ('day_shift', 'night_shift', 'graveyard_shift', 'dawn_shift')),
  circadian_risk_tier TEXT DEFAULT 'low' CHECK (circadian_risk_tier IN ('low', 'moderate', 'elevated', 'critical')),
  department TEXT,
  reported_date DATE NOT NULL,
  submitting_role TEXT,
  source TEXT NOT NULL CHECK (source IN ('manual', 'bulk_upload')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Multi-Layer SIF Classifications Table
CREATE TABLE IF NOT EXISTS sif_classifications (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL REFERENCES sif_reports(id) ON DELETE CASCADE,
  layer TEXT NOT NULL CHECK (layer IN ('A', 'B')),
  is_sif_potential BOOLEAN NOT NULL,
  confidence NUMERIC(5,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  ml_sif_probability NUMERIC(5,4),
  ml_prediction TEXT CHECK (ml_prediction IN ('SIF_POTENTIAL', 'NON_SIF_POTENTIAL', 'REVIEW_REQUIRED')),
  calibration_status TEXT DEFAULT 'uncalibrated_model_probability',
  operational_priority TEXT CHECK (operational_priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
  life_saving_rule TEXT,
  reasoning_terms JSONB NOT NULL DEFAULT '[]'::jsonb,
  reasoning_narrative TEXT,
  evidence_span TEXT,
  energy_category TEXT,
  energy_magnitude TEXT CHECK (energy_magnitude IN ('High-Energy', 'Low-Energy', 'Undetermined', 'UNKNOWN')),
  energy_detected BOOLEAN NOT NULL DEFAULT FALSE,
  energy_evidence TEXT,
  barrier_assessment JSONB,
  sif_pathway JSONB,
  sif_decision_gates JSONB,
  campbell_gates JSONB,
  rule_mappings JSONB,
  shift_risk_multiplier NUMERIC(4,2) DEFAULT 1.0,
  human_reviewed BOOLEAN NOT NULL DEFAULT FALSE,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  override_reason TEXT,
  review_version INTEGER NOT NULL DEFAULT 0,
  original_sif_prediction TEXT,
  original_is_sif BOOLEAN,
  original_rule TEXT,
  model_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Versioned Human Review & Audit Overrides Table
CREATE TABLE IF NOT EXISTS sif_human_reviews (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL REFERENCES sif_reports(id) ON DELETE CASCADE,
  classification_id TEXT NOT NULL REFERENCES sif_classifications(id) ON DELETE CASCADE,
  review_version INTEGER NOT NULL DEFAULT 1,
  reviewer_name TEXT NOT NULL,
  reviewer_role TEXT NOT NULL,
  original_prediction TEXT NOT NULL,
  reviewed_prediction TEXT NOT NULL,
  original_rule TEXT,
  reviewed_rule TEXT,
  original_is_sif BOOLEAN NOT NULL,
  reviewed_is_sif BOOLEAN NOT NULL,
  rationale TEXT NOT NULL,
  review_notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('ACCEPTED', 'OVERRIDDEN', 'ESCALATED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Corrective & Preventative Actions (CAPA) Lifecycle Table
CREATE TABLE IF NOT EXISTS sif_corrective_actions (
  id TEXT PRIMARY KEY,
  report_id TEXT REFERENCES sif_reports(id) ON DELETE SET NULL,
  pattern_id TEXT,
  site TEXT NOT NULL,
  life_saving_rule TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  assigned_to TEXT NOT NULL,
  assigned_role TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'overdue', 'completed', 'verified')),
  due_date DATE NOT NULL,
  hierarchy_level TEXT NOT NULL,
  control_hierarchy TEXT NOT NULL,
  control_rank INTEGER NOT NULL,
  weak_control_warning BOOLEAN NOT NULL DEFAULT FALSE,
  monitoring_window_days INTEGER NOT NULL DEFAULT 30,
  post_closure_monitoring_active BOOLEAN NOT NULL DEFAULT FALSE,
  recurrence_detected BOOLEAN NOT NULL DEFAULT FALSE,
  recurrence_detected_at TIMESTAMPTZ,
  recurrence_report_id TEXT REFERENCES sif_reports(id) ON DELETE SET NULL,
  effectiveness_status TEXT NOT NULL DEFAULT 'pending_verification' CHECK (
    effectiveness_status IN ('pending_verification', 'monitoring', 'effective', 'verified_effective', 'ineffective', 'verified_ineffective', 'recurred_post_closure')
  ),
  post_closure_event_count INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  verified_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Tamper-Evident SHA-256 Audit Trail Table
CREATE TABLE IF NOT EXISTS sif_audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL,
  sequence_number BIGINT NOT NULL,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details TEXT NOT NULL,
  previous_hash TEXT NOT NULL,
  current_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'warning', 'critical')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Recurring Precursor Pattern Intelligence Table
CREATE TABLE IF NOT EXISTS sif_precursor_patterns (
  id TEXT PRIMARY KEY,
  site TEXT NOT NULL,
  facility TEXT NOT NULL,
  activity TEXT NOT NULL,
  barrier_compromised TEXT NOT NULL,
  life_saving_rule TEXT NOT NULL,
  event_types JSONB NOT NULL DEFAULT '[]'::jsonb,
  report_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  first_observed_at TIMESTAMPTZ NOT NULL,
  last_observed_at TIMESTAMPTZ NOT NULL,
  time_window_days INTEGER NOT NULL,
  narrative TEXT NOT NULL,
  count INTEGER NOT NULL,
  sif_count INTEGER NOT NULL,
  activity_summary TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  trajectory TEXT NOT NULL CHECK (trajectory IN ('RECURRING', 'ESCALATING', 'PERSISTENT', 'POST_CAPA_RECURRENCE')),
  temporal_trend TEXT NOT NULL,
  recommended_intervention TEXT NOT NULL,
  linked_capa_id TEXT REFERENCES sif_corrective_actions(id) ON DELETE SET NULL,
  has_recurrence_alert BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance & rapid query execution
CREATE INDEX IF NOT EXISTS sif_reports_created_at_idx ON sif_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS sif_reports_site_idx ON sif_reports(site);
CREATE INDEX IF NOT EXISTS sif_reports_activity_idx ON sif_reports(activity);
CREATE INDEX IF NOT EXISTS sif_reports_reported_date_idx ON sif_reports(reported_date DESC);
CREATE INDEX IF NOT EXISTS sif_reports_event_type_idx ON sif_reports(event_type);

CREATE INDEX IF NOT EXISTS sif_classifications_report_id_idx ON sif_classifications(report_id);
CREATE UNIQUE INDEX IF NOT EXISTS sif_classifications_report_layer_unique ON sif_classifications(report_id, layer);
CREATE INDEX IF NOT EXISTS sif_classifications_sif_idx ON sif_classifications(is_sif_potential);
CREATE INDEX IF NOT EXISTS sif_classifications_rule_idx ON sif_classifications(life_saving_rule);
CREATE INDEX IF NOT EXISTS sif_classifications_review_idx ON sif_classifications(human_reviewed);

CREATE INDEX IF NOT EXISTS sif_human_reviews_report_id_idx ON sif_human_reviews(report_id);
CREATE INDEX IF NOT EXISTS sif_human_reviews_classification_id_idx ON sif_human_reviews(classification_id);

CREATE INDEX IF NOT EXISTS sif_actions_site_idx ON sif_corrective_actions(site);
CREATE INDEX IF NOT EXISTS sif_actions_rule_idx ON sif_corrective_actions(life_saving_rule);
CREATE INDEX IF NOT EXISTS sif_actions_status_idx ON sif_corrective_actions(status);
CREATE INDEX IF NOT EXISTS sif_actions_effectiveness_idx ON sif_corrective_actions(effectiveness_status);

CREATE INDEX IF NOT EXISTS sif_audit_seq_idx ON sif_audit_logs(sequence_number ASC);
CREATE INDEX IF NOT EXISTS sif_audit_entity_idx ON sif_audit_logs(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS sif_patterns_site_idx ON sif_precursor_patterns(site);
CREATE INDEX IF NOT EXISTS sif_patterns_trajectory_idx ON sif_precursor_patterns(trajectory);

-- Row Level Security (RLS) configuration
ALTER TABLE sif_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE sif_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE sif_human_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE sif_corrective_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sif_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sif_precursor_patterns ENABLE ROW LEVEL SECURITY;
