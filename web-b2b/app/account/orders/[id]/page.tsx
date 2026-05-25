import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle, ChevronLeft, CreditCard } from "lucide-react";
import { Header } from "@/components/store/header";
import { StatusBadge } from "@/components/admin/status-badge";
import { requireProfile } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BackToTop } from "@/components/store/back-to-top";

export const dynamic = "force-dynamic";

export default async function AccountOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ submitted?: string; payment?: string }>;
}) {
  const profile = await requireProfile();
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: order } = await supabase.from("orders").select("*").eq("id", id).eq("customer_id", profile.id).single();
  if (!order) notFound();
  const { data: items } = await supabase
    .from("order_items")
    .select("*, products(image_url, slug)")
    .eq("order_id", id);
  const isPaid = order.status === "Paid" || order.payment_status === "Paid";
  const isPaymentReady = !!order.stripe_payment_link && !isPaid;

  return (
    <>
      <Header profile={profile} />
      <main className="container-shell py-8">
        <Link
          href="/account/orders"
          className="mb-5 inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 transition-colors hover:text-slate-900"
        >
          <ChevronLeft size={13} /> Back to orders
        </Link>

        {sp.submitted && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <CheckCircle size={18} className="mt-0.5 shrink-0 text-emerald-600" />
            <div>
              <p className="text-sm font-black text-emerald-800">Order request submitted!</p>
              <p className="mt-0.5 text-xs font-semibold text-emerald-700">
                We will review availability, confirm final pricing, and send you a Pay Now link shortly.
              </p>
            </div>
          </div>
        )}

        {sp.payment === "success" && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <CheckCircle size={18} className="mt-0.5 shrink-0 text-emerald-600" />
            <div>
              <p className="text-sm font-black text-emerald-800">Payment received — thank you!</p>
              <p className="mt-0.5 text-xs font-semibold text-emerald-700">
                Your payment was successfully processed. An invoice has been created and sent to your email.
              </p>
            </div>
          </div>
        )}

        <div className="card overflow-hidden">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 bg-slate-50 px-6 py-4">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                {isPaid ? "Invoice" : "Order Request Summary"}
              </p>
              <h1 className="mt-0.5 text-2xl font-black text-slate-900">
                #{order.id.slice(0, 8).toUpperCase()}
              </h1>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {new Date(order.created_at).toLocaleDateString("en-CA", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                {order.delivery_method && <> · {order.delivery_method}</>}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={order.status} />
              <StatusBadge status={order.payment_status} type="payment" />
            </div>
          </div>

          {!isPaid && (
            <div className="border-b border-amber-100 bg-amber-50 px-6 py-3 text-xs font-semibold text-amber-800">
              {isPaymentReady
                ? "Your order is ready — complete your purchase below."
                : "This is not a paid invoice yet. We will confirm availability, final pricing, and send payment instructions shortly."}
            </div>
          )}

          {/* Customer & delivery info */}
          <div className="grid gap-0 border-b border-slate-100 sm:grid-cols-2">
            <div className="border-b border-slate-100 px-6 py-4 sm:border-b-0 sm:border-r">
              <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Bill to</p>
              <p className="font-bold text-slate-900">{profile.business_name}</p>
              {profile.contact_name && <p className="text-xs text-slate-500">{profile.contact_name}</p>}
              <p className="text-xs text-slate-500">{profile.email}</p>
              {profile.phone && <p className="text-xs text-slate-500">{profile.phone}</p>}
              {profile.business_address && <p className="mt-1 text-xs text-slate-500">{profile.business_address}</p>}
            </div>
            {order.delivery_method === "Shipping" && order.shipping_address && (
              <div className="px-6 py-4">
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Ship to</p>
                <p className="text-xs text-slate-700 whitespace-pre-line">{order.shipping_address}</p>
              </div>
            )}
            {order.delivery_method === "Pickup" && (
              <div className="px-6 py-4">
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Pickup location</p>
                <p className="text-xs font-semibold text-slate-700">178 Bentworth Ave, North York, ON M6A 1P7</p>
                <p className="text-xs text-slate-500 mt-0.5">Mon–Fri · 9 AM – 5 PM ET</p>
              </div>
            )}
          </div>

          {/* Items table with product images */}
          <div className="overflow-auto">
            <table className="w-full min-w-120 text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-3">Item</th>
                  <th className="px-6 py-3">Qty</th>
                  <th className="px-6 py-3">Unit price</th>
                  <th className="px-6 py-3 text-right">Line total</th>
                </tr>
              </thead>
              <tbody>
                {(items || []).map((item) => {
                  const imageUrl = (item.products as { image_url?: string } | null)?.image_url;
                  const slug = (item.products as { slug?: string } | null)?.slug;
                  return (
                    <tr key={item.id} className="border-b border-slate-100 last:border-b-0">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          {imageUrl ? (
                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={imageUrl}
                                alt={item.product_name_snapshot}
                                className="h-full w-full object-contain p-1"
                              />
                            </div>
                          ) : (
                            <div className="h-14 w-14 shrink-0 rounded-lg border border-slate-100 bg-slate-100" />
                          )}
                          <div>
                            {slug ? (
                              <Link
                                href={`/products/${slug}`}
                                className="font-bold text-slate-900 hover:text-(--accent)"
                              >
                                {item.product_name_snapshot}
                              </Link>
                            ) : (
                              <span className="font-bold text-slate-900">{item.product_name_snapshot}</span>
                            )}
                            {item.sku_snapshot && (
                              <p className="text-[10px] text-slate-400">SKU: {item.sku_snapshot}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-slate-600">{item.quantity}</td>
                      <td className="px-6 py-3 text-slate-600">{formatMoney(item.unit_price_snapshot)}</td>
                      <td className="px-6 py-3 text-right font-black">{formatMoney(item.line_total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals + Pay Now */}
          <div className="border-t border-slate-200 px-6 py-5">
            <div className="ml-auto max-w-xs">
              <div className="grid gap-1.5 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold">{formatMoney(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Discount</span>
                  <span className="font-semibold">{formatMoney(order.discount_amount)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shipping</span>
                  <span className="font-semibold">{formatMoney(order.shipping_fee)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax (HST)</span>
                  <span className="font-semibold">{formatMoney(order.tax_amount)}</span>
                </div>
                <div className="mt-2 flex justify-between border-t border-slate-200 pt-3 text-xl">
                  <span className="font-black">Total</span>
                  <span className="font-black">{formatMoney(order.total_amount)}</span>
                </div>
              </div>

              {isPaymentReady && (
                <a
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg py-3.5 text-base font-black text-white transition-all hover:opacity-90 active:scale-[0.98]"
                  href={order.stripe_payment_link!}
                  style={{ background: "linear-gradient(135deg, #2554cc 0%, #0f2575 100%)", color: "#fff" }}
                >
                  <CreditCard size={18} />
                  Pay Now
                </a>
              )}

              {isPaid && (
                <div className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-emerald-50 py-3 text-sm font-black text-emerald-700">
                  <CheckCircle size={16} />
                  Payment complete
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <BackToTop />
    </>
  );
}
