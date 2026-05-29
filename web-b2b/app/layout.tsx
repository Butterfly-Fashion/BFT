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

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Butterfly Fashion Trading — B2B Wholesale",
  description: "Variety & novelty wholesale. B2B order platform by Butterfly Fashion Trading, Toronto.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const categories = await fetchCategories();

  return (
    <html lang="en" className={inter.className}>
      <body>
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
