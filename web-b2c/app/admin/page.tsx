import { formatCAD } from "@/lib/money";
import { siteUrl } from "@/lib/stripe";

export const dynamic = "force-dynamic";

interface AdminOrder {
  id: string;
  orderId: string | null;
  email: string | null;
  amount: number;
  currency: string | null;
  date: string;
}

interface AdminPageProps {
  searchParams: Promise<{
    password?: string;
  }>;
}

function formatAmount(amount: number, currency: string | null): string {
  if ((currency ?? "cad").toLowerCase() === "cad") {
    return formatCAD(amount);
  }

  return `${amount.toFixed(2)} ${(currency ?? "").toUpperCase()}`.trim();
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const { password } = await searchParams;

  if (!password) {
    return (
      <main className="max-w-md mx-auto px-4 py-24">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#C41E3A]">
          World Fan Gear
        </p>
        <h1 className="mt-3 text-3xl font-black text-gray-900">Admin - Orders</h1>
        <form action="/admin" className="mt-8 space-y-4">
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

  const response = await fetch(
    `${siteUrl()}/api/admin/orders?password=${encodeURIComponent(password)}`,
    { cache: "no-store" }
  );

  if (response.status === 401) {
    return (
      <main className="max-w-md mx-auto px-4 py-24 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#C41E3A]">
          World Fan Gear
        </p>
        <h1 className="mt-3 text-3xl font-black text-gray-900">Admin - Orders</h1>
        <p className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          Incorrect password
        </p>
      </main>
    );
  }

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;

    return (
      <main className="max-w-4xl mx-auto px-4 py-12">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#C41E3A]">
          World Fan Gear
        </p>
        <h1 className="mt-3 text-3xl font-black text-gray-900">Admin - Orders</h1>
        <p className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {data?.error ?? "Unable to load orders"}
        </p>
      </main>
    );
  }

  const orders = (await response.json()) as AdminOrder[];

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <p className="text-xs font-semibold uppercase tracking-widest text-[#C41E3A]">
        World Fan Gear
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Admin - Orders</h1>
          <p className="mt-2 text-sm text-gray-500">Recent paid Stripe checkout sessions.</p>
        </div>
        <span className="text-sm font-semibold text-gray-500">{orders.length} orders</span>
      </div>

      <div className="mt-8 overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-widest text-gray-500">
            <tr>
              <th className="px-4 py-3 font-bold">Order ID</th>
              <th className="px-4 py-3 font-bold">Email</th>
              <th className="px-4 py-3 font-bold">Amount</th>
              <th className="px-4 py-3 font-bold">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-gray-500" colSpan={4}>
                  No paid orders found yet.
                </td>
              </tr>
            ) : (
              orders.map((order, index) => (
                <tr key={order.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50/60"}>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {order.orderId ?? order.id}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{order.email ?? "No email"}</td>
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
    </main>
  );
}
