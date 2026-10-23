import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse"],
  outputFileTracingExcludes: {
    "*": [
      ".env*",
      "tests/**",
      "docs/**",
      "coverage/**",
    ],
  },
  turbopack: {},
};

export default nextConfig;