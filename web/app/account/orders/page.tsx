import Link from "next/link";
import { ClipboardList, Package, CreditCard, ArrowRight, Truck, Store } from "lucide-react";
import { Header } from "@/components/store/header";
import { StatusBadge } from "@/components/admin/status-badge";
import { requireProfile } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BackToTop } from "@/components/store/back-to-top";

export const dynamic = "force-dynamic";

export default async function AccountOrdersPage() {
  const profile = await requireProfile();
  const supabase = await createSupabaseServerClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("*, order_items(product_name_snapshot, quantity, unit_price_snapshot, products(image_url))")
    .eq("customer_id", profile.id)
    .order("created_at", { ascending: false });

  const orderList = orders || [];

  return (
    <>
      <Header profile={profile} />
      <main className="container-shell py-8">
        <div className="mb-6 flex items-end justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <p className="mb-1 text-xs font-black uppercase tracking-widest text-(--accent)">My account</p>
            <h1 className="flex items-center gap-2.5 text-3xl font-black text-slate-900">
              <ClipboardList size={26} />
              My Orders
            </h1>
          </div>
          <Link className="btn-primary text-xs text-white" href="/products">
            + New Order
          </Link>
        </div>

        {orderList.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-14 text-center">
            <Package size={36} className="mx-auto mb-4 text-slate-300" />
            <p className="text-lg font-black text-slate-500">No orders yet</p>
            <p className="mt-1.5 text-sm font-medium text-slate-400">
              Browse our catalog and submit your first B2B order request.
            </p>
            <Link className="btn-primary mt-5 inline-flex text-white" href="/products">
              Browse products
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {orderList.map((order) => {
              const isPaid = order.payment_status === "Paid";
              const canPayNow = !!order.stripe_payment_link && !isPaid;
              const items = (order.order_items as Array<{
                product_name_snapshot: string;
                quantity: number;
                unit_price_snapshot: number;
                products: { image_url?: string } | null;
              }>) || [];
              const previewItems = items.slice(0, 4);
              const extraCount = items.length - previewItems.length;

              return (
                <div
                  key={order.id}
                  className="card relative overflow-hidden transition-shadow hover:shadow-md"
                >
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="absolute inset-0 z-10 focus:outline-none focus:ring-2 focus:ring-(--primary) focus:ring-offset-2"
                    aria-label={`View order ${order.id.slice(0, 8).toUpperCase()}`}
                  />

                  {/* Card header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3.5">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-mono text-sm font-black text-slate-800">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {new Date(order.created_at).toLocaleDateString("en-CA", {
                            year: "numeric", month: "short", day: "numeric",
                          })}
                          {order.delivery_method && (
                            <span className="ml-1.5 inline-flex items-center gap-1">
                              {order.delivery_method === "Shipping" ? <Truck size={10} /> : <Store size={10} />}
                              {order.delivery_method}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <StatusBadge status={order.status} />
                        <StatusBadge status={order.payment_status} type="payment" />
                      </div>
                    </div>
                    <p className="text-xl font-black text-slate-900">{formatMoney(order.total_amount)}</p>
                  </div>

                  {/* Product previews */}
                  <div className="flex items-center gap-3 px-5 py-4">
                    <div className="flex flex-1 flex-wrap gap-2">
                      {previewItems.map((item, i) => {
                        const imgUrl = item.products?.image_url;
                        return (
                          <div key={i} className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2 text-xs">
                            {imgUrl && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={imgUrl}
                                alt={item.product_name_snapshot}
                                className="h-9 w-9 rounded object-contain"
                              />
                            )}
                            <div>
                              <p className="max-w-36 truncate font-bold text-slate-800">{item.product_name_snapshot}</p>
                              <p className="text-slate-400">
                                ×{item.quantity} · {formatMoney(item.unit_price_snapshot)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      {extraCount > 0 && (
                        <div className="flex items-center rounded-lg border border-dashed border-slate-200 px-3 py-2 text-xs font-semibold text-slate-400">
                          +{extraCount} more item{extraCount > 1 ? "s" : ""}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="shrink-0">
                      {canPayNow ? (
                        <a
                          href={order.stripe_payment_link!}
                          className="relative z-20 flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-black text-white shadow transition-opacity hover:opacity-90"
                          style={{ background: "linear-gradient(135deg, #2554cc 0%, #0f2575 100%)", color: "#fff" }}
                        >
                          <CreditCard size={14} />
                          Pay Now
                        </a>
                      ) : (
                        <Link
                          href={`/account/orders/${order.id}`}
                          className="relative z-20 flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                        >
                          View details <ArrowRight size={13} />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <BackToTop />
    </>
  );
}
