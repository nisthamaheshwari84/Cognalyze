import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  KNOWLEDGE_GRAPH,
  getDomainNodes,
  getMissingPrerequisites,
  getSupportedDomains
} from "../lib/mentor/knowledge-graph";
import {
  detectConfusion,
  buildMentorSystemPrompt,
  getHintText
} from "../lib/mentor/engine";
import {
  getOrCreateLearningTwin,
  updateLearningTwin,
  recordMentorEvidence,
  resetMentorSession,
  getDefaultGoal,
  createMentorSession,
  saveSessionMessages,
  endMentorSession,
  getMentorSessionHistory,
  getActiveSession
} from "../lib/mentor/store";
import { getStudentEvidence } from "../lib/intelligence/student-intelligence";

describe("Cognalyze Mentor Engine & Learning Twin", () => {
  const TEST_STUDENT_ID = "test-mentor-learner-1";

  beforeEach(() => {
    resetMentorSession(TEST_STUDENT_ID);
  });

  it("should provide structured knowledge graph nodes with prerequisites and 5-level hint ladders", () => {
    const domains = getSupportedDomains();
    assert.ok(domains.includes("System Design"));
    assert.ok(domains.includes("DSA & Problem Solving"));

    const sysNodes = getDomainNodes("System Design");
    assert.ok(sysNodes.length >= 3);

    const cachingNode = KNOWLEDGE_GRAPH["sys-caching"];
    assert.ok(cachingNode !== undefined);
    assert.ok(cachingNode.prerequisites.includes("sys-networking"));
    assert.ok(Boolean(cachingNode.hintLadder.level1));
    assert.ok(Boolean(cachingNode.hintLadder.level5));

    // Check missing prerequisites
    const missing = getMissingPrerequisites("sys-caching", []);
    assert.ok(missing.includes("sys-networking"));

    const satisfied = getMissingPrerequisites("sys-caching", ["sys-networking"]);
    assert.strictEqual(satisfied.length, 0);
  });

  it("should accurately detect confusion signals in both English and Hinglish", () => {
    const twin = getOrCreateLearningTwin(TEST_STUDENT_ID);

    // English signals
    assert.strictEqual(detectConfusion("I don't understand how caching helps", twin).isConfused, true);
    assert.strictEqual(detectConfusion("I am confused about L4 vs L7", twin).isConfused, true);
    assert.strictEqual(detectConfusion("I think maybe it works?", twin).isConfused, true);

    // Hinglish signals
    assert.strictEqual(detectConfusion("mujhe sharding samajh nahi aaya", twin).isConfused, true);
    assert.strictEqual(detectConfusion("ek baar fir se batao please", twin).isConfused, true);

    // Clear answer (no confusion)
    assert.strictEqual(
      detectConfusion("We can use Redis with Cache-Aside pattern to reduce database query latency", twin).isConfused,
      false
    );
  });

  it("should construct Socratic system prompt preserving English technical terms in Hinglish and Hindi", () => {
    const twinHinglish = getOrCreateLearningTwin(TEST_STUDENT_ID, {
      preferredLanguage: "hinglish",
      domain: "System Design"
    });

    const promptHinglish = buildMentorSystemPrompt(twinHinglish);
    assert.ok(promptHinglish.includes("Cognalyze Mentor"));
    assert.ok(promptHinglish.includes("LANGUAGE INSTRUCTION (HINGLISH)"));
    assert.ok(promptHinglish.includes("Keep ALL technical terms in English"));

    const twinHindi = getOrCreateLearningTwin(TEST_STUDENT_ID, {
      preferredLanguage: "hi",
      domain: "System Design"
    });
    const promptHindi = buildMentorSystemPrompt(twinHindi);
    assert.ok(promptHindi.includes("LANGUAGE INSTRUCTION (HINDI)"));
    assert.ok(promptHindi.includes("Keep ALL technical terms in English"));
  });

  it("should provide progressive hint levels without leaking full solution early", () => {
    const node = KNOWLEDGE_GRAPH["sys-load-balancing"];
    assert.ok(node !== undefined);

    const hint1 = getHintText(node, 1);
    const hint3 = getHintText(node, 3);
    const hint5 = getHintText(node, 5);

    assert.ok(Boolean(hint1));
    assert.ok(Boolean(hint3));
    assert.ok(Boolean(hint5));
    assert.notStrictEqual(hint1, hint5);
    assert.ok(hint5.toLowerCase().includes("architecture"));
  });

  it("should record mentor evidence and synchronize directly into Student DNA", () => {
    const twin = getOrCreateLearningTwin(TEST_STUDENT_ID, { domain: "System Design" });
    assert.strictEqual(twin.sessionEvidence.length, 0);

    // Record an independent demonstration
    recordMentorEvidence(TEST_STUDENT_ID, {
      id: "ev-test-1",
      studentId: TEST_STUDENT_ID,
      conceptId: "sys-caching",
      conceptName: "Caching Strategies & Cache Invalidation",
      domain: "System Design",
      demonstratedLevel: "Demonstrated",
      assistanceLevel: "Independent",
      hintsUsed: 0,
      verbatimExcerpt: "I chose Cache-Aside with Redis and active eviction on database writes to prevent stale reads.",
      reasoningJustification: "Identified read-heavy ratio and justified cache-aside pattern without hints.",
      whyExplanation: "Demonstrated independent architectural trade-off justification during Socratic challenge.",
      createdAt: new Date().toISOString()
    });

    // Check Learning Twin update
    const updatedTwin = getOrCreateLearningTwin(TEST_STUDENT_ID);
    assert.strictEqual(updatedTwin.sessionEvidence.length, 1);
    assert.strictEqual(updatedTwin.concepts["sys-caching"].status, "demonstrated");
    assert.strictEqual(updatedTwin.concepts["sys-caching"].independentSuccessCount, 1);

    // Verify synchronization into Student DNA
    const studentEvidence = getStudentEvidence(TEST_STUDENT_ID);
    const mentorEvidence = studentEvidence.find((e) => e.sourceId === "ev-test-1");
    assert.ok(mentorEvidence !== undefined);
    assert.strictEqual(mentorEvidence?.capability, "Caching Strategies & Cache Invalidation");
    assert.strictEqual(mentorEvidence?.evidenceLevel, 3); // Demonstrated level = Level 3 Assessed
    assert.strictEqual(mentorEvidence?.provenance.sourceName, "Cognalyze Mentor");
  });

  it("should archive completed conversations on exit and start fresh sessions without bleeding past dialogue", () => {
    // 1. Start Session 1
    const session1 = createMentorSession(TEST_STUDENT_ID, {
      domain: "System Design",
      conceptId: "sys-caching",
      title: "Caching Session"
    });
    assert.strictEqual(session1.status, "active");

    // Add dialogue to Session 1
    saveSessionMessages(TEST_STUDENT_ID, session1.id, [
      { id: "m1", role: "mentor", content: "Let's discuss Caching", timestamp: new Date().toISOString() },
      { id: "m2", role: "user", content: "I want to understand Redis vs Memcached", timestamp: new Date().toISOString() }
    ]);

    // 2. User exits Session 1
    const ended = endMentorSession(TEST_STUDENT_ID, session1.id);
    assert.ok(ended !== null);
    assert.strictEqual(ended?.status, "completed");
    assert.ok(Boolean(ended?.endedAt));

    // Active session pointer must be cleared so user is not trapped
    const activeAfterExit = getActiveSession(TEST_STUDENT_ID, false);
    assert.strictEqual(activeAfterExit, null);

    // 3. Start fresh Session 2
    const session2 = createMentorSession(TEST_STUDENT_ID, {
      domain: "System Design",
      conceptId: "sys-load-balancing",
      title: "Load Balancing Session"
    });
    assert.strictEqual(session2.status, "active");
    assert.notStrictEqual(session2.id, session1.id);

    // Session 2 messages should be empty (clean canvas)
    assert.strictEqual(session2.messages.length, 0);

    // 4. Session History contains both sessions safely preserved
    const history = getMentorSessionHistory(TEST_STUDENT_ID);
    assert.strictEqual(history.length, 2);
    assert.strictEqual(history[0].id, session2.id); // newest first
    assert.strictEqual(history[1].id, session1.id);
    assert.strictEqual(history[1].messages.length, 2);
  });
});

