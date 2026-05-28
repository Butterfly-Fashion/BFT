import { NextResponse } from "next/server";
import { storeCategories } from "@/lib/categories";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ categories: storeCategories });
}
