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
      .from("newsletter_subscribers")
      .select("id,email,source,subscribed_at")
      .order("subscribed_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ subscribers: data ?? [] });
  } catch (err) {
    console.error("[api/admin/newsletter] GET error:", err);
    return NextResponse.json({ error: "Failed to fetch subscribers" }, { status: 500 });
  }
}
