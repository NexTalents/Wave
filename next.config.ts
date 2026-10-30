import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    agentUpgrade: "security",
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "amartha.com", pathname: "/**" },
      { protocol: "https", hostname: "content-hub.amartha.com", pathname: "/**" },
    ],
  },
}

export default nextConfig
