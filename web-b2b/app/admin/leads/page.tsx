import { AdminNav } from "@/components/admin/admin-nav";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminLeadsPage() {
  const admin = createSupabaseAdminClient();
  const { data: leads, error } = await admin
    .from("wholesale_leads")
    .select("*")
    .order("created_at", { ascending: false });
  const list = leads || [];

  return (
    <>
      <AdminNav />
      <main className="container-shell py-7">
        <div className="mb-6">
          <p className="section-label">Lead management</p>
          <h1 className="mt-1 text-3xl font-black text-slate-900">Catalog requests</h1>
          <p className="mt-1.5 text-sm font-medium text-slate-500">
            Wholesale catalog requests from the public site — your top growth KPI.
          </p>
        </div>

        {error ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            Run migration <code>011_wholesale_leads.sql</code> in Supabase to enable lead capture.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="overflow-auto">
              <table className="w-full min-w-230 text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500">
                    <th className="px-5 py-3">Company</th>
                    <th className="px-5 py-3">Contact</th>
                    <th className="px-5 py-3">Est. qty</th>
                    <th className="px-5 py-3">Source</th>
                    <th className="px-5 py-3">Message</th>
                    <th className="px-5 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((lead) => (
                    <tr key={lead.id} className="border-b border-slate-100 last:border-b-0">
                      <td className="px-5 py-3 font-bold text-slate-900">{lead.company || "—"}</td>
                      <td className="px-5 py-3">
                        {lead.name && <p className="text-slate-700">{lead.name}</p>}
                        <a className="text-xs font-semibold text-(--primary)" href={`mailto:${lead.email}`}>{lead.email}</a>
                        {lead.phone && <p className="text-xs text-slate-500">{lead.phone}</p>}
                      </td>
                      <td className="px-5 py-3 text-slate-600">{lead.expected_quantity || "—"}</td>
                      <td className="px-5 py-3 max-w-48 truncate text-xs text-slate-500" title={lead.source || ""}>{lead.source || "—"}</td>
                      <td className="px-5 py-3 max-w-64 text-xs text-slate-600">{lead.message || "—"}</td>
                      <td className="px-5 py-3 text-xs text-slate-500">{new Date(lead.created_at).toLocaleDateString("en-CA")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!list.length && (
              <div className="p-12 text-center">
                <p className="font-bold text-slate-500">No catalog requests yet.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
