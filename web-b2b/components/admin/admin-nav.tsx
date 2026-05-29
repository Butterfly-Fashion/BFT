"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Package, LayoutDashboard, ShoppingBag, Users,
  ClipboardList, FileText, ExternalLink, LogOut,
  CalendarClock, Tag, UserCheck, Mail, MessageSquare,
  ChevronDown,
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
      { label: "Customer list", href: "/admin/customers",  icon: Users },
      { label: "Messages",      href: "/admin/messages",   icon: MessageSquare },
      { label: "Newsletter",    href: "/admin/newsletter", icon: Mail },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Products",   href: "/admin/products",   icon: ShoppingBag },
      { label: "Categories", href: "/admin/categories", icon: Tag },
    ],
  },
  {
    label: "Orders",
    items: [
      { label: "Orders",     href: "/admin/orders",    icon: ClipboardList },
      { label: "Pre-orders", href: "/admin/preorders", icon: CalendarClock },
      { label: "Quotes",     href: "/admin/quotes",    icon: FileText },
    ],
  },
];

function isGroup(item: NavItem | NavGroup): item is NavGroup {
  return "items" in item;
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
          <span className="grid h-7 w-7 place-items-center rounded-md bg-(--primary) text-white">
            <Package size={14} />
          </span>
          <span className="text-xs font-black uppercase tracking-wider text-slate-700">Admin Desk</span>
        </Link>

        <span className="h-5 w-px shrink-0 bg-slate-200" />

        {/* Nav */}
        <nav className="flex flex-1 items-center gap-0.5 overflow-x-auto">
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

            const groupActive = entry.items.some((i) => active(i.href, i.exact));

            return (
              <div key={entry.label} className="group relative">
                {/* Trigger */}
                <button
                  className="flex items-center gap-1 rounded-md px-3 py-2 text-xs font-bold transition-colors"
                  style={groupActive ? { background: "var(--primary-light)", color: "var(--primary)" } : { color: "#6B7280" }}
                  tabIndex={0}
                  type="button"
                >
                  {entry.label}
                  <ChevronDown size={11} className="transition-transform duration-150 group-hover:rotate-180" />
                </button>

                {/* Dropdown — shown on group hover */}
                <div className="invisible absolute left-0 top-full z-50 mt-1 min-w-44 overflow-hidden rounded-xl border border-slate-200 bg-white opacity-0 shadow-lg transition-all duration-150 group-hover:visible group-hover:opacity-100">
                  {entry.items.map(({ label, href, icon: Icon }) => {
                    const on = active(href);
                    return (
                      <Link
                        key={href}
                        href={href}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold transition-colors hover:bg-slate-50"
                        style={on ? { color: "var(--primary)", background: "var(--primary-light)" } : { color: "#374151" }}
                      >
                        <Icon size={13} className="shrink-0" style={{ color: on ? "var(--primary)" : "#9CA3AF" }} />
                        {label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100"
          >
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
