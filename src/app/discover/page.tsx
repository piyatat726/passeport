'use client';

import { useState, useEffect } from 'react';
import { BottomNav } from '@/components/bottom-nav';
import { getFeedPosts } from '@/lib/db';
import { Post, User } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

const QUICK_CATEGORIES = [
  { icon: '✈️', label: 'Travel', labelZh: '旅行' },
  { icon: '👗', label: 'Fashion', labelZh: '時尚' },
  { icon: '☕', label: 'Café', labelZh: '咖啡' },
  { icon: '🍽️', label: 'Food', labelZh: '美食' },
  { icon: '✨', label: 'Beauty', labelZh: '美容' },
];

const POPULAR_CITIES = [
  { name: 'Tokyo', nameZh: '東京', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=500&fit=crop', count: '探索' },
  { name: 'Seoul', nameZh: '首爾', image: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=400&h=500&fit=crop', count: '探索' },
  { name: 'New York', nameZh: '紐約', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=500&fit=crop', count: '探索' },
  { name: 'Taipei', nameZh: '台北', image: 'https://images.unsplash.com/photo-1470004914212-05527e49370b?w=400&h=500&fit=crop', count: '探索' },
  { name: 'Paris', nameZh: '巴黎', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=500&fit=crop', count: '探索' },
];

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState<(Post & { user: User })[]>([]);
  const { isDemo } = useAuth();

  useEffect(() => {
    if (isDemo) return;
    const load = async () => {
      try {
        const data = await getFeedPosts(0, 6);
        setPosts(data);
      } catch (err) {
        console.error('Failed to load posts for discover:', err);
      }
    };
    load();
  }, [isDemo]);

  return (
    <div className="min-h-screen bg-cream pb-20">
      {/* Header */}
      <div className="pt-14 px-5 pb-4">
        <h1 className="font-playfair italic text-2xl tracking-editorial text-ink mb-4">
          DISCOVER
        </h1>

        {/* Search Bar */}
        <div className="flex items-center gap-3 px-4 py-3 bg-surface border border-border rounded-xl">
          <svg className="w-4 h-4 text-taupe flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="搜尋文章、地點、標籤⋯⋯"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-ink placeholder:text-taupe/50 focus:outline-none font-noto"
          />
        </div>
      </div>

      {/* Category Chips */}
      <div className="px-5 mb-6">
        <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
          {QUICK_CATEGORIES.map(cat => (
            <button
              key={cat.label}
              className="flex flex-col items-center gap-1.5 min-w-[60px]"
            >
              <div className="w-14 h-14 rounded-full bg-surface border border-border flex items-center justify-center text-xl hover:bg-border transition-colors">
                {cat.icon}
              </div>
              <span className="text-[9px] text-ink font-inter tracking-wide">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Popular Topics */}
      <div className="px-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-playfair italic text-base tracking-editorial text-ink">
            POPULAR TOPICS
          </h2>
          <span className="text-[10px] text-taupe tracking-widest uppercase font-inter">
            熱門話題
          </span>
        </div>

        {posts.length > 0 ? (
          <div className="grid grid-cols-3 gap-1.5">
            {posts.slice(0, 6).map((post, i) => (
              <Link key={post.id} href={`/post/${post.id}`}>
                <div className={`overflow-hidden rounded-lg ${i === 0 ? 'row-span-2 col-span-2' : ''}`}>
                  <div className="relative aspect-square group">
                    <img
                      src={post.cover_image_url}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/20" />
                    {i === 0 && (
                      <div className="absolute bottom-2 left-2 right-2">
                        <h3 className="font-playfair italic text-sm text-white tracking-wide leading-tight">
                          {post.title}
                        </h3>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center bg-surface rounded-xl">
            <p className="text-xs text-taupe font-noto">等待更多用戶分享精彩內容</p>
          </div>
        )}
      </div>

      {/* Popular Cities */}
      <div className="mb-8">
        <div className="flex items-center justify-between px-5 mb-4">
          <h2 className="font-playfair italic text-base tracking-editorial text-ink">
            POPULAR CITIES
          </h2>
          <span className="text-[10px] text-taupe tracking-widest uppercase font-inter">
            熱門城市
          </span>
        </div>

        <div className="flex gap-3 overflow-x-auto px-5 pb-2 no-scrollbar">
          {POPULAR_CITIES.map(city => (
            <div
              key={city.name}
              className="flex-shrink-0 w-32 rounded-xl overflow-hidden group cursor-pointer"
            >
              <div className="relative aspect-[3/4]">
                <img
                  src={city.image}
                  alt={city.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <p className="text-white text-xs font-inter font-medium">{city.name}</p>
                  <p className="text-white/60 text-[10px] font-noto">{city.nameZh} · {city.count}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Tags */}
      <div className="px-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-playfair italic text-base tracking-editorial text-ink">
            TRENDING
          </h2>
          <span className="text-[10px] text-taupe tracking-widest uppercase font-inter">
            趨勢標籤
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {['#京都秋天', '#台北咖啡', '#紐約散步', '#手沖咖啡', '#城市美學', '#旅行日記', '#抹茶控', '#巷弄探索', '#生活風格'].map(tag => (
            <span
              key={tag}
              className="text-xs text-ink bg-surface border border-border px-3 py-1.5 rounded-full font-noto hover:bg-border transition-colors cursor-pointer"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
