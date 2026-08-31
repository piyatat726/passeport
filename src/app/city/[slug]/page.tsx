import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { CityGuide, getStaticGuide } from '@/lib/city-guides';
import { CityGuideView } from '@/components/city-guide-view';
import { CityGuideGenerator } from './city-guide-generator';
import { BottomNav } from '@/components/bottom-nav';
import { Post, User } from '@/lib/types';

interface Props {
  params: { slug: string };
}

export const dynamic = 'force-dynamic';

function normSlug(s: string) {
  return decodeURIComponent(s).trim().toLowerCase().replace(/\s+/g, '-').slice(0, 60);
}

// Look up a cached AI-generated guide in Supabase
async function getCachedGuide(slug: string): Promise<CityGuide | null> {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data } = await supabase.from('city_guides').select('data').eq('slug', slug).maybeSingle();
    if (data?.data) return { ...(data.data as CityGuide), slug };
  } catch {
    // Table may not exist yet
  }
  return null;
}

// Magazine posts about this city
async function getRelatedPosts(guide: CityGuide) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data } = await supabase
      .from('posts')
      .select('*, user:users!posts_user_id_fkey(*)')
      .or(`location.ilike.%${guide.nameEn}%,location.ilike.%${guide.nameZh}%`)
      .order('created_at', { ascending: false })
      .limit(6);
    return (data || []) as (Post & { user: User })[];
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = normSlug(params.slug);
  const guide = getStaticGuide(slug) || (await getCachedGuide(slug));

  if (!guide) {
    return { title: '城市指南 — PASSEPORT' };
  }

  const title = `${guide.nameZh}城市指南 — PASSEPORT`;
  const description = `${guide.tagline}。必去景點、咖啡與甜點、風格購物、在地體驗 — PASSEPORT 為你整理${guide.nameZh}最值得去的地方。`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(guide.heroImage && {
        images: [{ url: guide.heroImage, width: 1200, height: 800, alt: guide.nameZh }],
      }),
      type: 'article',
      siteName: 'PASSEPORT',
      locale: 'zh_TW',
    },
  };
}

export default async function CityPage({ params }: Props) {
  const slug = normSlug(params.slug);

  // 1. Flagship editorial guide, or 2. cached AI guide
  const guide = getStaticGuide(slug) || (await getCachedGuide(slug));

  if (guide) {
    const posts = await getRelatedPosts(guide);
    return (
      <>
        <CityGuideView guide={guide} posts={posts} />
        <BottomNav />
      </>
    );
  }

  // 3. Unknown city — generate on the client with a loading state
  return (
    <>
      <CityGuideGenerator city={decodeURIComponent(params.slug).trim()} />
      <BottomNav />
    </>
  );
}
