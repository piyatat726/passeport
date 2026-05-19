import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { CATEGORIES } from '@/lib/types';

interface Props {
  params: { id: string };
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const baseUrl = 'https://passeport-gamma.vercel.app';

  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: post } = await supabase
      .from('posts')
      .select('title, subtitle, category, user:users!posts_user_id_fkey(display_name)')
      .eq('id', params.id)
      .single();

    if (!post) {
      return {
        title: 'Post Not Found — PASSEPORT',
      };
    }

    const cat = CATEGORIES.find(c => c.value === post.category);
    const categoryLabel = cat ? `${cat.labelEn} · ${cat.labelZh}` : '';
    // Supabase join returns object for !inner FK, but TS sees array — safely extract
    const userObj = Array.isArray(post.user) ? post.user[0] : post.user;
    const authorName = (userObj as { display_name: string } | null)?.display_name || '';

    const ogParams = new URLSearchParams();
    ogParams.set('title', post.title);
    if (post.subtitle) ogParams.set('subtitle', post.subtitle);
    if (authorName) ogParams.set('author', authorName);
    if (categoryLabel) ogParams.set('category', categoryLabel);

    const ogImageUrl = `${baseUrl}/api/og?${ogParams.toString()}`;
    const postTitle = `${post.title} — PASSEPORT`;
    const description = post.subtitle || `${authorName ? `by ${authorName}` : ''}${categoryLabel ? ` · ${categoryLabel}` : ''} — PASSEPORT`;

    return {
      title: postTitle,
      description,
      openGraph: {
        title: postTitle,
        description,
        siteName: 'PASSEPORT',
        type: 'article',
        locale: 'zh_TW',
        url: `${baseUrl}/post/${params.id}`,
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: post.title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: postTitle,
        description,
        images: [ogImageUrl],
      },
    };
  } catch {
    return {
      title: 'PASSEPORT',
    };
  }
}

export default async function PostLayout({ children, params }: Props) {
  const baseUrl = 'https://passeport-gamma.vercel.app';

  // Build JSON-LD structured data
  let jsonLd = null;
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: post } = await supabase
      .from('posts')
      .select('title, subtitle, content, cover_image_url, created_at, category, user:users!posts_user_id_fkey(display_name)')
      .eq('id', params.id)
      .single();

    if (post) {
      const userObj = Array.isArray(post.user) ? post.user[0] : post.user;
      const authorName = (userObj as { display_name: string } | null)?.display_name || 'PASSEPORT User';
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        description: post.subtitle || post.content?.slice(0, 160),
        image: post.cover_image_url,
        datePublished: post.created_at,
        author: {
          '@type': 'Person',
          name: authorName,
        },
        publisher: {
          '@type': 'Organization',
          name: 'PASSEPORT',
          url: baseUrl,
        },
        mainEntityOfPage: `${baseUrl}/post/${params.id}`,
      };
    }
  } catch {}

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
