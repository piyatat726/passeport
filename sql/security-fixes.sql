-- PASSEPORT Security Fixes
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- 1. Fix storage policy: users should only upload to their own folder
-- Drop the old overly-permissive policy and create a scoped one

DO $$
BEGIN
  -- Posts bucket: restrict uploads to user's own folder
  IF EXISTS (
    SELECT 1 FROM storage.policies
    WHERE name = 'Allow authenticated uploads to posts' AND bucket_id = 'posts'
  ) THEN
    DROP POLICY "Allow authenticated uploads to posts" ON storage.objects;
  END IF;

  -- Create scoped policy: users can only upload to posts/{their_user_id}/*
  CREATE POLICY "Users upload to own posts folder"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'posts'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );

  -- Avatars bucket: same pattern
  IF EXISTS (
    SELECT 1 FROM storage.policies
    WHERE name = 'Allow authenticated uploads to avatars' AND bucket_id = 'avatars'
  ) THEN
    DROP POLICY "Allow authenticated uploads to avatars" ON storage.objects;
  END IF;

  CREATE POLICY "Users upload to own avatars folder"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'avatars'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Storage policy update skipped: %', SQLERRM;
END $$;

-- 2. Add views_count column to posts (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'views_count'
  ) THEN
    ALTER TABLE posts ADD COLUMN views_count integer DEFAULT 0;
  END IF;
END $$;

-- 3. Create atomic view counter RPC (avoids race condition on read-then-write)
CREATE OR REPLACE FUNCTION increment_view_count(post_id_input uuid)
RETURNS void AS $$
BEGIN
  UPDATE posts SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = post_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Add parent_id to comments for threaded replies (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'comments' AND column_name = 'parent_id'
  ) THEN
    ALTER TABLE comments ADD COLUMN parent_id uuid REFERENCES comments(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
  END IF;
END $$;

-- Done!
-- After running, verify by checking: SELECT column_name FROM information_schema.columns WHERE table_name = 'posts';
