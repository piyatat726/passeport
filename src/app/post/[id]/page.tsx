import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import PostDetailClient from './post-detail';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: post } = await supabase
      .from('posts')
      .select('title, subtitle, cover_image_url, location, category')
      .eq('id', params.id)
      .single();

    if (!post) {
      return { title: 'PASSEPORT' };
    }

    const description = post.subtitle || '探索時尚生活靈感 — PASSEPORT';

    const ogImages = post.cover_image_url
      ? [{ url: post.cover_image_url, width: 800, height: 1067, alt: post.title }]
      : [];

    return {
      title: `${post.title} — PASSEPORT`,
      description,
      openGraph: {
        title: post.title,
        description,
        ...(ogImages.length > 0 && { images: ogImages }),
        type: 'article',
        siteName: 'PASSEPORT',
        locale: 'zh_TW',
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description,
        ...(post.cover_image_url && { images: [post.cover_image_url] }),
      },
    };
  } catch {
    return { title: 'PASSEPORT' };
  }
}

export default function PostPage() {
  return <PostDetailClient />;
}
