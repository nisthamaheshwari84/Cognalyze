/**
 * lib/evidence/code-implementation-analyzer.ts
 * 
 * COGNALYZE CODE IMPLEMENTATION & EVIDENCE UNDERSTANDING ENGINE (Phase 4)
 * 
 * Rules:
 * 1. Differentiate keyword mentions, declared dependencies, imports, and genuine implementations.
 * 2. Deep test assertion inspection: Distinguish trivial empty tests from substantive assertions.
 * 3. Architectural & reliability pattern discovery (Transactions, Auth, Routing, Queues, Validation).
 * 4. Project maturity classification:
 *    - PROOF_OF_CONCEPT: Minimal files, no tests, script-level.
 *    - ACTIVE_DEVELOPMENT: Modular code, real manifests, partial tests, no CI.
 *    - PRODUCTION_READY: Modular architecture, genuine test assertions, CI configured, env config.
 *    - TEMPLATE_DERIVED: Boilerplate starter with minimal student additions.
 * 5. Strict multi-tenant isolation, pure deterministic execution, zero hallucinations.
 */

import { EvidenceDirectness } from "./canonical-types";
import { DEPENDENCY_MAPPING } from "../connectors/manifest-parser";

// ─── 1. TYPES & CONTRACTS ───

export type ArchitecturalPatternType =
  | "REST_API_ENDPOINTS"
  | "GRAPHQL_RESOLVERS"
  | "DATABASE_TRANSACTIONS"
  | "AUTH_MIDDLEWARE"
  | "MESSAGE_QUEUES_WORKERS"
  | "STATE_MANAGEMENT"
  | "ERROR_HANDLING_MIDDLEWARE"
  | "INPUT_VALIDATION_SCHEMA";

export interface DetectedArchitecturalPattern {
  pattern: ArchitecturalPatternType;
  title: string;
  description: string;
  evidenceFiles: string[];
  sampleSnippet?: string;
  significance: "CORE_ARCHITECTURE" | "RELIABILITY" | "INTERFACE";
}

export interface TestSuiteQualityResult {
  testCount: number;
  assertionCount: number;
  hasMocksOrFixtures: boolean;
  hasMeaningfulAssertions: boolean;
  assertionDensity: number; // assertions per test
  qualityRating: "HIGH" | "ADEQUATE" | "TRIVIAL" | "NO_TESTS";
  detectedFrameworks: string[];
}

export type ProjectMaturityLevel =
  | "PROOF_OF_CONCEPT"
  | "ACTIVE_DEVELOPMENT"
  | "PRODUCTION_READY"
  | "TEMPLATE_DERIVED";

export interface ProjectMaturityInput {
  repoName: string;
  totalFilesCount: number;
  isFork: boolean;
  isTemplate?: boolean;
  manifestsCount: number;
  testFilesCount: number;
  meaningfulTestAssertionsCount: number;
  ciConfigured: boolean;
  hasEnvironmentConfig?: boolean;
  architecturalPatternsCount: number;
}

export interface ProjectMaturityEvaluation {
  maturity: ProjectMaturityLevel;
  rationale: string;
  checklist: {
    hasModularStructure: boolean;
    hasMeaningfulTests: boolean;
    hasContinuousIntegration: boolean;
    hasProductionConfig: boolean;
    hasArchitecturalPatterns: boolean;
  };
  confidenceScore: number;
}

export interface SkillImplementationDirectnessResult {
  directness: EvidenceDirectness;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  isDirectImplementation: boolean;
  rationale: string;
  matchedSnippets: Array<{
    filePath: string;
    lineRange: string;
    snippet: string;
  }>;
}

// ─── 2. TEST QUALITY & ASSERTION VERIFIER ───

/**
 * Inspects test file contents to distinguish real assertions from trivial / empty tests.
 */
