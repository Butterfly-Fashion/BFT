import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { approveOrderAction, createPaymentLinkAction, updateOrderReviewAction, cancelOrderAction } from "@/app/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { DangerForm } from "@/components/admin/danger-form";
import { StatusBadge } from "@/components/admin/status-badge";
import { CopyPaymentLink } from "@/components/admin/copy-payment-link";
import { requireAdmin } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const admin = createSupabaseAdminClient();
  const { data: order } = await admin.from("orders").select("*, profiles(*)").eq("id", id).single();
  const { data: items } = await admin.from("order_items").select("*").eq("order_id", id);
  if (!order) return null;

  const isPaid = order.status === "Paid" || order.payment_status === "Paid";
  const isCancelled = order.status === "Cancelled";
  const canApprove = order.status === "Pending Review";
  const canCreatePaymentLink = ["Approved", "Payment Link Sent"].includes(order.status);

  return (
    <>
      <AdminNav />
      <main className="container-shell py-6">
        {/* Header */}
        <div className="mb-5">
          <Link href="/admin/orders" className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900">
            <ChevronLeft size={13} /> Back to orders
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="section-label">Order management</p>
              <h1 className="mt-1 text-2xl font-black text-slate-900">
                #{order.id.slice(0, 8).toUpperCase()}
              </h1>
              <div className="mt-2 flex flex-wrap gap-2">
                <StatusBadge status={order.status} />
                <StatusBadge status={order.payment_status} type="payment" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <form action={async () => { "use server"; await approveOrderAction(order.id); }}>
                <button
                  className="btn-primary text-sm"
                  disabled={!canApprove}
                  type="submit"
                  title={canApprove ? "Approve and send payment link" : "Order is not in Pending Review status"}
                >
                  Approve &amp; Send Payment Link
                </button>
              </form>
              <form action={async () => { "use server"; await createPaymentLinkAction(order.id); }}>
                <button
                  className="btn-secondary text-sm"
                  disabled={!canCreatePaymentLink}
                  type="submit"
                  title={canCreatePaymentLink ? "Regenerate payment link" : "Approve the order first"}
                >
                  Resend Payment Link
                </button>
              </form>
              {!isPaid && !isCancelled && (
                <DangerForm
                  action={cancelOrderAction.bind(null, order.id)}
                  confirmMessage={`Cancel order #${order.id.slice(0, 8).toUpperCase()}?\n\nThis will set the status to Cancelled. Paid orders cannot be cancelled this way.`}
                  submitLabel="Cancel order"
                  className="contents"
                />
              )}
            </div>
          </div>
        </div>

        {order.stripe_payment_link && <div className="mb-5"><CopyPaymentLink url={order.stripe_payment_link} /></div>}

        {isPaid && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
            Payment received. This order has been paid — financial fields are read-only.
          </div>
        )}

        <form action={updateOrderReviewAction} className="grid gap-5">
          <input name="order_id" type="hidden" value={order.id} />
          <div className="grid gap-4 lg:grid-cols-[1fr_1.5fr]">
            {/* Customer info */}
            <section className="card p-5">
              <h2 className="mb-3 text-base font-bold text-slate-900">Customer</h2>
              <p className="font-black text-slate-900">{order.profiles.business_name}</p>
              <p className="mt-0.5 text-sm text-slate-600">{order.profiles.contact_name}</p>
              <p className="text-sm text-slate-500">{order.profiles.email}</p>
              {order.profiles.phone && <p className="text-sm text-slate-500">{order.profiles.phone}</p>}
              {order.customer_notes && (
                <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  <p className="mb-1 text-xs font-bold text-slate-400">Customer notes</p>
                  {order.customer_notes}
                </div>
              )}
            </section>

            {/* Adjustments */}
            <section className="card p-5">
              <h2 className="mb-3 text-base font-bold text-slate-900">Review &amp; Adjustments</h2>
              <div className="grid gap-3 md:grid-cols-3">
                <label className="label">
                  Delivery method
                  <select className="field" name="delivery_method" defaultValue={order.delivery_method}>
                    <option>Pickup</option>
                    <option>Shipping</option>
                  </select>
                </label>
                <label className="label">
                  Order status
                  <select className="field" name="status" defaultValue={order.status}>
                    <option>Pending Review</option>
                    <option>Approved</option>
                    <option>Payment Link Sent</option>
                    <option>Paid</option>
                    <option>Processing</option>
                    <option>Label Created</option>
                    <option>Ready for Pickup</option>
                    <option>Shipped</option>
                    <option>Completed</option>
                    <option>Cancelled</option>
                    <option>Refunded</option>
                  </select>
                </label>
                <label className="label">
                  Payment status
                  <select className="field" name="payment_status" defaultValue={order.payment_status}>
                    <option>Unpaid</option>
                    <option>Payment Link Sent</option>
                    <option>Paid</option>
                    <option>Refunded</option>
                    <option>Failed</option>
                  </select>
                </label>
                <label className="label">
                  Shipping ($)
                  <input className="field" name="shipping_fee" defaultValue={order.shipping_fee} step="0.01" type="number" />
                </label>
                <label className="label">
                  Discount ($)
                  <input className="field" name="discount_amount" defaultValue={order.discount_amount} step="0.01" type="number" />
                </label>
                <label className="label">
                  HST ($)
                  <input className="field" name="tax_amount" defaultValue={order.tax_amount} step="0.01" type="number" />
                </label>
                <label className="label md:col-span-3">
                  Shipping address
                  <input className="field" name="shipping_address" defaultValue={order.shipping_address || ""} placeholder="Full shipping address" />
                </label>
                <label className="label md:col-span-3">
                  Admin notes (internal only)
                  <textarea className="field min-h-20" name="admin_notes" defaultValue={order.admin_notes || ""} placeholder="Internal notes — not visible to customer" />
                </label>
              </div>
            </section>
          </div>

          {/* Line items */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-5 py-3">
              <h2 className="text-base font-bold text-slate-900">Order items</h2>
              <p className="mt-0.5 text-xs text-slate-500">Edit quantity and unit price per item. Totals are recalculated on save.</p>
            </div>
            <div className="overflow-auto">
              <table className="w-full min-w-160 text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500">
                    <th className="px-5 py-3">Product</th>
                    <th className="px-5 py-3">Item Code</th>
                    <th className="px-5 py-3">Qty</th>
                    <th className="px-5 py-3">Unit price</th>
                    <th className="px-5 py-3 text-right">Line total</th>
                  </tr>
                </thead>
                <tbody>
                  {(items || []).map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 last:border-b-0">
                      <td className="px-5 py-3 font-semibold text-slate-900">{item.product_name_snapshot}</td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-500">{item.sku_snapshot}</td>
                      <td className="px-5 py-3">
                        <input
                          className="field w-24 text-center"
                          name={`quantity_${item.id}`}
                          defaultValue={item.quantity}
                          min={1}
                          type="number"
                        />
                      </td>
                      <td className="px-5 py-3">
                        <input
                          className="field w-28"
                          name={`unit_price_${item.id}`}
                          defaultValue={item.unit_price_snapshot}
                          step="0.01"
                          min={0}
                          type="number"
                        />
                      </td>
                      <td className="px-5 py-3 text-right font-black">{formatMoney(item.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Totals */}
          <section className="card ml-auto w-full max-w-sm p-5">
            <h2 className="mb-3 text-base font-bold text-slate-900">Order total</h2>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{formatMoney(order.subtotal)}</span></div>
              <div className="flex justify-between text-slate-600"><span>Discount</span><span>−{formatMoney(order.discount_amount)}</span></div>
              <div className="flex justify-between text-slate-600"><span>Shipping</span><span>{formatMoney(order.shipping_fee)}</span></div>
              <div className="flex justify-between text-slate-600"><span>HST</span><span>{formatMoney(order.tax_amount)}</span></div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-black text-slate-900">
                <span>Total</span>
                <span>{formatMoney(order.total_amount)}</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400">Total is recalculated from items when you save.</p>
          </section>

          <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-[#f6f6f3]/95 py-3 backdrop-blur">
            <Link className="btn-secondary" href="/admin/orders">Cancel</Link>
            <button className="btn-primary" type="submit">Save changes</button>
          </div>
        </form>
      </main>
    </>
  );
}
