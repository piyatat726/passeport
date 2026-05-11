import { createClient } from '@/utils/supabase/client';
import { Post, User, Category, Comment, Place, Notification, Conversation, Message } from './types';

// ═══ Posts ═══

// Get feed posts (paginated, newest first)
export async function getFeedPosts(page = 0, limit = 10) {
  const supabase = createClient();
  const from = page * limit;
  const { data, error } = await supabase
    .from('posts')
    .select('*, user:users!posts_user_id_fkey(*)')
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
    .select('*, user:users!posts_user_id_fkey(*)')
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
    .select('*, user:users!posts_user_id_fkey(*)')
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
    .select('*, user:users!posts_user_id_fkey(*)')
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
    // Notify post owner
    try {
      const { data: post } = await supabase.from('posts').select('user_id').eq('id', postId).single();
      if (post) createNotification(post.user_id, userId, 'like', postId);
    } catch {}
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
    // Notify the person being followed
    createNotification(followingId, followerId, 'follow');
    return true;
  }
}

// ═══ Comments ═══

export async function getComments(postId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('comments')
    .select('*, user:users!comments_user_id_fkey(*)')
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
    .select('*, user:users!comments_user_id_fkey(*)')
    .single();

  if (error) throw error;

  // Notify post owner
  try {
    const { data: post } = await supabase.from('posts').select('user_id').eq('id', postId).single();
    if (post) createNotification(post.user_id, userId, 'comment', postId, content);
  } catch {}

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

// ═══ Following Feed ═══

export async function getFollowingFeed(userId: string, page = 0, limit = 10) {
  const supabase = createClient();

  // Get IDs of users this person follows
  const { data: followData } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);

  const followingIds = (followData || []).map(f => f.following_id);
  if (followingIds.length === 0) return [];

  const from = page * limit;
  const { data, error } = await supabase
    .from('posts')
    .select('*, user:users!posts_user_id_fkey(*)')
    .in('user_id', followingIds)
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1);

  if (error) throw error;
  return data as (Post & { user: User })[];
}

// ═══ Bookmarks (Collections) ═══

// Get or create default "Saved" collection for a user
async function getDefaultCollection(userId: string): Promise<string> {
  const supabase = createClient();
  const { data: existing } = await supabase
    .from('collections')
    .select('id')
    .eq('user_id', userId)
    .eq('name', '已收藏')
    .maybeSingle();

  if (existing) return existing.id;

  const { data, error } = await supabase
    .from('collections')
    .insert({ user_id: userId, name: '已收藏' })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

// Check if a post is bookmarked
export async function isPostBookmarked(userId: string, postId: string): Promise<boolean> {
  const supabase = createClient();
  const collectionId = await getDefaultCollection(userId);
  const { data } = await supabase
    .from('collection_items')
    .select('post_id')
    .eq('collection_id', collectionId)
    .eq('post_id', postId)
    .maybeSingle();

  return !!data;
}

// Toggle bookmark
export async function toggleBookmark(userId: string, postId: string): Promise<boolean> {
  const supabase = createClient();
  const collectionId = await getDefaultCollection(userId);
  const saved = await isPostBookmarked(userId, postId);

  if (saved) {
    await supabase
      .from('collection_items')
      .delete()
      .eq('collection_id', collectionId)
      .eq('post_id', postId);
    return false;
  } else {
    await supabase
      .from('collection_items')
      .insert({ collection_id: collectionId, post_id: postId });
    return true;
  }
}

// Get all bookmarked post IDs for a user
export async function getUserBookmarkedPostIds(userId: string): Promise<Set<string>> {
  const supabase = createClient();
  const collectionId = await getDefaultCollection(userId);
  const { data } = await supabase
    .from('collection_items')
    .select('post_id')
    .eq('collection_id', collectionId);

  return new Set((data || []).map(d => d.post_id));
}

// ═══ Notifications ═══

export async function createNotification(
  recipientId: string,
  actorId: string,
  type: 'like' | 'comment' | 'follow',
  postId?: string,
  commentText?: string
) {
  if (recipientId === actorId) return; // Don't notify yourself
  const supabase = createClient();
  try {
    await supabase.from('notifications').insert({
      recipient_id: recipientId,
      actor_id: actorId,
      type,
      post_id: postId || null,
      comment_text: (commentText || '').slice(0, 100),
      is_read: false,
    });
  } catch {
    // Silently fail if notifications table doesn't exist yet
  }
}

export async function getNotifications(userId: string, limit = 50): Promise<Notification[]> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*, actor:users!notifications_actor_id_fkey(*), post:posts!notifications_post_id_fkey(id, title, cover_image_url)')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as Notification[];
  } catch {
    return [];
  }
}

