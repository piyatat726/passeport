'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { uploadImage, updateUserProfile } from '@/lib/db';

export default function EditProfilePage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [cityInput, setCityInput] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || '');
      setBio(user.bio || '');
      setCities(user.cities || []);
      setAvatarPreview(user.avatar_url || null);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-taupe/30 border-t-ink rounded-full animate-spin" />
      </div>
    );
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  };

  const handleAddCity = () => {
    const trimmed = cityInput.trim();
    if (trimmed && !cities.includes(trimmed)) {
      setCities([...cities, trimmed]);
    }
    setCityInput('');
  };

  const handleCityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCity();
    }
  };

  const handleRemoveCity = (city: string) => {
    setCities(cities.filter(c => c !== city));
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setError(null);

    try {
      let avatarUrl = user.avatar_url;

      if (avatarFile) {
        avatarUrl = await uploadImage(avatarFile, 'avatars', user.id);
      }

      await updateUserProfile(user.id, {
        display_name: displayName.trim(),
        bio: bio.trim(),
        avatar_url: avatarUrl,
        cities,
      });

      await refreshUser();
      router.push(`/profile/${user.username}`);
    } catch (err) {
      console.error('Failed to save profile:', err);
      setError('儲存失敗，請稍後再試');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-cream/90 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => router.back()}
            className="text-xs font-noto text-taupe"
          >
            取消
          </button>
          <h1 className="font-playfair italic text-base text-ink">編輯個人檔案</h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-xs font-noto text-ink font-medium disabled:opacity-50"
          >
            {saving ? '儲存中...' : '儲存'}
          </button>
        </div>
      </div>

      <div className="px-6 py-8 max-w-md mx-auto">
        {/* Error */}
        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-xs text-red-600 font-noto">{error}</p>
          </div>
        )}

        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          <button
            type="button"
            onClick={handleAvatarClick}
            className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-border group"
          >
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="頭像預覽"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-surface flex items-center justify-center">
                <span className="text-2xl font-playfair italic text-taupe">
                  {displayName?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-ink/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <svg className="w-5 h-5 text-cream" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={handleAvatarClick}
            className="mt-3 text-xs text-taupe font-noto"
          >
            更換頭像
          </button>
        </div>

        {/* Display Name */}
        <div className="mb-6">
          <label className="block text-xs font-noto text-taupe mb-2">
            顯示名稱
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value.slice(0, 30))}
            maxLength={30}
            placeholder="你的名字"
            className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm font-inter text-ink placeholder:text-taupe/50 focus:outline-none focus:border-ink/30 transition-colors"
          />
          <p className="mt-1.5 text-right text-[10px] text-taupe font-inter">
            {displayName.length}/30
          </p>
        </div>

        {/* Bio */}
        <div className="mb-6">
          <label className="block text-xs font-noto text-taupe mb-2">
            自我介紹
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 200))}
            maxLength={200}
            rows={4}
            placeholder="寫一些關於你自己..."
            className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm font-inter text-ink placeholder:text-taupe/50 focus:outline-none focus:border-ink/30 transition-colors resize-none"
          />
          <p className="mt-1.5 text-right text-[10px] text-taupe font-inter">
            {bio.length}/200
          </p>
        </div>

        {/* Cities */}
        <div className="mb-6">
          <label className="block text-xs font-noto text-taupe mb-2">
            城市
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              onKeyDown={handleCityKeyDown}
              placeholder="輸入城市後按 Enter"
              className="flex-1 px-4 py-3 bg-surface border border-border rounded-xl text-sm font-inter text-ink placeholder:text-taupe/50 focus:outline-none focus:border-ink/30 transition-colors"
            />
            <button
              type="button"
              onClick={handleAddCity}
              disabled={!cityInput.trim()}
              className="px-4 py-3 bg-ink text-cream text-xs font-noto rounded-xl disabled:opacity-40 transition-opacity"
            >
              新增
            </button>
          </div>
          {cities.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {cities.map(city => (
                <span
                  key={city}
                  className="inline-flex items-center gap-1.5 text-xs text-ink bg-surface border border-border px-3 py-1.5 rounded-full font-inter"
                >
                  {city}
                  <button
                    type="button"
                    onClick={() => handleRemoveCity(city)}
                    className="text-taupe hover:text-ink transition-colors"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
