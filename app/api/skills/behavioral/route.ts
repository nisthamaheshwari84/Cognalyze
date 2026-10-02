/**
 * app/api/skills/behavioral/route.ts
 * Redesigned Behavioral & Corporate HR Arena API.
 * "HIDE THE COMPLEXITY, NOT THE INTELLIGENCE."
 * 
 * Supports:
 * 1. GET:
 *    - mode="home": Home gateway data (quick practice, weak spot drill, simple progress).
 *    - mode="learn_scenarios": Interactive micro-learning scenarios (30-120s A vs B choices).
 *    - mode="practice_question": Fresh question using anti-repetition engine.
 *    - mode="interview_set": Fresh multi-question mock interview sequence.
 *    - mode="progress": Candidate progress summary (getting better at, work on next).
 *    - mode="bank": Searchable question bank.
 *    - id="...": Single question lookup.
 * 2. POST:
 *    - action="evaluate" (or default): "ONE THING TO IMPROVE" evidence-based evaluation.
 *    - action="coach": Targeted draft diagnostic ("What is missing", "You said", "Try").
 *    - action="interview_turn": Multi-turn conversational interview with adaptive follow-ups.
 *    - action="interview_finish": Grounded end-of-interview report with excerpts.
 */

import { NextRequest, NextResponse } from "next/server";
import { groqFetch } from "@/lib/groq";
import { extractJSON, stripThinkTags } from "@/lib/ai/placement-intelligence";
import {
  BEHAVIORAL_COMPETENCY_GUIDES,
  EXPANDED_BEHAVIORAL_QUESTION_BANK,
  evaluateBehavioralAnswerLocally,
  generateBehavioralInterviewSession,
  getCandidateBehavioralScorecard,
  BehavioralQuestionFull,
  MICRO_LEARN_SCENARIOS,
  SIMPLE_CORE_QUESTIONS,
  evaluateSingleImprovement,
  evaluateCoachDraft,
  getNextCandidateQuestion,
  getSimpleCandidateProgress,
  generateGroundedInterviewReview,
  generateInterviewAdaptiveFollowUp
} from "@/lib/skills/behavioral-curriculum";
import {
  recordCandidateAttempt,
  getStudentBehavioralProgress,
  updateStudentBehavioralStatus
} from "@/lib/skills/candidate-history";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get("candidateId") || "student-demo";
    const mode = searchParams.get("mode") || "home";
    const questionId = searchParams.get("id");
    const trackType = searchParams.get("trackType");
    const competency = searchParams.get("competency");
    const difficulty = searchParams.get("difficulty");
    const search = searchParams.get("search");

    // 1. Single Question Lookup
    if (questionId) {
      const question =
        EXPANDED_BEHAVIORAL_QUESTION_BANK.find(q => q.id === questionId) ||
        EXPANDED_BEHAVIORAL_QUESTION_BANK[0];
      return NextResponse.json({
        success: true,
        question
      });
    }

    // 2. Home Gateway Screen Data (Requirement 20)
    if (mode === "home") {
      const progress = getSimpleCandidateProgress(candidateId);
      const quickQuestion = getNextCandidateQuestion(candidateId, "practice");
      return NextResponse.json({
        success: true,
        candidateId,
        progress,
        quickQuestion,
        weakSpot: progress.workOnNext
      });
    }

    // 3. Micro-Learning Scenarios (Requirement 3, 23)
    if (mode === "learn_scenarios") {
      return NextResponse.json({
        success: true,
        scenarios: MICRO_LEARN_SCENARIOS,
        total: MICRO_LEARN_SCENARIOS.length
      });
    }

    // 4. Fresh Practice Question (Anti-Repetition Engine, Requirement 10)
    if (mode === "practice_question") {
      const excludeParam = searchParams.get("exclude");
      const excludeIds = excludeParam ? excludeParam.split(",") : [];
      const question = getNextCandidateQuestion(candidateId, "practice", {
        competencyId: competency || undefined,
        excludeIds
      });
      return NextResponse.json({
        success: true,
        question
      });
    }

    // 5. Candidate Simple Progress Summary (Requirement 16, 18)
    if (mode === "progress") {
      const progress = getSimpleCandidateProgress(candidateId);
      return NextResponse.json({
        success: true,
        progress
      });
    }

    // 6. Multi-Question Interview Set (Requirement 9, 13)
    if (mode === "interview_set") {
      const track = (trackType === "service_hr" ? "service_hr" : "faang_star") as any;
      const count = parseInt(searchParams.get("count") || "3", 10);
      const session = generateBehavioralInterviewSession(candidateId, track, count);
      return NextResponse.json({
        success: true,
        ...session
      });
    }

    // 7. Full 12-Competency Curriculum (Preserved for backwards compatibility)
    if (mode === "curriculum") {
      const userProgress = getStudentBehavioralProgress(candidateId);
      const scorecard = getCandidateBehavioralScorecard(candidateId);

      const enrichedGuides = BEHAVIORAL_COMPETENCY_GUIDES.map(guide => {
        const prog = userProgress[guide.id];
        const sc = scorecard.find(s => s.competencyId === guide.id);
        return {
          ...guide,
          status: prog?.status || (sc ? sc.status.toLowerCase() : "not_started"),
          score: prog?.lastScore || sc?.averageScore || 0,
          attempts: prog?.attempts || sc?.attemptsCount || 0
        };
      });

      return NextResponse.json({
        success: true,
        curriculum: enrichedGuides,
        scorecard,
        totalCompetencies: enrichedGuides.length
      });
    }

    // 8. Competencies Scorecard (Preserved for backwards compatibility)
    if (mode === "competencies") {
      const scorecard = getCandidateBehavioralScorecard(candidateId);
      return NextResponse.json({
        success: true,
        candidateId,
        scorecard
      });
    }

    // 9. Searchable Question Bank (Requirement 10, 11)
    let list = [...EXPANDED_BEHAVIORAL_QUESTION_BANK];

    if (trackType && trackType !== "all") {
      list = list.filter(q => q.track_type === trackType || q.track_type === "universal");
    }

    if (competency && competency !== "all") {
      list = list.filter(q => q.competency_id === competency);
    }

    if (difficulty && difficulty !== "all") {
      list = list.filter(q => q.difficulty.toLowerCase() === difficulty.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(item =>
        item.title.toLowerCase().includes(q) ||
        item.question.toLowerCase().includes(q) ||
        item.company_tag.toLowerCase().includes(q) ||
        (item.principle && item.principle.toLowerCase().includes(q))
      );
    }

    const competencyCounts: Record<string, number> = {};
    for (const q of EXPANDED_BEHAVIORAL_QUESTION_BANK) {
      competencyCounts[q.competency_id] = (competencyCounts[q.competency_id] || 0) + 1;
    }

    return NextResponse.json({
      success: true,
      totalCount: EXPANDED_BEHAVIORAL_QUESTION_BANK.length,
      filteredCount: list.length,
      competencyCounts,
      questions: list
    });
  } catch (err: any) {
    console.error("Error in Behavioral GET API:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      action = "evaluate",
      questionId,
      candidateResponse = "",
      candidateId = "student-demo",
      trackSlug = "product_mid",
      isInterview = false,
      timeSpentSeconds = 120,
      evaluationsHistory = []
    } = body;

    // ── ACTION: COACH DRAFT DIAGNOSIS (Requirement 14) ──
    if (action === "coach") {
      const coachDiagnosis = evaluateCoachDraft(candidateResponse);
      return NextResponse.json({
        success: true,
        diagnosis: coachDiagnosis
      });
    }

    // ── ACTION: INTERVIEW FINISH (Requirement 29) ──
    if (action === "interview_finish") {
      const review = generateGroundedInterviewReview(evaluationsHistory);
      return NextResponse.json({
        success: true,
        review
      });
    }

    // ── ACTION: EVALUATE PRACTICE OR INTERVIEW TURN (Requirements 5, 6, 7, 8, 9, 28) ──
    const question: BehavioralQuestionFull =
      EXPANDED_BEHAVIORAL_QUESTION_BANK.find(q => q.id === questionId) ||
      EXPANDED_BEHAVIORAL_QUESTION_BANK[0];

    const cleanResponse = (candidateResponse || "").trim();

    // 1. Deterministic Local Evaluation (Guarantees zero downtime & exact candidate quotes)
    const localEval = evaluateSingleImprovement(question, cleanResponse, candidateId);

    let finalEval = { ...localEval };

    // 2. AI Enhancement with strict grounding to candidate's actual words
    if (!localEval.isShortOrEmpty && cleanResponse.length >= 25) {
      try {
        const prompt = `You are Cognalyze's intelligent interview coach.
Your job is to identify the ONE single most important thing this candidate can improve right now.
Rules:
- NEVER fabricate numbers, results, or actions the candidate did not mention.
- Extract an EXACT quote (substring) from the candidate's answer for evidence.
- If candidate used "we", point out that interviewers need to see their personal contribution ("I").
- If candidate missed the result, ask for the outcome.
- Be encouraging, student-friendly, and concise.

Question: "${question.question}"
Candidate Answer: "${cleanResponse}"

Respond in STRICT JSON:
{
  "whatWorked": "One concrete strength you noticed in their answer",
  "oneThingToImprove": "The SINGLE highest-impact improvement",
  "evidenceQuote": "EXACT quote from candidate text illustrating this point",
  "whyThisMatters": "One clear sentence explaining why interviewers look for this",
  "tryThis": "One actionable sentence suggesting what to add or rewrite",
  "adaptiveFollowUp": "A natural follow-up question listening directly to what they said",
  "score": number between 40 and 95
}`;

        const aiRes = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "openai/gpt-oss-120b",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2,
            max_tokens: 500
          })
        });

        const aiData = await aiRes.json();
        const raw = aiData.choices?.[0]?.message?.content || "{}";
        const parsed = extractJSON(stripThinkTags(raw));

        if (parsed && parsed.whatWorked && parsed.oneThingToImprove) {
          finalEval = {
            ...localEval,
            whatWorked: parsed.whatWorked || localEval.whatWorked,
            oneThingToImprove: parsed.oneThingToImprove || localEval.oneThingToImprove,
            evidenceQuote: parsed.evidenceQuote && cleanResponse.includes(parsed.evidenceQuote)
              ? `"${parsed.evidenceQuote}"`
              : localEval.evidenceQuote,
            whyThisMatters: parsed.whyThisMatters || localEval.whyThisMatters,
            tryThis: parsed.tryThis || localEval.tryThis,
            adaptiveFollowUp: parsed.adaptiveFollowUp || localEval.adaptiveFollowUp,
            internalScore: typeof parsed.score === "number" ? parsed.score : localEval.internalScore
          };
        }
      } catch (e) {
        // Fallback to localEval is fully grounded and immediate
      }
    }

    // 3. Record candidate attempt to isolated history (Requirement 30)
    const compStatus = finalEval.internalScore >= 80 ? "mastered" : finalEval.internalScore >= 65 ? "practiced" : "learned";
    updateStudentBehavioralStatus(candidateId, question.competency_id, compStatus, finalEval.internalScore);

    const attempt = recordCandidateAttempt({
      candidateId,
      domain: "behavioral_hr",
      topic: `${question.title} (${question.competency_id.replace(/_/g, " ").toUpperCase()})`,
      mode: isInterview ? "interview" : "practice",
      score: finalEval.internalScore,
      accuracy: finalEval.internalScore,
      timeSpentSeconds,
      questionsAttempted: 1,
      questionsCorrect: finalEval.internalScore >= 70 ? 1 : 0,
      questionIds: [question.id],
      weaknesses: [finalEval.oneThingToImprove],
      strengths: [finalEval.whatWorked],
      feedback: `${finalEval.whatWorked} | Focus: ${finalEval.oneThingToImprove}`
    });

    // 4. Return clean, student-friendly response
    return NextResponse.json({
      success: true,
      attemptId: attempt.id,
      questionId: question.id,
      competencyId: question.competency_id,
      evaluation: finalEval,
      // For backwards compatibility if old components query verdict or score:
      score: finalEval.internalScore,
      verdict: finalEval.internalVerdict
    });
  } catch (err: any) {
    console.error("Error in Behavioral POST evaluation:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
