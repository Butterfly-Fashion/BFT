"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, LayoutDashboard, ShoppingBag, Users, ClipboardList, FileText, ExternalLink, LogOut, CalendarClock, Tag, UserCheck, Mail } from "lucide-react";
import { logoutAction } from "@/app/actions";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Approvals", href: "/admin/approvals", icon: UserCheck },
  { label: "Products", href: "/admin/products", icon: ShoppingBag },
  { label: "Categories", href: "/admin/categories", icon: Tag },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Orders", href: "/admin/orders", icon: ClipboardList },
  { label: "Pre-orders", href: "/admin/preorders", icon: CalendarClock },
  { label: "Quotes", href: "/admin/quotes", icon: FileText },
  { label: "Newsletter", href: "/admin/newsletter", icon: Mail },
];

export function AdminNav() {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
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

        {/* Nav links */}
        <nav className="flex flex-1 gap-0.5 overflow-x-auto">
          {NAV_ITEMS.map(({ label, href, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-xs font-bold transition-colors"
                style={active
                  ? { background: "var(--primary-light)", color: "var(--primary)" }
                  : { color: "#6B7280" }
                }
              >
                <Icon size={13} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100"
          >
            <ExternalLink size={12} />
            Storefront
          </Link>
          <form action={logoutAction}>
            <button className="btn-secondary min-h-8 gap-1.5 px-3 text-xs" type="submit">
              <LogOut size={12} />
              Logout
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
