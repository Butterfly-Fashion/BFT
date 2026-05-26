"use client";

import Link from "next/link";
import { Search, ShoppingBag, Menu, X, ChevronDown } from "lucide-react";
import { useCart } from "@/components/store/cart-provider";
import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { ButterflyLogo } from "@/components/butterfly-logo";
import { CartDrawer } from "@/components/store/cart-drawer";

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  sort_order: number;
}

const STATIC_LINKS = [
  { href: "/products", label: "Shop All" },
  { href: "/blog", label: "Guides" },
];

// Top-level categories that get dropdown treatment (in order)
const TOP_LEVEL_SLUGS = ["fashion", "collectibles", "accessories"];

export function Header() {
  const router = useRouter();
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .catch(() => {});
  }, []);

  const topLevel = TOP_LEVEL_SLUGS
    .map((slug) => categories.find((c) => c.slug === slug))
    .filter(Boolean) as Category[];

  const childrenOf = (id: string) =>
    categories.filter((c) => c.parent_id === id).sort((a, b) => a.sort_order - b.sort_order);

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
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-gray-500">
          {/* Category dropdowns */}
          {topLevel.map((cat) => {
            const children = childrenOf(cat.id);
            return (
              <div key={cat.id} className="relative group">
                <Link
                  href={`/products?category=${encodeURIComponent(cat.name)}`}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg hover:text-gray-900 hover:bg-gray-100 transition-colors duration-150"
                >
                  {cat.name}
                  {children.length > 0 && (
                    <ChevronDown className="w-3.5 h-3.5 opacity-40 group-hover:opacity-70 transition-opacity" />
                  )}
                </Link>

                {children.length > 0 && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 pt-1.5 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-150 z-50">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 py-2 min-w-45">
                      <Link
                        href={`/products?category=${encodeURIComponent(cat.name)}`}
                        className="block px-4 py-2 text-xs font-semibold text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        View all {cat.name} →
                      </Link>
                      <div className="my-1 border-t border-gray-100" />
                      {children.map((child) => (
                        <Link
                          key={child.id}
                          href={`/products?category=${encodeURIComponent(child.name)}`}
                          className="block px-4 py-2 text-sm font-medium text-gray-700 hover:text-[#C41E3A] hover:bg-gray-100 transition-colors"
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Guides */}
          <Link
            href="/blog"
            className="px-3 py-2 rounded-lg hover:text-gray-900 hover:bg-gray-100 transition-colors duration-150"
          >
            Guides
          </Link>

          {/* Shop All — rightmost */}
          <Link
            href="/products"
            className="px-3 py-2 rounded-lg hover:text-gray-900 hover:bg-gray-100 transition-colors duration-150"
          >
            Shop All
          </Link>
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

      {/* Search bar */}
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
          menuOpen ? "max-h-screen" : "max-h-0"
        )}
      >
        <nav className="flex flex-col px-4 py-4 gap-1">
          {topLevel.map((cat) => {
            const children = childrenOf(cat.id);
            return (
              <div key={cat.id}>
                <Link
                  href={`/products?category=${encodeURIComponent(cat.name)}`}
                  onClick={() => setMenuOpen(false)}
                  className="block px-2 py-3 text-sm font-semibold text-gray-800 border-b border-gray-50 transition-colors"
                >
                  {cat.name}
                </Link>
                {children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/products?category=${encodeURIComponent(child.name)}`}
                    onClick={() => setMenuOpen(false)}
                    className="block pl-6 pr-2 py-2.5 text-sm text-gray-500 hover:text-gray-800 border-b border-gray-50 transition-colors"
                  >
                    {child.name}
                  </Link>
                ))}
              </div>
            );
          })}
          <Link
            href="/blog"
            onClick={() => setMenuOpen(false)}
            className="px-2 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 border-b border-gray-50 transition-colors"
          >
            Guides
          </Link>
          <Link
            href="/products"
            onClick={() => setMenuOpen(false)}
            className="px-2 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Shop All
          </Link>
        </nav>
      </div>
    </header>
  );
}
