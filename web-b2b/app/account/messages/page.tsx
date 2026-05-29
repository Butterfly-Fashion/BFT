import Image from "next/image";
import { Header } from "@/components/store/header";
import { requireProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendCustomerMessageAction } from "@/app/actions";
import { ChatMessageForm } from "@/components/store/chat-message-form";
import { MessageSquare } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AccountMessagesPage() {
  const profile = await requireProfile();

  const supabase = await createSupabaseServerClient();
  const { data: messages } = await supabase
    .from("b2b_messages")
    .select("*")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: true });

  const thread = messages || [];

  return (
    <>
      <Header profile={profile} />
      <main className="container-shell py-6">
        <div className="mx-auto max-w-2xl">
          <div className="mb-5">
            <p className="section-label">Support</p>
            <h1 className="mt-1 text-2xl font-black text-slate-900">Messages</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Send us a message and our team will respond within 1 business day.
            </p>
          </div>

          {/* Thread */}
          <div className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {thread.length === 0 ? (
              <div className="py-16 text-center">
                <MessageSquare size={28} className="mx-auto mb-3 text-slate-200" />
                <p className="font-semibold text-slate-400">No messages yet</p>
                <p className="mt-1 text-sm text-slate-400">Send your first message below</p>
              </div>
            ) : (
              <div className="px-5 py-4 space-y-4">
                {thread.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.is_from_admin ? "justify-start" : "justify-end"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        msg.is_from_admin
                          ? "rounded-tl-sm bg-slate-100 text-slate-800"
                          : "rounded-tr-sm bg-green-700 text-white"
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
                      <p className={`mt-1.5 text-[10px] font-semibold ${msg.is_from_admin ? "text-slate-400" : "text-green-200"}`}>
                        {msg.is_from_admin ? "Butterfly Fashion" : "You"} ·{" "}
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

          {/* Send form */}
          <ChatMessageForm
            action={sendCustomerMessageAction}
            placeholder="Type your message…"
            submitLabel="Send"
          />
        </div>
      </main>
    </>
  );
}
