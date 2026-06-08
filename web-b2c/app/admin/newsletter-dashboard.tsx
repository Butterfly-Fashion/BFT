"use client";

import { useEffect, useState, useCallback } from "react";

interface Subscriber {
  id: string;
  email: string;
  source: "footer" | "inline";
  subscribed_at: string;
}

export default function NewsletterDashboard() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState("");

  const fetchSubscribers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/newsletter");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setSubscribers(json.subscribers ?? []);
    } catch {
      setError("Failed to load subscribers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  const filtered = subscribers.filter((s) =>
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  function copyAllEmails() {
    const emails = filtered.map((s) => s.email).join(", ");
    navigator.clipboard.writeText(emails).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-brand" />
          <p className="text-sm font-semibold text-gray-400">Loading subscribers…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Newsletter Subscribers
            </p>
            <p className="mt-0.5 text-2xl font-black text-gray-900">
              {subscribers.length.toLocaleString()}
              <span className="ml-2 text-sm font-semibold text-gray-400">total</span>
            </p>
          </div>
          <button
            onClick={copyAllEmails}
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-50"
          >
            {copied ? "✓ Copied!" : `Copy ${filtered.length} emails`}
          </button>
        </div>

        {/* Search */}
        <div className="mt-3">
          <input
            type="search"
            placeholder="Search by email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-gray-400">
              {search ? "No results for that search." : "No subscribers yet."}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">#</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">Source</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">Signed up</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filtered.map((s, i) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 text-xs text-gray-400">{subscribers.length - i}</td>
                  <td className="px-6 py-3 font-medium text-gray-900">{s.email}</td>
                  <td className="px-6 py-3">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                      s.source === "inline"
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-gray-50 text-gray-600"
                    }`}>
                      {s.source}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-xs text-gray-500">
                    {new Date(s.subscribed_at).toLocaleString("en-CA", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
