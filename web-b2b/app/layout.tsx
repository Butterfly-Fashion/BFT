import type { Metadata } from "next";
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

const DESCRIPTION =
  "Toronto B2B wholesale: winter accessories (gloves, hats, masks), novelty & fidget toys, rolling papers, and trending variety goods. Register for wholesale pricing — MOQ from one case, ships across Canada & the USA.";

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
  "@type": "Organization",
  name: "Butterfly Fashion Trading",
  url: siteUrl(),
  email: "jameskimkim1@gmail.com",
  telephone: "+1-416-785-5999",
  address: {
    "@type": "PostalAddress",
    streetAddress: "178 Bentworth Ave",
    addressLocality: "North York",
    addressRegion: "ON",
    postalCode: "M6A 1P7",
    addressCountry: "CA",
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const categories = await fetchCategories();

  return (
    <html lang="en" className={inter.className}>
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
      </body>
    </html>
  );
}
