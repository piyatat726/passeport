'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useIsDesktop } from './desktop-frame';

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isDesktop = useIsDesktop();

  const profileHref = user ? `/profile/${user.username}` : '/auth';

  const NAV_ITEMS = [
    { href: '/', label: '首頁', icon: HomeIcon },
    { href: '/discover', label: '探索', icon: SearchIcon },
    { href: '/create', label: '', icon: PlusIcon, isCreate: true },
    { href: '/map', label: '地圖', icon: MapIcon },
    { href: profileHref, label: '我的', icon: ProfileIcon, isProfile: true },
  ];

  return (
    <nav className={`${isDesktop ? 'sticky' : 'fixed left-0 right-0'} bottom-0 z-40 bg-cream/95 backdrop-blur-md border-t border-border`}>
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = item.isProfile
            ? pathname.startsWith('/profile')
            : item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          if (item.isCreate) {
            return (
              <Link key={item.href} href={item.href} className="flex items-center justify-center">
                <div className="w-11 h-11 bg-ink rounded-full flex items-center justify-center shadow-lg">
                  <Icon className="w-5 h-5 text-cream" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 transition-colors ${
                isActive ? 'text-ink' : 'text-taupe'
              }`}
            >
              <Icon className="w-[22px] h-[22px]" />
              <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function MapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z" />
      <path d="M8 2v16M16 6v16" />
    </svg>
  );
}

function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
