'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { BottomNav } from '@/components/bottom-nav';
import { searchNearbyPlaces, getPlacePhotoUrl, translateTypes, GooglePlace } from '@/lib/google-places';
import Link from 'next/link';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
const hasMapbox = MAPBOX_TOKEN.length > 0 && !MAPBOX_TOKEN.includes('placeholder');

// Google Places types for each category filter
const CATEGORY_TYPES: Record<string, string[]> = {
  all: ['restaurant', 'cafe', 'tourist_attraction', 'museum'],
  restaurant: ['restaurant'],
  cafe: ['cafe', 'coffee_shop'],
  attraction: ['tourist_attraction', 'park', 'amusement_park'],
  museum: ['museum', 'art_gallery'],
};

const PLACE_CATEGORIES = [
  { value: 'all', label: '全部', icon: '📍' },
  { value: 'restaurant', label: '餐廳', icon: '🍽️' },
  { value: 'cafe', label: '咖啡', icon: '☕' },
  { value: 'attraction', label: '景點', icon: '🏛️' },
  { value: 'museum', label: '博物館', icon: '🎨' },
] as const;

// Icon for a Google Place based on its types
function getIconForPlace(types: string[]): string {
  if (!types) return '📍';
  if (types.some(t => t.includes('cafe') || t.includes('coffee'))) return '☕';
  if (types.some(t => t.includes('museum') || t.includes('art_gallery'))) return '🎨';
  if (types.some(t => t.includes('tourist') || t.includes('park') || t.includes('amusement'))) return '🏛️';
  if (types.some(t => t.includes('restaurant') || t.includes('food') || t.includes('meal'))) return '🍽️';
  return '📍';
}

// Grid-based cache key for viewport position (prevents re-fetching same area)
function getGridKey(lat: number, lng: number, zoom: number): string {
  // At zoom 14+, grid cells are ~0.01 degrees (~1km)
  const precision = zoom >= 16 ? 1000 : zoom >= 14 ? 100 : 10;
  const gLat = Math.round(lat * precision) / precision;
  const gLng = Math.round(lng * precision) / precision;
  return `${gLat},${gLng}`;
}

// ═══ Selected place type for the card ═══
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

