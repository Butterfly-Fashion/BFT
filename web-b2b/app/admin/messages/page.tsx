import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { MessageSquare } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const admin = createSupabaseAdminClient();

  // Get all messages grouped by profile
  const { data: messages } = await admin
    .from("b2b_messages")
    .select("profile_id, is_from_admin, is_read, created_at, content")
    .order("created_at", { ascending: false });

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, business_name, contact_name, email");

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  // Group messages by profile_id
  const threadMap = new Map<
    string,
    { lastMsg: string; lastAt: string; unreadCount: number; totalCount: number }
  >();

  for (const msg of messages || []) {
    const existing = threadMap.get(msg.profile_id);
    if (!existing) {
      threadMap.set(msg.profile_id, {
        lastMsg: msg.content,
        lastAt: msg.created_at,
        unreadCount: !msg.is_read && !msg.is_from_admin ? 1 : 0,
        totalCount: 1,
      });
    } else {
      if (!msg.is_read && !msg.is_from_admin) existing.unreadCount++;
      existing.totalCount++;
    }
  }

  const threads = [...threadMap.entries()]
    .map(([profileId, data]) => ({ profileId, ...data, profile: profileMap.get(profileId) }))
    .sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());

  const totalUnread = threads.reduce((s, t) => s + t.unreadCount, 0);

  return (
    <>
      <AdminNav />
      <main className="container-shell py-7">
        <section className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="section-label">Support</p>
            <h1 className="mt-1 text-3xl font-black text-slate-900">
              Messages
              {totalUnread > 0 && (
                <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-sm font-black text-white">
                  {totalUnread}
                </span>
              )}
            </h1>
            <p className="mt-1.5 text-sm font-medium text-slate-500">
              Customer support conversations.
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {threads.length === 0 ? (
            <div className="py-16 text-center">
              <MessageSquare size={24} className="mx-auto mb-3 text-slate-200" />
              <p className="font-semibold text-slate-400">No messages yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {threads.map((thread) => (
                <Link
                  key={thread.profileId}
                  href={`/admin/messages/${thread.profileId}`}
                  className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50"
                >
                  {/* Avatar */}
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white"
                    style={{ background: "var(--primary)" }}
                  >
                    {(thread.profile?.business_name || thread.profile?.contact_name || "?")[0].toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-bold text-slate-900">
                        {thread.profile?.business_name || thread.profile?.contact_name || thread.profileId.slice(0, 8)}
                      </p>
                      <span className="shrink-0 text-xs text-slate-400">
                        {new Date(thread.lastAt).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <p className="mt-0.5 flex items-center gap-1.5">
                      <span className="truncate text-sm text-slate-500">{thread.lastMsg}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">{thread.profile?.email}</p>
                  </div>

                  {/* Unread badge */}
                  {thread.unreadCount > 0 && (
                    <span className="shrink-0 rounded-full bg-red-500 px-2 py-0.5 text-xs font-black text-white">
                      {thread.unreadCount}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
