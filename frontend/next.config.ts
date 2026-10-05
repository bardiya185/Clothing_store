import type { NextConfig } from "next";

const apiProxy = (process.env.API_PROXY_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "");

const nextConfig: NextConfig = {
  // The Arena live preview uses this origin for the Next.js dev client and HMR.
  allowedDevOrigins: [
    "3000-i1etkzbzz6ucz3zrp2088.e2b.app",
    "3000-i7zdvozinvtreop340nsp.e2b.app",
    "3000-i5pvzntp09erup4eaomn3.e2b.app",
  ],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiProxy}/:path*`,
      },
    ];
  },
};

export default nextConfig;
