'use client';

import { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BottomNav } from '@/components/bottom-nav';
import { searchNearbyPlaces, searchPlaces, getPlacePhotoUrl, translateTypes, GooglePlace } from '@/lib/google-places';
import Link from 'next/link';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
const hasMapbox = MAPBOX_TOKEN.length > 0 && !MAPBOX_TOKEN.includes('placeholder');

// ═══ Warm pastel color palette for markers ═══
const MARKER_COLORS: Record<string, { bg: string; grad: string; shadow: string }> = {
  restaurant: { bg: '#E8927C', grad: '#D47A62', shadow: 'rgba(232,146,124,0.35)' },
  cafe:       { bg: '#7EC4A5', grad: '#6AAE8F', shadow: 'rgba(126,196,165,0.35)' },
  attraction: { bg: '#EAC87D', grad: '#D4B167', shadow: 'rgba(234,200,125,0.35)' },
  museum:     { bg: '#9B8EC4', grad: '#8577AD', shadow: 'rgba(155,142,196,0.35)' },
  posts:      { bg: '#D4A5C8', grad: '#BE8FB2', shadow: 'rgba(212,165,200,0.35)' },
  default:    { bg: '#D4A5A5', grad: '#C08E8E', shadow: 'rgba(212,165,165,0.35)' },
};

// Google Places types for each category filter
const CATEGORY_TYPES: Record<string, string[]> = {
  all: ['restaurant', 'cafe', 'tourist_attraction', 'museum'],
  restaurant: ['restaurant'],
  cafe: ['cafe', 'coffee_shop'],
  attraction: ['tourist_attraction', 'park', 'amusement_park'],
  museum: ['museum', 'art_gallery'],
};

const PLACE_CATEGORIES = [
  { value: 'all', label: '全部', icon: '📍', color: '#8B7E74' },
  { value: 'restaurant', label: '餐廳', icon: '🍽️', color: '#E8927C' },
  { value: 'cafe', label: '咖啡', icon: '☕', color: '#7EC4A5' },
  { value: 'attraction', label: '景點', icon: '🏛️', color: '#EAC87D' },
  { value: 'museum', label: '博物館', icon: '🎨', color: '#9B8EC4' },
  { value: 'posts', label: '文章', icon: '✍️', color: '#D4A5C8' },
] as const;

// ═══ Helpers ═══

function getIconForPlace(types: string[]): string {
  if (!types) return '📍';
  if (types.some(t => t === 'post')) return '✍️';
  if (types.some(t => t.includes('cafe') || t.includes('coffee'))) return '☕';
  if (types.some(t => t.includes('museum') || t.includes('art_gallery'))) return '🎨';
  if (types.some(t => t.includes('tourist') || t.includes('park') || t.includes('amusement'))) return '🏛️';
  if (types.some(t => t.includes('restaurant') || t.includes('food') || t.includes('meal'))) return '🍽️';
  return '📍';
}

function getMarkerStyle(types: string[]): { bg: string; grad: string; shadow: string } {
  if (!types) return MARKER_COLORS.default;
  if (types.some(t => t === 'post')) return MARKER_COLORS.posts;
  if (types.some(t => t.includes('cafe') || t.includes('coffee'))) return MARKER_COLORS.cafe;
  if (types.some(t => t.includes('museum') || t.includes('art_gallery'))) return MARKER_COLORS.museum;
  if (types.some(t => t.includes('tourist') || t.includes('park') || t.includes('amusement'))) return MARKER_COLORS.attraction;
  if (types.some(t => t.includes('restaurant') || t.includes('food') || t.includes('meal'))) return MARKER_COLORS.restaurant;
  return MARKER_COLORS.default;
}

function getGridKey(lat: number, lng: number, zoom: number): string {
  const precision = zoom >= 16 ? 1000 : zoom >= 14 ? 100 : 10;
  const gLat = Math.round(lat * precision) / precision;
  const gLng = Math.round(lng * precision) / precision;
  return `${gLat},${gLng}`;
}

