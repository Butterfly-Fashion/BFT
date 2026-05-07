import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CustomerRow = {
  id: string;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string;
  business_type: string;
  city: string;
  province: string;
  is_b2b_approved: boolean;
};

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; approval?: string }>;
}) {
  const params = await searchParams;
  const admin = createSupabaseAdminClient();

  let customerQuery = admin.from("profiles").select("*").order("created_at", { ascending: false });
  if (params.q) {
    const q = params.q.replace(/[%(),]/g, "");
    customerQuery = customerQuery.or(
      `business_name.ilike.%${q}%,contact_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%,city.ilike.%${q}%,business_type.ilike.%${q}%`
    );
  }
  if (params.type) customerQuery = customerQuery.eq("business_type", params.type);
  if (params.approval === "approved") customerQuery = customerQuery.eq("is_b2b_approved", true);
  if (params.approval === "pending") customerQuery = customerQuery.eq("is_b2b_approved", false);

  const [{ data: customers }, { data: allCustomers }] = await Promise.all([
    customerQuery,
    admin.from("profiles").select("business_type,is_b2b_approved"),
  ]);

  const customerList = (customers || []) as CustomerRow[];
  const all = allCustomers || [];
  const businessTypes = [...new Set(all.map((c) => c.business_type).filter(Boolean))].sort();
  const approvedCount = all.filter((c) => c.is_b2b_approved).length;
  const pendingCount = all.filter((c) => !c.is_b2b_approved).length;

  return (
    <>
      <AdminNav />
      <main className="container-shell py-7">
        <section className="mb-6 border-b border-slate-200 pb-5">
          <p className="text-xs font-black uppercase tracking-widest text-(--accent)">Customer management</p>
          <h1 className="mt-1 text-3xl font-black text-slate-900">Customers</h1>
          <p className="mt-1.5 text-sm font-medium text-slate-500">
            Search and manage B2B customer accounts, approval status, and pricing.
          </p>
        </section>

        {/* Stats */}
        <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total customers", value: all.length },
            { label: "Approved B2B", value: approvedCount },
            { label: "Pending approval", value: pendingCount },
            { label: "Business types", value: businessTypes.length },
          ].map(({ label, value }) => (
            <div key={label} className="card p-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
              <strong className="mt-2 block text-2xl font-black text-slate-900">{value}</strong>
            </div>
          ))}
        </section>

        {/* Filters */}
        <form className="mb-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="grid gap-3 p-4 lg:grid-cols-[1fr_190px_170px_auto] lg:items-end">
            <label className="label">
              Search customers
              <input className="field" defaultValue={params.q || ""} name="q" placeholder="Name, email, phone, city…" />
            </label>
            <label className="label">
              Business type
              <select className="field" defaultValue={params.type || ""} name="type">
                <option value="">All types</option>
                {businessTypes.map((t) => <option key={t}>{t}</option>)}
              </select>
            </label>
            <label className="label">
              B2B status
              <select className="field" defaultValue={params.approval || ""} name="approval">
                <option value="">All</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
              </select>
            </label>
            <button className="btn-primary" type="submit">Search</button>
          </div>
        </form>

        {/* Table */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-auto">
            <table className="w-full min-w-230 text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3">Business</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Location</th>
                  <th className="px-5 py-3">B2B status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customerList.map((customer) => (
                  <tr key={customer.id} className="table-row-hover border-b border-slate-100 last:border-b-0 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-black text-slate-900">{customer.business_name}</p>
                      <p className="text-xs text-slate-500">{customer.contact_name}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-semibold text-slate-700">{customer.email}</p>
                      <p className="text-xs text-slate-500">{customer.phone}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{customer.business_type}</td>
                    <td className="px-5 py-3 text-slate-600">
                      {customer.city}, {customer.province}
                    </td>
                    <td className="px-5 py-3">
                      {customer.is_b2b_approved ? (
                        <span className="badge border-emerald-200 bg-emerald-50 text-emerald-800">Approved</span>
                      ) : (
                        <span className="badge border-amber-200 bg-amber-50 text-amber-900">Pending</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link className="btn-secondary min-h-8 px-3 text-xs" href={`/admin/customers/${customer.id}`}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!customerList.length && (
            <div className="p-12 text-center">
              <p className="font-bold text-slate-500">No customers match this search.</p>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
