'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const APP_VERSION = '1.0.0';
const NOTIF_STORAGE_KEY = 'passeport_notification_prefs';

interface NotifPrefs {
  likes: boolean;
  comments: boolean;
  follows: boolean;
  messages: boolean;
}

const DEFAULT_NOTIF_PREFS: NotifPrefs = {
  likes: true,
  comments: true,
  follows: true,
  messages: true,
};

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`w-11 h-6 rounded-full transition-colors relative ${enabled ? 'bg-ink' : 'bg-border'}`}
      aria-pressed={enabled}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-cream shadow transition-transform ${enabled ? 'translate-x-5' : ''}`}
      />
    </button>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="font-playfair italic text-lg tracking-editorial text-ink uppercase mb-1">
      {title}
    </h2>
  );
}

function SettingsRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3.5">
      <div>
        <p className="text-sm font-inter text-ink">{label}</p>
        {description && (
          <p className="text-[11px] text-taupe font-noto">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function ChevronRight() {
  return (
    <svg className="w-4 h-4 text-taupe" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

export default function SettingsPage() {
  const { user, isDemo, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>(DEFAULT_NOTIF_PREFS);

  // Load notification preferences from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(NOTIF_STORAGE_KEY);
      if (saved) {
        setNotifPrefs({ ...DEFAULT_NOTIF_PREFS, ...JSON.parse(saved) });
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  // Persist notification preferences
  const updateNotifPref = (key: keyof NotifPrefs) => {
    setNotifPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // localStorage unavailable
      }
      return next;
    });
  };

  const handleSignOut = async () => {
    if (isDemo) return;
    setSigningOut(true);
    try {
      await signOut();
      router.replace('/auth');
    } catch {
      setSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-cream/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center px-5 pt-14 pb-3 gap-3">
          <button onClick={() => router.back()} className="p-1">
            <svg className="w-5 h-5 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="font-playfair italic text-lg tracking-editorial text-ink">SETTINGS</h1>
        </div>
      </header>

      <div className="px-5 max-w-lg mx-auto">
        {/* Demo badge */}
        {isDemo && (
          <div className="mt-4 px-3 py-2 rounded-xl bg-surface border border-border text-center">
            <span className="text-xs font-inter text-taupe font-noto">
              訪客模式
            </span>
          </div>
        )}

        {/* Theme */}
        <section className="mt-6">
          <SectionHeader title="Appearance" />
          <div className="bg-surface rounded-xl px-4 divide-y divide-border">
            <SettingsRow label="Dark Mode" description="切換深色模式">
              <Toggle enabled={isDark} onToggle={toggleTheme} />
            </SettingsRow>
          </div>
        </section>

        {/* Account */}
        <section className="mt-8">
          <SectionHeader title="Account" />
          <div className="bg-surface rounded-xl px-4 divide-y divide-border">
            <SettingsRow
              label={user?.display_name || user?.username || '---'}
              description={`@${user?.username || '---'}`}
            />
            <Link href={user ? `/profile/${user.username}` : '#'}>
              <SettingsRow label="Edit Profile" description="編輯個人檔案">
                <ChevronRight />
              </SettingsRow>
            </Link>
          </div>
        </section>

        {/* Notifications */}
        <section className="mt-8">
          <SectionHeader title="Notifications" />
          <div className="bg-surface rounded-xl px-4 divide-y divide-border">
            <SettingsRow label="Likes" description="有人喜歡你的文章">
              <Toggle enabled={notifPrefs.likes} onToggle={() => updateNotifPref('likes')} />
            </SettingsRow>
            <SettingsRow label="Comments" description="有人留言你的文章">
              <Toggle enabled={notifPrefs.comments} onToggle={() => updateNotifPref('comments')} />
            </SettingsRow>
            <SettingsRow label="Follows" description="有人追蹤你">
              <Toggle enabled={notifPrefs.follows} onToggle={() => updateNotifPref('follows')} />
            </SettingsRow>
            <SettingsRow label="Messages" description="收到私訊">
              <Toggle enabled={notifPrefs.messages} onToggle={() => updateNotifPref('messages')} />
            </SettingsRow>
          </div>
        </section>

        {/* Language */}
        <section className="mt-8">
          <SectionHeader title="Language" />
          <div className="bg-surface rounded-xl px-4 divide-y divide-border">
            <SettingsRow label="Language" description="語言設定">
              <span className="text-sm text-taupe font-noto">繁體中文</span>
            </SettingsRow>
          </div>
        </section>

        {/* About */}
        <section className="mt-8">
          <SectionHeader title="About" />
          <div className="bg-surface rounded-xl px-4 divide-y divide-border">
            <SettingsRow label="Version" description="應用程式版本">
              <span className="text-sm text-taupe font-inter">{APP_VERSION}</span>
            </SettingsRow>
            <Link href="/privacy">
              <SettingsRow label="Privacy Policy" description="隱私權政策">
                <ChevronRight />
              </SettingsRow>
            </Link>
            <Link href="/terms">
              <SettingsRow label="Terms of Service" description="服務條款">
                <ChevronRight />
              </SettingsRow>
            </Link>
          </div>
        </section>

        {/* Sign Out */}
        <section className="mt-8">
          <button
            onClick={handleSignOut}
            disabled={isDemo || signingOut}
            className={`w-full py-3.5 rounded-xl text-sm font-inter transition-colors ${
              isDemo
                ? 'bg-surface text-taupe cursor-not-allowed'
                : 'bg-ink text-cream active:opacity-80'
            }`}
          >
            {signingOut ? '登出中...' : isDemo ? '訪客模式無法登出' : '登出 Sign Out'}
          </button>
        </section>

        {/* Danger Zone */}
        <section className="mt-8 mb-4">
          <SectionHeader title="Danger Zone" />
          <div className="bg-surface rounded-xl px-4 divide-y divide-border">
            <SettingsRow label="Delete Account" description="永久刪除帳號（即將開放）">
              <button
                disabled
                className="px-3 py-1.5 rounded-lg text-xs font-inter bg-border text-taupe cursor-not-allowed"
              >
                Coming Soon
              </button>
            </SettingsRow>
          </div>
        </section>
      </div>
    </div>
  );
}