// Customize map layers for a warm, premium aesthetic
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function warmifyMap(map: any) {
  try {
    // Warm atmospheric fog
    map.setFog({
      color: 'rgba(251, 248, 243, 0.9)',
      'high-color': 'rgba(240, 233, 221, 0.4)',
      'horizon-blend': 0.02,
    });

    // Background → warm cream
    try { map.setPaintProperty('background', 'background-color', '#FBF8F3'); } catch {}

    // Iterate layers for source-layer based modifications
    const layers = map.getStyle()?.layers || [];
    for (const layer of layers) {
      try {
        const id = layer.id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sl = (layer as any)['source-layer'] || '';

        if (layer.type === 'fill') {
          // Water → soft lavender-blue
          if (sl === 'water' || id.includes('water')) {
            map.setPaintProperty(id, 'fill-color', '#C8D9E8');
          }
          // Buildings → warm stone
          if (sl === 'building' || id.includes('building')) {
            map.setPaintProperty(id, 'fill-color', '#EBE6DF');
          }
          // Parks & green areas → soft sage
          if (id.includes('park') || id.includes('national') || id.includes('green') || id.includes('pitch') || id.includes('cemetery')) {
            map.setPaintProperty(id, 'fill-color', '#DCE8D2');
          }
        }
      } catch {}
    }
  } catch (e) {
    console.warn('Map style customization:', e);
  }
}

