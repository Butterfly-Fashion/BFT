import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { createPreorderCampaignAction } from "@/app/actions";

export const dynamic = "force-dynamic";

export default function NewPreorderCampaignPage() {
  return (
    <>
      <AdminNav />
      <main className="container-shell py-7">
        <form action={createPreorderCampaignAction} className="mx-auto max-w-2xl grid gap-5">
          <section className="card p-5">
            <div className="mb-5 border-b border-slate-100 pb-4">
              <p className="text-xs font-black uppercase tracking-widest text-(--primary)">Pre-order management</p>
              <h1 className="mt-1 text-2xl font-black text-slate-900">New Pre-order Campaign</h1>
              <p className="mt-1 text-sm text-slate-500">
                Create the campaign first (e.g. &ldquo;Winter 2026 Pre-order&rdquo;), then add the products you want to
                gauge demand for on the next screen.
              </p>
            </div>

            <div className="grid gap-4">
              <label className="label">
                Campaign title
                <input className="field" name="title" required placeholder="e.g. Winter 2026 Pre-order" />
              </label>

              <label className="label">
                Description (optional)
                <textarea className="field min-h-24" name="description" placeholder="Season details, expected arrival window, etc." />
              </label>

              <label className="label">
                Closes at (optional)
                <input className="field" name="closes_at" type="datetime-local" />
              </label>
            </div>
          </section>

          <div className="flex justify-end gap-3">
            <Link className="btn-secondary" href="/admin/preorders">Cancel</Link>
            <button className="btn-primary" type="submit">Create &amp; add products →</button>
          </div>
        </form>
      </main>
    </>
  );
}
