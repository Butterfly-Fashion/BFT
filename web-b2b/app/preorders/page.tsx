import Link from "next/link";
import { CalendarClock, CheckCircle2, ClipboardList, Lock, Package } from "lucide-react";
import { Header } from "@/components/store/header";
import { getCurrentProfile } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { submitPreorderCommitmentAction } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function PreordersPage() {
  const profile = await getCurrentProfile();
  const isApproved = profile?.is_b2b_approved ?? false;
  const supabase = await createSupabaseServerClient();

  const { data: campaigns } = isApproved
    ? await supabase
        .from("preorder_campaigns")
        .select("*, products(name, slug, image_url, sku, category)")
        .eq("status", "open")
        .order("created_at", { ascending: false })
    : { data: null };

  const campaignIds = (campaigns || []).map((c) => c.id);
  const { data: myCommitments } =
    profile && campaignIds.length
      ? await supabase
          .from("preorder_commitments")
          .select("campaign_id, quantity, notes")
          .eq("customer_id", profile.id)
          .in("campaign_id", campaignIds)
      : { data: null };

  const commitMap = new Map((myCommitments || []).map((c) => [c.campaign_id, c]));

  // Group by category
  const list = campaigns || [];
  const groups = new Map<string, typeof list>();
  for (const c of list) {
    const cat = (Array.isArray(c.products) ? c.products[0] : c.products)?.category ?? "Other";
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(c);
  }

  // Summary counts
  const totalCommitted = (myCommitments || []).length;
  const totalCases = (myCommitments || []).reduce((sum, c) => {
    const campaign = list.find((x) => x.id === c.campaign_id);
    const caseQty = campaign?.case_qty ?? 12;
    return sum + Math.round(c.quantity / caseQty);
  }, 0);

  return (
    <>
      <Header profile={profile} />
      <main className="container-shell py-8">
        {/* Page header */}
        <div className="mb-6">
          <p className="mb-1 text-xs font-black uppercase tracking-widest" style={{ color: "var(--primary)" }}>
            Pre-order
          </p>
          <h1 className="text-2xl font-black text-slate-900">Winter Pre-orders</h1>
          <p className="mt-1 text-sm text-slate-500">
            Enter case quantities and submit — we&apos;ll confirm by email once the campaign closes.
          </p>
        </div>

        {/* Not logged in */}
        {!profile && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 py-16 text-center">
            <Lock size={28} className="text-slate-300" />
            <div>
              <p className="font-black text-slate-700">Login required</p>
              <p className="mt-1 text-sm text-slate-500">Sign in with your approved B2B account to view campaigns.</p>
            </div>
            <div className="flex gap-3">
              <Link href="/login" className="btn-primary text-sm">Sign in</Link>
              <Link href="/register" className="btn-secondary text-sm">Request account</Link>
            </div>
          </div>
        )}

        {/* Pending approval */}
        {profile && !isApproved && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-amber-100 bg-amber-50 py-14 text-center">
            <ClipboardList size={28} className="text-amber-400" />
            <div>
              <p className="font-black text-amber-800">Pending approval</p>
              <p className="mt-1 text-sm text-amber-700">Pre-order campaigns will be visible once your account is approved.</p>
            </div>
          </div>
        )}

        {isApproved && (
          <>
            {/* Committed summary bar */}
            {totalCommitted > 0 && (
              <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                <p className="text-sm font-semibold text-emerald-800">
                  {totalCommitted} product{totalCommitted !== 1 ? "s" : ""} committed
                  · {totalCases} case{totalCases !== 1 ? "s" : ""} total
                </p>
                <span className="ml-auto text-xs font-bold text-emerald-600">
                  We&apos;ll confirm by email
                </span>
              </div>
            )}

            {!list.length && (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 py-16 text-center">
                <Package size={28} className="text-slate-300" />
                <p className="font-bold text-slate-500">No open campaigns right now.</p>
                <p className="text-sm text-slate-400">Check back soon.</p>
              </div>
            )}

            {/* Category sections */}
            <div className="space-y-8">
              {[...groups.entries()].map(([category, items]) => (
                <section key={category}>
                  {/* Category header */}
                  <div className="mb-3 flex items-center gap-2">
                    <h2 className="text-sm font-black uppercase tracking-wider text-slate-500">{category}</h2>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-400">
                      {items.length}
                    </span>
                  </div>

                  {/* List */}
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    {items.map((campaign, idx) => {
                      const product = Array.isArray(campaign.products)
                        ? campaign.products[0]
                        : campaign.products;
                      const myCommit = commitMap.get(campaign.id);
                      const caseQty = campaign.case_qty ?? 12;
                      const casePrice = campaign.case_price ?? campaign.unit_price * caseQty;
                      const committedCases = myCommit ? Math.round(myCommit.quantity / caseQty) : 0;
                      const closesAt = campaign.closes_at ? new Date(campaign.closes_at) : null;
                      const isExpired = closesAt ? closesAt < new Date() : false;

                      return (
                        <div
                          key={campaign.id}
                          className={`flex items-start gap-4 px-4 py-4 ${idx !== 0 ? "border-t border-slate-100" : ""} ${myCommit ? "bg-emerald-50/40" : ""}`}
                        >
                          {/* Thumbnail */}
                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
                            {product?.image_url ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={product.image_url}
                                alt={product?.name ?? ""}
                                className="h-full w-full object-contain p-1"
                                loading="lazy"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Package size={16} className="text-slate-300" />
                              </div>
                            )}
                          </div>

                          {/* Product info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                              <div className="min-w-0">
                                <p className="truncate font-bold text-slate-900 leading-snug">
                                  {product?.name ?? campaign.title}
                                </p>
                                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                                  <span className="font-mono text-[11px] text-slate-400">{product?.sku}</span>
                                  {closesAt && !isExpired && (
                                    <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                                      <CalendarClock size={10} />
                                      Closes {closesAt.toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                                    </span>
                                  )}
                                  {isExpired && (
                                    <span className="text-[11px] font-semibold text-red-400">Closed</span>
                                  )}
                                </div>
                              </div>

                              {/* Price — right side */}
                              <div className="shrink-0 text-right">
                                <p className="text-sm font-black text-slate-900">{formatMoney(casePrice)}<span className="text-xs font-normal text-slate-400">/case</span></p>
                                <p className="text-xs text-slate-400">{formatMoney(campaign.unit_price)}/pc · {caseQty} pcs</p>
                              </div>
                            </div>

                            {/* Committed badge OR form */}
                            <div className="mt-3">
                              {myCommit && (
                                <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                                  <CheckCircle2 size={12} className="text-emerald-500" />
                                  Committed: {committedCases} case{committedCases !== 1 ? "s" : ""} ({myCommit.quantity} pcs)
                                </div>
                              )}
                              {!isExpired && (
                                <form action={submitPreorderCommitmentAction} className="flex flex-wrap items-center gap-2">
                                  <input type="hidden" name="campaign_id" value={campaign.id} />
                                  <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 focus-within:border-slate-400">
                                    <input
                                      className="w-14 bg-transparent text-center text-sm font-bold text-slate-900 outline-none"
                                      name="cases"
                                      type="number"
                                      min="1"
                                      step="1"
                                      defaultValue={myCommit ? committedCases : ""}
                                      placeholder="0"
                                      required
                                    />
                                    <span className="text-xs text-slate-400">case{caseQty ? `s ×${caseQty}` : "s"}</span>
                                  </div>
                                  <input type="hidden" name="notes" value="" />
                                  <button
                                    className="rounded-lg px-3 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90"
                                    style={{ background: "var(--primary)" }}
                                    type="submit"
                                  >
                                    {myCommit ? "Update" : "Commit"}
                                  </button>
                                </form>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>

            {list.length > 0 && (
              <p className="mt-8 text-center text-xs text-slate-400">
                All pre-orders are confirmed by our team before any payment is required.
              </p>
            )}
          </>
        )}
      </main>
    </>
  );
}
