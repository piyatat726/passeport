'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getConversations } from '@/lib/db';
import { Conversation } from '@/lib/types';
import Link from 'next/link';

export default function MessagesPage() {
  const { user, isDemo } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user && !isDemo) {
      router.push('/auth');
      return;
    }
    if (!user || isDemo) {
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const data = await getConversations(user.id);
        setConversations(data);
      } catch (err) {
        console.error('Failed to load conversations:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, isDemo, router]);

  const timeAgo = (dateStr: string) => {
    if (!dateStr) return '';
    const now = Date.now();
    const diff = now - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '剛剛';
    if (mins < 60) return `${mins}分鐘`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}小時`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}天`;
    return new Date(dateStr).toLocaleDateString('zh-TW');
  };

  return (
    <div className="min-h-screen bg-cream pb-10">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-cream/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-5 pt-14 pb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-1">
              <svg className="w-5 h-5 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <h1 className="font-playfair italic text-xl tracking-editorial text-ink">
              MESSAGES
            </h1>
          </div>
        </div>
      </header>

      <div className="px-5 pt-2">
        {loading && (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-taupe/30 border-t-ink rounded-full animate-spin mx-auto" />
          </div>
        )}

        {!loading && conversations.length === 0 && (
          <div className="py-20 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-surface flex items-center justify-center">
              <svg className="w-8 h-8 text-taupe" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <h3 className="font-playfair italic text-lg tracking-editorial text-ink mb-2">
              NO MESSAGES YET
            </h3>
            <p className="text-sm text-taupe font-noto">
              還沒有訊息，去別人的個人頁面開始聊天吧！
            </p>
          </div>
        )}

        {!loading && conversations.length > 0 && (
          <div className="space-y-0.5">
            {conversations.map(conv => (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                className="flex items-center gap-3 px-2 py-3.5 rounded-xl hover:bg-surface/50 transition-colors"
              >
                {/* Avatar */}
                <div className="w-13 h-13 rounded-full bg-surface flex-shrink-0 overflow-hidden relative" style={{ width: 52, height: 52 }}>
                  {conv.other_user?.avatar_url ? (
                    <img src={conv.other_user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-base text-taupe font-playfair italic">
                        {conv.other_user?.display_name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  {/* Online dot (decorative) */}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`font-inter text-sm truncate ${
                      (conv.unread_count || 0) > 0 ? 'font-bold text-ink' : 'font-semibold text-ink'
                    }`}>
                      {conv.other_user?.display_name}
                    </p>
                    <span className="text-[10px] text-taupe font-inter flex-shrink-0 ml-2">
                      {timeAgo(conv.last_message_at)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className={`text-xs truncate ${
                      (conv.unread_count || 0) > 0 ? 'text-ink font-medium' : 'text-taupe'
                    } font-noto`}>
                      {conv.last_message_text || '開始聊天...'}
                    </p>
                    {(conv.unread_count || 0) > 0 && (
                      <span className="min-w-[18px] h-[18px] bg-[#E8927C] text-white text-[9px] font-inter font-bold rounded-full flex items-center justify-center px-1 flex-shrink-0 ml-2">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
