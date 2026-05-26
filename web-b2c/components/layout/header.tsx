"use client";

import Link from "next/link";
import { Search, ShoppingBag, Menu, X } from "lucide-react";
import { useCart } from "@/components/store/cart-provider";
import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { ButterflyLogo } from "@/components/butterfly-logo";
import { CartDrawer } from "@/components/store/cart-drawer";

const navLinks = [
  { href: "/products", label: "Shop All" },
  { href: "/products?category=Fashion", label: "Fashion" },
  { href: "/products?category=Collectibles", label: "Collectibles" },
  { href: "/products?category=Accessories", label: "Accessories" },
  { href: "/blog", label: "Guides" },
];

export function Header() {
  const router = useRouter();
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQ.trim();

    if (!query) return;

    router.push(`/products?search=${encodeURIComponent(query)}`);
    setSearchOpen(false);
    setSearchQ("");
  };

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
          <button
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Search"
            className="p-1 text-gray-700 hover:text-[#C41E3A] transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>

          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Cart"
            className="relative flex items-center gap-1.5 text-gray-900 hover:text-[#C41E3A] transition-colors duration-150"
          >
            <ShoppingBag className="w-5 h-5" />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2.5 bg-[#C41E3A] text-white text-[10px] font-bold rounded-full min-w-4.5 h-4.5 flex items-center justify-center px-1 leading-none">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </button>

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

      <CartDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div
        className={clsx(
          "border-t border-gray-100 bg-white overflow-hidden transition-all duration-200",
          searchOpen ? "max-h-20" : "max-h-0"
        )}
      >
        <form onSubmit={handleSearch} className="flex items-center gap-3 px-4 py-3 max-w-6xl mx-auto">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            value={searchQ}
            onChange={(event) => setSearchQ(event.target.value)}
            placeholder="Search products..."
            className="flex-1 text-sm outline-none bg-transparent text-gray-900 placeholder-gray-400"
            autoFocus={searchOpen}
          />
          <button type="submit" className="text-xs font-semibold text-[#C41E3A] hover:underline">
            Go
          </button>
        </form>
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
