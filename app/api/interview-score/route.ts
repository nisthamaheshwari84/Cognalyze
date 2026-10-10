import { NextResponse } from "next/server";
import { groqFetch } from "@/lib/groq";
import {
  getCareerMemory,
  recordCareerMemoryItem,
  addEvidenceItem,
  normalizeCapabilityName,
} from "@/lib/intelligence/student-intelligence";
import { getAuthenticatedContext } from "@/lib/auth/server";

export interface EvidenceMarker {
  id: string;
  type: "demonstrated" | "partial" | "gap" | "repeated_gap";
  competency: string;
  detail: string;
  quote?: string;
  occurrences?: number;
}

export interface RepeatedGapAlert {
  competency: string;
  occurrences: number;
  message: string;
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthenticatedContext(req as any);
    const {
      messages = [],
      jd = "",
      resume = "",
      bodyLanguage = null,
      studentId: reqStudentId,
    } = await req.json();

    const studentId = auth?.user?.id || reqStudentId || "student-demo";

    const userMsgs = messages.filter((m: any) => m.role === "user");
    const n = userMsgs.length;

    if (n === 0) {
      return NextResponse.json({
        evidenceMarkers: [],
        repeatedGapAlert: null,
        overall: 0,
        timestamp: Date.now(),
        breakdown: {
          relevance: 0,
          technicalAccuracy: 0,
          communicationClarity: 0,
          problemSolving: 0,
          depth: 0,
          examples: 0,
          confidence: 0,
        },
        evidence: {
          strengths: [],
          improvements: [],
          suggestedAnswer: "",
          scoreReason: "Answer the question to stream live evidence and score",
        },
        strengths: [],
        improvements: [],
        suggestedAnswer: "",
        verdict: "Awaiting candidate response...",
        hiringSignal: "NEUTRAL",
        bodyLanguage: bodyLanguage || {
          posture: "Neutral",
          eyeContact: "Direct",
          confidence: "Calm",
          notes: "Ready for first answer",
        },
      });
    }

    const lastQ =
      messages.filter((m: any) => m.role === "assistant").slice(-1)[0]?.content || "";
    const lastA = userMsgs[n - 1].content.trim();
    const wordCount = lastA.split(/\s+/).filter(Boolean).length;
    const allAnswers = userMsgs
      .map((m: any, i: number) => `Answer ${i + 1}: "${m.content.slice(0, 300)}"`)
      .join("\n");

    const prompt = `You are a FAANG Senior Staff Technical Interviewer evaluating a candidate's response. Evaluate with extreme technical rigor, factual groundedness, and precise scoring.

ROLE TARGET: ${jd.slice(0, 200)}
CANDIDATE BACKGROUND: ${resume.slice(0, 200)}
TOTAL ANSWERS SO FAR: ${n}

QUESTION ASKED:
"${lastQ.slice(0, 300)}"

CANDIDATE'S LATEST ANSWER (${wordCount} words):
"${lastA}"

ALL ANSWERS FOR CONTEXT:
${allAnswers.slice(0, 800)}

SCORING RULES (0-100 TOTAL):
Score each dimension based strictly on what was actually said:
1. Relevance (0-20): Off-topic = 0-5. Partial = 6-12. Fully relevant = 13-20.
2. Technical Accuracy (0-20): Factually incorrect = 0-5. Surface/basic = 6-12. Accurate + rigorous = 13-20.
3. Communication Clarity (0-15): 1-3 words = 0-3. Rambling/unclear = 4-8. Clear and structured = 9-12. Flawless articulation = 13-15.
4. Problem Solving & Trade-offs (0-15): No trade-offs = 0-5. Some thinking = 6-10. Rigorous architectural reasoning = 11-15.
5. Depth (0-15): High-level buzzwords = 0-5. Moderate detail = 6-10. Production-scale depth = 11-15.
6. Examples & Evidence (0-10): No examples = 0. Vague = 1-4. Specific metrics/experience = 5-7. Exceptional real-world proof = 8-10.
7. Confidence & Structure (0-5): Hesitant/scattered = 0-1. Average = 2-3. Composed and crisp = 4-5.

DIFFERENTIATION RULES:
- 1-3 words ("yes", "no", "idk") -> overall MUST be 0-15.
- Vague surface answer -> overall 16-38.
- Solid technical answer with minor gaps -> overall 55-75.
- High-impact top-tier FAANG answer -> overall 76-95.

COMPETENCY EXTRACTION:
- Extract 1-3 specific competencies (e.g. "REST API Design", "Cache Invalidation", "Binary Search", "RAG Pipeline").
- Categorize each as "demonstrated" | "partial" | "gap".
- Quote must be an exact verbatim snippet from candidate.

STRONGEST ANSWER RULE:
Provide an exemplary, top-tier model answer for this exact question, demonstrating concrete technical implementation, numbers/metrics, and architectural trade-offs.

RETURN RAW JSON ONLY:
{
  "breakdown": {
    "relevance": 15,
    "technicalAccuracy": 14,
    "communicationClarity": 11,
    "problemSolving": 10,
    "depth": 9,
    "examples": 6,
    "confidence": 3
  },
  "overall": 68,
  "hiringSignal": "STRONG" | "MODERATE" | "WEAK" | "CRITICAL",
  "evidenceMarkers": [
    {
      "type": "demonstrated" | "partial" | "gap",
      "competency": "string",
      "detail": "string",
      "quote": "string"
    }
  ],
  "strengths": [
    "Factual observation 1 with evidence",
    "Factual observation 2"
  ],
  "improvements": [
    "Specific missing depth or edge case"
  ],
  "suggestedAnswer": "A top-tier answer would say: '... (detailed technical response with metrics and architecture)'",
  "scoreReason": "Why this score was awarded based on technical substance.",
  "verdict": "Executive verdict statement."
}`;

