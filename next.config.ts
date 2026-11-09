import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [{
      source: "/:path((?!api/webhooks$).*)",
      has: [{ type: "host", value: "mybluework.com" }],
      destination: "https://www.mybluework.com/:path",
      permanent: true,
    }];
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/",
          has: [{ type: "host", value: "(?:www\\.)?mybluefinancial\\.com" }],
          destination: "/coin/index.html",
        },
      ],
      afterFiles: [
        { source: "/coin", destination: "/coin/index.html" },
        { source: "/casino", destination: "https://mybluecasino.vercel.app/casino" },
        { source: "/casino/:path*", destination: "https://mybluecasino.vercel.app/casino/:path*" },
      ],
    };
  },
};

export default nextConfig;
