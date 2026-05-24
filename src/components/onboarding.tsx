'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

const ONBOARDING_KEY = 'passeport_onboarded';

const STEPS = [
  {
    title: 'PASSEPORT',
    subtitle: '把生活，寫成風格',
    description: '探索時尚、旅行、城市文化，記錄你的生活美學。',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=800&fit=crop',
  },
  {
    title: 'DISCOVER',
    subtitle: '發現靈感',
    description: '瀏覽來自世界各地的穿搭日記、咖啡廳指南、旅行筆記。',
    image: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&h=800&fit=crop',
  },
  {
    title: 'CREATE',
    subtitle: '分享你的風格',
    description: '用 Markdown 撰寫文章，上傳照片，標記地點，建立你的風格日誌。',
    image: 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=600&h=800&fit=crop',
  },
  {
    title: 'CONNECT',
    subtitle: '找到你的社群',
    description: '追蹤喜歡的創作者，收藏文章，參與討論，在地圖上探索推薦地點。',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefda?w=600&h=800&fit=crop',
  },
];

export function OnboardingOverlay({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Fade in
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      // Complete onboarding
      try { localStorage.setItem(ONBOARDING_KEY, 'true'); } catch {}
      setVisible(false);
      setTimeout(onComplete, 300);
    }
  };

  const handleSkip = () => {
    try { localStorage.setItem(ONBOARDING_KEY, 'true'); } catch {}
    setVisible(false);
    setTimeout(onComplete, 300);
  };

  const current = STEPS[step];

  return (
    <div className={`fixed inset-0 z-[200] bg-black transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src={current.image}
          alt=""
          fill
          className="object-cover transition-opacity duration-500"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full justify-end pb-16 px-8">
        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="absolute top-14 right-6 text-white/60 text-xs font-inter tracking-widest uppercase hover:text-white transition-colors"
        >
          SKIP
        </button>

        {/* Step indicators */}
        <div className="flex gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-[3px] rounded-full transition-all duration-300 ${
                i === step ? 'w-8 bg-white' : 'w-3 bg-white/30'
              }`}
            />
          ))}
        </div>

        {/* Text */}
        <h2 className="font-playfair italic text-4xl text-white tracking-editorial mb-2">
          {current.title}
        </h2>
        <p className="font-playfair text-lg text-white/80 mb-3">
          {current.subtitle}
        </p>
        <p className="font-noto text-sm text-white/60 leading-relaxed mb-10 max-w-[280px]">
          {current.description}
        </p>

        {/* Button */}
        <button
          onClick={handleNext}
          className="w-full py-4 bg-white text-black rounded-xl text-sm font-inter font-medium tracking-editorial uppercase hover:bg-white/90 transition-colors"
        >
          {step < STEPS.length - 1 ? 'NEXT' : 'START EXPLORING'}
        </button>
      </div>
    </div>
  );
}

export function useOnboarding(): [boolean, () => void] {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const done = localStorage.getItem(ONBOARDING_KEY);
      if (!done) setShow(true);
    } catch {}
  }, []);

  const complete = () => setShow(false);

  return [show, complete];
}
