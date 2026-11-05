/**
 * lib/connectors/manifest-parser.ts
 * 
 * DETERMINISTIC DEPENDENCY MANIFEST PARSER & VENDOR FILTER (Phase 2)
 * 
 * Rules:
 * 1. Deterministic extraction: Parses actual dependencies from package.json, requirements.txt,
 *    pyproject.toml, go.mod, and Cargo.toml.
 * 2. Vendor/Generated code filtering: Strictly ignores vendor, build, and minified artifacts.
 * 3. Canonical skill mapping: Maps library names to Cognalyze canonical taxonomy skills.
 * 4. Zero hallucination: If manifest is invalid or empty, returns empty dependencies.
 */

import { getCanonicalSkill } from "../dna/taxonomy";

/**
 * Filter out vendor, build, cache, and generated files.
 */
export function isVendorOrGeneratedPath(filePath: string): boolean {
  if (!filePath) return true;
  const p = filePath.toLowerCase().replace(/\\/g, "/");

  // Vendor & package directories
  if (
    p.includes("/node_modules/") || p.startsWith("node_modules/") ||
    p.includes("/vendor/") || p.startsWith("vendor/") ||
    p.includes("/.next/") || p.startsWith(".next/") ||
    p.includes("/.nuxt/") || p.startsWith(".nuxt/") ||
    p.includes("/dist/") || p.startsWith("dist/") ||
    p.includes("/build/") || p.startsWith("build/") ||
    p.includes("/out/") || p.startsWith("out/") ||
    p.includes("/target/") || p.startsWith("target/") ||
    p.includes("/coverage/") || p.startsWith("coverage/") ||
    p.includes("/.git/") || p.startsWith(".git/") ||
    p.includes("/__pycache__/") || p.startsWith("__pycache__/") ||
    p.includes("/venv/") || p.startsWith("venv/") ||
    p.includes("/.venv/") || p.startsWith(".venv/")
  ) {
    return true;
  }

  // Generated or lock files
  if (
    p.endsWith(".min.js") ||
    p.endsWith(".min.css") ||
    p.endsWith(".bundle.js") ||
    p.endsWith(".chunk.js") ||
    p.endsWith("package-lock.json") ||
    p.endsWith("yarn.lock") ||
    p.endsWith("pnpm-lock.yaml") ||
    p.endsWith("cargo.lock") ||
    p.endsWith(".map") ||
    p.endsWith(".ds_store")
  ) {
    return true;
  }

  return false;
}

/**
 * Known dependency-to-canonical framework/technology mapping.
 */
export const DEPENDENCY_MAPPING: Record<string, string> = {
  // Frontend
  react: "React",
  "react-dom": "React",
  next: "Next.js",
  vue: "Vue.js",
  nuxt: "Nuxt.js",
  angular: "Angular",
  svelte: "Svelte",
  tailwindcss: "Tailwind CSS",
  redux: "Redux",
  "@reduxjs/toolkit": "Redux",
  zustand: "Zustand",

  // Backend & APIs
  express: "Express.js",
  fastapi: "FastAPI",
  flask: "Flask",
  django: "Django",
  nestjs: "NestJS",
  "@nestjs/core": "NestJS",
  gin: "Gin",
  gorilla: "Gorilla Mux",
  actix: "Actix Web",
  spring: "Spring Boot",

  // Databases & ORMs
  pg: "PostgreSQL",
  "pg-promise": "PostgreSQL",
  psycopg2: "PostgreSQL",
  "psycopg2-binary": "PostgreSQL",
  asyncpg: "PostgreSQL",
  mysql: "MySQL",
  mysql2: "MySQL",
  mongodb: "MongoDB",
  mongoose: "MongoDB",
  redis: "Redis",
  ioredis: "Redis",
  prisma: "Prisma",
  "@prisma/client": "Prisma",
  sequelize: "Sequelize",
  typeorm: "TypeORM",
  sqlalchemy: "SQLAlchemy",

  // Data Science & AI/ML
  torch: "PyTorch",
  pytorch: "PyTorch",
  tensorflow: "TensorFlow",
  keras: "Keras",
  sklearn: "Scikit-Learn",
  "scikit-learn": "Scikit-Learn",
  pandas: "Pandas",
  numpy: "NumPy",
  transformers: "Hugging Face Transformers",
  langchain: "LangChain",
  openai: "OpenAI API",

  // Testing & Quality
  jest: "Jest",
  mocha: "Mocha",
  pytest: "Pytest",
  vitest: "Vitest",
  playwright: "Playwright",
  cypress: "Cypress",

  // DevOps & Cloud
  docker: "Docker",
  "@aws-sdk/client-s3": "AWS",
  "aws-sdk": "AWS",
  boto3: "AWS",
};

/**
 * Parses package.json content safely.
 */
