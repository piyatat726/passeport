'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getNotifications, markNotificationsRead } from '@/lib/db';
import { Notification } from '@/lib/types';
import Link from 'next/link';

export default function NotificationsPage() {
  const { user, isDemo } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || isDemo) {
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const data = await getNotifications(user.id);
        setNotifications(data);
        // Mark all as read
        markNotificationsRead(user.id);
      } catch (err) {
        console.error('Failed to load notifications:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, isDemo]);

  const timeAgo = (dateStr: string) => {
    const now = Date.now();
    const diff = now - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '剛剛';
    if (mins < 60) return `${mins} 分鐘前`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} 小時前`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days} 天前`;
    return new Date(dateStr).toLocaleDateString('zh-TW');
  };

  const getNotifText = (n: Notification) => {
    switch (n.type) {
      case 'like':
        return <>喜歡了你的文章{n.post ? <span className="font-medium">「{n.post.title}」</span> : ''}</>;
      case 'comment':
        return <>留言了你的文章{n.post ? <span className="font-medium">「{n.post.title}」</span> : ''}{n.comment_text ? <span className="text-taupe">：{n.comment_text}</span> : ''}</>;
      case 'follow':
        return <>開始追蹤你</>;
      default:
        return <>互動了你的內容</>;
    }
  };

  const getNotifLink = (n: Notification) => {
    if (n.type === 'follow' && n.actor) return `/profile/${n.actor.username}`;
    if (n.post_id) return `/post/${n.post_id}`;
    return '#';
  };

  return (
    <div className="min-h-screen bg-cream pb-10">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-cream/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center px-5 pt-14 pb-4 gap-3">
          <button onClick={() => router.back()} className="p-1">
            <svg className="w-5 h-5 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="font-playfair italic text-xl tracking-editorial text-ink">
            NOTIFICATIONS
          </h1>
        </div>
      </header>

      <div className="px-5 pt-4">
        {loading && (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-taupe/30 border-t-ink rounded-full animate-spin mx-auto" />
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="py-20 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-surface flex items-center justify-center">
              <svg className="w-8 h-8 text-taupe" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </div>
            <h3 className="font-playfair italic text-lg tracking-editorial text-ink mb-2">
              ALL QUIET
            </h3>
            <p className="text-sm text-taupe font-noto">
              還沒有通知，開始互動吧！
            </p>
          </div>
        )}

        {!loading && notifications.length > 0 && (
          <div className="space-y-1">
            {notifications.map(n => (
              <Link
                key={n.id}
                href={getNotifLink(n)}
                className={`flex items-center gap-3 px-3 py-3.5 rounded-xl transition-colors ${
                  n.is_read ? 'hover:bg-surface/50' : 'bg-surface/60 hover:bg-surface'
                }`}
              >
                {/* Unread dot */}
                <div className="w-2 flex-shrink-0">
                  {!n.is_read && <div className="w-2 h-2 rounded-full bg-[#E8927C]" />}
                </div>

                {/* Actor Avatar */}
                <div className="w-10 h-10 rounded-full bg-surface flex-shrink-0 overflow-hidden">
                  {n.actor?.avatar_url ? (
                    <img src={n.actor.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-sm text-taupe font-playfair italic">
                        {n.actor?.display_name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-ink font-noto leading-relaxed line-clamp-2">
                    <span className="font-semibold font-inter">{n.actor?.display_name}</span>
                    {' '}{getNotifText(n)}
                  </p>
                  <p className="text-[10px] text-taupe font-inter mt-0.5">{timeAgo(n.created_at)}</p>
                </div>

                {/* Post Thumbnail */}
                {n.post?.cover_image_url && (
                  <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={n.post.cover_image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Follow icon for follow notifications */}
                {n.type === 'follow' && (
                  <div className="w-11 h-11 rounded-lg bg-surface flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-taupe" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M19 8v6M22 11h-6" />
                    </svg>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
