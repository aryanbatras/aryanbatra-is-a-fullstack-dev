import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  reactStrictMode: true,
  devIndicators: {
    position: "bottom-left"
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
