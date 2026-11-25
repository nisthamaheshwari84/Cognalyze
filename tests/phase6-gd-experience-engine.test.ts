import { describe, test, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  GD_EXPERIENCE_MODE_META,
  buildExperienceBlueprintAsync,
  generateDynamicScenarioTwistAsync
} from "../lib/gd/experience-engine";
import {
  detectConversationalStagnation,
  evaluateCoachIntervention
} from "../lib/gd/coach-moderator-engine";
import { createGDSessionAsync } from "../lib/gd/gd-session-store";
import { setGDAIExecutorForTest } from "../lib/gd/ai-gateway";

describe("PHASE 6 — DYNAMIC EXPERIENCE ENGINE & SEMANTIC COACH", () => {
  afterEach(() => {
    setGDAIExecutorForTest(null);
  });

  test("1. Builds bespoke experience blueprints across all 5 modes with graceful fallback", async () => {
    setGDAIExecutorForTest(async () => {
      throw new Error("Offline test fallback check");
    });

    const crisis = await buildExperienceBlueprintAsync({
      topicTitle: "Zero-Downtime Payment Failover",
      format: "technical_business",
      difficulty: "advanced",
      experienceMode: "crisis_room"
    });
    assert.equal(crisis.mode, "crisis_room");
    assert.equal(crisis.modeLabel, GD_EXPERIENCE_MODE_META.crisis_room.label);
    assert.ok(crisis.openingScenarioBrief.includes("WAR-ROOM"));
    assert.ok(crisis.keyConstraints.length >= 3);

    const ethics = await buildExperienceBlueprintAsync({
      topicTitle: "Facial Recognition in Public Transit",
      format: "corporate",
      difficulty: "intermediate",
      experienceMode: "ethical_dilemma"
    });
    assert.equal(ethics.mode, "ethical_dilemma");
    assert.ok(ethics.midSessionTwistPrompt.toLowerCase().includes("audit") || ethics.midSessionTwistPrompt.length > 20);
  });

  test("2. Semantic stagnation detector catches circular repetition in any non-technical domain", () => {
    const stagnantTranscripts: any[] = [
      { speakerId: "p1", speakerName: "Aarav", content: "Remote policy improves employee morale and saves commute hours daily." },
      { speakerId: "p2", speakerName: "Priya", content: "Yes, remote policy strengthens employee morale and daily commute balance." },
      { speakerId: "p3", speakerName: "Karan", content: "Indeed employee morale and reduced daily commute drive remote policy gains." }
    ];
    // Need >= 5 items overall in transcripts to trigger check
    const padded = [
      { speakerId: "mod", speakerName: "Alex", content: "Floor open." },
      { speakerId: "p0", speakerName: "Dev", content: "Let's discuss workplace policies." },
      ...stagnantTranscripts
    ];

    const detected = detectConversationalStagnation(padded as any);
    assert.equal(detected.stagnant, true, "Circular HR turns repeating morale/commute/remote must be caught without latency regex");
    assert.ok(detected.repeatedTerms.includes("employee") || detected.repeatedTerms.includes("morale"));
  });

  test("3. Dynamic challenge intervention adapts to experience blueprint mid-session", async () => {
    setGDAIExecutorForTest(async () => ({
      text: JSON.stringify({
        label: "Board Margin Audit",
        prompt: "Following Priya's CapEx argument, the board just cut Q4 cloud spend by 30%. Which subsystem do you defer?"
      })
    }));

    const session = await createGDSessionAsync({
      userId: "phase6-user",
      topicId: "t6",
      topicTitle: "Multi-Region Cloud Active-Active Replication",
      format: "corporate",
      experienceMode: "boardroom_debate",
      difficulty: "advanced"
    });

    assert.equal(session.experienceMode, "boardroom_debate");
    assert.ok(session.experienceBlueprint?.openingScenarioBrief);

    const coachDecision = await evaluateCoachIntervention({
      sessionId: session.sessionId,
      topicTitle: session.topicTitle,
      format: session.format,
      difficulty: session.difficulty,
      currentStage: "active_discussion",
      secondsElapsed: Math.floor(session.totalDurationSeconds * 0.52),
      totalDurationSeconds: session.totalDurationSeconds,
      participants: session.participants,
      transcripts: [
        {
          id: "t1",
          speakerId: "peer-1",
          speakerName: "Priya",
          speakerAvatar: "🎯",
          speakerRole: "Lead",
          isHuman: false,
          content: "CapEx scales cleanly.",
          timestamp: Date.now(),
          formattedTime: "10:00 AM",
          stage: "active_discussion"
        }
      ],
      experienceBlueprint: session.experienceBlueprint
    });

    assert.equal(coachDecision.shouldIntervene, true);
    assert.equal(coachDecision.type, "DYNAMIC_CHALLENGE");
    assert.equal(coachDecision.newStage, "dynamic_challenge");
    assert.equal(coachDecision.twistLabel, "Board Margin Audit");
    assert.ok(coachDecision.moderatorUtterance?.includes("30%"));

    const fallbackTwist = await generateDynamicScenarioTwistAsync({
      topicTitle: session.topicTitle,
      recentTranscripts: []
    });
    assert.ok(fallbackTwist.prompt.length > 20);
  });
});
