import Link from "next/link";
import { FileText, MessageSquare } from "lucide-react";
import { respondQuoteAction, deleteQuoteAction } from "@/app/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { DangerForm } from "@/components/admin/danger-form";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  Pending: "border-amber-200 bg-amber-50 text-amber-800",
  Responded: "border-blue-200 bg-blue-50 text-blue-800",
  Converted: "border-green-200 bg-green-50 text-green-800",
  Closed: "border-slate-200 bg-slate-100 text-slate-600",
  Cancelled: "border-red-200 bg-red-50 text-red-700",
};

export default async function AdminQuotesPage() {
  const admin = createSupabaseAdminClient();
  const { data: quotes } = await admin
    .from("quotes")
    .select("*, profiles(business_name, contact_name, email), quote_items(*, products(name, sku, unit_price))")
    .order("created_at", { ascending: false });

  const list = quotes || [];
  const pendingCount = list.filter((q) => q.status === "Pending").length;

  return (
    <>
      <AdminNav />
      <main className="container-shell py-7">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="section-label">Quote management</p>
            <h1 className="mt-1 text-3xl font-black text-slate-900">Quote Requests</h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Respond to customer quote requests. Replied quotes are sent via email.
            </p>
          </div>
          {pendingCount > 0 && (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-bold text-amber-800">
              {pendingCount} pending
            </span>
          )}
        </div>

        {!list.length && (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white py-20 text-center">
            <FileText size={28} className="mx-auto mb-3 text-slate-300" />
            <p className="font-semibold text-slate-400">No quote requests yet.</p>
            <p className="mt-1 text-sm text-slate-300">Quote requests submitted by customers will appear here.</p>
          </div>
        )}

        <div className="grid gap-4">
          {list.map((quote) => {
            const profile = quote.profiles;
            const items = quote.quote_items || [];
            const statusStyle = STATUS_STYLES[quote.status] || STATUS_STYLES.Closed;

            return (
              <article key={quote.id} className="card overflow-hidden">
                {/* Quote header */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-black text-slate-900">{profile?.business_name || "Unknown business"}</p>
                      <span className={`badge ${statusStyle}`}>{quote.status}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {profile?.contact_name && <>{profile.contact_name} · </>}
                      {profile?.email}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {new Date(quote.created_at).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  </div>
                  <DangerForm
                    action={deleteQuoteAction.bind(null, quote.id)}
                    confirmMessage={`Delete quote request from ${profile?.business_name}?\n\nThis cannot be undone.`}
                    submitLabel="Delete"
                    className="contents"
                  />
                </div>

                <div className="grid gap-0 lg:grid-cols-[1fr_400px]">
                  {/* Left: quote content */}
                  <div className="border-b border-slate-100 p-5 lg:border-b-0 lg:border-r">
                    {items.length > 0 && (
                      <div className="mb-4">
                        <p className="mb-2 text-xs font-semibold text-slate-500">Products requested</p>
                        <div className="overflow-hidden rounded-lg border border-slate-200">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500">
                                <th className="px-3 py-2">Product</th>
                                <th className="px-3 py-2">SKU</th>
                                <th className="px-3 py-2 text-right">Qty</th>
                                <th className="px-3 py-2 text-right">Requested price</th>
                              </tr>
                            </thead>
                            <tbody>
                              {items.map((item: any) => (
                                <tr key={item.id} className="border-b border-slate-100 last:border-b-0">
                                  <td className="px-3 py-2 font-semibold text-slate-900">{item.products?.name || "—"}</td>
                                  <td className="px-3 py-2 font-mono text-xs text-slate-500">{item.products?.sku || "—"}</td>
                                  <td className="px-3 py-2 text-right">{item.quantity}</td>
                                  <td className="px-3 py-2 text-right text-slate-600">
                                    {item.requested_price ? `$${Number(item.requested_price).toFixed(2)}` : "Not specified"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    {quote.message && (
                      <div>
                        <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                          <MessageSquare size={11} />
                          Customer message
                        </p>
                        <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700">
                          {quote.message}
                        </p>
                      </div>
                    )}
                    {!quote.message && !items.length && (
                      <p className="text-sm text-slate-400">No message or items specified.</p>
                    )}
                  </div>

                  {/* Right: respond form */}
                  <form action={respondQuoteAction} className="grid content-start gap-3 p-5">
                    <input type="hidden" name="quote_id" value={quote.id} />
                    <label className="label">
                      Status
                      <select className="field" name="status" defaultValue={quote.status}>
                        <option>Pending</option>
                        <option>Responded</option>
                        <option>Converted</option>
                        <option>Closed</option>
                        <option>Cancelled</option>
                      </select>
                    </label>
                    <label className="label">
                      Response to customer
                      <textarea
                        className="field min-h-28"
                        name="admin_response"
                        defaultValue={quote.admin_response || ""}
                        placeholder="Write your response. Be specific about pricing, availability, and lead time."
                      />
                    </label>
                    <button className="btn-primary w-full text-sm" type="submit">
                      Save response
                    </button>
                    {profile?.email && (
                      <a
                        href={`mailto:${profile.email}?subject=Re: Quote request — Butterfly Fashion`}
                        className="btn-secondary w-full text-center text-sm"
                      >
                        Email customer directly
                      </a>
                    )}
                  </form>
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </>
  );
}
