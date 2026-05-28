import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { createPreorderCampaignAction } from "@/app/actions";
import { formatMoney } from "@/lib/money";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NewPreorderCampaignPage() {
  const admin = createSupabaseAdminClient();
  const { data: products } = await admin
    .from("products")
    .select("id, name, sku, unit_price, case_price, case_qty, category")
    .eq("is_hidden", false)
    .order("name");

  return (
    <>
      <AdminNav />
      <main className="container-shell py-7">
        <form action={createPreorderCampaignAction} className="mx-auto max-w-2xl grid gap-5">
          <section className="card p-5">
            <div className="mb-5 border-b border-slate-100 pb-4">
              <p className="text-xs font-black uppercase tracking-widest text-(--primary)">Pre-order management</p>
              <h1 className="mt-1 text-2xl font-black text-slate-900">New Pre-order Campaign</h1>
              <p className="mt-1 text-sm text-slate-500">
                재고 없는 상품에 대해 캠페인을 만들어 고객들의 수요를 미리 파악하세요.
              </p>
            </div>

            <div className="grid gap-4">
              <label className="label">
                Product
                <select className="field" name="product_id" required>
                  <option value="">상품 선택…</option>
                  {(products || []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — 기본가 {formatMoney(p.unit_price)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="label">
                Campaign title
                <input className="field" name="title" required placeholder="e.g. FIFA 2026 Car Flag — Pre-order" />
              </label>

              <label className="label">
                Description (optional)
                <textarea className="field min-h-24" name="description" placeholder="상품 설명, 예상 입고 시기 등" />
              </label>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">Pre-order pricing</p>
                <div className="grid gap-4 md:grid-cols-3">
                  <label className="label">
                    Unit price (낱개) *
                    <input className="field" name="unit_price" type="number" step="0.01" min="0" required placeholder="e.g. 5.99" />
                  </label>
                  <label className="label">
                    Case price (케이스)
                    <input className="field" name="case_price" type="number" step="0.01" min="0" placeholder="e.g. 59.99" />
                  </label>
                  <label className="label">
                    Case qty (개/케이스)
                    <input className="field" name="case_qty" type="number" step="1" min="1" placeholder="e.g. 12" />
                  </label>
                </div>
              </div>

              <label className="label">
                Closes at (optional)
                <input className="field" name="closes_at" type="datetime-local" />
              </label>
            </div>
          </section>

          <div className="flex justify-end gap-3">
            <Link className="btn-secondary" href="/admin/preorders">Cancel</Link>
            <button className="btn-primary" type="submit">Create campaign</button>
          </div>
        </form>
      </main>
    </>
  );
}
