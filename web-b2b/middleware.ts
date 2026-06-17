import { NextResponse } from "next/server";

// Temporary full-site maintenance mode. Every request returns a 503
// maintenance page. To bring the site back online, delete this file
// (or revert the commit that added it) and redeploy.
export const config = {
  matcher: "/:path*",
};

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex" />
  <title>Under Maintenance — Butterfly Fashion Trading</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #166534;
      color: #fff;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      text-align: center;
    }
    .card { max-width: 540px; }
    .brand { font-size: 14px; font-weight: 700; letter-spacing: 0.12em; opacity: 0.8; text-transform: uppercase; }
    h1 { font-size: 40px; font-weight: 900; line-height: 1.1; margin: 20px 0 16px; }
    p { font-size: 17px; line-height: 1.6; opacity: 0.92; }
    a { color: #fff; font-weight: 700; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">Butterfly Fashion Trading</div>
    <h1>We&rsquo;ll be back soon</h1>
    <p>Our wholesale site is temporarily down for maintenance. Please check back shortly.<br />For urgent orders, email <a href="mailto:orders@butterfly-fashion.ca">orders@butterfly-fashion.ca</a>.</p>
  </div>
</body>
</html>`;

export function middleware() {
  return new NextResponse(html, {
    status: 503,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "retry-after": "3600",
      "cache-control": "no-store",
    },
  });
}
