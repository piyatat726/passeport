-- ============================================
-- City Guides cache table
-- Stores AI-generated guides for non-flagship cities
-- Run this in Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS city_guides (
  slug TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE city_guides ENABLE ROW LEVEL SECURITY;

-- Anyone can read guides
DROP POLICY IF EXISTS "city_guides_public_read" ON city_guides;
CREATE POLICY "city_guides_public_read" ON city_guides
  FOR SELECT USING (true);

-- The app (anon key, server route) can cache new guides
DROP POLICY IF EXISTS "city_guides_insert" ON city_guides;
CREATE POLICY "city_guides_insert" ON city_guides
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "city_guides_update" ON city_guides;
CREATE POLICY "city_guides_update" ON city_guides
  FOR UPDATE USING (true) WITH CHECK (true);
