'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORIES } from '@/lib/types';
import type { Category } from '@/lib/types';
import { LocationPicker } from '@/components/location-picker';
import { AuthGuard } from '@/components/auth-guard';
import { useAuth } from '@/lib/auth-context';
import { uploadImage, createPost, searchOrCreatePlace, linkPostToPlace } from '@/lib/db';
import { useToast } from '@/components/toast';

export default function CreatePostPage() {
  const router = useRouter();
  const { user, isDemo } = useAuth();
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<Category | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const totalSteps = 3;
  const charLimit = 500;

  // Draft save/load
  const DRAFT_KEY = 'passeport_draft';

  const saveDraft = useCallback(() => {
    try {
      const draft = { category, title, subtitle, content, location, tags };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      toast('草稿已儲存');
    } catch {}
  }, [category, title, subtitle, content, location, tags, toast]);

  // Load draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const d = JSON.parse(saved);
        if (d.title || d.content) {
          const cat = CATEGORIES.find(c => c.value === d.category);
          if (cat) setCategory(cat.value);
          if (d.title) setTitle(d.title);
          if (d.subtitle) setSubtitle(d.subtitle);
          if (d.content) setContent(d.content);
          if (d.location) setLocation(d.location);
          if (d.tags) setTags(d.tags);
        }
      }
    } catch {}
  }, []);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (!title && !content) return;
    const timer = setInterval(() => {
      try {
        const draft = { category, title, subtitle, content, location, tags };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch {}
    }, 30000);
    return () => clearInterval(timer);
  }, [category, title, subtitle, content, location, tags]);

  // Cleanup object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles = Array.from(files).slice(0, 10 - images.length);
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setImages(prev => [...prev, ...newFiles]);
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    const tag = tagInput.trim().replace(/^#/, '');
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags(prev => [...prev, tag]);
      setTagInput('');
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return images.length > 0;
      case 2: return title.trim().length > 0 && content.trim().length > 0 && category !== null;
      case 3: return true;
      default: return false;
    }
  };

  const handlePublish = async () => {
    if (!user) return;
    if (isDemo) {
      setError('訪客模式無法發布文章，請先註冊帳號');
      return;
    }

    setPublishing(true);
    setError('');

    try {
      // 1. Upload images to Supabase Storage
      const imageUrls: string[] = [];
      for (const file of images) {
        const url = await uploadImage(file, 'posts', user.id);
        imageUrls.push(url);
      }

      // 2. Create the post
      const newPost = await createPost({
        user_id: user.id,
        title: title.trim(),
        subtitle: subtitle.trim(),
        content: content.trim(),
        category: category!,
        cover_image_url: imageUrls[0],
        additional_images: imageUrls.slice(1),
        location,
        tags,
      });

      // 3. Link place if location was selected with coordinates
      if (location && locationCoords) {
        try {
          const placeId = await searchOrCreatePlace({
            name: location.split(',')[0]?.trim() || location,
            address: location,
            latitude: locationCoords.lat,
            longitude: locationCoords.lng,
          });
          await linkPostToPlace(newPost.id, placeId);
        } catch {
          // Non-critical: don't block publish if place linking fails
          console.warn('Failed to link place');
        }
      }

      // Clear draft on success
      localStorage.removeItem(DRAFT_KEY);
      // Success! Navigate to the new post
      router.push(`/post/${newPost.id}`);
    } catch (err) {
      console.error('Publish error:', err);
      setError(err instanceof Error ? err.message : '發布失敗，請再試一次');
      setPublishing(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-cream">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-cream/95 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between px-5 pt-14 pb-3">
            <button onClick={() => step > 1 ? setStep(step - 1) : router.back()} className="text-ink">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <h1 className="font-playfair italic text-base tracking-editorial text-ink">
              {step === 1 ? 'PHOTOS' : step === 2 ? 'COMPOSE' : 'PREVIEW'}
            </h1>
            <div className="flex items-center gap-2">
              {(title || content) && (
                <button
                  onClick={saveDraft}
                  className="text-[10px] text-taupe font-inter tracking-widest uppercase hover:text-ink transition-colors press-scale"
                >
                  Save Draft
                </button>
              )}
              <span className="text-xs text-taupe font-inter">{step}/{totalSteps}</span>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="h-[2px] bg-surface">
            <div
              className="h-full bg-ink transition-all duration-500"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <div className="px-5 py-6">
          {/* ─── Step 1: Photos ─── */}
          {step === 1 && (
            <div>
              <h2 className="font-playfair italic text-xl tracking-editorial text-ink mb-2">
                UPLOAD PHOTOS
              </h2>
              <p className="text-xs text-taupe font-noto mb-6">選擇照片（最多 10 張，第一張為封面）</p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />

              {imagePreviews.length === 0 ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-[4/3] border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-3 hover:border-taupe transition-colors"
                >
                  <svg className="w-10 h-10 text-taupe" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                  <div className="text-center">
                    <p className="text-sm text-taupe font-inter">點擊上傳照片</p>
                    <p className="text-[10px] text-taupe/50 font-inter mt-1">JPG, PNG, HEIC | Max 10MB each</p>
                  </div>
                </button>
              ) : (
                <div>
                  <div className="grid grid-cols-3 gap-2">
                    {imagePreviews.map((img, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeImage(i)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>
                        {i === 0 && (
                          <span className="absolute bottom-1.5 left-1.5 bg-ink text-cream text-[8px] px-2 py-0.5 rounded-full font-inter">
                            Cover
                          </span>
                        )}
                      </div>
                    ))}
                    {images.length < 10 && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square border-2 border-dashed border-border rounded-lg flex items-center justify-center hover:border-taupe transition-colors"
                      >
                        <svg className="w-6 h-6 text-taupe" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-taupe font-inter mt-3 text-center">
                    {images.length}/10 photos
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ─── Step 2: Content + Category + Location ─── */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Category Selection */}
              <div>
                <label className="text-xs text-taupe font-inter tracking-wide uppercase mb-3 block">
                  Category 分類 *
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      onClick={() => setCategory(cat.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-inter transition-all ${
                        category === cat.value
                          ? 'bg-ink text-cream'
                          : 'bg-surface text-ink hover:bg-border'
                      }`}
                    >
                      {cat.icon} {cat.labelZh}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-xs text-taupe font-inter tracking-wide uppercase mb-2 block">
                  Title *
                </label>
                <input
                  type="text"
                  placeholder="文章標題"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-base font-playfair italic tracking-editorial text-ink placeholder:text-taupe/40 focus:outline-none focus:border-taupe transition-colors"
                  maxLength={60}
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="text-xs text-taupe font-inter tracking-wide uppercase mb-2 block">
                  Subtitle (optional)
                </label>
                <input
                  type="text"
                  placeholder="副標題"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-sm font-noto text-ink placeholder:text-taupe/40 focus:outline-none focus:border-taupe transition-colors"
                  maxLength={100}
                />
              </div>

              {/* Content */}
              <div>
                <label className="text-xs text-taupe font-inter tracking-wide uppercase mb-2 block">
                  Content *
                </label>
                <textarea
                  placeholder="寫下你的故事⋯⋯"
                  value={content}
                  onChange={(e) => {
                    if (e.target.value.length <= charLimit) setContent(e.target.value);
                  }}
                  rows={8}
                  className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-sm font-noto text-ink placeholder:text-taupe/40 focus:outline-none focus:border-taupe transition-colors leading-relaxed resize-none"
                />
                <div className="flex justify-end mt-1">
                  <span className={`text-[10px] font-inter ${content.length > charLimit * 0.9 ? 'text-red-400' : 'text-taupe'}`}>
                    {content.length}/{charLimit}
                  </span>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="text-xs text-taupe font-inter tracking-wide uppercase mb-2 block">
                  Location (optional)
                </label>
                <LocationPicker
                  value={location}
                  onChange={(loc, coords) => {
                    setLocation(loc);
                    if (coords) setLocationCoords(coords);
                  }}
                  placeholder="搜尋餐廳、咖啡廳、景點⋯⋯"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="text-xs text-taupe font-inter tracking-wide uppercase mb-2 block">
                  Tags (optional)
                </label>
                <div className="flex items-center gap-2 px-4 py-3 bg-surface border border-border rounded-lg">
                  <span className="text-taupe text-sm">#</span>
                  <input
                    type="text"
                    placeholder="輸入標籤後按 Enter"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                    className="w-full bg-transparent text-sm text-ink placeholder:text-taupe/40 focus:outline-none font-noto"
                  />
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 text-[11px] text-ink bg-surface px-2.5 py-1 rounded-full font-noto"
                      >
                        #{tag}
                        <button onClick={() => setTags(prev => prev.filter(t => t !== tag))} className="text-taupe hover:text-ink">
                          <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── Step 3: Preview & Publish ─── */}
          {step === 3 && (
            <div>
              <h2 className="font-playfair italic text-xl tracking-editorial text-ink mb-2">
                PREVIEW
              </h2>
              <p className="text-xs text-taupe font-noto mb-6">確認後發布你的文章</p>

              {/* Preview Card */}
              <div className="bg-white rounded-xl overflow-hidden border border-border shadow-sm">
                {imagePreviews[0] && (
                  <div className="aspect-[4/5] relative">
                    <img src={imagePreviews[0]} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span className="bg-cream/90 backdrop-blur-sm text-ink text-[9px] tracking-widest uppercase font-inter px-2.5 py-1 rounded-full">
                        {CATEGORIES.find(c => c.value === category)?.labelZh}
                      </span>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="font-playfair italic text-xl text-white tracking-editorial uppercase leading-tight">
                        {title || 'UNTITLED'}
                      </h3>
                      {subtitle && (
                        <p className="text-white/70 text-xs font-noto mt-1">{subtitle}</p>
                      )}
                    </div>
                  </div>
                )}
                <div className="p-4">
                  <p className="text-xs text-ink/70 font-noto line-clamp-3 leading-relaxed">
                    {content.slice(0, 150)}{content.length > 150 ? '...' : ''}
                  </p>

                  {/* Meta info */}
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    {location && (
                      <span className="text-[10px] text-taupe font-inter flex items-center gap-1">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        {location.split(',')[0]}
                      </span>
                    )}
                    {images.length > 1 && (
                      <span className="text-[10px] text-taupe font-inter">
                        {images.length} photos
                      </span>
                    )}
                  </div>

                  {/* Tags */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {tags.map(tag => (
                        <span key={tag} className="text-[9px] text-taupe bg-surface px-2 py-0.5 rounded-full font-noto">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="mt-4 flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg">
                  <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  <p className="text-red-600 text-xs font-noto leading-relaxed">{error}</p>
                </div>
              )}

              {/* Publish Button */}
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="w-full mt-6 py-4 bg-ink text-cream rounded-xl text-sm font-inter tracking-editorial uppercase hover:bg-ink/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {publishing ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    發布中...
                  </span>
                ) : 'PUBLISH'}
              </button>
            </div>
          )}
        </div>

        {/* Next Button (Steps 1-2) */}
        {step < 3 && (
          <div className="sticky bottom-0 p-5 bg-cream/95 backdrop-blur-md border-t border-border">
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="w-full py-3.5 bg-ink text-cream rounded-xl text-sm font-inter tracking-editorial uppercase disabled:opacity-30 transition-opacity"
            >
              {step === 2 ? 'PREVIEW' : 'NEXT'}
            </button>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
