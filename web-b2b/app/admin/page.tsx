import Link from "next/link";
import { TrendingUp, Clock, CheckCircle, Users, Package, DollarSign } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatMoney } from "@/lib/money";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const admin = createSupabaseAdminClient();
  const [{ data: orders }, { count: customers }, { count: products }, leadsRes, approvalsRes] =
    await Promise.all([
      admin.from("orders").select("*, profiles(business_name,email)").eq("channel", "b2b").order("created_at", { ascending: false }),
      admin.from("profiles").select("*", { count: "exact", head: true }),
      admin.from("products").select("*", { count: "exact", head: true }).eq("is_hidden", false),
      admin.from("wholesale_leads").select("id", { count: "exact", head: true }).eq("status", "New"),
      admin.from("profiles").select("id", { count: "exact", head: true }).eq("is_b2b_approved", false).eq("role", "customer"),
    ]);
  const newLeads = leadsRes?.count ?? 0;
  const pendingApprovals = approvalsRes?.count ?? 0;

  const orderList = orders || [];
  let revenue = 0;
  let requestedValue = 0;
  let pendingCount = 0;
  let approvedCount = 0;
  for (const o of orderList) {
    const amount = Number(o.total_amount || 0);
    requestedValue += amount;
    if (o.status === "Paid") revenue += amount;
    if (o.status === "Pending Review") pendingCount++;
    if (o.status === "Approved") approvedCount++;
  }

  // Monthly chart data
  const monthBuckets = new Map<string, { label: string; orders: number; revenue: number }>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthBuckets.set(key, { label: d.toLocaleString("en-CA", { month: "short" }), orders: 0, revenue: 0 });
  }
  for (const o of orderList) {
    const d = new Date(o.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const b = monthBuckets.get(key);
    if (!b) continue;
    b.orders += 1;
    if (o.status === "Paid") b.revenue += Number(o.total_amount || 0);
  }
  const monthly = [...monthBuckets.values()];
  const maxRevenue = Math.max(1, ...monthly.map((b) => b.revenue));
  const maxOrders = Math.max(1, ...monthly.map((b) => b.orders));

  const statusTally = new Map<string, number>();
  for (const o of orderList) statusTally.set(o.status, (statusTally.get(o.status) ?? 0) + 1);
  const statusCounts = ["Pending Review", "Approved", "Payment Link Sent", "Paid", "Processing", "Completed"].map(
    (status) => ({ status, count: statusTally.get(status) ?? 0 })
  );
  const maxStatus = Math.max(1, ...statusCounts.map((s) => s.count));

  const KPI_CARDS = [
    { label: "Paid Revenue", value: formatMoney(revenue), icon: DollarSign, color: "text-emerald-600" },
    { label: "Requested Value", value: formatMoney(requestedValue), icon: TrendingUp, color: "text-blue-600" },
    { label: "Pending Review", value: pendingCount, icon: Clock, color: "text-amber-600" },
    { label: "Approved", value: approvedCount, icon: CheckCircle, color: "text-green-600" },
    { label: "Customers", value: customers ?? 0, icon: Users, color: "text-slate-600" },
    { label: "Active Products", value: products ?? 0, icon: Package, color: "text-slate-600" },
  ];

  return (
    <>
      <AdminNav />
      <main className="container-shell py-7">
        {/* Page header */}
        <section className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="section-label">Operations</p>
            <h1 className="mt-1 text-3xl font-black text-slate-900">Dashboard</h1>
            <p className="mt-1.5 text-sm font-medium text-slate-500">
              Order requests, approvals, revenue, and customer activity.
            </p>
          </div>
          <div className="flex gap-2">
            <Link className="btn-secondary text-xs" href="/admin/orders">Review orders</Link>
            <Link className="btn-primary text-xs" href="/admin/products">Manage products</Link>
          </div>
        </section>

        {/* Today — action items */}
        <section className="mb-6 grid gap-3 sm:grid-cols-3">
          {[
            { label: "New order requests", value: pendingCount, href: "/admin/orders?status=Pending%20Review", border: "border-l-amber-400", text: "text-amber-600" },
            { label: "New catalog leads", value: newLeads, href: "/admin/leads", border: "border-l-sky-400", text: "text-sky-600" },
            { label: "Pending approvals", value: pendingApprovals, href: "/admin/approvals", border: "border-l-green-400", text: "text-green-600" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`card flex items-center justify-between border-l-4 p-4 transition-shadow hover:shadow-md ${item.border}`}
            >
              <div>
                <p className="text-xs font-semibold text-slate-500">{item.label}</p>
                <strong className={`mt-1 block text-3xl font-black ${item.value > 0 ? item.text : "text-slate-300"}`}>
                  {item.value}
                </strong>
              </div>
              <span className="text-xs font-bold text-slate-400">View →</span>
            </Link>
          ))}
        </section>

        {/* KPI cards */}
        <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {KPI_CARDS.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500">{label}</p>
                <Icon size={14} className={color} />
              </div>
              <strong className="text-2xl font-black text-slate-900">{value}</strong>
            </div>
          ))}
        </section>

        <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
          {/* Revenue chart */}
          <section className="card p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-900">Revenue &amp; Orders</h2>
                <p className="mt-0.5 text-xs font-semibold text-slate-500">Last 6 months</p>
              </div>
              <div className="flex gap-3 text-xs font-bold text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" /> Revenue
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-slate-300" /> Orders
                </span>
              </div>
            </div>
            <div className="grid h-56 grid-cols-6 items-end gap-3 border-b border-slate-100 pb-2">
              {monthly.map((b) => (
                <div key={b.label} className="grid h-full content-end gap-1.5 text-center">
                  <div className="mx-auto flex h-44 w-full max-w-14 items-end justify-center gap-1">
                    <div
                      className="w-5 rounded-t bg-emerald-400 transition-all"
                      style={{ height: `${Math.max(4, (b.revenue / maxRevenue) * 100)}%` }}
                      title={formatMoney(b.revenue)}
                    />
                    <div
                      className="w-3 rounded-t bg-slate-300 transition-all"
                      style={{ height: `${Math.max(4, (b.orders / maxOrders) * 100)}%` }}
                      title={`${b.orders} orders`}
                    />
                  </div>
                  <p className="text-[10px] font-black text-slate-600">{b.label}</p>
                  <p className="text-[9px] font-bold text-slate-400">{formatMoney(b.revenue)}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Status mix */}
          <section className="card p-5">
            <h2 className="mb-4 text-lg font-black text-slate-900">Order status mix</h2>
            <div className="grid gap-3">
              {statusCounts.map((item) => (
                <div key={item.status} className="grid gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge status={item.status} />
                    <strong className="text-sm font-black text-slate-700">{item.count}</strong>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-slate-400 transition-all"
                      style={{ width: `${(item.count / maxStatus) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Recent orders */}
        <section className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <h2 className="text-base font-bold text-slate-900">Recent orders</h2>
            <Link href="/admin/orders" className="text-xs font-bold text-(--primary) hover:underline">
              View all →
            </Link>
          </div>
          <div className="overflow-auto">
            <table className="w-full min-w-200 text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500">
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {orderList.slice(0, 8).map((order) => (
                  <tr key={order.id} className="table-row-hover border-b border-slate-100 last:border-b-0 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs font-black text-slate-700">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-700">
                      {order.profiles?.business_name || order.profiles?.email}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-3 font-black">{formatMoney(order.total_amount)}</td>
                    <td className="px-5 py-3 text-slate-500">
                      {new Date(order.created_at).toLocaleDateString("en-CA")}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        className="btn-secondary min-h-7 px-3 text-xs"
                        href={`/admin/orders/${order.id}`}
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
}