export async function markNotificationsRead(userId: string) {
  const supabase = createClient();
  try {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_id', userId)
      .eq('is_read', false);
  } catch {}
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const supabase = createClient();
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('is_read', false);

    if (error) return 0;
    return count || 0;
  } catch {
    return 0;
  }
}

// ═══ Followers / Following Lists ═══

export async function getFollowers(userId: string): Promise<User[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('follows')
    .select('*, follower:users!follows_follower_id_fkey(*)')
    .eq('following_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(d => d.follower) as User[];
}

export async function getFollowingUsers(userId: string): Promise<User[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('follows')
    .select('*, following:users!follows_following_id_fkey(*)')
    .eq('follower_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(d => d.following) as User[];
}

// ═══ Saved / Liked Posts ═══

export async function getUserSavedPosts(userId: string): Promise<(Post & { user: User })[]> {
  const supabase = createClient();
  const { data: collection } = await supabase
    .from('collections')
    .select('id')
    .eq('user_id', userId)
    .eq('name', '已收藏')
    .maybeSingle();

  if (!collection) return [];

  const { data, error } = await supabase
    .from('collection_items')
    .select('post:posts!collection_items_post_id_fkey(*, user:users!posts_user_id_fkey(*))')
    .eq('collection_id', collection.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((d: any) => d.post).filter(Boolean) as unknown as (Post & { user: User })[];
}

export async function getUserLikedPosts(userId: string): Promise<(Post & { user: User })[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('likes')
    .select('post:posts!likes_post_id_fkey(*, user:users!posts_user_id_fkey(*))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((d: any) => d.post).filter(Boolean) as unknown as (Post & { user: User })[];
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

// ═══ Post Edit ═══

export async function updatePost(postId: string, updates: Partial<Pick<Post,
  'title' | 'subtitle' | 'content' | 'category' | 'cover_image_url' |
  'additional_images' | 'location' | 'tags'
>>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('posts')
    .update(updates)
    .eq('id', postId)
    .select('*, user:users!posts_user_id_fkey(*)')
    .single();

  if (error) throw error;
  return data as Post & { user: User };
}

// ═══ Search ═══

// Sanitize user input for PostgREST .or() filter interpolation
// to prevent filter injection attacks
function sanitizeSearchQuery(query: string): string {
  return query.replace(/[%_\\]/g, '\\$&').replace(/[,.()"']/g, '');
}

export async function searchPosts(query: string, limit = 20) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('posts')
    .select('*, user:users!posts_user_id_fkey(*)')
    .or(`title.ilike.%${sanitizeSearchQuery(query)}%,content.ilike.%${sanitizeSearchQuery(query)}%,location.ilike.%${sanitizeSearchQuery(query)}%`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as (Post & { user: User })[];
}

export async function searchPostsByTag(tag: string, limit = 20) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('posts')
    .select('*, user:users!posts_user_id_fkey(*)')
    .contains('tags', [tag])
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as (Post & { user: User })[];
}

export async function searchUsers(query: string, limit = 10) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .or(`username.ilike.%${sanitizeSearchQuery(query)}%,display_name.ilike.%${sanitizeSearchQuery(query)}%`)
    .limit(limit);

  if (error) throw error;
  return data as User[];
}

export async function searchPlaces(query: string, limit = 10) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .or(`name.ilike.%${sanitizeSearchQuery(query)}%,address.ilike.%${sanitizeSearchQuery(query)}%`)
    .order('mention_count', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as Place[];
}

export async function getPopularTags(limit = 20): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('posts')
    .select('tags')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  const tagCount: Record<string, number> = {};
  (data || []).forEach(post => {
    (post.tags || []).forEach((tag: string) => {
      tagCount[tag] = (tagCount[tag] || 0) + 1;
    });
  });
  return Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag);
}

// ═══ Place Detail ═══

export async function getPlaceById(placeId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .eq('id', placeId)
    .single();

  if (error) throw error;
  return data as Place;
}

export async function getPostsByPlace(placeId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('post_places')
    .select('posts:post_id(*, user:users!posts_user_id_fkey(*))')
    .eq('place_id', placeId);

  if (error) throw error;
  return (data || []).map((d: Record<string, unknown>) => d.posts).filter(Boolean) as (Post & { user: User })[];
}

export async function getPlacesWithCoords(limit = 500) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .order('mention_count', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as Place[];
}

export async function getAllPlaces(limit = 2000) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .order('mention_count', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as Place[];
}

// ═══ Direct Messages ═══

export async function getOrCreateConversation(userId1: string, userId2: string): Promise<string> {
  const supabase = createClient();
  // Normalize ordering so conversation is unique regardless of who initiates
  const [u1, u2] = [userId1, userId2].sort();

  // Check existing
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .or(`and(user1_id.eq.${u1},user2_id.eq.${u2}),and(user1_id.eq.${u2},user2_id.eq.${u1})`)
    .maybeSingle();

  if (existing) return existing.id;

  const { data, error } = await supabase
    .from('conversations')
    .insert({ user1_id: u1, user2_id: u2, last_message_text: '', last_message_at: new Date().toISOString() })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function getConversations(userId: string): Promise<Conversation[]> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*, user1:users!conversations_user1_id_fkey(*), user2:users!conversations_user2_id_fkey(*)')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('last_message_at', { ascending: false });

    if (error) throw error;

    // Map to add other_user field and unread count
    const conversations = await Promise.all((data || []).map(async (c) => {
      const otherUser = c.user1_id === userId ? c.user2 : c.user1;

      // Get unread count
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', c.id)
        .neq('sender_id', userId)
        .eq('is_read', false);

      return {
        id: c.id,
        user1_id: c.user1_id,
        user2_id: c.user2_id,
        last_message_text: c.last_message_text,
        last_message_at: c.last_message_at,
        created_at: c.created_at,
        other_user: otherUser as User,
        unread_count: count || 0,
      } as Conversation;
    }));

    return conversations;
  } catch {
    return [];
  }
}

export async function getMessages(conversationId: string, limit = 50): Promise<Message[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:users!messages_sender_id_fkey(*)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data || []) as Message[];
}

export async function sendMessage(conversationId: string, senderId: string, content: string): Promise<Message> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, content, is_read: false })
    .select('*, sender:users!messages_sender_id_fkey(*)')
    .single();

  if (error) throw error;

  // Update conversation's last message
  await supabase
    .from('conversations')
    .update({ last_message_text: content.slice(0, 100), last_message_at: new Date().toISOString() })
    .eq('id', conversationId);

  return data as Message;
}

