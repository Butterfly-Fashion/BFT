import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/store/cart-provider";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Butterfly Fashion Trading — B2B Wholesale",
  description: "Variety & novelty wholesale. B2B order platform by Butterfly Fashion Trading, Toronto.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <CartProvider>{children}</CartProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
