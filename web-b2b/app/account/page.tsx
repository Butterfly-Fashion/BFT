import Link from "next/link";
import { CheckCircle, User, Building2, Mail, Phone, MapPin, ClipboardList, MessageSquare } from "lucide-react";
import { Header } from "@/components/store/header";
import { requireProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const profile = await requireProfile();

  return (
    <>
      <Header profile={profile} />
      <main className="container-shell py-8">
        <div className="mb-6">
          <p className="section-label">My account</p>
          <h1 className="mt-1 text-3xl font-black text-slate-900">Account Overview</h1>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          {/* Business details */}
          <div className="card p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">{profile.business_name}</h2>
                <p className="mt-0.5 text-sm font-semibold text-slate-500">{profile.business_type}</p>
              </div>
              <span className="badge border-emerald-200 bg-emerald-50 text-emerald-800">
                <CheckCircle size={10} className="mr-1" />Wholesale account
              </span>
            </div>

            <div className="grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
              <div className="flex items-start gap-2.5">
                <User size={14} className="mt-0.5 shrink-0 text-slate-400" />
                <div>
                  <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Contact</p>
                  <p className="text-sm font-semibold text-slate-700">{profile.contact_name}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Mail size={14} className="mt-0.5 shrink-0 text-slate-400" />
                <div>
                  <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Email</p>
                  <p className="text-sm font-semibold text-slate-700">{profile.email}</p>
                </div>
              </div>
              {profile.phone && (
                <div className="flex items-start gap-2.5">
                  <Phone size={14} className="mt-0.5 shrink-0 text-slate-400" />
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Phone</p>
                    <p className="text-sm font-semibold text-slate-700">{profile.phone}</p>
                  </div>
                </div>
              )}
              {profile.business_address && (
                <div className="flex items-start gap-2.5">
                  <MapPin size={14} className="mt-0.5 shrink-0 text-slate-400" />
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Address</p>
                    <p className="text-sm font-semibold text-slate-700">
                      {profile.business_address}, {profile.city}, {profile.province} {profile.postal_code}
                    </p>
                  </div>
                </div>
              )}
              {profile.tax_number && (
                <div className="flex items-start gap-2.5">
                  <Building2 size={14} className="mt-0.5 shrink-0 text-slate-400" />
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Tax number</p>
                    <p className="text-sm font-semibold text-slate-700">{profile.tax_number}</p>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Quick links */}
          <div className="grid gap-3 content-start">
            <Link
              href="/account/orders"
              className="card flex items-center gap-4 p-4 transition-all hover:border-slate-400 hover:shadow-sm hover:-translate-y-0.5"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 bg-slate-50">
                <ClipboardList size={18} className="text-slate-600" />
              </span>
              <div>
                <p className="text-sm font-black text-slate-900">My Orders</p>
                <p className="text-xs font-semibold text-slate-500">View order history and status</p>
              </div>
            </Link>

            <Link
              href="/account/messages"
              className="card flex items-center gap-4 p-4 transition-all hover:border-slate-400 hover:shadow-sm hover:-translate-y-0.5"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 bg-slate-50">
                <MessageSquare size={18} className="text-slate-600" />
              </span>
              <div>
                <p className="text-sm font-black text-slate-900">Messages</p>
                <p className="text-xs font-semibold text-slate-500">Ask about pricing, stock, or orders</p>
              </div>
            </Link>

            <Link
              href="/products"
              className="card flex items-center gap-4 p-4 transition-all hover:border-slate-400 hover:shadow-sm hover:-translate-y-0.5"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-(--primary)">
                <Building2 size={18} className="text-white" />
              </span>
              <div>
                <p className="text-sm font-black text-slate-900">Browse Products</p>
                <p className="text-xs font-semibold text-slate-500">Shop the full wholesale catalog</p>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