export function analyzeTestFileQuality(content: string, filePath: string): TestSuiteQualityResult {
  if (!content || typeof content !== "string") {
    return {
      testCount: 0,
      assertionCount: 0,
      hasMocksOrFixtures: false,
      hasMeaningfulAssertions: false,
      assertionDensity: 0,
      qualityRating: "NO_TESTS",
      detectedFrameworks: [],
    };
  }

  const detectedFrameworks: string[] = [];

  // 1. Detect Test Frameworks
  if (/vitest/i.test(content) || /from ['"]vitest['"]/i.test(content)) detectedFrameworks.push("Vitest");
  if (/jest/i.test(content) || /from ['"]@jest/i.test(content)) detectedFrameworks.push("Jest");
  if (/mocha/i.test(content) || /chai/i.test(content)) detectedFrameworks.push("Mocha/Chai");
  if (/pytest/i.test(content) || /import pytest/i.test(content)) detectedFrameworks.push("Pytest");
  if (/unittest/i.test(content) || /import unittest/i.test(content)) detectedFrameworks.push("Python Unittest");
  if (/testing/i.test(filePath) && /func Test[A-Z]/i.test(content)) detectedFrameworks.push("Go testing");
  if (/test/i.test(filePath) && /#\[test\]/i.test(content)) detectedFrameworks.push("Rust test");

  // 2. Count Tests
  const jsTsTests = (content.match(/\b(?:test|it)\s*\(\s*['"`]/g) || []).length;
  const pyTests = (content.match(/def\s+test_[a-zA-Z0-9_]+\s*\(/g) || []).length;
  const goTests = (content.match(/func\s+Test[a-zA-Z0-9_]+\s*\(/g) || []).length;
  const rustTests = (content.match(/#\[test\]/g) || []).length;
  const testCount = Math.max(1, jsTsTests + pyTests + goTests + rustTests);

  // 3. Count Meaningful Assertions
  const jsExpects = (content.match(/\bexpect\s*\(/g) || []).length;
  const jsAsserts = (content.match(/\bassert(?:\.strictEqual|\.equal|\.deepEqual|\.ok|\.match|\.throws)?\s*\(/g) || []).length;
  const pyAsserts = (content.match(/\bassert\s+[^#\n\r]+/g) || []).length;
  const pySelfAsserts = (content.match(/\bself\.assert(?:Equal|True|False|In|Raises|IsNone|IsNotNone)\s*\(/g) || []).length;
  const pyRaises = (content.match(/pytest\.raises\s*\(/g) || []).length;
  const goAsserts = (content.match(/\b(?:assert|require)\.[A-Z][a-zA-Z0-9_]*\s*\(|\bt\.(?:Errorf|Fatalf|FailNow)\s*\(/g) || []).length;
  const rustAsserts = (content.match(/\bassert(?:_eq|_ne)?!\s*\(/g) || []).length;

  const totalAssertions = jsExpects + jsAsserts + pyAsserts + pySelfAsserts + pyRaises + goAsserts + rustAsserts;

  // 4. Mocks & Fixtures
  const hasMocksOrFixtures =
    /\b(?:jest\.mock|vi\.mock|mock\.patch|pytest\.fixture|beforeEach|afterEach|beforeAll|afterAll|sinon|nock)\b/i.test(
      content
    );

  const assertionDensity = testCount > 0 ? Math.round((totalAssertions / testCount) * 100) / 100 : 0;
  const hasMeaningfulAssertions = totalAssertions >= 1;

  let qualityRating: TestSuiteQualityResult["qualityRating"] = "NO_TESTS";
  if (testCount > 0) {
    if (totalAssertions >= 2 && hasMeaningfulAssertions && (assertionDensity >= 1.0 || hasMocksOrFixtures)) {
      qualityRating = "HIGH";
    } else if (totalAssertions >= 1) {
      qualityRating = "ADEQUATE";
    } else {
      qualityRating = "TRIVIAL";
    }
  }

  return {
    testCount,
    assertionCount: totalAssertions,
    hasMocksOrFixtures,
    hasMeaningfulAssertions,
    assertionDensity,
    qualityRating,
    detectedFrameworks,
  };
}

// ─── 3. ARCHITECTURAL & RELIABILITY PATTERN DISCOVERY ───

/**
 * Scans code files for recognized architectural and resilience patterns.
 */
export function analyzeArchitecturalPatterns(
  files: Array<{ path: string; content?: string }>
): {
  detectedPatterns: DetectedArchitecturalPattern[];
  reliabilityScore: number;
} {
  const detectedPatterns: DetectedArchitecturalPattern[] = [];
  let reliabilityPoints = 0;

  for (const f of files) {
    const rawContent = f.content || "";
    if (!rawContent) continue;
    const lowerPath = f.path.toLowerCase();

    // 1. REST API Endpoints
    if (
      /(?:@app\.(?:get|post|put|delete|patch)|router\.(?:get|post|put|delete|patch)|app\.(?:get|post|put|delete|patch))\s*\(/i.test(
        rawContent
      )
    ) {
      if (!detectedPatterns.some((p) => p.pattern === "REST_API_ENDPOINTS")) {
        detectedPatterns.push({
          pattern: "REST_API_ENDPOINTS",
          title: "RESTful HTTP API Endpoints",
          description: "Declarative HTTP route handlers and request dispatching.",
          evidenceFiles: [f.path],
          significance: "INTERFACE",
        });
      } else {
        const existing = detectedPatterns.find((p) => p.pattern === "REST_API_ENDPOINTS")!;
        if (!existing.evidenceFiles.includes(f.path)) existing.evidenceFiles.push(f.path);
      }
    }

    // 2. Database Transactions
    if (
      /(?:\$transaction|\b(?:BEGIN|COMMIT|ROLLBACK|session\.commit|conn\.transaction|tx\.Commit|startTransaction|beginTransaction)\b)/i.test(
        rawContent
      )
    ) {
      reliabilityPoints += 25;
      if (!detectedPatterns.some((p) => p.pattern === "DATABASE_TRANSACTIONS")) {
        detectedPatterns.push({
          pattern: "DATABASE_TRANSACTIONS",
          title: "Atomic Database Transactions",
          description: "ACID transaction boundaries ensuring state consistency.",
          evidenceFiles: [f.path],
          significance: "RELIABILITY",
        });
      } else {
        const existing = detectedPatterns.find((p) => p.pattern === "DATABASE_TRANSACTIONS")!;
        if (!existing.evidenceFiles.includes(f.path)) existing.evidenceFiles.push(f.path);
      }
    }

    // 3. Auth & Guard Middleware
    if (
      /\b(?:jwt\.verify|passport\.authenticate|require_auth|requireAuth|authenticate|authenticateToken|authMiddleware|Depends\(get_current_user\)|verify_token|verifyToken|authorization\.startsWith)\b/i.test(
        rawContent
      )
    ) {
      reliabilityPoints += 25;
      if (!detectedPatterns.some((p) => p.pattern === "AUTH_MIDDLEWARE")) {
        detectedPatterns.push({
          pattern: "AUTH_MIDDLEWARE",
          title: "Authentication & Authorization Guards",
          description: "Protected route middleware with token validation.",
          evidenceFiles: [f.path],
          significance: "CORE_ARCHITECTURE",
        });
      } else {
        const existing = detectedPatterns.find((p) => p.pattern === "AUTH_MIDDLEWARE")!;
        if (!existing.evidenceFiles.includes(f.path)) existing.evidenceFiles.push(f.path);
      }
    }

    // 4. Background Queues & Workers
    if (
      /\b(?:celery|bullmq|bull|amqp|kafka\.consumer|rabbitmq|createQueue|sqs\.send)\b/i.test(
        rawContent
      )
    ) {
      reliabilityPoints += 20;
      if (!detectedPatterns.some((p) => p.pattern === "MESSAGE_QUEUES_WORKERS")) {
        detectedPatterns.push({
          pattern: "MESSAGE_QUEUES_WORKERS",
          title: "Asynchronous Message Queues & Workers",
          description: "Decoupled background task execution and event-driven worker pools.",
          evidenceFiles: [f.path],
          significance: "CORE_ARCHITECTURE",
        });
      } else {
        const existing = detectedPatterns.find((p) => p.pattern === "MESSAGE_QUEUES_WORKERS")!;
        if (!existing.evidenceFiles.includes(f.path)) existing.evidenceFiles.push(f.path);
      }
    }

    // 5. Input Validation Schemas
    if (
      /\b(?:zod|pydantic|BaseModel|class-validator|joi|z\.object|yup)\b/i.test(rawContent) ||
      /\bz\.string\(\)|\bz\.number\(\)/i.test(rawContent)
    ) {
      reliabilityPoints += 15;
      if (!detectedPatterns.some((p) => p.pattern === "INPUT_VALIDATION_SCHEMA")) {
        detectedPatterns.push({
          pattern: "INPUT_VALIDATION_SCHEMA",
          title: "Strong Input Validation Schemas",
          description: "Runtime request payload verification against strict type schemas.",
          evidenceFiles: [f.path],
          significance: "RELIABILITY",
        });
      } else {
        const existing = detectedPatterns.find((p) => p.pattern === "INPUT_VALIDATION_SCHEMA")!;
        if (!existing.evidenceFiles.includes(f.path)) existing.evidenceFiles.push(f.path);
      }
    }

    // 6. Centralized Error Handling
    if (
      /\b(?:app\.use\s*\(\s*\(\s*err,\s*req,\s*res,\s*next\)|@app\.exception_handler|GlobalExceptionHandler|catchAsync)\b/i.test(
        rawContent
      )
    ) {
      reliabilityPoints += 15;
      if (!detectedPatterns.some((p) => p.pattern === "ERROR_HANDLING_MIDDLEWARE")) {
        detectedPatterns.push({
          pattern: "ERROR_HANDLING_MIDDLEWARE",
          title: "Centralized Error Handling Middleware",
          description: "Structured error capture and client response normalization.",
          evidenceFiles: [f.path],
          significance: "RELIABILITY",
        });
      }
    }

    // 7. Frontend State Management
    if (
      /\b(?:useReducer|createContext|createSlice|configureStore|zustand|create\s*\(\s*\(set\)\s*=>)\b/i.test(
        rawContent
      )
    ) {
      if (!detectedPatterns.some((p) => p.pattern === "STATE_MANAGEMENT")) {
        detectedPatterns.push({
          pattern: "STATE_MANAGEMENT",
          title: "Predictable Frontend State Management",
          description: "Contextual or global store state architecture with explicit transitions.",
          evidenceFiles: [f.path],
          significance: "CORE_ARCHITECTURE",
        });
      }
    }
  }

  const reliabilityScore = Math.min(1.0, Math.round((reliabilityPoints / 100) * 100) / 100);

  return {
    detectedPatterns,
    reliabilityScore,
  };
}

// ─── 4. PROJECT MATURITY CLASSIFIER ───

/**
 * Classifies repository maturity into PROOF_OF_CONCEPT, ACTIVE_DEVELOPMENT,
 * PRODUCTION_READY, or TEMPLATE_DERIVED based on structural and testing facts.
 */
export function classifyProjectMaturity(input: ProjectMaturityInput): ProjectMaturityEvaluation {
  const hasModularStructure = input.totalFilesCount >= 6;
  const hasMeaningfulTests = input.testFilesCount >= 1 && input.meaningfulTestAssertionsCount >= 3;
  const hasContinuousIntegration = Boolean(input.ciConfigured);
  const hasProductionConfig = Boolean(input.hasEnvironmentConfig);
  const hasArchitecturalPatterns = input.architecturalPatternsCount >= 2;

  // 1. Template / Boilerplate check
  if (input.isTemplate) {
    return {
      maturity: "TEMPLATE_DERIVED",
      rationale: "Repository is identified as a boilerplate or template repository.",
      checklist: {
        hasModularStructure,
        hasMeaningfulTests,
        hasContinuousIntegration,
        hasProductionConfig,
        hasArchitecturalPatterns,
      },
      confidenceScore: 0.90,
    };
  }

  // 2. Production Ready check: must have tests, CI, modularity, and architectural patterns
  if (hasContinuousIntegration && hasMeaningfulTests && hasModularStructure) {
    return {
      maturity: "PRODUCTION_READY",
      rationale: `Repository exhibits production-grade maturity: automated CI/CD workflows, comprehensive test assertions (${input.meaningfulTestAssertionsCount} verified), and modular architecture.`,
      checklist: {
        hasModularStructure,
        hasMeaningfulTests,
        hasContinuousIntegration,
        hasProductionConfig,
        hasArchitecturalPatterns,
      },
      confidenceScore: 0.95,
    };
  }

  // 3. Active Development: has dependencies and multi-file structure, some tests or patterns, but lacks automated CI
  if (hasModularStructure && (input.testFilesCount > 0 || hasArchitecturalPatterns || input.manifestsCount > 0)) {
    return {
      maturity: "ACTIVE_DEVELOPMENT",
      rationale: "Repository demonstrates active development with modular code structure, dependencies, and architectural patterns, but lacks automated CI/CD pipelines.",
      checklist: {
        hasModularStructure,
        hasMeaningfulTests,
        hasContinuousIntegration,
        hasProductionConfig,
        hasArchitecturalPatterns,
      },
      confidenceScore: 0.85,
    };
  }

  // 4. Proof of Concept: script-level or single-file, no automated tests
  return {
    maturity: "PROOF_OF_CONCEPT",
    rationale: "Repository represents an exploratory script or early proof-of-concept without automated tests or continuous integration.",
    checklist: {
      hasModularStructure,
      hasMeaningfulTests,
      hasContinuousIntegration,
      hasProductionConfig,
      hasArchitecturalPatterns,
    },
    confidenceScore: 0.80,
  };
}

// ─── 5. SKILL IMPLEMENTATION DIRECTNESS EVALUATOR ───

/**
 * Determines whether a skill is directly implemented, configured as a dependency only,
 * tested in a test suite, or merely mentioned in text.
 */
export function evaluateSkillImplementationDirectness(
  skillName: string,
  files: Array<{ path: string; content: string }>,
  manifestDependencies: string[] = []
): SkillImplementationDirectnessResult {
  const normSkill = skillName.trim().toLowerCase();
  const matchedSnippets: Array<{ filePath: string; lineRange: string; snippet: string }> = [];

  let isDirectImplementation = false;
  let isTestAssertion = false;
  let isConfiguredInDeps = manifestDependencies.some((d) => {
    const dLower = d.toLowerCase();
    if (dLower === normSkill || dLower.includes(normSkill) || normSkill.includes(dLower)) return true;
    const mapped = DEPENDENCY_MAPPING[dLower];
    if (mapped && (mapped.toLowerCase() === normSkill || mapped.toLowerCase().includes(normSkill))) return true;
    return false;
  });

  // Regular expressions for direct functional usage
  const directPatterns: Record<string, RegExp[]> = {
    fastapi: [/@(?:app|router)\.(?:get|post|put|delete)/i, /FastAPI\s*\(/i, /APIRouter\s*\(/i],
    express: [/express\s*\(\s*\)/i, /app\.(?:get|post|use|listen)/i, /Router\s*\(\s*\)/i],
    react: [/useState\s*\(/i, /useEffect\s*\(/i, /return\s*<[A-Za-z0-9]/i, /React\.FC/i],
    nextjs: [/getStaticProps|getServerSideProps/i, /'use client'/i, /export default function\s+[A-Za-z0-9]+Page/i],
    postgresql: [/Pool\s*\(/i, /prisma\./i, /createConnection/i, /SELECT\s+[^;]+FROM/i, /INSERT\s+INTO/i],
    redis: [/redisClient|createClient|redis\.get|redis\.set/i],
    docker: [/FROM\s+[a-zA-Z0-9_.-]+/i, /EXPOSE\s+\d+/i, /CMD\s+\[/i],
    pytorch: [/torch\.nn|nn\.Module|torch\.optim|backward\(\)/i],
  };

  const patterns = directPatterns[normSkill] || [
    new RegExp(`\\b${normSkill}\\b`, "i"),
  ];

  for (const f of files) {
    const isTestFile =
      f.path.includes("test") ||
      f.path.includes("spec") ||
      f.path.includes("__tests__");

    const lines = f.content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for direct functional pattern
      const matchesDirect = patterns.some((p) => p.test(line));
      if (matchesDirect) {
        const lineStart = Math.max(1, i);
        const lineEnd = Math.min(lines.length, i + 3);
        const excerpt = lines.slice(lineStart - 1, lineEnd).join("\n").trim();

        if (isTestFile) {
          isTestAssertion = true;
          if (matchedSnippets.length < 3) {
            matchedSnippets.push({
              filePath: f.path,
              lineRange: `${lineStart}-${lineEnd}`,
              snippet: excerpt,
            });
          }
        } else {
          isDirectImplementation = true;
          if (matchedSnippets.length < 3) {
            matchedSnippets.push({
              filePath: f.path,
              lineRange: `${lineStart}-${lineEnd}`,
              snippet: excerpt,
            });
          }
        }
      }
    }
  }

  if (isDirectImplementation) {
    return {
      directness: "DIRECT_IMPLEMENTATION",
      confidence: "HIGH",
      isDirectImplementation: true,
      rationale: `Skill '${skillName}' is actively implemented in application source code.`,
      matchedSnippets,
    };
  }

  if (isTestAssertion) {
    return {
      directness: "TEST_ASSERTION",
      confidence: "HIGH",
      isDirectImplementation: false,
      rationale: `Skill '${skillName}' is verified within automated test suites.`,
      matchedSnippets,
    };
  }

  if (isConfiguredInDeps) {
    return {
      directness: "CONFIGURED_DEPENDENCY",
      confidence: "MEDIUM",
      isDirectImplementation: false,
      rationale: `Skill '${skillName}' is declared as a package dependency in manifests, but no active implementation source was detected.`,
      matchedSnippets: [],
    };
  }

  return {
    directness: "DOCUMENTED_MENTION",
    confidence: "LOW",
    isDirectImplementation: false,
    rationale: `Skill '${skillName}' is not implemented or configured in code.`,
    matchedSnippets: [],
  };
}
