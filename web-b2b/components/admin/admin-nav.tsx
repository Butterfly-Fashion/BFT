import Link from "next/link";
import { Package, LayoutDashboard, ShoppingBag, Users, ClipboardList, FileText, ExternalLink, LogOut } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { logoutAction } from "@/app/actions";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Products", href: "/admin/products", icon: ShoppingBag },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Orders", href: "/admin/orders", icon: ClipboardList },
  { label: "Quotes", href: "/admin/quotes", icon: FileText },
];

export async function AdminNav() {
  await requireAdmin();
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
      <div className="container-shell flex min-h-14 items-center gap-4">
        {/* Brand */}
        <Link href="/admin" className="flex items-center gap-2 shrink-0">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-(--primary) text-white">
            <Package size={14} />
          </span>
          <span className="text-xs font-black uppercase tracking-wider text-slate-700">Admin Desk</span>
        </Link>

        <span className="h-5 w-px bg-slate-200 shrink-0" />

        {/* Nav links */}
        <nav className="flex flex-1 gap-0.5 overflow-x-auto">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <Icon size={13} />
              {label}
            </Link>
          ))}
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
