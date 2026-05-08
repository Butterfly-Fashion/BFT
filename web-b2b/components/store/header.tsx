"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Search, ChevronRight, ChevronDown, LogOut, ReceiptText, ShieldCheck, FileText } from "lucide-react";
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
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-bold tracking-wide transition-colors ${
              isActive
                ? "bg-slate-200 text-slate-950 ring-1 ring-slate-300"
                : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
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
          className="whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-bold tracking-wide text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900"
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
        className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
      >
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-(--primary) text-[11px] font-black text-white">
          {initial}
        </span>
        <span className="hidden max-w-28 truncate text-xs sm:block">
          {profile.business_name || profile.contact_name}
        </span>
        <ChevronDown size={12} className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="truncate text-xs font-black text-slate-900">{profile.business_name}</p>
              <p className="truncate text-[10px] text-slate-400">{profile.email}</p>
            </div>
            <div className="py-1">
              <Link
                href="/account/orders"
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => setOpen(false)}
              >
                <ReceiptText size={14} className="text-slate-400" />
                My Orders
              </Link>
              <Link
                href="/account/quotes"
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => setOpen(false)}
              >
                <FileText size={14} className="text-slate-400" />
                Request a Quote
              </Link>
              {profile.role === "admin" && (
                <Link
                  href="/admin"
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-(--accent) hover:bg-red-50"
                  onClick={() => setOpen(false)}
                >
                  <ShieldCheck size={14} />
                  Admin Panel
                </Link>
              )}
            </div>
            <div className="border-t border-slate-100 py-1">
              <form action={logoutAction}>
                <button
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50"
                  type="submit"
                >
                  <LogOut size={14} className="text-slate-400" />
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
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
      {/* Announcement bar */}
      <div
        className="px-4 py-2 text-center text-xs font-bold tracking-wider text-white"
        style={{ background: "linear-gradient(90deg, #0f2575 0%, #e01030 45%, #0f2575 100%)" }}
      >
        🏆 FIFA World Cup 2026™ Official Merchandise &nbsp;·&nbsp; Butterfly Fashion Trading &nbsp;·&nbsp; Toronto, ON
      </div>

      {/* Main header row */}
      <div className="container-shell grid gap-3 py-3 lg:grid-cols-[220px_minmax(280px,1fr)_auto] lg:items-center">
        {/* Logo */}
        <Link className="group flex items-center gap-2.5" href="/">
          <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-sm border border-slate-200 bg-white transition-opacity group-hover:opacity-85">
            <ButterflyLogo size={40} />
          </span>
          <div>
            <span className="block text-sm font-black leading-tight tracking-tight">Butterfly Fashion</span>
            <span className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500">Trading · Toronto</span>
          </div>
        </Link>

        {/* Search */}
        <form action="/products" className="relative order-3 lg:order-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            className="field pl-9 pr-24 text-sm"
            name="q"
            placeholder="Search flags, caps, countries, or fan gear…"
            type="search"
          />
          <button
            className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-7 rounded bg-(--primary) px-3.5 text-xs font-bold text-white transition-colors hover:bg-[#1e2937] active:scale-95"
            type="submit"
          >
            Search
          </button>
        </form>

        {/* Nav actions */}
        <div className="flex items-center justify-end gap-1 text-sm font-bold">
          {profile ? (
            <>
              <UserMenu profile={profile} />
            </>
          ) : (
            <>
              <Link
                className="rounded-md px-3 py-2 text-xs text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
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
      <nav className="border-t border-slate-100 bg-slate-50">
        <div className="relative">
          <div className="container-shell category-nav-scroll flex items-center gap-0.5 overflow-x-auto py-1.5">
            <Suspense fallback={<CategoryNavFallback />}>
              <CategoryNavLinks />
            </Suspense>
            <span className="ml-auto hidden shrink-0 items-center gap-1 text-[10px] font-semibold text-slate-400 lg:flex">
              <ChevronRight size={12} />
              B2B accounts get custom pricing
            </span>
          </div>
          {/* Fade hint — visible on mobile to indicate horizontal scroll */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-linear-to-l from-slate-50 to-transparent lg:hidden" />
        </div>
      </nav>
    </header>
  );
}
