import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { PrintButton } from "@/components/admin/print-button";

export const dynamic = "force-dynamic";

const BUSINESS = {
  name: "Butterfly Fashion Trading",
  address: "178 Bentworth Ave, North York, ON M6A 1P7",
  phone: "416-785-5999",
  email: "orders@butterfly-fashion.ca",
};

export default async function OrderInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const admin = createSupabaseAdminClient();
  const { data: order } = await admin.from("orders").select("*, profiles(*)").eq("id", id).single();
  const { data: items } = await admin.from("order_items").select("*").eq("order_id", id);
  if (!order) return null;

  // Product photos per line item so warehouse staff can match items to stock quickly.
  const productIds = [...new Set((items || []).map((i) => i.product_id).filter(Boolean))] as string[];
  const { data: prodImages } = productIds.length
    ? await admin.from("products").select("id, image_url").in("id", productIds)
    : { data: [] as { id: string; image_url: string | null }[] };
  const imageByProductId = new Map((prodImages || []).map((p) => [p.id, p.image_url]));

  const { data: invoice } = await admin.from("invoices").select("invoice_number, pdf_url").eq("order_id", id).maybeSingle();

  const customer = Array.isArray(order.profiles) ? order.profiles[0] : order.profiles;
  const isPaid = order.status === "Paid" || order.payment_status === "Paid";
  const title = isPaid ? "INVOICE" : "PRELIMINARY INVOICE";
  const created = order.created_at ? new Date(order.created_at).toLocaleDateString("en-CA") : "";

  return (
    <main className="mx-auto max-w-3xl px-6 py-8 print:px-0 print:py-0">
      {/* Toolbar — hidden when printing */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href={`/admin/orders/${order.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900">
          <ChevronLeft size={13} /> Back to order
        </Link>
        <PrintButton />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-8 print:rounded-none print:border-0 print:p-0">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-xl font-black text-slate-900">{BUSINESS.name}</h1>
            <p className="mt-1 text-sm text-slate-600">{BUSINESS.address}</p>
            <p className="text-sm text-slate-600">{BUSINESS.phone} · {BUSINESS.email}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-black tracking-wide text-slate-900">{title}</p>
            <p className="mt-1 text-sm text-slate-600">#{order.id.slice(0, 8).toUpperCase()}</p>
            {invoice?.invoice_number && (
              <p className="text-sm font-mono font-semibold text-slate-700">QB Invoice #{invoice.invoice_number}</p>
            )}
            {created && <p className="text-sm text-slate-500">{created}</p>}
            <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">{order.delivery_method}</p>
          </div>
        </div>

        {/* Bill to */}
        <div className="grid gap-4 border-b border-slate-200 py-6 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Bill to</p>
            {customer ? (
              <>
                <p className="font-black text-slate-900">{customer.business_name}</p>
                {customer.contact_name && <p className="text-sm text-slate-600">{customer.contact_name}</p>}
                {customer.business_address && <p className="text-sm text-slate-600">{customer.business_address}</p>}
                <p className="text-sm text-slate-600">
                  {[customer.city, customer.province, customer.postal_code].filter(Boolean).join(", ")}
                </p>
                {customer.email && <p className="text-sm text-slate-600">{customer.email}</p>}
              </>
            ) : (
              <p className="text-sm italic text-slate-400">Customer profile not found</p>
            )}
          </div>
          {order.delivery_method === "Shipping" && order.shipping_address && (
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Ship to</p>
              <p className="text-sm text-slate-600">{order.shipping_address}</p>
            </div>
          )}
        </div>

        {/* Items — includes a photo column so items are easy to pull from stock */}
        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
              <th className="py-2"></th>
              <th className="py-2">Product</th>
              <th className="py-2">Item Code</th>
              <th className="py-2 text-center">Qty</th>
              <th className="py-2 text-right">Unit price</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {(items || []).map((item) => {
              const imageUrl = item.product_id ? imageByProductId.get(item.product_id) : null;
              return (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="py-2.5 pr-3">
                    <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded border border-slate-200 bg-slate-50">
                      {imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imageUrl} alt="" className="h-full w-full object-contain" />
                      ) : (
                        <span className="text-[9px] font-bold text-slate-300">N/A</span>
                      )}
                    </span>
                  </td>
                  <td className="py-2.5 font-semibold text-slate-900">{item.product_name_snapshot}</td>
                  <td className="py-2.5 font-mono text-xs text-slate-500">{item.sku_snapshot}</td>
                  <td className="py-2.5 text-center text-base font-black text-slate-900">{item.quantity}</td>
                  <td className="py-2.5 text-right">{formatMoney(Number(item.unit_price_snapshot))}</td>
                  <td className="py-2.5 text-right font-bold">{formatMoney(Number(item.line_total))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-4 ml-auto w-full max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{formatMoney(Number(order.subtotal))}</span></div>
          {Number(order.discount_amount) > 0 && (
            <div className="flex justify-between text-slate-600"><span>Discount</span><span>−{formatMoney(Number(order.discount_amount))}</span></div>
          )}
          <div className="flex justify-between text-slate-600"><span>Shipping</span><span>{formatMoney(Number(order.shipping_fee))}</span></div>
          <div className="flex justify-between text-slate-600"><span>HST</span><span>{formatMoney(Number(order.tax_amount))}</span></div>
          <div className="flex justify-between border-t border-slate-300 pt-2 text-base font-black text-slate-900">
            <span>Total</span><span>{formatMoney(Number(order.total_amount))}</span>
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-8 border-t border-slate-200 pt-4 text-xs text-slate-500">
          {isPaid ? (
            <p className="font-bold text-emerald-700">PAID — thank you for your business.</p>
          ) : (
            <p>This is a preliminary invoice. Final pricing and availability are confirmed before a payment link is sent; no payment is due yet.</p>
          )}
        </div>
      </div>
    </main>
  );
}
