/**
 * app/api/interview/execute-code/route.ts
 * 
 * Secure Code Execution Endpoint for Cognalyze Technical Interview Agent (Milestone 4).
 * 
 * Security Directives:
 * 1. Server-side Authentication & Strict Candidate Tenant Isolation.
 * 2. Rate Limiting: Max 5 submissions per minute per candidate.
 * 3. Max Source Size Ceiling: 64 KB.
 * 4. Two-Tier Test Isolation:
 *    - mode: "run_smoke": Public smoke tests return full transparent input/output diffs.
 *    - mode: "formal_submit": Hidden tests are strictly redacted; inputs/expected outputs never leak.
 * 5. Hybrid Complexity Evaluation: Static AST + empirical scaling + interview probe.
 * 6. Non-Punitive Telemetry: Paste events attach advisory recruiter audit tags without scolding.
 * 7. Monotonic Session Store Recording.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import {
  executeSandboxTestSuite,
  SupportedLanguage,
  ExecutionVerdict,
  TestCaseInput,
  SandboxUnavailableError,
} from "@/lib/interview/sandbox-client";
import { parameterizeCodingProblem } from "@/lib/interview/coding-parameterizer";
import { synthesizeHybridComplexity } from "@/lib/interview/complexity-analyzer";
import {
  getActiveSessionState,
  saveActiveSessionState,
  isSessionCompleted,
  acquireTurnLock,
  releaseTurnLock,
} from "@/lib/interview-session-store";
import { checkRateLimit } from "@/lib/auth/security";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    const body = await req.json();

    const {
      sessionId,
      problemId = "maximum-subarray-sum-kadane-s-algorithm",
      language = "python",
      code = "",
      mode = "run_smoke",
      telemetry,
      candidateId: reqCandidateId,
    } = body;

    // 1. Authenticate candidate & enforce tenant isolation
    const candidateId = auth?.user?.id || reqCandidateId || "student-demo";
    if (auth?.user?.id && reqCandidateId && reqCandidateId !== auth.user.id) {
      return NextResponse.json(
        { error: "Access denied. Candidate identity mismatch.", code: "TENANT_MISMATCH" },
        { status: 403 }
      );
    }

    if (!sessionId || typeof sessionId !== "string" || sessionId.trim().length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid required sessionId.", code: "INVALID_SESSION_ID" },
        { status: 400 }
      );
    }

    // Authoritative session ownership validation before creating submissions or executing code
    const existingSession = getActiveSessionState(sessionId);
    if (existingSession && existingSession.candidateId && existingSession.candidateId !== candidateId) {
      return NextResponse.json(
        { error: "Access denied. Candidate does not own this interview session.", code: "TENANT_ACCESS_DENIED" },
        { status: 403 }
      );
    }

    // 2. Session Completion Guard
    if (isSessionCompleted(sessionId)) {
      return NextResponse.json(
        { error: "Interview session is completed. No further code submissions allowed." },
        { status: 400 }
      );
    }

    // 3. Max Source Code Size Guard (64 KB ceiling)
    if (typeof code !== "string" || Buffer.byteLength(code, "utf8") > 65536) {
      return NextResponse.json(
        { error: "Source code exceeds maximum permitted size of 64 KB." },
        { status: 400 }
      );
    }

    // 4. Rate Limiting: Max 5 submissions per 60 seconds
    const rateLimitKey = `code_exec:${candidateId}:${sessionId}`;
    const rateLimit = checkRateLimit(rateLimitKey, 5, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Execution rate limit exceeded. Please wait ${rateLimit.retryAfterSeconds} seconds before submitting again.`,
          retryAfter: rateLimit.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    // 5. Retrieve Parameterized Problem Instance
    const problemInstance = parameterizeCodingProblem(problemId, sessionId);

    // Determine effective function name: support both parameterized name and canonical name
    let effectiveFunc = problemInstance.functionName;
    if (code.includes(`def ${problemInstance.functionName}`) || code.includes(`function ${problemInstance.functionName}`)) {
      effectiveFunc = problemInstance.functionName;
    } else if (code.includes("def maxSubArray") || code.includes("function maxSubArray")) {
      effectiveFunc = "maxSubArray";
    }

    const isFormalSubmit = mode === "formal_submit";
    const testCasesToRun: TestCaseInput[] = isFormalSubmit
      ? [...problemInstance.publicTestCases, ...problemInstance.hiddenTestCases]
      : problemInstance.publicTestCases;

    // 6. Execute in Decoupled Sandbox
    const executionOutcome = await executeSandboxTestSuite({
      code,
      language: language as SupportedLanguage,
      functionName: effectiveFunc,
      testCases: testCasesToRun,
      isFormalSubmit,
    });

    // 7. Format Public Results (Transparent diffs)
    const publicResults = executionOutcome.results
      .filter((r) => !r.isHidden)
      .map((r) => ({
        testId: r.testId,
        passed: r.passed,
        verdict: r.verdict,
        durationMs: r.executionTimeMs,
        actualOutput: r.actualOutput,
        expectedOutput: r.expectedOutput,
        errorMessage: r.errorMessage,
      }));

    // If smoke mode: return public results immediately
    if (!isFormalSubmit) {
      return NextResponse.json({
        success: true,
        mode: "run_smoke",
        executionId: `exec_smoke_${Date.now()}`,
        executionSource: executionOutcome.executionSource,
        durationMs: executionOutcome.results.reduce((acc, r) => acc + r.executionTimeMs, 0),
        publicResults,
      });
    }

    // 8. Format Private Results (STRICT REDACTION of inputs & expected values)
    const hiddenResults = executionOutcome.results.filter((r) => r.isHidden);
    const passedHiddenCount = hiddenResults.filter((r) => r.passed).length;
    const firstFailedHidden = hiddenResults.find((r) => !r.passed);

    let failedCategory: "wrong_answer" | "time_limit_exceeded" | "memory_limit_exceeded" | "runtime_error" | undefined = undefined;
    if (firstFailedHidden) {
      if (firstFailedHidden.verdict === "TIME_LIMIT_EXCEEDED") failedCategory = "time_limit_exceeded";
      else if (firstFailedHidden.verdict === "MEMORY_LIMIT_EXCEEDED") failedCategory = "memory_limit_exceeded";
      else if (firstFailedHidden.verdict === "RUNTIME_ERROR") failedCategory = "runtime_error";
      else failedCategory = "wrong_answer";
    }

    const privateAggregate = {
      totalHiddenTests: hiddenResults.length,
      passedHiddenTests: passedHiddenCount,
      failedTestCategory: failedCategory,
      failedTestIndex: firstFailedHidden ? hiddenResults.indexOf(firstFailedHidden) + 1 : undefined,
    };

    // 9. Hybrid Complexity & Code Quality Evaluation
    const complexityReport = synthesizeHybridComplexity(code, language);

    // 10. Non-Punitive Telemetry Auditing
    const securityFlags: string[] = [...(executionOutcome.securityFlags || [])];
    if (telemetry?.pasteCount && telemetry.pasteCount >= 3) {
      securityFlags.push("ADVISORY_PASTE_BURST_DETECTED");
    }

    // 11. Persist Submission in Active Session Store
    try {
      const sessionState = getActiveSessionState(sessionId);
      if (sessionState) {
        if (!sessionState.codeSubmissions) {
          sessionState.codeSubmissions = [];
        }

        const submissionRecord = {
          submissionId: `sub_${Date.now()}`,
          timestamp: new Date().toISOString(),
          problemId,
          language,
          submittedCode: code,
          verdict: executionOutcome.verdict,
          score: executionOutcome.score,
          publicTestsPassed: publicResults.filter((r) => r.passed).length,
          publicTestsTotal: publicResults.length,
          hiddenTestsPassed: passedHiddenCount,
          hiddenTestsTotal: hiddenResults.length,
          complexityReport,
          telemetry: telemetry || {},
          securityFlags,
        };

        sessionState.codeSubmissions.push(submissionRecord);
        saveActiveSessionState(sessionId, sessionState);
      }
    } catch (saveErr: any) {
      console.warn("[execute-code] Non-fatal session persistence notice:", saveErr.message);
    }

    return NextResponse.json({
      success: true,
      mode: "formal_submit",
      submissionId: `sub_${Date.now()}`,
      executionSource: executionOutcome.executionSource,
      verdict: executionOutcome.verdict,
      score: executionOutcome.score,
      publicResults,
      privateAggregate,
      complexity: {
        staticEstimate: complexityReport.staticAnalysis.estimatedTimeComplexity,
        empiricalScaling: complexityReport.empiricalScaling.scalingPattern,
        confidence: complexityReport.staticAnalysis.confidence,
      },
      interviewerFollowUpProbe: complexityReport.interviewerFollowUpProbe,
      feedback: {
        codeSmells: complexityReport.staticAnalysis.codeSmells,
        securityFlags,
      },
    });
  } catch (err: any) {
    console.error("[execute-code] Error:", err);
    if (err instanceof SandboxUnavailableError || err.code === "SANDBOX_UNAVAILABLE" || err.isInfrastructureFailure) {
      return NextResponse.json(
        {
          error: "Sandbox execution service is currently unavailable.",
          code: "SANDBOX_UNAVAILABLE",
          message: err.message,
          isInfrastructureFailure: true,
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Internal execution system error.", message: err.message },
      { status: 500 }
    );
  }
}
