import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { formatMoney } from "@/lib/money";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminPreordersPage() {
  const admin = createSupabaseAdminClient();

  const { data: campaigns } = await admin
    .from("preorder_campaigns")
    .select("*, products(name, sku, image_url), preorder_commitments(quantity)")
    .order("created_at", { ascending: false });

  const list = campaigns || [];
  const openCount = list.filter((c) => c.status === "open").length;
  const closedCount = list.filter((c) => c.status === "closed").length;

  function totalCommitments(campaign: typeof list[0]) {
    return (campaign.preorder_commitments || []).reduce(
      (sum: number, c: { quantity: number }) => sum + Number(c.quantity || 0),
      0
    );
  }

  return (
    <>
      <AdminNav />
      <main className="container-shell py-7">
        <section className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-(--primary)">Pre-order management</p>
            <h1 className="mt-1 text-3xl font-black text-slate-900">Pre-order Campaigns</h1>
            <p className="mt-1.5 text-sm font-medium text-slate-500">
              재고 없는 상품의 수요를 미리 파악해 발주 계획을 세우세요.
            </p>
          </div>
          <Link className="btn-primary gap-1.5 text-xs" href="/admin/preorders/new">
            <Plus size={13} /> New campaign
          </Link>
        </section>

        <section className="mb-5 grid gap-3 sm:grid-cols-3">
          <div className="card p-4"><p className="text-xs font-black uppercase text-slate-500">Total campaigns</p><strong className="mt-2 block text-2xl">{list.length}</strong></div>
          <div className="card p-4"><p className="text-xs font-black uppercase text-slate-500">Open</p><strong className="mt-2 block text-2xl text-emerald-600">{openCount}</strong></div>
          <div className="card p-4"><p className="text-xs font-black uppercase text-slate-500">Closed</p><strong className="mt-2 block text-2xl text-slate-500">{closedCount}</strong></div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3">Campaign</th>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Unit price</th>
                  <th className="px-5 py-3">Case price</th>
                  <th className="px-5 py-3">Commitments</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((campaign) => {
                  const product = Array.isArray(campaign.products) ? campaign.products[0] : campaign.products;
                  const total = totalCommitments(campaign);
                  return (
                    <tr key={campaign.id} className="table-row-hover border-b border-slate-100 last:border-b-0">
                      <td className="px-5 py-3">
                        <p className="font-black text-slate-900">{campaign.title}</p>
                        <p className="text-xs text-slate-400">{new Date(campaign.created_at).toLocaleDateString("en-CA")}</p>
                      </td>
                      <td className="px-5 py-3 font-semibold text-slate-700">{product?.name || "—"}</td>
                      <td className="px-5 py-3 font-black">{formatMoney(campaign.unit_price)}</td>
                      <td className="px-5 py-3 font-semibold text-slate-600">
                        {campaign.case_price != null ? formatMoney(campaign.case_price) : "—"}
                        {campaign.case_qty ? <span className="ml-1 text-xs text-slate-400">/{campaign.case_qty}개</span> : ""}
                      </td>
                      <td className="px-5 py-3">
                        <strong className="text-base">{total}</strong>
                        <span className="ml-1 text-xs text-slate-400">units</span>
                      </td>
                      <td className="px-5 py-3">
                        {campaign.status === "open" && <span className="badge border-emerald-200 bg-emerald-50 text-emerald-800">Open</span>}
                        {campaign.status === "closed" && <span className="badge border-slate-200 bg-slate-100 text-slate-600">Closed</span>}
                        {campaign.status === "cancelled" && <span className="badge border-red-200 bg-red-50 text-red-700">Cancelled</span>}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link className="btn-secondary min-h-8 px-3 text-xs" href={`/admin/preorders/${campaign.id}`}>
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!list.length && (
            <div className="p-12 text-center">
              <p className="font-bold text-slate-500">No campaigns yet.</p>
              <p className="mt-1 text-sm text-slate-400">Create your first pre-order campaign to start collecting commitments.</p>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
