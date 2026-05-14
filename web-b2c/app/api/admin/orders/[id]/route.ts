import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdminCookie } from "@/lib/admin-auth";
import type { OrderStatus } from "@/lib/types";

const ALLOWED_STATUSES: OrderStatus[] = [
  "paid", "packing", "shipped", "ready_for_pickup", "completed", "cancelled", "refunded",
];

const ALLOWED_CARRIERS = [
  "Canada Post", "UPS", "FedEx", "Purolator", "DHL", "Other",
];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuthenticated = await verifyAdminCookie();
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("orders")
      .select("*, items:order_items(*)")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({ order: { ...data, _source: "supabase" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuthenticated = await verifyAdminCookie();
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: {
    status?: string;
    carrier?: string;
    tracking_number?: string;
    tracking_url?: string;
    admin_note?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  if (body.status !== undefined) {
    if (!ALLOWED_STATUSES.includes(body.status as OrderStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    updates.status = body.status;
  }

  if (body.carrier !== undefined) {
    if (body.carrier && !ALLOWED_CARRIERS.includes(body.carrier)) {
      return NextResponse.json({ error: "Invalid carrier" }, { status: 400 });
    }
    updates.carrier = body.carrier || null;
  }

  if (body.tracking_number !== undefined) {
    updates.tracking_number = body.tracking_number || null;
  }

  if (body.tracking_url !== undefined) {
    updates.tracking_url = body.tracking_url || null;
  }

  if (body.admin_note !== undefined) {
    updates.admin_note = body.admin_note || null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", id)
      .select("*, items:order_items(*)")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({ order: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
