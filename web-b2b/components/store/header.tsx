"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Search, ChevronDown, LogOut, ReceiptText, ShieldCheck, FileText, CalendarClock, ShoppingCart } from "lucide-react";
import { ButterflyLogo } from "@/components/butterfly-logo";
import type { Profile } from "@/lib/types";
import type { Category } from "@/lib/categories";
import { CartButton } from "@/components/store/cart-button";
import { logoutAction } from "@/app/actions";

const DEFAULT_CATEGORIES = [
  { label: "Car Flags", href: "/products?category=Car+Flags" },
  { label: "Caps", href: "/products?category=Caps" },
  { label: "Bucket Hats", href: "/products?category=Bucket+Hats" },
  { label: "Boxing Gloves", href: "/products?category=Boxing+Gloves" },
  { label: "Accessories", href: "/products?category=Accessories" },
  { label: "All products", href: "/products" },
];

function buildNavItems(categories?: Category[]) {
  if (!categories?.length) return DEFAULT_CATEGORIES;
  return [
    ...categories.map((c) => ({
      label: c.name,
      href: `/products?category=${encodeURIComponent(c.name)}`,
    })),
    { label: "All products", href: "/products" },
  ];
}

function CategoryNavLinks({ categories }: { categories?: Category[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category");
  const items = buildNavItems(categories);

  return (
    <>
      {items.map((item) => {
        const itemCategory = item.href.includes("?")
          ? new URLSearchParams(item.href.split("?")[1]).get("category")
          : null;
        const isActive = itemCategory
          ? currentCategory === itemCategory
          : pathname === "/products" && !currentCategory;

        return (
          <Link
            key={item.label}
            href={item.href}
            className="whitespace-nowrap px-1 py-1.5 text-sm font-semibold transition-colors"
            style={isActive ? { color: "var(--primary)", borderBottom: "2px solid var(--primary)" } : { color: "#6B7280", borderBottom: "2px solid transparent" }}
          >
            {item.label}
          </Link>
        );
      })}
      <Link
        href="/about"
        className="whitespace-nowrap px-1 py-1.5 text-sm font-semibold transition-colors"
        style={pathname === "/about" ? { color: "var(--primary)", borderBottom: "2px solid var(--primary)" } : { color: "#6B7280", borderBottom: "2px solid transparent" }}
      >
        About
      </Link>
    </>
  );
}

function CategoryNavFallback({ categories }: { categories?: Category[] }) {
  const items = buildNavItems(categories);
  return (
    <>
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="whitespace-nowrap px-1 py-1.5 text-sm font-semibold text-gray-500 transition-colors hover:text-gray-900"
          style={{ borderBottom: "2px solid transparent" }}
        >
          {item.label}
        </Link>
      ))}
      <Link href="/about" className="whitespace-nowrap px-1 py-1.5 text-sm font-semibold text-gray-500 transition-colors hover:text-gray-900" style={{ borderBottom: "2px solid transparent" }}>
        About
      </Link>
    </>
  );
}

function UserMenu({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false);
  const initial = (profile.business_name || profile.contact_name || "?")[0].toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white py-1.5 pl-1.5 pr-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
      >
        <span
          className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-[11px] font-black text-white"
          style={{ background: "var(--primary)" }}
        >
          {initial}
        </span>
        <span className="hidden max-w-28 truncate text-xs sm:block">
          {profile.business_name || profile.contact_name}
        </span>
        <ChevronDown size={12} className={`shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1.5 w-56 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
            <div className="border-b border-gray-100 px-4 py-3">
              <p className="truncate text-xs font-bold text-gray-900">{profile.business_name || profile.contact_name}</p>
              <p className="truncate text-xs text-gray-400">{profile.email}</p>
            </div>
            <div className="py-1">
              <Link href="/account/orders" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setOpen(false)}>
                <ReceiptText size={14} className="text-gray-400" /> My Orders
              </Link>
              <Link href="/account/quotes" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setOpen(false)}>
                <FileText size={14} className="text-gray-400" /> Request a Quote
              </Link>
              {profile.is_b2b_approved && (
                <Link href="/preorders" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setOpen(false)}>
                  <CalendarClock size={14} className="text-gray-400" /> Pre-orders
                </Link>
              )}
              {profile.role === "admin" && (
                <Link href="/admin" className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50" onClick={() => setOpen(false)}>
                  <ShieldCheck size={14} /> Admin Panel
                </Link>
              )}
            </div>
            <div className="border-t border-gray-100 py-1">
              <form action={logoutAction}>
                <button className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-400 hover:bg-gray-50" type="submit">
                  <LogOut size={14} /> Sign out
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function Header({ profile, categories }: { profile: Profile | null; categories?: Category[] }) {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      {/* Main header */}
      <div className="container-shell grid gap-3 py-3 lg:grid-cols-[200px_minmax(0,1fr)_auto] lg:items-center">
        {/* Logo */}
        <Link className="group flex items-center gap-2.5" href="/">
          <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg border border-gray-100 bg-white">
            <ButterflyLogo size={32} />
          </span>
          <div className="leading-tight">
            <span className="block text-sm font-black tracking-tight text-gray-900">Butterfly Fashion</span>
            <span className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400">Wholesale · Toronto</span>
          </div>
        </Link>

        {/* Search */}
        <form action="/products" className="relative order-3 lg:order-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            className="field pl-9 pr-20 text-sm"
            name="q"
            placeholder="Search products, SKU, country…"
            type="search"
          />
          <button
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md px-3 py-1.5 text-xs font-semibold text-white"
            style={{ background: "var(--primary)" }}
            type="submit"
          >
            Search
          </button>
        </form>

        {/* Right actions */}
        <div className="flex items-center justify-end gap-2">
          {profile ? (
            <>
              {profile.is_b2b_approved && (
                <Link href="/account/quotes" className="hidden items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 sm:flex">
                  <FileText size={13} /> Quote
                </Link>
              )}
              <UserMenu profile={profile} />
            </>
          ) : (
            <>
              <Link className="text-sm font-semibold text-gray-600 transition-colors hover:text-gray-900" href="/login">
                Sign in
              </Link>
              <Link className="btn-primary min-h-8 px-4 text-sm" href="/register">
                Create account
              </Link>
            </>
          )}
          <CartButton />
        </div>
      </div>

      {/* Category nav */}
      <div className="border-t border-gray-100">
        <div className="container-shell">
          <div className="category-nav-scroll flex items-center gap-5 overflow-x-auto">
            <Suspense fallback={<CategoryNavFallback categories={categories} />}>
              <CategoryNavLinks categories={categories} />
            </Suspense>
          </div>
        </div>
      </div>
    </header>
  );
}
