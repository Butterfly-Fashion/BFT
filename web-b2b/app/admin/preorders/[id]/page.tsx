import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { formatMoney } from "@/lib/money";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { updatePreorderCampaignStatusAction, updatePreorderCampaignAction } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function AdminPreorderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createSupabaseAdminClient();

  const { data: campaign } = await admin
    .from("preorder_campaigns")
    .select("*, products(name, sku, image_url, category)")
    .eq("id", id)
    .single();

  if (!campaign) notFound();

  const { data: commitments } = await admin
    .from("preorder_commitments")
    .select("*, profiles(business_name, contact_name, email, phone)")
    .eq("campaign_id", id)
    .order("created_at", { ascending: false });

  const product = Array.isArray(campaign.products) ? campaign.products[0] : campaign.products;
  const totalUnits = (commitments || []).reduce((sum, c) => sum + Number(c.quantity || 0), 0);
  const caseCount = campaign.case_qty ? Math.floor(totalUnits / campaign.case_qty) : null;

  return (
    <>
      <AdminNav />
      <main className="container-shell py-7">
        <div className="mb-5 flex items-center gap-3">
          <Link className="btn-secondary text-xs" href="/admin/preorders">← Back</Link>
          <span className={`badge ${
            campaign.status === "open" ? "border-emerald-200 bg-emerald-50 text-emerald-800" :
            campaign.status === "closed" ? "border-slate-200 bg-slate-100 text-slate-600" :
            "border-red-200 bg-red-50 text-red-700"
          }`}>{campaign.status}</span>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          {/* Main */}
          <div className="grid gap-5">
            <section className="card p-5">
              <p className="section-label">Campaign</p>
              <h1 className="mt-1 text-2xl font-black text-slate-900">{campaign.title}</h1>
              {campaign.description && (
                <p className="mt-2 text-sm text-slate-500">{campaign.description}</p>
              )}
              <div className="mt-4 grid gap-2 rounded-xl bg-slate-50 p-4 text-sm">
                <div className="flex justify-between"><span className="font-semibold text-slate-500">Product</span><span className="font-black">{product?.name}</span></div>
                <div className="flex justify-between"><span className="font-semibold text-slate-500">Item Code</span><span className="font-mono text-xs font-semibold">{product?.sku}</span></div>
                <div className="flex justify-between"><span className="font-semibold text-slate-500">Unit price</span><span className="font-black">{formatMoney(campaign.unit_price)}</span></div>
                {campaign.case_price != null && (
                  <div className="flex justify-between"><span className="font-semibold text-slate-500">Case price ({campaign.case_qty}개)</span><span className="font-black">{formatMoney(campaign.case_price)}</span></div>
                )}
                {campaign.closes_at && (
                  <div className="flex justify-between"><span className="font-semibold text-slate-500">Closes at</span><span className="font-black">{new Date(campaign.closes_at).toLocaleDateString("en-CA")}</span></div>
                )}
              </div>
            </section>

            {/* Commitments table */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 bg-slate-50 px-5 py-3 flex items-center justify-between">
                <h2 className="text-base font-black text-slate-900">Commitments ({commitments?.length || 0})</h2>
                <p className="text-sm font-black text-slate-700">Total: <span className="text-(--primary)">{totalUnits} units</span>{caseCount != null ? ` (${caseCount} cases)` : ""}</p>
              </div>
              <div className="overflow-auto">
                <table className="w-full min-w-160 text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500">
                      <th className="px-5 py-3">Business</th>
                      <th className="px-5 py-3">Contact</th>
                      <th className="px-5 py-3">Qty</th>
                      <th className="px-5 py-3">Est. value</th>
                      <th className="px-5 py-3">Notes</th>
                      <th className="px-5 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(commitments || []).map((c) => {
                      const p = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
                      return (
                        <tr key={c.id} className="table-row-hover border-b border-slate-100 last:border-b-0">
                          <td className="px-5 py-3 font-black">{p?.business_name || "—"}</td>
                          <td className="px-5 py-3 text-xs text-slate-600">{p?.email || "—"}</td>
                          <td className="px-5 py-3 font-black text-base text-slate-900">{c.quantity}</td>
                          <td className="px-5 py-3 font-semibold">{formatMoney(c.quantity * campaign.unit_price)}</td>
                          <td className="px-5 py-3 max-w-40 truncate text-slate-500">{c.notes || "—"}</td>
                          <td className="px-5 py-3 text-xs text-slate-400">{new Date(c.created_at).toLocaleDateString("en-CA")}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {!commitments?.length && (
                <div className="p-8 text-center text-sm font-bold text-slate-500">아직 참여한 고객이 없습니다.</div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <aside className="grid gap-4 xl:h-fit xl:sticky xl:top-20">
            <section className="card p-4">
              <h2 className="mb-3 text-base font-black">수요 집계</h2>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="font-semibold text-slate-500">참여 업체</span>
                  <span className="font-black">{commitments?.length || 0}곳</span>
                </div>
                <div className="flex justify-between rounded-lg bg-blue-50 px-3 py-2">
                  <span className="font-semibold text-blue-600">총 수량</span>
                  <span className="font-black text-blue-900">{totalUnits}개</span>
                </div>
                {caseCount != null && (
                  <div className="flex justify-between rounded-lg bg-blue-50 px-3 py-2">
                    <span className="font-semibold text-blue-600">케이스 환산</span>
                    <span className="font-black text-blue-900">{caseCount} cases</span>
                  </div>
                )}
                <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="font-semibold text-slate-500">예상 매출</span>
                  <span className="font-black">{formatMoney(totalUnits * campaign.unit_price)}</span>
                </div>
              </div>
            </section>

            <section className="card p-4">
              <h2 className="mb-3 text-base font-bold text-slate-900">Edit campaign</h2>
              <form action={updatePreorderCampaignAction} className="grid gap-3">
                <input type="hidden" name="campaign_id" value={id} />
                <label className="label">
                  Title
                  <input className="field text-sm" name="title" defaultValue={campaign.title} required />
                </label>
                <label className="label">
                  Description
                  <textarea className="field min-h-16 text-sm" name="description" defaultValue={campaign.description || ""} placeholder="Optional description for customers" />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="label">
                    Unit price
                    <input className="field text-sm" name="unit_price" type="number" step="0.01" min="0" defaultValue={campaign.unit_price} required />
                  </label>
                  <label className="label">
                    Case price
                    <input className="field text-sm" name="case_price" type="number" step="0.01" min="0" defaultValue={campaign.case_price ?? ""} placeholder="Optional" />
                  </label>
                </div>
                <label className="label">
                  Closing date
                  <input
                    className="field text-sm"
                    name="closes_at"
                    type="date"
                    defaultValue={campaign.closes_at ? new Date(campaign.closes_at).toISOString().slice(0, 10) : ""}
                  />
                </label>
                <button className="btn-primary w-full text-sm" type="submit">Save changes</button>
              </form>
            </section>

            <section className="card p-4">
              <h2 className="mb-3 text-base font-bold text-slate-900">Campaign status</h2>
              <div className="grid gap-2">
                {campaign.status === "open" && (
                  <form action={async () => { "use server"; await updatePreorderCampaignStatusAction(id, "closed"); }}>
                    <button className="btn-secondary w-full text-sm" type="submit">Close campaign</button>
                  </form>
                )}
                {campaign.status === "closed" && (
                  <form action={async () => { "use server"; await updatePreorderCampaignStatusAction(id, "open"); }}>
                    <button className="btn-secondary w-full text-sm" type="submit">Re-open campaign</button>
                  </form>
                )}
                {campaign.status !== "cancelled" && (
                  <form
                    action={async () => { "use server"; await updatePreorderCampaignStatusAction(id, "cancelled"); }}
                    onSubmit={undefined}
                  >
                    <button className="btn-danger w-full text-sm" type="submit">Cancel campaign</button>
                  </form>
                )}
              </div>
            </section>
          </aside>
        </div>
      </main>
    </>
  );
}
