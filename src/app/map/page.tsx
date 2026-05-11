'use client';

import { useEffect, useRef, useState } from 'react';
import { BottomNav } from '@/components/bottom-nav';
import { getPlacesWithCoords } from '@/lib/db';
import { Place } from '@/lib/types';
import Link from 'next/link';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
const hasMapbox = MAPBOX_TOKEN.length > 0 && !MAPBOX_TOKEN.includes('placeholder');

const PLACE_CATEGORIES = [
  { value: 'all', label: '全部', icon: '📍' },
  { value: 'restaurant', label: '餐廳', icon: '🍽️' },
  { value: 'cafe', label: '咖啡', icon: '☕' },
  { value: 'snack', label: '小吃', icon: '🍜' },
  { value: 'attraction', label: '景點', icon: '🏛️' },
  { value: 'shop', label: '潮流店', icon: '🛍️' },
  { value: 'bar', label: '酒吧', icon: '🍸' },
  { value: 'cafe_journal', label: '咖啡誌', icon: '☕' },
  { value: 'table_taste', label: '餐桌風景', icon: '🍽️' },
  { value: 'city_guide', label: '城市指南', icon: '🏙️' },
  { value: 'travel_notes', label: '旅行筆記', icon: '✈️' },
] as const;

export default function MapPage() {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showList, setShowList] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  // Load real places from DB
  useEffect(() => {
    const loadPlaces = async () => {
      try {
        const data = await getPlacesWithCoords();
        setPlaces(data);
      } catch (err) {
        console.error('Failed to load places:', err);
        setPlaces([]);
      } finally {
        setLoading(false);
      }
    };
    loadPlaces();
  }, []);

  const filteredPlaces = places.filter(p => {
    const matchCat = activeCategory === 'all' || p.category === activeCategory;
    const matchSearch = searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const addMarkers = async (map?: mapboxgl.Map, mapboxModule?: typeof import('mapbox-gl').default) => {
    const mapInstance = map || mapRef.current;
    if (!mapInstance) return;

    const mapboxgl = mapboxModule || (await import('mapbox-gl')).default;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    filteredPlaces.forEach(place => {
      if (place.latitude === null || place.longitude === null) return;

      const catInfo = PLACE_CATEGORIES.find(c => c.value === place.category);
      const el = document.createElement('div');
      el.className = 'passeport-marker';
      el.innerHTML = `<div style="
        width: 36px; height: 36px;
        background: #222222; border: 2px solid #F7F4EF;
        border-radius: 50%; display: flex; align-items: center;
        justify-content: center; font-size: 16px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer; transition: transform 0.2s;
      ">${catInfo?.icon || '📍'}</div>`;

      el.addEventListener('mouseenter', () => {
        el.querySelector('div')!.style.transform = 'scale(1.2)';
      });
      el.addEventListener('mouseleave', () => {
        el.querySelector('div')!.style.transform = 'scale(1)';
      });
      el.addEventListener('click', () => setSelectedPlace(place));

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([place.longitude!, place.latitude!])
        .addTo(mapInstance);
      markersRef.current.push(marker);
    });
  };

  useEffect(() => {
    if (!hasMapbox || loading) return;
    let cancelled = false;

    const initMap = async () => {
      const mapboxgl = (await import('mapbox-gl')).default;
      if (cancelled) return;

      const container = document.getElementById('passeport-map');
      if (!container) return;

      // Clear any leftover DOM
      container.innerHTML = '';

      // Default center: Taipei
      const defaultCenter = { lng: 121.5654, lat: 25.0330, zoom: 12 };

      // If we have places, center on first place
      const firstPlace = filteredPlaces[0];
      const center = firstPlace && firstPlace.longitude && firstPlace.latitude
        ? { lng: firstPlace.longitude, lat: firstPlace.latitude, zoom: 12 }
        : defaultCenter;

      const map = new mapboxgl.Map({
        container: 'passeport-map',
        style: 'mapbox://styles/mapbox/light-v11',
        center: [center.lng, center.lat],
        zoom: center.zoom,
        accessToken: MAPBOX_TOKEN,
      });

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');

      map.on('load', () => {
        if (cancelled) { map.remove(); return; }
        setMapLoaded(true);
        mapRef.current = map;
        addMarkers(map, mapboxgl);
      });
    };

    initMap();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      setMapLoaded(false);
    };
  }, [loading]);

  useEffect(() => {
    if (mapLoaded) addMarkers();
  }, [activeCategory, searchQuery, mapLoaded, filteredPlaces.length]);

  const flyToPlace = (place: Place) => {
    if (place.latitude === null || place.longitude === null) return;
    setSelectedPlace(place);
    setShowList(false);
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [place.longitude, place.latitude], zoom: 15, duration: 1000 });
    }
  };

  // Fallback if no Mapbox token
  if (!hasMapbox) {
    return (
      <MapFallback
        places={filteredPlaces}
        loading={loading}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
    );
  }

  return (
    <div className="h-screen flex flex-col bg-cream relative">
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
            placeholder="搜尋餐廳、景點、咖啡廳⋯⋯"
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
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-cream/80 z-10">
            <div className="w-5 h-5 border-2 border-ink border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <div id="passeport-map" className="absolute inset-0" />

        {/* List View */}
        {showList && (
          <div className="absolute inset-0 bg-cream/95 backdrop-blur-md z-10 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-playfair italic text-lg tracking-editorial text-ink">
                {filteredPlaces.length} PLACES
              </h3>
              <button onClick={() => setShowList(false)} className="text-taupe">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              {filteredPlaces.map(place => (
                <PlaceListItem key={place.id} place={place} onClick={() => flyToPlace(place)} />
              ))}
              {filteredPlaces.length === 0 && (
                <p className="text-center text-sm text-taupe font-noto py-8">沒有找到符合的地點</p>
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

function PlaceCard({ place, onClose }: { place: Place; onClose: () => void }) {
  const catInfo = PLACE_CATEGORIES.find(c => c.value === place.category);

  return (
    <div className="absolute bottom-2 left-3 right-3 z-20 animate-slide-up">
      <div className="bg-cream border border-border rounded-xl shadow-lg overflow-hidden">
        <div className="p-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <span className="text-[9px] text-taupe tracking-wider uppercase font-inter">
                {catInfo?.icon || '📍'} {catInfo?.label || place.category}
              </span>
              <h3 className="text-sm font-medium text-ink font-inter truncate mt-0.5">
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
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[10px] text-taupe font-inter">
              被提及 {place.mention_count} 次
            </span>
          </div>
        </div>
        <div className="px-3 pb-3 flex gap-2">
          <Link
            href={`/place/${place.id}`}
            className="flex-1 py-2 bg-ink text-cream text-[11px] text-center rounded-lg tracking-editorial uppercase font-inter"
          >
            VIEW STORIES
          </Link>
          <button className="px-4 py-2 border border-border text-ink text-[11px] rounded-lg tracking-editorial uppercase font-inter">
            SAVE
          </button>
        </div>
      </div>
    </div>
  );
}

function PlaceListItem({ place, onClick }: { place: Place; onClick: () => void }) {
  const catInfo = PLACE_CATEGORIES.find(c => c.value === place.category);
  return (
    <button onClick={onClick} className="w-full flex gap-3 p-3 bg-surface/50 rounded-xl text-left hover:bg-surface transition-colors">
      <div className="w-14 h-14 rounded-lg bg-surface border border-border flex items-center justify-center flex-shrink-0">
        <span className="text-xl">{catInfo?.icon || '📍'}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-taupe font-inter tracking-wide">{catInfo?.label || place.category}</span>
        </div>
        <p className="text-sm text-ink font-inter font-medium truncate">{place.name}</p>
        {place.address && (
          <p className="text-[11px] text-taupe font-noto truncate">{place.address}</p>
        )}
      </div>
      <div className="flex flex-col items-end justify-center">
        <span className="text-[9px] text-taupe font-inter">{place.mention_count} 次提及</span>
      </div>
    </button>
  );
}

// Fallback when no Mapbox token
function MapFallback({ places, loading, activeCategory, setActiveCategory, searchQuery, setSearchQuery }: {
  places: Place[];
  loading: boolean;
  activeCategory: string;
  setActiveCategory: (c: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}) {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header */}
      <div className="pt-14 pb-3 px-5 border-b border-border">
        <h1 className="font-playfair italic text-2xl tracking-editorial text-ink mb-3">
          MAP
        </h1>

        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2.5 bg-surface border border-border rounded-xl mb-3">
          <svg className="w-4 h-4 text-taupe flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="搜尋餐廳、景點、咖啡廳⋯⋯"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-ink placeholder:text-taupe/50 focus:outline-none font-noto"
          />
        </div>

        {/* Category Filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {PLACE_CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-noto transition-colors ${
                activeCategory === cat.value ? 'bg-ink text-cream' : 'bg-surface/50 text-taupe'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mapbox notice */}
      <div className="mx-5 mt-4 p-3 bg-surface/60 rounded-lg border border-border">
        <p className="text-[11px] text-taupe font-noto text-center">
          🗺️ 設定 <span className="font-inter font-medium">NEXT_PUBLIC_MAPBOX_TOKEN</span> 即可啟用互動地圖
        </p>
      </div>

      {/* Place List */}
      <div className="flex-1 px-5 pt-4 pb-20">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-playfair italic text-base tracking-editorial text-ink">
            ALL PLACES
          </h2>
          <span className="text-[10px] text-taupe font-inter">{places.length} 個地點</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-ink border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {places.map(place => (
              <Link key={place.id} href={`/place/${place.id}`} className="block">
                <div className="w-full flex gap-3 p-3 bg-surface/50 rounded-xl text-left hover:bg-surface transition-colors">
                  <div className="w-14 h-14 rounded-lg bg-surface border border-border flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">{PLACE_CATEGORIES.find(c => c.value === place.category)?.icon || '📍'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ink font-inter font-medium truncate">{place.name}</p>
                    {place.address && (
                      <p className="text-[11px] text-taupe font-noto truncate">{place.address}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end justify-center">
                    <span className="text-[9px] text-taupe font-inter">{place.mention_count} 次提及</span>
                  </div>
                </div>
              </Link>
            ))}
            {places.length === 0 && !loading && (
              <p className="text-center text-sm text-taupe font-noto py-8">目前沒有地點資料</p>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
