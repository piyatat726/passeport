import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-surface flex items-center justify-center">
        <span className="font-playfair italic text-3xl text-taupe">?</span>
      </div>
      <h2 className="font-playfair italic text-xl tracking-editorial text-ink mb-2">
        PAGE NOT FOUND
      </h2>
      <p className="text-sm text-taupe font-noto mb-6">
        找不到此頁面
      </p>
      <Link
        href="/"
        className="px-6 py-2.5 bg-ink text-cream text-xs tracking-editorial uppercase rounded-full font-inter"
      >
        BACK TO HOME
      </Link>
    </div>
  );
}
