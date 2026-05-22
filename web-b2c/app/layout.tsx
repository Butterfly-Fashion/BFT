import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { GA_ID } from "@/lib/gtag";
import "./globals.css";
import { CartProvider } from "@/components/store/cart-provider";
import { ToastProvider } from "@/components/store/toast-provider";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { jsonLd, organizationJsonLd, SITE_URL, websiteJsonLd } from "@/lib/seo";
import ChatWidget from "@/components/support/chat-widget";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "World Fan Gear | Canada 2026",
    template: "%s | World Fan Gear",
  },
  description:
    "Shop World Cup 2026 fan gear for Canadian fans — caps, bucket hats, car flags, and souvenirs shipped from Toronto across Canada. FIFA 2026 merchandise for every team.",
  keywords: [
    "World Cup 2026",
    "FIFA 2026 merchandise",
    "World Cup 2026 fan gear Canada",
    "soccer fan gear Canada",
    "FIFA 2026 Canada",
    "World Cup 2026 caps",
    "World Cup 2026 car flags",
    "Canada 2026 fan merchandise",
  ],
  openGraph: {
    title: "World Fan Gear | Canada 2026",
    description:
      "Shop Canada 2026-inspired soccer fan gear shipping across Canada from Toronto.",
    url: SITE_URL,
    siteName: "World Fan Gear",
    locale: "en_CA",
    type: "website",
    images: [{ url: "/asset/hero-banner.jpg", width: 1717, height: 916 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "World Fan Gear | Canada 2026",
    description:
      "Shop Canada 2026-inspired soccer fan gear shipping across Canada from Toronto.",
    images: ["/asset/hero-banner.jpg"],
  },
  alternates: {
    canonical: "/",
  },
  verification: {
    google: "o9qYb5c02aV4Tg5QzIj3Dnr2kZuJjER2iCVWb2b8PqQ",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-CA" className={inter.variable}>
      <body className="bg-[#FAFAFA] text-gray-900 antialiased min-h-screen flex flex-col">
        <AnnouncementBar />
        <CartProvider>
          <ToastProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <ChatWidget />
          </ToastProvider>
        </CartProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(organizationJsonLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(websiteJsonLd()) }}
        />
        <Analytics />
        <SpeedInsights />
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        />
        <Script
          id="gtag-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { send_page_view: true });
            `,
          }}
        />
      </body>
    </html>
  );
}
