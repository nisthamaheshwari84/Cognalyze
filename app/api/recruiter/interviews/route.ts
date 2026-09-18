import { NextResponse } from "next/server";
import { getCandidateById, getRoleById, updateCandidateStage } from "@/lib/recruiter-store";
import { buildEvidenceGraph } from "@/lib/ai/evidence-graph";
import { generateMemoryAwareInterviewQuestions, generateInterviewQuestionsWithAI, recordInterviewFeedback, CandidateInterviewHistory } from "@/lib/ai/interview-memory";

export async function POST(req: Request) {
  try {
    const { action, candidateId, roleId, feedback } = await req.json();

    if (!candidateId || !roleId) {
      return NextResponse.json({ success: false, error: "candidateId and roleId are required" }, { status: 400 });
    }

    const [candidate, role] = await Promise.all([
      getCandidateById(candidateId),
      getRoleById(roleId)
    ]);

    if (!candidate || !role) {
      return NextResponse.json({ success: false, error: "Candidate or Role not found" }, { status: 404 });
    }

    const currentHistory: CandidateInterviewHistory = candidate.interviewHistory || {
      candidateId: candidate.id,
      roleId: role.id,
      roundsCompleted: 0,
      questionHistory: []
    };

    if (action === "generate_questions") {
      const { candidateDNA } = buildEvidenceGraph(
        {
          id: candidate.id,
          name: candidate.name,
          resumeText: candidate.resumeText,
          githubData: candidate.githubData,
          studentProjects: candidate.studentProjects,
          hackathons: candidate.hackathonRecords,
          workSampleResults: candidate.workSampleResults
        },
        role
      );

      const questions = await generateInterviewQuestionsWithAI(role, candidateDNA, currentHistory, candidate.resumeText);

      return NextResponse.json({
        success: true,
        candidateName: candidate.name,
        roundsCompleted: currentHistory.roundsCompleted,
        totalQuestionsLogged: currentHistory.questionHistory.length,
        suggestedQuestions: questions
      });
    }

    if (action === "record_feedback") {
      if (!feedback) {
        return NextResponse.json({ success: false, error: "Feedback object is required" }, { status: 400 });
      }

      const updatedHistory = recordInterviewFeedback(currentHistory, feedback);

      await updateCandidateStage(candidateId, "Interviewing", {
        interviewHistory: updatedHistory
      });

      return NextResponse.json({
        success: true,
        updatedHistory
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action. Expected 'generate_questions' or 'record_feedback'." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
