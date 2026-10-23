import { NextRequest, NextResponse } from "next/server";
import { groqFetch } from "@/lib/groq";
import { extractJSON, stripThinkTags } from "@/lib/ai/placement-intelligence";
import { skillHubStore, SEED_CS_INTERVIEW_QUESTIONS } from "@/lib/skill-hub-store";
import { evaluateAdaptiveTurn } from "@/lib/skills/adaptive-engine";
import {
  getCanonicalSubject,
  getAllCanonicalSubjects,
  getSubjectQuestions,
  getAllCurriculumQuestions,
  CSQuestionItem
} from "@/lib/skills/cs-fundamentals-curriculum";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subjectParam = searchParams.get("subject") || searchParams.get("domain") || "dbms";
    const mode = searchParams.get("mode") || "all";
    const search = searchParams.get("search") || "";

    if (subjectParam === "all") {
      const allSubjects = getAllCanonicalSubjects();
      const allQuestions = getAllCurriculumQuestions();
      return NextResponse.json({
        success: true,
        subjects: allSubjects,
        count: allQuestions.length,
        questions: allQuestions
      });
    }

    const subject = getCanonicalSubject(subjectParam);
    if (!subject) {
      return NextResponse.json(
        { success: false, error: `Invalid subject: ${subjectParam}. Must be os, dbms, sql, cn, oop, or concurrency.` },
        { status: 400 }
      );
    }

    let questions = getSubjectQuestions(subject.id);
    if (search.trim()) {
      const q = search.toLowerCase();
      questions = questions.filter(
        item =>
          item.title.toLowerCase().includes(q) ||
          item.questionText.toLowerCase().includes(q) ||
          item.topic.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({
      success: true,
      subjectId: subject.id,
      subject,
      modules: subject.modules,
      count: questions.length,
      questions
    });
  } catch (err: any) {
    console.error("Error in GET /api/skills/cs-interview:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || "interview_turn";

    // ── ACTION 1: "ask_assistant" (Learn Mode Q&A) ──────────────────────────
    if (action === "ask_assistant") {
      const {
        subjectId = "dbms",
        topicId,
        question,
        history = []
      } = body;

      if (!question || question.trim().length < 2) {
        return NextResponse.json(
          { success: false, error: "Please enter a valid question." },
          { status: 400 }
        );
      }

      const subject = getCanonicalSubject(subjectId) || getCanonicalSubject("dbms")!;

      const systemPrompt = `You are Cognalyze Socratic CS Tutor, an expert computer science mentor specialized strictly in ${subject.name} (${subject.shortName}).
Core principles:
- Answer the student's question accurately, clearly, and intuitively.
- Strictly adhere to the context of ${subject.name}.
- Provide concrete examples, code or SQL snippets, and visual ASCII diagrams when helpful.
- Highlight common interview traps and real-world production trade-offs.
- Encourage deep conceptual understanding.`;

      const messages: any[] = [{ role: "system", content: systemPrompt }];
      for (const h of history.slice(-6)) {
        messages.push({
          role: h.role === "user" ? "user" : "assistant",
          content: h.content
        });
      }
      messages.push({ role: "user", content: question });

      let answerText = "";
      try {
        const res = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "openai/gpt-oss-120b",
            messages,
            temperature: 0.3,
            max_tokens: 1000
          })
        });

        const data = await res.json();
        const raw = data.choices?.[0]?.message?.content || "";
        answerText = stripThinkTags(raw).trim();
      } catch (aiErr) {
        console.warn("Groq assistant fallback triggered:", aiErr);
      }

      if (!answerText) {
        answerText = `### ${subject.name} Concept Analysis\n\nIn **${subject.name}**, your question regarding *"${question}"* touches on core system fundamentals.\n\nKey principles to keep in mind:\n1. **Invariants**: Understand the invariants guaranteed by the OS/DBMS architecture.\n2. **Trade-offs**: Every design decision trades CPU latency, memory footprint, or concurrency locks.\n3. **Production Edge Cases**: Consider concurrency interleavings, memory limits, and failure modes.\n\n*Feel free to ask a specific follow-up question or request a code/SQL walkthrough.*`;
      }

      return NextResponse.json({
        success: true,
        answer: answerText,
        subjectId: subject.id
      });
    }

    // ── ACTION 2: "coach_chat" (Coach Mode Socratic Tutor) ───────────────────
    if (action === "coach_chat") {
      const {
        subjectId = "dbms",
        userMessage,
        history = [],
        mode = "hint",
        activeQuestionId
      } = body;

      const subject = getCanonicalSubject(subjectId) || getCanonicalSubject("dbms")!;
      let activeQ: CSQuestionItem | undefined;
      if (activeQuestionId) {
        activeQ = getSubjectQuestions(subject.id).find(q => q.id === activeQuestionId);
      }

      const promptDirective = mode === "hint"
        ? "Give a guiding Socratic hint that nudges the student toward the solution without revealing the direct answer. Ask a thought-provoking follow-up question."
        : mode === "full_answer"
        ? "Provide the complete benchmark model answer with code/diagram and step-by-step breakdown."
        : "Evaluate the student's reasoning, point out strengths, clarify misconceptions, and ask the next probing question.";

      const systemPrompt = `You are Cognalyze Socratic Technical Coach for ${subject.name}.
Mode: ${mode.toUpperCase()}
Guideline: ${promptDirective}
${activeQ ? `Current Question: ${activeQ.questionText}\nExpected Points: ${activeQ.expectedPoints.join("; ")}` : ""}
Be concise, incisive, and supportive like a senior principal engineer.`;

      const messages: any[] = [{ role: "system", content: systemPrompt }];
      for (const h of history.slice(-6)) {
        messages.push({
          role: h.role === "user" ? "user" : "assistant",
          content: h.content
        });
      }
      messages.push({ role: "user", content: userMessage || "Could you help me break down this problem?" });

      let coachResponse = "";
      try {
        const res = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "openai/gpt-oss-120b",
            messages,
            temperature: 0.3,
            max_tokens: 800
          })
        });

        const data = await res.json();
        const raw = data.choices?.[0]?.message?.content || "";
        coachResponse = stripThinkTags(raw).trim();
      } catch (aiErr) {
        console.warn("Groq coach chat fallback:", aiErr);
      }

      if (!coachResponse) {
        if (mode === "full_answer" && activeQ) {
          coachResponse = `### Complete Benchmark Solution\n\n${activeQ.idealAnswer}\n\n**Key Takeaway**: ${activeQ.explanation}`;
        } else {
          coachResponse = `Consider how ${subject.name} handles this at the system level. What invariants must remain true before and after the operation? How does the storage/memory model affect this outcome?`;
        }
      }

      return NextResponse.json({
        success: true,
        coachResponse,
        subjectId: subject.id
      });
    }

    // ── ACTION 3: "evaluate_practice" (Practice Mode Evaluation) ─────────────
    if (action === "evaluate_practice") {
      const {
        questionId,
        subjectId = "dbms",
        candidateAnswer = "",
        selectedOptionIndex
      } = body;

      const subject = getCanonicalSubject(subjectId) || getCanonicalSubject("dbms")!;
      const q = getSubjectQuestions(subject.id).find(item => item.id === questionId) ||
        getAllCurriculumQuestions().find(item => item.id === questionId);

      if (!q) {
        return NextResponse.json(
          { success: false, error: "Question not found in canonical curriculum." },
          { status: 404 }
        );
      }

      // Check MCQ
      if (q.questionType === "mcq" && q.options) {
        const isCorrect = selectedOptionIndex === q.correctOptionIndex;
        return NextResponse.json({
          success: true,
          status: isCorrect ? "correct" : "incorrect",
          score: isCorrect ? 100 : 0,
          isCorrect,
          correctAnswer: q.options[q.correctOptionIndex || 0],
          stepByStepExplanation: q.explanation,
          commonPitfalls: q.commonPitfalls,
          followUpChallenge: q.followUpChallenge
        });
      }

      // Conceptual or Code Answer Evaluation
      const lowerAns = candidateAnswer.toLowerCase();
      let matchedPoints = 0;
      for (const pt of q.expectedPoints) {
        const keywords = pt.toLowerCase().split(/\s+/).filter(w => w.length > 4);
        const match = keywords.some(k => lowerAns.includes(k));
        if (match) matchedPoints++;
      }

      const pointRatio = q.expectedPoints.length > 0 ? matchedPoints / q.expectedPoints.length : 0.5;
      const baseScore = Math.min(95, Math.max(35, Math.round(pointRatio * 100)));
      const isCorrect = baseScore >= 70;
      const status = baseScore >= 80 ? "correct" : baseScore >= 50 ? "partially_correct" : "incorrect";

      return NextResponse.json({
        success: true,
        status,
        score: baseScore,
        isCorrect,
        correctAnswer: q.idealAnswer,
        stepByStepExplanation: q.explanation,
        commonPitfalls: q.commonPitfalls,
        expectedPoints: q.expectedPoints,
        followUpChallenge: q.followUpChallenge
      });
    }

    // ── DEFAULT ACTION: "interview_turn" (Subject-Grounded Interview Round) ──
    const {
      questionId,
      questionText,
      candidateAnswer,
      candidateId = "student-demo",
      subjectId = "dbms",
      trackSlug = "product_mid",
      turnIndex = 0
    } = body;

    if (!candidateAnswer || candidateAnswer.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Please provide a complete answer or code snippet." },
        { status: 400 }
      );
    }

    const subject = getCanonicalSubject(subjectId) || getCanonicalSubject("dbms")!;
    const subjectQuestions = getSubjectQuestions(subject.id);
    const matchedCurriculumQ = subjectQuestions.find(q => q.id === questionId) ||
      subjectQuestions[turnIndex % subjectQuestions.length] ||
      getAllCurriculumQuestions()[0];

    const effectiveQuestion = {
      id: questionId || matchedCurriculumQ.id,
      domain: subject.id,
      topic: matchedCurriculumQ.topic || `${subject.name} Invariants`,
      question: questionText || matchedCurriculumQ.questionText,
      internalIntent: `Evaluate candidate's technical precision in ${subject.name}.`,
      expectedSignals: matchedCurriculumQ.expectedPoints,
      failureSignals: matchedCurriculumQ.commonPitfalls,
      suggestedFollowUps: [
        {
          type: "CHALLENGE" as const,
          text: matchedCurriculumQ.followUpChallenge.question
        }
      ],
      depthLevel: "Apply" as const,
      isFreshUnseen: true
    };

    const deterministicEval = evaluateAdaptiveTurn(effectiveQuestion, candidateAnswer, trackSlug);
    let evalResult = deterministicEval;

    try {
      const prompt = `You are a Senior Technical Interviewer assessing a candidate in ${subject.name} (${subject.shortName}).
Question: "${effectiveQuestion.question}"
Candidate Answer: "${candidateAnswer}"
Expected Concepts: ${effectiveQuestion.expectedSignals.join("; ")}

Return STRICT JSON:
{
  "score": number between 40 and 96,
  "verdict": "Strong Hire" | "Hire" | "Borderline" | "Needs Diagnostic",
  "conceptualAccuracy": number between 30 and 100,
  "depthScore": number between 30 and 100,
  "feedback": "2-3 sentences of direct technical critique.",
  "detectedClaims": ["Claim 1"],
  "observedStrengths": ["Strength 1"],
  "observedGaps": ["Gap 1"],
  "nextFollowUp": {
    "type": "CHALLENGE" | "TRADE_OFF" | "EDGE_CASE" | "APPLICATION",
    "question": "${matchedCurriculumQ.followUpChallenge.question}",
    "reason": "${matchedCurriculumQ.followUpChallenge.whyAsked}"
  }
}`;

      const res = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 600
        })
      });

      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content || "{}";
      const clean = stripThinkTags(raw);
      const parsed = extractJSON(clean);
      if (parsed && parsed.score && parsed.nextFollowUp) {
        evalResult = parsed;
      }
    } catch (aiErr) {
      console.warn("Groq interview turn evaluation fallback used:", aiErr);
    }

    return NextResponse.json({
      success: true,
      questionId: effectiveQuestion.id,
      evaluation: evalResult,
      subjectId: subject.id
    });
  } catch (err: any) {
    console.error("Error in POST /api/skills/cs-interview:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
