import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "نظرة - شاهد أي مكان، الآن",
  description: "تطبيق نظرة - اطلب فيديو مباشر من أي موقع في السعودية",
  keywords: ["نظرة", "فيديو", "مباشر", "السعودية", "موقع"],
  authors: [{ name: "Nazrah Team" }],
  icons: {
    icon: "/nazrah-logo.png",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#059669",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="antialiased bg-background text-foreground font-[Tajawal]">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
