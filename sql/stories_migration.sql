-- ============================================
-- Stories & Story Views Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create stories table
CREATE TABLE IF NOT EXISTS stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '24 hours')
);

-- 2. Create story_views table
CREATE TABLE IF NOT EXISTS story_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(story_id, viewer_id)
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_story_views_story_id ON story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_story_views_viewer_id ON story_views(viewer_id);

-- 4. Enable RLS
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for stories
CREATE POLICY "Anyone can view active stories"
  ON stories FOR SELECT
  USING (expires_at > now());

CREATE POLICY "Users can create their own stories"
  ON stories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories"
  ON stories FOR DELETE
  USING (auth.uid() = user_id);

-- 6. RLS Policies for story_views
CREATE POLICY "Users can view their own story views"
  ON story_views FOR SELECT
  USING (true);

CREATE POLICY "Users can mark stories as viewed"
  ON story_views FOR INSERT
  WITH CHECK (auth.uid() = viewer_id);

-- 7. Optional: Auto-cleanup expired stories (run periodically or via cron)
-- You can set up a Supabase Edge Function or pg_cron to run:
-- DELETE FROM stories WHERE expires_at < now() - INTERVAL '1 day';
