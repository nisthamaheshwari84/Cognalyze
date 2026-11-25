import { describe, test, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  generateDynamicAIPanelAsync,
  updateParticipantMemoryAfterTurn
} from "../lib/gd/dynamic-agent-generator";
import { createGDSession, createGDSessionAsync } from "../lib/gd/gd-session-store";
import { orchestrateNextTurn } from "../lib/gd/simulation-engine";
import { setGDAIExecutorForTest } from "../lib/gd/ai-gateway";

describe("PHASE 5 — DYNAMIC AI PANEL GENERATION & STANCE MEMORY", () => {
  afterEach(() => {
    setGDAIExecutorForTest(null);
  });

  test("1. Generates 4 topic-calibrated AI personas with spaced voices and balanced stances", async () => {
    setGDAIExecutorForTest(async () => ({
      text: JSON.stringify({
        participants: [
          {
            name: "Aarav N.",
            roleTitle: "Hospital ML Lead",
            archetype: "dominant_speaker",
            currentStance: "pro",
            reasoningLens: "Diagnostic sensitivity & triage speed",
            temperament: "Decisive clinical innovator",
            speakingStyle: "Fast, metric-driven, asserts triage ROI"
          },
          {
            name: "Meera S.",
            roleTitle: "Privacy & HIPAA Counsel",
            archetype: "critical_challenger",
            currentStance: "con",
            reasoningLens: "Zero patient PHI leakage",
            temperament: "Cautious compliance skeptic",
            speakingStyle: "Probing, raises audit failure scenarios"
          },
          {
            name: "Kabir M.",
            roleTitle: "Distributed Infra Architect",
            archetype: "analytical_thinker",
            currentStance: "neutral",
            reasoningLens: "GPU inference budget & p99 SLA",
            temperament: "Measured quantitative thinker",
            speakingStyle: "Structured two-part cost breakdowns"
          },
          {
            name: "Sanya R.",
            roleTitle: "Clinical Product Manager",
            archetype: "diplomatic_contributor",
            currentStance: "nuanced",
            reasoningLens: "Clinician trust & phased rollout",
            temperament: "Synthesizer balancing safety and shipping",
            speakingStyle: "Bridges competing camps cleanly"
          }
        ]
      }),
      provider: "mock-panel-gen"
    }));

    const panel = await generateDynamicAIPanelAsync({
      topicTitle: "Open-Weight Clinical LLMs in Hospital Emergency Triage",
      format: "technical_business",
      difficulty: "advanced",
      targetRole: "AI/ML Engineer"
    });

    assert.equal(panel.length, 4);
    assert.equal(panel[0].name, "Aarav N.");
    assert.equal(panel[1].currentStance, "con");
    assert.ok(panel[2].reasoningLens?.includes("GPU"));

    const pitches = new Set(panel.map((p) => p.voiceProfile.pitch));
    assert.equal(pitches.size, 4, "Each AI persona must have a distinct voice pitch signature");
  });

  test("2. Falls back cleanly to calibrated archetype panel if AI generation fails", async () => {
    setGDAIExecutorForTest(async () => {
      throw new Error("Simulated outage");
    });

    const panel = await generateDynamicAIPanelAsync({
      topicTitle: "Monoliths vs Microservices",
      format: "competitive",
      difficulty: "intermediate"
    });

    assert.equal(panel.length, 4);
    assert.ok(panel.every((p) => !p.isHuman && p.name.length > 0));
  });

  test("3. Participant memory records arguments, agreements/disagreements, and late-stage convergence", () => {
    const session = createGDSession({
      userId: "mem-user",
      topicId: "top-mem",
      topicTitle: "Serverless vs Kubernetes"
    });

    const speaker = session.participants[1]; // Rohan V.
    const targetPeer = session.participants[2]; // Ananya M.

    updateParticipantMemoryAfterTurn({
      session,
      speakerId: speaker.id,
      utterance: `I disagree with ${targetPeer.name} because cold-start latency creates unacceptable p99 spikes.`,
      stage: "active_discussion"
    });

    assert.ok(speaker.argumentsPresented[0].includes("cold-start latency"));
    assert.ok(speaker.disagreementsWith.includes(targetPeer.name));
    assert.equal(speaker.currentEmotionState, "assertive");
    assert.equal(targetPeer.currentEmotionState, "probing");

    updateParticipantMemoryAfterTurn({
      session,
      speakerId: speaker.id,
      utterance: `Building on ${targetPeer.name}'s baseline point, we can reconcile both via hybrid routing.`,
      stage: "synthesis"
    });

    assert.ok(speaker.agreementsWith.includes(targetPeer.name));
    assert.equal(speaker.currentStance, "nuanced");
    assert.equal(speaker.currentEmotionState, "conciliatory");
  });

  test("4. Async session creation attaches dynamic panel and orchestrateNextTurn propagates memory", async () => {
    let seenPrompt = "";
    setGDAIExecutorForTest(async ({ messages }) => {
      const joined = messages.map((m) => m.content).join("\n");
      if (joined.includes("Design a panel of exactly 4")) {
        return {
          text: JSON.stringify({
            participants: [
              { name: "Dev P.", roleTitle: "Edge Lead", archetype: "dominant_speaker", currentStance: "pro", reasoningLens: "Edge latency" },
              { name: "Tara G.", roleTitle: "SRE Lead", archetype: "analytical_thinker", currentStance: "con", reasoningLens: "Cold starts" },
              { name: "Vikram L.", roleTitle: "SecOps", archetype: "critical_challenger", currentStance: "con", reasoningLens: "IAM blast radius" },
              { name: "Nisha B.", roleTitle: "Staff PM", archetype: "diplomatic_contributor", currentStance: "nuanced", reasoningLens: "Hybrid adoption" }
            ]
          })
        };
      }
      seenPrompt = joined;
      return {
        text: JSON.stringify({
          spoken_text: "Dev raises an edge latency point, yet stateless cold-starts still hurt tail reliability.",
          student_coaching: {
            articulationScore: 86,
            valueAdded: "High",
            feedbackTip: "Quantify sustained QPS cutover.",
            winningCounterPhrase: "At what steady-state QPS does container reservation beat per-request billing?"
          }
        })
      };
    });

    const session = await createGDSessionAsync({
      userId: "phase5-async-user",
      topicId: "t5",
      topicTitle: "Serverless Edge vs Kubernetes",
      format: "competitive",
      difficulty: "intermediate"
    });

    assert.equal(session.participants[1].name, "Dev P.");
    session.participants[2].agreementsWith.push("Dev P.");

    await orchestrateNextTurn(session, "Let us benchmark cold starts vs provisioned concurrency.");
    assert.ok(seenPrompt.includes("Agreed previously with:") || seenPrompt.includes("Reasoning Lens:"));
  });
});
