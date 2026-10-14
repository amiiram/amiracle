import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          // Same-origin embedding only; pairs with X-Frame-Options for browsers
          // that honour COOP instead of the legacy header.
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          // Deny the powerful features this portfolio never uses.
          {
            key: "Permissions-Policy",
            value: [
              "camera=()",
              "microphone=()",
              "geolocation=()",
              "payment=()",
              "usb=()",
              "interest-cohort=()",
            ].join(", "),
          },
          // HSTS is only meaningful over HTTPS. The `includeSubDomains` flag is
          // safe here: the whole site is served from one origin. If the site is
          // ever previewed over plain HTTP on a real hostname, drop this header
          // outside production rather than shipping it with a short max-age.
          ...(process.env.NODE_ENV === "production"
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=63072000; includeSubDomains",
                },
              ]
            : []),
        ],
      },
      {
        source: "/brand/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/media/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  images: {
    // Project media URLs are admin-entered and may point at any https host.
    // Repo-local paths (e.g. /media/projects/**) are always allowed; files
    // ending in .svg are served unoptimized automatically.
    //
    // NOTE on the wildcard hostname: this makes `/_next/image` act as an image
    // proxy for any https origin. That is a deliberate trade-off so admins can
    // reference externally hosted screenshots, and the Next.js SSRF advisory
    // (GHSA-cjq9-62q9-8jv4) is patched in the pinned next version. If the set of
    // external hosts ever becomes known, replace `**` with an explicit list to
    // remove the proxy behaviour entirely.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    // Optimized images carry no upstream cache-control by default; keep them
    // for 4 hours so the optimizer is not re-fetched per request.
    minimumCacheTTL: 14400,
  },
};

export default nextConfig;
