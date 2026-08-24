-- ============================================
-- IndusMind AI v3 Schema additions
-- Run AFTER schema.sql and schema_v2.sql
-- ============================================

-- Decisions cache table
CREATE TABLE IF NOT EXISTS decisions_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decisions JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Briefs archive
CREATE TABLE IF NOT EXISTS operational_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  health_score INTEGER,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Investigation reports
CREATE TABLE IF NOT EXISTS investigation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  report JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE decisions_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE operational_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE investigation_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON decisions_cache;
CREATE POLICY "Allow all" ON decisions_cache FOR ALL USING (true);
DROP POLICY IF EXISTS "Allow all" ON operational_briefs;
CREATE POLICY "Allow all" ON operational_briefs FOR ALL USING (true);
DROP POLICY IF EXISTS "Allow all" ON investigation_reports;
CREATE POLICY "Allow all" ON investigation_reports FOR ALL USING (true);
