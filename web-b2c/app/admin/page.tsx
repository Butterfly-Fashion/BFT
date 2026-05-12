import { formatCAD } from "@/lib/money";
import { stripeClient } from "@/lib/stripe";
import { verifyAdminCookie } from "@/lib/admin-auth";
import { adminLogin, adminLogout } from "./actions";
import type { Metadata } from "next";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

interface AdminPageProps {
  searchParams: Promise<{ error?: string }>;
}

function formatAmount(amount: number, currency: string | null): string {
  if ((currency ?? "cad").toLowerCase() === "cad") return formatCAD(amount);
  return `${amount.toFixed(2)} ${(currency ?? "").toUpperCase()}`.trim();
}

function LineItemsList({ items }: { items: Stripe.LineItem[] }) {
  const products = items.filter(
    (i) => i.description !== "Shipping" && i.description !== "Tax (HST 13%)"
  );
  if (products.length === 0) return <span className="text-gray-400 italic">—</span>;
  return (
    <ul className="space-y-0.5">
      {products.map((item, idx) => (
        <li key={idx} className="text-xs text-gray-700">
          <span className="font-semibold">{item.quantity}×</span> {item.description}
        </li>
      ))}
    </ul>
  );
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const { error } = await searchParams;
  const isAuthenticated = await verifyAdminCookie();

  if (!isAuthenticated) {
    return (
      <main className="max-w-md mx-auto px-4 py-24">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#C41E3A]">
          World Fan Gear
        </p>
        <h1 className="mt-3 text-3xl font-black text-gray-900">Admin — Orders</h1>
        {error && (
          <p className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            Incorrect password
          </p>
        )}
        <form action={adminLogin} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Password</span>
            <input
              type="password"
              name="password"
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#C41E3A] focus:ring-2 focus:ring-[#C41E3A]/15"
              autoComplete="current-password"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-full bg-[#C41E3A] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#A01830]"
          >
            View Orders
          </button>
        </form>
      </main>
    );
  }

  let orders: Array<{
    id: string;
    orderId: string | null;
    email: string | null;
    amount: number;
    currency: string | null;
    date: string;
    shippingName: string | null;
    shippingAddress: string | null;
    shippingCity: string | null;
    shippingProvince: string | null;
    shippingPostal: string | null;
    shippingCountry: string | null;
    lineItems: Stripe.LineItem[];
  }> = [];

  let fetchError: string | null = null;

  try {
    const stripe = stripeClient();

    const [sessions, paymentIntents] = await Promise.all([
      stripe.checkout.sessions.list({ limit: 50 }),
      stripe.paymentIntents.list({ limit: 50 }),
    ]);

    const paidSessions = sessions.data.filter((s) => s.payment_status === "paid");

    const lineItemsResults = await Promise.all(
      paidSessions.map((s) =>
        stripe.checkout.sessions.listLineItems(s.id, { limit: 20 }).then((r) => r.data)
      )
    );

    const sessionOrders = paidSessions.map((s, i) => ({
      id: s.id,
      orderId: s.metadata?.order_id ?? null,
      email: s.customer_email,
      amount: (s.amount_total ?? 0) / 100,
      currency: s.currency,
      date: new Date(s.created * 1000).toISOString(),
      shippingName: s.metadata?.shipping_name ?? null,
      shippingAddress: s.metadata?.shipping_address ?? null,
      shippingCity: s.metadata?.shipping_city ?? null,
      shippingProvince: s.metadata?.shipping_province ?? null,
      shippingPostal: s.metadata?.shipping_postal ?? null,
      shippingCountry: s.metadata?.shipping_country ?? null,
      lineItems: lineItemsResults[i],
    }));

    const sessionPaymentIntentIds = new Set(
      sessions.data.map((s) => s.payment_intent).filter(Boolean)
    );

    const piOrders = paymentIntents.data
      .filter((pi) => pi.status === "succeeded" && !sessionPaymentIntentIds.has(pi.id))
      .map((pi) => ({
        id: pi.id,
        orderId: pi.metadata?.order_id ?? null,
        email: pi.receipt_email,
        amount: pi.amount / 100,
        currency: pi.currency,
        date: new Date(pi.created * 1000).toISOString(),
        shippingName: pi.metadata?.shipping_name ?? null,
        shippingAddress: pi.metadata?.shipping_address ?? null,
        shippingCity: pi.metadata?.shipping_city ?? null,
        shippingProvince: pi.metadata?.shipping_province ?? null,
        shippingPostal: pi.metadata?.shipping_postal ?? null,
        shippingCountry: pi.metadata?.shipping_country ?? null,
        lineItems: [] as Stripe.LineItem[],
      }));

    orders = [...sessionOrders, ...piOrders].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Failed to load orders";
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      <p className="text-xs font-semibold uppercase tracking-widest text-[#C41E3A]">
        World Fan Gear
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Admin — Orders</h1>
          <p className="mt-2 text-sm text-gray-500">Recent paid Stripe checkout sessions.</p>
        </div>
        <div className="flex items-center gap-4">
          {!fetchError && (
            <span className="text-sm font-semibold text-gray-500">{orders.length} orders</span>
          )}
          <form action={adminLogout}>
            <button
              type="submit"
              className="text-sm font-semibold text-gray-400 hover:text-gray-700 transition-colors"
            >
              Log out
            </button>
          </form>
        </div>
      </div>

      {fetchError ? (
        <p className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {fetchError}
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-widest text-gray-500">
              <tr>
                <th className="px-4 py-3 font-bold">Order ID</th>
                <th className="px-4 py-3 font-bold">Customer</th>
                <th className="px-4 py-3 font-bold">Items</th>
                <th className="px-4 py-3 font-bold">Shipping Address</th>
                <th className="px-4 py-3 font-bold">Amount</th>
                <th className="px-4 py-3 font-bold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-gray-500" colSpan={6}>
                    No paid orders found yet.
                  </td>
                </tr>
              ) : (
                orders.map((order, index) => (
                  <tr key={order.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50/60"}>
                    <td className="px-4 py-3 font-semibold text-gray-900 text-xs">
                      {order.orderId ?? order.id}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {order.shippingName && (
                        <p className="font-semibold text-gray-900">{order.shippingName}</p>
                      )}
                      <p>{order.email ?? "No email"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <LineItemsList items={order.lineItems} />
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-sm">
                      {order.shippingAddress ? (
                        <div>
                          <p>{order.shippingAddress}</p>
                          <p>
                            {order.shippingCity}, {order.shippingProvince}{" "}
                            {order.shippingPostal}
                          </p>
                          <p>{order.shippingCountry}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold text-[#C41E3A]">
                      {formatAmount(order.amount, order.currency)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Intl.DateTimeFormat("en-CA", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(order.date))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
