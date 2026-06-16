import { CheckCircle, FileText, Inbox } from "lucide-react";
import { createQuoteAction } from "@/app/actions";
import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { StatusBadge } from "@/components/admin/status-badge";
import { requireProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AccountQuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; submitted?: string }>;
}) {
  const profile = await requireProfile("/login?next=/account/quotes");
  const sp = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: quotes } = await supabase
    .from("quotes")
    .select("*")
    .eq("customer_id", profile.id)
    .order("created_at", { ascending: false });
  const { data: products } = await supabase
    .from("products")
    .select("id,name")
    .eq("is_hidden", false)
    .contains("sales_channels", ["b2b"])
    .order("name");

  const quoteList = quotes || [];

  return (
    <>
      <Header profile={profile} />
      <main className="container-shell py-8">
        <div className="mb-6">
          <p className="section-label">My account</p>
          <h1 className="mt-1 flex items-center gap-2.5 text-3xl font-black text-slate-900">
            <FileText size={26} />
            Request a quote
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-600">
            Ask about bulk pricing or volume availability. We typically respond within 1 business day.
          </p>
        </div>

        {sp.submitted && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <CheckCircle size={18} className="mt-0.5 shrink-0 text-emerald-600" />
            <div>
              <p className="text-sm font-black text-emerald-800">Quote request submitted!</p>
              <p className="mt-0.5 text-xs font-semibold text-emerald-700">
                Our team will review it and reply with pricing shortly.
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[420px_1fr] lg:items-start">
          {/* Form */}
          <form action={createQuoteAction} className="card grid gap-4 p-5">
            <h2 className="text-base font-black text-slate-900">New quote request</h2>
            <label className="label">
              Product
              <select className="field" defaultValue={sp.product || ""} name="product_id">
                <option value="">General quote (no specific product)</option>
                {(products || []).map((p) => (
                  <option value={p.id} key={p.id}>{p.name}</option>
                ))}
              </select>
            </label>
            <label className="label">
              Quantity
              <input className="field" min="1" name="quantity" type="number" defaultValue="1" />
            </label>
            <label className="label">
              Target price per unit <span className="normal-case font-semibold text-slate-400">(optional)</span>
              <input className="field" name="requested_price" type="number" step="0.01" placeholder="e.g. 4.50" />
            </label>
            <label className="label">
              Message
              <textarea
                className="field min-h-28"
                name="message"
                placeholder="Tell us about the quantities, timeline, or any special requirements."
              />
            </label>
            <button className="btn-primary" type="submit">Submit quote request</button>
          </form>

          {/* History */}
          <section className="grid gap-3">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Your quote requests</h2>
            {quoteList.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
                <Inbox size={32} className="mx-auto mb-3 text-slate-300" />
                <p className="font-black text-slate-500">No quote requests yet</p>
                <p className="mt-1 text-sm font-medium text-slate-400">
                  Submit the form to ask about bulk pricing — your requests will show up here.
                </p>
              </div>
            ) : (
              quoteList.map((quote) => (
                <article className="card p-4" key={quote.id}>
                  <div className="flex items-center justify-between gap-3">
                    <StatusBadge status={quote.status} />
                    <span className="text-[11px] font-semibold text-slate-400">
                      {new Date(quote.created_at).toLocaleDateString("en-CA", {
                        year: "numeric", month: "short", day: "numeric",
                      })}
                    </span>
                  </div>
                  {quote.message && <p className="mt-2 text-sm text-slate-600">{quote.message}</p>}
                  {quote.admin_response && (
                    <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm font-semibold text-slate-700">
                      {quote.admin_response}
                    </p>
                  )}
                </article>
              ))
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
