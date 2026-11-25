import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  devIndicators: false,
  serverExternalPackages: ["pdf-parse"],
  outputFileTracingExcludes: {
    "*": [
      ".env*",
      "tests/**",
      "docs/**",
      "coverage/**",
      "interview-intelligence/**",
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
        "**/interview-intelligence/**",
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
  async redirects() {
    return [
      {
        source: "/interview",
        destination: "/student/practice-interview",
        permanent: false,
      },
      {
        source: "/student/learn",
        destination: "/skill-practice",
        permanent: false,
      },
      {
        source: "/student/learn/:path*",
        destination: "/skill-practice",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;