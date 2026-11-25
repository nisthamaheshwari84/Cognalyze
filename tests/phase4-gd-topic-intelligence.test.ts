import { describe, test, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  GD_TOPICS,
  getGroupedTopicsForPracticeRoom
} from "../lib/group-discussion-data";
import {
  prepareCustomTopicBrief,
  scoreTopicForStudentDNA,
  getUserTopicHistoryAsync,
  recordGeneratedTopicsAsync
} from "../lib/gd/topic-service";
import { setGDAIExecutorForTest } from "../lib/gd/ai-gateway";
import { createUser, createSession } from "../lib/auth/store";
import { POST as generateTopicsPost } from "../app/api/gd/generate-topics/route";

describe("PHASE 4 — UNIFIED TOPIC DISCOVERY, BRIEF ENRICHMENT & DEDUP", () => {
  afterEach(() => {
    setGDAIExecutorForTest(null);
  });

  test("1. Canonical topic catalog populates all 6 live practice categories without duplication", () => {
    const grouped = getGroupedTopicsForPracticeRoom();
    for (const key of ["ai", "arch", "fintech", "hiring", "web3", "ethics"]) {
      assert.ok(Array.isArray(grouped[key]) && grouped[key].length >= 1, `Category ${key} must have >= 1 topic`);
    }
    const allTitles = GD_TOPICS.map((t) => t.title.toLowerCase().trim());
    const uniqueTitles = new Set(allTitles);
    assert.equal(uniqueTitles.size, allTitles.length, "Canonical GD_TOPICS must contain zero duplicate titles");
  });

  test("2. Custom prompt validator rejects trivial inputs and frames valid prompts into two camps", async () => {
    const rejected = await prepareCustomTopicBrief({ rawPrompt: "AI bad" });
    assert.equal(rejected.valid, false);

    setGDAIExecutorForTest(async () => ({
      text: JSON.stringify({
        normalizedTitle: "Should Healthcare Diagnostics Mandate Explainable Open-Weight Clinical AI?",
        context: "Hospitals balance model transparency and local privacy against black-box diagnostic recall.",
        propositionCamp: "Clinical accountability requires auditable open weights and local verification.",
        oppositionCamp: "Frontier proprietary models deliver higher edge-case safety across rare diseases.",
        keyQuestions: ["How do we audit model drift quarterly?"],
        category: "AI & Technology"
      }),
      provider: "mock-topic-ai"
    }));

    const enriched = await prepareCustomTopicBrief({
      rawPrompt: "Should healthcare diagnostics use open-weight AI models?",
      targetRole: "AI/ML Engineer"
    });

    assert.equal(enriched.valid, true);
    assert.ok(enriched.propositionCamp.length > 10);
    assert.ok(enriched.oppositionCamp.length > 10);
    assert.ok(enriched.normalizedTitle.includes("AI"));
  });

  test("3. Student DNA scoring prioritizes matching role and skill gaps", () => {
    const scored = GD_TOPICS.map((t) => ({
      title: t.title,
      score: scoreTopicForStudentDNA(t, {
        targetRole: "Cloud Architect",
        topSkills: ["Kubernetes", "Zero-Trust"],
        skillGaps: ["ledger"]
      })
    })).sort((a, b) => b.score - a.score);

    assert.ok(scored[0].score > scored[scored.length - 1].score);
  });

  test("4. Topic history deduplication persists server-side and API rejects repeat topics", async () => {
    const user = createUser({
      email: `topic_dedup_${Date.now()}@cognalyze.test`,
      accountType: "student",
      fullName: "Topic Tester",
      passwordHash: null,
      passwordSalt: null
    });
    const session = createSession(user.id, "student");

    const repeatedTitle = "Model Distillation vs Frontier Scaling: Will Small Specialized Models Replace Massive LLMs in Production?";
    await recordGeneratedTopicsAsync(user.id, [{ title: repeatedTitle, category: "AI & Technology" }]);
    const history = await getUserTopicHistoryAsync(user.id);
    assert.ok(history.includes(repeatedTitle));

    setGDAIExecutorForTest(async () => ({
      text: JSON.stringify({
        topics: [
          {
            title: repeatedTitle,
            domain: "AI & Machine Learning",
            category: "AI & Technology",
            difficulty: "Medium"
          },
          {
            title: "Deterministic Evaluation Suites vs LLM-as-a-Judge in Enterprise CI Pipelines",
            domain: "AI & Machine Learning",
            category: "AI & Technology",
            difficulty: "Hard"
          }
        ]
      })
    }));

    const res = await generateTopicsPost(
      new Request("http://localhost/api/gd/generate-topics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: `cognalyze_session=${encodeURIComponent(session.token)}`
        },
        body: JSON.stringify({
          domains: ["AI & Machine Learning"],
          count: 3
        })
      })
    );

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.ok(!json.topics.some((t: any) => t.title === repeatedTitle), "Duplicate topic from server history must be filtered out");
    assert.ok(json.topics.some((t: any) => t.title.includes("Deterministic Evaluation Suites")));
  });
});
