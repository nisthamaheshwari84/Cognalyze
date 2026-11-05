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
  getArenaSummary
} from "@/lib/skills/ai-data/store";
import { AiDataTrackSlug, TargetRoleSlug } from "@/lib/skills/ai-data/types";
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get("candidateId") || "student-demo";
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

    const selectedRole = getCandidateRole(candidateId);
    const activeTrackSlug = requestedTrack || getCandidateActiveTrack(candidateId);
    const activeTrack = getTrackBySlug(activeTrackSlug);
    const allTracks = getAllTracks();
    const allRoles = getAllTargetRoles();
    const summary = await getArenaSummary(candidateId);
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
    const { action, candidateId = "student-demo" } = body;

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

    // ── SQL & PYTHON EXECUTION ───────────────────────────────────────────────
    if (action === "execute_sql") {
      const { datasetId = "ecommerce_analytics", userSql, challengeSlug } = body;
      if (!userSql) return NextResponse.json({ success: false, error: "Missing SQL query" }, { status: 400 });
      const result = await executeSqlInSandbox(datasetId, userSql, challengeSlug);
      return NextResponse.json({ success: true, result });
    }

    if (action === "execute_python") {
      const { userCode, challengeSlug } = body;
      if (!userCode) return NextResponse.json({ success: false, error: "Missing Python code" }, { status: 400 });
      const result = await executePythonInSandbox(userCode, challengeSlug);
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

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    console.error("[api/skills/ai-data] POST error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
