'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getPlaceById, getPostsByPlace } from '@/lib/db';
import { Place, Post, User } from '@/lib/types';
import { BottomNav } from '@/components/bottom-nav';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

const CATEGORY_MAP: Record<string, { label: string; icon: string }> = {
  restaurant: { label: '餐廳', icon: '🍽️' },
  cafe: { label: '咖啡', icon: '☕' },
  snack: { label: '小吃', icon: '🍜' },
  attraction: { label: '景點', icon: '🏛️' },
  shop: { label: '潮流店', icon: '🛍️' },
  bar: { label: '酒吧', icon: '🍸' },
  style_diary: { label: '穿搭日記', icon: '👗' },
  travel_notes: { label: '旅行筆記', icon: '✈️' },
  city_guide: { label: '城市指南', icon: '🏙️' },
  cafe_journal: { label: '咖啡誌', icon: '☕' },
  table_taste: { label: '餐桌風景', icon: '🍽️' },
  beauty_rituals: { label: '美容儀式', icon: '✨' },
  culture_calendar: { label: '文化日曆', icon: '🎭' },
  living_aesthetic: { label: '生活美學', icon: '🪴' },
  personal_essay: { label: '個人隨筆', icon: '✍️' },
  curated_picks: { label: '編輯選物', icon: '💎' },
};

export default function PlaceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [place, setPlace] = useState<Place | null>(null);
  const [posts, setPosts] = useState<(Post & { user: User })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      try {
        const [placeData, postsData] = await Promise.all([
          getPlaceById(id as string),
          getPostsByPlace(id as string),
        ]);
        setPlace(placeData);
        setPosts(postsData);
      } catch (err) {
        console.error('Failed to load place:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-ink border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!place) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6">
        <p className="text-sm text-taupe font-noto">找不到此地點</p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-5 py-2 bg-ink text-cream text-xs tracking-editorial uppercase rounded-full font-inter"
        >
          GO BACK
        </button>
      </div>
    );
  }

  const catInfo = CATEGORY_MAP[place.category] || { label: place.category, icon: '📍' };
  const hasCoords = place.latitude !== null && place.longitude !== null;
  const mapImageUrl = hasCoords
    ? `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/pin-s+c4956a(${place.longitude},${place.latitude})/${place.longitude},${place.latitude},14/400x200@2x?access_token=${MAPBOX_TOKEN}`
    : null;

  return (
    <div className="min-h-screen bg-cream flex flex-col pb-20">
      {/* Header */}
      <div className="pt-14 pb-4 px-5 border-b border-border">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-surface border border-border"
          >
            <svg className="w-4 h-4 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-playfair italic text-xl tracking-editorial text-ink truncate">
              {place.name}
            </h1>
            {place.address && (
              <p className="text-[11px] text-taupe font-noto mt-0.5 truncate">
                {place.address}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface border border-border rounded-full text-[10px] font-noto text-ink">
            <span>{catInfo.icon}</span>
            <span>{catInfo.label}</span>
          </span>
          <span className="text-[11px] text-taupe font-noto">
            被提及 {place.mention_count} 次
          </span>
        </div>
      </div>

      {/* Static Map */}
      {hasCoords && MAPBOX_TOKEN && !MAPBOX_TOKEN.includes('placeholder') && (
        <div className="px-5 pt-4">
          <div className="rounded-xl overflow-hidden border border-border">
            <img
              src={mapImageUrl!}
              alt={`${place.name} 地圖`}
              className="w-full h-[120px] object-cover"
            />
          </div>
        </div>
      )}

      {/* Posts Grid */}
      <div className="px-5 pt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-playfair italic text-base tracking-editorial text-ink">
            STORIES
          </h2>
          <span className="text-[10px] text-taupe font-inter">
            {posts.length} 篇文章
          </span>
        </div>

        {posts.length > 0 ? (
          <div className="grid grid-cols-3 gap-0.5">
            {posts.map(post => (
              <Link key={post.id} href={`/post/${post.id}`} className="aspect-square overflow-hidden rounded-sm">
                <img
                  src={post.cover_image_url}
                  alt={post.title}
                  className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                />
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <p className="text-sm text-taupe font-noto">
              還沒有人寫過這個地點的文章
            </p>
            <Link
              href="/create"
              className="inline-block mt-4 px-5 py-2 bg-ink text-cream text-xs tracking-editorial uppercase rounded-full font-inter"
            >
              WRITE ABOUT THIS PLACE
            </Link>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
