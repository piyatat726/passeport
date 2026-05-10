-- PASSEPORT Storage Setup
-- Run this in Supabase SQL Editor AFTER creating the storage buckets
--
-- FIRST: Go to Supabase Dashboard → Storage → Create Bucket:
--   1. Name: "posts" → Public bucket: YES
--   2. Name: "avatars" → Public bucket: YES
--
-- THEN run this SQL to set up RLS policies:

-- ═══════════════════════════════════════
-- Storage Policies for "posts" bucket
-- ═══════════════════════════════════════

-- Anyone can view post images
CREATE POLICY "Post images are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'posts');

-- Authenticated users can upload post images
CREATE POLICY "Users can upload post images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'posts'
  AND auth.role() = 'authenticated'
);

-- Users can update their own post images
CREATE POLICY "Users can update own post images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'posts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own post images
CREATE POLICY "Users can delete own post images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'posts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ═══════════════════════════════════════
-- Storage Policies for "avatars" bucket
-- ═══════════════════════════════════════

-- Anyone can view avatars
CREATE POLICY "Avatars are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Authenticated users can upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
