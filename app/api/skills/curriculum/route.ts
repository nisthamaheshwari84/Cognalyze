/**
 * app/api/skills/curriculum/route.ts
 * 
 * Unified Curriculum API Endpoint for Cognalyze.
 * Handles:
 * - GET: Subject retrieval, hierarchical navigation, topic loading, coverage report.
 * - POST: Code execution, subject mentor chat, mastery attempt submission, fast-track diagnostics.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getAllSubjects,
  getSubjectBySlug,
  getSubtopicBySlug,
  getSubtopicsForSubject,
  searchCurriculum,
  getCurriculumCoverageManifest
} from "@/lib/skills/curriculum/unified-curriculum-registry";
import { CanonicalSubjectSlug } from "@/lib/skills/curriculum/types";
import {
  SUBJECT_MENTOR_PERSONAS,
  getSubjectMentorReply,
  SubjectMentorContext
} from "@/lib/skills/curriculum/subject-mentors";
import { executeInUnifiedSandbox } from "@/lib/skills/curriculum/unified-execution-engine";
import {
  getStudentSubtopicMastery,
  recordStudentSubtopicAttempt,
  applyFastTrackExemption,
  getSubjectMasterySummary
} from "@/lib/skills/curriculum/mastery-engine";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subjectSlug = searchParams.get("subject") as CanonicalSubjectSlug | null;
    const subtopicSlug = searchParams.get("subtopic");
    const candidateId = searchParams.get("candidateId") || "guest";
    const query = searchParams.get("q");

    // Coverage Report Manifest
    if (searchParams.has("coverage")) {
      const manifest = getCurriculumCoverageManifest();
      return NextResponse.json({ success: true, manifest });
    }

    // Curriculum Search
    if (query) {
      const results = searchCurriculum(query);
      return NextResponse.json({ success: true, results });
    }

    // List all subjects
    if (!subjectSlug) {
      const subjects = getAllSubjects();
      return NextResponse.json({ success: true, subjects });
    }

    const subject = getSubjectBySlug(subjectSlug);
    if (!subject) {
      return NextResponse.json(
        { success: false, error: `Subject '${subjectSlug}' not found.` },
        { status: 404 }
      );
    }

    const mentorPersona = SUBJECT_MENTOR_PERSONAS[subjectSlug] || SUBJECT_MENTOR_PERSONAS["python"];
    const masterySummary = getSubjectMasterySummary(candidateId, subjectSlug);

    // If specific subtopic requested, return it with student mastery record
    if (subtopicSlug) {
      const subtopic = getSubtopicBySlug(subtopicSlug);
      const mastery = getStudentSubtopicMastery(candidateId, subtopicSlug);
      return NextResponse.json({
        success: true,
        subject,
        subtopic,
        mastery,
        mentorPersona,
        masterySummary
      });
    }

    // Return default first subtopic of the subject
    const allSubs = getSubtopicsForSubject(subjectSlug);
    const defaultSub = allSubs.length > 0 ? allSubs[0] : null;
    const mastery = defaultSub ? getStudentSubtopicMastery(candidateId, defaultSub.slug) : null;

    return NextResponse.json({
      success: true,
      subject,
      subtopic: defaultSub,
      mastery,
      mentorPersona,
      masterySummary
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action;

    // ── 1. EXECUTE CODE IN UNIFIED SANDBOX ───────────────────────
    if (action === "execute_code") {
      const { environment, codeOrQuery, datasetId, testCases } = body;
      const res = await executeInUnifiedSandbox({
        environment,
        codeOrQuery,
        datasetId,
        testCases
      });
      return NextResponse.json({ success: true, result: res });
    }

    // ── 2. SUBJECT MENTOR SOCRATIC DIALOGUE ──────────────────────
    if (action === "mentor_chat") {
      const context: SubjectMentorContext = {
        subjectSlug: body.subjectSlug || "python",
        subtopicSlug: body.subtopicSlug,
        studentCodeOrQuery: body.studentCodeOrQuery || "",
        lastExecutionResult: body.lastExecutionResult,
        currentHintLevel: body.currentHintLevel || 1,
        userQuestion: body.userQuestion
      };
      const reply = getSubjectMentorReply(context);
      return NextResponse.json({ success: true, reply });
    }

    // ── 3. SUBMIT CHALLENGE FOR MASTERY EVALUATION ───────────────
    if (action === "submit_attempt") {
      const { candidateId, subjectSlug, subtopicSlug, score, allTestsPassed, assisted } = body;
      const record = {
        id: `att-${Date.now()}`,
        candidateId: candidateId || "guest",
        subjectSlug: subjectSlug || "python",
        subtopicSlug,
        score: Number(score) || 0,
        allTestsPassed: Boolean(allTestsPassed),
        assisted: Boolean(assisted),
        timestamp: new Date().toISOString()
      };
      const result = await recordStudentSubtopicAttempt(record);
      return NextResponse.json({ success: true, ...result });
    }

    // ── 4. FAST-TRACK CHAPTER DIAGNOSTIC EXEMPTION ────────────────
    if (action === "fast_track_diagnostic") {
      const { candidateId, subjectSlug, chapterSlug, score } = body;
      const result = await applyFastTrackExemption(
        candidateId,
        subjectSlug,
        chapterSlug,
        Number(score) || 0
      );
      return NextResponse.json({ success: true, ...result });
    }

    return NextResponse.json(
      { success: false, error: `Unknown action: ${action}` },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

