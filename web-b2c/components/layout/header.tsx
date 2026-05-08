"use client";

import Link from "next/link";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useCart } from "@/components/store/cart-provider";
import { useState } from "react";
import clsx from "clsx";
import { ButterflyLogo } from "@/components/butterfly-logo";

const navLinks = [
  { href: "/products", label: "Shop All" },
  { href: "/products?category=Jerseys", label: "Jerseys" },
  { href: "/products?category=Hats", label: "Hats" },
  { href: "/products?category=Accessories", label: "Accessories" },
  { href: "/products?category=Collectibles", label: "Collectibles" },
];

export function Header() {
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="group shrink-0 flex items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-sm border border-gray-200 bg-white">
            <ButterflyLogo size={36} />
          </span>
          <div>
            <span className="block text-sm font-black leading-tight tracking-tight text-gray-900">Butterfly Fashion</span>
            <span className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400">Trading · Toronto</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-500">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="hover:text-gray-900 transition-colors duration-150"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <Link
            href="/cart"
            aria-label="Cart"
            className="relative flex items-center gap-1.5 text-gray-900 hover:text-[#C41E3A] transition-colors duration-150"
          >
            <ShoppingBag className="w-5 h-5" />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2.5 bg-[#C41E3A] text-white text-[10px] font-bold rounded-full min-w-4.5 h-4.5 flex items-center justify-center px-1 leading-none">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </Link>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-1 text-gray-700 hover:text-gray-900 transition-colors"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      <div
        className={clsx(
          "md:hidden border-t border-gray-100 bg-white overflow-hidden transition-all duration-200",
          menuOpen ? "max-h-96" : "max-h-0"
        )}
      >
        <nav className="flex flex-col px-4 py-4 gap-1">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="px-2 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 border-b border-gray-50 last:border-0 transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
