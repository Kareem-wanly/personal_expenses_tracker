import { withSerwist } from "@serwist/turbopack";
import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Microphone: this site only (voice assistant); no third-party frames.
  { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // libSQL ships native bindings; keep it out of the server bundle.
  serverExternalPackages: ["@libsql/client", "libsql"],
  experimental: {
    // Detect offline state & auto-retry navigations / Server Actions.
    useOffline: true,
    // Keep visited tabs in the client cache for a while so switching back
    // (tap or swipe) is instant instead of re-showing the skeleton. Every
    // mutation calls refresh(), which clears this cache, so edits made in
    // the app always show; only changes from another device wait ≤ 2 min.
    staleTimes: { dynamic: 120 },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      {
        source: "/serwist/:path*",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default withSerwist(nextConfig);
