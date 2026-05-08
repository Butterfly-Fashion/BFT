import { respondQuoteAction } from "@/app/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminQuotesPage() {
  const admin = createSupabaseAdminClient();
  const { data: quotes } = await admin.from("quotes").select("*, profiles(business_name,email)").order("created_at", { ascending: false });
  return (
    <>
      <AdminNav />
      <main className="container-shell py-6">
        <h1 className="mb-5 text-3xl font-black">Quotes</h1>
        <div className="grid gap-3">
          {(quotes || []).map((quote) => (
            <article className="card grid gap-4 p-4 lg:grid-cols-[1fr_420px]" key={quote.id}>
              <div><strong>{quote.profiles?.business_name}</strong><p className="text-sm font-semibold text-slate-600">{quote.status} · {quote.profiles?.email}</p><p className="mt-3 text-sm">{quote.message}</p></div>
              <form action={respondQuoteAction} className="grid gap-2">
                <input name="quote_id" type="hidden" value={quote.id} />
                <select className="field" name="status" defaultValue={quote.status}><option>Pending</option><option>Responded</option><option>Converted</option><option>Closed</option><option>Cancelled</option></select>
                <textarea className="field min-h-24" name="admin_response" defaultValue={quote.admin_response || ""} placeholder="Admin response" />
                <button className="btn-primary" type="submit">Save response</button>
              </form>
            </article>
          ))}
        </div>
      </main>
    </>
  );
}
