'use client';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-surface flex items-center justify-center">
        <svg className="w-8 h-8 text-taupe" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
      </div>
      <h2 className="font-playfair italic text-xl tracking-editorial text-ink mb-2">
        SOMETHING WENT WRONG
      </h2>
      <p className="text-sm text-taupe font-noto mb-6">
        出了一點問題，請重新嘗試
      </p>
      <button
        onClick={reset}
        className="px-6 py-2.5 bg-ink text-cream text-xs tracking-editorial uppercase rounded-full font-inter"
      >
        TRY AGAIN
      </button>
    </div>
  );
}
