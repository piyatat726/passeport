'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center px-6">
          <h1 className="font-playfair italic text-3xl text-ink mb-4">
            Oops
          </h1>
          <p className="text-sm text-taupe font-noto mb-6">
            發生了意外錯誤，請重新嘗試
          </p>
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-ink text-cream text-xs tracking-editorial uppercase rounded-full font-inter"
          >
            重新載入
          </button>
        </div>
      </body>
    </html>
  );
}
