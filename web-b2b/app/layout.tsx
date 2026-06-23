import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/store/cart-provider";
import { CartOpenProvider } from "@/components/store/cart-open-context";
import { CategoriesProvider } from "@/components/store/categories-provider";
import { ChatWidget } from "@/components/store/chat-widget";
import { fetchCategories } from "@/lib/categories";
import { siteUrl } from "@/lib/env";

const inter = Inter({ subsets: ["latin"], display: "swap" });

const GA_MEASUREMENT_ID = "G-RZV3Q4DEWK";

const DESCRIPTION =
  "Toronto B2B wholesale: winter accessories (gloves, hats, masks), novelty & fidget toys, rolling papers, and trending variety goods. Register for wholesale pricing — no minimum order, ships across Canada & the USA.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Butterfly Fashion Trading — B2B Wholesale Toronto",
    template: "%s — Butterfly Fashion Trading",
  },
  description: DESCRIPTION,
  applicationName: "Butterfly Fashion Trading Wholesale",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Butterfly Fashion Trading",
    title: "Butterfly Fashion Trading — B2B Wholesale Toronto",
    description: DESCRIPTION,
    url: "/",
    locale: "en_CA",
  },
  twitter: {
    card: "summary_large_image",
    title: "Butterfly Fashion Trading — B2B Wholesale Toronto",
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WholesaleStore",
  name: "Butterfly Fashion Trading",
  url: siteUrl(),
  logo: `${siteUrl()}/asset/logo.jpg`,
  email: "orders@butterfly-fashion.ca",
  telephone: "+1-416-785-5999",
  priceRange: "$$",
  knowsLanguage: "en-CA",
  address: {
    "@type": "PostalAddress",
    streetAddress: "178 Bentworth Ave",
    addressLocality: "North York",
    addressRegion: "ON",
    postalCode: "M6A 1P7",
    addressCountry: "CA",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 43.7203,
    longitude: -79.4501,
  },
  areaServed: [
    { "@type": "Country", name: "Canada" },
    { "@type": "Country", name: "United States" },
  ],
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const categories = await fetchCategories();

  return (
    <html lang="en-CA" className={inter.className}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <CategoriesProvider categories={categories}>
          <CartOpenProvider>
            <CartProvider>
              {children}
              <ChatWidget />
            </CartProvider>
          </CartOpenProvider>
        </CategoriesProvider>
        <Analytics />
        <SpeedInsights />
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
      </body>
    </html>
  );
}
