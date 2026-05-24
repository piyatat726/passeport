'use client';

import { useState, useEffect } from 'react';

const DISMISSED_KEY = 'passeport_push_dismissed';

export function PushNotificationPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show if:
    // 1. Browser supports notifications
    // 2. Permission not already granted or denied
    // 3. User hasn't dismissed this prompt recently
    if (typeof window === 'undefined') return;
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
    if (Notification.permission !== 'default') return;

    try {
      const dismissed = localStorage.getItem(DISMISSED_KEY);
      if (dismissed) {
        const dismissedAt = parseInt(dismissed, 10);
        // Don't show again for 7 days after dismissal
        if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
      }
    } catch {}

    // Show after a delay so it doesn't feel aggressive
    const timer = setTimeout(() => setShow(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleEnable = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        // Register for push
        const registration = await navigator.serviceWorker.ready;
        await registration.pushManager.subscribe({
          userVisibleOnly: true,
          // In production, replace with your VAPID public key
          applicationServerKey: undefined,
        });
      }
    } catch (err) {
      console.error('Push subscription failed:', err);
    }
    setShow(false);
  };

  const handleDismiss = () => {
    try { localStorage.setItem(DISMISSED_KEY, String(Date.now())); } catch {}
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-lg mx-auto animate-slide-up">
      <div className="bg-surface border border-border rounded-2xl p-4 shadow-lg flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-inter font-medium text-ink">開啟推播通知</p>
          <p className="text-xs text-taupe font-noto mt-0.5">有人按讚或留言時即時通知你</p>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleEnable}
              className="px-4 py-1.5 bg-ink text-cream text-[11px] font-inter tracking-editorial uppercase rounded-full"
            >
              開啟
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-1.5 text-taupe text-[11px] font-inter hover:text-ink transition-colors"
            >
              稍後再說
            </button>
          </div>
        </div>
        <button onClick={handleDismiss} className="p-1 text-taupe hover:text-ink transition-colors flex-shrink-0">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
