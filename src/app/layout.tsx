import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { DesktopFrame } from "@/components/desktop-frame";

export const metadata: Metadata = {
  title: "PASSEPORT — 把生活，寫成風格",
  description: "A fashion lifestyle magazine social app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
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
        <AuthProvider>
          <DesktopFrame>
            {children}
          </DesktopFrame>
        </AuthProvider>
      </body>
    </html>
  );
}
