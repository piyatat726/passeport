'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getPostById, updatePost } from '@/lib/db';
import { CATEGORIES, Post, User, Category } from '@/lib/types';

export default function PostEditPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isDemo } = useAuth();

  const [post, setPost] = useState<(Post & { user: User }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<Category>('personal_essay');
  const [location, setLocation] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const loadPost = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getPostById(id as string);
      setPost(data);
      setTitle(data.title);
      setSubtitle(data.subtitle || '');
      setContent(data.content);
      setCategory(data.category);
      setLocation(data.location || '');
      setTagsInput((data.tags || []).join(', '));
    } catch (err) {
      console.error('Failed to load post:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  // Guard: redirect if not owner or demo
  useEffect(() => {
    if (!loading && (isDemo || !user)) {
      router.replace(`/post/${id}`);
    }
    if (!loading && post && user && user.id !== post.user_id) {
      router.replace(`/post/${id}`);
    }
  }, [loading, post, user, isDemo, id, router]);

  const handleSave = async () => {
    if (!post || saving) return;
    setSaving(true);

    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    try {
      setError('');
      await updatePost(post.id, {
        title: title.trim(),
        subtitle: subtitle.trim(),
        content: content.trim(),
        category,
        location: location.trim(),
        tags,
      }, user!.id);
      router.push(`/post/${post.id}`);
    } catch (err) {
      console.error('Failed to update post:', err);
      setError('儲存失敗，請稍後再試');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-taupe/30 border-t-ink rounded-full animate-spin" />
      </div>
    );
  }

  if (!post || !user || user.id !== post.user_id) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-taupe font-noto text-sm">沒有權限編輯此文章</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-cream/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => router.back()}
            className="text-sm font-noto text-taupe"
          >
            取消
          </button>
          <h1 className="font-playfair italic text-base text-ink tracking-editorial">
            編輯文章
          </h1>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim() || !content.trim()}
            className="text-sm font-noto text-ink font-medium disabled:opacity-30"
          >
            {saving ? '儲存中...' : '儲存'}
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="px-5 py-6 space-y-5 max-w-lg mx-auto">
        {/* Error */}
        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-600 font-noto">{error}</p>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-xs font-noto text-taupe mb-1.5">
            標題
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="文章標題"
            className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm font-inter text-ink placeholder:text-taupe/50 focus:outline-none focus:border-taupe transition-colors"
          />
        </div>

        {/* Subtitle */}
        <div>
          <label className="block text-xs font-noto text-taupe mb-1.5">
            副標題
          </label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="簡短描述（選填）"
            className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm font-inter text-ink placeholder:text-taupe/50 focus:outline-none focus:border-taupe transition-colors"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-xs font-noto text-taupe mb-1.5">
            內容
          </label>
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => {
                if (e.target.value.length <= 500) {
                  setContent(e.target.value);
                }
              }}
              placeholder="寫下你的故事..."
              rows={8}
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm font-noto text-ink placeholder:text-taupe/50 focus:outline-none focus:border-taupe transition-colors resize-none leading-relaxed"
            />
            <span className="absolute bottom-3 right-3 text-[10px] font-inter text-taupe">
              {content.length}/500
            </span>
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-noto text-taupe mb-1.5">
            分類
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm font-noto text-ink focus:outline-none focus:border-taupe transition-colors appearance-none"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.icon} {cat.labelZh}
              </option>
            ))}
          </select>
        </div>

        {/* Location */}
        <div>
          <label className="block text-xs font-noto text-taupe mb-1.5">
            地點
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="例：台北, 東京, 巴黎"
            className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm font-inter text-ink placeholder:text-taupe/50 focus:outline-none focus:border-taupe transition-colors"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-noto text-taupe mb-1.5">
            標籤
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="以逗號分隔，例：咖啡, 旅行, 穿搭"
            className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm font-inter text-ink placeholder:text-taupe/50 focus:outline-none focus:border-taupe transition-colors"
          />
          <p className="text-[10px] font-noto text-taupe mt-1.5">
            多個標籤請用逗號分隔
          </p>
        </div>
      </div>
    </div>
  );
}
