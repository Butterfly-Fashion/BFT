import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdminCookie } from "@/lib/admin-auth";
import { sendAdminReplyEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuthenticated = await verifyAdminCookie();
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { action, reply } = body as { action?: string; reply?: string };

  const supabase = supabaseAdmin();

  if (action === "mark_read") {
    const { error } = await supabase
      .from("contact_messages")
      .update({ status: "read" })
      .eq("id", id)
      .eq("status", "new");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "reply") {
    if (!reply?.trim()) {
      return NextResponse.json({ error: "Reply text required" }, { status: 400 });
    }

    const { data: msg, error: fetchErr } = await supabase
      .from("contact_messages")
      .select("name,email,message")
      .eq("id", id)
      .single();

    if (fetchErr || !msg) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const { error: updateErr } = await supabase
      .from("contact_messages")
      .update({
        status: "replied",
        admin_reply: reply.trim(),
        replied_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    await sendAdminReplyEmail({
      customerName: msg.name,
      customerEmail: msg.email,
      originalMessage: msg.message,
      adminReply: reply.trim(),
    }).catch((err) => console.error("[api/admin/messages] Failed to send reply email:", err));

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