export async function markMessagesRead(conversationId: string, userId: string) {
  const supabase = createClient();
  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId)
    .eq('is_read', false);
}

export async function getTotalUnreadMessages(userId: string): Promise<number> {
  const supabase = createClient();
  try {
    // Get all conversation IDs for user
    const { data: convos } = await supabase
      .from('conversations')
      .select('id')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    if (!convos || convos.length === 0) return 0;

    const convoIds = convos.map(c => c.id);
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('conversation_id', convoIds)
      .neq('sender_id', userId)
      .eq('is_read', false);

    return count || 0;
  } catch {
    return 0;
  }
}

// ═══ Report / Block ═══

export async function reportContent(
  reporterId: string,
  targetType: 'post' | 'user' | 'comment',
  targetId: string,
  reason: string
) {
  const supabase = createClient();
  try {
    await supabase.from('reports').insert({
      reporter_id: reporterId,
      target_type: targetType,
      target_id: targetId,
      reason,
    });
  } catch {
    // Silently fail if table doesn't exist
  }
}

export async function blockUser(blockerId: string, blockedId: string) {
  const supabase = createClient();
  try {
    await supabase.from('blocks').insert({ blocker_id: blockerId, blocked_id: blockedId });
    // Also unfollow if following
    await supabase.from('follows').delete().eq('follower_id', blockerId).eq('following_id', blockedId);
    await supabase.from('follows').delete().eq('follower_id', blockedId).eq('following_id', blockerId);
  } catch {}
}

export async function unblockUser(blockerId: string, blockedId: string) {
  const supabase = createClient();
  try {
    await supabase.from('blocks').delete().eq('blocker_id', blockerId).eq('blocked_id', blockedId);
  } catch {}
}

export async function isUserBlocked(blockerId: string, blockedId: string): Promise<boolean> {
  const supabase = createClient();
  try {
    const { data } = await supabase
      .from('blocks')
      .select('blocker_id')
      .eq('blocker_id', blockerId)
      .eq('blocked_id', blockedId)
      .maybeSingle();
    return !!data;
  } catch {
    return false;
  }
}

export async function getBlockedUserIds(userId: string): Promise<Set<string>> {
  const supabase = createClient();
  try {
    const { data } = await supabase
      .from('blocks')
      .select('blocked_id')
      .eq('blocker_id', userId);
    return new Set((data || []).map(d => d.blocked_id));
  } catch {
    return new Set();
  }
}
