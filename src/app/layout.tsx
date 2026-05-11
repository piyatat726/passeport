import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { DesktopFrame } from "@/components/desktop-frame";

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
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body className="font-inter bg-cream text-ink antialiased">
        <ThemeProvider>
          <AuthProvider>
            <DesktopFrame>
              {children}
            </DesktopFrame>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
