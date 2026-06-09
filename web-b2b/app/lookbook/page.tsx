import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/store/header";
import { BackToTop } from "@/components/store/back-to-top";
import { getCurrentProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { LookbookItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Lookbook | Butterfly Fashion Trading Wholesale",
  description: "Browse our seasonal campaigns and wholesale product showcases. Fashion-forward inventory for Canadian retailers.",
};

export default async function LookbookPage() {
  const [profile, supabase] = await Promise.all([
    getCurrentProfile(),
    createSupabaseServerClient(),
  ]);

  const { data } = await supabase
    .from("lookbook_items")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  const items = (data || []) as LookbookItem[];

  const seasons = Array.from(
    new Set(items.map((i) => i.season).filter(Boolean))
  ) as string[];

  return (
    <>
      <Header profile={profile} />
      <main>
        {/* Hero */}
        <section className="border-b border-gray-200 bg-white">
          <div className="container-shell py-10 sm:py-14">
            <span className="section-label">Visual catalogue</span>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
              Lookbook
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-500">
              Seasonal campaigns and product showcases. See how our wholesale inventory looks on the shelf — and order the styles your customers will want.
            </p>
            {seasons.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {seasons.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Gallery */}
        <div className="container-shell py-10 sm:py-14">
          {items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 py-20 text-center">
              <p className="font-semibold text-gray-400">Lookbook coming soon.</p>
              <Link
                href="/products"
                className="mt-3 inline-flex text-sm font-semibold"
                style={{ color: "var(--primary)" }}
              >
                Browse catalog →
              </Link>
            </div>
          ) : (
            <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
              {items.map((item) => (
                <div key={item.id} className="mb-4 break-inside-avoid overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                  <div className="relative overflow-hidden bg-gray-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4">
                    {item.season && (
                      <span className="mb-1.5 inline-block rounded-full border border-gray-100 bg-gray-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        {item.season}
                      </span>
                    )}
                    <p className="font-bold text-gray-900">{item.title}</p>
                    {item.description && (
                      <p className="mt-1 text-sm leading-relaxed text-gray-500">{item.description}</p>
                    )}
                    {item.linked_product_slug && (
                      <Link
                        href={`/products/${item.linked_product_slug}`}
                        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold transition-colors"
                        style={{ color: "var(--primary)" }}
                      >
                        View product →
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-10 text-center">
            <Link className="btn-primary px-6 py-2.5 text-sm" href="/products">
              Browse full catalog
            </Link>
          </div>
        </div>
      </main>
      <BackToTop />
    </>
  );
}
