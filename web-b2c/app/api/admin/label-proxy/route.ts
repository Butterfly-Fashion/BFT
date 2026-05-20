import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCookie } from "@/lib/admin-auth";

const ALLOWED_HOSTS = [
  "deliver.goshippo.com",
  "shippo-production.s3.amazonaws.com",
  "shippo-static.s3.amazonaws.com",
  "shippo-delivery.s3.amazonaws.com",
];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function GET(req: NextRequest) {
  const isAuthenticated = await verifyAdminCookie();
  if (!isAuthenticated) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const rawUrl = new URL(req.url).searchParams.get("url");
  if (!rawUrl) {
    return new NextResponse("Missing url param", { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return new NextResponse("Invalid URL", { status: 400 });
  }

  // SSRF 방지: Shippo 도메인만 허용
  if (parsed.protocol !== "https:" || !ALLOWED_HOSTS.includes(parsed.hostname)) {
    return new NextResponse("URL not allowed", { status: 403 });
  }

  const res = await fetch(rawUrl);
  if (!res.ok) {
    return new NextResponse("Failed to fetch label", { status: 502 });
  }

  // Content-Type 검증
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("pdf") && !contentType.includes("octet-stream")) {
    return new NextResponse("Unexpected content type", { status: 502 });
  }

  // 크기 제한
  const buffer = await res.arrayBuffer();
  if (buffer.byteLength > MAX_BYTES) {
    return new NextResponse("File too large", { status: 502 });
  }

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline",
    },
  });
}
