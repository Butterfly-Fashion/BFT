import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, Tag, Package, MapPin, Clock, Ruler, Lock, CalendarClock } from "lucide-react";
import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { ProductDetailActions } from "@/components/store/product-detail-actions";
import { ProductImageGallery } from "@/components/store/product-image-gallery";
import { getCurrentProfile } from "@/lib/auth";
import { availabilityStyle } from "@/lib/availability";
import { formatMoney } from "@/lib/money";
import { applyCustomerPrices } from "@/lib/pricing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/env";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("products")
    .select("name, sku, category, description, image_url, case_qty")
    .eq("slug", slug)
    .eq("is_hidden", false)
    .contains("sales_channels", ["b2b"])
    .single();
  if (!data) return { title: "Product" };

  const moq = data.case_qty ? `MOQ ${data.case_qty} units` : "wholesale";
  const title = `${data.name} — ${data.category} Wholesale`;
  const description =
    (data.description?.trim().slice(0, 155)) ||
    `${data.name} (${data.category}) wholesale — Item Code ${data.sku}, ${moq}. Order from Butterfly Fashion Trading, Toronto.`;

  return {
    title,
    description,
    alternates: { canonical: `/products/${slug}` },
    openGraph: {
      title,
      description,
      url: `/products/${slug}`,
      images: data.image_url ? [data.image_url] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = await getCurrentProfile();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_hidden", false)
    .contains("sales_channels", ["b2b"])
    .single();
  if (!data) notFound();
  const [product] = await applyCustomerPrices([data as Product], profile);

  const isApproved = profile?.is_b2b_approved ?? false;
  const isPreorder = product.availability_status === "Manual Confirm";
  const availabilityLabel = isPreorder ? "Pre-order" : product.availability_status;
  const hasDimensions = product.weight_kg || product.box_length_cm || product.box_width_cm || product.box_height_cm;

  // Deep-link approved buyers to the open campaign for this item (RLS hides
  // campaigns from non-approved accounts, so they get the generic /preorders).
  const { data: openCampaign } =
    isPreorder && isApproved
      ? await supabase
          .from("preorder_campaigns")
          .select("id")
          .eq("product_id", data.id)
          .eq("status", "open")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : { data: null };
  const preorderHref = openCampaign ? `/preorders#campaign-${openCampaign.id}` : "/preorders";

  const base = siteUrl();
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    category: product.category,
    ...(product.image_url ? { image: [product.image_url] } : {}),
    ...(product.description ? { description: product.description } : {}),
    brand: { "@type": "Brand", name: "Butterfly Fashion Trading" },
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: base },
      { "@type": "ListItem", position: 2, name: "Products", item: `${base}/products` },
      { "@type": "ListItem", position: 3, name: product.category, item: `${base}/products?category=${encodeURIComponent(product.category)}` },
      { "@type": "ListItem", position: 4, name: product.name, item: `${base}/products/${product.slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Header profile={profile} />
      <main className="container-shell py-4 sm:py-6">
        {/* Back button */}
        <Link
          href={`/products?category=${encodeURIComponent(product.category)}`}
          className="mb-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
        >
          <ChevronLeft size={15} />
          Back to {product.category}
        </Link>

        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap text-xs font-semibold text-slate-500 sm:mb-5">
          <Link className="shrink-0 transition-colors hover:text-slate-900" href="/">Home</Link>
          <ChevronRight size={12} className="shrink-0" />
          <Link className="shrink-0 transition-colors hover:text-slate-900" href="/products">Products</Link>
          <ChevronRight size={12} className="shrink-0" />
          <Link className="shrink-0 transition-colors hover:text-slate-900" href={`/products?category=${encodeURIComponent(product.category)}`}>{product.category}</Link>
          <ChevronRight size={12} className="shrink-0" />
          <span className="max-w-40 truncate font-bold text-slate-800 sm:max-w-none">{product.name}</span>
        </nav>

        <div className="grid gap-6 sm:gap-8 lg:grid-cols-[1fr_460px]">
          {/* Image panel */}
          <ProductImageGallery src={product.image_url} alt={product.name} />

          {/* Info panel */}
          <div className="flex flex-col gap-4">
            {/* Category / SKU / Country */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-500">
                <Tag size={10} />
                {product.category}
              </span>
              <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-500">
                <Package size={10} />
                {product.sku}
              </span>
              {(product as any).country && (
                <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-500">
                  <MapPin size={10} />
                  {(product as any).country}
                </span>
              )}
            </div>

            {/* Name */}
            <h1 className="text-2xl font-black leading-tight text-slate-900 sm:text-3xl">{product.name}</h1>

            {/* Pre-order tag + custom pricing */}
            {(isPreorder || product.has_customer_price) && (
              <div className="flex flex-wrap items-center gap-2">
                {isPreorder && (
                  <span className={`badge ${availabilityStyle(product.availability_status)}`}>
                    {availabilityLabel}
                  </span>
                )}
                {product.has_customer_price && (
                  <span className="badge border-amber-200 bg-amber-50 text-amber-800">
                    Custom B2B Pricing
                  </span>
                )}
              </div>
            )}

            {/* Pre-order CTA — closes the funnel from out-of-stock items */}
            {isPreorder && (
              <Link
                href={preorderHref}
                className="flex items-center justify-between gap-3 rounded-xl border border-(--primary-border) bg-(--primary-light) px-4 py-3 transition-opacity hover:opacity-90"
              >
                <div className="flex items-center gap-2.5">
                  <CalendarClock size={16} className="shrink-0" style={{ color: "var(--primary)" }} />
                  <div>
                    <p className="text-sm font-bold text-slate-900">Available to pre-order</p>
                    <p className="text-xs text-slate-500">Reserve cases now — no payment until we confirm demand.</p>
                  </div>
                </div>
                <span className="shrink-0 text-sm font-black" style={{ color: "var(--primary)" }}>Reserve →</span>
              </Link>
            )}

            {/* Pricing block */}
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-4 py-2.5">
                <p className="text-xs font-semibold text-slate-500">
                  {product.has_customer_price ? "Your B2B price" : "Wholesale pricing"}
                </p>
              </div>
              <div className="divide-y divide-slate-100">
                {isApproved && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Unit price / ea</p>
                    </div>
                    <strong className="text-2xl font-black text-slate-900">{formatMoney(product.display_price)}</strong>
                  </div>
                )}
                {isApproved && product.display_case_price && product.case_qty && (
                  <div className="flex items-center justify-between bg-slate-50 px-4 py-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Case price</p>
                      <p className="text-xs text-slate-400">{product.case_qty} units/case</p>
                    </div>
                    <div className="text-right">
                      <strong className="block text-xl font-black text-slate-900">{formatMoney(product.display_case_price)}</strong>
                      <span className="text-[11px] text-slate-500">
                        {formatMoney(product.display_case_price / product.case_qty)}/ea
                      </span>
                    </div>
                  </div>
                )}
                {isApproved && product.case_qty && (
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <p className="text-xs font-semibold text-slate-500">MOQ (minimum order)</p>
                    <span className="rounded border border-(--primary-border) bg-(--primary-light) px-2.5 py-1 text-sm font-black" style={{ color: "var(--primary)" }}>
                      {product.case_qty} units / 1 case
                    </span>
                  </div>
                )}
                {!isApproved && (
                  <div className="flex items-center gap-3 bg-slate-50 px-4 py-3">
                    <Lock size={14} className="shrink-0 text-slate-400" />
                    <p className="text-sm font-semibold text-slate-500">
                      {profile
                        ? "Case pricing & ordering available after B2B approval"
                        : <><Link href="/login" className="underline" style={{ color: "var(--primary)" }}>Sign in</Link> or <Link href="/register" className="underline" style={{ color: "var(--primary)" }}>register</Link> to order</>
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Lead time / origin */}
            {((product as any).lead_time || (product as any).country) && (
              <div className="flex flex-wrap gap-3">
                {(product as any).lead_time && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <Clock size={12} className="text-slate-400" />
                    {(product as any).lead_time}
                  </div>
                )}
                {(product as any).country && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <MapPin size={12} className="text-slate-400" />
                    {(product as any).country} variant
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            {product.description && (
              <p className="text-sm leading-relaxed text-slate-600">{product.description}</p>
            )}

            {/* Shipping dimensions */}
            {hasDimensions && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <Ruler size={11} />
                  Shipping dimensions (incl. packaging)
                </p>
                <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-700">
                  {product.weight_kg && <span>Weight: {product.weight_kg} kg</span>}
                  {product.box_length_cm && product.box_width_cm && product.box_height_cm && (
                    <span>Box: {product.box_length_cm} × {product.box_width_cm} × {product.box_height_cm} cm</span>
                  )}
                </div>
              </div>
            )}

            {/* CTA */}
            <ProductDetailActions product={product} profile={profile} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
