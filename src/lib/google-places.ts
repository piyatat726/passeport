// ═══ Types ═══

export interface GooglePlacePhoto {
  name: string;
  widthPx: number;
  heightPx: number;
  authorAttributions: { displayName: string; uri: string }[];
}

export interface GooglePlaceReview {
  name: string;
  relativePublishTimeDescription: string;
  rating: number;
  text: { text: string; languageCode: string };
  authorAttribution: { displayName: string; photoUri: string; uri: string };
}

export interface GooglePlaceOpeningHours {
  openNow: boolean;
  weekdayDescriptions: string[];
  periods: {
    open: { day: number; hour: number; minute: number };
    close: { day: number; hour: number; minute: number };
  }[];
}

export interface GooglePlace {
  id: string;
  displayName: { text: string; languageCode: string };
  formattedAddress: string;
  rating: number;
  userRatingCount: number;
  photos: GooglePlacePhoto[];
  currentOpeningHours: GooglePlaceOpeningHours;
  internationalPhoneNumber: string;
  googleMapsUri: string;
  websiteUri: string;
  location: { latitude: number; longitude: number };
  types: string[];
  priceLevel: string;
  editorialSummary: { text: string; languageCode: string };
  reviews: GooglePlaceReview[];
}

// ═══ Simple in-memory cache ═══

const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache(key: string, data: unknown) {
  cache.set(key, { data, ts: Date.now() });
}

// ═══ API Functions (call server-side proxy) ═══

/**
 * Text search for a place. Returns the top matching result.
 */
export async function searchPlace(
  query: string,
  lat?: number,
  lng?: number
): Promise<GooglePlace | null> {
  const cacheKey = `search:${query}:${lat}:${lng}`;
  const cached = getCached<GooglePlace>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch('/api/places', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'search', query, lat, lng }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const place = data.place || null;
    if (place) setCache(cacheKey, place);
    return place;
  } catch {
    return null;
  }
}

/**
 * Text search for places. Returns multiple matching results.
 */
export async function searchPlaces(
  query: string,
  lat?: number,
  lng?: number,
  maxResults = 5
): Promise<GooglePlace[]> {
  const cacheKey = `searchMulti:${query}:${lat?.toFixed(2)}:${lng?.toFixed(2)}:${maxResults}`;
  const cached = getCached<GooglePlace[]>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch('/api/places', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'search', query, lat, lng, maxResults }),
    });

    if (!res.ok) return [];

    const data = await res.json();
    const places = data.places || [];
    if (places.length) setCache(cacheKey, places);
    return places;
  } catch {
    return [];
  }
}

/**
 * Get full details for a place by its Google Place ID.
 */
export async function getPlaceDetails(
  googlePlaceId: string
): Promise<GooglePlace | null> {
  const cacheKey = `details:${googlePlaceId}`;
  const cached = getCached<GooglePlace>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch('/api/places', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'details', googlePlaceId }),
    });

    if (!res.ok) return null;

    const place = (await res.json()).place || null;
    if (place) setCache(cacheKey, place);
    return place;
  } catch {
    return null;
  }
}

/**
 * Returns a proxied photo URL for a Google Places photo reference.
 * The URL points to /api/places/photo which fetches the image server-side,
 * so the API key is never exposed to the client.
 */
export function getPlacePhotoUrl(photoName: string, maxWidth = 800): string {
  return `/api/places/photo?name=${encodeURIComponent(photoName)}&maxWidth=${maxWidth}`;
}

/**
 * Search for places nearby a given location.
 */
export async function searchNearbyPlaces(
  lat: number,
  lng: number,
  type?: string,
  radius = 1000
): Promise<GooglePlace[]> {
  const cacheKey = `nearby:${lat}:${lng}:${type}:${radius}`;
  const cached = getCached<GooglePlace[]>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch('/api/places', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'nearby', lat, lng, type, radius }),
    });

    if (!res.ok) return [];

    const data = await res.json();
    const places = data.places || [];
    setCache(cacheKey, places);
    return places;
  } catch {
    return [];
  }
}

// ═══ Helpers ═══

/** Google type string to Chinese label */
const TYPE_MAP: Record<string, string> = {
  restaurant: '餐廳',
  cafe: '咖啡廳',
  museum: '博物館',
  tourist_attraction: '景點',
  bar: '酒吧',
  bakery: '烘焙',
  park: '公園',
  art_gallery: '藝廊',
  book_store: '書店',
  clothing_store: '服飾店',
  shopping_mall: '商場',
  spa: 'SPA',
  night_club: '夜店',
  lodging: '住宿',
  library: '圖書館',
  movie_theater: '電影院',
  gym: '健身房',
  hair_care: '美髮',
  beauty_salon: '美容',
  grocery_or_supermarket: '超市',
  convenience_store: '便利商店',
  pharmacy: '藥局',
  hospital: '醫院',
  temple: '寺廟',
  church: '教堂',
  school: '學校',
  university: '大學',
  subway_station: '捷運站',
  train_station: '火車站',
  bus_station: '公車站',
  airport: '機場',
  parking: '停車場',
  gas_station: '加油站',
  meal_delivery: '外送',
  meal_takeaway: '外帶',
  food: '美食',
  point_of_interest: '景點',
  establishment: '商家',
  store: '商店',
  japanese_restaurant: '日式料理',
  chinese_restaurant: '中式料理',
  italian_restaurant: '義式料理',
  thai_restaurant: '泰式料理',
  korean_restaurant: '韓式料理',
  indian_restaurant: '印度料理',
  french_restaurant: '法式料理',
  seafood_restaurant: '海鮮料理',
  steak_house: '牛排館',
  ramen_restaurant: '拉麵店',
  sushi_restaurant: '壽司店',
  pizza_restaurant: '比薩店',
  brunch_restaurant: '早午餐',
  ice_cream_shop: '冰品店',
  coffee_shop: '咖啡店',
  tea_house: '茶館',
  dessert_shop: '甜點店',
  vegetarian_restaurant: '素食餐廳',
  hamburger_restaurant: '漢堡店',
  sandwich_shop: '三明治店',
};

/** Translate Google types array to Chinese tags. Returns up to maxTags unique labels. */
export function translateTypes(types: string[], maxTags = 3): string[] {
  if (!types) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const t of types) {
    const label = TYPE_MAP[t];
    if (label && !seen.has(label)) {
      seen.add(label);
      result.push(label);
      if (result.length >= maxTags) break;
    }
  }
  return result;
}

/** Price level enum to dollar signs */
export function formatPriceLevel(priceLevel?: string): string | null {
  switch (priceLevel) {
    case 'PRICE_LEVEL_FREE': return '免費';
    case 'PRICE_LEVEL_INEXPENSIVE': return '$';
    case 'PRICE_LEVEL_MODERATE': return '$$';
    case 'PRICE_LEVEL_EXPENSIVE': return '$$$';
    case 'PRICE_LEVEL_VERY_EXPENSIVE': return '$$$$';
    default: return null;
  }
}
