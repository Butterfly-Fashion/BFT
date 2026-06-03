import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("auth_user_id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const visibility = searchParams.get("visibility") || "";
  const channel = searchParams.get("channel") || "";

  const admin = createSupabaseAdminClient();
  let query = admin.from("products").select("*").order("updated_at", { ascending: false });
  if (category) query = query.eq("category", category);
  if (visibility === "visible") query = query.eq("is_hidden", false);
  if (visibility === "hidden") query = query.eq("is_hidden", true);
  if (channel === "b2c") query = query.contains("sales_channels", ["b2c"]);
  if (channel === "b2b") query = query.contains("sales_channels", ["b2b"]);
  if (q) query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%,category.ilike.%${q}%`);

  const { data: products } = await query;
  const rows = products || [];

  const headers = ["SKU", "Name", "Category", "Unit Price", "Case Price", "Case Qty", "Availability", "Visibility", "Sales Channels", "Weight (kg)", "Description"];
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const lines = [
    headers.join(","),
    ...rows.map((p) =>
      [
        p.sku,
        p.name,
        p.category,
        p.unit_price,
        p.case_price ?? "",
        p.case_qty ?? "",
        p.availability_status,
        p.is_hidden ? "Hidden" : "Visible",
        (p.sales_channels || []).join("|"),
        p.weight_kg ?? "",
        p.description ?? "",
      ].map(escape).join(",")
    ),
  ];

  const csv = lines.join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="products-export.csv"`,
    },
  });
}
