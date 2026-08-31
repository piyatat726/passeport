'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CityGuide } from '@/lib/city-guides';
import { CityGuideView } from '@/components/city-guide-view';
import { searchPosts } from '@/lib/db';
import { Post, User } from '@/lib/types';

// Client-side flow for cities without an editorial or cached guide:
// asks the API to generate one, with a magazine-flavored loading state.

export function CityGuideGenerator({ city }: { city: string }) {
  const [guide, setGuide] = useState<CityGuide | null>(null);
  const [posts, setPosts] = useState<(Post & { user: User })[]>([]);
  const [status, setStatus] = useState<'loading' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const res = await fetch(`/api/city-guide?city=${encodeURIComponent(city)}`);
        if (!res.ok) throw new Error('generation failed');
        const data = await res.json();
        if (cancelled) return;
        if (!data.guide) throw new Error('no guide');
        setGuide(data.guide);

        // Best-effort related articles
        try {
          const related = await searchPosts(data.guide.nameEn, 6);
          if (!cancelled) setPosts(related);
        } catch {}
      } catch {
        if (!cancelled) setStatus('error');
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [city]);

  if (guide) {
    return <CityGuideView guide={guide} posts={posts} />;
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-8 text-center">
        <p className="font-playfair italic text-2xl text-ink mb-3">Terra Incognita</p>
        <p className="text-sm text-taupe font-noto mb-8 leading-relaxed">
          我們還沒辦法為「{city}」編出一份指南。
          <br />
          確認一下城市名稱，或先逛逛其他城市。
        </p>
        <Link
          href="/discover"
          className="px-6 py-3 bg-ink text-cream rounded-full text-[11px] font-inter tracking-editorial uppercase"
        >
          回到探索
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-8 text-center">
      <div className="w-8 h-8 border-2 border-border border-t-ink rounded-full animate-spin mb-6" />
      <p className="font-playfair italic text-xl text-ink mb-2">
        正在為你編輯「{city}」的城市指南
      </p>
      <p className="text-xs text-taupe font-noto leading-relaxed">
        第一次查詢的城市需要一點時間（約 10–20 秒）
        <br />
        完成後會收進雜誌資料庫，下次立即翻開。
      </p>
    </div>
  );
}
