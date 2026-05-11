import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.GOOGLE_PLACES_KEY || '';
const BASE_URL = 'https://places.googleapis.com/v1';

/**
 * GET /api/places/photo?name=...&maxWidth=...
 *
 * Proxies a Google Places photo so the API key stays server-side.
 * Returns the image bytes with the correct Content-Type.
 */
export async function GET(request: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json(
      { error: 'Google Places API key not configured' },
      { status: 500 }
    );
  }

  const { searchParams } = request.nextUrl;
  const photoName = searchParams.get('name');
  const maxWidth = searchParams.get('maxWidth') || '800';

  if (!photoName) {
    return NextResponse.json(
      { error: 'Missing "name" query parameter' },
      { status: 400 }
    );
  }

  try {
    const googleUrl = `${BASE_URL}/${photoName}/media?maxWidthPx=${maxWidth}&key=${API_KEY}`;

    const res = await fetch(googleUrl, { redirect: 'follow' });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch photo from Google Places' },
        { status: res.status }
      );
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const imageBuffer = await res.arrayBuffer();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to proxy photo' },
      { status: 500 }
    );
  }
}
