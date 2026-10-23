import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import {
  createCustomInterviewSession,
  getCustomInterviewSession,
  submitCustomQuestionAnswer,
  submitCustomQuestionDefense,
  advanceToNextCustomQuestion,
  finalizeCustomInterview,
} from "@/lib/skills/custom-interview-engine";
import { recordCompetencyEvidence } from "@/lib/skills/placement-profile-engine";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    if (!auth || !auth.user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "create") {
      const { selectedSubjects, difficulty, questionCount, durationMinutes, format, preferredLanguage, targetRole, targetCompany } = body;
      const session = createCustomInterviewSession({
        userId: auth.user.id,
        selectedSubjects: selectedSubjects || ["dsa", "sql", "os"],
        difficulty: difficulty || "Medium",
        questionCount: questionCount || 3,
        durationMinutes: durationMinutes || 45,
        format: format || "mixed",
        preferredLanguage: preferredLanguage || "cpp",
        targetRole: targetRole || "Software Development Engineer (SDE-1)",
        targetCompany: targetCompany || "Product Companies"
      });

      return NextResponse.json({ success: true, session });
    }

    if (action === "get") {
      const { sessionId } = body;
      const session = getCustomInterviewSession(sessionId, auth.user.id);
      if (!session) return NextResponse.json({ error: "Interview session not found." }, { status: 404 });
      return NextResponse.json({ success: true, session });
    }

    if (action === "submit_answer") {
      const { sessionId, questionIndex, answer, language, testResults } = body;
      const session = submitCustomQuestionAnswer(sessionId, auth.user.id, questionIndex, answer, language, testResults);
      return NextResponse.json({ success: true, session });
    }

    if (action === "submit_defense") {
      const { sessionId, questionIndex, defenseText } = body;
      const session = submitCustomQuestionDefense(sessionId, auth.user.id, questionIndex, defenseText);
      return NextResponse.json({ success: true, session });
    }

    if (action === "next") {
      const { sessionId } = body;
      const session = advanceToNextCustomQuestion(sessionId, auth.user.id);
      
      // If completed, record competency evidence
      if (session.state === "COMPLETED" && session.finalEvaluation) {
        for (const q of session.questions) {
          if (q.candidateSubmission && q.candidateSubmission.score >= 70) {
            recordCompetencyEvidence(
              auth.user.id,
              `${q.subject}_custom`,
              "question_assessed",
              q.candidateSubmission.score,
              `Scored ${q.candidateSubmission.score}% on ${q.title} during Custom Interview`
            );
          }
        }
      }

      return NextResponse.json({ success: true, session });
    }

    if (action === "finalize") {
      const { sessionId } = body;
      const session = finalizeCustomInterview(sessionId, auth.user.id);
      return NextResponse.json({ success: true, session });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    console.error("POST /api/skills/custom-interview error:", err);
    return NextResponse.json({ error: err.message || "Interview action failed." }, { status: 500 });
  }
}
