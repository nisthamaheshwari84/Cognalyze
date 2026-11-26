/**
 * app/api/skills/ai-data/route.ts
 * 
 * REST API for the Cognalyze AI, Data & Intelligence Arena.
 * Multi-tenant, user-isolated endpoint for:
 * - Curriculum, Tracks, and Roles
 * - 52 Validated Practical Challenges Catalog
 * - SQL & Python Sandbox Runtimes
 * - Visual AI Agent Builder & Workflow Execution
 * - ML Experiment Studio (Data Preprocessing, Model Training, Metrics)
 * - Data & ML Pipeline Execution
 * - Technical Interview Simulation & Dossier Scoring
 * - Multimedia Micro-Videos & Socratic Mentoring
 * - Student DNA Synchronization & Multi-Instance Persistence
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getAllTracks,
  getTrackBySlug,
  getAllLessons,
  getLessonBySlug
} from "@/lib/skills/ai-data/curriculum";
import {
  getAllTargetRoles,
  getTargetRoleBySlug
} from "@/lib/skills/ai-data/roles";
import {
  getCandidateRole,
  setCandidateRole,
  getCandidateActiveTrack,
  setCandidateActiveTrack,
  recordStudentAttempt,
  getArenaSummary,
  saveCandidateOnboarding,
  getCandidateOnboarding,
  getCandidateBaseline,
  saveCandidateBaseline,
  getCandidateRoadmap,
  setCandidateLanguagePreference,
  getCandidateLanguagePreference,
  saveTopicStageProgress,
  getCandidateTopicProgress,
  getFullCanonicalArenaContext,
  saveLearningPosition,
  setCustomTargetRole,
  updateTopicMasteryRecord,
  getTopicMasteryRecord,
  getTopicMasteryMap,
} from "@/lib/skills/ai-data/store";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { isTestRuntime } from "@/lib/env";
import {
  buildMicroLearningPackage,
  evaluateSubtopicMicroCheck,
  runMicroExampleInSandbox,
} from "@/lib/skills/ai-data/micro-learning-engine";
import {
  getTopicComprehensionSuite,
  evaluateComprehensionExercise,
} from "@/lib/skills/ai-data/comprehension-engine";
import {
  getPracticalLabForTopic,
  getAllPracticalLabsOverview,
  evaluatePracticalLabSubmission,
} from "@/lib/skills/ai-data/practical-lab-engine";
import {
  buildTopicAssessment,
  evaluateTopicAssessmentSubmission,
  getMasteryGateStatus,
} from "@/lib/skills/ai-data/assessment-engine";
import {
  getProjectsForCandidate,
  verifyProjectMilestoneSubmission,
  verifyProjectGitHubRepository,
} from "@/lib/skills/ai-data/projects-engine";
import { generateContextAwareMentorReply } from "@/lib/skills/ai-data/mentor-service";
import {
  MASTER_CURRICULUM_TRACKS,
  getTaxonomyTopicById
} from "@/lib/skills/ai-data/master-curriculum-taxonomy";
import {
  getTopicStagePayload,
  evaluateStudentExplanation,
  TeachingStageNumber,
  ContentLanguage
} from "@/lib/skills/ai-data/deep-teaching-engine";
import { AiDataTrackSlug, TargetRoleSlug } from "@/lib/skills/ai-data/types";
import {
  getBaselineDiagnosticQuestions,
  evaluateBaselineAssessment
} from "@/lib/skills/ai-data/baseline-assessment-engine";
import { generatePersonalizedRoadmap } from "@/lib/skills/ai-data/roadmap-engine";
import { buildStudentPersonalizedRoadmap } from "@/lib/skills/ai-data/personalized-roadmap-engine";
import { inspectCpythonMechanics } from "@/lib/skills/ai-data/cpython-inspector-server";
import {
  evaluateNumpyBroadcasting,
  evaluateSqlJoinVisualizer,
  simulateGradientDescent,
  simulateRagPipelineFlow
} from "@/lib/skills/ai-data/visual-diagram-engine";
import {
  generateCanonicalNotesForTopic,
  generatePersonalWeaknessNotes
} from "@/lib/skills/ai-data/intelligent-notes-engine";
import {
  queryCompanyQuestions,
  recordQuestionSubmission,
  toggleQuestionBookmark,
  getCandidatePracticeAnalytics,
  getAdaptivePracticeRecommendations,
} from "@/lib/skills/ai-data/company-question-bank-store";
import { runQuestionBankCompletenessAudit } from "@/lib/skills/ai-data/question-bank-auditor";
import { validateLessonContent } from "@/lib/skills/ai-data/content-validator";
import { executeChallengeSubmission } from "@/lib/skills/ai-data/curated-coding-server";
import { getCodingChallengeById } from "@/lib/skills/ai-data/curated-coding-library";
import {
  getAllSqlChallenges,
  getSqlChallengeBySlug,
  executeSqlInSandbox
} from "@/lib/skills/ai-data/sql-lab-engine";
import {
  getAllPythonChallenges,
  getPythonChallengeBySlug,
  executePythonInSandbox
} from "@/lib/skills/ai-data/python-lab-engine";
import {
  computeLiveCohortRetentionMatrix,
  evaluateCohortAnalysisInterpretation
} from "@/lib/skills/ai-data/cohort-retention-engine";
import {
  computeLiveAbExperimentDiagnostics,
  evaluateAbTestDecision
} from "@/lib/skills/ai-data/ab-testing-engine";
import { getAllAnalyticsDatasets } from "@/lib/skills/ai-data/datasets";
import { getLabMentorGuidance } from "@/lib/skills/ai-data/mentor-service";
import {
  getAllPracticalChallenges,
  getPracticalChallengeBySlug,
  getPracticalChallengesByTrack
} from "@/lib/skills/ai-data/challenges-bank";
import {
  executeAgentWorkflow,
  evaluateAgentWorkflowScenarios,
  BUILTIN_AGENT_TOOLS
} from "@/lib/skills/ai-data/agent-builder-engine";
import {
  trainAndEvaluateModel,
  ML_STUDIO_DATASETS
} from "@/lib/skills/ai-data/ml-studio-engine";
import { executeDataPipeline } from "@/lib/skills/ai-data/pipeline-builder-engine";
import {
  startInterviewSession,
  evaluateInterviewSession,
  INTERVIEW_QUESTIONS_BANK
} from "@/lib/skills/ai-data/interview-engine";
import { getMicroVideoBySlug, MICRO_VIDEO_LIBRARY } from "@/lib/skills/ai-data/multimedia-service";
import {
  getTopicTeacherPackage,
  validateCoBuildSlotInput,
  validateDebugFix
} from "@/lib/skills/ai-data/ai-teacher-engine";
import {
  generateFreshProblem,
  getAllProblemFamilies,
  getAllIndustryDomains
} from "@/lib/skills/ai-data/fresh-problem-engine";
import {
  getHistoricalCompanyQuestions,
  getHistoricalCompanyQuestionById,
  HISTORICAL_COMPANY_QUESTIONS_BANK
} from "@/lib/skills/ai-data/historical-company-bank";
import {
  getDryRunTrace,
  listAvailableDryRunTraces
} from "@/lib/skills/ai-data/dry-run-visualizer";

async function resolveArenaAccess(
  req: NextRequest,
  requestedCandidateId?: string | null
): Promise<{ candidateId: string } | NextResponse> {
  const auth = await getAuthenticatedContext(req);
  const reqId = (requestedCandidateId || "").trim();

  if (auth?.user?.id) {
    if (reqId && reqId !== auth.user.id && reqId !== "student-demo") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Cannot access another student's Arena records." },
        { status: 403 }
      );
    }
    return { candidateId: auth.user.id };
  }

  // Unauthenticated callers may only use sandboxed demo identity (or isolated test IDs under test runner)
  if (!reqId || reqId === "student-demo") {
    return { candidateId: "student-demo" };
  }
  if (isTestRuntime() && (reqId.startsWith("student-test") || reqId.startsWith("test-"))) {
    return { candidateId: reqId };
  }
  return NextResponse.json(
    { success: false, error: "Unauthorized. Please sign in to access personal learning records." },
    { status: 401 }
  );
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const access = await resolveArenaAccess(req, searchParams.get("candidateId"));
    if (access instanceof NextResponse) return access;
    const candidateId = access.candidateId;
    const requestedTrack = searchParams.get("track") as AiDataTrackSlug | null;
    const requestedRole = searchParams.get("role") as TargetRoleSlug | null;
    const challengeSlug = searchParams.get("challenge");
    const videoSlug = searchParams.get("video");

    if (requestedRole) {
      setCandidateRole(candidateId, requestedRole);
    }
    if (requestedTrack) {
      setCandidateActiveTrack(candidateId, requestedTrack);
    }

    if (challengeSlug) {
      const chal = getPracticalChallengeBySlug(challengeSlug);
      if (!chal) return NextResponse.json({ success: false, error: "Challenge not found" }, { status: 404 });
      return NextResponse.json({ success: true, challenge: chal });
    }

    if (videoSlug) {
      const vid = getMicroVideoBySlug(videoSlug);
      return NextResponse.json({ success: true, video: vid || null });
    }

    const teacherTopic = searchParams.get("teacherTopic");
    if (teacherTopic) {
      const pkg = getTopicTeacherPackage(teacherTopic);
      return NextResponse.json({ success: true, teacherPackage: pkg });
    }

    const dryRunTraceId = searchParams.get("dryRunTraceId");
    if (dryRunTraceId) {
      const trace = getDryRunTrace(dryRunTraceId);
      return NextResponse.json({ success: true, trace });
    }

    const historicalCompany = searchParams.get("historicalCompany");
    if (historicalCompany || searchParams.has("historical")) {
      const qRes = getHistoricalCompanyQuestions({
        companySlug: historicalCompany || undefined,
        targetRole: (searchParams.get("targetRole") as TargetRoleSlug) || undefined,
        category: (searchParams.get("category") as any) || undefined,
        difficulty: (searchParams.get("difficulty") as any) || undefined,
        searchQuery: searchParams.get("q") || undefined,
        limit: searchParams.has("limit") ? Number(searchParams.get("limit")) : 20,
        offset: searchParams.has("offset") ? Number(searchParams.get("offset")) : 0
      });
      return NextResponse.json({ success: true, historicalQuestions: qRes });
    }

    const selectedRole = requestedRole || getCandidateRole(candidateId);
    const activeTrackSlug = requestedTrack || getCandidateActiveTrack(candidateId);
    const activeTrack = getTrackBySlug(activeTrackSlug);
    const allTracks = getAllTracks();
    const allRoles = getAllTargetRoles();
    const { summary } = await getFullCanonicalArenaContext(candidateId);
    const allChallenges = getAllPracticalChallenges();

    return NextResponse.json({
      success: true,
      candidateId,
      selectedRole,
      roleProfile: getTargetRoleBySlug(selectedRole),
      activeTrackSlug,
      activeTrack,
      tracks: allTracks.map(t => ({
        slug: t.slug,
        title: t.title,
        subtitle: t.subtitle,
        badge: t.badge,
        icon: t.icon,
        description: t.description,
        prerequisites: t.prerequisites,
        targetRoles: t.targetRoles,
        stagesCount: t.stages.length,
        lessonsCount: t.stages.reduce((acc, s) => acc + s.lessons.length, 0),
        estimatedHours: t.estimatedHours
      })),
      roles: allRoles,
      summary,
      masterCurriculum: MASTER_CURRICULUM_TRACKS,
      languagePreference: getCandidateLanguagePreference(candidateId),
      challengesSummary: {
        totalCount: allChallenges.length,
        byCategory: {
          python_debugging: allChallenges.filter(c => c.category === "python_debugging").length,
          sql_analytics: allChallenges.filter(c => c.category === "sql_analytics").length,
          ml_evaluation: allChallenges.filter(c => c.category === "ml_evaluation").length,
          genai_agents: allChallenges.filter(c => c.category === "genai_agents").length,
          data_engineering: allChallenges.filter(c => c.category === "data_engineering").length,
          mlops_production: allChallenges.filter(c => c.category === "mlops_production").length
        },
        challenges: allChallenges.map(c => ({
          id: c.id,
          slug: c.slug,
          title: c.title,
          trackSlug: c.trackSlug,
          category: c.category,
          difficulty: c.difficulty,
          canonicalSkill: c.canonicalSkill,
          provenance: c.provenance,
          estimatedMinutes: c.estimatedMinutes
        }))
      },
      availableTools: Object.values(BUILTIN_AGENT_TOOLS).map(t => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters
      })),
      availableDatasets: Object.values(ML_STUDIO_DATASETS).map(d => ({
        id: d.id,
        name: d.name,
        taskType: d.taskType,
        targetColumn: d.targetColumn,
        featureCount: d.features.length,
        rowCount: d.rows.length
      })),
      labs: {
        sqlChallenges: getAllSqlChallenges(),
        pythonChallenges: getAllPythonChallenges(),
        datasets: getAllAnalyticsDatasets()
      }
    });
  } catch (err: any) {
    console.error("[api/skills/ai-data] GET error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;
    const access = await resolveArenaAccess(req, body.candidateId);
    if (access instanceof NextResponse) return access;
    const candidateId = access.candidateId;

    // ── ROLE & TRACK MANAGEMENT ──────────────────────────────────────────────
    if (action === "set_role") {
      const { role } = body;
      if (!role) return NextResponse.json({ success: false, error: "Missing role" }, { status: 400 });
      setCandidateRole(candidateId, role as TargetRoleSlug);
      const summary = await getArenaSummary(candidateId);
      return NextResponse.json({ success: true, selectedRole: role, summary });
    }

    if (action === "set_track") {
      const { track } = body;
      if (!track) return NextResponse.json({ success: false, error: "Missing track" }, { status: 400 });
      setCandidateActiveTrack(candidateId, track as AiDataTrackSlug);
      const summary = await getArenaSummary(candidateId);
      return NextResponse.json({ success: true, activeTrackSlug: track, summary });
    }

    // ── CAREER ONBOARDING & BASELINE ASSESSMENT ──────────────────────────────
    if (action === "save_onboarding") {
      const { profile } = body;
      if (!profile) return NextResponse.json({ success: false, error: "Missing profile" }, { status: 400 });
      const saved = saveCandidateOnboarding(candidateId, profile);
      const summary = await getArenaSummary(candidateId);
      return NextResponse.json({ success: true, profile: saved, summary });
    }

    if (action === "get_baseline_questions") {
      const questions = getBaselineDiagnosticQuestions();
      return NextResponse.json({ success: true, questions });
    }

    if (action === "submit_baseline_assessment") {
      const { targetRole = "ai_engineer", startingLevel = "beginner", responses = [] } = body;
      const evaluation = evaluateBaselineAssessment(candidateId, targetRole, startingLevel, responses);
      saveCandidateBaseline(candidateId, evaluation);
      const summary = await getArenaSummary(candidateId);
      return NextResponse.json({ success: true, evaluation, summary });
    }

    if (action === "get_personalized_roadmap") {
      const roadmap = getCandidateRoadmap(candidateId);
      return NextResponse.json({ success: true, roadmap });
    }

    if (action === "build_student_personalized_roadmap" || action === "get_personalized_roadmap_v2") {
      const { targetRole, commitment, targetDeadlineWeeks } = body;
      const roadmap = buildStudentPersonalizedRoadmap({
        candidateId,
        targetRole,
        commitment,
        targetDeadlineWeeks
      });
      return NextResponse.json({ success: true, roadmap });
    }

    // ── INTERACTIVE VISUAL DIAGRAM ACTIONS ───────────────────────────────────
    if (action === "inspect_cpython_mechanics") {
      const { code } = body;
      const result = await inspectCpythonMechanics(code || "");
      return NextResponse.json({ success: true, result });
    }

    if (action === "evaluate_numpy_broadcasting") {
      const { shapeA = [3, 1], shapeB = [1, 4] } = body;
      const evaluation = evaluateNumpyBroadcasting(shapeA, shapeB);
      return NextResponse.json({ success: true, evaluation });
    }

    if (action === "evaluate_sql_joins") {
      const { joinType = "INNER" } = body;
      const evaluation = evaluateSqlJoinVisualizer(joinType);
      return NextResponse.json({ success: true, evaluation });
    }

    if (action === "simulate_gradient_descent") {
      const { learningRate = 0.15, initialTheta = -4.0, maxSteps = 20 } = body;
      const simulation = simulateGradientDescent(Number(learningRate), Number(initialTheta), Number(maxSteps));
      return NextResponse.json({ success: true, simulation });
    }

    if (action === "simulate_rag_pipeline") {
      const { rawDocument, chunkSize, chunkOverlap, query, topK } = body;
      const simulation = simulateRagPipelineFlow({ rawDocument, chunkSize, chunkOverlap, query, topK });
      return NextResponse.json({ success: true, simulation });
    }

    // ── INTELLIGENT NOTES ACTIONS ────────────────────────────────────────────
    if (action === "get_intelligent_notes") {
      const { topicId = "numpy-broadcasting", targetRole = "AI Engineer" } = body;
      const canonicalNotes = generateCanonicalNotesForTopic(topicId, targetRole);
      const personalWeaknesses = generatePersonalWeaknessNotes(candidateId, getTopicMasteryMap(candidateId));
      return NextResponse.json({ success: true, canonicalNotes, personalWeaknesses });
    }

    if (action === "validate_lesson") {
      const { lesson } = body;
      if (!lesson) return NextResponse.json({ success: false, error: "Missing lesson definition" }, { status: 400 });
      const report = validateLessonContent(lesson);
      return NextResponse.json({ success: true, report });
    }

    // ── 10-STAGE UNIVERSAL TEACHING ENGINE & BILINGUAL SETTINGS ──────────────
    if (action === "get_master_curriculum") {
      return NextResponse.json({ success: true, tracks: MASTER_CURRICULUM_TRACKS });
    }

    if (action === "get_stage_payload") {
      const { topicId, stageNumber = 1, language, targetRole } = body;
      if (!topicId) return NextResponse.json({ success: false, error: "Missing topicId" }, { status: 400 });
      const currentRole = targetRole || getCandidateRole(candidateId);
      const currentLang = language || getCandidateLanguagePreference(candidateId);
      const payload = getTopicStagePayload(topicId, stageNumber as TeachingStageNumber, currentLang as ContentLanguage, currentRole as TargetRoleSlug);
      if (!payload) return NextResponse.json({ success: false, error: "Topic not found" }, { status: 404 });
      const currentUnlockedStage = getCandidateTopicProgress(candidateId, topicId);
      return NextResponse.json({ success: true, payload, currentUnlockedStage, language: currentLang });
    }

    if (action === "evaluate_explanation") {
      const { topicId, explanationText, language } = body;
      if (!topicId || !explanationText) {
        return NextResponse.json({ success: false, error: "Missing topicId or explanationText" }, { status: 400 });
      }
      const currentLang = language || getCandidateLanguagePreference(candidateId);
      const evaluation = evaluateStudentExplanation(topicId, explanationText, currentLang as ContentLanguage);
      if (evaluation.passed) {
        saveTopicStageProgress(candidateId, topicId, 10);
      }
      return NextResponse.json({ success: true, evaluation });
    }

    if (action === "set_language_preference") {
      const { language } = body;
      if (!language || !["english", "hinglish"].includes(language)) {
        return NextResponse.json({ success: false, error: "Invalid language. Must be 'english' or 'hinglish'" }, { status: 400 });
      }
      setCandidateLanguagePreference(candidateId, language);
      return NextResponse.json({ success: true, language });
    }

    if (action === "get_language_preference") {
      const language = getCandidateLanguagePreference(candidateId);
      return NextResponse.json({ success: true, language });
    }

    if (action === "save_stage_progress") {
      const { topicId, stageNumber } = body;
      if (!topicId || !stageNumber) {
        return NextResponse.json({ success: false, error: "Missing topicId or stageNumber" }, { status: 400 });
      }
      const newMax = saveTopicStageProgress(candidateId, topicId, stageNumber);
      return NextResponse.json({ success: true, topicId, unlockedStage: newMax });
    }

    // ── SQL & PYTHON EXECUTION ───────────────────────────────────────────────
    if (action === "execute_sql") {
      const { datasetId = "ecommerce_analytics", userSql, sql, challengeSlug } = body;
      const sqlToRun = userSql || sql;
      if (!sqlToRun) return NextResponse.json({ success: false, error: "Missing SQL query" }, { status: 400 });
      const result = await executeSqlInSandbox(datasetId, sqlToRun, challengeSlug);
      return NextResponse.json({ success: true, result });
    }

    if (action === "execute_python") {
      const codeToRun = body.userCode || body.code || "";
      if (!codeToRun) return NextResponse.json({ success: false, error: "Missing Python code" }, { status: 400 });
      const result = await executePythonInSandbox(codeToRun, body.challengeSlug);
      return NextResponse.json({ success: true, result });
    }

    if (action === "execute_coding_challenge") {
      const { challengeId, userCode, isSubmission } = body;
      const targetCandidateId = body.candidateId || candidateId || "student-demo";
      const challenge = getCodingChallengeById(challengeId);
      if (!challenge) {
        return NextResponse.json({ success: false, error: "Challenge not found in curated library." }, { status: 404 });
      }
      const result = await executeChallengeSubmission(challenge, userCode || "");
      if (isSubmission) {
        try {
          recordQuestionSubmission({
            candidateId: targetCandidateId,
            questionId: challenge.id,
            userAnswer: userCode || "",
            timeSpentSeconds: 45,
            codeExecutionOutput: {
              passed: result.passed,
              stdout: result.testOutcomes?.[0]?.actualOutput,
              errorMessage: result.testOutcomes?.[0]?.errorMessage,
              testCasesPassed: result.passedTests,
              totalTestCases: result.totalTests,
            },
          });
        } catch (e) {
          console.warn("Could not record question submission:", e);
        }
      }
      return NextResponse.json({ success: true, result });
    }

    // ── VISUAL AI AGENT BUILDER ──────────────────────────────────────────────
    if (action === "execute_agent_workflow") {
      const { workflow, input = {} } = body;
      if (!workflow) return NextResponse.json({ success: false, error: "Missing workflow definition" }, { status: 400 });
      const result = await executeAgentWorkflow(workflow, input);
      return NextResponse.json({ success: true, result });
    }

    if (action === "evaluate_agent_workflow") {
      const { workflow } = body;
      if (!workflow) return NextResponse.json({ success: false, error: "Missing workflow definition" }, { status: 400 });
      const evaluation = await evaluateAgentWorkflowScenarios(workflow);
      return NextResponse.json({ success: true, evaluation });
    }

    // ── ML EXPERIMENT STUDIO ─────────────────────────────────────────────────
    if (action === "train_ml_model") {
      const { datasetId = "customer_churn", selectedFeatures = ["tenure_months", "monthly_charges"], config = {} } = body;
      const result = trainAndEvaluateModel(datasetId, selectedFeatures, {
        algorithm: config.algorithm || "logistic_regression",
        learningRate: config.learningRate || 0.1,
        epochs: config.epochs || 100,
        regularizationLambda: config.regularizationLambda || 0.01
      });
      return NextResponse.json({ success: true, result });
    }

    // ── DATA & ML PIPELINE BUILDER ───────────────────────────────────────────
    if (action === "execute_pipeline") {
      const { pipeline, initialRowset, injectFailure } = body;
      if (!pipeline) return NextResponse.json({ success: false, error: "Missing pipeline definition" }, { status: 400 });
      const result = await executeDataPipeline(pipeline, initialRowset, Boolean(injectFailure));
      return NextResponse.json({ success: true, result });
    }

    // ── TECHNICAL INTERVIEW SIMULATION ───────────────────────────────────────
    if (action === "start_interview") {
      const { role = "ai_engineer" } = body;
      const session = startInterviewSession(candidateId, role as TargetRoleSlug);
      return NextResponse.json({ success: true, session });
    }

    if (action === "evaluate_interview") {
      const { session } = body;
      if (!session) return NextResponse.json({ success: false, error: "Missing interview session" }, { status: 400 });
      const report = evaluateInterviewSession(session);
      return NextResponse.json({ success: true, report });
    }

    // ── COHORT & AB TESTING ──────────────────────────────────────────────────
    if (action === "get_cohort_matrix") {
      return NextResponse.json({ success: true, report: computeLiveCohortRetentionMatrix() });
    }

    if (action === "evaluate_cohort_interpretation") {
      const { submission } = body;
      return NextResponse.json({ success: true, evaluation: evaluateCohortAnalysisInterpretation(submission || {}) });
    }

    if (action === "get_ab_diagnostics") {
      const { mde = 0.05 } = body;
      return NextResponse.json({ success: true, report: computeLiveAbExperimentDiagnostics(mde) });
    }

    if (action === "evaluate_ab_decision") {
      const { submission } = body;
      return NextResponse.json({ success: true, evaluation: evaluateAbTestDecision(submission || {}) });
    }

    // ── SOCRATIC MENTOR GUIDANCE ─────────────────────────────────────────────
    if (action === "get_mentor_hint") {
      const { labType, challengeSlug, hintLevel, currentCode } = body;
      const guidance = getLabMentorGuidance({
        labType,
        challengeSlug,
        hintLevel: Math.max(1, Math.min(4, Number(hintLevel || 1))) as 1 | 2 | 3 | 4,
        currentCode
      });
      return NextResponse.json({ success: true, guidance });
    }

    // ── PERSISTENCE & STUDENT DNA RECORDING ───────────────────────────────────
    if (action === "submit_lab_assessment" || action === "record_attempt") {
      const {
        trackSlug = "genai_llm",
        lessonSlug,
        exerciseType = "code_lab",
        score,
        passed,
        assisted = false,
        dimensions,
        executionReport
      } = body;

      if (!lessonSlug || score === undefined) {
        return NextResponse.json({ success: false, error: "Invalid attempt payload" }, { status: 400 });
      }

      const result = await recordStudentAttempt({
        candidateId,
        trackSlug,
        lessonSlug,
        exerciseType,
        score: Number(score),
        passed: Boolean(passed),
        assisted: Boolean(assisted),
        dimensions,
        executionReport
      });

      const summary = await getArenaSummary(candidateId);
      return NextResponse.json({
        success: true,
        attempt: result.attempt,
        dnaSync: result.dnaSync,
        summary
      });
    }

    // ── AI TEACHER CO-CONSTRUCTION ───────────────────────────────────────────
    if (action === "get_teacher_package") {
      const { topicSlug = "python-rolling-stats" } = body;
      const pkg = getTopicTeacherPackage(topicSlug);
      return NextResponse.json({ success: true, teacherPackage: pkg });
    }

    if (action === "validate_co_build_slot") {
      const { slot, studentInput } = body;
      if (!slot || studentInput === undefined) {
        return NextResponse.json({ success: false, error: "Missing slot or studentInput" }, { status: 400 });
      }
      const outcome = validateCoBuildSlotInput(slot, String(studentInput));
      return NextResponse.json({ success: true, outcome });
    }

    if (action === "validate_debug_fix") {
      const { fault, fixedCodeOrConfig } = body;
      if (!fault || fixedCodeOrConfig === undefined) {
        return NextResponse.json({ success: false, error: "Missing fault or fixedCodeOrConfig" }, { status: 400 });
      }
      const outcome = validateDebugFix(fault, String(fixedCodeOrConfig));
      return NextResponse.json({ success: true, outcome });
    }

    // ── FRESH PROBLEM GENERATION ─────────────────────────────────────────────
    if (action === "generate_fresh_problem") {
      const { trackSlug, problemFamily, industryDomain, targetRole, difficulty, seed } = body;
      const freshChallenge = await generateFreshProblem({
        trackSlug,
        problemFamily,
        industryDomain,
        targetRole,
        difficulty,
        seed
      });
      return NextResponse.json({ success: true, challenge: freshChallenge });
    }

    // ── HISTORICAL COMPANY QUESTIONS ─────────────────────────────────────────
    if (action === "get_historical_company_questions") {
      const {
        companySlug,
        targetRole,
        category,
        difficulty,
        interviewStage,
        provenanceType,
        searchQuery,
        limit,
        offset
      } = body;
      const result = getHistoricalCompanyQuestions({
        companySlug,
        targetRole,
        category,
        difficulty,
        interviewStage,
        provenanceType,
        searchQuery,
        limit,
        offset
      });
      return NextResponse.json({ success: true, result });
    }

    if (action === "get_historical_company_question_by_id") {
      const { id } = body;
      if (!id) return NextResponse.json({ success: false, error: "Missing question ID" }, { status: 400 });
      const question = getHistoricalCompanyQuestionById(id);
      if (!question) return NextResponse.json({ success: false, error: "Question not found" }, { status: 404 });
      return NextResponse.json({ success: true, question });
    }

    // ── VISUAL DRY RUN STUDIO ────────────────────────────────────────────────
    if (action === "get_dry_run_trace") {
      const { traceId = "rolling-average-trace" } = body;
      const trace = getDryRunTrace(traceId);
      return NextResponse.json({ success: true, trace });
    }

    if (action === "list_dry_run_traces") {
      const traces = listAvailableDryRunTraces();
      return NextResponse.json({ success: true, traces });
    }

    // ── COMPANY-ORIENTED PRACTICE QUESTION BANK ──────────────────────────────
    if (action === "query_company_questions") {
      const { filters = {} } = body;
      const result = queryCompanyQuestions(candidateId, filters);
      return NextResponse.json({ success: true, result });
    }

    if (action === "submit_company_question") {
      const { submission } = body;
      if (!submission) return NextResponse.json({ success: false, error: "Missing submission payload" }, { status: 400 });
      submission.candidateId = candidateId;
      const result = recordQuestionSubmission(submission);
      return NextResponse.json({ success: true, ...result });
    }

    if (action === "toggle_question_bookmark") {
      const { questionId } = body;
      if (!questionId) return NextResponse.json({ success: false, error: "Missing question ID" }, { status: 400 });
      const bookmarked = toggleQuestionBookmark(candidateId, questionId);
      return NextResponse.json({ success: true, bookmarked });
    }

    if (action === "get_practice_analytics") {
      const analytics = getCandidatePracticeAnalytics(candidateId);
      return NextResponse.json({ success: true, analytics });
    }

    if (action === "get_adaptive_recommendations") {
      const { role } = body;
      const recommendations = getAdaptivePracticeRecommendations(candidateId, role);
      return NextResponse.json({ success: true, recommendations });
    }

    if (action === "run_question_bank_audit") {
      const report = runQuestionBankCompletenessAudit();
      return NextResponse.json({ success: true, report });
    }

    // ── UPGRADED SEQUENTIAL MASTERY & MICRO-LEARNING ENGINE ENDPOINTS ────────
    if (action === "get_canonical_context") {
      const ctx = await getFullCanonicalArenaContext(candidateId);
      return NextResponse.json({
        success: true,
        ...ctx,
        languagePreference: getCandidateLanguagePreference(candidateId),
        roles: getAllTargetRoles(),
      });
    }

    if (action === "save_learning_position") {
      const pos = saveLearningPosition(candidateId, {
        subjectId: body.subjectId,
        moduleId: body.moduleId,
        topicId: body.topicId,
        subtopicId: body.subtopicId,
        phase: body.phase,
      });
      if (body.topicId) {
        updateTopicMasteryRecord(candidateId, body.topicId, (prev) => ({
          status: prev.status === "not_started" ? "learning" : prev.status,
        }));
      }
      return NextResponse.json({ success: true, learningPosition: pos });
    }

    if (action === "set_custom_target_role") {
      if (!body.title || !Array.isArray(body.requiredSubjectIds)) {
        return NextResponse.json({ success: false, error: "Invalid custom target payload" }, { status: 400 });
      }
      setCustomTargetRole(candidateId, {
        slug: body.slug || "custom_target",
        title: String(body.title).slice(0, 80),
        summary: String(body.summary || "Custom configured AI & Data target pathway").slice(0, 300),
        requiredSubjectIds: body.requiredSubjectIds,
        requiredSkills: Array.isArray(body.requiredSkills) ? body.requiredSkills : ["python", "machine_learning"],
      });
      const ctx = await getFullCanonicalArenaContext(candidateId);
      return NextResponse.json({ success: true, ...ctx });
    }

    if (action === "get_micro_learning") {
      const topicId = body.topicId || "py-01-intro-interpreter";
      const lang = body.language || getCandidateLanguagePreference(candidateId);
      const role = body.targetRole || getCandidateRole(candidateId);
      const pkg = buildMicroLearningPackage(topicId, role, lang);
      if (!pkg) return NextResponse.json({ success: false, error: "Topic not found" }, { status: 404 });
      const comprehensionSuite = getTopicComprehensionSuite(topicId);
      const practicalLab = getPracticalLabForTopic(topicId);
      const masteryGate = getMasteryGateStatus(candidateId, topicId);
      return NextResponse.json({
        success: true,
        microPackage: pkg,
        comprehensionSuite,
        practicalLab,
        masteryGate,
      });
    }

    if (action === "submit_micro_check") {
      const { topicId, subtopicId, selectedOptionId, explanationText, language } = body;
      if (!topicId || !subtopicId) {
        return NextResponse.json({ success: false, error: "Missing topicId or subtopicId" }, { status: 400 });
      }
      const evaluation = evaluateSubtopicMicroCheck({
        topicId,
        subtopicId,
        selectedOptionId,
        explanationText,
        language: language || getCandidateLanguagePreference(candidateId),
      });
      let masteryRecord = getTopicMasteryRecord(candidateId, topicId);
      if (evaluation.passed) {
        masteryRecord = updateTopicMasteryRecord(candidateId, topicId, (prev) => ({
          conceptStepsCompleted: Array.from(new Set([...(prev.conceptStepsCompleted || []), subtopicId])),
          explanationPassed: explanationText ? true : prev.explanationPassed,
        }));
      }
      return NextResponse.json({ success: true, evaluation, masteryRecord });
    }

    if (action === "run_micro_example") {
      const { language = "python", code } = body;
      if (!code) return NextResponse.json({ success: false, error: "Missing code" }, { status: 400 });
      const result = await runMicroExampleInSandbox({ language, code });
      return NextResponse.json({ success: true, result });
    }

    if (action === "submit_comprehension") {
      const { topicId, challengeId, selectedOptionId, userFixCode } = body;
      if (!topicId || !challengeId) {
        return NextResponse.json({ success: false, error: "Missing topicId or challengeId" }, { status: 400 });
      }
      const evaluation = await evaluateComprehensionExercise({
        topicId,
        challengeId,
        selectedOptionId,
        userFixCode,
      });
      let masteryRecord = getTopicMasteryRecord(candidateId, topicId);
      if (evaluation.passed) {
        masteryRecord = updateTopicMasteryRecord(candidateId, topicId, (prev) => ({
          comprehensionPassed: challengeId.includes("debug") ? true : prev.comprehensionPassed,
          codingPassed: challengeId.includes("debug") ? true : prev.codingPassed,
        }));
      }
      return NextResponse.json({ success: true, evaluation, masteryRecord });
    }

    if (action === "get_practical_lab") {
      const topicId = body.topicId;
      if (topicId) {
        const lab = getPracticalLabForTopic(topicId);
        return NextResponse.json({ success: true, lab });
      }
      return NextResponse.json({ success: true, labs: getAllPracticalLabsOverview() });
    }

    if (action === "submit_practical_lab") {
      const { topicId, submissionText } = body;
      if (!topicId || typeof submissionText !== "string") {
        return NextResponse.json({ success: false, error: "Missing topicId or submissionText" }, { status: 400 });
      }
      const evaluation = await evaluatePracticalLabSubmission({ topicId, submissionText });
      const masteryRecord = updateTopicMasteryRecord(candidateId, topicId, (prev) => ({
        labPassed: prev.labPassed || evaluation.passed,
        codingPassed: prev.codingPassed || evaluation.passed,
        attemptsCount: (prev.attemptsCount || 0) + 1,
      }));
      if (evaluation.passed) {
        await recordStudentAttempt({
          candidateId,
          trackSlug: "ai_ml",
          lessonSlug: topicId,
          exerciseType: "code_lab",
          score: evaluation.score,
          passed: true,
          assisted: false,
        });
      }
      return NextResponse.json({ success: true, evaluation, masteryRecord });
    }

    if (action === "get_topic_assessment") {
      const { topicId, difficulty } = body;
      if (!topicId) return NextResponse.json({ success: false, error: "Missing topicId" }, { status: 400 });
      const assessment = buildTopicAssessment(topicId, difficulty);
      if (!assessment) return NextResponse.json({ success: false, error: "Topic not found" }, { status: 404 });
      return NextResponse.json({ success: true, assessment });
    }

    if (action === "submit_topic_assessment") {
      const { topicId, answers, difficulty } = body;
      if (!topicId || !answers) {
        return NextResponse.json({ success: false, error: "Missing topicId or answers" }, { status: 400 });
      }
      const report = await evaluateTopicAssessmentSubmission({
        candidateId,
        topicId,
        answers,
        difficulty,
      });
      if (!report) return NextResponse.json({ success: false, error: "Topic not found" }, { status: 404 });
      const ctx = await getFullCanonicalArenaContext(candidateId);
      return NextResponse.json({ success: true, report, summary: ctx.summary });
    }

    if (action === "get_integrated_projects") {
      const ctx = await getFullCanonicalArenaContext(candidateId);
      const projects = getProjectsForCandidate({
        targetRole: ctx.summary.selectedRole,
        masteryMap: ctx.summary.topicMasteryMap,
      });
      return NextResponse.json({ success: true, projects });
    }

    if (action === "verify_project_milestone") {
      const { projectId, milestoneId, userCode } = body;
      if (!projectId || !milestoneId || typeof userCode !== "string") {
        return NextResponse.json({ success: false, error: "Missing projectId, milestoneId, or userCode" }, { status: 400 });
      }
      const result = await verifyProjectMilestoneSubmission({ projectId, milestoneId, userCode });
      if (result.passed) {
        await recordStudentAttempt({
          candidateId,
          trackSlug: "applied_projects",
          lessonSlug: projectId,
          exerciseType: "project_milestone",
          score: result.score,
          passed: true,
          assisted: false,
        });
      }
      return NextResponse.json({ success: true, result });
    }

    if (action === "verify_project_github") {
      const { projectId, repoUrl } = body;
      if (!projectId || !repoUrl) {
        return NextResponse.json({ success: false, error: "Missing projectId or repoUrl" }, { status: 400 });
      }
      const result = await verifyProjectGitHubRepository({ candidateId, projectId, repoUrl });
      return NextResponse.json({ success: true, result });
    }

    if (action === "mentor_chat") {
      const topic = body.topicId ? getTaxonomyTopicById(body.topicId) : null;
      const mastery = body.topicId ? getTopicMasteryRecord(candidateId, body.topicId) : null;
      const mentorReply = await generateContextAwareMentorReply({
        candidateId,
        targetRole: body.targetRole || getCandidateRole(candidateId),
        subjectTitle: body.subjectTitle || "AI & Data Curriculum",
        moduleTitle: body.moduleTitle || "",
        topicId: body.topicId || "py-01-intro-interpreter",
        topicTitle: body.topicTitle || topic?.title || "Current Topic",
        subtopicTitle: body.subtopicTitle,
        learningPhase: body.learningPhase,
        language: body.language || getCandidateLanguagePreference(candidateId),
        userMessage: String(body.userMessage || ""),
        userCode: body.userCode,
        executionStdout: body.executionStdout,
        executionStderr: body.executionStderr,
        weakConcepts: body.weakConcepts || mastery?.weakConcepts,
        assessmentScore: body.assessmentScore ?? mastery?.assessmentScore,
        currentProjectTitle: body.currentProjectTitle,
        contextIntuition:
          (body.language || getCandidateLanguagePreference(candidateId)) === "hinglish"
            ? topic?.contextAndIntuition?.hinglish
            : topic?.contextAndIntuition?.english,
        deepExplanation:
          (body.language || getCandidateLanguagePreference(candidateId)) === "hinglish"
            ? topic?.deepExplanation?.hinglish
            : topic?.deepExplanation?.english,
        commonMistakes: topic?.deepExplanation?.commonMistakes,
        conceptsCovered: topic?.conceptsCovered,
      });
      return NextResponse.json({ success: true, mentorReply });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    console.error("[api/skills/ai-data] POST error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
