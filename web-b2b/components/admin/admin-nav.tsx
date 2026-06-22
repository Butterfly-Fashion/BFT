"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Package, LayoutDashboard, ShoppingBag, Users,
  ClipboardList, FileText, ExternalLink, LogOut,
  CalendarClock, Tag, UserCheck, MessageSquare,
  ChevronDown, ShieldCheck, Images, Megaphone, Inbox,
} from "lucide-react";
import { logoutAction } from "@/app/actions";

type NavItem  = { label: string; href: string; icon: React.ElementType; exact?: boolean };
type NavGroup = { label: string; items: NavItem[] };

const NAV: (NavItem | NavGroup)[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
  {
    label: "Customers",
    items: [
      { label: "Approvals",     href: "/admin/approvals",  icon: UserCheck },
      { label: "Catalog leads", href: "/admin/leads",      icon: Inbox },
      { label: "Customer list", href: "/admin/customers",  icon: Users },
      { label: "Administrators", href: "/admin/admins",    icon: ShieldCheck },
      { label: "Messages",      href: "/admin/messages",   icon: MessageSquare },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Products",   href: "/admin/products",   icon: ShoppingBag },
      { label: "Categories", href: "/admin/categories", icon: Tag },
      { label: "Blog & guides", href: "/admin/blog",    icon: FileText },
      { label: "Lookbook",   href: "/admin/lookbook",   icon: Images },
      { label: "Hero banners", href: "/admin/hero",     icon: Megaphone },
    ],
  },
  {
    label: "Orders",
    items: [
      { label: "Orders",     href: "/admin/orders",    icon: ClipboardList },
      { label: "Pre-orders", href: "/admin/preorders", icon: CalendarClock },
    ],
  },
];

function isGroup(item: NavItem | NavGroup): item is NavGroup {
  return "items" in item;
}

function NavDropdown({ group, anyActive }: { group: NavGroup; anyActive: boolean }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function show() {
    if (timer.current) clearTimeout(timer.current);
    setOpen(true);
  }

  function hide() {
    timer.current = setTimeout(() => setOpen(false), 120);
  }

  function openDropdown() {
    if (timer.current) clearTimeout(timer.current);
    setOpen(true);
  }

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <div
      ref={dropdownRef}
      className="relative"
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {/* Trigger */}
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={openDropdown}
        className="flex items-center gap-1 rounded-md px-3 py-2 text-xs font-bold transition-colors select-none"
        style={anyActive || open
          ? { background: "var(--primary-light)", color: "var(--primary)" }
          : { color: "#6B7280" }
        }
      >
        {group.label}
        <ChevronDown
          size={11}
          className="transition-transform duration-150"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-50 min-w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
          style={{ marginTop: 0 }}
          onMouseEnter={show}
          onMouseLeave={hide}
        >
          {group.items.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              role="menuitem"
              className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold transition-colors hover:bg-slate-50"
              style={{ color: "#374151" }}
              onClick={() => setOpen(false)}
            >
              <Icon size={13} className="shrink-0 text-slate-400" />
              {label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminNav() {
  const pathname = usePathname();

  function active(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
      <div className="container-shell flex min-h-14 items-center gap-4">
        {/* Brand */}
        <Link href="/admin" className="flex shrink-0 items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md text-white" style={{ background: "var(--primary)" }}>
            <Package size={14} />
          </span>
          <span className="text-xs font-black uppercase tracking-wider text-slate-700">Admin Desk</span>
        </Link>

        <span className="h-5 w-px shrink-0 bg-slate-200" />

        {/* Nav */}
        <nav className="flex flex-1 items-center gap-0.5 overflow-visible">
          {NAV.map((entry) => {
            if (!isGroup(entry)) {
              const on = active(entry.href, entry.exact);
              const Icon = entry.icon;
              return (
                <Link
                  key={entry.href}
                  href={entry.href}
                  className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-xs font-bold transition-colors"
                  style={on ? { background: "var(--primary-light)", color: "var(--primary)" } : { color: "#6B7280" }}
                >
                  <Icon size={13} />
                  {entry.label}
                </Link>
              );
            }
            const anyActive = entry.items.some((i) => active(i.href, i.exact));
            return <NavDropdown key={entry.label} group={entry} anyActive={anyActive} />;
          })}
        </nav>

        {/* Right */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Link href="/" className="flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100">
            <ExternalLink size={12} /> Storefront
          </Link>
          <form action={logoutAction}>
            <button className="btn-secondary min-h-8 gap-1.5 px-3 text-xs" type="submit">
              <LogOut size={12} /> Logout
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
