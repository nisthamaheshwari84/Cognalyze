/**
 * tests/phase-4-evidence-understanding-implementation.test.ts
 * 
 * COGNALYZE PHASE 4 VERIFICATION SUITE
 * Evidence Understanding & Implementation Analysis
 * 
 * Verifies:
 * 1. Test Suite Quality & Assertion Verification (differentiating real assertions from empty tests).
 * 2. Architectural & Reliability Pattern Discovery (transactions, auth, routes, queues, schemas).
 * 3. Project Maturity Classification (PROOF_OF_CONCEPT vs ACTIVE_DEVELOPMENT vs PRODUCTION_READY vs TEMPLATE_DERIVED).
 * 4. Skill Implementation Directness (DIRECT_IMPLEMENTATION vs CONFIGURED_DEPENDENCY vs TEST_ASSERTION vs DOCUMENTED_MENTION).
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  analyzeTestFileQuality,
  analyzeArchitecturalPatterns,
  classifyProjectMaturity,
  evaluateSkillImplementationDirectness,
} from "../lib/evidence/code-implementation-analyzer";

test("PHASE 4: 1. Test Suite Quality & Assertion Density Verification", () => {
  // 1a. Comprehensive test with real assertions
  const highQualityTest = `
    import { describe, it, expect, vi } from "vitest";
    import { UserService } from "./user.service";

    describe("UserService", () => {
      it("creates a user and hashes password", async () => {
        const service = new UserService();
        const user = await service.createUser({ email: "test@example.com", password: "raw" });
        expect(user).toBeDefined();
        expect(user.id).toBe("u_123");
        expect(user.passwordHash).not.toBe("raw");
      });

      it("throws on duplicate email", async () => {
        const service = new UserService();
        await expect(service.createUser({ email: "dup@example.com" })).rejects.toThrow();
      });
    });
  `;

  const qualityResult = analyzeTestFileQuality(highQualityTest, "src/user.service.spec.ts");
  assert.equal(qualityResult.qualityRating, "HIGH");
  assert.ok(qualityResult.assertionCount >= 4, "Must detect 4+ assertions");
  assert.equal(qualityResult.hasMeaningfulAssertions, true);
  assert.ok(qualityResult.detectedFrameworks.includes("Vitest"));
  assert.ok(qualityResult.assertionDensity >= 1.5);

  // 1b. Trivial / Empty Test without assertions
  const emptyTest = `
    import { test } from "vitest";
    test("does something without any assertions", () => {
      const a = 1;
      const b = 2;
    });
  `;

  const trivialResult = analyzeTestFileQuality(emptyTest, "src/empty.test.ts");
  assert.equal(trivialResult.qualityRating, "TRIVIAL");
  assert.equal(trivialResult.assertionCount, 0);
  assert.equal(trivialResult.hasMeaningfulAssertions, false);

  // 1c. Python Pytest suite with assertions and fixtures
  const pythonPytest = `
    import pytest
    from app.services import calculate_tax

    @pytest.fixture
    def tax_rate():
        return 0.15

    def test_calculate_tax_valid(tax_rate):
        total = calculate_tax(100, tax_rate)
        assert total == 115.0

    def test_calculate_tax_negative():
        with pytest.raises(ValueError):
            calculate_tax(-50, 0.1)
  `;

  const pyResult = analyzeTestFileQuality(pythonPytest, "tests/test_tax.py");
  assert.equal(pyResult.qualityRating, "HIGH");
  assert.ok(pyResult.assertionCount >= 2);
  assert.equal(pyResult.hasMocksOrFixtures, true);
  assert.ok(pyResult.detectedFrameworks.includes("Pytest"));
});

test("PHASE 4: 2. Architectural & Reliability Pattern Discovery", () => {
  const mockFiles = [
    {
      path: "src/api/routes.ts",
      content: `
        import { Router } from "express";
        import { authenticateToken } from "../middleware/auth";
        import { z } from "zod";
        
        const router = Router();
        const UserSchema = z.object({ email: z.string().email() });

        router.post("/users", authenticateToken, async (req, res) => {
          const body = UserSchema.parse(req.body);
          res.json({ success: true });
        });
        export default router;
      `,
    },
    {
      path: "src/db/transaction.ts",
      content: `
        import { prisma } from "./client";
        export async function transferBalance(sender: string, receiver: string, amount: number) {
          return await prisma.$transaction(async (tx) => {
            await tx.account.update({ where: { id: sender }, data: { balance: { decrement: amount } } });
            await tx.account.update({ where: { id: receiver }, data: { balance: { increment: amount } } });
          });
        }
      `,
    },
    {
      path: "src/workers/email-queue.ts",
      content: `
        import { Queue, Worker } from "bullmq";
        export const emailQueue = new Queue("emailQueue");
        export const emailWorker = new Worker("emailQueue", async (job) => {
          console.log("Processing job", job.id);
        });
      `,
    },
  ];

  const { detectedPatterns, reliabilityScore } = analyzeArchitecturalPatterns(mockFiles);

  assert.ok(detectedPatterns.some((p) => p.pattern === "REST_API_ENDPOINTS"), "Must detect REST API endpoints");
  assert.ok(detectedPatterns.some((p) => p.pattern === "AUTH_MIDDLEWARE"), "Must detect auth middleware");
  assert.ok(detectedPatterns.some((p) => p.pattern === "INPUT_VALIDATION_SCHEMA"), "Must detect Zod input validation");
  assert.ok(detectedPatterns.some((p) => p.pattern === "DATABASE_TRANSACTIONS"), "Must detect Prisma $transaction");
  assert.ok(detectedPatterns.some((p) => p.pattern === "MESSAGE_QUEUES_WORKERS"), "Must detect BullMQ workers");

  assert.ok(reliabilityScore >= 0.7, "Reliability score must reflect atomic transactions and validation");
});

test("PHASE 4: 3. Project Maturity Classification (4-Tier Taxonomy)", () => {
  // 3a. Production Ready Repository
  const prodEval = classifyProjectMaturity({
    repoName: "distributed-payments",
    totalFilesCount: 24,
    isFork: false,
    manifestsCount: 1,
    testFilesCount: 4,
    meaningfulTestAssertionsCount: 18,
    ciConfigured: true,
    hasEnvironmentConfig: true,
    architecturalPatternsCount: 4,
  });
  assert.equal(prodEval.maturity, "PRODUCTION_READY");
  assert.equal(prodEval.checklist.hasContinuousIntegration, true);
  assert.equal(prodEval.checklist.hasMeaningfulTests, true);
  assert.ok(prodEval.confidenceScore >= 0.9);

  // 3b. Active Development Repository (has tests, but no CI)
  const activeEval = classifyProjectMaturity({
    repoName: "local-portfolio",
    totalFilesCount: 10,
    isFork: false,
    manifestsCount: 1,
    testFilesCount: 1,
    meaningfulTestAssertionsCount: 2,
    ciConfigured: false,
    hasEnvironmentConfig: false,
    architecturalPatternsCount: 2,
  });
  assert.equal(activeEval.maturity, "ACTIVE_DEVELOPMENT");

  // 3c. Proof of Concept (single script, no tests, no CI)
  const pocEval = classifyProjectMaturity({
    repoName: "quick-scraper",
    totalFilesCount: 2,
    isFork: false,
    manifestsCount: 0,
    testFilesCount: 0,
    meaningfulTestAssertionsCount: 0,
    ciConfigured: false,
    architecturalPatternsCount: 0,
  });
  assert.equal(pocEval.maturity, "PROOF_OF_CONCEPT");

  // 3d. Template Derived Boilerplate
  const templateEval = classifyProjectMaturity({
    repoName: "nextjs-starter-template",
    totalFilesCount: 15,
    isFork: false,
    isTemplate: true,
    manifestsCount: 1,
    testFilesCount: 1,
    meaningfulTestAssertionsCount: 2,
    ciConfigured: false,
    architecturalPatternsCount: 1,
  });
  assert.equal(templateEval.maturity, "TEMPLATE_DERIVED");
});

test("PHASE 4: 4. Skill Implementation Directness Differentiation", () => {
  const files = [
    {
      path: "src/server.ts",
      content: `
        import express from "express";
        const app = express();
        app.get("/health", (req, res) => res.send("OK"));
        export default app;
      `,
    },
    {
      path: "src/__tests__/server.test.ts",
      content: `
        import app from "../server";
        test("health check", () => {
          expect(app).toBeDefined();
        });
      `,
    },
  ];

  // 4a. Direct implementation (Express)
  const expressResult = evaluateSkillImplementationDirectness("Express", files, ["express"]);
  assert.equal(expressResult.directness, "DIRECT_IMPLEMENTATION");
  assert.equal(expressResult.isDirectImplementation, true);
  assert.ok(expressResult.matchedSnippets.length >= 1);
  assert.equal(expressResult.matchedSnippets[0].filePath, "src/server.ts");

  // 4b. Configured in package.json only without source implementation (PostgreSQL)
  const pgResult = evaluateSkillImplementationDirectness("PostgreSQL", files, ["pg", "pg-hstore"]);
  assert.equal(pgResult.directness, "CONFIGURED_DEPENDENCY");
  assert.equal(pgResult.isDirectImplementation, false);
  assert.equal(pgResult.matchedSnippets.length, 0);

  // 4c. Documented mention only / not present (Redis)
  const redisResult = evaluateSkillImplementationDirectness("Redis", files, ["express"]);
  assert.equal(redisResult.directness, "DOCUMENTED_MENTION");
  assert.equal(redisResult.isDirectImplementation, false);
});

