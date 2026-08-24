-- ============================================
-- IndusMind AI v2 - Extended Schema
-- Run AFTER schema.sql (or run both together)
-- ============================================

-- ============================================
-- ASSETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'boiler','pump','compressor','tank','motor','valve','sensor','other'
  location TEXT,
  department TEXT,
  status TEXT DEFAULT 'operational', -- 'operational','maintenance','critical','offline'
  risk_level TEXT DEFAULT 'low', -- 'low','medium','high','critical'
  failure_probability FLOAT DEFAULT 0,
  last_maintenance TIMESTAMPTZ,
  next_maintenance TIMESTAMPTZ,
  maintenance_overdue BOOLEAN DEFAULT false,
  install_date TIMESTAMPTZ,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RISKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'operational', -- 'safety','operational','compliance','environmental'
  severity TEXT DEFAULT 'medium', -- 'low','medium','high','critical'
  status TEXT DEFAULT 'open', -- 'open','mitigated','closed'
  evidence TEXT[], -- list of supporting evidence from docs
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MAINTENANCE ACTIVITIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS maintenance_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'preventive', -- 'preventive','corrective','predictive','emergency'
  status TEXT DEFAULT 'scheduled', -- 'scheduled','overdue','completed','in_progress'
  priority TEXT DEFAULT 'medium', -- 'low','medium','high','critical'
  due_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  technician TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INCIDENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'equipment_failure', -- 'equipment_failure','safety_violation','near_miss','environmental'
  severity TEXT DEFAULT 'medium', -- 'low','medium','high','critical'
  root_causes TEXT[], -- extracted root causes
  corrective_actions TEXT[],
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'open', -- 'open','investigating','resolved','closed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMPLIANCE ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS compliance_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  regulation TEXT NOT NULL, -- 'OISD','PESO','Factory Act','ISO','others'
  requirement TEXT NOT NULL,
  status TEXT DEFAULT 'compliant', -- 'compliant','non_compliant','gap','missing'
  gap_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AI INSIGHTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'maintenance','risk','compliance','incident','general'
  severity TEXT DEFAULT 'info', -- 'info','warning','critical'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS assets_status_idx ON assets(status);
CREATE INDEX IF NOT EXISTS assets_risk_idx ON assets(risk_level);
CREATE INDEX IF NOT EXISTS risks_severity_idx ON risks(severity);
CREATE INDEX IF NOT EXISTS risks_asset_idx ON risks(asset_id);
CREATE INDEX IF NOT EXISTS maintenance_status_idx ON maintenance_activities(status);
CREATE INDEX IF NOT EXISTS maintenance_asset_idx ON maintenance_activities(asset_id);
CREATE INDEX IF NOT EXISTS incidents_asset_idx ON incidents(asset_id);
CREATE INDEX IF NOT EXISTS incidents_severity_idx ON incidents(severity);
CREATE INDEX IF NOT EXISTS compliance_status_idx ON compliance_items(status);
CREATE INDEX IF NOT EXISTS insights_read_idx ON ai_insights(is_read);
CREATE INDEX IF NOT EXISTS insights_type_idx ON ai_insights(type);

-- Auto-update triggers
DROP TRIGGER IF EXISTS update_assets_updated_at ON assets;
CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all" ON assets;
CREATE POLICY "Allow all" ON assets FOR ALL USING (true);
DROP POLICY IF EXISTS "Allow all" ON risks;
CREATE POLICY "Allow all" ON risks FOR ALL USING (true);
DROP POLICY IF EXISTS "Allow all" ON maintenance_activities;
CREATE POLICY "Allow all" ON maintenance_activities FOR ALL USING (true);
DROP POLICY IF EXISTS "Allow all" ON incidents;
CREATE POLICY "Allow all" ON incidents FOR ALL USING (true);
DROP POLICY IF EXISTS "Allow all" ON compliance_items;
CREATE POLICY "Allow all" ON compliance_items FOR ALL USING (true);
DROP POLICY IF EXISTS "Allow all" ON ai_insights;
CREATE POLICY "Allow all" ON ai_insights FOR ALL USING (true);

-- ============================================
-- PATCH: Add unique constraint for asset upsert
-- ============================================
-- Note: assets can share names across documents, so we use INSERT not UPSERT
-- The intelligence.ts has been updated to use INSERT instead

-- Add index for insights deduplication
CREATE INDEX IF NOT EXISTS insights_title_idx ON ai_insights(title);

-- Prevent exact duplicate insights (same title + type)
CREATE UNIQUE INDEX IF NOT EXISTS insights_unique_title_type
  ON ai_insights(title, type)
  WHERE is_read = false;
