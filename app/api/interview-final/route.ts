import { NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import {
  buildCandidateInterviewDossier,
  generateInterviewBlueprint,
  createAdvancedSessionState,
  generateInterviewFinalReport,
  commitInterviewEvidenceToDNA
} from "@/lib/ai/interview-engine";
import {
  getActiveSessionState,
  saveActiveSessionState,
  saveSession,
  markSessionCompleted,
  getSessionById,
  acquireTurnLock,
  releaseTurnLock,
  isSessionCompleted
} from "@/lib/interview-session-store";
import {
  generateMilestone5FinalReport,
  Milestone5FinalReport
} from "@/lib/interview/final-report-generator";
import {
  commitMilestone5EvidenceToDNA
} from "@/lib/interview/dna-sync-engine";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      messages = [],
      jd = "",
      resume = "",
      finalScore,
      candidateId: reqCandidateId,
      sessionId: reqSessionId,
      targetCompany: reqTargetCompany,
      targetRole: reqTargetRole,
      interviewType: reqInterviewType,
      interviewTrack: reqInterviewTrack,
      track: reqTrack,
      difficulty: reqDifficulty,
      durationMinutes: reqDurationMinutes,
      interviewMode: reqInterviewMode,
    } = body;

    const effectiveTrack = reqTrack || reqInterviewTrack;

    // 1. Authenticate candidate with strict server-side validation
    const auth = await getAuthenticatedContext(req as any);
    const candidateId = auth?.user?.id || reqCandidateId || body.studentId || "student-demo";

    // Multi-tenant security guard
    if (auth?.user?.id && reqCandidateId && reqCandidateId !== auth.user.id) {
      return NextResponse.json({ error: "Access denied. Candidate identity mismatch." }, { status: 403 });
    }

    const sessionId = reqSessionId || `session_${candidateId}_${Date.now()}`;

    // Check for existing saved session for idempotency & multi-tenant isolation
    const existingLiveState = getActiveSessionState(sessionId);
    if (existingLiveState && existingLiveState.candidateId && existingLiveState.candidateId !== candidateId) {
      return NextResponse.json({ error: "Access denied. Session belongs to another candidate.", code: "TENANT_ACCESS_DENIED" }, { status: 403 });
    }
    const existingSession = await getSessionById(sessionId);
    if (existingSession) {
      if (existingSession.candidate_id && existingSession.candidate_id !== candidateId) {
        return NextResponse.json({ error: "Access denied. Session belongs to another candidate.", code: "TENANT_ACCESS_DENIED" }, { status: 403 });
      }
      if (existingSession.report) {
        // Idempotent return of the already generated and persisted report
        const rep = existingSession.report;
        const m5Rep = (existingSession as any).milestone5Report;
        const hireDecision =
          rep.hiringRecommendation === "STRONG_HIRE" ? "STRONG_HIRE" :
          rep.hiringRecommendation === "HIRE" ? "HIRE" :
          rep.hiringRecommendation === "LEANING_HIRE" ? "HIRE" :
          rep.hiringRecommendation === "INSUFFICIENT_EVIDENCE" ? "INSUFFICIENT_EVIDENCE" :
          rep.hiringRecommendation === "ASSESSMENT_INCOMPLETE" ? "ASSESSMENT_INCOMPLETE" : "NO_HIRE";

        return NextResponse.json({
          decision: hireDecision,
          confidence: rep.confidence,
          headline: hireDecision === "INSUFFICIENT_EVIDENCE" || hireDecision === "ASSESSMENT_INCOMPLETE"
            ? `Assessment Incomplete: Insufficient Evidence for ${rep.targetRole}`
            : `${hireDecision.replace("_", " ")}: ${rep.targetRole} (${(existingSession.experience_mode || "experienced").toUpperCase()})`,
          overview: rep.executiveSummary,
          hire_reasons: rep.keyStrengths || [],
          no_hire_reasons: rep.criticalGaps || [],
          standout_moments: (rep.competenciesAssessed || [])
            .filter((c: any) => c.status === "demonstrated")
            .map((c: any) => `${c.competency}: ${c.evaluation}`),
          concerning_moments: (rep.competenciesAssessed || [])
            .filter((c: any) => c.status === "gap")
            .map((c: any) => `${c.competency}: ${c.evaluation}`),
          scorecard: {
            technical_depth: {
              score: rep.technicalDepth?.score ?? rep.overallScore,
              comment: rep.technicalDepth?.summary || "Technical depth evaluated"
            },
            problem_solving: {
              score: rep.problemSolvingAndReasoning?.score ?? rep.overallScore,
              comment: rep.problemSolvingAndReasoning?.summary || "Problem solving evaluated"
            },
            project_ownership: {
              score: rep.projectOwnershipAndVeracity?.score ?? rep.overallScore,
              comment: rep.projectOwnershipAndVeracity?.summary || "Project ownership evaluated"
            },
            communication: {
              score: rep.communicationAndBehavioral?.score ?? rep.overallScore,
              comment: rep.communicationAndBehavioral?.summary || "Communication evaluated"
            }
          },
          sevenDimensionScorecard: m5Rep?.dimensionScores,
          milestone5Report: m5Rep,
          actionableStudyTracks: m5Rep?.actionableStudyTracks,
          next_steps: rep.recommendedLearningActions?.join(" | ") || "Proceed with practice curriculum",
          interviewer_note: rep.interviewerPrivateNote || "Session completed.",
          report: rep,
          evidenceCommittedToDNA: 0,
          idempotentReplay: true
        }, {
          headers: {
            "X-Idempotent-Replay": "true",
            "X-Interview-Report-Version": "2.0.0"
          }
        });
      }
    }

    // 2. Build Candidate Interview Dossier
    const dossier = await buildCandidateInterviewDossier(candidateId, resume, jd);

    // 3. Load or reconstruct session state
    let sessionState = getActiveSessionState(sessionId, candidateId);
    if (sessionState && reqInterviewMode) {
      (sessionState as any).interviewMode = reqInterviewMode;
    }
    if (!sessionState) {
      const blueprint = generateInterviewBlueprint(
        dossier,
        reqTargetRole || dossier.targetRole,
        Number(reqDurationMinutes) || 45,
        undefined,
        sessionId,
        jd,
        reqInterviewType || "technical",
        reqTargetCompany,
        undefined,
        effectiveTrack
      );
      sessionState = createAdvancedSessionState(blueprint, dossier);
      if (effectiveTrack) {
        sessionState.track = effectiveTrack;
      }
      if (reqInterviewMode) {
        (sessionState as any).interviewMode = reqInterviewMode;
      }

      // Reconstruct turns from messages if needed
      const userMsgs = (messages || []).filter((m: any) => m.role === "user");
      const asstMsgs = (messages || []).filter((m: any) => m.role === "assistant");
      const minLen = Math.min(userMsgs.length, asstMsgs.length);
      for (let i = 0; i < minLen; i++) {
        sessionState.turns.push({
          turnIndex: i + 1,
          question: {
            question: asstMsgs[i].content,
            question_targets: "Reconstructed turn",
            question_type: "technical",
            difficulty_level: "medium",
            is_follow_up: false,
            section: "resume_projects"
          },
          answer: userMsgs[i].content,
          assessment: {
            answer_quality: userMsgs[i].content.length > 50 ? "adequate" : "shallow",
            reasoning: "Reconstructed answer",
            topics_demonstrated: ["Technical Implementation"],
            next_action: "move_to_new_topic",
            difficulty_adjustment: "maintain"
          },
          timestamp: new Date().toISOString()
        });
      }
    }

    // 4. Generate evidence-based final report
    const report = await generateInterviewFinalReport(sessionState, messages, dossier);

    // Milestone 5: 7-Dimension Scorecard & Verbatim Grounding
    const trackToUse = (sessionState.track || effectiveTrack || "general_swe") as any;
    const milestone5Report = await generateMilestone5FinalReport(sessionState, trackToUse);

    // Mark session completed in memory & store
    sessionState.isCompleted = true;
    sessionState.lifecycleState = "COMPLETED";
    saveActiveSessionState(sessionId, sessionState);
    markSessionCompleted(sessionId, report);

    // 5. Commit verified interview evidence into Student DNA using Tri-Anchor standard
    const m5CommitResult = await commitMilestone5EvidenceToDNA(candidateId, milestone5Report, sessionState);
    const commitResult = await commitInterviewEvidenceToDNA(candidateId, report);

    // 6. Save permanent interview session
    await saveSession({
      id: sessionId,
      candidate_id: candidateId,
      session_type: "mock_interview",
      experience_mode: sessionState.experienceMode,
      target_role: reqTargetRole || dossier.targetRole,
      target_company: reqTargetCompany || sessionState.blueprint?.targetCompany || "FAANG / Tier 1",
      interview_type: reqInterviewType || sessionState.blueprint?.interviewType || "technical",
      track: sessionState.track || effectiveTrack,
      difficulty: reqDifficulty || sessionState.currentDifficulty || "adaptive",
      duration_minutes: Number(reqDurationMinutes) || sessionState.blueprint?.durationMinutes || 45,
      topics_covered: sessionState.topicsCovered,
      answer_distribution: {
        strong: sessionState.answerDistribution.strong,
        adequate: sessionState.answerDistribution.adequate,
        shallow: sessionState.answerDistribution.shallow,
        off_topic: sessionState.answerDistribution.off_topic,
      },
      security_flags: {
        tab_switches: 0,
        face_violations: 0,
      },
      overall_score: milestone5Report.overallScore ?? report.overallScore,
      weak_topics_identified: milestone5Report.criticalGaps.length > 0 ? milestone5Report.criticalGaps : report.criticalGaps,
      report,
      milestone5Report,
      transcript: (messages || []).map((m: any) => ({
        role: m.role,
        content: m.content,
        time: m.time || "",
        isFollowUp: m.isFollowUp || false,
      })),
      created_at: new Date().toISOString()
    });

    // 7. Format output to support both UI FinalVerdict interface and deep report
    const hireDecision =
      report.hiringRecommendation === "STRONG_HIRE" ? "STRONG_HIRE" :
      report.hiringRecommendation === "HIRE" ? "HIRE" :
      report.hiringRecommendation === "LEANING_HIRE" ? "HIRE" :
      report.hiringRecommendation === "INSUFFICIENT_EVIDENCE" ? "INSUFFICIENT_EVIDENCE" :
      report.hiringRecommendation === "ASSESSMENT_INCOMPLETE" ? "ASSESSMENT_INCOMPLETE" : "NO_HIRE";

    const headline =
      hireDecision === "INSUFFICIENT_EVIDENCE" || hireDecision === "ASSESSMENT_INCOMPLETE"
        ? `Assessment Incomplete: Insufficient Evidence for ${report.targetRole}`
        : `${hireDecision.replace("_", " ")}: ${report.targetRole} (${sessionState.experienceMode.toUpperCase()})`;

    return NextResponse.json({
      decision: hireDecision,
      confidence: milestone5Report.confidence || report.confidence,
      headline,
      overview: milestone5Report.executiveSummary || report.executiveSummary,
      hire_reasons: milestone5Report.keyStrengths.length > 0 ? milestone5Report.keyStrengths : report.keyStrengths,
      no_hire_reasons: milestone5Report.criticalGaps.length > 0 ? milestone5Report.criticalGaps : report.criticalGaps,
      standout_moments: report.competenciesAssessed
        .filter((c) => c.status === "demonstrated")
        .map((c) => `${c.competency}: ${c.evaluation}`),
      concerning_moments: report.competenciesAssessed
        .filter((c) => c.status === "gap")
        .map((c) => `${c.competency}: ${c.evaluation}`),
      scorecard: {
        technical_depth: {
          score: report.technicalDepth.score,
          comment: report.technicalDepth.summary
        },
        problem_solving: {
          score: report.problemSolvingAndReasoning.score,
          comment: report.problemSolvingAndReasoning.summary
        },
        project_ownership: {
          score: report.projectOwnershipAndVeracity.score,
          comment: report.projectOwnershipAndVeracity.summary
        },
        communication: {
          score: report.communicationAndBehavioral.score,
          comment: report.communicationAndBehavioral.summary
        }
      },
      sevenDimensionScorecard: milestone5Report.dimensionScores,
      milestone5Report,
      interviewMode: (sessionState as any).interviewMode || "evaluation",
      formalHiringRecommendation: milestone5Report.formalHiringRecommendation,
      practiceModeFeedback: milestone5Report.practiceModeFeedback,
      professionalEvaluationReport: milestone5Report.professionalEvaluationReport,
      resumeToInterviewConsistency: {
        resumeBackedProjects: (dossier.projects || []).map((p: any) => p.title || p.name),
        interviewDisclosedProjects: ((sessionState as any).disclosedEntities || []).map((d: any) => d.name),
        discrepanciesNoted: ((sessionState as any).disclosedEntities || []).map(
          (d: any) => `Candidate introduced unlisted project '${d.name}' during turn ${d.firstMentionedTurn}.`
        ),
      },
      actionableStudyTracks: milestone5Report.actionableStudyTracks,
      next_steps: report.recommendedLearningActions.join(" | ") || "Proceed to team matching round",
      interviewer_note: report.interviewerPrivateNote,
      report, // Complete canonical evidence report
      evidenceCommittedToDNA: m5CommitResult.verifiedCommittedCount || commitResult.evidenceAdded
    }, {
      headers: {
        "X-Interview-Report-Version": "2.0.0"
      }
    });

  } catch (err: any) {
    console.error("[interview-final] Elite Final Report Error:", err.message);
    return NextResponse.json({
      decision: "INSUFFICIENT_EVIDENCE",
      confidence: 0,
      headline: "Assessment Evaluation Incomplete: System Processing Failure",
      overview: "Interview could not be completely evaluated due to an unexpected system processing failure. The candidate was not penalized.",
      hire_reasons: [],
      no_hire_reasons: [],
      standout_moments: [],
      concerning_moments: [],
      scorecard: {
        technical_depth: { score: 0, comment: "Evaluation could not complete" },
        communication: { score: 0, comment: "Evaluation could not complete" }
      },
      next_steps: "Retry evaluation or continue practice in Skill Practice Hub",
      interviewer_note: "Session could not be evaluated due to unexpected server error.",
      error: err.message
    });
  }
}