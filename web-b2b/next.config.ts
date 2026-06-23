import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    root: __dirname,
  },
  experimental: {
    // Server Actions default to a 1 MB body limit. Admin image uploads (blog
    // cover, product, lookbook, hero) go through Server Actions as multipart
    // form data, so a normal-sized photo (the blog form allows up to 5 MB)
    // exceeds the default and fails on Vercel. Raise the limit to fit them.
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
  images: {
    remotePatterns: [
      // Supabase storage buckets
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/**",
      },
      // Country flag CDN used in the nations marquee
      {
        protocol: "https",
        hostname: "flagcdn.com",
      },
      // Local dev
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      { source: "/pre-orders", destination: "/preorders", permanent: true },
      { source: "/pre-orders/:path*", destination: "/preorders", permanent: true },
    ];
  },
};

export default nextConfig;
