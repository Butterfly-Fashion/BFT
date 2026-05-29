"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, ImagePlus, Loader2, ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCartOpen } from "@/components/store/cart-open-context";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Message = {
  id: string;
  content: string;
  image_url: string | null;
  is_from_admin: boolean;
  created_at: string;
};

const supabase = createSupabaseBrowserClient();

export function ChatWidget() {
  const pathname = usePathname();
  const { cartOpen } = useCartOpen();
  const [open, setOpen] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const shouldHide =
    cartOpen ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/auth");

  // Load profile once
  useEffect(() => {
    if (shouldHide) return;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("id").eq("auth_user_id", user.id).single();
      if (data) setProfileId(data.id);
    })();
  }, [shouldHide]);

  // Load messages when opened
  useEffect(() => {
    if (shouldHide || !open || !profileId) return;
    supabase
      .from("b2b_messages")
      .select("id,content,image_url,is_from_admin,created_at")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: true })
      .then(({ data }) => setMessages((data as Message[]) || []));
  }, [open, profileId, shouldHide]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (!shouldHide && open) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [messages, open, shouldHide]);

  // Hide when cart is open or on admin/auth pages. Keep this after hooks so route
  // changes never alter the hook call order for the root-mounted widget.
  if (shouldHide) return null;

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) return;
    setUploading(true);
    setPreview(URL.createObjectURL(file));
    const ext = file.name.split(".").pop() || "jpg";
    const path = `chat/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("b2b-chat-images").upload(path, file, { contentType: file.type });
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from("b2b-chat-images").getPublicUrl(path);
      setImageUrl(publicUrl);
    }
    setUploading(false);
  }

  function removeImage() {
    setPreview(null);
    setImageUrl(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function sendMessage() {
    if ((!text.trim() && !imageUrl) || !profileId || sending) return;
    setSending(true);
    const { data } = await supabase
      .from("b2b_messages")
      .insert({ profile_id: profileId, content: text.trim() || "", image_url: imageUrl || null, is_from_admin: false, is_read: false })
      .select("id,content,image_url,is_from_admin,created_at")
      .single();
    if (data) setMessages((prev) => [...prev, data as Message]);
    setText("");
    removeImage();
    setSending(false);
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  return (
    <>
      {/* Popup panel */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 flex w-80 sm:w-96 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3" style={{ background: "var(--primary)" }}>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
                <MessageCircle size={14} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Butterfly Fashion</p>
                <p className="text-[10px] text-green-200">Support · replies within 1 business day</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-full p-1 text-white/70 hover:bg-white/20 transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ maxHeight: 360 }}>
            {!profileId ? (
              <div className="py-8 text-center">
                <p className="text-sm font-semibold text-slate-500">
                  <a href="/login" className="text-green-700 underline font-bold">Log in</a> to send a message
                </p>
              </div>
            ) : messages.length === 0 ? (
              <div className="py-8 text-center">
                <MessageCircle size={24} className="mx-auto mb-2 text-slate-200" />
                <p className="text-sm font-semibold text-slate-400">No messages yet</p>
                <p className="text-xs text-slate-400 mt-1">Send us a message below</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.is_from_admin ? "justify-start" : "justify-end"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                      msg.is_from_admin ? "rounded-tl-sm bg-slate-100 text-slate-800" : "rounded-tr-sm text-white"
                    }`}
                    style={!msg.is_from_admin ? { background: "var(--primary)" } : {}}
                  >
                    {msg.image_url && (
                      <div className="mb-1.5 overflow-hidden rounded-lg">
                        <Image src={msg.image_url} alt="attachment" width={180} height={130} className="rounded-lg object-cover" unoptimized />
                      </div>
                    )}
                    {msg.content && <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
                    <p className={`mt-1 text-[9px] font-semibold ${msg.is_from_admin ? "text-slate-400" : "text-green-200"}`}>
                      {new Date(msg.created_at).toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Image preview */}
          {preview && (
            <div className="border-t border-slate-100 px-4 py-2 flex items-center gap-2">
              <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-slate-200">
                {uploading && <div className="absolute inset-0 flex items-center justify-center bg-white/80"><Loader2 size={12} className="animate-spin text-slate-500" /></div>}
                <Image src={preview} alt="" fill className="object-cover" unoptimized />
              </div>
              <button onClick={removeImage} className="text-xs font-semibold text-red-500 hover:underline">Remove</button>
            </div>
          )}

          {/* Input */}
          {profileId && (
            <div className="border-t border-slate-100 p-3">
              <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKey}
                  rows={1}
                  placeholder="Type a message…"
                  className="flex-1 resize-none bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none"
                  style={{ maxHeight: 80 }}
                />
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="rounded-md p-1 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                  >
                    <ImagePlus size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={sendMessage}
                    disabled={sending || uploading || (!text.trim() && !imageUrl)}
                    className="rounded-lg p-1.5 text-white transition-colors disabled:opacity-40"
                    style={{ background: "var(--primary)" }}
                  >
                    {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  </button>
                </div>
              </div>
              <p className="mt-1.5 text-center text-[10px] text-slate-400">Enter to send · Shift+Enter for new line</p>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>
          )}
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-4 py-3 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
        style={{ background: "var(--primary)" }}
        aria-label="Open support chat"
      >
        {open ? <ChevronDown size={18} /> : <MessageCircle size={18} />}
        <span className="hidden sm:inline text-white">Message us</span>
      </button>
    </>
  );
}
