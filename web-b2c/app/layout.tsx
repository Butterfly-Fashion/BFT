import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/store/cart-provider";
import { ToastProvider } from "@/components/store/toast-provider";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "World Fan Gear | Canada 2026",
    template: "%s | World Fan Gear",
  },
  description:
    "Premium World Cup 2026 merchandise for Canadian fans. Shop jerseys, hats, scarves, and collectibles. Free shipping over $99. Ships from Toronto.",
  keywords: [
    "World Cup 2026",
    "Canada soccer merchandise",
    "fan gear",
    "jerseys",
    "FIFA 2026 Canada",
  ],
  openGraph: {
    siteName: "World Fan Gear",
    locale: "en_CA",
    type: "website",
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
          </ToastProvider>
        </CartProvider>
      </body>
    </html>
  );
}
