'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getMessages, sendMessage, markMessagesRead } from '@/lib/db';
import { Message } from '@/lib/types';
import { createClient } from '@/utils/supabase/client';

export default function ChatPage() {
  const { id: conversationId } = useParams();
  const { user, isDemo } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState<{ display_name: string; avatar_url: string; username: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load messages and conversation info
  useEffect(() => {
    if (!user || isDemo || !conversationId) {
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const supabase = createClient();

        // Get conversation details
        const { data: conv } = await supabase
          .from('conversations')
          .select('*, user1:users!conversations_user1_id_fkey(*), user2:users!conversations_user2_id_fkey(*)')
          .eq('id', conversationId)
          .single();

        if (conv) {
          const other = conv.user1_id === user.id ? conv.user2 : conv.user1;
          setOtherUser(other);
        }

        const msgs = await getMessages(conversationId as string);
        setMessages(msgs);

        // Mark as read
        await markMessagesRead(conversationId as string, user.id);
      } catch (err) {
        console.error('Failed to load chat:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, isDemo, conversationId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!user || isDemo || !conversationId) return;

    const interval = setInterval(async () => {
      try {
        const msgs = await getMessages(conversationId as string);
        setMessages(msgs);
        await markMessagesRead(conversationId as string, user.id);
      } catch {}
    }, 5000);

    return () => clearInterval(interval);
  }, [user, isDemo, conversationId]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || sending) return;
    const text = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Optimistic message
    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId as string,
      sender_id: user.id,
      content: text,
      is_read: false,
      created_at: new Date().toISOString(),
      sender: user,
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      const msg = await sendMessage(conversationId as string, user.id, text);
      setMessages(prev => prev.map(m => m.id === optimistic.id ? msg : m));
    } catch (err) {
      console.error('Send failed:', err);
      // Remove optimistic on error
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      setNewMessage(text);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateDivider = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return '今天';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return '昨天';
    return d.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' });
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  messages.forEach(msg => {
    const date = new Date(msg.created_at).toDateString();
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === date) {
      last.messages.push(msg);
    } else {
      groupedMessages.push({ date, messages: [msg] });
    }
  });

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-cream/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center px-4 pt-14 pb-3 gap-3">
          <button onClick={() => router.back()} className="p-1">
            <svg className="w-5 h-5 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          {otherUser && (
            <button
              onClick={() => router.push(`/profile/${otherUser.username}`)}
              className="flex items-center gap-2.5 flex-1 min-w-0"
            >
              <div className="w-9 h-9 rounded-full bg-surface overflow-hidden flex-shrink-0">
                {otherUser.avatar_url ? (
                  <img src={otherUser.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-sm text-taupe font-playfair italic">
                      {otherUser.display_name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="text-left min-w-0">
                <p className="font-inter font-semibold text-sm text-ink truncate">
                  {otherUser.display_name}
                </p>
                <p className="text-[10px] text-taupe font-inter">@{otherUser.username}</p>
              </div>
            </button>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading && (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-taupe/30 border-t-ink rounded-full animate-spin mx-auto" />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm text-taupe font-noto">
              說聲嗨吧 👋
            </p>
          </div>
        )}

        {!loading && groupedMessages.map((group) => (
          <div key={group.date}>
            {/* Date divider */}
            <div className="flex items-center justify-center my-4">
              <span className="text-[10px] text-taupe font-inter bg-surface px-3 py-1 rounded-full">
                {formatDateDivider(group.messages[0].created_at)}
              </span>
            </div>

            {group.messages.map((msg, i) => {
              const isMe = msg.sender_id === user?.id;
              const showAvatar = !isMe && (i === 0 || group.messages[i - 1]?.sender_id !== msg.sender_id);
              const isConsecutive = i > 0 && group.messages[i - 1]?.sender_id === msg.sender_id;

              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isConsecutive ? 'mt-0.5' : 'mt-3'}`}
                >
                  {/* Other user avatar */}
                  {!isMe && (
                    <div className="w-7 flex-shrink-0 mr-2">
                      {showAvatar && otherUser?.avatar_url ? (
                        <img src={otherUser.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                      ) : showAvatar ? (
                        <div className="w-7 h-7 rounded-full bg-surface flex items-center justify-center">
                          <span className="text-[10px] text-taupe font-playfair italic">
                            {otherUser?.display_name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  )}

                  <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`px-3.5 py-2.5 text-[13px] font-noto leading-relaxed ${
                        isMe
                          ? 'bg-ink text-cream rounded-2xl rounded-br-md'
                          : 'bg-surface text-ink rounded-2xl rounded-bl-md'
                      }`}
                    >
                      {msg.content}
                    </div>
                    {/* Timestamp on last consecutive message */}
                    {(i === group.messages.length - 1 || group.messages[i + 1]?.sender_id !== msg.sender_id) && (
                      <p className={`text-[9px] text-taupe font-inter mt-1 ${isMe ? 'text-right' : 'text-left'}`}>
                        {formatTime(msg.created_at)}
                        {isMe && msg.is_read && ' · 已讀'}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-cream/95 backdrop-blur-md border-t border-border px-4 py-3 pb-8">
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-surface rounded-full flex items-center px-4 py-2.5">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="輸入訊息..."
              className="flex-1 bg-transparent text-sm text-ink font-noto placeholder:text-taupe/50 outline-none"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              newMessage.trim()
                ? 'bg-ink text-cream scale-100'
                : 'bg-surface text-taupe scale-95'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13" />
              <path d="M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
