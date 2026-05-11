'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getPlaceById, getPostsByPlace } from '@/lib/db';
import { Place, Post, User } from '@/lib/types';
import {
  searchPlace,
  getPlacePhotoUrl,
  translateTypes,
  formatPriceLevel,
  GooglePlace,
} from '@/lib/google-places';

// ═══ Place Detail Page ═══

export default function PlaceDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [place, setPlace] = useState<Place | null>(null);
  const [google, setGoogle] = useState<GooglePlace | null>(null);
  const [posts, setPosts] = useState<(Post & { user: User })[]>([]);
  const [loading, setLoading] = useState(true);
  const [googleLoading, setGoogleLoading] = useState(true);
  const [hoursOpen, setHoursOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const googleFetched = useRef(false);

  // Load Supabase place + posts
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

  // Once we have the place, search Google Places API
  useEffect(() => {
    if (!place || googleFetched.current) return;
    googleFetched.current = true;

    const fetchGoogle = async () => {
      setGoogleLoading(true);
      try {
        const result = await searchPlace(
          place.name,
          place.latitude ?? undefined,
          place.longitude ?? undefined
        );
        setGoogle(result);
      } catch (err) {
        console.error('Google Places error:', err);
      } finally {
        setGoogleLoading(false);
      }
    };
    fetchGoogle();
  }, [place]);

  // ── Loading skeleton ──
  if (loading) {
    return <PlaceSkeleton />;
  }

  // ── Place not found in DB ──
  if (!place) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6">
        <p className="text-sm text-taupe font-noto">找不到此地點</p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-5 py-2 bg-ink text-cream text-xs tracking-editorial uppercase rounded-full font-inter"
        >
          返回
        </button>
      </div>
    );
  }

  // ── Data extraction ──
  const heroPhoto = google?.photos?.[0];
  const heroUrl = heroPhoto ? getPlacePhotoUrl(heroPhoto.name, 1200) : null;
  const galleryPhotos = (google?.photos || []).slice(1, 6);
  const rating = google?.rating;
  const ratingCount = google?.userRatingCount;
  const tags = translateTypes(google?.types || []);
  const price = formatPriceLevel(google?.priceLevel);
  const hours = google?.currentOpeningHours;
  const isOpen = hours?.openNow;
  const address = google?.formattedAddress || place.address;
  const phone = google?.internationalPhoneNumber;
  const mapsUri = google?.googleMapsUri;
  const website = google?.websiteUri;
  const summary = google?.editorialSummary?.text;
  const reviews = (google?.reviews || []).slice(0, 3);

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: place.name,
        text: `${place.name} - PASSEPORT`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* ── Back Button (floating) ── */}
      <button
        onClick={() => router.back()}
        className="fixed top-12 left-4 z-50 w-9 h-9 flex items-center justify-center rounded-full bg-cream/90 backdrop-blur-md border border-border shadow-sm"
      >
        <svg className="w-4 h-4 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>

      {/* ── Hero Photo ── */}
      {heroUrl ? (
        <div className="w-full aspect-[4/3] relative overflow-hidden bg-surface">
          <img
            src={heroUrl}
            alt={place.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        </div>
      ) : googleLoading ? (
        <div className="w-full aspect-[4/3] bg-surface animate-pulse" />
      ) : (
        <div className="w-full h-48 bg-surface flex items-center justify-center">
          <span className="text-4xl opacity-30">
            {place.category === 'restaurant' || place.category === '餐廳' ? '🍽️' :
             place.category === 'cafe' || place.category === '咖啡' ? '☕' :
             place.category === '景點' || place.category === 'attraction' ? '🏛️' : '📍'}
          </span>
        </div>
      )}

      {/* ── Content ── */}
      <div className="px-5 pb-24">
        {/* ── Name + Rating ── */}
        <div className="pt-5 pb-4 border-b border-border">
          <h1 className="font-playfair italic text-2xl tracking-editorial text-ink leading-tight">
            {google?.displayName?.text || place.name}
          </h1>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {/* Rating */}
            {rating && (
              <div className="flex items-center gap-1">
                <StarRating rating={rating} />
                <span className="text-sm font-inter font-medium text-ink">{rating.toFixed(1)}</span>
                {ratingCount && (
                  <span className="text-xs text-taupe font-inter">({ratingCount})</span>
                )}
              </div>
            )}
            {/* Price */}
            {price && (
              <span className="text-xs text-taupe font-inter">{price}</span>
            )}
            {/* Open status */}
            {hours && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-noto ${
                isOpen
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {isOpen ? '營業中' : '已打烊'}
              </span>
            )}
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex gap-1.5 mt-3">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="px-2.5 py-1 bg-surface border border-border rounded-full text-[10px] font-noto text-ink"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Summary */}
          {summary && (
            <p className="mt-3 text-sm text-taupe font-noto leading-relaxed">
              {summary}
            </p>
          )}
        </div>

        {/* ── Info Section ── */}
        <div className="py-4 space-y-3 border-b border-border">
          {/* Address */}
          {address && (
            <button onClick={copyAddress} className="w-full flex items-start gap-3 text-left group">
              <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3.5 h-3.5 text-taupe" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-taupe font-inter mb-0.5">地址</p>
                <p className="text-sm text-ink font-noto leading-snug">{address}</p>
              </div>
              <span className="text-[10px] text-taupe font-inter self-center opacity-0 group-hover:opacity-100 transition-opacity">
                {copied ? '已複製' : '複製'}
              </span>
            </button>
          )}

          {/* Phone */}
          {phone && (
            <a href={`tel:${phone}`} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-taupe" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-taupe font-inter mb-0.5">電話</p>
                <p className="text-sm text-ink font-inter">{phone}</p>
              </div>
            </a>
          )}

          {/* Opening Hours */}
          {hours?.weekdayDescriptions && hours.weekdayDescriptions.length > 0 && (
            <div>
              <button
                onClick={() => setHoursOpen(!hoursOpen)}
                className="w-full flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-taupe" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-xs text-taupe font-inter mb-0.5">營業時間</p>
                  <p className="text-sm text-ink font-noto">{hours.weekdayDescriptions[0]}</p>
                </div>
                <svg
                  className={`w-4 h-4 text-taupe transition-transform ${hoursOpen ? 'rotate-180' : ''}`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {hoursOpen && (
                <div className="ml-11 mt-2 space-y-1">
                  {hours.weekdayDescriptions.map((day, i) => (
                    <p key={i} className="text-xs text-taupe font-noto">{day}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Website */}
          {website && (
            <a href={website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-taupe" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-taupe font-inter mb-0.5">網站</p>
                <p className="text-sm text-ink font-inter truncate max-w-[240px]">
                  {website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </p>
              </div>
            </a>
          )}
        </div>

        {/* ── Action Buttons ── */}
        <div className="flex gap-2 py-4 border-b border-border">
          {mapsUri && (
            <a
              href={mapsUri}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-ink text-cream text-xs tracking-editorial rounded-lg font-inter"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              導航
            </a>
          )}
          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-border text-ink text-xs tracking-editorial rounded-lg font-inter"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
              </svg>
              撥打電話
            </a>
          )}
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 border border-border text-ink text-xs tracking-editorial rounded-lg font-inter"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
            </svg>
            分享
          </button>
        </div>

        {/* ── Photo Gallery ── */}
        {galleryPhotos.length > 0 && (
          <div className="py-5 border-b border-border">
            <h2 className="font-playfair italic text-base tracking-editorial text-ink mb-3">
              PHOTOS
            </h2>
            <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5">
              {galleryPhotos.map((photo, i) => (
                <div
                  key={i}
                  className="w-40 h-40 flex-shrink-0 rounded-xl overflow-hidden bg-surface"
                >
                  <img
                    src={getPlacePhotoUrl(photo.name, 400)}
                    alt={`${place.name} photo ${i + 2}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Google loading indicator ── */}
        {googleLoading && (
          <div className="py-8 flex justify-center">
            <div className="w-5 h-5 border-2 border-ink border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* ── Reviews ── */}
        {reviews.length > 0 && (
          <div className="py-5 border-b border-border">
            <h2 className="font-playfair italic text-base tracking-editorial text-ink mb-3">
              REVIEWS
            </h2>
            <div className="space-y-4">
              {reviews.map((review, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    {review.authorAttribution?.photoUri && (
                      <img
                        src={review.authorAttribution.photoUri}
                        alt=""
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    )}
                    <span className="text-xs font-inter font-medium text-ink">
                      {review.authorAttribution?.displayName || '匿名'}
                    </span>
                    <StarRating rating={review.rating} size="small" />
                    <span className="text-[10px] text-taupe font-inter">
                      {review.relativePublishTimeDescription}
                    </span>
                  </div>
                  {review.text?.text && (
                    <p className="text-xs text-taupe font-noto leading-relaxed line-clamp-3">
                      {review.text.text}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Related Posts (PASSEPORT Stories) ── */}
        <div className="py-5 border-b border-border">
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
            <div className="py-12 text-center">
              <p className="text-sm text-taupe font-noto">
                還沒有人寫過這個地點的文章
              </p>
            </div>
          )}
        </div>

        {/* ── Write CTA ── */}
        <div className="py-6 text-center">
          <Link
            href="/create"
            className="inline-flex items-center gap-2 px-6 py-3 bg-ink text-cream text-xs tracking-editorial uppercase rounded-full font-inter shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            寫下你的體驗
          </Link>
        </div>
      </div>
    </div>
  );
}

// ═══ Star Rating Component ═══

function StarRating({ rating, size = 'normal' }: { rating: number; size?: 'small' | 'normal' }) {
  const starSize = size === 'small' ? 'w-3 h-3' : 'w-3.5 h-3.5';
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const fill = rating >= i ? 1 : rating >= i - 0.5 ? 0.5 : 0;
    stars.push(
      <svg key={i} className={`${starSize} flex-shrink-0`} viewBox="0 0 20 20">
        {/* Background (empty) star */}
        <path
          d="M10 1l2.39 4.84 5.34.78-3.87 3.77.91 5.33L10 13.27l-4.77 2.5.91-5.33L2.27 6.67l5.34-.78L10 1z"
          fill="#DDD8D0"
        />
        {/* Filled portion */}
        {fill > 0 && (
          <>
            <defs>
              <clipPath id={`star-clip-${i}-${size}`}>
                <rect x="0" y="0" width={fill === 1 ? 20 : 10} height="20" />
              </clipPath>
            </defs>
            <path
              d="M10 1l2.39 4.84 5.34.78-3.87 3.77.91 5.33L10 13.27l-4.77 2.5.91-5.33L2.27 6.67l5.34-.78L10 1z"
              fill="#D4A053"
              clipPath={`url(#star-clip-${i}-${size})`}
            />
          </>
        )}
      </svg>
    );
  }
  return <div className="flex items-center gap-0.5">{stars}</div>;
}

// ═══ Skeleton ═══

function PlaceSkeleton() {
  return (
    <div className="min-h-screen bg-cream animate-pulse">
      <div className="w-full aspect-[4/3] bg-surface" />
      <div className="px-5 pt-5 space-y-3">
        <div className="h-7 bg-surface rounded w-3/4" />
        <div className="h-4 bg-surface rounded w-1/2" />
        <div className="flex gap-2 mt-3">
          <div className="h-6 bg-surface rounded-full w-16" />
          <div className="h-6 bg-surface rounded-full w-16" />
        </div>
        <div className="h-px bg-border mt-4" />
        <div className="space-y-3 pt-3">
          <div className="h-10 bg-surface rounded" />
          <div className="h-10 bg-surface rounded" />
          <div className="h-10 bg-surface rounded" />
        </div>
      </div>
    </div>
  );
}
