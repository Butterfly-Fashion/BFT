import Link from "next/link";
import { CheckCircle, XCircle, Clock, MapPin, Phone, Mail, Building2, Globe, Truck } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { approveB2BCustomerAction, declineB2BAccountAction } from "@/app/actions";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Profile = {
  id: string;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string;
  business_type: string;
  business_address: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
  notes: string | null;
  website: string | null;
  tax_number: string | null;
  preferred_delivery_method: string | null;
  is_b2b_approved: boolean;
  b2b_declined: boolean;
  created_at: string;
};

export default async function AdminApprovalsPage() {
  const admin = createSupabaseAdminClient();
  const { data: profiles } = await admin
    .from("profiles")
    .select("*")
    .neq("role", "admin")
    .order("created_at", { ascending: false });

  const all = (profiles || []) as Profile[];
  const pending = all.filter((p) => !p.is_b2b_approved && !p.b2b_declined);
  // Guard: approved always wins — never show in declined even if b2b_declined flag is stale
  const declined = all.filter((p) => p.b2b_declined && !p.is_b2b_approved);
  const approved = all.filter((p) => p.is_b2b_approved);

  return (
    <>
      <AdminNav />
      <main className="container-shell py-7">
        <div className="mb-6">
          <p className="section-label">Account management</p>
          <h1 className="mt-1 text-3xl font-black text-slate-900">B2B Approvals</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Review new B2B account applications and approve or decline access to wholesale pricing.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="card p-4">
            <p className="text-xs font-semibold text-slate-500">Pending review</p>
            <strong className={`mt-2 block text-2xl font-black ${pending.length > 0 ? "text-amber-600" : "text-slate-900"}`}>
              {pending.length}
            </strong>
          </div>
          <div className="card p-4">
            <p className="text-xs font-semibold text-slate-500">Approved</p>
            <strong className="mt-2 block text-2xl font-black text-green-600">{approved.length}</strong>
          </div>
          <div className="card p-4">
            <p className="text-xs font-semibold text-slate-500">Declined</p>
            <strong className="mt-2 block text-2xl font-black text-slate-500">{declined.length}</strong>
          </div>
        </div>

        {/* ── PENDING ── */}
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-900">
            <Clock size={15} className="text-amber-500" />
            Pending review
            {pending.length > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                {pending.length}
              </span>
            )}
          </h2>

          {pending.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white py-14 text-center">
              <CheckCircle size={28} className="mx-auto mb-3 text-green-400" />
              <p className="font-semibold text-slate-400">All caught up — no pending applications.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {pending.map((profile) => (
                <AccountCard
                  key={profile.id}
                  profile={profile}
                  status="pending"
                />
              ))}
            </div>
          )}
        </section>

        {/* ── DECLINED ── */}
        {declined.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-700">
              <XCircle size={15} className="text-red-400" />
              Declined
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600">
                {declined.length}
              </span>
            </h2>
            <div className="grid gap-3">
              {declined.map((profile) => (
                <AccountCard key={profile.id} profile={profile} status="declined" />
              ))}
            </div>
          </section>
        )}

        {/* ── APPROVED ── */}
        {approved.length > 0 && (
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-700">
              <CheckCircle size={15} className="text-green-500" />
              Approved accounts
              <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-bold text-green-700">
                {approved.length}
              </span>
            </h2>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500">
                    <th className="px-5 py-3">Business</th>
                    <th className="px-5 py-3">Contact</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Location</th>
                    <th className="px-5 py-3">Registered</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {approved.map((profile) => (
                    <tr key={profile.id} className="border-b border-slate-100 last:border-b-0">
                      <td className="px-5 py-3 font-semibold text-slate-900">{profile.business_name}</td>
                      <td className="px-5 py-3 text-slate-600">
                        <p>{profile.contact_name}</p>
                        <p className="text-xs text-slate-400">{profile.email}</p>
                      </td>
                      <td className="px-5 py-3 text-slate-500">{profile.business_type}</td>
                      <td className="px-5 py-3 text-slate-500">{profile.city}, {profile.province}</td>
                      <td className="px-5 py-3 text-xs text-slate-400">
                        {new Date(profile.created_at).toLocaleDateString("en-CA")}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Link className="btn-secondary min-h-7 px-3 text-xs" href={`/admin/customers/${profile.id}`}>
                            View
                          </Link>
                          <form action={approveB2BCustomerAction.bind(null, profile.id, false)}>
                            <button type="submit" className="min-h-7 rounded-lg border border-red-200 bg-white px-3 text-xs font-semibold text-red-600 hover:bg-red-50">
                              Revoke
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </>
  );
}

function AccountCard({ profile, status }: { profile: Profile; status: "pending" | "declined" }) {
  const daysSince = Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 86400000);

  return (
    <div className={`overflow-hidden rounded-xl border bg-white ${
      status === "pending" ? "border-amber-200" : "border-slate-200"
    }`}>
      {/* Card header */}
      <div className={`flex flex-wrap items-start justify-between gap-3 px-5 py-4 ${
        status === "pending" ? "bg-amber-50" : "bg-slate-50"
      }`}>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-black text-slate-900">{profile.business_name}</h3>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
              status === "pending"
                ? "bg-amber-100 text-amber-700"
                : "bg-red-50 text-red-600"
            }`}>
              {status === "pending" ? "Pending review" : "Declined"}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Applied {daysSince === 0 ? "today" : `${daysSince}d ago`} ·{" "}
            {new Date(profile.created_at).toLocaleDateString("en-CA", {
              year: "numeric", month: "long", day: "numeric",
            })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {status === "pending" ? (
            <>
              <form action={approveB2BCustomerAction.bind(null, profile.id, true)}>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-green-700"
                >
                  <CheckCircle size={14} />
                  Approve
                </button>
              </form>
              <form action={declineB2BAccountAction.bind(null, profile.id)}>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-600 transition-colors hover:bg-red-50"
                >
                  <XCircle size={14} />
                  Decline
                </button>
              </form>
            </>
          ) : (
            <form action={approveB2BCustomerAction.bind(null, profile.id, true)}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-green-700"
              >
                <CheckCircle size={14} />
                Approve anyway
              </button>
            </form>
          )}
          <Link className="btn-secondary min-h-9 px-4 text-sm" href={`/admin/customers/${profile.id}`}>
            Full profile →
          </Link>
        </div>
      </div>

      {/* Card body — registration info */}
      <div className="grid gap-0 sm:grid-cols-2 lg:grid-cols-3">
        <InfoBlock icon={Building2} label="Business type" value={profile.business_type} />
        <InfoBlock icon={Mail} label="Email" value={profile.email} />
        <InfoBlock icon={Phone} label="Phone" value={profile.phone} />
        <InfoBlock
          icon={MapPin}
          label="Business address"
          value={[profile.business_address, profile.city, `${profile.province} ${profile.postal_code}`, profile.country].filter(Boolean).join(", ")}
        />
        {profile.preferred_delivery_method && (
          <InfoBlock icon={Truck} label="Preferred delivery" value={profile.preferred_delivery_method} />
        )}
        {profile.website && (
          <InfoBlock icon={Globe} label="Website" value={profile.website} link />
        )}
        {profile.tax_number && (
          <InfoBlock icon={Building2} label="Tax / GST number" value={profile.tax_number} />
        )}
      </div>

      {profile.notes && (
        <div className="border-t border-slate-100 px-5 py-3">
          <p className="text-xs font-semibold text-slate-500">Notes from applicant</p>
          <p className="mt-1 text-sm text-slate-700">{profile.notes}</p>
        </div>
      )}
    </div>
  );
}

function InfoBlock({
  icon: Icon,
  label,
  value,
  link,
}: {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
  link?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5 border-b border-slate-100 px-5 py-3 last:border-b-0 sm:border-r">
      <Icon size={13} className="mt-0.5 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-400">{label}</p>
        {link ? (
          <a href={value.startsWith("http") ? value : `https://${value}`} target="_blank" rel="noopener noreferrer" className="mt-0.5 block truncate text-sm font-semibold text-slate-700 hover:underline">
            {value}
          </a>
        ) : (
          <p className="mt-0.5 text-sm font-semibold text-slate-700">{value}</p>
        )}
      </div>
    </div>
  );
}
