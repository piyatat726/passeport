'use client';

import { useEffect, useRef, useState } from 'react';
import { BottomNav } from '@/components/bottom-nav';
import { SEED_PLACES, PLACE_CATEGORIES, CITY_CENTERS, Place } from '@/lib/places-data';
import { SEED_POSTS } from '@/lib/seed-data';
import Link from 'next/link';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
const hasMapbox = MAPBOX_TOKEN.length > 0 && !MAPBOX_TOKEN.includes('placeholder');

export default function MapPage() {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Taipei');
  const [showList, setShowList] = useState(false);

  const filteredPlaces = SEED_PLACES.filter(p => {
    const matchCat = activeCategory === 'all' || p.category === activeCategory;
    const matchSearch = searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nameZh.includes(searchQuery);
    return matchCat && matchSearch;
  });

  const addMarkers = async (map?: mapboxgl.Map, mapboxModule?: typeof import('mapbox-gl').default) => {
    const mapInstance = map || mapRef.current;
    if (!mapInstance) return;

    const mapboxgl = mapboxModule || (await import('mapbox-gl')).default;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    filteredPlaces.forEach(place => {
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
        .setLngLat([place.lng, place.lat])
        .addTo(mapInstance);
      markersRef.current.push(marker);
    });
  };

  useEffect(() => {
    if (!hasMapbox) return;
    let cancelled = false;

    const initMap = async () => {
      const mapboxgl = (await import('mapbox-gl')).default;
      if (cancelled) return;

      const container = document.getElementById('passeport-map');
      if (!container) return;

      // Clear any leftover DOM
      container.innerHTML = '';

      const center = CITY_CENTERS[selectedCity] || CITY_CENTERS['Taipei'];

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
  }, [selectedCity]);

  useEffect(() => {
    if (mapLoaded) addMarkers();
  }, [activeCategory, searchQuery, mapLoaded]);

  const flyToCity = (city: string) => {
    setSelectedCity(city);
    setSelectedPlace(null);
    const center = CITY_CENTERS[city];
    if (center && mapRef.current) {
      mapRef.current.flyTo({ center: [center.lng, center.lat], zoom: center.zoom, duration: 1500 });
    }
  };

  const flyToPlace = (place: Place) => {
    setSelectedPlace(place);
    setShowList(false);
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [place.lng, place.lat], zoom: 15, duration: 1000 });
    }
  };

  // Fallback if no Mapbox token
  if (!hasMapbox) {
    return <MapFallback
      places={filteredPlaces}
      activeCategory={activeCategory}
      setActiveCategory={setActiveCategory}
      selectedPlace={selectedPlace}
      setSelectedPlace={setSelectedPlace}
      selectedCity={selectedCity}
      flyToCity={flyToCity}
    />;
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

        {/* City Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {Object.keys(CITY_CENTERS).map(city => (
            <button
              key={city}
              onClick={() => flyToCity(city)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-inter tracking-wide transition-colors ${
                selectedCity === city
                  ? 'bg-ink text-cream'
                  : 'bg-surface text-taupe border border-border'
              }`}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Category Filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar mt-1">
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
  const relatedPost = SEED_POSTS.find(p =>
    p.location.toLowerCase().includes(place.city.toLowerCase())
  );

  return (
    <div className="absolute bottom-2 left-3 right-3 z-20 animate-slide-up">
      <div className="bg-cream border border-border rounded-xl shadow-lg overflow-hidden">
        <div className="flex gap-3 p-3">
          <img
            src={place.image}
            alt={place.name}
            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[9px] text-taupe tracking-wider uppercase font-inter">
                  {catInfo?.icon} {catInfo?.label}
                </span>
                <h3 className="text-sm font-medium text-ink font-inter truncate mt-0.5">
                  {place.name}
                </h3>
                <p className="text-[11px] text-taupe font-noto">{place.nameZh}</p>
              </div>
              <button onClick={onClose} className="p-1 text-taupe">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-3 mt-2">
              {place.rating && (
                <span className="text-[10px] text-ink font-inter flex items-center gap-0.5">
                  ⭐ {place.rating}
                </span>
              )}
              <span className="text-[10px] text-taupe font-inter">
                📝 {place.postCount} 篇文章
              </span>
            </div>
          </div>
        </div>
        <div className="px-3 pb-3 flex gap-2">
          {relatedPost ? (
            <Link
              href={`/post/${relatedPost.id}`}
              className="flex-1 py-2 bg-ink text-cream text-[11px] text-center rounded-lg tracking-editorial uppercase font-inter"
            >
              VIEW STORIES
            </Link>
          ) : (
            <button className="flex-1 py-2 bg-ink text-cream text-[11px] text-center rounded-lg tracking-editorial uppercase font-inter">
              VIEW STORIES
            </button>
          )}
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
      <img src={place.image} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs">{catInfo?.icon}</span>
          <span className="text-[10px] text-taupe font-inter tracking-wide">{place.city}</span>
        </div>
        <p className="text-sm text-ink font-inter font-medium truncate">{place.name}</p>
        <p className="text-[11px] text-taupe font-noto">{place.nameZh}</p>
      </div>
      <div className="flex flex-col items-end justify-center">
        {place.rating && <span className="text-[10px] text-ink font-inter">⭐ {place.rating}</span>}
        <span className="text-[9px] text-taupe font-inter">{place.postCount} 篇</span>
      </div>
    </button>
  );
}

// Fallback when no Mapbox token
function MapFallback({ places, activeCategory, setActiveCategory, selectedPlace, setSelectedPlace, selectedCity, flyToCity }: {
  places: Place[];
  activeCategory: string;
  setActiveCategory: (c: string) => void;
  selectedPlace: Place | null;
  setSelectedPlace: (p: Place | null) => void;
  selectedCity: string;
  flyToCity: (c: string) => void;
}) {
  const cityPlaces = places.filter(p => p.city === selectedCity);

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header */}
      <div className="pt-14 pb-3 px-5 border-b border-border">
        <h1 className="font-playfair italic text-2xl tracking-editorial text-ink mb-3">
          MAP
        </h1>

        {/* City Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {Object.keys(CITY_CENTERS).map(city => (
            <button
              key={city}
              onClick={() => flyToCity(city)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-inter tracking-wide transition-colors ${
                selectedCity === city ? 'bg-ink text-cream' : 'bg-surface text-taupe border border-border'
              }`}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Category Filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar mt-2">
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

      {/* Mapbox 提示 */}
      <div className="mx-5 mt-4 p-3 bg-surface/60 rounded-lg border border-border">
        <p className="text-[11px] text-taupe font-noto text-center">
          🗺️ 設定 <span className="font-inter font-medium">NEXT_PUBLIC_MAPBOX_TOKEN</span> 即可啟用互動地圖
        </p>
      </div>

      {/* Place List */}
      <div className="flex-1 px-5 pt-4 pb-20">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-playfair italic text-base tracking-editorial text-ink">
            {selectedCity.toUpperCase()}
          </h2>
          <span className="text-[10px] text-taupe font-inter">{cityPlaces.length} 個地點</span>
        </div>
        <div className="space-y-3">
          {cityPlaces.map(place => (
            <PlaceListItem key={place.id} place={place} onClick={() => setSelectedPlace(place)} />
          ))}
          {cityPlaces.length === 0 && (
            <p className="text-center text-sm text-taupe font-noto py-8">此城市尚無地點資料</p>
          )}
        </div>
      </div>

      {/* Place Card */}
      {selectedPlace && (
        <div className="fixed bottom-16 left-3 right-3 z-30">
          <PlaceCard place={selectedPlace} onClose={() => setSelectedPlace(null)} />
        </div>
      )}

      <BottomNav />
    </div>
  );
}
