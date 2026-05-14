import { approveOrderAction, createPaymentLinkAction, updateOrderReviewAction } from "@/app/actions";
import { AdminNav } from "@/components/admin/admin-nav";
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
  return (
    <>
      <AdminNav />
      <main className="container-shell py-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div><h1 className="text-3xl font-black">Order {order.id.slice(0, 8)}</h1><div className="mt-2 flex flex-wrap gap-2"><StatusBadge status={order.status} /><StatusBadge status={order.payment_status} type="payment" /></div></div>
          <div className="flex gap-3">
            <form action={async () => { "use server"; await approveOrderAction(order.id); }}><button className="btn-primary" disabled={order.status !== "Pending Review"} type="submit">Approve</button></form>
            <form action={async () => { "use server"; await createPaymentLinkAction(order.id); }}><button className="btn-secondary" disabled={!["Approved", "Payment Link Sent"].includes(order.status)} type="submit">Create Payment Link</button></form>
          </div>
        </div>
        {order.stripe_payment_link && <CopyPaymentLink url={order.stripe_payment_link} />}
        <form action={updateOrderReviewAction} className="grid gap-5">
          <input name="order_id" type="hidden" value={order.id} />
          <div className="grid gap-4 lg:grid-cols-[1fr_1.5fr]">
            <section className="card p-4">
              <h2 className="mb-3 text-xl font-black">Customer</h2>
              <p className="font-black">{order.profiles.business_name}</p>
              <p className="text-sm font-semibold text-slate-600">{order.profiles.contact_name} · {order.profiles.email}</p>
              <p className="mt-3 text-sm text-slate-600">{order.customer_notes}</p>
            </section>
            <section className="card grid gap-3 p-4">
              <h2 className="text-xl font-black">Adjustments</h2>
              <div className="grid gap-3 md:grid-cols-3">
                <label className="label">Delivery<select className="field" name="delivery_method" defaultValue={order.delivery_method}><option>Pickup</option><option>Shipping</option></select></label>
                <label className="label">Order status<select className="field" name="status" defaultValue={order.status}><option>Pending Review</option><option>Approved</option><option>Payment Link Sent</option><option>Paid</option><option>Processing</option><option>Label Created</option><option>Ready for Pickup</option><option>Shipped</option><option>Completed</option><option>Cancelled</option><option>Refunded</option></select></label>
                <label className="label">Payment status<select className="field" name="payment_status" defaultValue={order.payment_status}><option>Unpaid</option><option>Payment Link Sent</option><option>Refunded</option><option>Failed</option></select></label>
                <label className="label">Shipping<input className="field" name="shipping_fee" defaultValue={order.shipping_fee} step="0.01" type="number" /></label>
                <label className="label">Discount<input className="field" name="discount_amount" defaultValue={order.discount_amount} step="0.01" type="number" /></label>
                <label className="label">HST<input className="field" name="tax_amount" defaultValue={order.tax_amount} step="0.01" type="number" /></label>
                <label className="label md:col-span-2">Shipping address<input className="field" name="shipping_address" defaultValue={order.shipping_address || ""} /></label>
                <label className="label md:col-span-3">Admin notes<textarea className="field min-h-24" name="admin_notes" defaultValue={order.admin_notes || ""} /></label>
              </div>
            </section>
          </div>
          <section className="overflow-auto rounded border border-slate-200 bg-white">
            <table className="w-full min-w-[760px] text-sm">
              <thead><tr className="border-b bg-[#fafafa] text-left"><th className="p-3">Item</th><th>Qty</th><th>Unit price</th><th className="text-right">Line total</th></tr></thead>
              <tbody>{(items || []).map((item) => <tr className="border-b" key={item.id}><td className="p-3 font-bold">{item.product_name_snapshot}</td><td><input className="field max-w-24" name={`quantity_${item.id}`} defaultValue={item.quantity} type="number" /></td><td><input className="field max-w-32" name={`unit_price_${item.id}`} defaultValue={item.unit_price_snapshot} step="0.01" type="number" /></td><td className="text-right font-black">{formatMoney(item.line_total)}</td></tr>)}</tbody>
            </table>
          </section>
          <section className="card ml-auto grid w-full max-w-sm gap-2 p-4 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><strong>{formatMoney(order.subtotal)}</strong></div>
            <div className="flex justify-between"><span>Discount</span><strong>{formatMoney(order.discount_amount)}</strong></div>
            <div className="flex justify-between"><span>Shipping</span><strong>{formatMoney(order.shipping_fee)}</strong></div>
            <div className="flex justify-between"><span>HST</span><strong>{formatMoney(order.tax_amount)}</strong></div>
            <div className="flex justify-between border-t pt-3 text-xl"><span>Total</span><strong>{formatMoney(order.total_amount)}</strong></div>
          </section>
          <button className="btn-primary w-fit" type="submit">Save review</button>
        </form>
      </main>
    </>
  );
}
