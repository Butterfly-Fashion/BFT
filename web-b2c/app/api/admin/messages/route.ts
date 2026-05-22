import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdminCookie } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const isAuthenticated = await verifyAdminCookie();
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("contact_messages")
      .select("id,name,email,message,status,admin_reply,replied_at,created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    return NextResponse.json({ messages: data ?? [] });
  } catch (err) {
    console.error("[api/admin/messages] GET error:", err);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}
