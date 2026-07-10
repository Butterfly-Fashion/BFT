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
    "Reserve upcoming wholesale drops before they land. Pre-order campaigns for B2B accounts at Butterfly Fashion Trading, Toronto — registration is free and instant.",
  alternates: { canonical: "/preorders" },
};
import { PreorderList, type PreorderCampaignGroup, type PreorderRow } from "./preorder-list";

export const dynamic = "force-dynamic";

type ItemProduct = { name: string; sku: string | null; image_url: string | null };

export default async function PreordersPage() {
  const profile = await getCurrentProfile();
  const isApproved = profile?.is_b2b_approved ?? false;
  const supabase = await createSupabaseServerClient();

  const { data: campaigns } = isApproved
    ? await supabase
        .from("preorder_campaigns")
        .select("id, title, description, closes_at")
        .eq("status", "open")
        .order("created_at", { ascending: false })
    : { data: null };

  const campaignIds = (campaigns || []).map((c) => c.id);
  const admin = createSupabaseAdminClient();

  // Products in each campaign + my commitments + total buyers (server-only admin reads).
  const [{ data: items }, { data: myCommitments }, { data: allCommits }] =
    campaignIds.length
      ? await Promise.all([
          admin.from("preorder_campaign_items").select("*, products(name, sku, image_url)").in("campaign_id", campaignIds),
          profile
            ? supabase.from("preorder_commitments").select("campaign_id, product_id, quantity").eq("customer_id", profile.id).in("campaign_id", campaignIds)
            : Promise.resolve({ data: null }),
          admin.from("preorder_commitments").select("campaign_id, product_id").in("campaign_id", campaignIds),
        ])
      : [{ data: null }, { data: null }, { data: null }];

  const key = (campaignId: string, productId: string) => `${campaignId}:${productId}`;
  const myCommitMap = new Map((myCommitments || []).map((c) => [key(c.campaign_id, c.product_id), c.quantity]));
  const buyerCountMap = new Map<string, number>();
  for (const c of allCommits || []) {
    const k = key(c.campaign_id, c.product_id);
    buyerCountMap.set(k, (buyerCountMap.get(k) ?? 0) + 1);
  }

  const itemsByCampaign = new Map<string, PreorderRow[]>();
  for (const it of items || []) {
    const product = (Array.isArray(it.products) ? it.products[0] : it.products) as ItemProduct | null;
    const caseQty = it.case_qty ?? 12;
    const k = key(it.campaign_id, it.product_id);
    const row: PreorderRow = {
      campaignId: it.campaign_id,
      productId: it.product_id,
      name: product?.name ?? "",
      sku: product?.sku ?? null,
      imageUrl: product?.image_url ?? null,
      caseQty,
      casePrice: it.case_price ?? Number(it.unit_price || 0) * caseQty,
      unitPrice: Number(it.unit_price || 0),
      committedQty: myCommitMap.has(k) ? Number(myCommitMap.get(k)) : null,
      buyerCount: buyerCountMap.get(k) ?? 0,
    };
    if (!itemsByCampaign.has(it.campaign_id)) itemsByCampaign.set(it.campaign_id, []);
    itemsByCampaign.get(it.campaign_id)!.push(row);
  }

  const groups: PreorderCampaignGroup[] = (campaigns || [])
    .map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description?.trim() || null,
      closesAt: c.closes_at ?? null,
      items: itemsByCampaign.get(c.id) ?? [],
    }))
    .filter((g) => g.items.length > 0);

  const list = groups;

  // Summary counts
  const totalCommitted = (myCommitments || []).length;
  const totalCases = (myCommitments || []).reduce((sum, c) => {
    const it = (items || []).find((x) => x.campaign_id === c.campaign_id && x.product_id === c.product_id);
    const caseQty = it?.case_qty ?? 12;
    return sum + Math.round(Number(c.quantity) / caseQty);
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
          <h1 className="text-2xl font-black text-slate-900">Pre-orders</h1>
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
              <p className="mt-1 text-sm text-slate-500">Sign in with your B2B account to view campaigns — registration is free and instant.</p>
            </div>
            <div className="flex gap-3">
              <Link href="/login" className="btn-primary text-sm">Sign in</Link>
              <Link href="/register" className="btn-secondary text-sm">Create account</Link>
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
            {list.length > 0 && <PreorderList campaigns={list} />}

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
