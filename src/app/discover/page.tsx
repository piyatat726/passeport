'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BottomNav } from '@/components/bottom-nav';
import { getFeedPosts, searchPosts, searchPostsByTag, searchUsers, searchPlaces, getPopularTags } from '@/lib/db';
import { Post, User, Place } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import Image from 'next/image';

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

type SearchTab = 'posts' | 'users' | 'places' | 'tags';

export default function DiscoverPage() {
  return (
    <Suspense>
      <DiscoverPageInner />
    </Suspense>
  );
}

function DiscoverPageInner() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [posts, setPosts] = useState<(Post & { user: User })[]>([]);
  const [activeTab, setActiveTab] = useState<SearchTab>('posts');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResultsPosts, setSearchResultsPosts] = useState<(Post & { user: User })[]>([]);
  const [searchResultsUsers, setSearchResultsUsers] = useState<User[]>([]);
  const [searchResultsPlaces, setSearchResultsPlaces] = useState<Place[]>([]);
  const [searchResultsTags, setSearchResultsTags] = useState<string[]>([]);
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const { isDemo } = useAuth();
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Load search history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('passeport_search_history');
      if (saved) setSearchHistory(JSON.parse(saved));
    } catch {}
  }, []);

  // Load initial data
  useEffect(() => {
    if (isDemo) return;
    const load = async () => {
      try {
        const data = await getFeedPosts(0, 6);
        setPosts(data);
      } catch (err) {
        console.error('Failed to load feed posts:', err);
      }
      try {
        const tags = await getPopularTags(12);
        if (tags.length > 0) setPopularTags(tags);
      } catch {
        // Popular tags are optional, use fallback
      }
    };
    load();
  }, [isDemo]);

  // Debounce search input
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery]);

  // Perform search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setSearchResultsPosts([]);
      setSearchResultsUsers([]);
      setSearchResultsPlaces([]);
      setSearchResultsTags([]);
      return;
    }
    // Save to search history (use functional updater to avoid stale closure)
    setSearchHistory(prev => {
      const updated = [debouncedQuery, ...prev.filter(h => h !== debouncedQuery)].slice(0, 8);
      try { localStorage.setItem('passeport_search_history', JSON.stringify(updated)); } catch {}
      return updated;
    });

    const performSearch = async () => {
      setIsSearching(true);
      try {
        // "#tag" queries search by tag; everything else is full-text
        const isTagQuery = debouncedQuery.startsWith('#');
        const term = isTagQuery ? debouncedQuery.slice(1) : debouncedQuery;
        const [postsRes, usersRes, placesRes, tagsRes] = await Promise.all([
          isTagQuery ? searchPostsByTag(term, 20) : searchPosts(term, 20),
          searchUsers(term, 20),
          searchPlaces(term, 20),
          getPopularTags(50),
        ]);
        setSearchResultsPosts(postsRes);
        setSearchResultsUsers(usersRes);
        setSearchResultsPlaces(placesRes);
        // Filter tags that match the query
        const matchingTags = tagsRes.filter((tag: string) =>
          tag.toLowerCase().includes(term.toLowerCase())
        );
        setSearchResultsTags(matchingTags);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsSearching(false);
      }
    };
    performSearch();
  }, [debouncedQuery]);

  // Handle category chip click
  const handleCategoryClick = useCallback(async (categoryLabel: string) => {
    setSearchQuery(categoryLabel);
    setDebouncedQuery(categoryLabel);
    setActiveTab('posts');
  }, []);

  // Handle tag click — unified with performSearch (a "#..." query searches by tag)
  const handleTagClick = useCallback((tag: string) => {
    const cleanTag = tag.startsWith('#') ? tag.slice(1) : tag;
    setSearchQuery(`#${cleanTag}`);
    setDebouncedQuery(`#${cleanTag}`);
    setActiveTab('posts');
  }, []);

  // Support /discover?tag=xxx links (from post pages)
  useEffect(() => {
    const tagParam = searchParams.get('tag');
    if (tagParam) handleTagClick(tagParam);
  }, [searchParams, handleTagClick]);

  const isShowingResults = debouncedQuery.length >= 2;

  const SEARCH_TABS: { key: SearchTab; label: string }[] = [
    { key: 'posts', label: '文章' },
    { key: 'users', label: '用戶' },
    { key: 'places', label: '地點' },
    { key: 'tags', label: '標籤' },
  ];

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
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            className="w-full bg-transparent text-sm text-ink placeholder:text-taupe/50 focus:outline-none font-noto"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setDebouncedQuery(''); }}
              className="text-taupe hover:text-ink transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Search History Dropdown */}
      {searchFocused && !isShowingResults && searchHistory.length > 0 && (
        <div className="px-5 mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] text-taupe font-inter tracking-editorial uppercase">Recent Searches</p>
            <button
              onClick={() => {
                setSearchHistory([]);
                try { localStorage.removeItem('passeport_search_history'); } catch {}
              }}
              className="text-[10px] text-taupe hover:text-ink font-noto transition-colors"
            >
              清除
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((h, i) => (
              <button
                key={i}
                onClick={() => { setSearchQuery(h); setDebouncedQuery(h); }}
                className="px-3 py-1.5 bg-surface border border-border rounded-full text-xs font-noto text-ink hover:bg-border transition-colors"
              >
                {h}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category Chips */}
      <div className="px-5 mb-6">
        <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
          {QUICK_CATEGORIES.map(cat => (
            <button
              key={cat.label}
              onClick={() => handleCategoryClick(cat.labelZh)}
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

      {/* Search Results */}
      {isShowingResults ? (
        <div className="px-5">
          {/* Tabs */}
          <div className="flex border-b border-border mb-4">
            {SEARCH_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-2.5 text-sm font-noto transition-colors ${
                  activeTab === tab.key
                    ? 'text-ink border-b-2 border-ink font-medium'
                    : 'text-taupe'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Loading Spinner */}
          {isSearching ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-border border-t-ink rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Posts Tab */}
              {activeTab === 'posts' && (
                searchResultsPosts.length > 0 ? (
                  <div className="grid grid-cols-3 gap-1.5">
                    {searchResultsPosts.map(post => (
                      <Link key={post.id} href={`/post/${post.id}`}>
                        <div className="overflow-hidden rounded-lg">
                          <div className="relative aspect-square group">
                            <Image
                              src={post.cover_image_url}
                              alt={post.title}
                              fill
                              sizes="33vw"
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center">
                    <p className="text-sm text-taupe font-noto">找不到相關文章</p>
                  </div>
                )
              )}

              {/* Users Tab */}
              {activeTab === 'users' && (
                searchResultsUsers.length > 0 ? (
                  <div className="space-y-3">
                    {searchResultsUsers.map(user => (
                      <Link key={user.id} href={`/profile/${user.username}`}>
                        <div className="flex items-center gap-3 p-3 bg-surface rounded-xl hover:bg-border/50 transition-colors">
                          <div className="w-11 h-11 rounded-full overflow-hidden bg-border flex-shrink-0">
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={user.display_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-taupe text-sm font-inter">
                                {user.display_name?.charAt(0) || user.username.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm text-ink font-medium font-noto truncate">
                              {user.display_name || user.username}
                            </p>
                            <p className="text-xs text-taupe font-inter truncate">
                              @{user.username}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center">
                    <p className="text-sm text-taupe font-noto">找不到相關用戶</p>
                  </div>
                )
              )}

              {/* Places Tab */}
              {activeTab === 'places' && (
                searchResultsPlaces.length > 0 ? (
                  <div className="space-y-3">
                    {searchResultsPlaces.map(place => (
                      <Link key={place.id} href={`/place/${place.id}`}>
                        <div className="flex items-center justify-between p-3 bg-surface rounded-xl hover:bg-border/50 transition-colors">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-ink font-medium font-noto truncate">
                              {place.name}
                            </p>
                            {place.address && (
                              <p className="text-xs text-taupe font-noto truncate mt-0.5">
                                {place.address}
                              </p>
                            )}
                          </div>
                          {place.mention_count != null && (
                            <span className="text-[10px] text-taupe font-inter ml-3 flex-shrink-0">
                              {place.mention_count} 篇提及
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center">
                    <p className="text-sm text-taupe font-noto">找不到相關地點</p>
                  </div>
                )
              )}

              {/* Tags Tab */}
              {activeTab === 'tags' && (
                searchResultsTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {searchResultsTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => handleTagClick(tag)}
                        className="text-xs text-ink bg-surface border border-border px-3 py-1.5 rounded-full font-noto hover:bg-border transition-colors"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center">
                    <p className="text-sm text-taupe font-noto">找不到相關標籤</p>
                  </div>
                )
              )}
            </>
          )}
        </div>
      ) : (
        <>
          {/* Default Content: Popular Topics */}
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
                        <Image
                          src={post.cover_image_url}
                          alt={post.title}
                          fill
                          sizes={i === 0 ? '66vw' : '33vw'}
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
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
                  onClick={() => { setSearchQuery(city.name); setDebouncedQuery(city.name); }}
                  className="flex-shrink-0 w-32 rounded-xl overflow-hidden group cursor-pointer"
                >
                  <div className="relative aspect-[3/4]">
                    <Image
                      src={city.image}
                      alt={city.name}
                      fill
                      sizes="128px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
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

          {/* Trending Tags (dynamic) */}
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
              {popularTags.length > 0 ? (
                popularTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className="text-xs text-ink bg-surface border border-border px-3 py-1.5 rounded-full font-noto hover:bg-border transition-colors"
                  >
                    #{tag}
                  </button>
                ))
              ) : (
                ['京都秋天', '台北咖啡', '紐約散步', '手沖咖啡', '城市美學', '旅行日記', '抹茶控', '巷弄探索', '生活風格'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className="text-xs text-ink bg-surface border border-border px-3 py-1.5 rounded-full font-noto hover:bg-border transition-colors"
                  >
                    #{tag}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}

      <BottomNav />
    </div>
  );
}
