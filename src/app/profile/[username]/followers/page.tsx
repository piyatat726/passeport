'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getUserByUsername, getFollowers, getFollowingUsers, isFollowing, toggleFollow } from '@/lib/db';
import { User } from '@/lib/types';
import Link from 'next/link';

export default function FollowersPage() {
  const { username } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isDemo } = useAuth();

  const initialTab = searchParams.get('tab') === 'following' ? 'following' : 'followers';
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [followers, setFollowers] = useState<User[]>([]);
  const [followingList, setFollowingList] = useState<User[]>([]);
  const [followStates, setFollowStates] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [followersLoaded, setFollowersLoaded] = useState(false);
  const [followingLoaded, setFollowingLoaded] = useState(false);

  const loadProfile = useCallback(async () => {
    if (isDemo || !username) {
      setLoading(false);
      return;
    }
    try {
      const profile = await getUserByUsername(username as string);
      setProfileUser(profile);
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  }, [username, isDemo]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Load followers list
  const loadFollowers = useCallback(async () => {
    if (!profileUser || isDemo) return;
    try {
      const data = await getFollowers(profileUser.id);
      setFollowers(data);
      // Check follow states for each user
      if (user) {
        const states: Record<string, boolean> = {};
        await Promise.all(data.map(async (u) => {
          if (u.id !== user.id) {
            states[u.id] = await isFollowing(user.id, u.id);
          }
        }));
        setFollowStates(prev => ({ ...prev, ...states }));
      }
      setFollowersLoaded(true);
    } catch (err) {
      console.error('Failed to load followers:', err);
    }
  }, [profileUser, user, isDemo]);

  // Load following list
  const loadFollowing = useCallback(async () => {
    if (!profileUser || isDemo) return;
    try {
      const data = await getFollowingUsers(profileUser.id);
      setFollowingList(data);
      // Check follow states
      if (user) {
        const states: Record<string, boolean> = {};
        await Promise.all(data.map(async (u) => {
          if (u.id !== user.id) {
            states[u.id] = await isFollowing(user.id, u.id);
          }
        }));
        setFollowStates(prev => ({ ...prev, ...states }));
      }
      setFollowingLoaded(true);
    } catch (err) {
      console.error('Failed to load following:', err);
    }
  }, [profileUser, user, isDemo]);

  // Lazy load based on active tab
  useEffect(() => {
    if (activeTab === 'followers' && !followersLoaded && profileUser) {
      loadFollowers();
    }
    if (activeTab === 'following' && !followingLoaded && profileUser) {
      loadFollowing();
    }
  }, [activeTab, profileUser, followersLoaded, followingLoaded, loadFollowers, loadFollowing]);

  const handleToggleFollow = async (targetId: string) => {
    if (!user || isDemo) return;
    // Optimistic
    setFollowStates(prev => ({ ...prev, [targetId]: !prev[targetId] }));
    try {
      await toggleFollow(user.id, targetId);
    } catch {
      // Revert
      setFollowStates(prev => ({ ...prev, [targetId]: !prev[targetId] }));
    }
  };

  const currentList = activeTab === 'followers' ? followers : followingList;
  const isCurrentLoaded = activeTab === 'followers' ? followersLoaded : followingLoaded;

  return (
    <div className="min-h-screen bg-cream pb-10">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-cream/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center px-5 pt-14 pb-3 gap-3">
          <button onClick={() => router.back()} className="p-1">
            <svg className="w-5 h-5 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div>
            <h1 className="font-playfair italic text-lg tracking-editorial text-ink leading-tight">
              {profileUser?.display_name || (username as string)}
            </h1>
            <p className="text-[10px] text-taupe font-inter">@{username}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-5 gap-0">
          <button
            onClick={() => setActiveTab('followers')}
            className={`flex-1 pb-3 text-xs tracking-editorial uppercase font-inter transition-colors relative text-center ${
              activeTab === 'followers' ? 'text-ink' : 'text-taupe'
            }`}
          >
            {profileUser?.followers_count || 0} Followers
            {activeTab === 'followers' && (
              <span className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-ink" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`flex-1 pb-3 text-xs tracking-editorial uppercase font-inter transition-colors relative text-center ${
              activeTab === 'following' ? 'text-ink' : 'text-taupe'
            }`}
          >
            {profileUser?.following_count || 0} Following
            {activeTab === 'following' && (
              <span className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-ink" />
            )}
          </button>
        </div>
      </header>

      <div className="px-5 pt-2">
        {/* Loading */}
        {(loading || !isCurrentLoaded) && (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-taupe/30 border-t-ink rounded-full animate-spin mx-auto" />
          </div>
        )}

        {/* Empty State */}
        {!loading && isCurrentLoaded && currentList.length === 0 && (
          <div className="py-20 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-surface flex items-center justify-center">
              <svg className="w-8 h-8 text-taupe" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 className="font-playfair italic text-lg tracking-editorial text-ink mb-2">
              {activeTab === 'followers' ? 'NO FOLLOWERS YET' : 'NOT FOLLOWING ANYONE'}
            </h3>
            <p className="text-sm text-taupe font-noto">
              {activeTab === 'followers'
                ? '還沒有人追蹤'
                : '還沒有追蹤任何人'}
            </p>
          </div>
        )}

        {/* User List */}
        {!loading && isCurrentLoaded && currentList.length > 0 && (
          <div className="space-y-1">
            {currentList.map(u => (
              <div
                key={u.id}
                className="flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-surface/50 transition-colors"
              >
                {/* Avatar */}
                <Link href={`/profile/${u.username}`} className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-surface overflow-hidden">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-base text-taupe font-playfair italic">
                          {u.display_name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Info */}
                <Link href={`/profile/${u.username}`} className="flex-1 min-w-0">
                  <p className="font-inter font-semibold text-sm text-ink truncate">
                    {u.display_name}
                  </p>
                  <p className="text-[11px] text-taupe font-inter truncate">
                    @{u.username}
                  </p>
                  {u.bio && (
                    <p className="text-[11px] text-taupe/70 font-noto line-clamp-1 mt-0.5">
                      {u.bio}
                    </p>
                  )}
                </Link>

                {/* Follow Button */}
                {user && u.id !== user.id && (
                  <button
                    onClick={() => handleToggleFollow(u.id)}
                    className={`px-4 py-1.5 text-[11px] tracking-editorial uppercase rounded-full font-inter transition-colors flex-shrink-0 ${
                      followStates[u.id]
                        ? 'border border-border text-taupe hover:border-taupe'
                        : 'bg-ink text-cream'
                    }`}
                  >
                    {followStates[u.id] ? 'Following' : 'Follow'}
                  </button>
                )}

                {/* "You" badge for own profile */}
                {user && u.id === user.id && (
                  <span className="px-3 py-1.5 text-[10px] tracking-editorial uppercase text-taupe bg-surface rounded-full font-inter flex-shrink-0">
                    YOU
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
