import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { approveOrderAction, createPaymentLinkAction, updateOrderReviewAction, cancelOrderAction, saveInvoiceRefAction } from "@/app/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { DangerForm } from "@/components/admin/danger-form";
import { StatusBadge } from "@/components/admin/status-badge";
import { CopyPaymentLink } from "@/components/admin/copy-payment-link";
import { ShippingLabel } from "@/components/admin/shipping-label";
import { OrderEditor } from "@/components/admin/order-editor";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ invoice_error?: string; order_error?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { invoice_error, order_error } = await searchParams;
  const admin = createSupabaseAdminClient();
  const { data: order } = await admin.from("orders").select("*, profiles(*)").eq("id", id).single();
  const { data: items } = await admin.from("order_items").select("*").eq("order_id", id);
  if (!order) return null;

  // Look up current product images so the editor can show a thumbnail per line item.
  const productIds = [...new Set((items || []).map((i) => i.product_id).filter(Boolean))] as string[];
  const { data: prodImages } = productIds.length
    ? await admin.from("products").select("id, image_url").in("id", productIds)
    : { data: [] as { id: string; image_url: string | null }[] };
  const imageByProductId = new Map((prodImages || []).map((p) => [p.id, p.image_url]));

  // Existing QuickBooks invoice reference for this order, if recorded.
  const { data: invoice } = await admin.from("invoices").select("invoice_number, pdf_url").eq("order_id", id).maybeSingle();

  const customer = Array.isArray(order.profiles) ? order.profiles[0] : order.profiles;

  const isPaid = order.status === "Paid" || order.payment_status === "Paid";
  const isCancelled = order.status === "Cancelled";
  const canApprove = order.status === "Pending Review";
  const canCreatePaymentLink = ["Approved", "Payment Link Sent", "Ready for Pickup"].includes(order.status);

  // Curated lifecycle stages (replaces the old 11-option list). Legacy statuses on an
  // existing order (e.g. Approved/Processing/Label Created) stay selectable so nothing breaks.
  const STATUS_STAGES = ["Pending Review", "Payment Link Sent", "Paid", "Ready for Pickup", "Shipped", "Completed", "Cancelled", "Refunded"];
  const statusOptions = STATUS_STAGES.includes(order.status) ? STATUS_STAGES : [order.status, ...STATUS_STAGES];

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
              {invoice?.invoice_number && (
                <p className="mt-1 font-mono text-sm font-semibold text-slate-600">
                  QuickBooks Invoice #{invoice.invoice_number}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={order.status} />
                <StatusBadge status={order.payment_status} type="payment" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/admin/orders/${order.id}/invoice`} target="_blank" className="btn-secondary text-sm">
                Print invoice
              </Link>
              <form action={async () => { "use server"; await approveOrderAction(order.id); }}>
                <button
                  className="btn-primary text-sm"
                  disabled={!canApprove}
                  type="submit"
                  title={canApprove ? "Approve and send a payment request" : "Order is not in Pending Review status"}
                >
                  Approve &amp; Send Payment Request
                </button>
              </form>
              <form action={async () => { "use server"; await createPaymentLinkAction(order.id); }}>
                <button
                  className="btn-secondary text-sm"
                  disabled={!canCreatePaymentLink}
                  type="submit"
                  title={canCreatePaymentLink ? "Resend the payment request" : "Approve the order first"}
                >
                  Resend Payment Request
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

        {order_error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {order_error}
          </div>
        )}

        {order.stripe_payment_link && <div className="mb-5"><CopyPaymentLink url={order.stripe_payment_link} /></div>}

        {isPaid && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
            Payment received. This order has been paid — financial fields are read-only.
          </div>
        )}

        <div className="mb-5">
          <ShippingLabel
            orderId={order.id}
            deliveryMethod={order.delivery_method}
            labelUrl={order.shippo_label_url ?? null}
            trackingNumber={order.tracking_number ?? null}
            trackingUrl={order.tracking_url ?? null}
            carrier={order.carrier ?? null}
            orderShippingAddress={order.shipping_address ?? null}
            defaultAddress={{
              name: customer?.business_name || customer?.contact_name || "",
              street: customer?.business_address || "",
              city: customer?.city || "",
              province: customer?.province || "",
              postal: customer?.postal_code || "",
              country: /^can/i.test(customer?.country || "") ? "CA" : (customer?.country || "CA").slice(0, 2).toUpperCase(),
            }}
          />
        </div>

        <form action={updateOrderReviewAction} className="grid gap-5">
          <input name="order_id" type="hidden" value={order.id} />
          <div className="grid gap-4 lg:grid-cols-[1fr_1.5fr]">
            {/* Customer info */}
            <section className="card p-5">
              <h2 className="mb-3 text-base font-bold text-slate-900">Customer</h2>
              {customer ? (
                <>
                  <p className="font-black text-slate-900">{customer.business_name}</p>
                  <p className="mt-0.5 text-sm text-slate-600">{customer.contact_name}</p>
                  <p className="text-sm text-slate-500">{customer.email}</p>
                  {customer.phone && <p className="text-sm text-slate-500">{customer.phone}</p>}
                  <Link href={`/admin/customers/${order.customer_id}`} className="mt-2 inline-block text-xs font-semibold" style={{ color: "var(--primary)" }}>
                    View customer →
                  </Link>
                </>
              ) : (
                <p className="text-sm text-slate-400 italic">Customer profile not found (ID: {order.customer_id?.slice(0, 8)})</p>
              )}
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
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
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
                  Payment method
                  <select className="field" name="payment_method" defaultValue={order.payment_method || ""}>
                    <option value="">— Not set (defaults to Stripe) —</option>
                    <option>Stripe</option>
                    <option>Card by Text</option>
                    <option>E-Transfer</option>
                    <option>Pay at Pickup</option>
                    <option>Cash</option>
                    <option>Bank Transfer</option>
                    <option>Card (in-person)</option>
                  </select>
                  <span className="mt-1 text-xs text-slate-400">
                    Save changes here first — the payment request sent below follows this method.
                    &quot;Pay at Pickup&quot; only works for Pickup orders (no charge collected in advance).
                  </span>
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

          {/* Line items + pricing + live totals */}
          <OrderEditor
            initialItems={(items || []).map((item) => ({
              key: item.id,
              product_id: item.product_id ?? null,
              name: item.product_name_snapshot,
              sku: item.sku_snapshot ?? null,
              quantity: Number(item.quantity),
              unit_price: Number(item.unit_price_snapshot),
              image_url: item.product_id ? imageByProductId.get(item.product_id) ?? null : null,
            }))}
            initialShipping={order.shipping_fee != null ? Number(order.shipping_fee) : null}
            initialTax={Number(order.tax_amount) || 0}
            initialDiscount={Number(order.discount_amount) || 0}
            initialTotalOverride={order.total_override != null ? Number(order.total_override) : null}
            paid={isPaid}
          />

          <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-[#f6f6f3]/95 py-3 backdrop-blur">
            <Link className="btn-secondary" href="/admin/orders">Cancel</Link>
            <button className="btn-primary" type="submit">Save changes</button>
          </div>
        </form>

        {/* QuickBooks invoice reference — kept outside the edit form so it saves independently */}
        <section className="card mt-5 p-5">
          <h2 className="text-base font-bold text-slate-900">QuickBooks invoice</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Download the invoice PDF from QuickBooks and upload it here. It is shown to the customer on their order page. Leave everything blank and save to remove it.
          </p>
          {invoice_error && (
            <p className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
              The PDF couldn&apos;t be uploaded. Make sure it&apos;s a PDF under 10 MB and try again.
            </p>
          )}
          <form action={saveInvoiceRefAction} encType="multipart/form-data" className="mt-3 grid gap-3">
            <input name="order_id" type="hidden" value={order.id} />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="label">
                Invoice #
                <input className="field" name="invoice_number" defaultValue={invoice?.invoice_number || ""} placeholder="e.g. 1042" />
              </label>
              <label className="label">
                Upload QuickBooks PDF
                <input className="field" type="file" name="pdf_file" accept="application/pdf" />
              </label>
            </div>
            <label className="label">
              Or paste a link instead (optional)
              <input className="field" name="pdf_url" defaultValue={invoice?.pdf_url || ""} placeholder="https://…" />
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <button className="btn-primary text-sm" type="submit">Save invoice</button>
              {invoice?.pdf_url && (
                <a href={invoice.pdf_url} target="_blank" rel="noreferrer" className="text-xs font-semibold" style={{ color: "var(--primary)" }}>
                  Open saved invoice ({invoice.invoice_number}) →
                </a>
              )}
            </div>
          </form>
        </section>
      </main>
    </>
  );
}
