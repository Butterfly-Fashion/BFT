import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, parent_id, sort_order")
      .order("sort_order");
    if (error) throw error;
    return NextResponse.json({ categories: data ?? [] });
  } catch {
    return NextResponse.json({ categories: [] });
  }
}
