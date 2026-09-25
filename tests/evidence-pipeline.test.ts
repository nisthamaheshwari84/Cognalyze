import { describe, it } from "node:test";
import assert from "node:assert";
import {
  Evidence,
  CandidateDecision,
  CriterionResult,
  validateCandidateDecision,
  computeConfidence,
} from "../lib/evidence/types";
import {
  numberResumeLines,
  verifyQuoteExists,
  buildDecision,
  JDRequirement,
  ExtractedFact,
} from "../lib/evidence/resume-matcher";
import { computeFlags, RepoSummary } from "../lib/evidence/github-agent";
import { buildLeetcodeDossier } from "../lib/evidence/leetcode-agent";
import {
  quoteExistsInInput,
  validateAndDowngrade,
  DeepReviewOutput,
} from "../lib/evidence/deep-review-agent";
import { verifyInterviewQuote, buildInterviewDecision, InterviewCompetency, ExtractedInterviewFact } from "../lib/evidence/interview-matcher";

describe("Evidence-Based Recruitment Pipeline Test Suite", () => {
  // ─────────────────────────────────────────────────────────────
  // 1. Core Contract & Validation Rules (lib/evidence/types.ts)
  // ─────────────────────────────────────────────────────────────
  describe("Core Contract & Validator (Section 1)", () => {
    it("rejects decisions where a verdict has no evidence_ids", () => {
      const decision: CandidateDecision = {
        candidate_id: "cand_01",
        stage: "resume_jd_match",
        outcome: "advance",
        criteria_results: [
          {
            criterion: "2+ years React experience",
            verdict: "met",
            evidence_ids: [], // Not allowed for "met"
            reasoning: "Claimed experience in resume.",
          },
        ],
        overall_confidence: "high",
        created_at: new Date().toISOString(),
      };

      const result = validateCandidateDecision(decision, []);
      assert.strictEqual(result.valid, false);
      assert.match(result.errors[0], /has verdict "met" but no evidence_ids/);
    });

    it("allows empty evidence_ids only for insufficient_evidence verdict", () => {
      const decision: CandidateDecision = {
        candidate_id: "cand_01",
        stage: "resume_jd_match",
        outcome: "reject",
        criteria_results: [
          {
            criterion: "Docker & Kubernetes",
            verdict: "insufficient_evidence",
            evidence_ids: [], // Allowed for insufficient_evidence
            reasoning: "No mention of Docker in resume.",
          },
        ],
        overall_confidence: "low",
        created_at: new Date().toISOString(),
      };

      const result = validateCandidateDecision(decision, []);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    it("rejects unknown evidence_ids not present in evidence pool", () => {
      const decision: CandidateDecision = {
        candidate_id: "cand_01",
        stage: "resume_jd_match",
        outcome: "advance",
        criteria_results: [
          {
            criterion: "Python experience",
            verdict: "met",
            evidence_ids: ["ev_hallucinated_999"],
            reasoning: "Python stated.",
          },
        ],
        overall_confidence: "high",
        created_at: new Date().toISOString(),
      };

      const realEvidence: Evidence = {
        id: "ev_real_001",
        source_type: "resume_text",
        source_ref: "resume:line 5",
        quote_or_fact: "Python Developer for 3 years",
        extracted_at: new Date().toISOString(),
      };

      const result = validateCandidateDecision(decision, [realEvidence]);
      assert.strictEqual(result.valid, false);
      assert.match(result.errors[0], /references unknown evidence id "ev_hallucinated_999"/);
    });

    it("computes confidence correctly based on insufficient evidence ratio", () => {
      const allMet: CriterionResult[] = [
        { criterion: "A", verdict: "met", evidence_ids: ["ev1"], reasoning: "" },
        { criterion: "B", verdict: "met", evidence_ids: ["ev2"], reasoning: "" },
      ];
      assert.strictEqual(computeConfidence(allMet), "high");

      const thirtyPercent: CriterionResult[] = [
        { criterion: "A", verdict: "met", evidence_ids: ["ev1"], reasoning: "" },
        { criterion: "B", verdict: "met", evidence_ids: ["ev2"], reasoning: "" },
        { criterion: "C", verdict: "insufficient_evidence", evidence_ids: [], reasoning: "" },
      ];
      // 1/3 = 33% > 30% -> low
      assert.strictEqual(computeConfidence(thirtyPercent), "low");

      const tenPercent: CriterionResult[] = [
        ...Array(9).fill({ criterion: "X", verdict: "met", evidence_ids: ["ev1"], reasoning: "" }),
        { criterion: "Y", verdict: "insufficient_evidence", evidence_ids: [], reasoning: "" },
      ];
      // 1/10 = 10% <= 30% -> medium
      assert.strictEqual(computeConfidence(tenPercent), "medium");
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. Stage 1 — Resume vs JD Gap Analysis (lib/evidence/resume-matcher.ts)
  // ─────────────────────────────────────────────────────────────
  describe("Stage 1: Resume vs JD Matcher (Section 2)", () => {
    const sampleResume = `Jane Doe
Senior Full-Stack Engineer
Experience:
- Built scalable web applications using React and Next.js for 3 years at Acme Corp.
- Designed high-throughput RESTful APIs with Python and FastAPI.
- Deployed microservices using Docker on AWS ECS.`;

    it("numbers resume lines deterministically", () => {
      const numbered = numberResumeLines("Line One\nLine Two\nLine Three");
      assert.strictEqual(numbered, "1: Line One\n2: Line Two\n3: Line Three");
    });

    it("verifyQuoteExists validates real resume text and tolerates whitespace/casing", () => {
      assert.strictEqual(
        verifyQuoteExists(sampleResume, "Built scalable web applications using React"),
        true
      );
      assert.strictEqual(
        verifyQuoteExists(sampleResume, "built   scalable WEB applications  using React"),
        true
      );
    });

    it("verifyQuoteExists rejects hallucinated quotes not present in the resume", () => {
      assert.strictEqual(
        verifyQuoteExists(sampleResume, "Expert in Google Cloud Platform and Kubernetes cluster management"),
        false
      );
    });

    it("buildDecision deterministically advances when mandatory requirements are supported", () => {
      const requirements: JDRequirement[] = [
        { id: "req_react", criterion: "React experience", mandatory: true },
        { id: "req_python", criterion: "Python API development", mandatory: true },
        { id: "req_go", criterion: "Go / Golang", mandatory: false },
      ];

      const facts: ExtractedFact[] = [
        {
          requirement_id: "req_react",
          found: true,
          quote: "Built scalable web applications using React and Next.js for 3 years",
          resume_line_ref: "line 4",
        },
        {
          requirement_id: "req_python",
          found: true,
          quote: "Designed high-throughput RESTful APIs with Python and FastAPI",
          resume_line_ref: "line 5",
        },
        {
          requirement_id: "req_go",
          found: false,
          quote: "",
          resume_line_ref: "",
        },
      ];

      const pool: Evidence[] = [];
      const decision = buildDecision("cand_42", requirements, facts, sampleResume, pool);

      assert.strictEqual(decision.outcome, "advance");
      assert.strictEqual(decision.criteria_results.length, 3);
      assert.strictEqual(decision.criteria_results[0].verdict, "met");
      assert.strictEqual(decision.criteria_results[1].verdict, "met");
      assert.strictEqual(decision.criteria_results[2].verdict, "not_met"); // optional failed -> outcome still advance
      assert.strictEqual(pool.length, 2);
    });

    it("buildDecision rejects candidate if a mandatory requirement is not met", () => {
      const requirements: JDRequirement[] = [
        { id: "req_rust", criterion: "5+ years Rust programming", mandatory: true },
      ];

      const facts: ExtractedFact[] = [
        {
          requirement_id: "req_rust",
          found: false,
          quote: "",
          resume_line_ref: "",
        },
      ];

      const pool: Evidence[] = [];
      const decision = buildDecision("cand_42", requirements, facts, sampleResume, pool);

      assert.strictEqual(decision.outcome, "reject");
      assert.strictEqual(decision.criteria_results[0].verdict, "not_met");
      assert.match(decision.rejection_summary || "", /5\+ years Rust programming/);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. Stage 2a — GitHub Project Verification (lib/evidence/github-agent.ts)
  // ─────────────────────────────────────────────────────────────
  describe("Stage 2a: GitHub Project Verification (Section 3)", () => {
    it("flags 'No original work' if all repositories are forks", () => {
      const repos: RepoSummary[] = [
        {
          name: "forked-react",
          url: "https://github.com/user/forked-react",
          isFork: true,
          stars: 0,
          language: "JavaScript",
          commitCount: 20,
          lastCommitDate: "2026-08-01",
          hasReadme: true,
          readmeLength: 200,
          contributorsCount: 1,
        },
      ];

      const flags = computeFlags(repos, 3);
      const noOrig = flags.find((f) => f.label === "No original work");
      assert.ok(noOrig);
      assert.strictEqual(noOrig?.type, "red");
    });

    it("flags 'Low commit depth' when original repos have fewer than 10 commits", () => {
      const repos: RepoSummary[] = [
        {
          name: "one-shot-project",
          url: "https://github.com/user/one-shot-project",
          isFork: false,
          stars: 1,
          language: "TypeScript",
          commitCount: 3, // < 10 commits
          lastCommitDate: "2026-08-01",
          hasReadme: true,
          readmeLength: 150,
          contributorsCount: 1,
        },
      ];

      const flags = computeFlags(repos, 1);
      const lowCommit = flags.find((f) => f.label === "Low commit depth");
      assert.ok(lowCommit);
      assert.strictEqual(lowCommit?.type, "red");
    });

    it("flags 'Sustained development' and 'Consistent recent activity' on healthy profiles", () => {
      const repos: RepoSummary[] = [
        {
          name: "active-engine",
          url: "https://github.com/user/active-engine",
          isFork: false,
          stars: 42,
          language: "TypeScript",
          commitCount: 85,
          lastCommitDate: "2026-09-15",
          hasReadme: true,
          readmeLength: 800,
          contributorsCount: 2,
        },
      ];

      const flags = computeFlags(repos, 8); // 8 active months
      assert.ok(flags.find((f) => f.label === "Sustained development" && f.type === "green"));
      assert.ok(flags.find((f) => f.label === "Consistent recent activity" && f.type === "green"));
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. Stage 2a — LeetCode Stats (lib/evidence/leetcode-agent.ts)
  // ─────────────────────────────────────────────────────────────
  describe("Stage 2a: LeetCode Verification (Section 4)", () => {
    it("returns empty dossier cleanly for blank username", async () => {
      const dossier = await buildLeetcodeDossier("cand_01", "");
      assert.strictEqual(dossier.found, false);
      assert.strictEqual(dossier.totalSolved, 0);
      assert.strictEqual(dossier.evidence.length, 1);
      assert.strictEqual(dossier.evidence[0].source_type, "leetcode_stats");
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. Stage 2b — Deep Review Anti-Hallucination Guard (lib/evidence/deep-review-agent.ts)
  // ─────────────────────────────────────────────────────────────
  describe("Stage 2b: Deep Project Review Guard (Section 5)", () => {
    const inputBlob = JSON.stringify({
      resume_project_claims: [
        {
          project_name: "FinTech Platform",
          description_from_resume: "Real-time payment processing engine handling Stripe webhooks",
          claimed_technologies: ["Node.js", "Redis"],
        },
      ],
      github_repos: [
        {
          name: "fintech-core",
          description: "Payment microservice with Redis caching",
          commit_history: [
            { message: "Implement webhook retry queue", date: "2026-07-01" },
            { message: "Handle concurrency race condition", date: "2026-07-03" },
          ],
        },
      ],
    });

    it("quoteExistsInInput verifies literal substring in input payload", () => {
      assert.strictEqual(
        quoteExistsInInput("Real-time payment processing engine", inputBlob),
        true
      );
      assert.strictEqual(
        quoteExistsInInput("Handle concurrency race condition", inputBlob),
        true
      );
      assert.strictEqual(
        quoteExistsInInput("Non-existent fabricated quotation", inputBlob),
        false
      );
    });

    it("validateAndDowngrade downgrades ungrounded LLM quotes to insufficient_evidence", () => {
      const mockLlmOutput: DeepReviewOutput = {
        candidate_id: "cand_99",
        stage: "deep_review",
        per_project_results: [
          {
            project_name: "FinTech Platform",
            matched_repo_url: "https://github.com/user/fintech-core",
            step1_claim_match: {
              verdict: "matched",
              evidence_quotes: ["Real-time payment processing engine"], // real quote -> should remain
            },
            step2_vibe_coding_signal: {
              verdict: "signals_of_genuine_iterative_work",
              evidence_quotes: ["Hallucinated commit message that model invented"], // fake quote -> must downgrade!
            },
            step3_learning_reflection: {
              verdict: "clear_evidence_of_understanding",
              evidence_quotes: ["Handle concurrency race condition"], // real quote -> should remain
            },
          },
        ],
        skill_consistency: {
          dsa_claim_vs_leetcode: {
            verdict: "consistent",
            evidence_quotes: ["Fake leetcode quote"],
          },
          competitive_programming_claim_vs_contest_history: {
            verdict: "not_applicable",
            evidence_quotes: [],
          },
        },
        hackathon_verification: [],
        overall_confidence: "medium",
        human_review_notes: "Analysis complete.",
      };

      const sanitized = validateAndDowngrade(mockLlmOutput, inputBlob);

      // Step 1 preserved
      assert.strictEqual(sanitized.per_project_results[0].step1_claim_match.verdict, "matched");

      // Step 2 downgraded to insufficient_evidence with empty quotes
      assert.strictEqual(
        sanitized.per_project_results[0].step2_vibe_coding_signal.verdict,
        "insufficient_evidence"
      );
      assert.strictEqual(
        sanitized.per_project_results[0].step2_vibe_coding_signal.evidence_quotes.length,
        0
      );

      // Step 3 preserved
      assert.strictEqual(
        sanitized.per_project_results[0].step3_learning_reflection.verdict,
        "clear_evidence_of_understanding"
      );

      // DSA claim downgraded
      assert.strictEqual(
        sanitized.skill_consistency.dsa_claim_vs_leetcode.verdict,
        "insufficient_evidence"
      );
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 6. Stage 3 — Interview Fact Extraction (lib/evidence/interview-matcher.ts)
  // ─────────────────────────────────────────────────────────────
  describe("Stage 3: Interview / DNA Review (Section 7.4)", () => {
    const transcript = `[00:05:12] Interviewer: How did you handle cache invalidation in your distributed system?
[00:05:25] Candidate: We implemented a cache-aside pattern with Redis and used TTL expiration combined with Redis pub/sub events to invalidate stale cache entries across all replica nodes.
[00:06:10] Interviewer: Great. Have you written any Kubernetes operators in Go?
[00:06:18] Candidate: No, I haven't written custom operators yet, but I've configured Helm charts.`;

    it("verifyInterviewQuote checks candidate statements against transcript", () => {
      assert.strictEqual(
        verifyInterviewQuote(
          transcript,
          "We implemented a cache-aside pattern with Redis and used TTL expiration"
        ),
        true
      );
      assert.strictEqual(
        verifyInterviewQuote(transcript, "I am a core maintainer of Kubernetes"),
        false
      );
    });

    it("buildInterviewDecision outputs verified evidence and accurate outcomes", () => {
      const comps: InterviewCompetency[] = [
        {
          id: "comp_caching",
          criterion: "Distributed caching and cache invalidation strategies",
          mandatory: true,
        },
        {
          id: "comp_k8s_operator",
          criterion: "Kubernetes custom operator development in Go",
          mandatory: false,
        },
      ];

      const facts: ExtractedInterviewFact[] = [
        {
          competency_id: "comp_caching",
          found: true,
          quote: "We implemented a cache-aside pattern with Redis and used TTL expiration combined with Redis pub/sub events",
          timestamp_ref: "00:05:25",
        },
        {
          competency_id: "comp_k8s_operator",
          found: false,
          quote: "",
          timestamp_ref: "",
        },
      ];

      const pool: Evidence[] = [];
      const decision = buildInterviewDecision("cand_88", comps, facts, transcript, pool);

      assert.strictEqual(decision.outcome, "advance");
      assert.strictEqual(decision.criteria_results[0].verdict, "met");
      assert.strictEqual(decision.criteria_results[1].verdict, "not_met");
      assert.strictEqual(pool.length, 1);
      assert.strictEqual(pool[0].source_ref, "transcript:00:05:25");
      assert.strictEqual(pool[0].source_type, "interview_transcript");
    });
  });
});
