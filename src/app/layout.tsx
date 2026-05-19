import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter, Noto_Sans_TC } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { DesktopFrame } from "@/components/desktop-frame";
import { ToastProvider } from "@/components/toast";

const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const notoSansTC = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-noto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PASSEPORT — 把生活，寫成風格",
  description: "探索時尚生活靈感，分享穿搭日記、旅行筆記、咖啡誌。PASSEPORT 是你的風格社群。",
  manifest: "/manifest.json",
  metadataBase: new URL("https://passeport-gamma.vercel.app"),
  openGraph: {
    title: "PASSEPORT — 把生活，寫成風格",
    description: "探索時尚生活靈感，分享穿搭日記、旅行筆記、咖啡誌。",
    siteName: "PASSEPORT",
    type: "website",
    locale: "zh_TW",
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "PASSEPORT" }],
  },
  twitter: {
    card: "summary",
    title: "PASSEPORT — 把生活，寫成風格",
    description: "探索時尚生活靈感，分享穿搭日記、旅行筆記、咖啡誌。",
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PASSEPORT",
  },
};

export const viewport: Viewport = {
  themeColor: "#F7F4EF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant" className={`${playfair.variable} ${inter.variable} ${notoSansTC.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('passeport_theme');if(t==='dark')document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js')})}`,
          }}
        />
      </head>
      <body className="font-inter bg-cream text-ink antialiased">
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <DesktopFrame>
                {children}
              </DesktopFrame>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
