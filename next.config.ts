import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    // Project media URLs are admin-entered and may point at any https host.
    // Repo-local paths (e.g. /media/projects/**) are always allowed; files
    // ending in .svg are served unoptimized automatically.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
