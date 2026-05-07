import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Tag, Package } from "lucide-react";
import { Header } from "@/components/store/header";
import { ProductDetailActions } from "@/components/store/product-detail-actions";
import { ProductImageGallery } from "@/components/store/product-image-gallery";
import { getCurrentProfile } from "@/lib/auth";
import { availabilityStyle } from "@/lib/availability";
import { formatMoney } from "@/lib/money";
import { applyCustomerPrices } from "@/lib/pricing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = await getCurrentProfile();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("products").select("*").eq("slug", slug).eq("is_hidden", false).single();
  if (!data) notFound();
  const [product] = await applyCustomerPrices([data as Product], profile);

  return (
    <>
      <Header profile={profile} />
      <main className="container-shell py-4 sm:py-6">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap text-xs font-semibold text-slate-500 sm:mb-5">
          <Link className="shrink-0 transition-colors hover:text-slate-900" href="/">Home</Link>
          <ChevronRight size={12} className="shrink-0" />
          <Link className="shrink-0 transition-colors hover:text-slate-900" href="/products">Products</Link>
          <ChevronRight size={12} className="shrink-0" />
          <span className="shrink-0 text-slate-400">{product.category}</span>
          <ChevronRight size={12} className="shrink-0" />
          <span className="max-w-40 truncate font-bold text-slate-800 sm:max-w-none">{product.name}</span>
        </nav>

        <div className="grid gap-6 sm:gap-8 lg:grid-cols-[1fr_460px]">
          {/* Image panel */}
          <ProductImageGallery src={product.image_url} alt={product.name} />

          {/* Info panel */}
          <div className="flex flex-col gap-5">
            {/* Category / SKU */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-(--accent)">
                <Tag size={11} />
                {product.category}
              </span>

              <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-500">
                <Package size={10} />
                {product.sku}
              </span>
            </div>

            {/* Name */}
            <h1 className="text-3xl font-black leading-tight text-slate-900">{product.name}</h1>

            {/* Availability */}
            <div className="flex items-center gap-2">
              <span className={`badge ${availabilityStyle(product.availability_status)}`}>
                {product.availability_status}
              </span>
              {product.has_customer_price && (
                <span className="badge border-amber-200 bg-amber-50 text-amber-800">
                  Custom B2B Pricing
                </span>
              )}
            </div>

            {/* Price */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {product.has_customer_price ? "Your B2B price" : "Starting price"}
              </p>
              <strong className="mt-1 block text-4xl font-black text-slate-900">
                {formatMoney(product.display_price)}
              </strong>
              {!product.has_customer_price && (
                <p className="mt-1 text-xs text-slate-500">
                  Final pricing confirmed after order review
                </p>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-sm leading-7 text-slate-600">{product.description}</p>
            )}

            {/* CTA */}
            <ProductDetailActions product={product} profile={profile} />
          </div>
        </div>
      </main>
    </>
  );
}
