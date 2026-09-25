import { NextResponse } from "next/server";
import { groqFetch } from "@/lib/groq";
import {
  getCareerMemory,
  recordCareerMemoryItem,
  addEvidenceItem,
  normalizeCapabilityName,
} from "@/lib/intelligence/student-intelligence";

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
    const {
      messages = [],
      jd = "",
      resume = "",
      bodyLanguage = null,
      studentId = "student-demo",
    } = await req.json();

    const userMsgs = messages.filter((m: any) => m.role === "user");
    const n = userMsgs.length;

    if (n === 0) {
      return NextResponse.json({
        evidenceMarkers: [],
        repeatedGapAlert: null,
        strengths: [],
        improvements: [],
        suggestedAnswer: "",
        verdict: "Awaiting candidate response...",
        timestamp: Date.now(),
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

    const prompt = `You are a Principal Tech Interview Evaluator operating an EVIDENCE-FIRST assessment engine.
You NEVER output arbitrary numeric scores (e.g. no "74/100", no numeric percentages). Every claim must be tied to observable proof from the candidate's actual words.

ROLE TARGET: ${jd.slice(0, 200)}
CANDIDATE BACKGROUND: ${resume.slice(0, 200)}
TOTAL ANSWERS SO FAR: ${n}

QUESTION ASKED:
"${lastQ.slice(0, 300)}"

CANDIDATE'S LATEST ANSWER (${wordCount} words):
"${lastA}"

ALL ANSWERS FOR CONTEXT:
${allAnswers.slice(0, 800)}

EVIDENCE EXTRACTION RULES:
1. Extract 1-3 specific competencies the candidate attempted, demonstrated, or struggled with in this answer.
   Examples of competency names: "Sliding Window", "Binary Search", "Graph Cycle Detection", "Dynamic Programming", "Cache Invalidation", "State Management", "SQL Indexing", "REST API Design", "Asynchronous Error Handling".
2. For each competency, categorize into:
   - "demonstrated": The candidate correctly explained, derived, or coded the solution and substantiated tradeoffs/runtime.
   - "partial": The candidate got the high-level concept right, but left the explanation or edge cases incomplete.
   - "gap": The candidate gave an incorrect approach, was unable to complete, or missed a fundamental principle.
3. Detail must be factual and concise (e.g., "defended O(N) runtime", "solution correct, explanation incomplete", "unable to detect cycle in directed graph").
4. Quote must be a short verbatim quote from the candidate's answer as provenance.
5. Identify factual strengths and specific areas to improve.
6. Provide what a stronger answer would cover.
7. NEVER invent facts or output numeric points.

RETURN RAW JSON ONLY:
{
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
  "suggestedAnswer": "A strong technical answer would cover...",
  "verdict": "One short qualitative verdict statement (e.g., Demonstrated clear algorithmic reasoning with minor edge-case omission)"
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

    return NextResponse.json({
      evidenceMarkers: processedMarkers,
      repeatedGapAlert,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 3) : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements.slice(0, 3) : [],
      suggestedAnswer: parsed.suggestedAnswer || "",
      verdict: parsed.verdict || "Evaluation updated with demonstrated evidence",
      timestamp: Date.now(),
      bodyLanguage: bodyLanguage || {
        notes: "Clear and structured pacing observed",
      },
      // Deprecated fields kept for backward compatibility:
      overall: 0,
      breakdown: {},
      evidence: {
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 3) : [],
        improvements: Array.isArray(parsed.improvements) ? parsed.improvements.slice(0, 3) : [],
        suggestedAnswer: parsed.suggestedAnswer || "",
        scoreReason: parsed.verdict || "",
      },
      hiringSignal: "EVIDENCE_TRACKED",
    });
  } catch (e: any) {
    console.error("Interview evidence extraction error:", e.message);
    return NextResponse.json({
      evidenceMarkers: [
        {
          id: `marker-err-${Date.now()}`,
          type: "partial",
          competency: "Communication",
          detail: "Answer received — stream re-connecting",
        },
      ],
      repeatedGapAlert: null,
      strengths: [],
      improvements: [],
      suggestedAnswer: "",
      verdict: "Live evidence analysis streaming",
      timestamp: Date.now(),
      bodyLanguage: { notes: "Observation continuing" },
      overall: 0,
      breakdown: {},
      evidence: { strengths: [], improvements: [], suggestedAnswer: "", scoreReason: "" },
      hiringSignal: "NEUTRAL",
    });
  }
}