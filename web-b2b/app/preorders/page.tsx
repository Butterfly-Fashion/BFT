import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ClipboardList, Lock, Package } from "lucide-react";
import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { getCurrentProfile } from "@/lib/auth";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Pre-orders",
  description:
    "Reserve upcoming wholesale drops before they land. Pre-order campaigns for approved B2B accounts at Butterfly Fashion Trading, Toronto.",
  alternates: { canonical: "/preorders" },
};
import { PreorderList, type PreorderItem } from "./preorder-list";

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

  // Aggregate demand across all buyers (one commitment row per buyer per campaign).
  // Queried with the admin client so the count is server-computed; only the
  // buyer count — never per-buyer data — is sent to the client.
  const { data: allCommits } =
    isApproved && campaignIds.length
      ? await createSupabaseAdminClient()
          .from("preorder_commitments")
          .select("campaign_id")
          .in("campaign_id", campaignIds)
      : { data: null };
  const buyerCountMap = new Map<string, number>();
  for (const c of allCommits || []) {
    buyerCountMap.set(c.campaign_id, (buyerCountMap.get(c.campaign_id) ?? 0) + 1);
  }

  // Flatten campaigns into serializable items for the client search list
  const list = campaigns || [];
  const items: PreorderItem[] = list.map((campaign) => {
    const product = Array.isArray(campaign.products) ? campaign.products[0] : campaign.products;
    const caseQty = campaign.case_qty ?? 12;
    const myCommit = commitMap.get(campaign.id);
    return {
      id: campaign.id,
      title: campaign.title ?? null,
      name: product?.name ?? campaign.title ?? "",
      description: campaign.description?.trim() || null,
      sku: product?.sku ?? null,
      imageUrl: product?.image_url ?? null,
      category: product?.category ?? "Other",
      caseQty,
      casePrice: campaign.case_price ?? campaign.unit_price * caseQty,
      unitPrice: campaign.unit_price,
      closesAt: campaign.closes_at ?? null,
      committedQty: myCommit ? myCommit.quantity : null,
      buyerCount: buyerCountMap.get(campaign.id) ?? 0,
    };
  });

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
            {/* How it works — 3 steps, no payment now */}
            <div className="mb-6 rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <p className="mb-4 text-xs font-black uppercase tracking-widest text-slate-500">How pre-orders work</p>
              <ol className="grid gap-4 sm:grid-cols-3">
                {[
                  { n: 1, t: "Reserve a quantity", d: "Enter how many cases you'd take. No payment now — it's a non-binding commitment." },
                  { n: 2, t: "We confirm demand", d: "Once the campaign closes, we place the wholesale order based on total demand." },
                  { n: 3, t: "We invoice you", d: "You get an email to finalize and pay only the cases we confirm." },
                ].map((s) => (
                  <li key={s.n} className="flex gap-3">
                    <span
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-black text-white"
                      style={{ background: "var(--primary)" }}
                    >
                      {s.n}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{s.t}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{s.d}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

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

            {/* Searchable campaign list */}
            {list.length > 0 && <PreorderList items={items} />}

            {list.length > 0 && (
              <p className="mt-8 text-center text-xs text-slate-400">
                All pre-orders are confirmed by our team before any payment is required.
              </p>
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
