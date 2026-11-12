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
  webpack: (config, { isServer }) => {
    config.watchOptions = {
      ...(config.watchOptions || {}),
      aggregateTimeout: 300,
      ignored: [
        "**/node_modules/**",
        "**/.git/**",
        "**/.next/**",
        "**/data/**",
        "**/tests/**",
        "**/docs/**",
        "**/coverage/**",
      ],
    };

    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        dns: false,
        fs: false,
        path: false,
        net: false,
        tls: false,
        child_process: false,
        encoding: false,
        "node:sqlite": false,
        sqlite: false,
      };
    }
    return config;
  },
  turbopack: {},
};

export default nextConfig;