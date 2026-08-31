import Link from 'next/link';
import Image from 'next/image';
import { CityGuide } from '@/lib/city-guides';
import { Post, User } from '@/lib/types';

// Presentational city guide — safe to render from server or client components.

interface CityGuideViewProps {
  guide: CityGuide;
  posts?: (Post & { user?: User })[];
}

export function CityGuideView({ guide, posts = [] }: CityGuideViewProps) {
  return (
    <div className="min-h-screen bg-cream pb-24">
      {/* Hero */}
      <div className="relative h-[46vh] min-h-[320px] overflow-hidden bg-ink">
        {guide.heroImage && (
          <Image
            src={guide.heroImage}
            alt={guide.nameZh}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-80"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />

        <Link
          href="/discover"
          className="absolute top-12 left-4 w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center z-10"
          aria-label="返回探索頁"
        >
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>

        <div className="absolute bottom-0 left-0 right-0 p-6 pb-8">
          <p className="text-white/60 text-[10px] font-inter tracking-[0.3em] uppercase mb-2">
            City Guide · {guide.countryZh}
          </p>
          <h1 className="font-playfair italic text-5xl text-white tracking-editorial leading-none mb-1">
            {guide.nameEn}
          </h1>
          <p className="text-white/90 font-noto text-lg mb-3">{guide.nameZh}</p>
          <p className="text-white/70 font-noto text-sm leading-relaxed max-w-[320px]">
            {guide.tagline}
          </p>
        </div>
      </div>

      {/* Intro */}
      <div className="px-6 pt-8 pb-2">
        {guide.intro.map((para, i) => (
          <p key={i} className="font-noto text-sm text-ink/80 leading-loose mb-3">
            {para}
          </p>
        ))}
      </div>

      {/* Sections */}
      {guide.sections.map(section => (
        <div key={section.titleEn} className="px-6 mt-8">
          <div className="flex items-baseline gap-3 mb-4">
            <h2 className="font-playfair italic text-xl tracking-editorial text-ink">
              {section.titleEn}
            </h2>
            <span className="text-[10px] text-taupe font-inter tracking-widest uppercase">
              {section.title}
            </span>
            <span className="h-px flex-1 bg-border self-center" />
          </div>

          <div className="space-y-4">
            {section.items.map(item => (
              <div key={item.name} className="bg-surface border border-border rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-inter font-medium text-ink">{item.name}</h3>
                      {item.area && (
                        <span className="text-[9px] text-taupe bg-cream border border-border px-2 py-0.5 rounded-full font-noto">
                          {item.area}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink/70 font-noto mt-1.5 leading-relaxed">
                      {item.note}
                    </p>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${item.name} ${guide.nameEn}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 w-8 h-8 rounded-full bg-cream border border-border flex items-center justify-center hover:bg-border transition-colors"
                    title="在地圖上查看"
                    aria-label={`在地圖上查看 ${item.name}`}
                  >
                    <svg className="w-3.5 h-3.5 text-taupe" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Related articles from the magazine */}
      {posts.length > 0 && (
        <div className="px-6 mt-10">
          <div className="flex items-baseline gap-3 mb-4">
            <h2 className="font-playfair italic text-xl tracking-editorial text-ink">
              FROM THE MAGAZINE
            </h2>
            <span className="text-[10px] text-taupe font-inter tracking-widest uppercase">
              相關文章
            </span>
            <span className="h-px flex-1 bg-border self-center" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {posts.map(post => (
              <Link key={post.id} href={`/post/${post.id}`}>
                <div className="group">
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-2">
                    <Image
                      src={post.cover_image_url}
                      alt={post.title}
                      fill
                      sizes="50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="text-xs font-noto text-ink leading-snug line-clamp-2">
                    {post.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* End mark */}
      <div className="mt-12 text-center">
        <div className="flex items-center gap-4 justify-center mb-4">
          <span className="w-12 h-px bg-border" />
          <span className="font-playfair italic text-lg text-taupe">fin.</span>
          <span className="w-12 h-px bg-border" />
        </div>
        <Link
          href="/discover"
          className="inline-block text-[11px] text-taupe font-inter tracking-editorial uppercase underline underline-offset-4 hover:text-ink transition-colors"
        >
          探索更多城市
        </Link>
      </div>
    </div>
  );
}
