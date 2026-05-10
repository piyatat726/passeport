'use client';

import { ReactNode, useEffect, useState, createContext, useContext } from 'react';

const DesktopContext = createContext(false);
export const useIsDesktop = () => useContext(DesktopContext);

export function DesktopFrame({ children }: { children: ReactNode }) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!isDesktop) {
    return (
      <DesktopContext.Provider value={false}>
        <div className="min-h-screen">{children}</div>
      </DesktopContext.Provider>
    );
  }

  return (
    <DesktopContext.Provider value={true}>
      <div className="min-h-screen bg-[#e8e4df] flex items-center justify-center p-8">
        <div className="text-center mr-16 max-w-xs">
          <h1 className="font-playfair italic text-5xl tracking-editorial text-ink mb-4">
            PASSEPORT
          </h1>
          <p className="font-noto text-taupe text-lg mb-2">把生活，寫成風格</p>
          <p className="text-sm text-taupe/60 mt-8 font-inter">
            Designed for mobile experience.<br />
            Scan QR code or resize your browser.
          </p>
        </div>

        <div className="relative" id="phone-frame">
          <div className="w-[390px] h-[844px] bg-ink rounded-[55px] p-[12px] shadow-2xl shadow-black/20">
            <div className="w-full h-full bg-cream rounded-[43px] overflow-hidden relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[126px] h-[34px] bg-ink rounded-b-[18px] z-50" />
              <div id="phone-scroll" className="h-full overflow-y-auto overflow-x-hidden relative">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DesktopContext.Provider>
  );
}
