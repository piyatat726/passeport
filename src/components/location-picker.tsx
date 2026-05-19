'use client';

import { useState, useEffect, useRef } from 'react';

interface LocationResult {
  id: string;
  name: string;
  fullName: string;
  lat: number;
  lng: number;
}

interface LocationPickerProps {
  value: string;
  onChange: (location: string, coords?: { lat: number; lng: number }) => void;
  placeholder?: string;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
const hasMapbox = MAPBOX_TOKEN.length > 0 && !MAPBOX_TOKEN.includes('placeholder');

const QUICK_LOCATIONS = [
  { name: 'Taipei, Taiwan', icon: '🇹🇼' },
  { name: 'Tokyo, Japan', icon: '🇯🇵' },
  { name: 'Kyoto, Japan', icon: '⛩️' },
  { name: 'Seoul, Korea', icon: '🇰🇷' },
  { name: 'Paris, France', icon: '🇫🇷' },
  { name: 'New York, USA', icon: '🇺🇸' },
  { name: 'London, UK', icon: '🇬🇧' },
  { name: 'Bangkok, Thailand', icon: '🇹🇭' },
];

export function LocationPicker({ value, onChange, placeholder }: LocationPickerProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<LocationResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      // Clear pending debounce timer on unmount
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const searchLocations = async (q: string) => {
    if (!q || q.length < 2) {
      setResults([]);
      return;
    }

    if (!hasMapbox) {
      const filtered = QUICK_LOCATIONS
        .filter(l => l.name.toLowerCase().includes(q.toLowerCase()))
        .map((l, i) => ({
          id: `quick-${i}`,
          name: l.name.split(',')[0],
          fullName: l.name,
          lat: 0,
          lng: 0,
        }));
      setResults(filtered);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${MAPBOX_TOKEN}&types=poi,place,address&limit=5&language=zh-TW,en`
      );
      const data = await res.json();
      const locations: LocationResult[] = (data.features || []).map((f: Record<string, unknown>) => ({
        id: f.id as string,
        name: f.text as string,
        fullName: f.place_name as string,
        lat: (f.center as number[])[1],
        lng: (f.center as number[])[0],
      }));
      setResults(locations);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (val: string) => {
    setQuery(val);
    setShowDropdown(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchLocations(val), 300);
  };

  const selectLocation = (loc: LocationResult) => {
    setQuery(loc.fullName);
    onChange(loc.fullName, { lat: loc.lat, lng: loc.lng });
    setShowDropdown(false);
    setResults([]);
  };

  const selectQuickLocation = (name: string) => {
    setQuery(name);
    onChange(name);
    setShowDropdown(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="flex items-center gap-2 px-4 py-3 bg-surface border border-border rounded-lg">
        <svg className="w-4 h-4 text-taupe flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <input
          type="text"
          placeholder={placeholder || '搜尋地點、餐廳、景點⋯⋯'}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          className="w-full bg-transparent text-sm text-ink placeholder:text-taupe/40 focus:outline-none font-noto"
        />
        {loading && (
          <div className="w-4 h-4 border-2 border-taupe/30 border-t-taupe rounded-full animate-spin" />
        )}
        {query && (
          <button onClick={() => { setQuery(''); onChange(''); setResults([]); }} className="text-taupe">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-cream border border-border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {/* Search Results */}
          {results.length > 0 && (
            <div className="p-1">
              {results.map(loc => (
                <button
                  key={loc.id}
                  onClick={() => selectLocation(loc)}
                  className="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-lg hover:bg-surface transition-colors text-left"
                >
                  <svg className="w-4 h-4 text-taupe mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <div className="min-w-0">
                    <p className="text-sm text-ink font-inter truncate">{loc.name}</p>
                    <p className="text-[10px] text-taupe font-noto truncate">{loc.fullName}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Quick Picks */}
          {results.length === 0 && query.length < 2 && (
            <div className="p-2">
              <p className="text-[9px] text-taupe tracking-widest uppercase font-inter px-2 pb-2">
                常用地點
              </p>
              <div className="grid grid-cols-2 gap-1">
                {QUICK_LOCATIONS.map(loc => (
                  <button
                    key={loc.name}
                    onClick={() => selectQuickLocation(loc.name)}
                    className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg hover:bg-surface transition-colors text-left"
                  >
                    <span className="text-sm">{loc.icon}</span>
                    <span className="text-[11px] text-ink font-inter truncate">{loc.name.split(',')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {results.length === 0 && query.length >= 2 && !loading && (
            <div className="p-4 text-center">
              <p className="text-xs text-taupe font-noto">找不到相關地點</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
