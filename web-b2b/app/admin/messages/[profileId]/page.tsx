import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { adminReplyMessageAction } from "@/app/actions";
import { ChatMessageForm } from "@/components/store/chat-message-form";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminMessageThreadPage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;
  const admin = createSupabaseAdminClient();

  const [{ data: profile }, { data: messages }] = await Promise.all([
    admin.from("profiles").select("*").eq("id", profileId).single(),
    admin.from("b2b_messages").select("*").eq("profile_id", profileId).order("created_at", { ascending: true }),
  ]);

  if (!profile) notFound();

  // Mark unread customer messages as read
  await admin
    .from("b2b_messages")
    .update({ is_read: true })
    .eq("profile_id", profileId)
    .eq("is_from_admin", false)
    .eq("is_read", false);

  const thread = messages || [];

  return (
    <>
      <AdminNav />
      <main className="container-shell py-7">
        <div className="mx-auto max-w-2xl">
          <div className="mb-5">
            <Link href="/admin/messages" className="mb-3 inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900">
              <ChevronLeft size={13} /> Back to messages
            </Link>
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white"
                style={{ background: "var(--primary)" }}
              >
                {(profile.business_name || profile.contact_name || "?")[0].toUpperCase()}
              </div>
              <div>
                <p className="font-black text-slate-900">{profile.business_name || profile.contact_name}</p>
                <p className="text-xs text-slate-400">{profile.email}</p>
              </div>
            </div>
          </div>

          {/* Thread */}
          <div className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {thread.length === 0 ? (
              <div className="py-12 text-center text-sm font-semibold text-slate-400">No messages yet</div>
            ) : (
              <div className="px-5 py-4 space-y-4">
                {thread.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.is_from_admin ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        msg.is_from_admin
                          ? "rounded-tr-sm bg-green-700 text-white"
                          : "rounded-tl-sm bg-slate-100 text-slate-800"
                      }`}
                    >
                      {msg.image_url && (
                        <div className="mb-2 overflow-hidden rounded-lg">
                          <Image
                            src={msg.image_url}
                            alt="attachment"
                            width={240}
                            height={180}
                            className="rounded-lg object-cover"
                            unoptimized
                          />
                        </div>
                      )}
                      {msg.content && (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      )}
                      <p className={`mt-1.5 text-[10px] font-semibold ${msg.is_from_admin ? "text-green-200" : "text-slate-400"}`}>
                        {msg.is_from_admin ? "You (Admin)" : (profile.business_name || profile.contact_name)} ·{" "}
                        {new Date(msg.created_at).toLocaleDateString("en-CA", {
                          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reply form */}
          <ChatMessageForm
            action={adminReplyMessageAction}
            placeholder="Type your reply…"
            submitLabel="Send reply"
            extraFields={<input type="hidden" name="profile_id" value={profileId} />}
          />
        </div>
      </main>
    </>
  );
}
