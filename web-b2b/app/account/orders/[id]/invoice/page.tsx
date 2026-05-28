import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PrintButton } from "./print-button";

export const dynamic = "force-dynamic";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createSupabaseServerClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .eq("customer_id", profile.id)
    .single();
  if (!order) notFound();

  const { data: items } = await supabase.from("order_items").select("*").eq("order_id", id);

  const { data: invoice } = await supabase
    .from("invoices")
    .select("invoice_number, created_at")
    .eq("order_id", id)
    .maybeSingle();

  const invoiceNumber = invoice?.invoice_number || `ORD-${id.slice(0, 8).toUpperCase()}`;
  const invoiceDate = new Date(invoice?.created_at || order.created_at).toLocaleDateString("en-CA", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <>
      <style>{`@media print { .no-print { display: none !important; } body { background: white; } } @page { margin: 20mm; }`}</style>

      <div className="no-print sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
        <a href={`/account/orders/${id}`} className="text-xs font-semibold text-slate-500 hover:text-slate-900">← Back to order</a>
        <PrintButton />
      </div>

      <div className="min-h-screen bg-slate-100 px-4 py-8 print:bg-white print:p-0">
        <div className="mx-auto max-w-3xl overflow-hidden rounded-xl bg-white shadow-lg print:shadow-none print:rounded-none">
          {/* Header */}
          <div className="flex items-start justify-between gap-6 bg-[#166534] px-8 py-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-green-200">Invoice</p>
              <p className="mt-1 font-mono text-2xl font-black text-white">{invoiceNumber}</p>
              <p className="mt-1 text-sm text-green-200">{invoiceDate}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-white">Butterfly Fashion Trading</p>
              <p className="mt-0.5 text-xs text-green-200">178 Bentworth Ave</p>
              <p className="text-xs text-green-200">North York, ON M6A 1P7</p>
              <p className="text-xs text-green-200">Canada</p>
            </div>
          </div>

          {/* Bill to / Order details */}
          <div className="grid gap-0 border-b border-slate-100 sm:grid-cols-2">
            <div className="border-b border-slate-100 px-8 py-5 sm:border-b-0 sm:border-r">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Bill to</p>
              <p className="font-bold text-slate-900">{profile.business_name}</p>
              {profile.contact_name && <p className="text-sm text-slate-600">{profile.contact_name}</p>}
              <p className="text-sm text-slate-600">{profile.email}</p>
              {profile.phone && <p className="text-sm text-slate-600">{profile.phone}</p>}
              {profile.business_address && (
                <p className="mt-1 text-sm text-slate-600">
                  {profile.business_address}<br />
                  {profile.city}, {profile.province} {profile.postal_code}
                </p>
              )}
            </div>
            <div className="px-8 py-5">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Order details</p>
              <div className="grid gap-1.5">
                {[
                  ["Order ID", `#${id.slice(0, 8).toUpperCase()}`],
                  ["Fulfillment", order.delivery_method || "—"],
                  ["Status", order.status],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-semibold text-slate-900">{value}</span>
                  </div>
                ))}
                {order.delivery_method === "Shipping" && order.shipping_address && (
                  <div className="mt-2 text-sm">
                    <p className="text-slate-500">Ship to</p>
                    <p className="font-semibold text-slate-900">{order.shipping_address}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Line items */}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-semibold text-slate-500">
                <th className="px-8 py-3">Item</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Unit price</th>
                <th className="px-8 py-3 text-right">Line total</th>
              </tr>
            </thead>
            <tbody>
              {(items || []).map((item) => (
                <tr key={item.id} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-8 py-3">
                    <p className="font-semibold text-slate-900">{item.product_name_snapshot}</p>
                    {item.sku_snapshot && <p className="text-xs text-slate-400">SKU: {item.sku_snapshot}</p>}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">{item.quantity}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{formatMoney(item.unit_price_snapshot)}</td>
                  <td className="px-8 py-3 text-right font-bold text-slate-900">{formatMoney(item.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="border-t border-slate-200 px-8 py-6">
            <div className="ml-auto max-w-xs">
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span><span>{formatMoney(order.subtotal)}</span>
                </div>
                {Number(order.discount_amount) > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Discount</span><span>−{formatMoney(order.discount_amount)}</span>
                  </div>
                )}
                {Number(order.shipping_fee) > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Shipping</span><span>{formatMoney(order.shipping_fee)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Tax (HST)</span><span>{formatMoney(order.tax_amount)}</span>
                </div>
                <div className="mt-2 flex justify-between border-t border-slate-200 pt-3 text-base font-black text-slate-900">
                  <span>Total</span><span>{formatMoney(order.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 bg-slate-50 px-8 py-4">
            <p className="text-xs text-slate-400">
              Thank you for your business. Questions about this invoice? Contact us at orders@butterfly-fashion.ca.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
