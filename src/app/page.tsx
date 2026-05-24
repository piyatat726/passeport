'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { CATEGORIES, Post, User } from '@/lib/types';
import { BottomNav } from '@/components/bottom-nav';
import { FeedSkeleton, PostCardSkeleton } from '@/components/skeleton';
import { getFeedPosts, getFollowingFeed, getUserLikedPostIds, toggleLike, getUnreadNotificationCount, getTotalUnreadMessages } from '@/lib/db';
import Link from 'next/link';
import Image from 'next/image';
import { StoriesBar } from '@/components/stories-bar';
import { PushNotificationPrompt } from '@/components/push-prompt';

export default function HomePage() {
  const { user, loading, isDemo } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'foryou' | 'following'>('foryou');
  const [posts, setPosts] = useState<(Post & { user: User })[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [feedLoading, setFeedLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Badge counts
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Following tab state
  const [followingPosts, setFollowingPosts] = useState<(Post & { user: User })[]>([]);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [followingPage, setFollowingPage] = useState(0);
  const [followingHasMore, setFollowingHasMore] = useState(true);
  const [followingLoaded, setFollowingLoaded] = useState(false);

  // Load feed posts
  const loadPosts = useCallback(async (pageNum = 0) => {
    if (isDemo) {
      setFeedLoading(false);
      return;
    }
    try {
      const data = await getFeedPosts(pageNum, 10);
      if (pageNum === 0) {
        setPosts(data);
      } else {
        setPosts(prev => [...prev, ...data]);
      }
      setHasMore(data.length === 10);
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setFeedLoading(false);
    }
  }, [isDemo]);

  // Load following feed
  const loadFollowingPosts = useCallback(async (pageNum = 0) => {
    if (!user || isDemo) {
      setFollowingLoading(false);
      return;
    }
    setFollowingLoading(true);
    try {
      const data = await getFollowingFeed(user.id, pageNum, 10);
      if (pageNum === 0) {
        setFollowingPosts(data);
      } else {
        setFollowingPosts(prev => [...prev, ...data]);
      }
      setFollowingHasMore(data.length === 10);
      setFollowingLoaded(true);
    } catch (err) {
      console.error('Failed to load following feed:', err);
    } finally {
      setFollowingLoading(false);
    }
  }, [user, isDemo]);

  // Load liked state
  const loadLikes = useCallback(async () => {
    if (!user || isDemo) return;
    try {
      const liked = await getUserLikedPostIds(user.id);
      setLikedPosts(liked);
    } catch (err) {
      console.error('Failed to load likes:', err);
    }
  }, [user, isDemo]);

  // Load unread counts
  const loadUnread = useCallback(async () => {
    if (!user || isDemo) return;
    try {
      const [notifCount, msgCount] = await Promise.all([
        getUnreadNotificationCount(user.id),
        getTotalUnreadMessages(user.id),
      ]);
      setUnreadCount(notifCount);
      setUnreadMessages(msgCount);
    } catch (err) {
      console.error('Failed to load unread count:', err);
    }
  }, [user, isDemo]);

  useEffect(() => {
    if (!loading && user) {
      loadPosts(0);
      loadLikes();
      loadUnread();
    }
  }, [loading, user, loadPosts, loadLikes, loadUnread]);

  // Load following feed when tab switches (lazy load)
  useEffect(() => {
    if (activeTab === 'following' && !followingLoaded && user && !isDemo) {
      loadFollowingPosts(0);
    }
  }, [activeTab, followingLoaded, user, isDemo, loadFollowingPosts]);

  // Infinite scroll refs & state (must be before early return)
  const observerRef = useRef<HTMLDivElement>(null);
  const followingObserverRef = useRef<HTMLDivElement>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Pull-to-refresh state (must be before early return)
  const [refreshing, setRefreshing] = useState(false);
  const pullStartY = useRef(0);
  const [pullDistance, setPullDistance] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (contentRef.current && contentRef.current.scrollTop === 0) {
      pullStartY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (pullStartY.current === 0 || refreshing) return;
    const diff = e.touches[0].clientY - pullStartY.current;
    if (diff > 0 && contentRef.current && contentRef.current.scrollTop === 0) {
      setPullDistance(Math.min(diff * 0.4, 80));
    }
  }, [refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance > 60 && !refreshing) {
      setRefreshing(true);
      setPullDistance(60);
      setPage(0);
      await Promise.all([loadPosts(0), loadLikes(), loadUnread()]);
      if (activeTab === 'following') {
        setFollowingPage(0);
        await loadFollowingPosts(0);
      }
      setRefreshing(false);
    }
    setPullDistance(0);
    pullStartY.current = 0;
  }, [pullDistance, refreshing, loadPosts, loadLikes, loadUnread, activeTab, loadFollowingPosts]);

  // Infinite scroll observers
  useEffect(() => {
    const el = observerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !feedLoading && !loadingMore && posts.length > 0) {
          setLoadingMore(true);
          const nextPage = page + 1;
          setPage(nextPage);
          loadPosts(nextPage).finally(() => setLoadingMore(false));
        }
      },
      { rootMargin: '200px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, feedLoading, loadingMore, page, posts.length, loadPosts]);

  useEffect(() => {
    const el = followingObserverRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && followingHasMore && !followingLoading && followingPosts.length > 0) {
          const nextPage = followingPage + 1;
          setFollowingPage(nextPage);
          loadFollowingPosts(nextPage);
        }
      },
      { rootMargin: '200px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [followingHasMore, followingLoading, followingPosts.length, followingPage, loadFollowingPosts]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <h1 className="font-playfair italic text-3xl tracking-editorial text-ink animate-pulse">
          PASSEPORT
        </h1>
      </div>
    );
  }

  const handleLike = async (postId: string) => {
    if (isDemo) return;
    setLikedPosts(prev => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
    const updateFn = (prev: (Post & { user: User })[]) => prev.map(p => {
      if (p.id === postId) {
        const wasLiked = likedPosts.has(postId);
        return { ...p, likes_count: (p.likes_count || 0) + (wasLiked ? -1 : 1) };
      }
      return p;
    });
    setPosts(updateFn);
    setFollowingPosts(updateFn);
    try {
      await toggleLike(user.id, postId);
    } catch (err) {
      console.error('Like failed:', err);
      setLikedPosts(prev => {
        const next = new Set(prev);
        if (next.has(postId)) next.delete(postId);
        else next.add(postId);
        return next;
      });
    }
  };

  const featured = posts[0];
  const rest = posts.slice(1);

  return (
    <div
      ref={contentRef}
      className="min-h-screen bg-cream pb-20"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {pullDistance > 0 && (
        <div
          className="flex items-center justify-center overflow-hidden transition-all"
          style={{ height: pullDistance }}
        >
          <div className={`w-6 h-6 border-2 border-taupe/30 border-t-ink rounded-full ${refreshing ? 'animate-spin' : ''}`}
            style={{ transform: `rotate(${pullDistance * 4}deg)` }}
          />
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-cream/95 backdrop-blur-md">
        <div className="flex items-center justify-between px-5 pt-14 pb-3">
          <h1 className="font-playfair italic text-2xl tracking-editorial text-ink">
            PASSEPORT
          </h1>
          <div className="flex items-center gap-1">
            <Link href="/messages" className="relative p-2">
              <MessageIcon className="w-5 h-5 text-ink" />
              {unreadMessages > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-[#E8927C] text-white text-[9px] font-inter font-bold rounded-full flex items-center justify-center px-1">
                  {unreadMessages > 99 ? '99+' : unreadMessages}
                </span>
              )}
            </Link>
            <Link href="/notifications" className="relative p-2">
              <BellIcon className="w-5 h-5 text-ink" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-[#E8927C] text-white text-[9px] font-inter font-bold rounded-full flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-5 gap-6 border-b border-border">
          <button
            onClick={() => setActiveTab('foryou')}
            className={`pb-3 text-sm tracking-editorial uppercase font-inter transition-colors relative ${
              activeTab === 'foryou' ? 'text-ink' : 'text-taupe'
            }`}
          >
            For You
            {activeTab === 'foryou' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-ink" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`pb-3 text-sm tracking-editorial uppercase font-inter transition-colors relative ${
              activeTab === 'following' ? 'text-ink' : 'text-taupe'
            }`}
          >
            Following
            {activeTab === 'following' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-ink" />
            )}
          </button>
        </div>
      </header>

      {/* Stories */}
      <StoriesBar />

      {/* Content */}
      <div className="px-5 pt-5">
        {/* Following tab */}
        {activeTab === 'following' && followingLoading && !followingLoaded && (
          <div className="space-y-5">
            <PostCardSkeleton />
            <PostCardSkeleton />
            <PostCardSkeleton />
          </div>
        )}

        {activeTab === 'following' && !followingLoading && followingPosts.length === 0 && (
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
              FOLLOW CREATORS
            </h3>
            <p className="text-sm text-taupe font-noto mb-6">
              追蹤你喜歡的創作者，這裡會顯示他們的最新文章
            </p>
            <Link
              href="/discover"
              className="inline-block px-6 py-2.5 bg-ink text-cream text-xs tracking-editorial uppercase rounded-full font-inter"
            >
              DISCOVER
            </Link>
          </div>
        )}

        {activeTab === 'following' && !followingLoading && followingPosts.length > 0 && (
          <>
            <div className="space-y-5">
              {followingPosts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  isLiked={likedPosts.has(post.id)}
                  onLike={() => handleLike(post.id)}
                />
              ))}
            </div>

            {/* Infinite scroll trigger */}
            <div ref={followingObserverRef} className="h-4" />
            {followingLoading && followingLoaded && (
              <div className="py-4">
                <PostCardSkeleton />
              </div>
            )}

            {!followingHasMore && followingPosts.length > 0 && (
              <div className="mt-10 mb-8 text-center">
                <div className="flex items-center gap-4 justify-center">
                  <span className="w-12 h-px bg-border" />
                  <span className="text-[10px] text-taupe tracking-[0.3em] uppercase font-inter">
                    All Caught Up
                  </span>
                  <span className="w-12 h-px bg-border" />
                </div>
              </div>
            )}
          </>
        )}

        {/* Skeleton Loading State */}
        {activeTab === 'foryou' && feedLoading && (
          <FeedSkeleton />
        )}

        {/* Empty State */}
        {activeTab === 'foryou' && !feedLoading && posts.length === 0 && (
          <div className="py-20 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-surface flex items-center justify-center">
              <svg className="w-8 h-8 text-taupe" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <h3 className="font-playfair italic text-lg tracking-editorial text-ink mb-2">
              START YOUR JOURNEY
            </h3>
            <p className="text-xs text-taupe font-noto mb-6 leading-relaxed">
              {isDemo ? '目前是訪客模式，註冊帳號後即可發文' : '還沒有文章，成為第一個分享的人吧！'}
            </p>
            {!isDemo && (
              <Link
                href="/create"
                className="inline-block px-6 py-2.5 bg-ink text-cream text-xs tracking-editorial uppercase rounded-full font-inter"
              >
                CREATE POST
              </Link>
            )}
          </div>
        )}

        {/* Feed */}
        {activeTab === 'foryou' && !feedLoading && posts.length > 0 && (
          <>
            {/* Featured Card */}
            {featured && (
              <FeaturedCard
                post={featured}
                isLiked={likedPosts.has(featured.id)}
                onLike={() => handleLike(featured.id)}
              />
            )}

            {/* Section Title */}
            {rest.length > 0 && (
              <div className="mt-8 mb-4 flex items-center justify-between">
                <h2 className="font-playfair italic text-lg tracking-editorial text-ink">
                  LATEST
                </h2>
                <span className="text-[10px] text-taupe tracking-widest uppercase font-inter">
                  最新文章
                </span>
              </div>
            )}

            {/* Post Cards */}
            <div className="space-y-5 stagger-children">
              {rest.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  isLiked={likedPosts.has(post.id)}
                  onLike={() => handleLike(post.id)}
                />
              ))}
            </div>

            {/* Infinite scroll trigger */}
            <div ref={observerRef} className="h-4" />
            {loadingMore && (
              <div className="py-4">
                <PostCardSkeleton />
              </div>
            )}

            {/* End of Feed */}
            {!hasMore && posts.length > 0 && (
              <div className="mt-10 mb-8 text-center">
                <div className="flex items-center gap-4 justify-center">
                  <span className="w-12 h-px bg-border" />
                  <span className="text-[10px] text-taupe tracking-[0.3em] uppercase font-inter">
                    End of Feed
                  </span>
                  <span className="w-12 h-px bg-border" />
                </div>
                <p className="mt-3 text-xs text-taupe font-noto">
                  探索更多靈感，發現你的生活風格
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <PushNotificationPrompt />
      <BottomNav />
    </div>
  );
}

function FeaturedCard({ post, isLiked, onLike }: { post: Post & { user: User }; isLiked: boolean; onLike: () => void }) {
  const cat = CATEGORIES.find(c => c.value === post.category);

  return (
    <Link href={`/post/${post.id}`} className="block">
      <div className="relative aspect-[4/5] rounded-2xl overflow-hidden group">
        <Image
          src={post.cover_image_url}
          alt={post.title}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Category Badge */}
        <div className="absolute top-4 left-4">
          <span className="bg-cream/90 backdrop-blur-sm text-ink text-[10px] tracking-widest uppercase font-inter px-3 py-1.5 rounded-full">
            {cat?.labelEn}
          </span>
        </div>

        {/* Like Button */}
        <button
          onClick={(e) => { e.preventDefault(); onLike(); }}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center press-scale"
        >
          <HeartIcon className={`w-4 h-4 ${isLiked ? 'animate-heart-pop' : ''}`} filled={isLiked} />
        </button>

        {/* Bottom Content */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h2 className="font-playfair italic text-2xl text-white tracking-editorial leading-tight mb-2">
            {post.title}
          </h2>
          <p className="text-white/70 text-xs font-noto line-clamp-2 mb-3">
            {post.subtitle}
          </p>
          <div className="flex items-center gap-2">
            {post.user?.avatar_url && (
              <img
                src={post.user.avatar_url}
                alt={post.user.display_name}
                className="w-6 h-6 rounded-full object-cover border border-white/30"
              />
            )}
            <span className="text-white/80 text-xs font-inter">
              {post.user?.display_name}
            </span>
            {post.location && (
              <>
                <span className="text-white/40 text-xs">·</span>
                <span className="text-white/50 text-xs font-inter">
                  {post.location.split(',')[0]}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function PostCard({ post, isLiked, onLike }: { post: Post & { user: User }; isLiked: boolean; onLike: () => void }) {
  const cat = CATEGORIES.find(c => c.value === post.category);

  return (
    <Link href={`/post/${post.id}`} className="block">
      <div className="flex gap-4 group">
        <div className="relative w-28 h-36 rounded-xl overflow-hidden flex-shrink-0">
          <Image
            src={post.cover_image_url}
            alt={post.title}
            fill
            sizes="112px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="flex-1 flex flex-col justify-between py-1">
          <div>
            <span className="text-[9px] tracking-widest uppercase font-inter text-taupe">
              {cat?.labelEn} · {cat?.labelZh}
            </span>
            <h3 className="font-playfair italic text-base tracking-wide text-ink mt-1 leading-snug">
              {post.title}
            </h3>
            <p className="text-xs text-taupe font-noto mt-1 line-clamp-2 leading-relaxed">
              {post.subtitle || post.content.slice(0, 60)}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {post.user?.avatar_url && (
                <img
                  src={post.user.avatar_url}
                  alt=""
                  className="w-4 h-4 rounded-full object-cover"
                />
              )}
              <span className="text-[10px] text-taupe font-inter">{post.user?.display_name}</span>
            </div>
            <button
              onClick={(e) => { e.preventDefault(); onLike(); }}
              className="flex items-center gap-1 p-1 press-scale"
            >
              <HeartIcon className={`w-3.5 h-3.5 ${isLiked ? 'animate-heart-pop' : ''}`} filled={isLiked} />
              {(post.likes_count || 0) > 0 && (
                <span className="text-[10px] text-taupe font-inter">{post.likes_count}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

function HeartIcon({ className, filled }: { className?: string; filled?: boolean }) {
  if (filled) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="#e74c3c" stroke="none">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

function MessageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}
