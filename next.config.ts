import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  reactStrictMode: true,
  devIndicators: {
    position: "bottom-left"
  },
  async headers() {
    return [
      {
        // Heavy WASM/binary assets that stay in /public/aryan/ (no CDN mirror).
        // Cache-Control: immutable tells the browser to NEVER revalidate —
        // the file is content-addressed by the URL, so it never changes.
        // This gives instant loads on repeat visits (disk cache, 0ms).
        source: "/aryan/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // The immersive experience (showreel → desktop) now lives at the home
      // page. /new stays as an alias so old links keep working.
      { source: "/new", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
