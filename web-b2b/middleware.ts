import { NextResponse } from "next/server";

// Site taken offline: every request returns 404. Remove this file
// (or revert the commit that added it) and redeploy to restore the site.
export const config = {
  matcher: "/:path*",
};

export function middleware() {
  return new NextResponse("404 — Not Found", {
    status: 404,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
