import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { StatusBadge, orderRowTone, orderStatusChip } from "@/components/admin/status-badge";
import { formatMoney } from "@/lib/money";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const admin = createSupabaseAdminClient();
  const { data: orders } = await admin
    .from("orders")
    .select("*, profiles(business_name, contact_name, email)")
    .eq("channel", "b2b")
    .order("created_at", { ascending: false });
  const allOrders = orders || [];

  // QuickBooks invoice numbers, keyed by order, for display and search.
  const { data: invoiceRows } = await admin.from("invoices").select("order_id, invoice_number");
  const invoiceByOrderId = new Map((invoiceRows || []).map((r) => [r.order_id, r.invoice_number as string]));

  // Status tabs with live counts. Filtering happens in-memory off the full B2B list.
  const TABS = [
    "Pending Review",
    "Approved",
    "Payment Link Sent",
    "Paid",
    "Processing",
    "Label Created",
    "Ready for Pickup",
    "Shipped",
    "Completed",
    "Cancelled",
    "Refunded",
  ];
  const tally = new Map<string, number>();
  for (const o of allOrders) tally.set(o.status, (tally.get(o.status) ?? 0) + 1);
  const activeStatus = sp.status && TABS.includes(sp.status) ? sp.status : "";
  const query = (sp.q || "").trim().toLowerCase();
  const orderList = allOrders.filter((o) => {
    if (activeStatus && o.status !== activeStatus) return false;
    if (!query) return true;
    const invoiceNumber = (invoiceByOrderId.get(o.id) || "").toLowerCase();
    return (
      invoiceNumber.includes(query) ||
      o.id.toLowerCase().includes(query) ||
      (o.profiles?.business_name || "").toLowerCase().includes(query) ||
      (o.profiles?.email || "").toLowerCase().includes(query)
    );
  });

  return (
    <>
      <AdminNav />
      <main className="container-shell py-7">
        <div className="mb-5">
          <p className="section-label">Order management</p>
          <h1 className="mt-1 text-3xl font-black text-slate-900">Orders</h1>
          <p className="mt-1.5 text-sm font-medium text-slate-500">
            Review, approve, and create payment links for B2B order requests.
          </p>
        </div>

        <div className="mb-5 flex flex-wrap gap-1.5">
          <Link
            href="/admin/orders"
            className={`badge transition-colors ${
              activeStatus === "" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            All<span className="ml-1.5 opacity-70">{allOrders.length}</span>
          </Link>
          {TABS.map((status) => {
            const count = tally.get(status) ?? 0;
            const active = activeStatus === status;
            return (
              <Link
                key={status}
                href={`/admin/orders?status=${encodeURIComponent(status)}`}
                className={`badge transition-colors ${
                  active
                    ? "border-slate-900 bg-slate-900 text-white"
                    : count
                      ? `${orderStatusChip(status)} hover:opacity-80`
                      : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50"
                }`}
              >
                {status}
                <span className="ml-1.5 opacity-70">{count}</span>
              </Link>
            );
          })}
        </div>

        <form method="get" className="mb-4 flex flex-wrap gap-2">
          {activeStatus && <input type="hidden" name="status" value={activeStatus} />}
          <input
            type="search"
            name="q"
            defaultValue={sp.q || ""}
            placeholder="Search by QuickBooks invoice #, order #, or customer…"
            className="field max-w-md"
          />
          <button type="submit" className="btn-secondary text-sm">Search</button>
          {query && (
            <Link href={activeStatus ? `/admin/orders?status=${encodeURIComponent(activeStatus)}` : "/admin/orders"} className="btn-secondary text-sm">
              Clear
            </Link>
          )}
        </form>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-auto">
            <table className="w-full min-w-230 text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500">
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">QB Inv #</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Order status</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3">Fulfillment</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {orderList.map((order) => (
                  <tr
                    key={order.id}
                    className={`table-row-hover border-b border-slate-100 last:border-b-0 transition-colors ${orderRowTone(order.status)}`}
                  >
                    <td className="px-5 py-3 font-mono text-xs font-black text-slate-700">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-600">
                      {invoiceByOrderId.get(order.id) || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-bold text-slate-900">{order.profiles?.business_name}</p>
                      <p className="text-xs text-slate-500">{order.profiles?.email}</p>
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={order.status} /></td>
                    <td className="px-5 py-3"><StatusBadge status={order.payment_status} type="payment" /></td>
                    <td className="px-5 py-3 text-slate-600">{order.delivery_method || "—"}</td>
                    <td className="px-5 py-3 font-black">{formatMoney(order.total_amount)}</td>
                    <td className="px-5 py-3 text-slate-500 text-xs">
                      {new Date(order.created_at).toLocaleDateString("en-CA")}
                    </td>
                    <td className="px-5 py-3">
                      <Link className="btn-secondary min-h-8 px-3 text-xs" href={`/admin/orders/${order.id}`}>
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!orderList.length && (
            <div className="p-12 text-center">
              <p className="font-bold text-slate-500">No orders match this filter.</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
