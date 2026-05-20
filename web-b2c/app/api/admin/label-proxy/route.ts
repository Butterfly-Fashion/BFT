import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCookie } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const isAuthenticated = await verifyAdminCookie();
  if (!isAuthenticated) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const url = new URL(req.url).searchParams.get("url");
  if (!url || !url.startsWith("https://")) {
    return new NextResponse("Invalid URL", { status: 400 });
  }

  const res = await fetch(url);
  if (!res.ok) {
    return new NextResponse("Failed to fetch label", { status: 502 });
  }

  const buffer = await res.arrayBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline",
    },
  });
}
