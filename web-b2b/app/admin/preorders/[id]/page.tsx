import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { DangerForm } from "@/components/admin/danger-form";
import { formatMoney } from "@/lib/money";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import {
  updatePreorderCampaignStatusAction,
  updatePreorderCampaignAction,
  addPreorderItemAction,
  deletePreorderItemAction,
} from "@/app/actions";

export const dynamic = "force-dynamic";

type ItemProduct = { name: string; sku: string | null; image_url: string | null; category: string | null };

export default async function AdminPreorderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createSupabaseAdminClient();

  const { data: campaign } = await admin.from("preorder_campaigns").select("*").eq("id", id).single();
  if (!campaign) notFound();

  const [{ data: items }, { data: commitments }, { data: products }] = await Promise.all([
    admin.from("preorder_campaign_items").select("*, products(name, sku, image_url, category)").eq("campaign_id", id),
    admin.from("preorder_commitments").select("*, profiles(business_name, email)").eq("campaign_id", id),
    admin
      .from("products")
      .select("id, name, sku, unit_price, case_price, case_qty")
      .eq("is_hidden", false)
      .contains("sales_channels", ["b2b"])
      .order("name"),
  ]);

  const itemList = items || [];
  const commitList = commitments || [];
  const addedProductIds = new Set(itemList.map((it) => it.product_id));
  const availableProducts = (products || []).filter((p) => !addedProductIds.has(p.id));

  // Per-item demand aggregation.
  const demandByProduct = new Map<string, { units: number; buyers: number }>();
  for (const c of commitList) {
    if (!c.product_id) continue;
    const d = demandByProduct.get(c.product_id) || { units: 0, buyers: 0 };
    d.units += Number(c.quantity || 0);
    d.buyers += 1;
    demandByProduct.set(c.product_id, d);
  }
  const totalUnits = commitList.reduce((sum, c) => sum + Number(c.quantity || 0), 0);
  const totalEstValue = itemList.reduce((sum, it) => {
    const d = demandByProduct.get(it.product_id);
    return sum + (d ? d.units * Number(it.unit_price || 0) : 0);
  }, 0);

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
              {campaign.description && <p className="mt-2 text-sm text-slate-500">{campaign.description}</p>}
              {campaign.closes_at && (
                <p className="mt-2 text-sm text-slate-500">
                  Closes {new Date(campaign.closes_at).toLocaleDateString("en-CA")}
                </p>
              )}
            </section>

            {/* Products in campaign */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
                <h2 className="text-base font-black text-slate-900">Products ({itemList.length})</h2>
                <p className="text-sm font-black text-slate-700">
                  Total demand: <span className="text-(--primary)">{totalUnits} units</span> · {formatMoney(totalEstValue)}
                </p>
              </div>
              <div className="overflow-auto">
                <table className="w-full min-w-160 text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500">
                      <th className="px-5 py-3">Product</th>
                      <th className="px-5 py-3">Unit / case</th>
                      <th className="px-5 py-3">Committed</th>
                      <th className="px-5 py-3">Buyers</th>
                      <th className="px-5 py-3">Est. value</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemList.map((it) => {
                      const p = (Array.isArray(it.products) ? it.products[0] : it.products) as ItemProduct | null;
                      const d = demandByProduct.get(it.product_id);
                      const cases = it.case_qty ? Math.floor((d?.units ?? 0) / it.case_qty) : null;
                      return (
                        <tr key={it.id} className="border-b border-slate-100 last:border-b-0">
                          <td className="px-5 py-3">
                            <p className="font-bold text-slate-900">{p?.name || "—"}</p>
                            <p className="font-mono text-xs text-slate-400">{p?.sku}</p>
                          </td>
                          <td className="px-5 py-3 text-slate-600">
                            {formatMoney(it.unit_price)}/pc
                            {it.case_price != null && <> · {formatMoney(it.case_price)}/case</>}
                            {it.case_qty && <span className="text-slate-400"> ({it.case_qty} pcs)</span>}
                          </td>
                          <td className="px-5 py-3 font-black text-slate-900">
                            {d?.units ?? 0} pcs{cases != null ? ` (${cases} cases)` : ""}
                          </td>
                          <td className="px-5 py-3 text-slate-600">{d?.buyers ?? 0}</td>
                          <td className="px-5 py-3 font-semibold">{formatMoney((d?.units ?? 0) * Number(it.unit_price || 0))}</td>
                          <td className="px-5 py-3 text-right">
                            <DangerForm
                              action={deletePreorderItemAction.bind(null, it.id, id)}
                              confirmMessage={`Remove "${p?.name}" from this campaign?`}
                              submitLabel="Remove"
                              className="contents"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {!itemList.length && (
                <div className="p-8 text-center text-sm font-bold text-slate-500">No products yet — add some below.</div>
              )}
            </section>

            {/* Add product */}
            <section className="card p-5">
              <h2 className="mb-3 text-base font-black text-slate-900">Add a product</h2>
              <form action={addPreorderItemAction} className="grid gap-3 md:grid-cols-[1fr_auto]">
                <input type="hidden" name="campaign_id" value={id} />
                <label className="label md:col-span-2">
                  Product
                  <select className="field" name="product_id" required defaultValue="">
                    <option value="" disabled>Select a product…</option>
                    {availableProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku}) — {formatMoney(p.unit_price)}/pc
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid grid-cols-3 gap-2 md:col-span-2">
                  <label className="label">Unit price *<input className="field" name="unit_price" type="number" step="0.01" min="0" required placeholder="5.99" /></label>
                  <label className="label">Case price<input className="field" name="case_price" type="number" step="0.01" min="0" placeholder="59.99" /></label>
                  <label className="label">Case qty<input className="field" name="case_qty" type="number" step="1" min="1" placeholder="12" /></label>
                </div>
                <button className="btn-primary md:col-span-2" type="submit">Add to campaign</button>
              </form>
              {!availableProducts.length && (
                <p className="mt-2 text-xs text-slate-400">All B2B products are already in this campaign.</p>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <aside className="grid gap-4 xl:h-fit xl:sticky xl:top-20">
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
                  <form action={async () => { "use server"; await updatePreorderCampaignStatusAction(id, "cancelled"); }}>
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
