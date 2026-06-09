import Link from "next/link";
import { CalendarClock, CheckCircle2, ClipboardList, Lock } from "lucide-react";
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

  return (
    <>
      <Header profile={profile} />
      <main className="container-shell py-8">
        {/* Header */}
        <div className="mb-8 border-b border-slate-100 pb-6">
          <p className="mb-1 text-xs font-black uppercase tracking-widest text-(--primary)">Pre-order</p>
          <h1 className="text-3xl font-black text-slate-900">Pre-order Campaigns</h1>
          <p className="mt-2 text-sm text-slate-500">
            Reserve upcoming stock before it arrives. Submit your case quantities and we&apos;ll confirm
            your order by email once the campaign closes.
          </p>
        </div>

        {/* Not logged in */}
        {!profile && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 py-16 text-center">
            <Lock size={32} className="text-slate-300" />
            <div>
              <p className="font-black text-slate-700">Login required</p>
              <p className="mt-1 text-sm text-slate-500">
                Sign in with your approved B2B account to view and join pre-order campaigns.
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/login" className="btn-primary text-sm">Sign in</Link>
              <Link href="/register" className="btn-secondary text-sm">Request account</Link>
            </div>
          </div>
        )}

        {/* Pending approval */}
        {profile && !isApproved && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-amber-100 bg-amber-50 py-16 text-center">
            <ClipboardList size={32} className="text-amber-400" />
            <div>
              <p className="font-black text-amber-800">Pending approval</p>
              <p className="mt-1 text-sm text-amber-700">
                Your B2B account is under review. Pre-order campaigns will be visible once approved.
              </p>
            </div>
          </div>
        )}

        {/* Campaigns grid */}
        {isApproved && (
          <>
            {!campaigns?.length && (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 py-16 text-center">
                <ClipboardList size={32} className="text-slate-300" />
                <p className="font-bold text-slate-500">No open campaigns right now.</p>
                <p className="text-sm text-slate-400">Check back soon — new campaigns will appear here.</p>
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {(campaigns || []).map((campaign) => {
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
                    className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
                  >
                    {/* Image */}
                    {product?.image_url && (
                      <div className="aspect-video overflow-hidden bg-slate-50">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-full w-full object-contain p-4"
                        />
                      </div>
                    )}

                    <div className="flex flex-1 flex-col p-5">
                      {/* SKU + category */}
                      <div className="mb-2 flex items-center gap-2">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-black tracking-wider text-slate-500">
                          {product?.sku}
                        </span>
                        {product?.category && (
                          <span className="text-[11px] text-slate-400">{product.category}</span>
                        )}
                      </div>

                      {/* Title */}
                      <h2 className="text-base font-black leading-snug text-slate-900">
                        {product?.name ?? campaign.title}
                      </h2>

                      {/* Closes-at badge */}
                      {closesAt && (
                        <div className={`mt-2 flex items-center gap-1.5 text-xs font-semibold ${isExpired ? "text-red-500" : "text-amber-600"}`}>
                          <CalendarClock size={12} />
                          {isExpired
                            ? "Campaign closed"
                            : `Closes ${closesAt.toLocaleDateString("en-CA", { month: "short", day: "numeric" })}`}
                        </div>
                      )}

                      {/* Pricing table */}
                      <div className="mt-4 grid gap-1 rounded-xl bg-slate-50 p-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Unit price</span>
                          <span className="font-black text-slate-900">{formatMoney(campaign.unit_price)}<span className="ml-0.5 text-xs font-normal text-slate-400">/pc</span></span>
                        </div>
                        <div className="flex justify-between border-t border-slate-100 pt-1">
                          <span className="text-slate-500">Per case <span className="text-slate-400">({caseQty} pcs)</span></span>
                          <span className="font-black text-slate-900">{formatMoney(casePrice)}</span>
                        </div>
                      </div>

                      {/* Already committed */}
                      {myCommit && (
                        <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm">
                          <CheckCircle2 size={14} className="shrink-0 text-emerald-500" />
                          <span className="font-semibold text-emerald-800">
                            Committed: {committedCases} case{committedCases !== 1 ? "s" : ""}{" "}
                            <span className="font-normal text-emerald-600">({myCommit.quantity} pcs · {formatMoney(committedCases * casePrice)})</span>
                          </span>
                        </div>
                      )}

                      {/* Order form */}
                      {!isExpired && (
                        <form action={submitPreorderCommitmentAction} className="mt-4 grid gap-3">
                          <input type="hidden" name="campaign_id" value={campaign.id} />

                          <label className="label">
                            {myCommit ? "Update quantity" : "Number of cases"}
                            <div className="relative">
                              <input
                                className="field pr-28"
                                name="cases"
                                type="number"
                                min="1"
                                step="1"
                                defaultValue={myCommit ? committedCases : ""}
                                placeholder="e.g. 2"
                                required
                              />
                              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                                × {caseQty} pcs = {formatMoney(casePrice)}/case
                              </span>
                            </div>
                          </label>

                          <label className="label">
                            Notes <span className="font-normal text-slate-400">(optional)</span>
                            <input
                              className="field"
                              name="notes"
                              type="text"
                              defaultValue={myCommit?.notes ?? ""}
                              placeholder="Color, size, or special requests"
                            />
                          </label>

                          <button className="btn-primary w-full" type="submit">
                            {myCommit ? "Update commitment" : "Submit pre-order"}
                          </button>

                          {!myCommit && (
                            <p className="text-center text-xs text-slate-400">
                              We&apos;ll confirm your order by email once the campaign closes.
                            </p>
                          )}
                        </form>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </>
  );
}
