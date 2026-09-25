import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import {
  extractGitHubUsername,
  surfacePull as githubSurfacePull,
  deepPull as githubDeepPull,
} from "../lib/evidence-collector/github";
import {
  extractCodeforcesHandle,
  pullCodeforces,
} from "../lib/evidence-collector/codeforces";
import {
  extractLeetCodeUsername,
  pullLeetCode,
} from "../lib/evidence-collector/leetcode";
import { extractResumeFacts } from "../lib/evidence-collector/resume";
import {
  enforceEvidenceGuard,
  containsBannedLanguage,
  sanitizeReasonText,
  hasCorroboratingFacts,
} from "../lib/evidence-collector/guard";
import {
  buildStep1ExtractionPrompt,
  buildStep2ClassificationPrompt,
  buildStep3InterviewQuestionPrompt,
  BANNED_LANGUAGE_INSTRUCTION,
} from "../lib/evidence-collector/prompts";
import {
  collectEvidence,
  executeStep1Extraction,
  executeStep2Classification,
} from "../lib/evidence-collector/index";
import {
  saveEvidenceRecords,
  getEvidenceForCandidate,
  clearEvidenceForCandidate,
} from "../lib/evidence-collector/store";
import { EvidenceRecord } from "../lib/evidence-collector/types";

