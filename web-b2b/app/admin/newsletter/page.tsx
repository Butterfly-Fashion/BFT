import { AdminNav } from "@/components/admin/admin-nav";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { Mail, Download } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminNewsletterPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; q?: string }>;
}) {
  const params = await searchParams;
  const admin = createSupabaseAdminClient();

  let query = admin
    .from("newsletter_subscribers")
    .select("*")
    .order("subscribed_at", { ascending: false });

  if (params.source && params.source !== "all") {
    query = query.eq("source", params.source);
  }
  if (params.q) {
    query = query.or(`email.ilike.%${params.q}%,name.ilike.%${params.q}%`);
  }

  const { data: subscribers } = await query;
  const list = subscribers || [];

  // Counts by source
  const { data: all } = await admin.from("newsletter_subscribers").select("source");
  const allList = all || [];
  const totalB2B = allList.filter((s) => s.source === "b2b").length;
  const totalB2C = allList.filter((s) => s.source !== "b2b").length;

  // CSV data attribute for client download
  const csvRows = [
    ["Email", "Name", "Source", "Subscribed At"],
    ...list.map((s) => [
      s.email,
      s.name || "",
      s.source || "",
      s.subscribed_at ? new Date(s.subscribed_at).toLocaleDateString("en-CA") : "",
    ]),
  ];
  const csvContent = csvRows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");

  return (
    <>
      <AdminNav />
      <main className="container-shell py-7">
        {/* Header */}
        <section className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="section-label">Marketing</p>
            <h1 className="mt-1 text-3xl font-black text-slate-900">Newsletter subscribers</h1>
            <p className="mt-1.5 text-sm font-medium text-slate-500">
              Contacts who opted in via the B2B registration form or B2C storefront.
            </p>
          </div>
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`}
            download="newsletter-subscribers.csv"
            className="btn-secondary flex items-center gap-1.5 text-xs"
          >
            <Download size={13} />
            Export CSV
          </a>
        </section>

        {/* Stats */}
        <section className="mb-5 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Total subscribers", value: allList.length, color: "text-slate-900" },
            { label: "B2B (wholesale)", value: totalB2B, color: "text-green-700" },
            { label: "B2C (storefront)", value: totalB2C, color: "text-blue-700" },
          ].map(({ label, value, color }) => (
            <div key={label} className="card flex items-center gap-4 p-4">
              <Mail size={20} className="shrink-0 text-slate-300" />
              <div>
                <p className="text-xs font-semibold text-slate-500">{label}</p>
                <strong className={`text-2xl font-black ${color}`}>{value}</strong>
              </div>
            </div>
          ))}
        </section>

        {/* Filters */}
        <form className="mb-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="grid gap-3 p-4 sm:grid-cols-[1fr_180px_auto] sm:items-end">
            <label className="label">
              Search
              <input
                className="field"
                defaultValue={params.q || ""}
                name="q"
                placeholder="Email or business name…"
              />
            </label>
            <label className="label">
              Source
              <select className="field" defaultValue={params.source || "all"} name="source">
                <option value="all">All sources</option>
                <option value="b2b">B2B registration</option>
                <option value="b2c">B2C storefront</option>
              </select>
            </label>
            <button className="btn-primary" type="submit">Filter</button>
          </div>
        </form>

        {/* Table */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500">
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Name / Business</th>
                  <th className="px-5 py-3">Source</th>
                  <th className="px-5 py-3">Subscribed</th>
                </tr>
              </thead>
              <tbody>
                {list.map((sub) => (
                  <tr key={sub.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <a
                        href={`mailto:${sub.email}`}
                        className="font-semibold text-slate-900 hover:underline"
                        style={{ color: "var(--primary)" }}
                      >
                        {sub.email}
                      </a>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{sub.name || <span className="text-slate-300">—</span>}</td>
                    <td className="px-5 py-3">
                      <span
                        className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold"
                        style={
                          sub.source === "b2b"
                            ? { borderColor: "#BBF7D0", background: "#F0FDF4", color: "#166534" }
                            : { borderColor: "#BFDBFE", background: "#EFF6FF", color: "#1D4ED8" }
                        }
                      >
                        {sub.source === "b2b" ? "B2B" : "B2C"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {sub.subscribed_at
                        ? new Date(sub.subscribed_at).toLocaleDateString("en-CA", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!list.length && (
            <div className="py-14 text-center">
              <Mail size={24} className="mx-auto mb-3 text-slate-200" />
              <p className="font-semibold text-slate-400">No subscribers yet.</p>
            </div>
          )}
          {list.length > 0 && (
            <div className="border-t border-slate-100 px-5 py-3 text-xs font-semibold text-slate-400">
              {list.length} subscriber{list.length !== 1 ? "s" : ""} shown
            </div>
          )}
        </section>
      </main>
    </>
  );
}