export function parsePackageJson(content: string): {
  dependencies: string[];
  devDependencies: string[];
  frameworksFound: string[];
} {
  try {
    const data = JSON.parse(content);
    const deps = Object.keys(data.dependencies || {});
    const devDeps = Object.keys(data.devDependencies || {});
    const all = [...deps, ...devDeps];

    const frameworksFound = new Set<string>();
    for (const dep of all) {
      const lower = dep.toLowerCase().trim();
      if (DEPENDENCY_MAPPING[lower]) {
        frameworksFound.add(DEPENDENCY_MAPPING[lower]);
      }
    }

    return {
      dependencies: deps,
      devDependencies: devDeps,
      frameworksFound: Array.from(frameworksFound),
    };
  } catch {
    return { dependencies: [], devDependencies: [], frameworksFound: [] };
  }
}

/**
 * Parses requirements.txt content safely.
 */
export function parseRequirementsTxt(content: string): {
  dependencies: string[];
  frameworksFound: string[];
} {
  if (!content) return { dependencies: [], frameworksFound: [] };
  const lines = content.split("\n");
  const deps: string[] = [];
  const frameworksFound = new Set<string>();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("-")) continue;

    // Remove version specifiers (e.g., fastapi==0.100.0, torch>=2.0)
    const pkgName = trimmed.split(/[=<>~!;]/)[0].trim().toLowerCase();
    if (pkgName) {
      deps.push(pkgName);
      if (DEPENDENCY_MAPPING[pkgName]) {
        frameworksFound.add(DEPENDENCY_MAPPING[pkgName]);
      }
    }
  }

  return {
    dependencies: deps,
    frameworksFound: Array.from(frameworksFound),
  };
}

/**
 * Parses pyproject.toml content safely.
 */
export function parsePyprojectToml(content: string): {
  dependencies: string[];
  frameworksFound: string[];
} {
  if (!content) return { dependencies: [], frameworksFound: [] };
  const lines = content.split("\n");
  const deps: string[] = [];
  const frameworksFound = new Set<string>();

  let inDependenciesSection = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("[") && trimmed.includes("dependencies")) {
      inDependenciesSection = true;
      continue;
    }
    if (inDependenciesSection && trimmed.startsWith("[")) {
      inDependenciesSection = false;
      continue;
    }

    if (inDependenciesSection) {
      // e.g. fastapi = "^0.100.0" or "fastapi >= 0.100.0"
      const match = trimmed.match(/^["']?([a-zA-Z0-9_-]+)["']?\s*=/);
      if (match && match[1]) {
        const pkg = match[1].toLowerCase();
        deps.push(pkg);
        if (DEPENDENCY_MAPPING[pkg]) {
          frameworksFound.add(DEPENDENCY_MAPPING[pkg]);
        }
      }
    }
  }

  return { dependencies: deps, frameworksFound: Array.from(frameworksFound) };
}

/**
 * Parses go.mod content safely.
 */
export function parseGoMod(content: string): {
  dependencies: string[];
  frameworksFound: string[];
} {
  if (!content) return { dependencies: [], frameworksFound: [] };
  const lines = content.split("\n");
  const deps: string[] = [];
  const frameworksFound = new Set<string>();

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("require") || trimmed.includes("github.com/")) {
      const parts = trimmed.replace("require (", "").replace("require", "").trim().split(/\s+/);
      const pkg = parts[0]?.trim();
      if (pkg && !pkg.startsWith("//") && pkg !== "(" && pkg !== ")") {
        deps.push(pkg);
        const lower = pkg.toLowerCase();
        if (lower.includes("gin-gonic/gin")) frameworksFound.add("Gin");
        if (lower.includes("gorilla/mux")) frameworksFound.add("Gorilla Mux");
        if (lower.includes("grpc")) frameworksFound.add("gRPC");
      }
    }
  }

  return { dependencies: deps, frameworksFound: Array.from(frameworksFound) };
}

/**
 * Parses Cargo.toml content safely.
 */
export function parseCargoToml(content: string): {
  dependencies: string[];
  frameworksFound: string[];
} {
  if (!content) return { dependencies: [], frameworksFound: [] };
  const lines = content.split("\n");
  const deps: string[] = [];
  const frameworksFound = new Set<string>();

  let inDeps = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "[dependencies]") {
      inDeps = true;
      continue;
    }
    if (inDeps && trimmed.startsWith("[")) {
      inDeps = false;
      continue;
    }

    if (inDeps) {
      const match = trimmed.match(/^([a-zA-Z0-9_-]+)\s*=/);
      if (match && match[1]) {
        const pkg = match[1].toLowerCase();
        deps.push(pkg);
        if (pkg === "actix-web") frameworksFound.add("Actix Web");
        if (pkg === "tokio") frameworksFound.add("Tokio");
        if (pkg === "serde") frameworksFound.add("Serde");
      }
    }
  }

  return { dependencies: deps, frameworksFound: Array.from(frameworksFound) };
}
