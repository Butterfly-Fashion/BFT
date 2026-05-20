import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdminCookie } from "@/lib/admin-auth";

export async function GET() {
  const isAuthenticated = await verifyAdminCookie();
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = supabaseAdmin();

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, status, total, created_at, delivery_method")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOf30Days = new Date(now);
  startOf30Days.setDate(now.getDate() - 29);

  const activeStatuses = new Set(["paid", "packing", "shipped", "ready_for_pickup", "completed"]);

  type OrderRow = { id: string; status: string; total: number | null; created_at: string; delivery_method: string | null };

  const active = (orders as OrderRow[]).filter((o) => activeStatuses.has(o.status));

  const sum = (rows: OrderRow[]) => rows.reduce((s, o) => s + (o.total ?? 0), 0);
  const count = (rows: OrderRow[]) => rows.length;
  const inRange = (rows: OrderRow[], from: Date) =>
    rows.filter((o) => new Date(o.created_at) >= from);

  const total = sum(active);
  const today = inRange(active, startOfToday);
  const thisWeek = inRange(active, startOfWeek);
  const thisMonth = inRange(active, startOfMonth);
  const last30 = inRange(active, startOf30Days);

  // Daily revenue for the last 30 days
  const dailyMap: Record<string, number> = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(startOf30Days);
    d.setDate(startOf30Days.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    dailyMap[key] = 0;
  }
  for (const o of last30) {
    const key = o.created_at.slice(0, 10);
    if (key in dailyMap) dailyMap[key] += o.total ?? 0;
  }
  const daily_last_30 = Object.entries(dailyMap).map(([date, revenue]) => ({ date, revenue }));

  // Orders by status
  const by_status: Record<string, number> = {};
  for (const o of orders as OrderRow[]) {
    by_status[o.status] = (by_status[o.status] ?? 0) + 1;
  }

  // Top products (need order_items)
  const { data: itemRows } = await supabase
    .from("order_items")
    .select("name, quantity, unit_price, order_id");

  const activeOrderIds = new Set(active.map((o) => o.id));
  const productMap: Record<string, { revenue: number; qty: number }> = {};
  for (const item of (itemRows ?? []) as { name: string; quantity: number; unit_price: number; order_id: string }[]) {
    if (!activeOrderIds.has(item.order_id)) continue;
    if (!productMap[item.name]) productMap[item.name] = { revenue: 0, qty: 0 };
    productMap[item.name].revenue += item.unit_price * item.quantity;
    productMap[item.name].qty += item.quantity;
  }
  const top_products = Object.entries(productMap)
    .map(([name, { revenue, qty }]) => ({ name, revenue, qty }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  return NextResponse.json({
    total,
    today: { revenue: sum(today), orders: count(today) },
    this_week: { revenue: sum(thisWeek), orders: count(thisWeek) },
    this_month: { revenue: sum(thisMonth), orders: count(thisMonth) },
    all_time: { revenue: total, orders: count(active) },
    by_status,
    daily_last_30,
    top_products,
  });
}
