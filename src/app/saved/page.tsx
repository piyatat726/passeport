'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getBookmarkedPosts, toggleBookmark } from '@/lib/db';
import { Post, User } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';

export default function SavedPage() {
  const { user, loading, isDemo } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<(Post & { user: User })[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  // Auth guard
  useEffect(() => {
    if (!loading && !user && !isDemo) {
      router.replace('/auth');
    }
  }, [loading, user, isDemo, router]);

  const loadPosts = useCallback(async () => {
    if (!user || isDemo) {
      setDataLoading(false);
      return;
    }
    try {
      const data = await getBookmarkedPosts(user.id);
      setPosts(data);
    } catch (err) {
      console.error('Failed to load saved posts:', err);
    } finally {
      setDataLoading(false);
    }
  }, [user, isDemo]);

  useEffect(() => {
    if (!loading && user) {
      loadPosts();
    }
  }, [loading, user, loadPosts]);

  const handleUnsave = async (postId: string) => {
    if (!user || isDemo) return;

    // Optimistic: animate out then remove
    setRemovingIds(prev => new Set(prev).add(postId));

    // Wait for CSS transition to finish before removing from state
    setTimeout(() => {
      setPosts(prev => prev.filter(p => p.id !== postId));
      setRemovingIds(prev => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }, 300);

    try {
      await toggleBookmark(user.id, postId);
    } catch {
      // Revert on failure
      setRemovingIds(prev => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
      loadPosts();
    }
  };

  // Loading state
  if (loading || (user && dataLoading)) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-taupe/30 border-t-ink rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-cream/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 h-14 pt-[env(safe-area-inset-top)]">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="font-playfair italic text-sm tracking-editorial uppercase text-ink">
            Saved
          </h1>
          <div className="w-8" />
        </div>
      </div>

      {/* Empty State */}
      {!dataLoading && posts.length === 0 && (
        <div className="flex flex-col items-center justify-center px-6 pt-32">
          <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-taupe" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
            </svg>
          </div>
          <h2 className="font-playfair italic text-lg tracking-editorial uppercase text-ink mb-2">
            No Saved Posts
          </h2>
          <p className="text-xs text-taupe font-noto">
            收藏喜歡的文章，方便日後回顧
          </p>
        </div>
      )}

      {/* Posts Grid */}
      {posts.length > 0 && (
        <div className="grid grid-cols-2 gap-3 px-4 pt-4">
          {posts.map(post => (
            <div
              key={post.id}
              className={`transition-all duration-300 ${
                removingIds.has(post.id)
                  ? 'opacity-0 scale-95'
                  : 'opacity-100 scale-100'
              }`}
            >
              {/* Image */}
              <div className="relative">
                <Link href={`/post/${post.id}`}>
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-surface">
                    {post.cover_image_url ? (
                      <Image
                        src={post.cover_image_url}
                        alt={post.title}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-taupe/40 font-playfair italic text-lg">P</span>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Unsave Button */}
                <button
                  onClick={() => handleUnsave(post.id)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-cream/80 backdrop-blur-sm flex items-center justify-center shadow-sm active:scale-90 transition-transform"
                >
                  <svg className="w-3.5 h-3.5 text-ink" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                  </svg>
                </button>
              </div>

              {/* Info */}
              <Link href={`/post/${post.id}`} className="block mt-2 px-0.5">
                <p className="text-xs font-inter font-medium text-ink line-clamp-2 leading-snug">
                  {post.title}
                </p>
                {post.user && (
                  <p className="text-[10px] text-taupe font-inter mt-1">
                    {post.user.display_name || post.user.username}
                  </p>
                )}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
