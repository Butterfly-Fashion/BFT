import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdminCookie } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const isAuthenticated = await verifyAdminCookie();
  if (!isAuthenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();
    const { name, slug, parent_id, sort_order } = body;
    if (!name?.trim() || !slug?.trim()) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("categories")
      .update({ name: name.trim(), slug: slug.trim(), parent_id: parent_id || null, sort_order: sort_order ?? 0 })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ category: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const isAuthenticated = await verifyAdminCookie();
  if (!isAuthenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const supabase = supabaseAdmin();

    // Block deletion if any products use this category
    const { data: cat } = await supabase.from("categories").select("name").eq("id", id).single();
    if (cat) {
      const { count } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("category", cat.name);
      if (count && count > 0) {
        return NextResponse.json({ error: `Cannot delete: ${count} product(s) use this category` }, { status: 409 });
      }
    }

    // Block deletion if has sub-categories
    const { count: childCount } = await supabase
      .from("categories")
      .select("id", { count: "exact", head: true })
      .eq("parent_id", id);
    if (childCount && childCount > 0) {
      return NextResponse.json({ error: "Cannot delete: category has sub-categories" }, { status: 409 });
    }

    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
