-- ============================================
-- PASSEPORT 一鍵設定 - 全部貼上按 Run 就好
-- ============================================

-- 1️⃣ COMMENTS 表
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 2️⃣ PLACES 表
CREATE TABLE IF NOT EXISTS public.places (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  address text DEFAULT '',
  latitude double precision,
  longitude double precision,
  category text DEFAULT '',
  mapbox_id text DEFAULT '',
  mention_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 3️⃣ POST_PLACES 關聯表
CREATE TABLE IF NOT EXISTS public.post_places (
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  place_id uuid REFERENCES public.places(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (post_id, place_id)
);

-- 4️⃣ 開啟 RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_places ENABLE ROW LEVEL SECURITY;

-- 5️⃣ Comments RLS Policies
DO $$ BEGIN
  CREATE POLICY "Comments are viewable by everyone" ON public.comments FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can create own comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 6️⃣ Places RLS Policies
DO $$ BEGIN
  CREATE POLICY "Places are viewable by everyone" ON public.places FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated users can insert places" ON public.places FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 7️⃣ Post_places RLS Policies
DO $$ BEGIN
  CREATE POLICY "Post places are viewable by everyone" ON public.post_places FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can insert post_places for own posts" ON public.post_places FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 8️⃣ 索引
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_places_mapbox_id ON public.places(mapbox_id);
CREATE INDEX IF NOT EXISTS idx_places_name ON public.places(name);
CREATE INDEX IF NOT EXISTS idx_post_places_place_id ON public.post_places(place_id);

-- 9️⃣ 自動計算地點被提及次數的 Trigger
CREATE OR REPLACE FUNCTION update_place_mention_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.places SET mention_count = mention_count + 1 WHERE id = NEW.place_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.places SET mention_count = GREATEST(mention_count - 1, 0) WHERE id = OLD.place_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_place_mention_count ON public.post_places;
CREATE TRIGGER trigger_update_place_mention_count
  AFTER INSERT OR DELETE ON public.post_places
  FOR EACH ROW EXECUTE FUNCTION update_place_mention_count();

-- 🔟 Storage Policies (posts bucket)
DO $$ BEGIN
  CREATE POLICY "Post images are publicly viewable" ON storage.objects FOR SELECT USING (bucket_id = 'posts');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can upload post images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'posts' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can update own post images" ON storage.objects FOR UPDATE USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can delete own post images" ON storage.objects FOR DELETE USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 1️⃣1️⃣ Storage Policies (avatars bucket)
DO $$ BEGIN
  CREATE POLICY "Avatars are publicly viewable" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can delete own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ✅ 完成！
SELECT '🎉 PASSEPORT 設定完成！所有表、policies、indexes、triggers 都已建立。' as result;
