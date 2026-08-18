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
        // Heavy WASM/binary assets — immutable cache + pre-compressed serving.
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
          {
            key: "Vary",
            value: "Accept-Encoding",
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
