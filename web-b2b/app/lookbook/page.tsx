import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Lock, ShoppingBag } from "lucide-react";
import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { BackToTop } from "@/components/store/back-to-top";
import { getCurrentProfile } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { LookbookItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Wholesale Lookbook",
  description: "Browse our seasonal campaigns and wholesale product showcases.",
  alternates: { canonical: "/lookbook" },
};

type Product = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  unit_price: number;
  category: string;
  availability_status: string;
};

export default async function LookbookPage() {
  const [profile, supabase] = await Promise.all([
    getCurrentProfile(),
    createSupabaseServerClient(),
  ]);

  const isApproved = profile?.is_b2b_approved ?? false;

  const { data: rawItems } = await supabase
    .from("lookbook_items")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  const items = (rawItems || []) as LookbookItem[];

  // Fetch all linked products + category siblings in one query
  const linkedSlugs = items
    .map((i) => i.linked_product_slug)
    .filter(Boolean) as string[];

  const { data: linkedProducts } = linkedSlugs.length
    ? await supabase
        .from("products")
        .select("id, name, slug, image_url, unit_price, category, availability_status")
        .in("slug", linkedSlugs)
        .eq("is_hidden", false)
    : { data: [] };

  const productMap = new Map(
    (linkedProducts || []).map((p) => [p.slug, p as Product])
  );

  // Fetch related products per category (up to 4 per category)
  const categories = [...new Set((linkedProducts || []).map((p: Product) => p.category))];
  const { data: relatedProducts } = categories.length
    ? await supabase
        .from("products")
        .select("id, name, slug, image_url, unit_price, category, availability_status")
        .in("category", categories)
        .eq("is_hidden", false)
        .not("slug", "in", `(${linkedSlugs.map((s) => `"${s}"`).join(",")})`)
        .limit(20)
    : { data: [] };

  // Group related by category
  const relatedByCategory = new Map<string, Product[]>();
  for (const p of (relatedProducts || []) as Product[]) {
    if (!relatedByCategory.has(p.category)) relatedByCategory.set(p.category, []);
    relatedByCategory.get(p.category)!.push(p);
  }

  return (
    <>
      <Header profile={profile} />
      <main>
        {/* Hero */}
        <section className="border-b border-gray-100 bg-white">
          <div className="container-shell py-10 sm:py-14">
            <span className="section-label">Visual catalogue</span>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
              Lookbook
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-500">
              Seasonal campaigns and product showcases. See how our wholesale
              inventory looks on the shelf — and order the styles your customers will want.
            </p>
          </div>
        </section>

        {/* Gallery */}
        <div className="container-shell py-10 sm:py-14">
          {items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 py-20 text-center">
              <p className="font-semibold text-gray-400">Lookbook coming soon.</p>
              <Link href="/products" className="mt-3 inline-flex text-sm font-semibold" style={{ color: "var(--primary)" }}>
                Browse catalog →
              </Link>
            </div>
          ) : (
            <div className="space-y-16">
              {items.map((item, idx) => {
                const primary = item.linked_product_slug
                  ? productMap.get(item.linked_product_slug)
                  : null;
                const related = primary
                  ? (relatedByCategory.get(primary.category) || []).slice(0, 3)
                  : [];
                const isPreorder = primary?.availability_status === "Manual Confirm";

                return (
                  <article
                    key={item.id}
                    className={`flex flex-col gap-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm lg:grid ${
                      idx % 2 === 0 ? "lg:grid-cols-[1fr_420px]" : "lg:grid-cols-[420px_1fr]"
                    }`}
                  >
                    {/* Photo — swap sides on even/odd */}
                    <div
                      className={`relative overflow-hidden bg-gray-50 ${
                        idx % 2 !== 0 ? "lg:order-2" : ""
                      }`}
                      style={{ aspectRatio: "16 / 9" }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                      />
                      {item.season && (
                        <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                          {item.season}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div
                      className={`flex flex-col justify-center gap-5 p-6 sm:p-8 ${
                        idx % 2 !== 0 ? "lg:order-1" : ""
                      }`}
                    >
                      <div>
                        <h2 className="text-xl font-black leading-snug text-gray-900 sm:text-2xl">
                          {item.title}
                        </h2>
                        {item.description && (
                          <p className="mt-2 text-sm leading-relaxed text-gray-500">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Primary product card */}
                      {primary && (
                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                          <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
                            Featured product
                          </p>
                          <div className="flex items-center gap-3">
                            {primary.image_url && (
                              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-white">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={primary.image_url}
                                  alt={primary.name}
                                  className="h-full w-full object-contain p-1"
                                />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-bold text-gray-900">
                                {primary.name}
                              </p>
                              <p className="mt-0.5 text-xs text-gray-500">
                                {isPreorder ? (
                                  <span className="font-semibold text-violet-600">Pre-order</span>
                                ) : isApproved ? (
                                  <span className="font-semibold text-gray-700">
                                    {formatMoney(primary.unit_price)} / pc
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-gray-400">
                                    <Lock size={10} /> Login to see price
                                  </span>
                                )}
                              </p>
                            </div>
                            <Link
                              href={isPreorder ? "/preorders" : `/products/${primary.slug}`}
                              className="flex shrink-0 items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
                              style={{ background: "var(--primary)" }}
                            >
                              {isPreorder ? (
                                <>Pre-order <ArrowRight size={11} /></>
                              ) : (
                                <><ShoppingBag size={11} /> Order</>
                              )}
                            </Link>
                          </div>
                        </div>
                      )}

                      {/* Related products */}
                      {related.length > 0 && (
                        <div>
                          <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                            More like this
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {related.map((rp) => (
                              <Link
                                key={rp.id}
                                href={rp.availability_status === "Manual Confirm" ? "/preorders" : `/products/${rp.slug}`}
                                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
                              >
                                {rp.image_url && (
                                  <div className="h-7 w-7 shrink-0 overflow-hidden rounded-md bg-gray-50">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={rp.image_url} alt={rp.name} className="h-full w-full object-contain" />
                                  </div>
                                )}
                                <span className="max-w-[120px] truncate">{rp.name}</span>
                              </Link>
                            ))}
                            {primary && (
                              <Link
                                href={`/products?category=${encodeURIComponent(primary.category)}`}
                                className="flex items-center gap-1 rounded-lg border border-dashed border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-400 transition-colors hover:border-gray-300 hover:text-gray-600"
                              >
                                See all <ArrowRight size={10} />
                              </Link>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="mt-12 text-center">
            <Link className="btn-primary px-6 py-2.5 text-sm" href="/products">
              Browse full catalog
            </Link>
          </div>
        </div>
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
