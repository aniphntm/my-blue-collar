import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/casino", destination: "https://mybluecasino.vercel.app/casino" },
      { source: "/casino/:path*", destination: "https://mybluecasino.vercel.app/casino/:path*" },
    ];
  },
};

export default nextConfig;