export default function MapPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedPlace, setSelectedPlace] = useState<MapPlace | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showList, setShowList] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState<MapPlace[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [mapInitLoading, setMapInitLoading] = useState(true);
  const [currentZoom, setCurrentZoom] = useState(14);

  // Cache: grid key → places (avoid re-fetching)
  const fetchedGrids = useRef<Map<string, MapPlace[]>>(new Map());
  const fetchDebounce = useRef<NodeJS.Timeout | null>(null);

  // ═══ Fetch nearby places from Google ═══
  const fetchNearby = useCallback(async (lat: number, lng: number, zoom: number, category: string) => {
    // Only fetch at zoom 13+
    if (zoom < 13) {
      setNearbyPlaces([]);
      return;
    }

    const gridKey = `${getGridKey(lat, lng, zoom)}_${category}`;

    // Check cache
    if (fetchedGrids.current.has(gridKey)) {
      setNearbyPlaces(fetchedGrids.current.get(gridKey)!);
      return;
    }

    setLoadingPlaces(true);

    try {
      const types = CATEGORY_TYPES[category] || CATEGORY_TYPES.all;
      // Fetch for each type in parallel
      const results = await Promise.all(
        types.map(type => searchNearbyPlaces(lat, lng, type, zoom >= 16 ? 500 : 1500))
      );

      // Flatten, deduplicate by ID
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

      // Cache & set
      fetchedGrids.current.set(gridKey, allPlaces);
      setNearbyPlaces(allPlaces);
    } catch (err) {
      console.error('Failed to fetch nearby:', err);
    } finally {
      setLoadingPlaces(false);
    }
  }, []);

  // ═══ Add markers to map ═══
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addMarkers = useCallback((places: MapPlace[], map?: any, mapboxModule?: any) => {
    const mapInstance = map || mapRef.current;
    if (!mapInstance) return;

    // Remove old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const mb = mapboxModule;

    places.forEach(place => {
      if (!place.lat || !place.lng) return;

      const el = document.createElement('div');
      el.className = 'passeport-marker';
      el.innerHTML = `<div style="
        width: 34px; height: 34px;
        background: #222222; border: 2px solid #F7F4EF;
        border-radius: 50%; display: flex; align-items: center;
        justify-content: center; font-size: 15px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.25);
        cursor: pointer; transition: transform 0.15s;
      ">${place.icon}</div>`;

      el.addEventListener('mouseenter', () => {
        (el.firstElementChild as HTMLElement).style.transform = 'scale(1.25)';
      });
      el.addEventListener('mouseleave', () => {
        (el.firstElementChild as HTMLElement).style.transform = 'scale(1)';
      });
      el.addEventListener('click', () => setSelectedPlace(place));

      if (mb) {
        const marker = new mb.Marker({ element: el })
          .setLngLat([place.lng, place.lat])
          .addTo(mapInstance);
        markersRef.current.push(marker);
      }
    });
  }, []);

  // ═══ Update markers when places change ═══
  useEffect(() => {
    if (!mapLoaded) return;

    const filtered = searchQuery
      ? nearbyPlaces.filter(p =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.address.toLowerCase().includes(searchQuery.toLowerCase()))
      : nearbyPlaces;

    const loadAndAdd = async () => {
      const mapboxgl = (await import('mapbox-gl')).default;
      addMarkers(filtered, undefined, mapboxgl);
    };
    loadAndAdd();
  }, [nearbyPlaces, searchQuery, mapLoaded, addMarkers]);

  // ═══ Init Mapbox ═══
  useEffect(() => {
    if (!hasMapbox) return;
    let cancelled = false;

    const initMap = async () => {
      const mapboxgl = (await import('mapbox-gl')).default;
      if (cancelled) return;

      const container = document.getElementById('passeport-map');
      if (!container) return;
      container.innerHTML = '';

      // Default center: Taipei
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
        setMapLoaded(true);
        setMapInitLoading(false);
        mapRef.current = map;

        // Initial fetch
        const center = map.getCenter();
        fetchNearby(center.lat, center.lng, map.getZoom(), activeCategory);
      });

      // Fetch on map move (debounced)
      map.on('moveend', () => {
        if (cancelled) return;
        const center = map.getCenter();
        const zoom = map.getZoom();
        setCurrentZoom(zoom);

        if (fetchDebounce.current) clearTimeout(fetchDebounce.current);
        fetchDebounce.current = setTimeout(() => {
          fetchNearby(center.lat, center.lng, zoom, activeCategory);
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
    const center = mapRef.current.getCenter();
    const zoom = mapRef.current.getZoom();
    fetchNearby(center.lat, center.lng, zoom, activeCategory);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  // ═══ Filtered places for list view ═══
  const displayPlaces = searchQuery
    ? nearbyPlaces.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.address.toLowerCase().includes(searchQuery.toLowerCase()))
    : nearbyPlaces;

  // ═══ Fallback ═══
  if (!hasMapbox) {
    return <MapFallback />;
  }

  return (
    <div className="h-[100dvh] md:h-full flex flex-col bg-cream relative" style={{ minHeight: '100%' }}>
      {/* Header */}
      <div className="relative z-20 bg-cream/95 backdrop-blur-md pt-14 pb-2 px-4 border-b border-border">
        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2.5 bg-surface border border-border rounded-xl mb-3">
          <svg className="w-4 h-4 text-taupe flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="搜尋附近餐廳、景點、咖啡廳⋯⋯"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-ink placeholder:text-taupe/50 focus:outline-none font-noto"
          />
          <button onClick={() => setShowList(!showList)} className="p-0.5">
            <svg className="w-4 h-4 text-taupe" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
              className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-noto transition-colors ${
                activeCategory === cat.value
                  ? 'bg-ink text-cream'
                  : 'bg-surface/50 text-taupe'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {/* Loading overlay */}
        {mapInitLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-cream/80 z-10 gap-3">
            <div className="w-5 h-5 border-2 border-ink border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] text-taupe font-noto">載入地圖中...</p>
            <button
              onClick={() => { setMapInitLoading(false); setShowList(true); }}
              className="mt-2 px-4 py-1.5 border border-border text-taupe text-[10px] rounded-full font-inter hover:bg-surface transition-colors"
            >
              切換列表模式
            </button>
          </div>
        )}

        {/* Zoom hint */}
        {mapLoaded && currentZoom < 13 && !showList && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-ink/80 backdrop-blur-sm rounded-full">
            <p className="text-[10px] text-cream font-noto">放大地圖以顯示附近地點</p>
          </div>
        )}

        {/* Loading indicator for place fetch */}
        {loadingPlaces && mapLoaded && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-ink/80 backdrop-blur-sm rounded-full flex items-center gap-2">
            <div className="w-3 h-3 border border-cream/50 border-t-cream rounded-full animate-spin" />
            <p className="text-[10px] text-cream font-noto">載入附近地點...</p>
          </div>
        )}

        {/* Place count badge */}
        {mapLoaded && !loadingPlaces && nearbyPlaces.length > 0 && currentZoom >= 13 && !showList && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 bg-cream/90 backdrop-blur-sm rounded-full border border-border shadow-sm">
            <p className="text-[10px] text-ink font-noto">{displayPlaces.length} 個地點</p>
          </div>
        )}

        <div id="passeport-map" className="absolute inset-0" />

        {/* List View */}
        {showList && (
          <div className="absolute inset-0 bg-cream/95 backdrop-blur-md z-10 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-playfair italic text-lg tracking-editorial text-ink">
                {displayPlaces.length} PLACES
              </h3>
              <button onClick={() => setShowList(false)} className="text-taupe">
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
                  if (mapRef.current) {
                    mapRef.current.flyTo({ center: [place.lng, place.lat], zoom: 16, duration: 1000 });
                  }
                }} />
              ))}
              {displayPlaces.length === 0 && (
                <p className="text-center text-sm text-taupe font-noto py-8">
                  {currentZoom < 13 ? '放大地圖以載入附近地點' : '沒有找到符合的地點'}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Place Detail Card */}
        {selectedPlace && (
          <PlaceCard place={selectedPlace} onClose={() => setSelectedPlace(null)} />
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

  return (
    <div className="absolute bottom-2 left-3 right-3 z-20 animate-slide-up">
      <div className="bg-cream border border-border rounded-xl shadow-lg overflow-hidden">
        {/* Photo strip */}
        {photoUrl && (
          <div className="h-28 overflow-hidden">
            <img src={photoUrl} alt={place.name} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-sm">{place.icon}</span>
                {tags.map(tag => (
                  <span key={tag} className="text-[9px] text-taupe bg-surface px-1.5 py-0.5 rounded font-noto">{tag}</span>
                ))}
              </div>
              <h3 className="text-sm font-medium text-ink font-inter truncate">
                {place.name}
              </h3>
              {place.address && (
                <p className="text-[11px] text-taupe font-noto truncate mt-0.5">{place.address}</p>
              )}
            </div>
            <button onClick={onClose} className="p-1 text-taupe ml-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Rating + status */}
          <div className="flex items-center gap-3 mt-1.5">
            {place.rating && (
              <span className="text-[11px] font-inter text-ink">
                ⭐ {place.rating}{place.userRatingCount ? ` (${place.userRatingCount})` : ''}
              </span>
            )}
            {place.isOpen !== undefined && (
              <span className={`text-[10px] font-noto ${place.isOpen ? 'text-green-600' : 'text-red-500'}`}>
                {place.isOpen ? '營業中' : '已打烊'}
              </span>
            )}
          </div>
        </div>
        <div className="px-3 pb-3 flex gap-2">
          <Link
            href={`/place/google/${place.googlePlaceId}`}
            className="flex-1 py-2 bg-ink text-cream text-[11px] text-center rounded-lg tracking-editorial uppercase font-inter"
          >
            查看詳情
          </Link>
          <button
            onClick={() => {
              window.open(`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`, '_blank');
            }}
            className="px-4 py-2 border border-border text-ink text-[11px] rounded-lg tracking-editorial uppercase font-inter"
          >
            導航
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══ List Item ═══
function PlaceListItem({ place, onClick }: { place: MapPlace; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex gap-3 p-3 bg-surface/50 rounded-xl text-left hover:bg-surface transition-colors">
      <div className="w-12 h-12 rounded-lg bg-surface border border-border flex items-center justify-center flex-shrink-0">
        <span className="text-lg">{place.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-ink font-inter font-medium truncate">{place.name}</p>
        {place.address && (
          <p className="text-[11px] text-taupe font-noto truncate">{place.address}</p>
        )}
        <div className="flex items-center gap-2 mt-0.5">
          {place.rating && (
            <span className="text-[10px] text-taupe font-inter">⭐ {place.rating}</span>
          )}
          {place.isOpen !== undefined && (
            <span className={`text-[9px] font-noto ${place.isOpen ? 'text-green-600' : 'text-red-500'}`}>
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
