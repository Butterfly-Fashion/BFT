import { NextRequest, NextResponse } from "next/server";
import {
  COLD_EMAIL_SOURCE,
  DAILY_COLD_EMAIL_LIMIT,
  parseColdEmailMeta,
  sendColdEmail,
  type ColdEmailRecipient,
} from "@/lib/cold-email";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function torontoClock(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value || "";

  return {
    date: `${value("year")}-${value("month")}-${value("day")}`,
    weekday: value("weekday"),
    hour: Number(value("hour")),
  };
}

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret && request.headers.get("authorization") === `Bearer ${secret}`);
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = request.nextUrl.searchParams.get("dryRun") === "1";
  const force = request.nextUrl.searchParams.get("force") === "1";
  const clock = torontoClock();
  const isWeekday = !["Sat", "Sun"].includes(clock.weekday);

  if (!force && (!isWeekday || clock.hour !== 10)) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "Outside the Toronto weekday 10am window",
      toronto: clock,
    });
  }

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("wholesale_leads")
    .select("id,company,email,message")
    .eq("source", COLD_EMAIL_SOURCE)
    .eq("status", "pending")
    .order("expected_quantity", { ascending: true })
    .limit(DAILY_COLD_EMAIL_LIMIT * 2);

  if (error) {
    console.error("[cold-email] Could not load recipients", error.message);
    return NextResponse.json({ error: "Could not load recipients" }, { status: 500 });
  }

  const candidates = (data || []) as ColdEmailRecipient[];
  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      pendingPreview: candidates.slice(0, DAILY_COLD_EMAIL_LIMIT).map((row) => ({
        company: row.company,
        email: row.email,
        segment: parseColdEmailMeta(row.message).segment || "squishy",
      })),
    });
  }

  let sent = 0;
  let failed = 0;
  const results: Array<{ email: string; status: "sent" | "error" }> = [];

  for (const candidate of candidates) {
    if (sent + failed >= DAILY_COLD_EMAIL_LIMIT) break;

    const { data: claimed, error: claimError } = await db
      .from("wholesale_leads")
      .update({ status: `sending:${clock.date}` })
      .eq("id", candidate.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (claimError) {
      console.error("[cold-email] Claim failed", candidate.email, claimError.message);
      continue;
    }
    if (!claimed) continue;

    const meta = parseColdEmailMeta(candidate.message);
    try {
      const messageId = await sendColdEmail(candidate);
      const sentAt = new Date().toISOString();
      const { error: updateError } = await db
        .from("wholesale_leads")
        .update({
          status: "sent",
          message: JSON.stringify({ ...meta, sentAt, messageId, error: undefined }),
        })
        .eq("id", candidate.id);
      if (updateError) throw updateError;

      sent += 1;
      results.push({ email: candidate.email, status: "sent" });
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : "Unknown send error";
      await db
        .from("wholesale_leads")
        .update({
          status: "error",
          message: JSON.stringify({ ...meta, error: message.slice(0, 500) }),
        })
        .eq("id", candidate.id);
      failed += 1;
      results.push({ email: candidate.email, status: "error" });
      console.error("[cold-email] Send failed", candidate.email, message);
    }
  }

  return NextResponse.json({ ok: true, toronto: clock, sent, failed, results });
}
