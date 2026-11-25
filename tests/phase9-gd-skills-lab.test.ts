import { describe, test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createUser, createSession } from "../lib/auth/store";
import { setGDAIExecutorForTest } from "../lib/gd/ai-gateway";
import { GET as skillsGet, POST as skillsPost } from "../app/api/gd/skills-lab/route";

describe("PHASE 9 — GD SKILLS LAB MICRO-DRILLS & MASTERY PERSISTENCE", () => {
  afterEach(() => {
    setGDAIExecutorForTest(null);
  });

  test("1. Rejects unauthenticated callers on /api/gd/skills-lab with 401 + no-store", async () => {
    const res = await skillsGet(new Request("http://localhost/api/gd/skills-lab"));
    assert.equal(res.status, 401);
    assert.ok((res.headers.get("cache-control") || "").includes("no-store"));
  });

  test("2. Generates drill scenarios, evaluates against track rubric, persists progress, and isolates users", async () => {
    setGDAIExecutorForTest(async ({ messages }) => {
      const prompt = messages.map((m) => m.content).join("\n");
      if (prompt.includes("Create one sharp realistic mid-discussion setup cue")) {
        return {
          text: JSON.stringify({
            promptScenario: "Practice challenging a confident peer's oversimplified scaling claim.",
            peerSetupLine: "Rohan V.: Microservices are always superior because every FAANG company uses them.",
            targetGuidance: "Acknowledge team autonomy first, then cite serialization overhead cleanly."
          })
        };
      }
      return {
        text: JSON.stringify({
          score: 86,
          rubricHits: [
            { criterion: "Targeted rebuttal", met: true, note: "Pinpointed network serialization cost directly." },
            { criterion: "Steelmanning first", met: true, note: "Validated organizational decoupling benefit first." },
            { criterion: "Non-defensive tone", met: true, note: "Respectful analytical register maintained." }
          ],
          coachFeedback: "Strong constructive counter-framing addressing both org scaling and technical coupling.",
          improvedExample: "While microservices help large autonomous teams ship independently, early teams pay heavy RPC serialization latency before hitting team-size bottlenecks."
        })
      };
    });

    const studentA = createUser({
      email: `skillsA_${Date.now()}@cognalyze.test`,
      accountType: "student",
      fullName: "Skills Alpha",
      passwordHash: null,
      passwordSalt: null
    });
    const studentB = createUser({
      email: `skillsB_${Date.now()}@cognalyze.test`,
      accountType: "student",
      fullName: "Skills Beta",
      passwordHash: null,
      passwordSalt: null
    });
    const sessA = createSession(studentA.id, "student");
    const sessB = createSession(studentB.id, "student");

    // Start drill on valid track
    const startRes = await skillsPost(
      new Request("http://localhost/api/gd/skills-lab", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: `cognalyze_session=${encodeURIComponent(sessA.token)}`
        },
        body: JSON.stringify({ action: "start_drill", trackId: "skill-constructive-counter" })
      })
    );
    assert.equal(startRes.status, 200);
    const startJson = await startRes.json();
    assert.equal(startJson.scenario.rubricChecklist.length, 3);

    // Noise response (< 4 words) must be rejected cleanly
    const shortRes = await skillsPost(
      new Request("http://localhost/api/gd/skills-lab", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: `cognalyze_session=${encodeURIComponent(sessA.token)}`
        },
        body: JSON.stringify({
          action: "submit_drill",
          trackId: "skill-constructive-counter",
          promptScenario: startJson.scenario.promptScenario,
          peerSetupLine: startJson.scenario.peerSetupLine,
          studentResponse: "ok sure"
        })
      })
    );
    assert.equal(shortRes.status, 400);

    // Valid response evaluated and persisted for Student A ONLY
    const submitRes = await skillsPost(
      new Request("http://localhost/api/gd/skills-lab", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: `cognalyze_session=${encodeURIComponent(sessA.token)}`
        },
        body: JSON.stringify({
          action: "submit_drill",
          trackId: "skill-constructive-counter",
          promptScenario: startJson.scenario.promptScenario,
          peerSetupLine: startJson.scenario.peerSetupLine,
          studentResponse: "I appreciate the organizational scaling point, however early microservices introduce network serialization overhead before team coupling requires splitting."
        })
      })
    );
    assert.equal(submitRes.status, 200);
    const submitJson = await submitRes.json();
    assert.equal(submitJson.evaluation.score, 86);
    assert.equal(submitJson.evaluation.passed, true);
    assert.equal(submitJson.evaluation.attemptCount, 1);

    // Student B has zero progress leaked from Student A
    const getB = await skillsGet(
      new Request("http://localhost/api/gd/skills-lab", {
        headers: { cookie: `cognalyze_session=${encodeURIComponent(sessB.token)}` }
      })
    );
    assert.equal(getB.status, 200);
    const jsonB = await getB.json();
    assert.equal(jsonB.progress.length, 0);
  });
});
