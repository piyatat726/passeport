import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.GOOGLE_PLACES_KEY || '';
const BASE_URL = 'https://places.googleapis.com/v1';

// ═══ Field masks ═══

const SEARCH_FIELDS = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.rating',
  'places.userRatingCount',
  'places.photos',
  'places.currentOpeningHours',
  'places.internationalPhoneNumber',
  'places.googleMapsUri',
  'places.websiteUri',
  'places.location',
  'places.types',
  'places.priceLevel',
  'places.editorialSummary',
  'places.reviews',
].join(',');

const DETAIL_FIELDS = [
  'id',
  'displayName',
  'formattedAddress',
  'rating',
  'userRatingCount',
  'photos',
  'currentOpeningHours',
  'internationalPhoneNumber',
  'googleMapsUri',
  'websiteUri',
  'location',
  'types',
  'priceLevel',
  'editorialSummary',
  'reviews',
].join(',');

// ═══ Handlers ═══

async function handleSearch(params: {
  query: string;
  lat?: number;
  lng?: number;
  maxResults?: number;
}) {
  const body: Record<string, unknown> = {
    textQuery: params.query,
    languageCode: 'zh-TW',
    maxResultCount: params.maxResults || 1,
  };

  if (params.lat !== undefined && params.lng !== undefined) {
    body.locationBias = {
      circle: {
        center: { latitude: params.lat, longitude: params.lng },
        radius: 5000.0,
      },
    };
  }

  const res = await fetch(`${BASE_URL}/places:searchText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': SEARCH_FIELDS,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: 'Google Places search failed' },
      { status: res.status }
    );
  }

  const data = await res.json();
  const places = data.places || [];
  return NextResponse.json({ place: places[0] || null, places });
}

async function handleDetails(params: { googlePlaceId: string }) {
  const res = await fetch(`${BASE_URL}/places/${params.googlePlaceId}`, {
    headers: {
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': DETAIL_FIELDS,
    },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: 'Google Places details failed' },
      { status: res.status }
    );
  }

  const place = await res.json();
  return NextResponse.json({ place });
}

async function handleNearby(params: {
  lat: number;
  lng: number;
  type?: string;
  radius?: number;
}) {
  const body: Record<string, unknown> = {
    locationRestriction: {
      circle: {
        center: { latitude: params.lat, longitude: params.lng },
        radius: params.radius ?? 1000,
      },
    },
    languageCode: 'zh-TW',
    maxResultCount: 10,
  };

  if (params.type) {
    body.includedTypes = [params.type];
  }

  const res = await fetch(`${BASE_URL}/places:searchNearby`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': SEARCH_FIELDS,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: 'Google Places nearby search failed' },
      { status: res.status }
    );
  }

  const data = await res.json();
  const places = data.places || [];
  return NextResponse.json({ places });
}

// ═══ POST route ═══

export async function POST(request: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json(
      { error: 'Google Places API key not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'search':
        return handleSearch(params);
      case 'details':
        return handleDetails(params);
      case 'nearby':
        return handleNearby(params);
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