// Inject custom CSS for markers, controls, and user location dot
function injectMapStyles() {
  if (document.getElementById('passeport-map-styles')) return;
  const style = document.createElement('style');
  style.id = 'passeport-map-styles';
  style.textContent = `
    .user-location-dot {
      position: relative;
      width: 22px;
      height: 22px;
    }
    .user-location-pulse {
      position: absolute;
      inset: -6px;
      background: rgba(66, 133, 244, 0.15);
      border-radius: 50%;
      animation: loc-pulse 2s ease-out infinite;
    }
    .user-location-center {
      position: absolute;
      top: 3px; left: 3px;
      width: 16px; height: 16px;
      background: #4285F4;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(66, 133, 244, 0.4);
    }
    @keyframes loc-pulse {
      0% { transform: scale(1); opacity: 1; }
      100% { transform: scale(2.5); opacity: 0; }
    }
    .passeport-marker .marker-inner {
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .passeport-marker:hover .marker-inner {
      transform: scale(1.15);
      filter: brightness(1.05);
    }
    .mapboxgl-ctrl-bottom-right {
      bottom: 80px !important;
      right: 12px !important;
    }
    .mapboxgl-ctrl-group {
      border-radius: 14px !important;
      border: 1px solid #E8E3DC !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06) !important;
      overflow: hidden !important;
      background: rgba(255,255,255,0.9) !important;
      backdrop-filter: blur(8px) !important;
    }
    .mapboxgl-ctrl-group button {
      width: 38px !important;
      height: 38px !important;
      border: none !important;
    }
    .mapboxgl-ctrl-group button + button {
      border-top: 1px solid #E8E3DC !important;
    }
    #passeport-map .mapboxgl-canvas {
      animation: map-fade-in 0.6s ease-out;
    }
    @keyframes map-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

// ═══ Types ═══

interface MapPlace {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  icon: string;
  rating?: number;
  userRatingCount?: number;
  types: string[];
  googlePlaceId?: string;
  photoRef?: string;
  priceLevel?: string;
  isOpen?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  linkedPosts?: any[];
}

function googleToMapPlace(g: GooglePlace): MapPlace {
  return {
    id: g.id,
    name: g.displayName?.text || '',
    address: g.formattedAddress || '',
    lat: g.location?.latitude || 0,
    lng: g.location?.longitude || 0,
    icon: getIconForPlace(g.types || []),
    rating: g.rating,
    userRatingCount: g.userRatingCount,
    types: g.types || [],
    googlePlaceId: g.id,
    photoRef: g.photos?.[0]?.name,
    priceLevel: g.priceLevel,
    isOpen: g.currentOpeningHours?.openNow,
  };
}

// ═══ Main Component ═══

export default function MapPage() {
  return (
    <Suspense>
      <MapPageInner />
    </Suspense>
  );
}

function MapPageInner() {
  const searchParams = useSearchParams();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userMarkerRef = useRef<any>(null);
  const isSearchModeRef = useRef(false);
  const activeCategoryRef = useRef('all');
  const fetchDebounce = useRef<NodeJS.Timeout | null>(null);
  const fetchedGrids = useRef<Map<string, MapPlace[]>>(new Map());

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapInitLoading, setMapInitLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedPlace, setSelectedPlace] = useState<MapPlace | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showList, setShowList] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState<MapPlace[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(14);

  // Search & GPS state
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchResults, setSearchResults] = useState<MapPlace[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [postPlacesLoaded, setPostPlacesLoaded] = useState(false);

  // Keep refs in sync with state for use inside event handlers
  useEffect(() => { isSearchModeRef.current = isSearchMode; }, [isSearchMode]);
  useEffect(() => { activeCategoryRef.current = activeCategory; }, [activeCategory]);

  // ═══ Fetch nearby places from Google ═══
  const fetchNearby = useCallback(async (lat: number, lng: number, zoom: number, category: string) => {
    if (zoom < 13) {
      setNearbyPlaces([]);
      return;
    }

    const gridKey = `${getGridKey(lat, lng, zoom)}_${category}`;
    if (fetchedGrids.current.has(gridKey)) {
      setNearbyPlaces(fetchedGrids.current.get(gridKey)!);
      return;
    }

    setLoadingPlaces(true);

    try {
      const types = CATEGORY_TYPES[category] || CATEGORY_TYPES.all;
      const results = await Promise.all(
        types.map(type => searchNearbyPlaces(lat, lng, type, zoom >= 16 ? 500 : 1500))
      );

      const seen = new Set<string>();
      const allPlaces: MapPlace[] = [];
      for (const batch of results) {
        for (const g of batch) {
          if (!seen.has(g.id)) {
            seen.add(g.id);
            allPlaces.push(googleToMapPlace(g));
          }
        }
      }

      fetchedGrids.current.set(gridKey, allPlaces);
      setNearbyPlaces(allPlaces);
    } catch (err) {
      console.error('Failed to fetch nearby:', err);
    } finally {
      setLoadingPlaces(false);
    }
  }, []);

  // ═══ Fetch PASSEPORT post-places from Supabase ═══
  const fetchPostPlaces = useCallback(async () => {
    if (postPlacesLoaded) return;
    setLoadingPlaces(true);
    try {
      const { getPlacesWithPosts } = await import('@/lib/db');
      const places = await getPlacesWithPosts(200);
      setPostPlacesLoaded(true);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapPlaces: MapPlace[] = places
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((p: any) => p.latitude && p.longitude)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((p: any) => ({
          id: p.id,
          name: p.name,
          address: p.address || '',
          lat: p.latitude,
          lng: p.longitude,
          icon: '✍️',
          types: ['post'],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          linkedPosts: (p.post_places || []).map((pp: any) => pp.posts).filter(Boolean),
        }));
      setNearbyPlaces(mapPlaces);
    } catch (err) {
      console.error('Failed to fetch post places:', err);
    } finally {
      setLoadingPlaces(false);
    }
  }, [postPlacesLoaded]);

  // ═══ Add markers to map ═══
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addMarkers = useCallback((places: MapPlace[], map?: any, mapboxModule?: any) => {
    const mapInstance = map || mapRef.current;
    if (!mapInstance) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const mb = mapboxModule;

    places.forEach(place => {
      if (!place.lat || !place.lng) return;

      const style = getMarkerStyle(place.types);
      const el = document.createElement('div');
      el.className = 'passeport-marker';
      el.innerHTML = `<div class="marker-inner" style="
        width: 42px; height: 42px;
        background: linear-gradient(135deg, ${style.bg}, ${style.grad});
        border: 3px solid white;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 17px;
        box-shadow: 0 4px 14px ${style.shadow}, 0 1px 3px rgba(0,0,0,0.08);
        cursor: pointer;
      ">${place.icon}</div>`;

      el.addEventListener('click', () => {
        setSelectedPlace(place);
        mapInstance.easeTo({
          center: [place.lng, place.lat],
          duration: 500,
          offset: [0, -60],
        });
      });

      if (mb) {
        const marker = new mb.Marker({ element: el })
          .setLngLat([place.lng, place.lat])
          .addTo(mapInstance);
        markersRef.current.push(marker);
      }
    });
  }, []);

  // ═══ Search handler ═══
  const handleSearch = useCallback(async () => {
    const q = searchQuery.trim();
    if (!q) return;

    setSearchLoading(true);
    try {
      const center = mapRef.current?.getCenter();
      const results = await searchPlaces(q, center?.lat, center?.lng, 5);
      const mapPlaces = results.map(googleToMapPlace);
      setSearchResults(mapPlaces);
      setIsSearchMode(true);

      if (mapPlaces.length > 0) {
        setSelectedPlace(mapPlaces[0]);
        mapRef.current?.flyTo({
          center: [mapPlaces[0].lng, mapPlaces[0].lat],
          zoom: 15,
          duration: 1500,
        });
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery]);

  // ═══ Clear search ═══
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setIsSearchMode(false);
    setSearchResults([]);
    setSelectedPlace(null);
    if (mapRef.current) {
      const center = mapRef.current.getCenter();
      const zoom = mapRef.current.getZoom();
      fetchNearby(center.lat, center.lng, zoom, activeCategoryRef.current);
    }
  }, [fetchNearby]);

  // ═══ GPS locate ═══
  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        mapRef.current?.flyTo({
          center: [loc.lng, loc.lat],
          zoom: 15,
          duration: 1500,
        });
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // ═══ Update markers when data changes ═══
  useEffect(() => {
    if (!mapLoaded) return;

    let places: MapPlace[];
    if (isSearchMode) {
      places = searchResults;
    } else {
      places = searchQuery
        ? nearbyPlaces.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.address.toLowerCase().includes(searchQuery.toLowerCase()))
        : nearbyPlaces;
    }

    const loadAndAdd = async () => {
      const mapboxgl = (await import('mapbox-gl')).default;
      addMarkers(places, undefined, mapboxgl);
    };
    loadAndAdd();
  }, [nearbyPlaces, searchResults, isSearchMode, searchQuery, mapLoaded, addMarkers]);

  // ═══ Init Mapbox ═══
  useEffect(() => {
    if (!hasMapbox) return;
    let cancelled = false;

    const initMap = async () => {
      injectMapStyles();
      const mapboxgl = (await import('mapbox-gl')).default;
      if (cancelled) return;

      const container = document.getElementById('passeport-map');
      if (!container) return;
      container.innerHTML = '';

      const map = new mapboxgl.Map({
        container: 'passeport-map',
        style: 'mapbox://styles/mapbox/light-v11',
        center: [121.5654, 25.0330],
        zoom: 14,
        accessToken: MAPBOX_TOKEN,
      });

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');

      map.on('load', () => {
        if (cancelled) { map.remove(); return; }
        warmifyMap(map);
        setMapLoaded(true);
        setMapInitLoading(false);
        mapRef.current = map;

        // Check for query params (from post detail → map link)
        const paramLat = searchParams.get('lat');
        const paramLng = searchParams.get('lng');
        const paramZoom = searchParams.get('zoom');
        if (paramLat && paramLng) {
          const lat = parseFloat(paramLat);
          const lng = parseFloat(paramLng);
          const zoom = paramZoom ? parseFloat(paramZoom) : 16;
          if (!isNaN(lat) && !isNaN(lng)) {
            map.flyTo({ center: [lng, lat], zoom, duration: 1500 });
            setActiveCategory('posts');
            return;
          }
        }

        const center = map.getCenter();
        fetchNearby(center.lat, center.lng, map.getZoom(), 'all');
      });

      map.on('moveend', () => {
        if (cancelled || isSearchModeRef.current) return;
        if (activeCategoryRef.current === 'posts') return; // posts are global, no re-fetch needed
        const center = map.getCenter();
        const zoom = map.getZoom();
        setCurrentZoom(zoom);

        if (fetchDebounce.current) clearTimeout(fetchDebounce.current);
        fetchDebounce.current = setTimeout(() => {
          fetchNearby(center.lat, center.lng, zoom, activeCategoryRef.current);
        }, 600);
      });
    };

    initMap();
    return () => {
      cancelled = true;
      if (fetchDebounce.current) clearTimeout(fetchDebounce.current);
      mapRef.current?.remove();
      mapRef.current = null;
      setMapLoaded(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ═══ Re-fetch when category changes ═══
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    if (isSearchMode) {
      setIsSearchMode(false);
      setSearchResults([]);
      setSearchQuery('');
    }
    if (activeCategory === 'posts') {
      fetchPostPlaces();
      return;
    }
    const center = mapRef.current.getCenter();
    const zoom = mapRef.current.getZoom();
    fetchNearby(center.lat, center.lng, zoom, activeCategory);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  // ═══ User location marker ═══
  useEffect(() => {
    if (!mapLoaded || !userLocation || !mapRef.current) return;

    const loadAndAdd = async () => {
      const mapboxgl = (await import('mapbox-gl')).default;
      if (userMarkerRef.current) userMarkerRef.current.remove();

      const el = document.createElement('div');
      el.innerHTML = `
        <div class="user-location-dot">
          <div class="user-location-pulse"></div>
          <div class="user-location-center"></div>
        </div>
      `;
      userMarkerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(mapRef.current);
    };
    loadAndAdd();
  }, [userLocation, mapLoaded]);

  // ═══ Computed ═══
  const displayPlaces = isSearchMode
    ? searchResults
    : searchQuery
      ? nearbyPlaces.filter(p =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.address.toLowerCase().includes(searchQuery.toLowerCase()))
      : nearbyPlaces;

  // ═══ Fallback ═══
  if (!hasMapbox) return <MapFallback />;

  return (
    <div className="h-[100dvh] md:h-full flex flex-col bg-cream relative" style={{ minHeight: '100%' }}>
      {/* ═══ Header ═══ */}
      <div className="relative z-20 bg-cream/95 backdrop-blur-md pt-14 pb-2 px-4 border-b border-[#E8E3DC]">
        {/* Search Bar */}
        <div className="flex items-center gap-2 px-3.5 py-2.5 bg-white/80 border border-[#E8E3DC] rounded-2xl shadow-sm mb-3">
          <button
            onClick={handleSearch}
            disabled={searchLoading}
            className="p-0.5 text-taupe hover:text-ink transition-colors"
          >
            {searchLoading ? (
              <div className="w-4 h-4 border-2 border-taupe border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            )}
          </button>
          <input
            type="text"
            placeholder="搜尋餐廳、景點、咖啡廳..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            className="w-full bg-transparent text-sm text-ink placeholder:text-[#B5AEA5] focus:outline-none font-noto"
          />
          {(searchQuery || isSearchMode) && (
            <button onClick={clearSearch} className="p-0.5 text-taupe hover:text-ink transition-colors flex-shrink-0">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
          <button onClick={() => setShowList(!showList)} className="p-0.5 text-taupe flex-shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
            </svg>
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {PLACE_CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              style={activeCategory === cat.value ? {
                background: cat.color,
                color: cat.value === 'attraction' ? '#5D4E37' : 'white',
              } : undefined}
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-medium font-noto transition-all duration-200 ${
                activeCategory === cat.value
                  ? 'shadow-sm'
                  : 'bg-white/60 text-taupe hover:bg-white/90'
              }`}
            >
              <span className="text-xs">{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ═══ Map Area ═══ */}
      <div className="flex-1 relative">
        {/* Loading overlay */}
        {mapInitLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-cream/80 z-10 gap-3">
            <div className="w-5 h-5 border-2 border-taupe border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] text-taupe font-noto">載入地圖中...</p>
            <button
              onClick={() => { setMapInitLoading(false); setShowList(true); }}
              className="mt-2 px-4 py-1.5 border border-[#E8E3DC] text-taupe text-[10px] rounded-full font-inter hover:bg-white/50 transition-colors"
            >
              切換列表模式
            </button>
          </div>
        )}

        {/* Search results banner */}
        {isSearchMode && mapLoaded && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full border border-[#E8E3DC] shadow-sm flex items-center gap-2 max-w-[90%]">
            <span className="text-sm flex-shrink-0">🔍</span>
            <p className="text-[11px] text-ink font-noto truncate">
              {searchResults.length > 0
                ? `找到 ${searchResults.length} 個「${searchQuery}」的結果`
                : `找不到「${searchQuery}」的結果`}
            </p>
            <button onClick={clearSearch} className="p-0.5 text-taupe hover:text-ink transition-colors flex-shrink-0">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Zoom hint */}
        {mapLoaded && currentZoom < 13 && !showList && !isSearchMode && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full border border-[#E8E3DC] shadow-sm">
            <p className="text-[10px] text-ink font-noto">放大地圖以顯示附近地點</p>
          </div>
        )}

        {/* Loading indicator */}
        {loadingPlaces && mapLoaded && !isSearchMode && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full border border-[#E8E3DC] shadow-sm flex items-center gap-2">
            <div className="w-3 h-3 border border-taupe/50 border-t-taupe rounded-full animate-spin" />
            <p className="text-[10px] text-ink font-noto">載入附近地點...</p>
          </div>
        )}

        {/* Place count badge */}
        {mapLoaded && !loadingPlaces && nearbyPlaces.length > 0 && currentZoom >= 13 && !showList && !isSearchMode && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full border border-[#E8E3DC] shadow-sm">
            <p className="text-[10px] text-ink font-noto">{displayPlaces.length} 個地點</p>
          </div>
        )}

        {/* Map container */}
        <div id="passeport-map" className="absolute inset-0" />

        {/* GPS Locate button */}
        {mapLoaded && (
          <button
            onClick={handleLocate}
            className="absolute bottom-[140px] right-3 z-20 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-md border border-[#E8E3DC] flex items-center justify-center hover:bg-white transition-colors active:scale-95"
            title="我的位置"
          >
            {locating ? (
              <div className="w-4 h-4 border-2 border-[#4285F4] border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={userLocation ? '#4285F4' : '#8B7E74'} strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
              </svg>
            )}
          </button>
        )}

        {/* List View */}
        {showList && (
          <div className="absolute inset-0 bg-cream/95 backdrop-blur-md z-10 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-playfair italic text-lg tracking-editorial text-ink">
                {displayPlaces.length} PLACES
              </h3>
              <button onClick={() => setShowList(false)} className="text-taupe hover:text-ink transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              {displayPlaces.map(place => (
                <PlaceListItem key={place.id} place={place} onClick={() => {
                  setSelectedPlace(place);
                  setShowList(false);
                  mapRef.current?.flyTo({ center: [place.lng, place.lat], zoom: 16, duration: 1000 });
                }} />
              ))}
              {displayPlaces.length === 0 && (
                <p className="text-center text-sm text-taupe font-noto py-8">
                  {isSearchMode ? '沒有搜尋結果' : currentZoom < 13 ? '放大地圖以載入附近地點' : '沒有找到符合的地點'}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Place Detail Card */}
        {selectedPlace && (
          activeCategory === 'posts'
            ? <PostPlaceCard place={selectedPlace} onClose={() => setSelectedPlace(null)} />
            : <PlaceCard place={selectedPlace} onClose={() => setSelectedPlace(null)} />
        )}
      </div>

      <BottomNav />
    </div>
  );
}

// ═══ Place Card (bottom sheet) ═══

function PlaceCard({ place, onClose }: { place: MapPlace; onClose: () => void }) {
  const tags = translateTypes(place.types, 3);
  const photoUrl = place.photoRef ? getPlacePhotoUrl(place.photoRef, 400) : null;
  const style = getMarkerStyle(place.types);

  return (
    <div className="absolute bottom-[76px] left-3 right-3 z-20 animate-slide-up">
      <div className="bg-white border border-[#E8E3DC] rounded-2xl shadow-lg overflow-hidden">
        {/* Photo strip with gradient overlay */}
        {photoUrl && (
          <div className="h-32 overflow-hidden relative">
            <img src={photoUrl} alt={place.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
          </div>
        )}
        <div className="p-3.5">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full text-white"
                  style={{ background: style.bg }}
                >
                  {place.icon} {tags[0] || ''}
                </span>
                {tags.slice(1).map(tag => (
                  <span key={tag} className="text-[9px] text-taupe bg-[#F5F1EC] px-1.5 py-0.5 rounded-full font-noto">{tag}</span>
                ))}
              </div>
              <h3 className="text-sm font-semibold text-ink font-inter truncate">
                {place.name}
              </h3>
              {place.address && (
                <p className="text-[11px] text-taupe font-noto truncate mt-0.5">{place.address}</p>
              )}
            </div>
            <button onClick={onClose} className="p-1 text-taupe hover:text-ink transition-colors ml-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Rating + status */}
          <div className="flex items-center gap-3 mt-2">
            {place.rating && (
              <span className="text-[11px] font-inter text-ink font-medium">
                ⭐ {place.rating}{place.userRatingCount ? ` (${place.userRatingCount})` : ''}
              </span>
            )}
            {place.isOpen !== undefined && (
              <span className={`text-[10px] font-noto font-medium ${place.isOpen ? 'text-emerald-600' : 'text-red-400'}`}>
                {place.isOpen ? '營業中' : '已打烊'}
              </span>
            )}
          </div>
        </div>
        <div className="px-3.5 pb-3.5 flex gap-2">
          <Link
            href={`/place/google/${place.googlePlaceId}`}
            className="flex-1 py-2.5 bg-ink text-cream text-[11px] text-center rounded-xl tracking-editorial uppercase font-inter font-medium"
          >
            查看詳情
          </Link>
          <button
            onClick={() => {
              window.open(`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`, '_blank');
            }}
            className="px-4 py-2.5 border border-[#E8E3DC] text-ink text-[11px] rounded-xl tracking-editorial uppercase font-inter font-medium hover:bg-[#F5F1EC] transition-colors"
          >
            導航
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══ Post Place Card (bottom sheet for post markers) ═══

function PostPlaceCard({ place, onClose }: { place: MapPlace; onClose: () => void }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const posts = (place.linkedPosts || []) as any[];

  return (
    <div className="absolute bottom-[76px] left-3 right-3 z-20 animate-slide-up">
      <div className="bg-white border border-[#E8E3DC] rounded-2xl shadow-lg overflow-hidden">
        <div className="p-3.5">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full text-white" style={{ background: '#D4A5C8' }}>
                ✍️ {posts.length} 篇文章
              </span>
              <h3 className="text-sm font-semibold text-ink font-inter mt-1.5">{place.name}</h3>
              {place.address && <p className="text-[11px] text-taupe font-noto truncate mt-0.5">{place.address}</p>}
            </div>
            <button onClick={onClose} className="p-1 text-taupe hover:text-ink transition-colors ml-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Post list */}
          {posts.length > 0 ? (
            <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {posts.map((post: any) => (
                <Link key={post.id} href={`/post/${post.id}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#F5F1EC] transition-colors">
                  {post.cover_image_url && (
                    <img src={post.cover_image_url} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-inter font-medium text-ink truncate">{post.title}</p>
                    {post.user?.display_name && (
                      <p className="text-[10px] text-taupe font-noto">{post.user.display_name}</p>
                    )}
                  </div>
                  <svg className="w-4 h-4 text-taupe flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-xs text-taupe font-noto text-center py-3">此地點尚無文章</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══ List Item ═══

function PlaceListItem({ place, onClick }: { place: MapPlace; onClick: () => void }) {
  const style = getMarkerStyle(place.types);
  return (
    <button onClick={onClick} className="w-full flex gap-3 p-3.5 bg-white/70 rounded-2xl text-left hover:bg-white transition-colors border border-[#E8E3DC]/50">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
        style={{ background: `linear-gradient(135deg, ${style.bg}, ${style.grad})` }}
      >
        <span className="text-lg">{place.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-ink font-inter font-semibold truncate">{place.name}</p>
        {place.address && (
          <p className="text-[11px] text-taupe font-noto truncate">{place.address}</p>
        )}
        <div className="flex items-center gap-2 mt-0.5">
          {place.rating && (
            <span className="text-[10px] text-taupe font-inter">⭐ {place.rating}</span>
          )}
          {place.isOpen !== undefined && (
            <span className={`text-[9px] font-noto font-medium ${place.isOpen ? 'text-emerald-600' : 'text-red-400'}`}>
              {place.isOpen ? '營業中' : '已打烊'}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ═══ Fallback (no Mapbox token) ═══

function MapFallback() {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6">
      <p className="font-playfair italic text-xl text-ink mb-2">MAP</p>
      <p className="text-sm text-taupe font-noto text-center">
        地圖功能需要 Mapbox Token。<br />
        請在 .env.local 設定 NEXT_PUBLIC_MAPBOX_TOKEN。
      </p>
      <BottomNav />
    </div>
  );
}
