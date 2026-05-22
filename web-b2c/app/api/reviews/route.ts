import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("product_reviews")
      .select("id,author_name,rating,body,created_at")
      .eq("product_slug", slug)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json({ error: "Failed to load reviews" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { product_slug, author_name, rating, body } = await req.json();

    if (!product_slug || !author_name || !rating) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be 1–5" }, { status: 400 });
    }
    if (author_name.length > 80 || (body && body.length > 1000)) {
      return NextResponse.json({ error: "Input too long" }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    const { error } = await supabase.from("product_reviews").insert({
      product_slug,
      author_name: author_name.trim(),
      rating,
      body: body?.trim() ?? null,
    });

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
