import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdminCookie } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const isAuthenticated = await verifyAdminCookie();
  if (!isAuthenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, parent_id, sort_order, created_at")
      .order("sort_order");
    if (error) throw error;
    return NextResponse.json({ categories: data ?? [] });
  } catch (err) {
    console.error("[api/admin/categories] GET error:", err);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const isAuthenticated = await verifyAdminCookie();
  if (!isAuthenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { name, slug, parent_id, sort_order } = body;
    if (!name?.trim() || !slug?.trim()) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("categories")
      .insert({ name: name.trim(), slug: slug.trim(), parent_id: parent_id || null, sort_order: sort_order ?? 0 })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ category: data }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create category";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
