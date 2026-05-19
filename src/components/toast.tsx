'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++nextId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2500);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`
              px-5 py-2.5 rounded-full shadow-lg backdrop-blur-md
              text-xs font-inter font-medium tracking-wide
              animate-fade-in-up pointer-events-auto
              ${t.type === 'success' ? 'bg-ink/90 text-cream dark:bg-cream/90 dark:text-ink' : ''}
              ${t.type === 'error' ? 'bg-red-500/90 text-white' : ''}
              ${t.type === 'info' ? 'bg-surface/95 text-ink border border-border' : ''}
            `}
          >
            {t.type === 'success' && <span className="mr-1.5">&#10003;</span>}
            {t.type === 'error' && <span className="mr-1.5">&#10007;</span>}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
