-- PASSEPORT Database Schema for Supabase
-- Run this in your Supabase SQL Editor
-- Safe to run multiple times (idempotent)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom enum for post categories
DO $$ BEGIN
  CREATE TYPE post_category AS ENUM (
    'style_diary', 'travel_notes', 'city_guide', 'cafe_journal',
    'table_taste', 'beauty_rituals', 'culture_calendar',
    'living_aesthetic', 'personal_essay', 'curated_picks'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ═══════════════════════════════════════
-- TABLES
-- ═══════════════════════════════════════

-- Users table (profile data linked to auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  display_name text NOT NULL DEFAULT '',
  bio text DEFAULT '',
  avatar_url text DEFAULT '',
  cities text[] DEFAULT '{}',
  followers_count integer DEFAULT 0,
  following_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Posts table
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  subtitle text DEFAULT '',
  content text DEFAULT '',
  category post_category NOT NULL,
  cover_image_url text DEFAULT '',
  additional_images text[] DEFAULT '{}',
  location text DEFAULT '',
  tags text[] DEFAULT '{}',
  likes_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Likes table
CREATE TABLE IF NOT EXISTS public.likes (
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (user_id, post_id)
);

-- Follows table
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  following_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Collections table
CREATE TABLE IF NOT EXISTS public.collections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  cover_image_url text DEFAULT '',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Collection items table
CREATE TABLE IF NOT EXISTS public.collection_items (
  collection_id uuid REFERENCES public.collections(id) ON DELETE CASCADE NOT NULL,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (collection_id, post_id)
);

-- ═══════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

-- Users policies
DO $$ BEGIN
  CREATE POLICY "Users are viewable by everyone" ON public.users FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Posts policies
DO $$ BEGIN
  CREATE POLICY "Posts are viewable by everyone" ON public.posts FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can create own posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Likes policies
DO $$ BEGIN
  CREATE POLICY "Likes are viewable by everyone" ON public.likes FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can like posts" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can unlike posts" ON public.likes FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Follows policies
DO $$ BEGIN
  CREATE POLICY "Follows are viewable by everyone" ON public.follows FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can follow others" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can unfollow others" ON public.follows FOR DELETE USING (auth.uid() = follower_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Collections policies
DO $$ BEGIN
  CREATE POLICY "Collections are viewable by everyone" ON public.collections FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can create own collections" ON public.collections FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can update own collections" ON public.collections FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can delete own collections" ON public.collections FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Collection items policies
DO $$ BEGIN
  CREATE POLICY "Collection items are viewable by everyone" ON public.collection_items FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can add to own collections" ON public.collection_items FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.collections WHERE id = collection_id AND user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can remove from own collections" ON public.collection_items FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.collections WHERE id = collection_id AND user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ═══════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_category ON public.posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_post_id ON public.collection_items(post_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

-- ═══════════════════════════════════════
-- FUNCTIONS (auto-update counters)
-- ═══════════════════════════════════════

-- Auto-update likes_count on posts
CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_likes_count ON public.likes;
CREATE TRIGGER trigger_update_likes_count
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW EXECUTE FUNCTION update_likes_count();

-- Auto-update followers/following counts
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.users SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
    UPDATE public.users SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.users SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = OLD.following_id;
    UPDATE public.users SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_follow_counts ON public.follows;
CREATE TRIGGER trigger_update_follow_counts
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

-- ═══════════════════════════════════════
-- COMMENTS, PLACES & POST_PLACES TABLES
-- ═══════════════════════════════════════

-- Comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Places table
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

-- Post-Places junction table
CREATE TABLE IF NOT EXISTS public.post_places (
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  place_id uuid REFERENCES public.places(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (post_id, place_id)
);

-- ═══════════════════════════════════════
-- ROW LEVEL SECURITY (comments, places, post_places)
-- ═══════════════════════════════════════

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_places ENABLE ROW LEVEL SECURITY;

-- Comments policies
DO $$ BEGIN
  CREATE POLICY "Comments are viewable by everyone" ON public.comments FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can create own comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Places policies
DO $$ BEGIN
  CREATE POLICY "Places are viewable by everyone" ON public.places FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated users can insert places" ON public.places FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Post_places policies
DO $$ BEGIN
  CREATE POLICY "Post places are viewable by everyone" ON public.post_places FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can insert post_places for own posts" ON public.post_places FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ═══════════════════════════════════════
-- INDEXES (comments, places, post_places)
-- ═══════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_places_mapbox_id ON public.places(mapbox_id);
CREATE INDEX IF NOT EXISTS idx_places_name ON public.places(name);
CREATE INDEX IF NOT EXISTS idx_post_places_place_id ON public.post_places(place_id);

-- ═══════════════════════════════════════
-- FUNCTION: Auto-update mention_count on places
-- ═══════════════════════════════════════

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
