import Link from "next/link";
import { ShieldCheck, UserPlus, AlertTriangle } from "lucide-react";
import { promoteAdminByEmailAction, removeAdminRoleAction } from "@/app/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { DangerForm } from "@/components/admin/danger-form";
import { getCurrentProfile } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type AdminProfile = {
  id: string;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  province: string | null;
  role: "customer" | "admin" | "guest";
  is_b2b_approved: boolean;
  created_at: string;
};

const STATUS_COPY: Record<string, string> = {
  promoted: "Administrator access was granted.",
  removed: "Administrator access was removed.",
  "already-admin": "That user is already an administrator.",
};

const ERROR_COPY: Record<string, string> = {
  "missing-email": "Enter the exact email address of an existing user.",
  "user-not-found": "No user profile exists for that email address.",
  "self-demote": "You cannot remove your own administrator access.",
  "last-admin": "At least one administrator must remain.",
};

export default async function AdminAdministratorsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; error?: string; q?: string }>;
}) {
  const params = await searchParams;
  const [currentProfile, admin] = await Promise.all([
    getCurrentProfile(),
    Promise.resolve(createSupabaseAdminClient()),
  ]);

  let candidateQuery = admin
    .from("profiles")
    .select("id,business_name,contact_name,email,phone,city,province,role,is_b2b_approved,created_at")
    .neq("role", "admin")
    .order("created_at", { ascending: false })
    .limit(20);

  if (params.q) {
    const q = params.q.replace(/[%(),]/g, "");
    candidateQuery = candidateQuery.or(
      `business_name.ilike.%${q}%,contact_name.ilike.%${q}%,email.ilike.%${q}%`
    );
  }

  const [{ data: admins }, { data: candidates }] = await Promise.all([
    admin
      .from("profiles")
      .select("id,business_name,contact_name,email,phone,city,province,role,is_b2b_approved,created_at")
      .eq("role", "admin")
      .order("created_at", { ascending: true }),
    candidateQuery,
  ]);

  const adminList = (admins || []) as AdminProfile[];
  const candidateList = (candidates || []) as AdminProfile[];
  const statusMessage = params.status ? STATUS_COPY[params.status] : null;
  const errorMessage = params.error ? ERROR_COPY[params.error] : null;

  return (
    <>
      <AdminNav />
      <main className="container-shell py-7">
        <section className="mb-6">
          <p className="section-label">Access control</p>
          <h1 className="mt-1 text-3xl font-black text-slate-900">Administrators</h1>
          <p className="mt-1.5 max-w-2xl text-sm font-medium text-slate-500">
            Grant and review admin panel access separately from customer approval, so B2B customer work stays isolated from staff permissions.
          </p>
        </section>

        {(statusMessage || errorMessage) && (
          <div
            className={`mb-5 rounded-xl border px-4 py-3 text-sm font-semibold ${
              errorMessage
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-green-200 bg-green-50 text-green-700"
            }`}
          >
            {errorMessage || statusMessage}
          </div>
        )}

        <section className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="card p-5">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck size={18} className="text-green-700" />
              <h2 className="text-xl font-black text-slate-900">Current administrators</h2>
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full min-w-180 text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold text-slate-500">
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Since</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminList.map((profile) => {
                    const isSelf = currentProfile?.id === profile.id;
                    return (
                      <tr key={profile.id} className="border-b border-slate-100 last:border-b-0">
                        <td className="px-4 py-3">
                          <p className="font-black text-slate-900">{profile.business_name || profile.contact_name}</p>
                          <p className="text-xs font-semibold text-slate-500">{profile.email}</p>
                          {isSelf && <span className="mt-1 inline-flex rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-bold text-green-700">You</span>}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {[profile.city, profile.province].filter(Boolean).join(", ") || "-"}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {new Date(profile.created_at).toLocaleDateString("en-CA")}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isSelf ? (
                            <span className="text-xs font-semibold text-slate-400">Self protected</span>
                          ) : (
                            <DangerForm
                              action={removeAdminRoleAction.bind(null, profile.id)}
                              confirmMessage={`Remove administrator access for ${profile.email}?\n\nThey will remain a customer profile, but cannot access the admin panel.`}
                              submitLabel="Remove admin"
                              className="inline-flex"
                            />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="grid gap-4">
            <section className="card p-5">
              <div className="mb-4 flex items-center gap-2">
                <UserPlus size={18} className="text-green-700" />
                <h2 className="text-xl font-black text-slate-900">Add administrator</h2>
              </div>
              <form action={promoteAdminByEmailAction} className="grid gap-3">
                <label className="label">
                  Exact user email
                  <input
                    className="field"
                    name="email"
                    type="email"
                    placeholder="name@company.com"
                    required
                  />
                </label>
                <button className="btn-primary" type="submit">Grant admin access</button>
              </form>
            </section>

            <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
                <p className="text-sm font-semibold leading-6 text-amber-900">
                  Admins can manage products, orders, customers, messages, and other administrators. Only grant access to staff accounts.
                </p>
              </div>
            </section>
          </aside>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-base font-black text-slate-900">Non-admin users</h2>
              <p className="mt-0.5 text-xs font-semibold text-slate-500">
                Use this list to find the exact account, then grant access by email above.
              </p>
            </div>
            <form className="flex gap-2">
              <input className="field min-h-9 w-64" defaultValue={params.q || ""} name="q" placeholder="Search name or email" />
              <button className="btn-secondary min-h-9 px-4 text-xs" type="submit">Search</button>
            </form>
          </div>
          <div className="overflow-auto">
            <table className="w-full min-w-190 text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500">
                  <th className="px-5 py-3">Business</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">B2B status</th>
                  <th className="px-5 py-3 text-right">Profile</th>
                </tr>
              </thead>
              <tbody>
                {candidateList.map((profile) => (
                  <tr key={profile.id} className="border-b border-slate-100 last:border-b-0">
                    <td className="px-5 py-3">
                      <p className="font-black text-slate-900">{profile.business_name || profile.contact_name}</p>
                      <p className="text-xs text-slate-500">{profile.contact_name}</p>
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-700">{profile.email}</td>
                    <td className="px-5 py-3">
                      {profile.is_b2b_approved ? (
                        <span className="badge border-green-200 bg-green-50 text-green-800">Approved</span>
                      ) : (
                        <span className="badge border-amber-200 bg-amber-50 text-amber-900">Not approved</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link className="btn-secondary min-h-8 px-3 text-xs" href={`/admin/customers/${profile.id}`}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!candidateList.length && (
            <div className="p-10 text-center text-sm font-bold text-slate-500">
              No non-admin users match this search.
            </div>
          )}
        </section>
      </main>
    </>
  );
}
