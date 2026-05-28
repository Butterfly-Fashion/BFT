import { createQuoteAction } from "@/app/actions";
import { Header } from "@/components/store/header";
import { requireProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AccountQuotesPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const profile = await requireProfile();
  const sp = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: quotes } = await supabase.from("quotes").select("*").eq("customer_id", profile.id).order("created_at", { ascending: false });
  const { data: products } = await supabase
    .from("products")
    .select("id,name")
    .eq("is_hidden", false)
    .contains("sales_channels", ["b2b"])
    .order("name");
  return (
    <>
      <Header profile={profile} />
      <main className="container-shell grid gap-5 py-6 lg:grid-cols-[420px_1fr]">
        <form action={createQuoteAction} className="card grid gap-4 p-5">
          <h1 className="text-2xl font-black">Request quote</h1>
          <label className="label">Product<select className="field" defaultValue={sp.product || ""} name="product_id"><option value="">General quote</option>{(products || []).map((p) => <option value={p.id} key={p.id}>{p.name}</option>)}</select></label>
          <label className="label">Quantity<input className="field" min="1" name="quantity" type="number" defaultValue="1" /></label>
          <label className="label">Requested price optional<input className="field" name="requested_price" type="number" step="0.01" /></label>
          <label className="label">Message<textarea className="field min-h-28" name="message" /></label>
          <button className="btn-primary" type="submit">Submit quote request</button>
        </form>
        <section className="grid gap-3">
          {(quotes || []).map((quote) => <article className="card p-4" key={quote.id}><strong>{quote.status}</strong><p className="mt-1 text-sm text-slate-600">{quote.message}</p>{quote.admin_response && <p className="mt-3 rounded bg-[#fafafa] p-3 text-sm font-semibold">{quote.admin_response}</p>}</article>)}
        </section>
      </main>
    </>
  );
}