describe("Cognalyze — Evidence Layer & Verification Collector", () => {
  const testCandidateId = "cand-test-evidence-uuid-001";
  const testRoleId = "role-test-backend-uuid-001";

  before(async () => {
    await clearEvidenceForCandidate(testCandidateId);
  });

  after(async () => {
    await clearEvidenceForCandidate(testCandidateId);
  });

  // ── 1. GITHUB COLLECTOR TESTS ───────────────────────────────────────────────
  describe("GitHub Evidence Collector (github.ts)", () => {
    it("normalizes diverse GitHub handle representations correctly", () => {
      assert.strictEqual(extractGitHubUsername("https://github.com/torvalds/"), "torvalds");
      assert.strictEqual(extractGitHubUsername("https://github.com/octocat"), "octocat");
      assert.strictEqual(extractGitHubUsername("@torvalds"), "torvalds");
      assert.strictEqual(extractGitHubUsername("torvalds"), "torvalds");
      assert.strictEqual(extractGitHubUsername(""), "");
    });

    it("surfacePull returns structured facts without interpretation or status assignment", async () => {
      const res = await githubSurfacePull("torvalds");
      assert.ok(res.raw_data !== undefined, "raw_data must be preserved for audit trail");
      
      // If network is available, verify normalized facts shape
      if (res.normalized_facts) {
        assert.ok(typeof res.normalized_facts.repo_count === "number");
        assert.ok(Array.isArray(res.normalized_facts.top_languages));
        assert.ok(typeof res.normalized_facts.commits_last_6mo === "number");
        assert.ok(Array.isArray(res.normalized_facts.top_repos));
        if (res.normalized_facts.top_repos.length > 0) {
          const r = res.normalized_facts.top_repos[0];
          assert.ok(typeof r.name === "string");
          assert.ok(typeof r.is_fork === "boolean");
          assert.ok(typeof r.commit_count === "number");
        }
      }
    });

    it("handles non-existent GitHub usernames gracefully without crashing", async () => {
      const res = await githubSurfacePull("non_existent_random_user_987654321_xyz");
      assert.ok(res.raw_data !== undefined);
      assert.strictEqual(res.normalized_facts, null);
    });

    it("deepPull normalizes commit spans and incremental work flags", async () => {
      const res = await githubDeepPull("torvalds", ["linux"]);
      assert.ok(res.raw_data !== undefined);
      if (res.normalized_facts) {
        assert.ok(Array.isArray(res.normalized_facts.repo_analyses));
        if (res.normalized_facts.repo_analyses.length > 0) {
          const analysis = res.normalized_facts.repo_analyses[0];
          assert.ok(typeof analysis.repo_name === "string");
          assert.ok(typeof analysis.is_incremental_work === "boolean");
          assert.ok(typeof analysis.commit_span_days === "number");
          assert.ok(Array.isArray(analysis.commit_messages_sample));
        }
      }
    });
  });

  // ── 2. CODEFORCES COLLECTOR TESTS ──────────────────────────────────────────
  describe("Codeforces Evidence Collector (codeforces.ts)", () => {
    it("normalizes Codeforces handle formats correctly", () => {
      assert.strictEqual(extractCodeforcesHandle("https://codeforces.com/profile/tourist/"), "tourist");
      assert.strictEqual(extractCodeforcesHandle("@tourist"), "tourist");
      assert.strictEqual(extractCodeforcesHandle("tourist"), "tourist");
      assert.strictEqual(extractCodeforcesHandle(""), "");
    });

    it("pullCodeforces extracts ratings, contest counts, and problem difficulty buckets", async () => {
      const res = await pullCodeforces("tourist");
      assert.ok(res.raw_data !== undefined);
      if (res.normalized_facts) {
        assert.strictEqual(res.normalized_facts.handle.toLowerCase(), "tourist");
        assert.ok(res.normalized_facts.max_rating >= 3000);
        assert.ok(res.normalized_facts.contest_count > 0);
        assert.ok(typeof res.normalized_facts.solved_by_difficulty === "object");
        assert.ok("<1200" in res.normalized_facts.solved_by_difficulty);
        assert.ok("2000+" in res.normalized_facts.solved_by_difficulty);
      }
    });

    it("handles non-existent Codeforces handles gracefully without throwing", async () => {
      const res = await pullCodeforces("non_existent_cf_user_99999999_xyz");
      assert.ok(res.raw_data !== undefined);
      assert.strictEqual(res.normalized_facts, null);
    });
  });

  // ── 3. LEETCODE COLLECTOR TESTS ────────────────────────────────────────────
  describe("LeetCode Evidence Collector (leetcode.ts)", () => {
    it("normalizes LeetCode username URLs correctly", () => {
      assert.strictEqual(extractLeetCodeUsername("https://leetcode.com/u/neal_wu/"), "neal_wu");
      assert.strictEqual(extractLeetCodeUsername("https://leetcode.com/neal_wu"), "neal_wu");
      assert.strictEqual(extractLeetCodeUsername("@neal_wu"), "neal_wu");
      assert.strictEqual(extractLeetCodeUsername("neal_wu"), "neal_wu");
      assert.strictEqual(extractLeetCodeUsername(""), "");
    });

    it("pullLeetCode failure contract: never throws and returns null facts on failure", async () => {
      const res = await pullLeetCode("definitely_non_existent_leetcode_user_987654");
      assert.ok(res !== undefined);
      assert.ok(res.raw_data !== undefined);
      // Unofficial failure returns normalized_facts: null
      assert.strictEqual(res.normalized_facts, null);
    });
  });

  // ── 4. RESUME COLLECTOR TESTS ──────────────────────────────────────────────
  describe("Resume Evidence Collector (resume.ts)", () => {
    it("extracts structured skills, projects, and documented experience from raw resume text", () => {
      const resume = `
        Alex Johnson
        alex.johnson@example.com

        SUMMARY
        Full-stack engineer with experience building distributed web systems.

        EXPERIENCE
        Software Engineer at Acme Corp (2021 - 2024)
        - Developed REST APIs in Python and PostgreSQL.
        - Reduced query latency by 40% using Redis caching.

        PROJECTS
        E-Commerce Microservice
        - Built checkout service using Go, Docker, and Kafka.
        - Wrote integration tests with 85% coverage.

        SKILLS
        Languages: Python, Go, TypeScript, SQL
        Technologies: Docker, PostgreSQL, Redis, Kafka, React
        Competitive: Solved 250+ LeetCode problems

        EDUCATION
        B.S. in Computer Science, State University (2017 - 2021)
      `;

      const res = extractResumeFacts(resume);
      assert.ok(res.normalized_facts !== null);
      const facts = res.normalized_facts!;
      assert.ok(facts.skills_claimed.length >= 4);
      assert.ok(facts.skills_claimed.some((s) => s.toLowerCase().includes("python")));
      assert.ok(facts.projects.length >= 1);
      assert.strictEqual(facts.companies[0], "Acme Corp");
      assert.ok((facts.documented_experience_years || 0) >= 2.5);
      assert.ok(facts.dsa_claim !== undefined);
      assert.ok(facts.dsa_claim?.includes("250+ LeetCode"));
    });
  });

  // ── 5. PROMPT TEMPLATES & BANNED LANGUAGE RULES ────────────────────────────
  describe("Prompt Contracts & Banned Language Compliance", () => {
    it("embeds mandatory banned language instructions in Step 1, 2, and 3 prompts", () => {
      assert.ok(BANNED_LANGUAGE_INSTRUCTION.includes("Never write:"));
      assert.ok(BANNED_LANGUAGE_INSTRUCTION.includes("Candidate is weak at X"));
      assert.ok(BANNED_LANGUAGE_INSTRUCTION.includes("Candidate lacks X"));
      assert.ok(BANNED_LANGUAGE_INSTRUCTION.includes("Candidate is dishonest"));

      const p1 = buildStep1ExtractionPrompt("github", { repo_count: 5 });
      assert.ok(p1.system.includes("STRICTLY FORBIDDEN: Do NOT score"));
      assert.ok(p1.system.includes("Never write:"));

      const p2 = buildStep2ClassificationPrompt("Backend API", "github", "5 repos", { repo_count: 5 });
      assert.ok(p2.system.includes("STATUS DEFINITIONS:"));
      assert.ok(p2.system.includes("established"));
      assert.ok(p2.system.includes("unknown"));
      assert.ok(p2.system.includes("Never write:"));

      const p3 = buildStep3InterviewQuestionPrompt("Distributed Caching", "Redis usage", "github");
      assert.ok(p3.system.includes("Target the specific technical gap"));
      assert.ok(p3.system.includes("Never write:"));
    });
  });

  // ── 6. ANTI-HALLUCINATION CODE GUARD ───────────────────────────────────────
  describe("Deterministic Anti-Hallucination Code Guard (guard.ts)", () => {
    it("downgrades proposed 'established' to 'unknown' when normalized_facts is null", () => {
      const evaluation = enforceEvidenceGuard(
        "established",
        "Candidate is great at Python",
        "Python API Development",
        "github",
        null
      );
      assert.strictEqual(evaluation.finalStatus, "unknown");
      assert.strictEqual(evaluation.downgraded, true);
      assert.ok(evaluation.finalReason.includes("returned no data"));
    });

    it("downgrades 'established' to 'unknown' when normalized_facts has zero corroborating data", () => {
      const emptyFacts = {
        repo_count: 0,
        top_languages: [],
        commits_last_6mo: 0,
        top_repos: [],
      };

      const evaluation = enforceEvidenceGuard(
        "established",
        "Candidate is established in Python",
        "Python Development",
        "github",
        emptyFacts
      );
      assert.strictEqual(evaluation.finalStatus, "unknown");
      assert.strictEqual(evaluation.downgraded, true);
      assert.ok(evaluation.finalReason.includes("[EvidenceGuard] Downgraded to 'unknown'"));
    });

    it("allows 'established' when normalized_facts contains substantive matching facts", () => {
      const solidFacts = {
        repo_count: 5,
        top_languages: ["Python", "TypeScript"],
        commits_last_6mo: 42,
        top_repos: [
          { name: "fastapi-service", is_fork: false, commit_count: 42, commit_span_days: 60, contributors: 1 },
        ],
      };

      const evaluation = enforceEvidenceGuard(
        "established",
        "42 commits in Python repo over 60 days.",
        "Python Backend Development",
        "github",
        solidFacts
      );
      assert.strictEqual(evaluation.finalStatus, "established");
      assert.strictEqual(evaluation.downgraded, false);
    });

    it("sanitizes leaked banned judgmental phrases from model status_reason", () => {
      assert.strictEqual(containsBannedLanguage("Candidate is weak at distributed systems"), true);
      assert.strictEqual(containsBannedLanguage("Candidate lacks basic competence"), true);
      assert.strictEqual(containsBannedLanguage("Candidate is dishonest about past experience"), true);
      assert.strictEqual(containsBannedLanguage("Direct evidence found with 42 commits"), false);

      const sanitized = sanitizeReasonText("Candidate is weak at Go");
      assert.strictEqual(sanitized, "Available evidence does not currently confirm this claim.");
    });
  });

  // ── 7. PERSISTENCE STORE TESTS ─────────────────────────────────────────────
  describe("Evidence Store & DB Abstraction (store.ts)", () => {
    it("persists evidence records and retrieves them deterministically", async () => {
      const sampleRecord: EvidenceRecord = {
        id: "ev-test-record-1",
        candidate_id: testCandidateId,
        role_id: testRoleId,
        source: "github",
        claim: "Python API development",
        raw_data: { repo_count: 8 },
        normalized_facts: { repo_count: 8, top_languages: ["Python"], commits_last_6mo: 30, top_repos: [] },
        extracted_summary: "8 public repositories with active Python commits.",
        status: "established",
        status_reason: "Verified through 30 recent Python commits.",
        role_relevance: "Backend API requirement",
        fetched_at: new Date().toISOString(),
      };

      await saveEvidenceRecords([sampleRecord]);

      const records = await getEvidenceForCandidate(testCandidateId, testRoleId);
      assert.ok(records.length >= 1);
      const found = records.find((r) => r.id === sampleRecord.id);
      assert.ok(found !== undefined);
      assert.strictEqual(found?.status, "established");
      assert.strictEqual(found?.source, "github");
    });
  });

  // ── 8. ORCHESTRATION & FUNNEL STAGING TESTS ────────────────────────────────
  describe("Central Orchestrator & Funnel Stages (index.ts)", () => {
    it("Stage 1 -> 2 Surface Pull collects across sources and writes to evidence table", async () => {
      const profile = {
        candidateId: testCandidateId,
        name: "Test Candidate",
        email: "test@example.com",
        githubUsernameOrUrl: "torvalds",
        codeforcesHandle: "tourist",
        leetcodeUsernameOrUrl: "definitely_non_existent_lc_user",
        resumeText: "Software Engineer with 3 years experience in Python and PostgreSQL.",
      };

      const result = await collectEvidence(
        testCandidateId,
        testRoleId,
        "surface",
        profile,
        ["Backend Python Development", "Competitive Problem Solving"]
      );

      assert.strictEqual(result.stage, "surface");
      assert.ok(result.records.length >= 2, "Should have processed available sources");

      // Verify all statuses are one of the controlled 4
      for (const rec of result.records) {
        assert.ok(["established", "partial", "unknown", "conflicting"].includes(rec.status));
        assert.ok(rec.raw_data !== undefined, "Audit trail raw_data must always be present");
        assert.ok(typeof rec.status_reason === "string");
        assert.strictEqual(containsBannedLanguage(rec.status_reason || ""), false);
      }
    });

    it("Stage 2 -> Deep Review generates targeted interview probes for remaining unknowns", async () => {
      const profile = {
        candidateId: testCandidateId,
        name: "Deep Review Candidate",
        githubUsernameOrUrl: "torvalds",
      };

      const result = await collectEvidence(
        testCandidateId,
        testRoleId,
        "deep",
        profile,
        ["Distributed Systems Architecture"]
      );

      assert.strictEqual(result.stage, "deep");
      assert.ok(result.records.length >= 1);
      assert.strictEqual(result.records[0].source, "github");

      // Check that targeted interview questions are generated for unknown rows
      if (result.targetedInterviewQuestions && result.targetedInterviewQuestions.length > 0) {
        const q = result.targetedInterviewQuestions[0];
        assert.ok(typeof q.question === "string");
        assert.ok(q.question.length > 10);
        assert.strictEqual(containsBannedLanguage(q.question), false);
      }
    });
  });
});
