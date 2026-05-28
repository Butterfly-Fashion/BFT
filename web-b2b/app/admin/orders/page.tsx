import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { StatusBadge, orderRowTone } from "@/components/admin/status-badge";
import { formatMoney } from "@/lib/money";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const admin = createSupabaseAdminClient();
  let query = admin
    .from("orders")
    .select("*, profiles(business_name, contact_name, email)")
    .order("created_at", { ascending: false });
  if (sp.status) query = query.eq("status", sp.status);
  const { data: orders } = await query;
  const orderList = orders || [];

  return (
    <>
      <AdminNav />
      <main className="container-shell py-7">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="section-label">Order management</p>
            <h1 className="mt-1 text-3xl font-black text-slate-900">Orders</h1>
            <p className="mt-1.5 text-sm font-medium text-slate-500">
              Review, approve, and create payment links for B2B order requests.
            </p>
          </div>
          <form className="flex items-end gap-2">
            <label className="label">
              Filter by status
              <select className="field w-48" name="status" defaultValue={sp.status || ""}>
                <option value="">All statuses</option>
                <option>Pending Review</option>
                <option>Approved</option>
                <option>Payment Link Sent</option>
                <option>Paid</option>
                <option>Processing</option>
                <option>Completed</option>
                <option>Cancelled</option>
                <option>Refunded</option>
              </select>
            </label>
            <button className="btn-primary text-xs" type="submit">Filter</button>
          </form>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-auto">
            <table className="w-full min-w-230 text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500">
                  <th className="px-5 py-3">Order</th>
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
