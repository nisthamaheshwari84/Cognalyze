import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  async rewrites() {
    return [
      {
        source: "/api/interviews/:path*",
        destination: "http://127.0.0.1:3001/api/interviews/:path*",
      },
      {
        source: "/api/interviews",
        destination: "http://127.0.0.1:3001/api/interviews",
      },
      {
        source: "/api/reports/:path*",
        destination: "http://127.0.0.1:3001/api/reports/:path*",
      },
      {
        source: "/api/reports",
        destination: "http://127.0.0.1:3001/api/reports",
      },
      {
        source: "/api/student-dna/:path*",
        destination: "http://127.0.0.1:3001/api/student-dna/:path*",
      },
      {
        source: "/api/student-dna",
        destination: "http://127.0.0.1:3001/api/student-dna",
      },
      {
        source: "/api/speech/:path*",
        destination: "http://127.0.0.1:3001/api/speech/:path*",
      },
      {
        source: "/api/code/execute",
        destination: "http://127.0.0.1:3001/api/code/execute",
      },
      {
        source: "/api/qa/run-regression",
        destination: "http://127.0.0.1:3001/api/qa/run-regression",
      },
      {
        source: "/api/audit",
        destination: "http://127.0.0.1:3001/api/audit",
      },
      {
        source: "/api/health",
        destination: "http://127.0.0.1:3001/api/health",
      },
    ];
  },
};

export default nextConfig;