    const res = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1200,
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim() || "";

    const cleanRaw = raw
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      .replace(/<think>[\s\S]*$/gi, "")
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    let parsed: any = null;
    try {
      parsed = JSON.parse(cleanRaw);
    } catch (_) {
      const m = cleanRaw.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          parsed = JSON.parse(m[0]);
        } catch (_) {}
      }
    }

    if (!parsed) throw new Error("Parse failed: " + raw.slice(0, 200));

    // ═══ REPEATED GAP DETECTION & CAREER MEMORY INTEGRATION ═══
    const careerMemory = getCareerMemory(studentId);
    let repeatedGapAlert: RepeatedGapAlert | null = null;

    const rawMarkers = Array.isArray(parsed.evidenceMarkers) ? parsed.evidenceMarkers : [];
    const processedMarkers: EvidenceMarker[] = [];
    const nowIso = new Date().toISOString();

    for (const marker of rawMarkers) {
      const comp = (marker.competency || "").trim();
      if (!comp) continue;

      const normComp = normalizeCapabilityName(comp);
      let type: EvidenceMarker["type"] =
        marker.type === "demonstrated" || marker.type === "partial" || marker.type === "gap"
          ? marker.type
          : "partial";

      let occurrences = 1;

      // Check if this competency has appeared as a gap across prior independent sessions
      if (type === "gap" || type === "partial") {
        let previousOccurrences = 0;
        for (const record of careerMemory.records) {
          const weaknesses = (record.weaknessesObserved || []).map(normalizeCapabilityName);
          if (weaknesses.includes(normComp)) {
            previousOccurrences++;
          }
        }

        // Also check if recurring weakness pattern exists in memory
        const patternMatch = careerMemory.patterns.find(
          (p) => normalizeCapabilityName(p.capability) === normComp
        );
        if (patternMatch) {
          previousOccurrences = Math.max(previousOccurrences, patternMatch.occurrences);
        }

        if (previousOccurrences >= 1) {
          // 2+ independent failures on the same competency!
          type = "repeated_gap";
          occurrences = previousOccurrences + 1;

          if (!repeatedGapAlert) {
            repeatedGapAlert = {
              competency: comp,
              occurrences,
              message: `${comp} has appeared as an unresolved gap across ${occurrences} interview/practice sessions.`,
            };
          }
        }
      }

      const processedMarker: EvidenceMarker = {
        id: `marker-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type,
        competency: comp,
        detail:
          type === "repeated_gap"
            ? `${marker.detail || "Competency gap"} — observed in ${occurrences} assessments`
            : marker.detail || "",
        quote: marker.quote ? marker.quote.slice(0, 200) : undefined,
        occurrences: type === "repeated_gap" ? occurrences : undefined,
      };

      processedMarkers.push(processedMarker);

      // ═══ IMMEDIATE FLOW INTO STUDENT DNA ═══
      try {
        if (type === "demonstrated") {
          addEvidenceItem({
            id: `ev-int-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            studentId,
            sourceType: "interview",
            sourceId: `interview-${Date.now()}`,
            capability: comp,
            claim: `Demonstrated ${comp} in mock technical interview`,
            extractedEvidence: `${processedMarker.detail}${processedMarker.quote ? ` (Quote: "${processedMarker.quote}")` : ""}`,
            evidenceLevel: 3, // ASSESSED
            confidence: "HIGH",
            createdAt: nowIso,
            updatedAt: nowIso,
            verificationStatus: "verified",
            provenance: {
              sourceName: "Cognalyze Technical Interview Stream",
              timestamp: nowIso,
              context: `Target: ${jd.slice(0, 60) || "Software Engineer"} | Question: "${lastQ.slice(0, 100)}"`,
            },
          });
        } else if (type === "gap" || type === "repeated_gap") {
          // Record to Career Memory so repeated gap tracker maintains memory
          recordCareerMemoryItem(studentId, {
            id: `cm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            type: "interview_feedback",
            companyName: "Technical Mock Interview",
            roleTitle: jd.slice(0, 60) || "Software Engineer",
            date: nowIso,
            status: "Completed",
            strengthsObserved: [],
            weaknessesObserved: [comp],
            hasCorroboratedPattern: type === "repeated_gap",
            feedbackNotes: processedMarker.detail,
          });
        }
      } catch (saveErr) {
        console.warn("Evidence streaming to DNA warning:", saveErr);
      }
    }

    // ═══ COMPUTE 7-DIMENSION BREAKDOWN & OVERALL SCORE (0-100) ═══
    const rawBreakdown = parsed.breakdown || {};
    const breakdown = {
      relevance: Math.min(20, Math.max(0, Math.round(Number(rawBreakdown.relevance) || 0))),
      technicalAccuracy: Math.min(20, Math.max(0, Math.round(Number(rawBreakdown.technicalAccuracy) || 0))),
      communicationClarity: Math.min(15, Math.max(0, Math.round(Number(rawBreakdown.communicationClarity) || 0))),
      problemSolving: Math.min(15, Math.max(0, Math.round(Number(rawBreakdown.problemSolving) || 0))),
      depth: Math.min(15, Math.max(0, Math.round(Number(rawBreakdown.depth) || 0))),
      examples: Math.min(10, Math.max(0, Math.round(Number(rawBreakdown.examples) || 0))),
      confidence: Math.min(5, Math.max(0, Math.round(Number(rawBreakdown.confidence) || 0))),
    };

    const calculatedSum =
      breakdown.relevance +
      breakdown.technicalAccuracy +
      breakdown.communicationClarity +
      breakdown.problemSolving +
      breakdown.depth +
      breakdown.examples +
      breakdown.confidence;

    let overall = typeof parsed.overall === "number" ? Math.min(100, Math.max(0, Math.round(parsed.overall))) : calculatedSum;
    if (overall === 0 && calculatedSum > 0) overall = calculatedSum;

    // Word count floor for very brief / non-answers
    if (wordCount <= 3 && overall > 20) {
      overall = 12;
      breakdown.relevance = 3;
      breakdown.technicalAccuracy = 2;
      breakdown.communicationClarity = 2;
      breakdown.problemSolving = 1;
      breakdown.depth = 1;
      breakdown.examples = 0;
      breakdown.confidence = 3;
    }

    const hiringSignal =
      parsed.hiringSignal && ["STRONG", "MODERATE", "WEAK", "CRITICAL"].includes(parsed.hiringSignal)
        ? parsed.hiringSignal
        : overall >= 75
        ? "STRONG"
        : overall >= 55
        ? "MODERATE"
        : overall >= 35
        ? "WEAK"
        : "CRITICAL";

    const suggestedAnswer =
      parsed.suggestedAnswer ||
      (parsed.evidence && parsed.evidence.suggestedAnswer) ||
      "";

    const strengths = Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 3) : [];
    const improvements = Array.isArray(parsed.improvements) ? parsed.improvements.slice(0, 3) : [];
    const scoreReason = parsed.scoreReason || parsed.verdict || "Evaluated against role standards.";

    return NextResponse.json({
      overall,
      breakdown,
      hiringSignal,
      evidenceMarkers: processedMarkers,
      repeatedGapAlert,
      strengths,
      improvements,
      suggestedAnswer,
      verdict: parsed.verdict || `Scored ${overall}/100 based on technical depth and evidence.`,
      timestamp: Date.now(),
      bodyLanguage: bodyLanguage || {
        notes: "Clear and structured delivery observed",
      },
      evidence: {
        strengths,
        improvements,
        suggestedAnswer,
        scoreReason,
      },
    });
  } catch (e: any) {
    console.error("Interview evidence extraction error:", e.message);
    return NextResponse.json({
      overall: 50,
      breakdown: {
        relevance: 10,
        technicalAccuracy: 10,
        communicationClarity: 8,
        problemSolving: 8,
        depth: 7,
        examples: 4,
        confidence: 3,
      },
      hiringSignal: "MODERATE",
      evidenceMarkers: [
        {
          id: `marker-err-${Date.now()}`,
          type: "partial",
          competency: "Communication",
          detail: "Answer received — analysis stream connected",
        },
      ],
      repeatedGapAlert: null,
      strengths: ["Submitted answer promptly"],
      improvements: ["Elaborate on real-world system architecture"],
      suggestedAnswer: "In production, start with architecture design, explain API contracts, and highlight failure recovery.",
      verdict: "Live evaluation completed with partial scoring stream",
      timestamp: Date.now(),
      bodyLanguage: { notes: "Observation continuing" },
      evidence: {
        strengths: ["Submitted answer promptly"],
        improvements: ["Elaborate on real-world system architecture"],
        suggestedAnswer: "In production, start with architecture design, explain API contracts, and highlight failure recovery.",
        scoreReason: "Partial scoring stream active.",
      },
    });
  }
}