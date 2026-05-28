"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Search, ChevronDown, LogOut, ReceiptText, ShieldCheck, FileText, CalendarClock } from "lucide-react";
import { ButterflyLogo } from "@/components/butterfly-logo";
import type { Profile } from "@/lib/types";
import { CartButton } from "@/components/store/cart-button";
import { logoutAction } from "@/app/actions";

const CATEGORIES = [
  { label: "Car Flags", href: "/products?category=Car+Flags" },
  { label: "Caps", href: "/products?category=Caps" },
  { label: "Bucket Hats", href: "/products?category=Bucket+Hats" },
  { label: "Boxing Gloves", href: "/products?category=Boxing+Gloves" },
  { label: "Accessories", href: "/products?category=Accessories" },
  { label: "All Products", href: "/products" },
];

function CategoryNavLinks() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category");

  return (
    <>
      {CATEGORIES.map((item) => {
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
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold tracking-wide transition-colors ${
              isActive
                ? "bg-blue-100 text-blue-700"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

function CategoryNavFallback() {
  return (
    <>
      {CATEGORIES.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold tracking-wide text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
        >
          {item.label}
        </Link>
      ))}
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
        className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white py-1 pl-1 pr-3 text-sm font-bold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
      >
        <span
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-black text-white"
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
          <div className="absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
            <div className="border-b border-gray-100 px-4 py-3">
              <p className="truncate text-xs font-black text-gray-900">{profile.business_name}</p>
              <p className="truncate text-[11px] text-gray-400">{profile.email}</p>
            </div>
            <div className="py-1">
              <Link
                href="/account/orders"
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                <ReceiptText size={14} className="text-gray-400" />
                My Orders
              </Link>
              <Link
                href="/account/quotes"
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                <FileText size={14} className="text-gray-400" />
                Request a Quote
              </Link>
              {profile.is_b2b_approved && (
                <Link
                  href="/preorders"
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  onClick={() => setOpen(false)}
                >
                  <CalendarClock size={14} className="text-gray-400" />
                  Pre-orders
                </Link>
              )}
              {profile.role === "admin" && (
                <Link
                  href="/admin"
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                  onClick={() => setOpen(false)}
                >
                  <ShieldCheck size={14} />
                  Admin Panel
                </Link>
              )}
            </div>
            <div className="border-t border-gray-100 py-1">
              <form action={logoutAction}>
                <button
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-gray-400 hover:bg-gray-50"
                  type="submit"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function Header({ profile }: { profile: Profile | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white shadow-sm">
      {/* Main header row */}
      <div className="container-shell grid gap-3 py-3 lg:grid-cols-[220px_minmax(280px,1fr)_auto] lg:items-center">
        {/* Logo */}
        <Link className="group flex items-center gap-2.5" href="/">
          <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-gray-100 bg-white transition-opacity group-hover:opacity-80">
            <ButterflyLogo size={36} />
          </span>
          <div>
            <span className="block text-sm font-black leading-tight tracking-tight text-gray-900">Butterfly Fashion</span>
            <span className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400">Trading · Toronto</span>
          </div>
        </Link>

        {/* Search */}
        <form action="/products" className="relative order-3 lg:order-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            className="field pl-9 pr-24 text-sm"
            name="q"
            placeholder="Search products, categories, or SKUs…"
            type="search"
          />
          <button
            className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-7 rounded-lg px-3.5 text-xs font-bold text-white transition-colors hover:opacity-90 active:scale-95"
            style={{ background: "var(--primary)" }}
            type="submit"
          >
            Search
          </button>
        </form>

        {/* Nav actions */}
        <div className="flex items-center justify-end gap-2 text-sm font-bold">
          {profile ? (
            <UserMenu profile={profile} />
          ) : (
            <>
              <Link
                className="rounded-lg px-3 py-2 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-100"
                href="/login"
              >
                Login
              </Link>
              <Link className="btn-primary min-h-9 text-xs" href="/register">
                <span className="hidden sm:inline">Create Account</span>
                <span className="sm:hidden">Register</span>
              </Link>
            </>
          )}
          <CartButton />
        </div>
      </div>

      {/* Category nav */}
      <nav className="border-t border-gray-100">
        <div className="relative">
          <div className="container-shell category-nav-scroll flex items-center gap-1 overflow-x-auto py-2">
            <Suspense fallback={<CategoryNavFallback />}>
              <CategoryNavLinks />
            </Suspense>
            <span className="ml-auto hidden shrink-0 text-[10px] font-semibold text-gray-400 lg:block">
              B2B accounts get custom pricing
            </span>
          </div>
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-linear-to-l from-white to-transparent lg:hidden" />
        </div>
      </nav>
    </header>
  );
}
