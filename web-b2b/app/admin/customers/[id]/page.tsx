import Link from "next/link";
import { notFound } from "next/navigation";
import { setCustomerPriceAction, deleteCustomerPriceAction, deleteCustomerAction } from "@/app/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { DangerForm } from "@/components/admin/danger-form";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatMoney } from "@/lib/money";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminCustomerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error: deleteError } = await searchParams;
  const admin = createSupabaseAdminClient();

  const [{ data: customer }, { data: products }, { data: orders }, { data: customerPrices }, { data: purchaseItems }, { count: quoteCount }] = await Promise.all([
    admin.from("profiles").select("*").eq("id", id).single(),
    admin
      .from("products")
      .select("id,name,sku,unit_price,case_price,case_qty")
      .eq("is_hidden", false)
      .contains("sales_channels", ["b2b"])
      .order("name"),
    admin.from("orders").select("*").eq("customer_id", id).order("created_at", { ascending: false }),
    admin.from("customer_prices").select("*, products(name,sku,unit_price,case_price,case_qty,image_url)").eq("customer_id", id).order("created_at", { ascending: false }),
    admin
      .from("order_items")
      .select("product_id, product_name_snapshot, sku_snapshot, quantity, unit_price_snapshot, line_total, orders!inner(id,customer_id,status,payment_status,created_at)")
      .eq("orders.customer_id", id)
      .order("created_at", { ascending: false, foreignTable: "orders" }),
    admin.from("quotes").select("id", { count: "exact", head: true }).eq("customer_id", id),
  ]);

  if (!customer) notFound();

  const orderCount = orders?.length ?? 0;
  const quotesCount = quoteCount ?? 0;
  const isAdminAccount = customer.role === "admin";
  const hasRecords = orderCount > 0 || quotesCount > 0;
  const DELETE_ERRORS: Record<string, string> = {
    "is-admin": "관리자 계정은 여기서 삭제할 수 없습니다.",
    "self-delete": "본인 계정은 삭제할 수 없습니다.",
    "delete-failed": "삭제에 실패했습니다. 다시 시도해 주세요.",
  };

  const paidRevenue = (orders || []).filter((order) => order.status === "Paid").reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
  const totalRevenue = (orders || []).reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
  const purchasedProducts = new Map<string, { name: string; sku: string; quantity: number; total: number; lastPrice: number; lastOrder?: string }>();

  for (const item of purchaseItems || []) {
    const itemOrder = Array.isArray(item.orders) ? item.orders[0] : item.orders;
    const key = item.product_id || item.sku_snapshot;
    const existing = purchasedProducts.get(key) || { name: item.product_name_snapshot, sku: item.sku_snapshot, quantity: 0, total: 0, lastPrice: Number(item.unit_price_snapshot || 0), lastOrder: itemOrder?.id };
    existing.quantity += Number(item.quantity || 0);
    existing.total += Number(item.line_total || 0);
    existing.lastPrice = Number(item.unit_price_snapshot || existing.lastPrice);
    existing.lastOrder = itemOrder?.id || existing.lastOrder;
    purchasedProducts.set(key, existing);
  }

  return (
    <>
      <AdminNav />
      <main className="container-shell py-6">
        {deleteError && DELETE_ERRORS[deleteError] && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {DELETE_ERRORS[deleteError]}
          </div>
        )}
        <section className="mb-5 rounded border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="min-w-0">
            <p className="section-label">Customer profile</p>
            <h1 className="mt-2 text-4xl font-black leading-tight text-slate-950">{customer.business_name}</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="badge border-slate-200 bg-slate-50 text-slate-700">{customer.business_type || "No business type"}</span>
              <span className="badge border-slate-200 bg-slate-50 text-slate-700">{customer.role}</span>
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-500">Primary contact details are shown below.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="btn-secondary" href="/admin/customers">Back to customers</Link>
          </div>
          </div>

          <div className="grid gap-3 pt-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded border border-slate-200 bg-[#fafafa] p-4">
              <p className="text-xs font-black uppercase text-slate-500">Contact name</p>
              <p className="mt-2 text-xl font-black text-slate-950">{customer.contact_name || "Not provided"}</p>
            </div>
            <div className="rounded border border-slate-200 bg-[#fafafa] p-4">
              <p className="text-xs font-black uppercase text-slate-500">Email</p>
              <p className="mt-2 break-all text-lg font-black text-slate-950">{customer.email || "Not provided"}</p>
            </div>
            <div className="rounded border border-slate-200 bg-[#fafafa] p-4">
              <p className="text-xs font-black uppercase text-slate-500">Phone</p>
              <p className="mt-2 text-xl font-black text-slate-950">{customer.phone || "Not provided"}</p>
            </div>
            <div className="rounded border border-slate-200 bg-[#fafafa] p-4">
              <p className="text-xs font-black uppercase text-slate-500">Website</p>
              {customer.website ? (
                <a
                  href={customer.website.startsWith("http") ? customer.website : `https://${customer.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block break-all text-lg font-black text-(--primary) hover:underline"
                >
                  {customer.website.replace(/^https?:\/\//, "")}
                </a>
              ) : (
                <p className="mt-2 text-xl font-black text-slate-950">Not provided</p>
              )}
            </div>
            <div className="rounded border border-slate-200 bg-[#fafafa] p-4 md:col-span-2 xl:col-span-1">
              <p className="text-xs font-black uppercase text-slate-500">Address</p>
              <p className="mt-2 text-sm font-black leading-6 text-slate-950">
                {[customer.business_address, customer.city, customer.province, customer.postal_code, customer.country].filter(Boolean).join(", ") || "Not provided"}
              </p>
            </div>
          </div>
        </section>

        <section className="mb-5 grid gap-3 md:grid-cols-4">
          <div className="card p-4"><p className="text-xs font-black uppercase text-slate-500">Orders</p><strong className="mt-2 block text-3xl">{orders?.length || 0}</strong></div>
          <div className="card p-4"><p className="text-xs font-black uppercase text-slate-500">Paid revenue</p><strong className="mt-2 block text-3xl">{formatMoney(paidRevenue)}</strong></div>
          <div className="card p-4"><p className="text-xs font-black uppercase text-slate-500">Requested value</p><strong className="mt-2 block text-3xl">{formatMoney(totalRevenue)}</strong></div>
          <div className="card p-4"><p className="text-xs font-black uppercase text-slate-500">Custom prices</p><strong className="mt-2 block text-3xl">{customerPrices?.length || 0}</strong></div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="grid gap-4 xl:h-fit xl:sticky xl:top-20">
            <section className="card p-4">
              <h2 className="mb-3 text-xl font-black">Customer info</h2>
              <dl className="grid gap-2 text-sm">
                <div><dt className="font-black text-slate-500">Business type</dt><dd className="font-semibold">{customer.business_type}</dd></div>
                <div><dt className="font-black text-slate-500">Address</dt><dd className="font-semibold">{customer.business_address}, {customer.city}, {customer.province} {customer.postal_code}, {customer.country}</dd></div>
                {customer.notes && <div><dt className="font-black text-slate-500">Notes</dt><dd className="font-semibold">{customer.notes}</dd></div>}
              </dl>
            </section>

            <section className="card p-4">
              <h2 className="mb-3 text-xl font-black">Set customer price</h2>
              <form action={setCustomerPriceAction} className="grid gap-2">
                <input name="customer_id" type="hidden" value={customer.id} />
                <select className="field" name="product_id">
                  {(products || []).map((product) => (
                    <option value={product.id} key={product.id}>
                      {product.name} (unit: {formatMoney(product.unit_price)}{product.case_price ? ` / case: ${formatMoney(product.case_price)}` : ""})
                    </option>
                  ))}
                </select>
                <label className="label">Unit price (per pc)
                  <input className="field" name="unit_price" placeholder="e.g. 4.50" step="0.01" min="0" type="number" />
                </label>
                <label className="label">Case price (optional)
                  <input className="field" name="case_price" placeholder="e.g. 45.00" step="0.01" min="0" type="number" />
                </label>
                <button className="btn-primary" type="submit">Set prices</button>
              </form>
            </section>
          </aside>

          <div className="grid gap-5">
            <section className="overflow-hidden rounded border border-slate-200 bg-white">
              <div className="border-b border-slate-200 bg-[#fafafa] p-4"><h2 className="text-xl font-black">Purchase history and previous prices</h2></div>
              <div className="overflow-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead><tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500"><th className="p-3">Product</th><th>Item Code</th><th>Qty</th><th>Last price</th><th>Total bought</th><th>Last order</th></tr></thead>
                  <tbody>
                    {[...purchasedProducts.values()].map((item) => (
                      <tr className="border-b last:border-b-0" key={item.sku}>
                        <td className="p-3 font-black">{item.name}</td>
                        <td className="font-mono text-xs">{item.sku}</td>
                        <td className="font-black">{item.quantity}</td>
                        <td>{formatMoney(item.lastPrice)}</td>
                        <td>{formatMoney(item.total)}</td>
                        <td>{item.lastOrder ? <Link className="font-black text-(--primary)" href={`/admin/orders/${item.lastOrder}`}>{item.lastOrder.slice(0, 8)}</Link> : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!purchasedProducts.size && <div className="p-8 text-center text-sm font-bold text-slate-500">No purchase history yet.</div>}
            </section>

            <section className="overflow-hidden rounded border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-4 py-3">
                <h2 className="text-base font-bold text-slate-900">Customer-specific prices</h2>
                <p className="mt-0.5 text-xs text-slate-500">These override the standard catalogue prices for this customer.</p>
              </div>
              <div className="overflow-auto">
                <table className="w-full min-w-190 text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500">
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Item Code</th>
                      <th className="px-4 py-3">Standard</th>
                      <th className="px-4 py-3">Custom unit</th>
                      <th className="px-4 py-3">Custom case</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(customerPrices || []).map((price) => (
                      <tr className="border-b border-slate-100 last:border-b-0" key={price.id}>
                        <td className="px-4 py-3 font-semibold text-slate-900">{price.products?.name}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{price.products?.sku}</td>
                        <td className="px-4 py-3 text-slate-500">{formatMoney(price.products?.unit_price || 0)}</td>
                        <td className="px-4 py-3 font-black text-slate-900">{price.unit_price != null ? formatMoney(price.unit_price) : "—"}</td>
                        <td className="px-4 py-3 font-semibold text-slate-700">{price.case_price != null ? formatMoney(price.case_price) : "—"}</td>
                        <td className="px-4 py-3 text-right">
                          <DangerForm
                            action={deleteCustomerPriceAction.bind(null, price.id, customer.id)}
                            confirmMessage={`Remove custom pricing for "${price.products?.name}"?\n\nThis customer will revert to standard catalogue pricing.`}
                            submitLabel="Remove"
                            className="contents"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!customerPrices?.length && <div className="p-8 text-center text-sm font-bold text-slate-500">No custom prices set. Use the form on the left to add custom pricing.</div>}
            </section>

            <section className="overflow-hidden rounded border border-slate-200 bg-white">
              <div className="border-b border-slate-200 bg-[#fafafa] p-4"><h2 className="text-xl font-black">Orders</h2></div>
              <div className="overflow-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead><tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500"><th className="p-3">Order</th><th>Status</th><th>Payment</th><th>Total</th><th>Date</th></tr></thead>
                  <tbody>
                    {(orders || []).map((order) => (
                      <tr className="border-b last:border-b-0" key={order.id}>
                        <td className="p-3"><Link className="font-black text-(--primary)" href={`/admin/orders/${order.id}`}>{order.id.slice(0, 8)}</Link></td>
                        <td><StatusBadge status={order.status} /></td>
                        <td><StatusBadge status={order.payment_status} type="payment" /></td>
                        <td className="font-black">{formatMoney(order.total_amount)}</td>
                        <td>{new Date(order.created_at).toLocaleDateString("en-CA")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>

        {/* Danger zone */}
        <section className="mt-6 overflow-hidden rounded border border-red-200 bg-white">
          <div className="border-b border-red-100 bg-red-50 p-4">
            <h2 className="text-lg font-black text-red-700">Danger zone</h2>
            <p className="mt-0.5 text-xs font-semibold text-red-600">Deleting a customer is permanent and cannot be undone.</p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900">Delete this customer</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Permanently removes the account, login, custom prices, messages
                {hasRecords ? `, and all ${orderCount} order(s) and ${quotesCount} quote(s)` : ""}.
              </p>
            </div>
            {isAdminAccount ? (
              <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
                관리자 계정은 여기서 삭제할 수 없습니다.
              </p>
            ) : (
              <DangerForm
                action={deleteCustomerAction.bind(null, customer.id)}
                confirmMessage={
                  hasRecords
                    ? `정말로 이 고객을 삭제하시겠습니까?\n\n"${customer.business_name}" 계정과 로그인 정보, 맞춤 가격, 메시지가 삭제되며,\n이 고객의 주문 ${orderCount}건과 견적 ${quotesCount}건도 함께 영구 삭제됩니다.\n이 작업은 되돌릴 수 없습니다.`
                    : `정말로 이 고객을 삭제하시겠습니까?\n\n"${customer.business_name}" 계정과 로그인 정보, 맞춤 가격, 메시지가 영구적으로 삭제됩니다.\n이 작업은 되돌릴 수 없습니다.`
                }
                submitLabel="Delete customer"
                className="contents"
              />
            )}
          </div>
        </section>
      </main>
    </>
  );
}
