import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";

const schema = z.object({
  email: z.string().email(),
  source: z.enum(["footer", "inline"]).default("footer"),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const { email, source } = parsed.data;

  try {
    const supabase = supabaseAdmin();
    const { error } = await supabase
      .from("newsletter_subscribers")
      .upsert({ email, source }, { onConflict: "email", ignoreDuplicates: true });

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[newsletter] subscribe error", err);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
