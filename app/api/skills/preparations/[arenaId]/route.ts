import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { getPreparationArenaBySlug } from "@/lib/skills/preparations/canonical-arenas-registry";
import { preparationsStore } from "@/lib/skills/preparations/arena-store";
import { preparationsPersonalization } from "@/lib/skills/preparations/personalization-engine";
import { proposalEvaluator } from "@/lib/skills/preparations/proposal-evaluator";
import {
  InterviewModeType,
  RoadmapNodeMasteryState,
  StartingLevel,
} from "@/lib/skills/preparations/types";
import { PreparationOrchestrator } from "@/lib/skills/preparations/orchestrator";
import { autonomousAssessmentEngine } from "@/lib/skills/preparations/autonomous-assessment-engine";
import { buildStudentIntelligenceSnapshot } from "@/lib/skills/preparations/student-dna-bridge";
import { githubDiscoveryEngine } from "@/lib/skills/preparations/github-discovery-engine";
import { autonomousInterviewStudio } from "@/lib/skills/preparations/interview-studio-engine";
import { videoIntelligenceEngine } from "@/lib/skills/preparations/video-intelligence-engine";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ arenaId: string }> }
) {
  try {
    const { arenaId } = await params;
    const auth = await getAuthenticatedContext(req);
    const { searchParams } = new URL(req.url);
    const requestedCandidateId = searchParams.get("candidateId");

    // Strict user isolation enforcement
    if (auth?.user?.id && requestedCandidateId && requestedCandidateId !== auth.user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden: cannot inspect another student's preparation arena." },
        { status: 403 }
      );
    }

    const candidateId = auth?.user?.id || requestedCandidateId || "cand_demo_student";
    const arena = getPreparationArenaBySlug(arenaId);
    if (!arena) {
      return NextResponse.json(
        { success: false, error: `Preparation Arena '${arenaId}' not found.` },
        { status: 404 }
      );
    }

    const orchestrator = PreparationOrchestrator.getInstance();
    const orchestratedContext = await orchestrator.orchestrateArenaAsync(candidateId, arena.id, {
      isAuthenticated: Boolean(auth?.user?.id),
    });

    if (!orchestratedContext) {
      return NextResponse.json(
        { success: false, error: `Failed to orchestrate Preparation Arena '${arenaId}'.` },
        { status: 500 }
      );
    }

    const matchAnalysis = preparationsPersonalization.evaluateSkillMatch(arena, {
      candidateId,
      verifiedSkills: orchestratedContext.studentDNA.verifiedSkills.map(s => s.skill),
      projects: orchestratedContext.studentDNA.projects.map(p => p.title),
      targetRoles: [],
    });

    return NextResponse.json({
      success: true,
      arena: orchestratedContext.arena,
      studentState: orchestratedContext.studentState,
      matchAnalysis,
      activeLevel: orchestratedContext.activeLevel,
      personalizedRoadmap: orchestratedContext.personalizedRoadmap,
      orchestratedContext,
      isAuthenticated: Boolean(auth?.user?.id),
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[api/skills/preparations/[arenaId]] GET Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ arenaId: string }> }
) {
  try {
    const { arenaId } = await params;
    const auth = await getAuthenticatedContext(req);
    const body = await req.json();

    // Strict user isolation enforcement on mutations
    if (auth?.user?.id && body.candidateId && body.candidateId !== auth.user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden: cannot mutate another student's preparation state." },
        { status: 403 }
      );
    }

    const candidateId = auth?.user?.id || body.candidateId || "cand_demo_student";
    const arena = getPreparationArenaBySlug(arenaId);

    if (!arena) {
      return NextResponse.json(
        { success: false, error: `Preparation Arena '${arenaId}' not found.` },
        { status: 404 }
      );
    }

    const { action } = body;

    // 1. Set Starting Level
    if (action === "set_level") {
      const { level } = body;
      if (!level || !["absolute_beginner", "beginner", "intermediate", "advanced"].includes(level)) {
        return NextResponse.json({ success: false, error: "Invalid level specified." }, { status: 400 });
      }
      const updatedState = preparationsStore.setStartingLevel(candidateId, arena.id, level as StartingLevel);
      return NextResponse.json({ success: true, studentState: updatedState });
    }

    // 2. Complete a Task
    if (action === "complete_task") {
      const { taskId, evidenceLabel } = body;
      if (!taskId) {
        return NextResponse.json({ success: false, error: "Missing taskId." }, { status: 400 });
      }
      const updatedState = preparationsStore.completeTask(candidateId, arena.id, taskId, evidenceLabel);
      return NextResponse.json({ success: true, studentState: updatedState });
    }

    // 3. Update Dependency Roadmap Node State (never allows marking verified solely for opening a lesson)
    if (action === "update_roadmap_node") {
      const { nodeId, masteryState } = body;
      const allowedStates: RoadmapNodeMasteryState[] = [
        "not_started",
        "learning",
        "practiced",
        "demonstrated",
      ];
      if (!nodeId || !allowedStates.includes(masteryState)) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Invalid nodeId or masteryState. 'independently_verified' is only granted automatically by verified assessments, tests, or GitHub PR checks.",
          },
          { status: 400 }
        );
      }
      const ext = preparationsStore.updateRoadmapNodeState(candidateId, arena.id, nodeId, masteryState);
      return NextResponse.json({ success: true, roadmapNodeStates: ext.roadmapNodeStates });
    }

    // 4. Save Contribution Workspace & Optionally Verify GitHub PR via live API
    if (action === "save_contribution_workspace" || action === "verify_github_pr") {
      const { issueId, repoFullName, issueNumber, issueTitle, issueUrl, completedStepIds, notes, prUrl } = body;
      if (!issueId || !repoFullName) {
        return NextResponse.json({ success: false, error: "Missing issueId or repoFullName." }, { status: 400 });
      }

      let prVerificationStatus: "not_submitted" | "verified_open" | "verified_merged" | "verified_closed" | "unverified_check_failed" = "not_submitted";
      let prLastCheckedAt: string | undefined;
      let prVerificationDetail: any = null;

      if (prUrl && typeof prUrl === "string" && prUrl.trim().length > 0) {
        const check = await githubDiscoveryEngine.verifyPullRequestUrl(prUrl.trim(), candidateId);
        prVerificationStatus = check.status;
        prLastCheckedAt = check.checkedAt;
        prVerificationDetail = check;
      }

      const workspace = {
        issueId,
        repoFullName,
        issueNumber: Number(issueNumber) || 0,
        issueTitle: issueTitle || "Open Source Issue",
        issueUrl: issueUrl || `https://github.com/${repoFullName}/issues/${issueNumber || ""}`,
        completedStepIds: Array.isArray(completedStepIds) ? completedStepIds : [],
        notes: typeof notes === "string" ? notes : "",
        prUrl: prUrl ? String(prUrl).trim() : undefined,
        prVerificationStatus,
        prLastCheckedAt,
        updatedAt: new Date().toISOString(),
      };

      const ext = preparationsStore.upsertContributionWorkspace(candidateId, arena.id, workspace);
      return NextResponse.json({
        success: true,
        workspace,
        prVerificationDetail,
        contributionWorkspaces: Object.values(ext.contributionWorkspaces),
      });
    }

    // 5. Refresh Real GitHub Discovery Issues
    if (action === "refresh_github_discovery") {
      const dna = await buildStudentIntelligenceSnapshot(candidateId, arena, {
        isAuthenticated: Boolean(auth?.user?.id),
      });
      const report = await githubDiscoveryEngine.discoverOpportunitiesForStudent(dna, {
        allowNetwork: true,
        limit: 80,
      });
      return NextResponse.json({ success: true, githubDiscovery: report });
    }

    // 6. Activate Ranked Project Blueprint
    if (action === "activate_project") {
      const { projectId } = body;
      if (!projectId) {
        return NextResponse.json({ success: false, error: "Missing projectId." }, { status: 400 });
      }
      const ext = preparationsStore.markProjectActive(candidateId, arena.id, projectId);
      return NextResponse.json({ success: true, activeProjectIds: ext.activeProjectIds });
    }

    // 7. Inspect Video Captions / Availability via Video Intelligence Engine
    if (action === "inspect_video_resource") {
      const { url } = body;
      if (!url || typeof url !== "string") {
        return NextResponse.json({ success: false, error: "Missing video url." }, { status: 400 });
      }
      const inspection = await videoIntelligenceEngine.inspectVideoResource(url, { allowNetwork: true });
      return NextResponse.json({ success: true, inspection });
    }

    // 8. Start Personalized Autonomous Mock Assessment
    if (action === "start_autonomous_assessment") {
      const studentState = preparationsStore.getOrCreateState(candidateId, arena.id);
      const dna = await buildStudentIntelligenceSnapshot(candidateId, arena, {
        isAuthenticated: Boolean(auth?.user?.id),
      });
      const session = await autonomousAssessmentEngine.generatePersonalizedAssessmentForDNA(
        arena,
        dna,
        studentState.selectedLevel || "beginner"
      );
      return NextResponse.json({ success: true, session });
    }

    // 9. Evaluate & Persist Autonomous Mock Assessment Responses
    if (action === "evaluate_autonomous_assessment") {
      const { session, responses } = body;
      if (!session || !responses) {
        return NextResponse.json(
          { success: false, error: "Missing session or responses payload." },
          { status: 400 }
        );
      }
      const { evaluation, persistedAttempt } = await autonomousAssessmentEngine.evaluateAndPersistAssessment({
        candidateId,
        arena,
        session,
        submittedAnswers: responses,
      });
      const updatedState = preparationsStore.getOrCreateState(candidateId, arena.id);
      const ext = preparationsStore.getOrCreateExtendedData(candidateId, arena.id);

      return NextResponse.json({
        success: true,
        evaluation,
        persistedAttempt,
        studentState: updatedState,
        assessmentHistory: ext.assessmentHistory,
      });
    }

    // 10. Start Conversational Technical Interview Session
    if (action === "start_interview_session") {
      const mode: InterviewModeType = body.mode || "technical_interview";
      const dna = await buildStudentIntelligenceSnapshot(candidateId, arena, {
        isAuthenticated: Boolean(auth?.user?.id),
      });
      const session = await autonomousInterviewStudio.startInterviewSession({
        candidateId,
        arena,
        dna,
        mode,
      });
      const ext = preparationsStore.getOrCreateExtendedData(candidateId, arena.id);
      return NextResponse.json({ success: true, session, interviewHistory: ext.interviewHistory });
    }

    // 11. Submit Turn in Conversational Technical Interview
    if (action === "submit_interview_turn") {
      const { sessionId, studentResponse } = body;
      if (!sessionId || !studentResponse || typeof studentResponse !== "string") {
        return NextResponse.json({ success: false, error: "Missing sessionId or studentResponse." }, { status: 400 });
      }
      const dna = await buildStudentIntelligenceSnapshot(candidateId, arena, {
        isAuthenticated: Boolean(auth?.user?.id),
      });
      const session = await autonomousInterviewStudio.submitInterviewTurn({
        candidateId,
        arena,
        dna,
        sessionId,
        studentResponse,
      });
      const ext = preparationsStore.getOrCreateExtendedData(candidateId, arena.id);
      return NextResponse.json({ success: true, session, interviewHistory: ext.interviewHistory });
    }

    // 12. Evaluate Proposal or Hackathon Deck Draft
    if (action === "review_proposal") {
      const { proposalText } = body;
      if (!proposalText || typeof proposalText !== "string" || proposalText.trim().length < 20) {
        return NextResponse.json(
          { success: false, error: "Proposal draft must contain at least 20 characters." },
          { status: 400 }
        );
      }
      const evaluation = proposalEvaluator.evaluateProposal(arena, proposalText);
      const updatedState = preparationsStore.saveProposalDraft(candidateId, arena.id, proposalText, evaluation);

      return NextResponse.json({
        success: true,
        evaluation,
        studentState: updatedState,
      });
    }

    // Backward compatibility: direct record_assessment
    if (action === "record_assessment") {
      const { assessmentId, score, percentage, passed } = body;
      if (!assessmentId) {
        return NextResponse.json({ success: false, error: "Missing assessmentId." }, { status: 400 });
      }
      const updatedState = preparationsStore.recordAssessmentScore(
        candidateId,
        arena.id,
        assessmentId,
        score || 0,
        percentage || 0,
        !!passed
      );
      return NextResponse.json({ success: true, studentState: updatedState });
    }

    return NextResponse.json({ success: false, error: `Unknown action '${action}'` }, { status: 400 });
  } catch (err: any) {
    console.error("[api/skills/preparations/[arenaId]] POST Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
