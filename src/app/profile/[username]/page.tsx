'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getUserByUsername, getUserPosts, isFollowing, toggleFollow, getUserSavedPosts, getUserLikedPosts, getOrCreateConversation } from '@/lib/db';
import { User, Post } from '@/lib/types';
import { BottomNav } from '@/components/bottom-nav';
import { useTheme } from '@/lib/theme-context';
import Link from 'next/link';

export default function ProfilePage() {
  const { username } = useParams();
  const { user, signOut, isDemo } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'liked'>('posts');
  const [following, setFollowing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<(Post & { user: User })[]>([]);
  const [likedPosts, setLikedPosts] = useState<(Post & { user: User })[]>([]);
  const [savedLoaded, setSavedLoaded] = useState(false);
  const [likedLoaded, setLikedLoaded] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const { isDark, toggleTheme } = useTheme();

  const isOwnProfile = user?.username === username;

  const loadProfile = useCallback(async () => {
    if (isDemo || !username) {
      // Demo mode: show current user info
      if (user) {
        setProfileUser(user);
      }
      setProfileLoading(false);
      return;
    }

    try {
      const profile = await getUserByUsername(username as string);
      setProfileUser(profile);

      // Load user's posts
      const posts = await getUserPosts(profile.id);
      setUserPosts(posts);

      // Check if following
      if (user && !isOwnProfile) {
        const isFollow = await isFollowing(user.id, profile.id);
        setFollowing(isFollow);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setProfileLoading(false);
    }
  }, [username, user, isDemo, isOwnProfile]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Lazy load saved posts
  useEffect(() => {
    if (activeTab === 'saved' && !savedLoaded && isOwnProfile && user && !isDemo) {
      getUserSavedPosts(user.id).then(data => {
        setSavedPosts(data);
        setSavedLoaded(true);
      }).catch(err => console.error('Failed to load saved posts:', err));
    }
  }, [activeTab, savedLoaded, isOwnProfile, user, isDemo]);

  // Lazy load liked posts
  useEffect(() => {
    if (activeTab === 'liked' && !likedLoaded && isOwnProfile && user && !isDemo) {
      getUserLikedPosts(user.id).then(data => {
        setLikedPosts(data);
        setLikedLoaded(true);
      }).catch(err => console.error('Failed to load liked posts:', err));
    }
  }, [activeTab, likedLoaded, isOwnProfile, user, isDemo]);

  const handleFollow = async () => {
    if (!user || !profileUser || isDemo) return;
    // Optimistic
    setFollowing(!following);
    setProfileUser(prev => prev ? {
      ...prev,
      followers_count: (prev.followers_count || 0) + (following ? -1 : 1)
    } : null);

    try {
      await toggleFollow(user.id, profileUser.id);
    } catch {
      // Revert
      setFollowing(following);
      setProfileUser(prev => prev ? {
        ...prev,
        followers_count: (prev.followers_count || 0) + (following ? 1 : -1)
      } : null);
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-taupe/30 border-t-ink rounded-full animate-spin" />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center gap-4">
        <p className="text-taupe font-noto">找不到此用戶</p>
        <button
          onClick={() => router.back()}
          className="text-xs text-ink font-inter underline"
        >
          返回
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pb-20">
      {/* Header */}
      <div className="relative">
        {/* Cover */}
        <div className="h-44 bg-gradient-to-br from-surface via-border to-taupe/30 relative overflow-hidden">
          {userPosts[0]?.cover_image_url && (
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: `url(${userPosts[0].cover_image_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(2px)',
            }} />
          )}
        </div>

        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="absolute top-12 left-4 w-8 h-8 rounded-full bg-cream/80 backdrop-blur-sm flex items-center justify-center z-10"
        >
          <svg className="w-4 h-4 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {/* Settings Menu */}
        {isOwnProfile && (
          <div className="absolute top-12 right-4 z-20">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-8 h-8 rounded-full bg-cream/80 backdrop-blur-sm flex items-center justify-center"
            >
              <svg className="w-4 h-4 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 mt-2 w-44 bg-cream border border-border rounded-xl shadow-lg overflow-hidden animate-slide-up">
                  <Link
                    href={`/profile/${profileUser?.username}/edit`}
                    onClick={() => setShowMenu(false)}
                    className="w-full px-4 py-3 text-left text-xs font-noto text-ink hover:bg-surface transition-colors flex items-center gap-2.5"
                  >
                    <svg className="w-3.5 h-3.5 text-taupe" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4"/></svg>
                    編輯個人檔案
                  </Link>
                  <Link
                    href="/messages"
                    onClick={() => setShowMenu(false)}
                    className="w-full px-4 py-3 text-left text-xs font-noto text-ink hover:bg-surface transition-colors flex items-center gap-2.5"
                  >
                    <svg className="w-3.5 h-3.5 text-taupe" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                    我的訊息
                  </Link>
                  <button
                    onClick={() => { toggleTheme(); setShowMenu(false); }}
                    className="w-full px-4 py-3 text-left text-xs font-noto text-ink hover:bg-surface transition-colors flex items-center gap-2.5"
                  >
                    {isDark ? (
                      <svg className="w-3.5 h-3.5 text-taupe" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                    ) : (
                      <svg className="w-3.5 h-3.5 text-taupe" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
                    )}
                    {isDark ? '淺色模式' : '深色模式'}
                  </button>
                  <div className="border-t border-border" />
                  <Link
                    href="/privacy"
                    onClick={() => setShowMenu(false)}
                    className="w-full px-4 py-3 text-left text-xs font-noto text-taupe hover:bg-surface transition-colors flex items-center gap-2.5"
                  >
                    <svg className="w-3.5 h-3.5 text-taupe/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                    隱私權政策
                  </Link>
                  <Link
                    href="/terms"
                    onClick={() => setShowMenu(false)}
                    className="w-full px-4 py-3 text-left text-xs font-noto text-taupe hover:bg-surface transition-colors flex items-center gap-2.5"
                  >
                    <svg className="w-3.5 h-3.5 text-taupe/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
                    使用條款
                  </Link>
                  <div className="w-full px-4 py-2.5 text-left text-[10px] font-inter text-taupe/40 flex items-center gap-2.5">
                    PASSEPORT v1.0
                  </div>
                  <div className="border-t border-border" />
                  <button
                    onClick={async () => {
                      await signOut();
                      router.replace('/auth');
                    }}
                    className="w-full px-4 py-3 text-left text-xs font-noto text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2.5"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                    {isDemo ? '結束訪客模式' : '登出'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Avatar */}
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
          <div className="w-24 h-24 rounded-full border-4 border-cream overflow-hidden shadow-lg bg-surface">
            {profileUser.avatar_url ? (
              <img
                src={profileUser.avatar_url}
                alt={profileUser.display_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-surface">
                <span className="text-2xl font-playfair italic text-taupe">
                  {profileUser.display_name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="pt-16 px-6 text-center">
        <h2 className="font-playfair italic text-xl tracking-editorial text-ink">
          {profileUser.display_name || profileUser.username}
        </h2>
        <p className="text-xs text-taupe font-inter mt-1">@{profileUser.username}</p>

        {/* Stats */}
        <div className="flex justify-center gap-8 mt-5">
          <div className="text-center">
            <span className="text-lg font-inter font-semibold text-ink">{userPosts.length}</span>
            <p className="text-[10px] text-taupe tracking-wide uppercase font-inter mt-0.5">Posts</p>
          </div>
          <Link href={`/profile/${profileUser.username}/followers?tab=followers`} className="text-center group">
            <span className="text-lg font-inter font-semibold text-ink group-hover:text-taupe transition-colors">{formatCount(profileUser.followers_count || 0)}</span>
            <p className="text-[10px] text-taupe tracking-wide uppercase font-inter mt-0.5">Followers</p>
          </Link>
          <Link href={`/profile/${profileUser.username}/followers?tab=following`} className="text-center group">
            <span className="text-lg font-inter font-semibold text-ink group-hover:text-taupe transition-colors">{formatCount(profileUser.following_count || 0)}</span>
            <p className="text-[10px] text-taupe tracking-wide uppercase font-inter mt-0.5">Following</p>
          </Link>
        </div>

        {/* Bio */}
        {profileUser.bio && (
          <p className="mt-4 text-xs text-ink/70 font-noto leading-relaxed max-w-xs mx-auto">
            {profileUser.bio}
          </p>
        )}

        {/* Cities */}
        {profileUser.cities && profileUser.cities.length > 0 && (
          <div className="flex justify-center gap-2 mt-3">
            {profileUser.cities.map(city => (
              <span
                key={city}
                className="text-[10px] tracking-wide text-taupe bg-surface px-2.5 py-1 rounded-full font-inter"
              >
                {city}
              </span>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center gap-3 mt-5">
          {isOwnProfile ? (
            <>
              <Link
                href={`/profile/${profileUser.username}/edit`}
                className="px-6 py-2 bg-ink text-cream text-xs tracking-editorial uppercase rounded-full font-inter"
              >
                Edit Profile
              </Link>
              <Link
                href="/create"
                className="px-6 py-2 border border-border text-ink text-xs tracking-editorial uppercase rounded-full font-inter"
              >
                New Post
              </Link>
            </>
          ) : (
            <>
              <button
                onClick={handleFollow}
                className={`px-8 py-2 text-xs tracking-editorial uppercase rounded-full font-inter transition-colors ${
                  following
                    ? 'border border-border text-ink'
                    : 'bg-ink text-cream'
                }`}
              >
                {following ? 'Following' : 'Follow'}
              </button>
              <button
                onClick={async () => {
                  if (!user || !profileUser) return;
                  try {
                    const convId = await getOrCreateConversation(user.id, profileUser.id);
                    router.push(`/messages/${convId}`);
                  } catch (err) {
                    console.error('Failed to start conversation:', err);
                  }
                }}
                className="px-6 py-2 border border-border text-ink text-xs tracking-editorial uppercase rounded-full font-inter"
              >
                Message
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content Tabs */}
      <div className="flex px-6 gap-0 mt-8 border-b border-border">
        {(['posts', 'saved', 'liked'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 pb-3 text-xs tracking-editorial uppercase font-inter transition-colors relative text-center ${
              activeTab === tab ? 'text-ink' : 'text-taupe'
            }`}
          >
            {tab === 'posts' ? '文章' : tab === 'saved' ? '收藏' : '喜歡'}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-ink" />
            )}
          </button>
        ))}
      </div>

      {/* Photo Grid */}
      {activeTab === 'posts' && userPosts.length > 0 && (
        <div className="grid grid-cols-3 gap-0.5 mt-0.5">
          {userPosts.map(post => (
            <Link key={post.id} href={`/post/${post.id}`} className="aspect-square overflow-hidden">
              <img
                src={post.cover_image_url}
                alt={post.title}
                className="w-full h-full object-cover hover:opacity-90 transition-opacity"
              />
            </Link>
          ))}
        </div>
      )}

      {activeTab === 'posts' && userPosts.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-sm text-taupe font-noto">
            {isOwnProfile ? '你還沒有發表文章' : '此用戶還沒有發表文章'}
          </p>
          {isOwnProfile && !isDemo && (
            <Link
              href="/create"
              className="inline-block mt-4 px-5 py-2 bg-ink text-cream text-xs tracking-editorial uppercase rounded-full font-inter"
            >
              CREATE FIRST POST
            </Link>
          )}
        </div>
      )}

      {/* Saved Tab */}
      {activeTab === 'saved' && isOwnProfile && (
        <>
          {!savedLoaded && (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-2 border-taupe/30 border-t-ink rounded-full animate-spin mx-auto" />
            </div>
          )}
          {savedLoaded && savedPosts.length === 0 && (
            <div className="py-16 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface flex items-center justify-center">
                <svg className="w-6 h-6 text-taupe" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                </svg>
              </div>
              <p className="text-sm text-taupe font-noto">還沒有收藏的文章</p>
            </div>
          )}
          {savedLoaded && savedPosts.length > 0 && (
            <div className="grid grid-cols-3 gap-0.5 mt-0.5">
              {savedPosts.map(post => (
                <Link key={post.id} href={`/post/${post.id}`} className="aspect-square overflow-hidden relative group">
                  <img
                    src={post.cover_image_url}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="white" stroke="none">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {/* Liked Tab */}
      {activeTab === 'liked' && isOwnProfile && (
        <>
          {!likedLoaded && (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-2 border-taupe/30 border-t-ink rounded-full animate-spin mx-auto" />
            </div>
          )}
          {likedLoaded && likedPosts.length === 0 && (
            <div className="py-16 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface flex items-center justify-center">
                <svg className="w-6 h-6 text-taupe" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
              </div>
              <p className="text-sm text-taupe font-noto">還沒有喜歡的文章</p>
            </div>
          )}
          {likedLoaded && likedPosts.length > 0 && (
            <div className="grid grid-cols-3 gap-0.5 mt-0.5">
              {likedPosts.map(post => (
                <Link key={post.id} href={`/post/${post.id}`} className="aspect-square overflow-hidden relative group">
                  <img
                    src={post.cover_image_url}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="#e74c3c" stroke="none">
                      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {/* Saved/Liked for other users' profiles */}
      {activeTab !== 'posts' && !isOwnProfile && (
        <div className="py-16 text-center">
          <p className="text-sm text-taupe font-noto">
            {activeTab === 'saved' ? '收藏的文章只有本人可以查看' : '喜歡的文章只有本人可以查看'}
          </p>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

function formatCount(count: number): string {
  if (count >= 1000000) return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (count >= 1000) return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return count.toString();
}
