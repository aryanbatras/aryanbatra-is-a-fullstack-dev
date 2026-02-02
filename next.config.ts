import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  reactStrictMode: true,
  devIndicators: {
    position: "bottom-left"
  }
};

export default nextConfig;
