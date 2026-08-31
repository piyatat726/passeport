import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { CityGuide, getStaticGuide } from '@/lib/city-guides';

// Generates (and caches) a magazine-style city guide for any city
// not covered by the hand-written flagship guides.

export const dynamic = 'force-dynamic';

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function normSlug(s: string) {
  return decodeURIComponent(s).trim().toLowerCase().replace(/\s+/g, '-').slice(0, 60);
}

// Minimal shape validation for AI output
function isValidGuide(g: unknown): g is CityGuide {
  if (!g || typeof g !== 'object') return false;
  const guide = g as Record<string, unknown>;
  return (
    typeof guide.nameZh === 'string' &&
    typeof guide.nameEn === 'string' &&
    typeof guide.tagline === 'string' &&
    Array.isArray(guide.intro) &&
    Array.isArray(guide.sections) &&
    (guide.sections as unknown[]).length >= 2 &&
    (guide.sections as { items?: unknown[] }[]).every(
      s => Array.isArray(s.items) && s.items.length > 0
    )
  );
}

async function generateGuide(city: string): Promise<CityGuide | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const prompt = `你是 PASSEPORT 城市誌的主編。PASSEPORT 是一本高質感的生活風格雜誌，語氣自然、有觀點、有畫面感，像一個真的很懂這座城市的朋友在分享，絕不像 AI 或觀光手冊。

請為「${city}」寫一份城市指南，輸出 JSON（繁體中文），格式如下：
{
  "nameZh": "城市中文名",
  "nameEn": "City English Name",
  "countryZh": "國家中文名",
  "tagline": "一句話寫出這座城市的氣質（不超過 20 字，要有觀點）",
  "intro": ["開場第一段（2 句以內）", "開場第二段（2 句以內）"],
  "sections": [
    { "title": "必去景點", "titleEn": "SEE", "items": [{ "name": "地點名", "area": "區域", "note": "為什麼值得去，1-2 句，要有編輯觀點不要流水帳" }] },
    { "title": "咖啡與甜點", "titleEn": "CAFÉ", "items": [...] },
    { "title": "風格購物", "titleEn": "SHOP", "items": [...] },
    { "title": "在地體驗", "titleEn": "LOCAL", "items": [...] }
  ]
}

規則：
- 每個 section 放 3-4 個真實存在的地方，寫真實資訊
- 不要提營業時間、價格這種會過期的資訊
- note 要短、有畫面感、有觀點，避免「不容錯過」「必訪」這種空話
- 如果「${city}」不是一個真實城市，回傳 {"error": "not_a_city"}`;

  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.8,
        },
      }),
      // Generation can take a while
      signal: AbortSignal.timeout(50000),
    });

    if (!res.ok) {
      console.error('Gemini API error:', res.status, await res.text().catch(() => ''));
      return null;
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const parsed = JSON.parse(text);
    if (parsed?.error === 'not_a_city') return null;
    if (!isValidGuide(parsed)) return null;
    return parsed;
  } catch (err) {
    console.error('Guide generation failed:', err);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const city = request.nextUrl.searchParams.get('city');
  if (!city || city.trim().length < 2 || city.length > 60) {
    return NextResponse.json({ error: 'invalid_city' }, { status: 400 });
  }

  const slug = normSlug(city);

  // 1. Flagship hand-written guide
  const staticGuide = getStaticGuide(slug);
  if (staticGuide) {
    return NextResponse.json({ guide: staticGuide, source: 'editorial' });
  }

  const db = supabase();

  // 2. Cached AI guide
  try {
    const { data } = await db.from('city_guides').select('data').eq('slug', slug).maybeSingle();
    if (data?.data) {
      return NextResponse.json({ guide: { ...data.data, slug }, source: 'cache' });
    }
  } catch {
    // Cache table may not exist yet — fall through to generation
  }

  // 3. Generate via Gemini
  const generated = await generateGuide(decodeURIComponent(city).trim());
  if (!generated) {
    return NextResponse.json({ error: 'generation_unavailable' }, { status: 404 });
  }

  const guide: CityGuide = { ...generated, slug };

  // Cache it (best effort — ignore failures)
  try {
    await db.from('city_guides').upsert({ slug, data: guide });
  } catch {}

  return NextResponse.json({ guide, source: 'generated' });
}
