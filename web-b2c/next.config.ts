import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === "true" });

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
  images: {
    formats: ["image/webp"],
    remotePatterns: [
      // Supabase storage (future uploaded product images)
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/**",
      },
      // Local dev
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },
  async redirects() {
    return [
      // Deleted blog posts → replacement pages (permanent 301)
      { source: "/blog/world-cup-watch-parties-toronto",    destination: "/blog/toronto-world-cup-2026-watch-party-venues",           permanent: true },
      { source: "/blog/world-cup-watch-parties-vancouver",  destination: "/blog/vancouver-world-cup-2026-watch-party-guide",           permanent: true },
      { source: "/blog/world-cup-watch-parties-calgary",    destination: "/blog/calgary-world-cup-2026-watch-party-essentials",        permanent: true },
      { source: "/blog/world-cup-watch-parties-montreal",   destination: "/blog/montreal-world-cup-2026-watch-party-guide",            permanent: true },
      { source: "/blog/backyard-world-cup-party-guide",     destination: "/blog/backyard-world-cup-2026-watch-party-ideas",            permanent: true },
      { source: "/blog/world-cup-fan-zones-canada-2026",    destination: "/blog/world-cup-2026-fan-zones-canada-outdoor-screenings",   permanent: true },
      { source: "/blog/mini-boxing-gloves-souvenir-guide",  destination: "/blog/mini-boxing-gloves-world-cup-gift-guide-2026",         permanent: true },
      { source: "/blog/fathers-day-soccer-gifts",           destination: "/blog/best-soccer-gifts-for-dads",                          permanent: true },
      { source: "/blog/world-cup-2026-sticker-bundle-canada", destination: "/blog/world-cup-sticker-bundle-gift-idea",                 permanent: true },
      { source: "/blog/world-cup-souvenirs-canada",         destination: "/blog/best-world-cup-souvenirs-canada",                     permanent: true },
      { source: "/blog/best-watch-party-food-ideas",        destination: "/blog",                                                     permanent: true },
      { source: "/blog/world-cup-snacks-themed-by-country", destination: "/blog",                                                     permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/asset/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
