'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getPostById, isPostLiked, toggleLike, getComments, addComment, deleteComment, deletePost, isFollowing as checkFollowing, toggleFollow, isPostBookmarked, toggleBookmark, incrementPostView } from '@/lib/db';
import { CATEGORIES, Post, User, Comment } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import ConfirmDialog from '@/components/confirm-dialog';
import { ReportModal } from '@/components/report-modal';
import { PostDetailSkeleton } from '@/components/skeleton';
import { useIsDesktop } from '@/components/desktop-frame';
import { useToast } from '@/components/toast';
import { Lightbox } from '@/components/lightbox';
import { Markdown } from '@/components/markdown';

export default function PostDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isDemo } = useAuth();
  const isDesktop = useIsDesktop();
  const [post, setPost] = useState<(Post & { user: User }) | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState<(Comment & { user: User })[]>([]);
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [placeCoords, setPlaceCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showLightbox, setShowLightbox] = useState(false);
  const [doubleTapHeart, setDoubleTapHeart] = useState(false);
  const lastTapRef = useRef(0);
  const { toast } = useToast();

  const loadPost = useCallback(async () => {
    if (!id || isDemo) {
      setPageLoading(false);
      return;
    }
    try {
      const data = await getPostById(id as string);
      setPost(data);
      setLikeCount(data.likes_count || 0);

      // Set dynamic page title
      document.title = `${data.title} — PASSEPORT`;

      // Track view (fire and forget)
      incrementPostView(data.id);

      // Check like, bookmark & follow status
      if (user) {
        const [liked, saved] = await Promise.all([
          isPostLiked(user.id, data.id),
          isPostBookmarked(user.id, data.id),
        ]);
        setIsLiked(liked);
        setIsSaved(saved);
        if (data.user_id !== user.id) {
          const following = await checkFollowing(user.id, data.user_id);
          setIsFollowing(following);
        }
      }

      // Load comments
      const cmts = await getComments(data.id);
      setComments(cmts);

      // Fetch linked place coordinates for map link
      try {
        const { getPostPlace } = await import('@/lib/db');
        const linkedPlace = await getPostPlace(data.id);
        if (linkedPlace?.latitude && linkedPlace?.longitude) {
          setPlaceCoords({ lat: linkedPlace.latitude, lng: linkedPlace.longitude });
        }
      } catch { /* non-critical */ }
    } catch (err) {
      console.error('Failed to load post:', err);
    } finally {
      setPageLoading(false);
    }
  }, [id, user, isDemo]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  if (pageLoading) {
    return <PostDetailSkeleton />;
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center gap-4">
        <p className="text-taupe font-noto">文章不存在</p>
        <button onClick={() => router.back()} className="text-xs text-ink font-inter underline">
          返回
        </button>
      </div>
    );
  }

  const cat = CATEGORIES.find(c => c.value === post.category);

  const handleLike = async () => {
    if (!user || isDemo) return;
    // Optimistic
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikeCount(prev => wasLiked ? prev - 1 : prev + 1);
    try {
      await toggleLike(user.id, post.id);
    } catch {
      setIsLiked(wasLiked);
      setLikeCount(prev => wasLiked ? prev + 1 : prev - 1);
    }
  };

  const handleComment = async () => {
    if (!user || isDemo || !commentText.trim()) return;
    try {
      const newComment = await addComment(post.id, user.id, commentText.trim(), replyTo?.id);
      setComments(prev => [...prev, newComment]);
      setCommentText('');
      setReplyTo(null);
    } catch (err) {
      console.error('Comment failed:', err);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: post.subtitle,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast('連結已複製');
      }
    } catch {
      // User cancelled share dialog — ignore
    }
  };

  // Double-tap to like on hero image
  const handleHeroTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap detected
      if (!isLiked && user && !isDemo) {
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
        toggleLike(user.id, post!.id).catch(() => {
          setIsLiked(false);
          setLikeCount(prev => prev - 1);
        });
      }
      setDoubleTapHeart(true);
      setTimeout(() => setDoubleTapHeart(false), 800);
    }
    lastTapRef.current = now;
  };

  const isOwner = user?.id === post.user_id;

  const handleDelete = async () => {
    try {
      await deletePost(post.id, user!.id);
      router.push('/');
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-cream pb-24">
      {/* Hero Image */}
      <div className="relative aspect-[3/4] overflow-hidden" onClick={handleHeroTap}>
        <Image
          src={post.cover_image_url}
          alt={post.title}
          fill
          priority
          sizes="100vw"
          className="object-cover cursor-pointer"
          onClick={(e) => {
            // Single tap opens lightbox (after double-tap check timeout)
            setTimeout(() => {
              if (Date.now() - lastTapRef.current > 300) {
                setShowLightbox(true);
              }
            }, 310);
            e.stopPropagation();
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

        {/* Double-tap heart animation */}
        {doubleTapHeart && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <svg className="w-24 h-24 text-white drop-shadow-lg animate-heart-pop" viewBox="0 0 24 24" fill="white" stroke="none">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
          </div>
        )}

        {/* Top Nav */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-12 pb-4">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
          >
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
            >
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
              </svg>
            </button>

            {!isOwner && user && (
              <button
                onClick={() => setShowReport(true)}
                className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
              >
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" y1="22" x2="4" y2="15" />
                </svg>
              </button>
            )}

            {isOwner && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                >
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="1.5" />
                    <circle cx="12" cy="12" r="1.5" />
                    <circle cx="12" cy="19" r="1.5" />
                  </svg>
                </button>

                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 top-11 z-40 bg-surface border border-border rounded-xl shadow-lg overflow-hidden min-w-[140px]">
                      <Link
                        href={`/post/${post.id}/edit`}
                        className="block px-4 py-3 text-sm font-noto text-ink hover:bg-cream transition-colors"
                        onClick={() => setShowMenu(false)}
                      >
                        編輯文章
                      </Link>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          setShowDeleteDialog(true);
                        }}
                        className="block w-full text-left px-4 py-3 text-sm font-noto text-red-500 hover:bg-cream transition-colors"
                      >
                        刪除文章
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <span className="inline-block bg-cream/90 backdrop-blur-sm text-ink text-[9px] tracking-widest uppercase font-inter px-3 py-1 rounded-full mb-3">
            {cat?.labelEn} · {cat?.labelZh}
          </span>
          <h1 className="font-playfair italic text-3xl text-white tracking-editorial leading-tight mb-2">
            {post.title}
          </h1>
          <div className="flex items-center gap-2 text-white/60 text-xs font-inter">
            {post.location && (
              <>
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {placeCoords ? (
                  <Link href={`/map?lat=${placeCoords.lat}&lng=${placeCoords.lng}&zoom=16`} className="hover:text-white/90 underline underline-offset-2 decoration-white/30">
                    {post.location.split(',')[0]}
                  </Link>
                ) : (
                  <span>{post.location.split(',')[0]}</span>
                )}
                <span>·</span>
              </>
            )}
            <span>{formatDate(post.created_at)}</span>
            {(post.views_count ?? 0) > 0 && (
              <>
                <span>·</span>
                <span>{post.views_count} 次瀏覽</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Author Card */}
      <div className="mx-5 -mt-5 bg-cream border border-border rounded-xl p-4 flex items-center justify-between relative z-10 shadow-sm">
        <Link href={`/profile/${post.user?.username}`} className="flex items-center gap-3">
          {post.user?.avatar_url ? (
            <img
              src={post.user.avatar_url}
              alt={post.user.display_name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center">
              <span className="text-sm font-playfair italic text-taupe">
                {post.user?.display_name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-ink font-inter">{post.user?.display_name}</p>
            <p className="text-[10px] text-taupe font-inter">@{post.user?.username}</p>
          </div>
        </Link>
        {user?.id !== post.user_id && (
          <button
            onClick={async () => {
              if (!user || isDemo) return;
              const was = isFollowing;
              setIsFollowing(!was);
              try {
                await toggleFollow(user.id, post.user_id);
              } catch {
                setIsFollowing(was);
              }
            }}
            className={`px-4 py-1.5 text-[10px] tracking-editorial uppercase rounded-full font-inter transition-colors ${
              isFollowing
                ? 'border border-border text-taupe'
                : 'bg-ink text-cream'
            }`}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        )}
      </div>

      {/* Subtitle */}
      {post.subtitle && (
        <div className="px-6 mt-8 mb-6">
          <p className="font-playfair italic text-base text-ink/70 leading-relaxed">
            {post.subtitle}
          </p>
        </div>
      )}

      {/* Divider */}
      <div className="mx-6 h-px bg-border mb-6" />

      {/* Body Content — supports Markdown */}
      <article className="px-6">
        <Markdown content={post.content} className="drop-cap" />
      </article>

      {/* Additional Images */}
      {post.additional_images && post.additional_images.length > 0 && (
        <div className="px-5 mt-6 space-y-3">
          {post.additional_images.map((img, i) => (
            <div key={i} className="rounded-xl overflow-hidden">
              <img
                src={img}
                alt={`${post.title} - ${i + 1}`}
                className="w-full h-auto"
              />
            </div>
          ))}
        </div>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="px-6 mt-8">
          <div className="flex flex-wrap gap-2">
            {post.tags.map(tag => (
              <span
                key={tag}
                className="text-[10px] text-taupe bg-surface px-3 py-1.5 rounded-full font-noto cursor-pointer hover:bg-border transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* End Mark */}
      <div className="mt-10 text-center">
        <div className="flex items-center gap-4 justify-center">
          <span className="w-12 h-px bg-border" />
          <span className="font-playfair italic text-lg text-taupe">fin.</span>
          <span className="w-12 h-px bg-border" />
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="px-6 mt-8 border-t border-border pt-6">
          <h3 className="font-playfair italic text-base tracking-editorial text-ink mb-4">
            COMMENTS ({comments.length})
          </h3>

          {/* Comment List */}
          <div className="space-y-4 mb-4">
            {comments.map(comment => (
              <div key={comment.id} className="flex gap-3 group">
                <div className="w-8 h-8 rounded-full bg-surface flex-shrink-0 overflow-hidden">
                  {comment.user?.avatar_url ? (
                    <img src={comment.user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xs text-taupe">{comment.user?.display_name?.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-inter font-medium text-ink">{comment.user?.display_name}</p>
                    {user?.id === comment.user_id && (
                      <button
                        onClick={async () => {
                          try {
                            await deleteComment(comment.id, user.id);
                            setComments(prev => prev.filter(c => c.id !== comment.id));
                          } catch (err) {
                            console.error('Delete comment failed:', err);
                          }
                        }}
                        className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1 text-taupe hover:text-red-400"
                        title="刪除留言"
                      >
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  {comment.parent_id && (
                    <p className="text-[9px] text-taupe/60 font-noto mb-0.5">↳ 回覆</p>
                  )}
                  <p className="text-xs text-ink/70 font-noto mt-0.5 leading-relaxed">{comment.content}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-[9px] text-taupe font-inter">
                      {new Date(comment.created_at).toLocaleDateString('zh-TW')}
                    </p>
                    {user && !isDemo && (
                      <button
                        onClick={() => setReplyTo({ id: comment.id, name: comment.user?.display_name || '' })}
                        className="text-[9px] text-taupe hover:text-ink font-inter transition-colors"
                      >
                        回覆
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-xs text-taupe font-noto text-center py-4">還沒有留言</p>
            )}
          </div>

          {/* Comment Input */}
          {user && !isDemo && (
            <div>
              {replyTo && (
                <div className="flex items-center gap-2 mb-1.5 px-1">
                  <span className="text-[10px] text-taupe font-noto">回覆 {replyTo.name}</span>
                  <button
                    onClick={() => setReplyTo(null)}
                    className="text-[10px] text-taupe hover:text-ink"
                  >
                    ✕
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={replyTo ? `回覆 ${replyTo.name}...` : '寫下你的想法...'}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleComment(); }}
                  className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-xs font-noto text-ink placeholder:text-taupe/50 focus:outline-none focus:border-taupe"
                />
                <button
                  onClick={handleComment}
                  disabled={!commentText.trim()}
                  className="px-3 py-2 bg-ink text-cream rounded-lg text-xs font-inter disabled:opacity-30"
                >
                  發送
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="刪除文章"
        message="確定要刪除這篇文章嗎？此操作無法復原。"
        confirmLabel="刪除"
        cancelLabel="取消"
        danger
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />

      {user && !isOwner && (
        <ReportModal
          isOpen={showReport}
          onClose={() => setShowReport(false)}
          reporterId={user.id}
          targetType="post"
          targetId={post.id}
          targetName={post.user?.display_name}
          showBlock
          onBlocked={() => router.push('/')}
        />
      )}

      {/* Sticky Bottom Bar */}
      <div className={`${isDesktop ? 'sticky' : 'fixed left-0 right-0'} bottom-0 z-40 bg-cream/95 backdrop-blur-md border-t border-border`}>
        <div className="flex items-center justify-around h-14 px-6 max-w-lg mx-auto">
          <button onClick={handleLike} className="flex items-center gap-1.5 py-2 px-3">
            {isLiked ? (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#e74c3c" stroke="none">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
            )}
            <span className="text-xs font-inter text-ink">{likeCount}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 py-2 px-3"
          >
            <svg className="w-5 h-5 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            <span className="text-xs font-inter text-ink">{comments.length}</span>
          </button>

          <button
            onClick={async () => {
              if (!user || isDemo) return;
              const was = isSaved;
              setIsSaved(!was);
              toast(was ? '已取消收藏' : '已收藏');
              try {
                await toggleBookmark(user.id, post.id);
              } catch {
                setIsSaved(was);
              }
            }}
            className="flex items-center gap-1.5 py-2 px-3 press-scale"
          >
            {isSaved ? (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#222222" stroke="none">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
            )}
          </button>

          <button onClick={handleShare} className="flex items-center gap-1.5 py-2 px-3 press-scale">
            <svg className="w-5 h-5 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
            </svg>
          </button>
        </div>
      </div>

      {/* Lightbox */}
      {showLightbox && (
        <Lightbox
          src={post.cover_image_url}
          alt={post.title}
          onClose={() => setShowLightbox(false)}
        />
      )}
    </div>
  );
}
