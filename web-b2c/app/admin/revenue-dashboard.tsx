"use client";

import { useEffect, useState } from "react";
import { formatCAD } from "@/lib/money";
import { ORDER_STATUS_LABELS } from "@/lib/types";

interface DailyRevenue {
  date: string;
  revenue: number;
}

interface TopProduct {
  name: string;
  revenue: number;
  qty: number;
}

interface RevenueData {
  today: { revenue: number; orders: number };
  this_week: { revenue: number; orders: number };
  this_month: { revenue: number; orders: number };
  all_time: { revenue: number; orders: number };
  by_status: Record<string, number>;
  daily_last_30: DailyRevenue[];
  top_products: TopProduct[];
}

function StatCard({ label, revenue, orders }: { label: string; revenue: number; orders: number }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-6 py-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</p>
      <p className="mt-2 text-2xl font-black text-gray-900">{formatCAD(revenue)}</p>
      <p className="mt-1 text-sm text-gray-500">{orders} order{orders !== 1 ? "s" : ""}</p>
    </div>
  );
}

function MiniBar({ value, max, date }: { value: number; max: number; date: string }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  const label = date.slice(5); // "MM-DD"
  return (
    <div className="flex flex-col items-center gap-1" title={`${date}: ${formatCAD(value)}`}>
      <div className="w-4 flex flex-col justify-end" style={{ height: 80 }}>
        <div
          className="w-full rounded-t bg-brand transition-all"
          style={{ height: `${pct}%`, minHeight: value > 0 ? 4 : 0 }}
        />
      </div>
      {label.endsWith("-01") || label.endsWith("-08") || label.endsWith("-15") || label.endsWith("-22") || label.endsWith("-29") ? (
        <p className="text-[9px] text-gray-400 rotate-0 select-none">{label}</p>
      ) : (
        <div className="h-3" />
      )}
    </div>
  );
}

export default function RevenueDashboard() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/revenue")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-brand" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-red-600">{error ?? "Failed to load"}</p>
      </div>
    );
  }

  const maxDaily = Math.max(...data.daily_last_30.map((d) => d.revenue), 1);

  const statusOrder = ["paid", "packing", "shipped", "ready_for_pickup", "completed", "cancelled", "refunded"];

  return (
    <div className="h-full overflow-y-auto bg-gray-50 px-6 py-6">
      <h2 className="text-lg font-black text-gray-900 mb-6">Revenue Overview</h2>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        <StatCard label="Today" revenue={data.today.revenue} orders={data.today.orders} />
        <StatCard label="This Week" revenue={data.this_week.revenue} orders={data.this_week.orders} />
        <StatCard label="This Month" revenue={data.this_month.revenue} orders={data.this_month.orders} />
        <StatCard label="All Time" revenue={data.all_time.revenue} orders={data.all_time.orders} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Daily revenue chart */}
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
            Daily Revenue — Last 30 Days
          </p>
          <div className="flex items-end gap-0.5 overflow-x-auto pb-1">
            {data.daily_last_30.map((d) => (
              <MiniBar key={d.date} value={d.revenue} max={maxDaily} date={d.date} />
            ))}
          </div>
        </div>

        {/* Orders by status */}
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
            Orders by Status
          </p>
          <div className="space-y-2">
            {statusOrder.map((s) => {
              const cnt = data.by_status[s] ?? 0;
              if (cnt === 0) return null;
              const total = Object.values(data.by_status).reduce((a, b) => a + b, 0);
              const pct = total === 0 ? 0 : Math.round((cnt / total) * 100);
              return (
                <div key={s} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-sm text-gray-600">{(ORDER_STATUS_LABELS as Record<string, string>)[s] ?? s}</span>
                  <div className="flex-1 rounded-full bg-gray-100 h-2">
                    <div
                      className="h-2 rounded-full bg-brand"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm font-semibold text-gray-700">{cnt}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top products */}
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-5 lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
            Top Products by Revenue
          </p>
          {data.top_products.length === 0 ? (
            <p className="text-sm text-gray-400">No data yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  <th className="pb-2 font-semibold">Product</th>
                  <th className="pb-2 text-right font-semibold">Units Sold</th>
                  <th className="pb-2 text-right font-semibold">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.top_products.map((p, i) => (
                  <tr key={p.name} className="border-b border-gray-50 last:border-0">
                    <td className="py-2.5 text-gray-800">
                      <span className="mr-2 text-xs text-gray-400">#{i + 1}</span>
                      {p.name}
                    </td>
                    <td className="py-2.5 text-right text-gray-600">{p.qty}</td>
                    <td className="py-2.5 text-right font-semibold text-gray-900">{formatCAD(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
