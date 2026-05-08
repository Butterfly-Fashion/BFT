import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/store/cart-provider";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Butterfly Fashion Trading — B2B Wholesale",
  description: "FIFA World Cup 2026™ merchandise wholesale. B2B order platform by Butterfly Fashion Trading, Toronto.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
