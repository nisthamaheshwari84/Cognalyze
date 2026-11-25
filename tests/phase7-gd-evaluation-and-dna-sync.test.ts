import { describe, test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { evaluateGDSessionAsync, evaluateGDSession } from "../lib/gd/evaluation-engine";
import { syncGDReportToStudentDNAAsync } from "../lib/gd/dna-sync";
import { createGDSession } from "../lib/gd/gd-session-store";
import { setGDAIExecutorForTest } from "../lib/gd/ai-gateway";
import { createUser } from "../lib/auth/store";
import { getStudentDNAFull } from "../lib/dna/store";

describe("PHASE 7 — AI EVALUATOR, MULTIPLAYER PARITY & STUDENT DNA SYNC", () => {
  afterEach(() => {
    setGDAIExecutorForTest(null);
  });

  test("1. AI-reasoned evaluation cites candidate's exact spoken turns and tailored rewrites", async () => {
    const session = createGDSession({
      userId: "eval-phase7-u1",
      topicId: "top-p7",
      topicTitle: "Open-Weight LLMs vs Proprietary APIs in Healthcare"
    });

    session.transcripts = [
      {
        id: "turn-peer-1",
        speakerId: session.participants[1].id,
        speakerName: session.participants[1].name,
        speakerAvatar: "⚡",
        speakerRole: "ML Lead",
        isHuman: false,
        content: "Frontier APIs ship faster for triage prototypes.",
        timestamp: Date.now() - 30000,
        formattedTime: "10:01 AM",
        stage: "opening"
      },
      {
        id: "turn-cand-1",
        speakerId: `candidate-${session.userId}`,
        speakerName: "Candidate (You)",
        speakerAvatar: "🎓",
        speakerRole: "Candidate",
        isHuman: true,
        content: "Because patient PHI leaves hospital boundaries over external APIs, quantized on-premise open models satisfy HIPAA compliance cleanly.",
        timestamp: Date.now() - 15000,
        formattedTime: "10:02 AM",
        stage: "active_discussion"
      }
    ];

    setGDAIExecutorForTest(async () => ({
      text: JSON.stringify({
        verdictSummary: "Candidate anchored compliance and data boundary constraints directly into the healthcare debate.",
        dimensions: [
          { dimension: "communication_clarity", score: 86, verdict: "exemplary", feedback: "Clear concise compliance framing.", turnNumber: 2 },
          { dimension: "content_quality", score: 88, verdict: "exemplary", feedback: "Highlighted HIPAA & on-prem trade-offs accurately.", turnNumber: 2 },
          { dimension: "logical_reasoning", score: 84, verdict: "proficient", feedback: "Clear cause-and-effect boundary premise.", turnNumber: 2 },
          { dimension: "active_listening", score: 74, verdict: "proficient", feedback: "Addressed speed vs privacy tension.", turnNumber: 2 },
          { dimension: "critical_thinking", score: 80, verdict: "proficient", feedback: "Tested regulatory assumption cleanly.", turnNumber: 2 },
          { dimension: "collaboration", score: 68, verdict: "developing", feedback: "Participated briefly; bridge with peers next turn.", turnNumber: 2 },
          { dimension: "leadership", score: 72, verdict: "proficient", feedback: "Framed compliance pillar.", turnNumber: 2 }
        ],
        strongestContributions: [
          { turnNumber: 2, whyStrong: "Pinpointed patient PHI boundary constraint directly." }
        ],
        weakestContributions: [
          {
            turnNumber: 2,
            whyNeedsImprovement: "Could quantify fallback triage latency.",
            recruiterRewrite: "To reconcile triage speed with HIPAA PHI boundaries, we should keep quantized diagnostic inference on-premise while auditing p95 response times."
          }
        ],
        missedOpportunities: ["Invite peers to weigh GPU maintenance cost."],
        targetedImprovementPlan: ["Cite inference cost thresholds", "Acknowledge opposing peer by name"],
        nextRecommendedPracticeTopic: "Hospital AI Liability Governance"
      }),
      provider: "mock-eval-ai"
    }));

    const report = await evaluateGDSessionAsync(session, {
      targetUserId: session.userId,
      targetUserName: "Candidate (You)"
    });

    assert.ok(report.overallScore >= 75);
    assert.ok(report.weakestContributions[0].recruiterRewrite.includes("HIPAA PHI"));
    const contentDim = report.dimensions.find((d) => d.dimension === "content_quality");
    assert.ok(contentDim?.citedExcerpts[0]?.quote.includes("quantized on-premise"));
  });

  test("2. Evaluates Friends GD participants independently without cross-user turn contamination", () => {
    const session = createGDSession({
      userId: "friend-a",
      topicId: "top-friends",
      topicTitle: "UPI vs CBDC Offline Resilience",
      isFriendsRoom: true,
      friendsRoomCode: "GD-9999"
    });

    session.transcripts = [
      {
        id: "t-a",
        speakerId: "candidate-friend-a",
        speakerName: "Friend A",
        speakerAvatar: "👑",
        speakerRole: "Host",
        isHuman: true,
        content: "Offline CBDC tokens allow deterministic settlement in rural blackouts because cryptographic state resides on device.",
        timestamp: Date.now() - 20000,
        formattedTime: "10:05 AM",
        stage: "active_discussion"
      }
    ];

    const reportA = evaluateGDSession(session, { targetUserId: "friend-a", targetUserName: "Friend A" });
    const reportB = evaluateGDSession(session, { targetUserId: "friend-b", targetUserName: "Friend B" });

    assert.equal(reportA.speakingTimeAnalysis.studentTurnCount, 1);
    assert.ok(reportA.overallScore > 40);

    assert.equal(reportB.speakingTimeAnalysis.studentTurnCount, 0);
    assert.equal(reportB.dimensions[0].verdict, "insufficient_evidence");
    assert.equal(reportB.dimensions[0].score, 0);
  });

  test("3. Student DNA sync records assessment evidence for spoken GD, and blocks silent rounds", async () => {
    const student = createUser({
      email: `dna_gd_${Date.now()}@cognalyze.test`,
      accountType: "student",
      fullName: "DNA Sync Student",
      passwordHash: null,
      passwordSalt: null
    });

    // Silent session must NOT write evidence into Student DNA
    const silentSession = createGDSession({
      userId: student.id,
      topicId: "top-silent",
      topicTitle: "Remote Work Trade-offs"
    });
    const silentReport = await evaluateGDSessionAsync(silentSession);
    const silentSync = await syncGDReportToStudentDNAAsync({ userId: student.id, report: silentReport });
    assert.equal(silentSync.synced, false);
    assert.equal(silentSync.reason, "insufficient_evidence");

    // Spoken verified session MUST persist verified GD evidence into Student DNA
    const spokenSession = createGDSession({
      userId: student.id,
      topicId: "top-spoken",
      topicTitle: "Zero-Trust Microservices"
    });
    spokenSession.transcripts = [
      {
        id: "s1",
        speakerId: `candidate-${student.id}`,
        speakerName: "DNA Sync Student",
        speakerAvatar: "🎓",
        speakerRole: "Candidate",
        isHuman: true,
        content: "Zero-trust architecture mitigates lateral movement risks because ephemeral mTLS identities enforce continuous verification across services.",
        timestamp: Date.now() - 10000,
        formattedTime: "10:10 AM",
        stage: "active_discussion"
      }
    ];

    const spokenReport = await evaluateGDSessionAsync(spokenSession, {
      targetUserId: student.id,
      targetUserName: "DNA Sync Student"
    });
    const spokenSync = await syncGDReportToStudentDNAAsync({ userId: student.id, report: spokenReport });
    assert.equal(spokenSync.synced, true);
    assert.ok(spokenSync.recordedEvidenceIds.length >= 1);

    const dnaFull = await getStudentDNAFull(student.id);
    assert.ok(
      dnaFull.evidence.some((e) => e.sourceId === spokenReport.sessionId),
      "Student DNA evidence store must reflect the verified GD assessment"
    );
  });
});
