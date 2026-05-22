"use client";

import { useEffect, useState, useCallback } from "react";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  status: "new" | "read" | "replied";
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
}

const STATUS_BADGE: Record<ContactMessage["status"], string> = {
  new: "bg-[#C41E3A]/10 text-[#C41E3A] border-[#C41E3A]/20",
  read: "bg-gray-100 text-gray-600 border-gray-200",
  replied: "bg-green-50 text-green-700 border-green-200",
};

const STATUS_LABEL: Record<ContactMessage["status"], string> = {
  new: "New",
  read: "Read",
  replied: "Replied",
};

export default function MessagesDashboard() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [replyMsg, setReplyMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/messages");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setMessages(json.messages ?? []);
    } catch {
      setError("Failed to load messages.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  async function openMessage(msg: ContactMessage) {
    setSelected(msg);
    setReplyText("");
    setReplyMsg(null);
    if (msg.status === "new") {
      await fetch(`/api/admin/messages/${msg.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_read" }),
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, status: "read" } : m))
      );
      setSelected((prev) => (prev?.id === msg.id ? { ...prev, status: "read" } : prev));
    }
  }

  async function sendReply() {
    if (!selected || !replyText.trim()) return;
    setReplying(true);
    setReplyMsg(null);
    try {
      const res = await fetch(`/api/admin/messages/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reply", reply: replyText.trim() }),
      });
      if (!res.ok) throw new Error("Failed to reply");
      setReplyMsg({ type: "ok", text: "Reply sent!" });
      const updated: ContactMessage = {
        ...selected,
        status: "replied",
        admin_reply: replyText.trim(),
        replied_at: new Date().toISOString(),
      };
      setSelected(updated);
      setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setReplyText("");
    } catch {
      setReplyMsg({ type: "err", text: "Failed to send reply." });
    } finally {
      setReplying(false);
    }
  }

  const newCount = messages.filter((m) => m.status === "new").length;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#C41E3A]" />
          <p className="text-sm font-semibold text-gray-400">Loading messages…</p>
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
    <div className="flex h-full overflow-hidden">
      {/* Message list */}
      <div className="flex w-80 shrink-0 flex-col border-r border-gray-200 bg-white overflow-y-auto">
        <div className="border-b border-gray-100 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Customer Messages
            {newCount > 0 && (
              <span className="ml-2 rounded-full bg-[#C41E3A] px-1.5 py-0.5 text-[10px] font-bold text-white">
                {newCount}
              </span>
            )}
          </p>
        </div>

        {messages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-8">
            <p className="text-center text-sm text-gray-400">No messages yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {messages.map((msg) => (
              <li key={msg.id}>
                <button
                  onClick={() => openMessage(msg)}
                  className={`w-full px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                    selected?.id === msg.id ? "bg-gray-50" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className={`truncate text-sm ${msg.status === "new" ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>
                      {msg.name}
                    </p>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_BADGE[msg.status]}`}
                    >
                      {STATUS_LABEL[msg.status]}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-gray-500">{msg.email}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-gray-500">{msg.message}</p>
                  <p className="mt-1 text-[10px] text-gray-400">
                    {new Date(msg.created_at).toLocaleString("en-CA", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Detail / reply panel */}
      <div className="flex flex-1 flex-col overflow-hidden bg-gray-50">
        {selected ? (
          <>
            <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-bold text-gray-900">{selected.name}</p>
                  <a
                    href={`mailto:${selected.email}`}
                    className="text-sm text-[#C41E3A] hover:underline"
                  >
                    {selected.email}
                  </a>
                </div>
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE[selected.status]}`}
                >
                  {STATUS_LABEL[selected.status]}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Received:{" "}
                {new Date(selected.created_at).toLocaleString("en-CA", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Customer message */}
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Message
                </p>
                <div className="rounded-xl bg-white border border-gray-200 p-4">
                  <p className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
                    {selected.message}
                  </p>
                </div>
              </div>

              {/* Previous reply (if any) */}
              {selected.admin_reply && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-400">
                    Your Reply ·{" "}
                    {selected.replied_at &&
                      new Date(selected.replied_at).toLocaleString("en-CA", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                  </p>
                  <div className="rounded-xl bg-[#C41E3A]/5 border border-[#C41E3A]/15 p-4">
                    <p className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
                      {selected.admin_reply}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Reply composer */}
            <div className="shrink-0 border-t border-gray-200 bg-white px-6 py-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
                {selected.admin_reply ? "Send Another Reply" : "Reply"}
              </p>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={4}
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#C41E3A] focus:ring-2 focus:ring-[#C41E3A]/15"
                placeholder={`Reply to ${selected.name}…`}
              />
              {replyMsg && (
                <p
                  className={`mt-1 text-xs font-semibold ${
                    replyMsg.type === "ok" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {replyMsg.text}
                </p>
              )}
              <div className="mt-3 flex justify-end">
                <button
                  onClick={sendReply}
                  disabled={replying || !replyText.trim()}
                  className="rounded-full bg-[#C41E3A] px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-[#A01830] disabled:opacity-50"
                >
                  {replying ? "Sending…" : "Send Reply"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mx-auto mb-3 h-10 w-10 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p className="text-sm text-gray-400">Select a message to reply</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
