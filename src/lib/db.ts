import { createClient } from '@/utils/supabase/client';
import { Post, User, Category, Comment } from './types';

// ═══ Posts ═══

// Get feed posts (paginated, newest first)
export async function getFeedPosts(page = 0, limit = 10) {
  const supabase = createClient();
  const from = page * limit;
  const { data, error } = await supabase
    .from('posts')
    .select('*, user:users(*)')
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1);

  if (error) throw error;
  return data as (Post & { user: User })[];
}

// Get single post by ID
export async function getPostById(postId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('posts')
    .select('*, user:users(*)')
    .eq('id', postId)
    .single();

  if (error) throw error;
  return data as Post & { user: User };
}

// Get posts by user ID
export async function getUserPosts(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('posts')
    .select('*, user:users(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as (Post & { user: User })[];
}

// Create a new post
export async function createPost(post: {
  user_id: string;
  title: string;
  subtitle?: string;
  content: string;
  category: Category;
  cover_image_url: string;
  additional_images?: string[];
  location?: string;
  tags?: string[];
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('posts')
    .insert({
      ...post,
      subtitle: post.subtitle || '',
      additional_images: post.additional_images || [],
      location: post.location || '',
      tags: post.tags || [],
    })
    .select('*, user:users(*)')
    .single();

  if (error) throw error;
  return data as Post & { user: User };
}

// Delete a post
export async function deletePost(postId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId);

  if (error) throw error;
}

// ═══ Likes ═══

// Check if user liked a post
export async function isPostLiked(userId: string, postId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('likes')
    .select('user_id')
    .eq('user_id', userId)
    .eq('post_id', postId)
    .maybeSingle();

  return !!data;
}

// Get all liked post IDs for a user (for feed)
export async function getUserLikedPostIds(userId: string): Promise<Set<string>> {
  const supabase = createClient();
  const { data } = await supabase
    .from('likes')
    .select('post_id')
    .eq('user_id', userId);

  return new Set((data || []).map(d => d.post_id));
}

// Toggle like
export async function toggleLike(userId: string, postId: string): Promise<boolean> {
  const supabase = createClient();
  const liked = await isPostLiked(userId, postId);

  if (liked) {
    await supabase.from('likes').delete().eq('user_id', userId).eq('post_id', postId);
    return false;
  } else {
    await supabase.from('likes').insert({ user_id: userId, post_id: postId });
    return true;
  }
}

// ═══ Follows ═══

// Check if user is following another user
export async function isFollowing(followerId: string, followingId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();

  return !!data;
}

// Toggle follow
export async function toggleFollow(followerId: string, followingId: string): Promise<boolean> {
  const supabase = createClient();
  const following = await isFollowing(followerId, followingId);

  if (following) {
    await supabase.from('follows').delete().eq('follower_id', followerId).eq('following_id', followingId);
    return false;
  } else {
    await supabase.from('follows').insert({ follower_id: followerId, following_id: followingId });
    return true;
  }
}

// ═══ Comments ═══

export async function getComments(postId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('comments')
    .select('*, user:users(*)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as (Comment & { user: User })[];
}

export async function addComment(postId: string, userId: string, content: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id: postId, user_id: userId, content })
    .select('*, user:users(*)')
    .single();

  if (error) throw error;
  return data;
}

export async function deleteComment(commentId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);

  if (error) throw error;
}

// ═══ User Profile ═══

export async function getUserByUsername(username: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (error) throw error;
  return data as User;
}

export async function getUserById(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data as User;
}

export async function updateUserProfile(userId: string, updates: Partial<Pick<User, 'display_name' | 'bio' | 'avatar_url' | 'cities'>>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as User;
}

// ═══ Image Upload ═══

export async function uploadImage(file: File, bucket: 'posts' | 'avatars', userId: string): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);

  return publicUrl;
}

// ═══ Places ═══

export async function searchOrCreatePlace(place: {
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  category?: string;
  mapbox_id?: string;
}): Promise<string> {
  const supabase = createClient();

  // If mapbox_id provided, check if already exists
  if (place.mapbox_id) {
    const { data: existing } = await supabase
      .from('places')
      .select('id')
      .eq('mapbox_id', place.mapbox_id)
      .maybeSingle();

    if (existing) return existing.id;
  }

  // Create new place
  const { data, error } = await supabase
    .from('places')
    .insert({
      name: place.name,
      address: place.address || '',
      latitude: place.latitude || null,
      longitude: place.longitude || null,
      category: place.category || '',
      mapbox_id: place.mapbox_id || '',
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function linkPostToPlace(postId: string, placeId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('post_places')
    .insert({ post_id: postId, place_id: placeId });

  if (error && !error.message.includes('duplicate')) throw error;
}
