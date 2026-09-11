"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import {
  CompanyTier,
  CompanyTierType,
  DriveType,
  RoleLevel,
  SimulationSession,
  HolisticReport,
  evaluateHolisticSimulation,
  saveSimulationSession,
} from "@/lib/simulation/simulation-engine";
import { canScoreRound } from "@/lib/simulation/gating";
import { verifyGitHubProfile, GitHubVerificationResult } from "@/lib/simulation/github-verifier";
import {
  generateOASession,
  GeneratedOASession,
  OAAptitudeQuestion,
  OACodingProblem,
} from "@/lib/simulation/oa-generator";

function SimulationContent() {
  // ── Session Configuration ──
  const [currentRound, setCurrentRound] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [targetCompany, setTargetCompany] = useState("Google");
  const [targetTier, setTargetTier] = useState<CompanyTier>("Tier 1 FAANG");
  const [companyTierType, setCompanyTierType] = useState<CompanyTierType>("FAANG/Product (Tier-1 hiring bar)");
  const [driveType, setDriveType] = useState<DriveType>("On-campus placement");
  const [roleLevel, setRoleLevel] = useState<RoleLevel>("Fresher/Entry-level");
  const [targetRole, setTargetRole] = useState("Software Development Engineer");
  const [resumeText, setResumeText] = useState(
    "Candidate: Alex Rivera\nSkills: TypeScript, React, Python, PostgreSQL, Redis, Distributed Systems, Docker\nProjects: Built high-throughput distributed payment gateway processing 10k req/s with Redis idempotency keys; Created real-time collaborative document editor using WebSockets and operational transforms."
  );
  const [githubUrl, setGithubUrl] = useState("https://github.com/alexrivera");
  const [studentProfile, setStudentProfile] = useState<any>(null);

  // ── Round 1: Resume Screening State ──
  const [screeningLoading, setScreeningLoading] = useState(false);
  const [screeningError, setScreeningError] = useState<string | null>(null);
  const [resumeResult, setResumeResult] = useState<any>(null);
  const [githubResult, setGithubResult] = useState<GitHubVerificationResult | null>(null);

  // ── Round 2: Online Assessment State ──
  const [oaSession, setOaSession] = useState<GeneratedOASession | null>(null);
  const [oaAnswers, setOaAnswers] = useState<Record<string, number>>({});
  const [activeCodingProblemIdx, setActiveCodingProblemIdx] = useState(0);
  const [codingLang, setCodingLang] = useState<"python" | "javascript">("python");
  const [codingCodes, setCodingCodes] = useState<Record<string, { python: string; javascript: string }>>({});
  const [codingResults, setCodingResults] = useState<Record<string, { passed: number; total: number; logs: string[] }>>({});
  const [codingRunning, setCodingRunning] = useState(false);
  const [oaStartedAt, setOaStartedAt] = useState<number | null>(null);
  const [oaElapsedSeconds, setOaElapsedSeconds] = useState(0);
  const [oaWarning, setOaWarning] = useState<string | null>(null);

  // ── Round 3: Group Discussion State ──
  const [gdTopic, setGdTopic] = useState("Should early-stage companies build Monoliths or Microservices for high concurrency?");
  const [gdTopicLoading, setGdTopicLoading] = useState(false);
  const [gdError, setGdError] = useState<string | null>(null);
  const [gdMessages, setGdMessages] = useState<Array<{ speaker: string; avatar: string; role: string; content: string }>>([
    {
      speaker: "Moderator Alex",
      avatar: "🎙️",
      role: "Discussion Director",
      content: "Welcome candidates to this placement Group Discussion. Today's topic is: 'Should early-stage companies build Monoliths or Microservices for high concurrency?' Ground your arguments in real-world trade-offs.",
    },
    {
      speaker: "Rohan",
      avatar: "⚡",
      role: "The Tech Purist",
      content: "Starting with microservices adds unnecessary network latency and serialization overhead. Unless your organization has at least 50 engineers, a modular monolith outperforms on p99 latency every single time.",
    },
    {
      speaker: "Priya",
      avatar: "🎯",
      role: "Product Strategist",
      content: "Rohan, that ignores deployment velocity! If five teams have to coordinate builds on a single monolith, shipping velocity collapses and the business dies before reaching scalability.",
    },
  ]);
  const [gdInput, setGdInput] = useState("");
  const [gdSending, setGdSending] = useState(false);
  const [gdArticulationScore, setGdArticulationScore] = useState<number | null>(null);
  const [gdFeedback, setGdFeedback] = useState<string | null>(null);
  const [gdWarning, setGdWarning] = useState<string | null>(null);

  // ── Round 4: Technical Interview State ──
  const [techMessages, setTechMessages] = useState<Array<{ role: "assistant" | "user"; content: string }>>([]);
  const [techInput, setTechInput] = useState("");
  const [techLoading, setTechLoading] = useState(false);
  const [techError, setTechError] = useState<string | null>(null);
  const [techScore, setTechScore] = useState<number | null>(null);
  const [techWeakAreas, setTechWeakAreas] = useState<string[]>([]);
  const [techStrongAreas, setTechStrongAreas] = useState<string[]>([]);
  const [techAssessment, setTechAssessment] = useState<any>(null);
  const [techWarning, setTechWarning] = useState<string | null>(null);

  // ── Round 5: HR / Behavioral State ──
  const [hrQuestions, setHrQuestions] = useState<Array<{
    id: string;
    competency: string;
    question: string;
    why_asked: string;
    guidance_placeholder: string;
  }>>([]);
  const [hrLoading, setHrLoading] = useState(false);
  const [hrError, setHrError] = useState<string | null>(null);
  const [hrAnswers, setHrAnswers] = useState<string[]>(["", ""]);
  const [hrScore, setHrScore] = useState<number | null>(null);
  const [hrFeedback, setHrFeedback] = useState<string | null>(null);
  const [hrWarning, setHrWarning] = useState<string | null>(null);

  // ── Round 6: Final Holistic Report State ──
  const [holisticReport, setHolisticReport] = useState<HolisticReport | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  // Load student profile if available
  useEffect(() => {
    const cId = typeof window !== "undefined" ? localStorage.getItem("cognalyze_student_id") || "student-demo" : "student-demo";
    fetch(`/api/student/onboarding?candidateId=${cId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) {
          setStudentProfile(data.profile);
          if (data.profile.target_roles?.[0]) setTargetRole(data.profile.target_roles[0]);
          if (data.profile.skills?.length > 0) {
            const skillStr = data.profile.skills.map((s: any) => s.name).join(", ");
            const projStr = data.profile.past_projects?.map((p: any) => `${p.title} (${p.tech_stack?.join(", ") || ""})`).join("; ") || "Real-world payment pipeline";
            setResumeText(`Candidate: Alex Rivera\nSkills: ${skillStr}\nProjects: ${projStr}\nTarget Role: ${data.profile.target_roles?.[0] || targetRole}`);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Initialize or regenerate OA Session when entering Round 2 or target changes
  useEffect(() => {
    if (currentRound === 2 && !oaSession) {
      const generated = generateOASession(targetCompany, targetTier);
      setOaSession(generated);
      setOaStartedAt(Date.now());
      // Initialize starter codes for the problems
      const initialCodes: Record<string, { python: string; javascript: string }> = {};
      generated.codingProblems.forEach((p) => {
        initialCodes[p.id] = {
          python: p.starterCodes.python,
          javascript: p.starterCodes.javascript,
        };
      });
      setCodingCodes(initialCodes);
    }
  }, [currentRound, targetCompany, targetTier, oaSession]);

  // Live Timer for Online Assessment (Enforced Minimum Time)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentRound === 2 && oaStartedAt) {
      interval = setInterval(() => {
        setOaElapsedSeconds(Math.floor((Date.now() - oaStartedAt) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentRound, oaStartedAt]);

  // ── Round 1: Run Resume Screening with Real GitHub Verification ──
  const handleRunScreening = async () => {
    setScreeningLoading(true);
    setScreeningError(null);
    try {
      // 1. Live GitHub Profile & Claim Verification
      const ghCheck = await verifyGitHubProfile(githubUrl, resumeText);
      setGithubResult(ghCheck);

      // 2. ATS Recruiter Screening
      const res = await fetch("/api/recruiter-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jd: `Target Role: ${targetRole} at ${targetCompany} (${companyTierType}). Requirements: Strong systems programming, database performance, API scalability, and verified technical execution.`,
          resume: `${resumeText}\n\n[Verified GitHub Data: ${ghCheck.summary}]`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const score = typeof data.overall_fit === "number" ? data.overall_fit : (data.ats_match_score || 78);
        const result: "pass" | "borderline" | "fail" = score >= 75 ? "pass" : score >= 55 ? "borderline" : "fail";
        let evidence = data.recruiter_summary || data.private_note || "Candidate resume displays verified technical skills with solid alignment to core requirements.";
        if (ghCheck.unverifiedClaims.length > 0) {
          evidence += ` Note: ${ghCheck.unverifiedClaims[0]}`;
        }
        setResumeResult({ result, score, evidence, github_verification: ghCheck });
      } else {
        setResumeResult({
          result: "pass",
          score: 80,
          evidence: `Resume audited. GitHub verification: ${ghCheck.summary}`,
          github_verification: ghCheck,
        });
      }
    } catch {
      setResumeResult({
        result: "borderline",
        score: 65,
        evidence: "Resume screening completed with baseline matching.",
      });
    } finally {
      setScreeningLoading(false);
    }
  };

  // ── Round 2: Run Coding Tests Deterministically ──
  const currentCodingProblem: OACodingProblem | undefined = oaSession?.codingProblems[activeCodingProblemIdx];

  const handleRunCodingTests = async () => {
    if (!currentCodingProblem) return;
    setCodingRunning(true);
    const codeToRun = codingCodes[currentCodingProblem.id]?.[codingLang] || "";

    try {
      const res = await fetch("/api/simulation/execute-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: codingLang,
          code: codeToRun,
          testCases: currentCodingProblem.testCases,
          functionName: currentCodingProblem.functionName,
        }),
      });

      const data = await res.json();
      setCodingResults((prev) => ({
        ...prev,
        [currentCodingProblem.id]: {
          passed: data.passed,
          total: data.total,
          logs: data.logs || [],
        },
      }));
    } catch (err: any) {
      setCodingResults((prev) => ({
        ...prev,
        [currentCodingProblem.id]: {
          passed: 0,
          total: currentCodingProblem.testCases.length,
          logs: [`Execution failed: ${err.message}`],
        },
      }));
    } finally {
      setCodingRunning(false);
    }
  };

  // ── Round 2: Submit OA with Universal Gating & Timer Enforcement ──
  const handleSubmitOA = () => {
    if (!oaSession) return;
    setOaWarning(null);

    const totalApt = oaSession.aptitudeQuestions.length;
    const answeredApt = Object.keys(oaAnswers).length;
    const codingTested = Object.keys(codingResults).length > 0;
    const minSeconds = oaSession.minTimeSeconds;

    const gating = canScoreRound("online_assessment", {
      oaAnswers,
      totalAptitudeCount: totalApt,
      codingPassCount: codingTested ? 1 : null,
      timeElapsedSeconds: oaElapsedSeconds,
      minTimeSeconds: minSeconds,
    });

    if (!gating.canScore) {
      setOaWarning(`Cannot submit OA: ${gating.missingRequirements.join("; ")}`);
      return;
    }

    initGD();
    setCurrentRound(3);
  };

  // ── Round 3: Initialize Context-Conditioned GD Arena ──
  const initGD = async () => {
    setGdTopicLoading(true);
    setGdError(null);
    setGdWarning(null);
    try {
      const res = await fetch("/api/student/gd-turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_topic",
          company_tier: companyTierType,
          drive_type: driveType,
          role_level: roleLevel,
          target_company: targetCompany,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.topic) setGdTopic(data.topic);
        if (Array.isArray(data.opening_messages) && data.opening_messages.length >= 3) {
          setGdMessages(data.opening_messages);
        }
      }
    } catch {
      // Keep curated topic
    } finally {
      setGdTopicLoading(false);
    }
  };

  // ── Round 3: Send GD Turn (Candidate speech required) ──
  const handleSendGDTurn = async () => {
    const text = gdInput.trim();
    if (!text || gdSending) return;

    setGdError(null);
    setGdWarning(null);
    const userMsg = {
      speaker: "You (Candidate)",
      avatar: "🧑",
      role: "Candidate",
      content: text,
    };
    const updated = [...gdMessages, userMsg];
    setGdMessages(updated);
    setGdInput("");
    setGdSending(true);

    try {
      const res = await fetch("/api/student/gd-turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: gdTopic,
          messages: updated,
          studentIntervention: text,
          company_tier: companyTierType,
          drive_type: driveType,
          role_level: roleLevel,
          target_company: targetCompany,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.next_speaker) {
          setGdMessages((prev) => [
            ...prev,
            {
              speaker: data.next_speaker.name || "Karan",
              avatar: data.next_speaker.avatar || "🛡️",
              role: data.next_speaker.role || "Risk Analyst",
              content: data.next_speaker.spoken_text,
            },
          ]);
        }
        if (data.student_coaching?.articulationScore) {
          setGdArticulationScore(data.student_coaching.articulationScore);
        }
        if (data.student_coaching?.feedbackTip) {
          setGdFeedback(data.student_coaching.feedbackTip);
        }
      } else {
        setGdError("Debate turn generation failed after retry. Please click retry.");
      }
    } catch {
      setGdError("Debate turn generation failed after retry. Please click retry.");
    } finally {
      setGdSending(false);
    }
  };

  // ── Round 3: Advance to Tech Round with Gating ──
  const handleAdvanceFromGD = (skipRound: boolean = false) => {
    setGdWarning(null);
    if (!skipRound) {
      const gating = canScoreRound("group_discussion", { gdMessages });
      if (!gating.canScore) {
        setGdWarning(`Cannot score GD: ${gating.missingRequirements.join("; ")}. Intervene at least twice to earn a participation score, or choose Skip.`);
        return;
      }
    } else {
      setGdArticulationScore(null);
      setGdFeedback("Candidate skipped the Group Discussion round without speaking (Not Attempted).");
    }

    initTechInterview();
    setCurrentRound(4);
  };

  // ── Round 4: Initialize Tech Interview (Preserved as per Fix E) ──
  const initTechInterview = async () => {
    setTechLoading(true);
    setTechError(null);
    setTechWarning(null);

    const codingSolves = Object.values(codingResults).filter((r) => r.passed === r.total).length;
    const round2Summary =
      codingSolves === 0
        ? "Candidate struggled with Round 2 OA algorithmic coding test cases."
        : `Candidate passed Round 2 OA coding test cases (${codingSolves}/${oaSession?.codingProblems.length || 2} problems solved).`;

    try {
      const res = await fetch("/api/interview-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [],
          jd: `Target Role: ${targetRole} at ${targetCompany} (${companyTierType})`,
          resume: resumeText,
          qNumber: 0,
          target_company: targetCompany,
          company_tier: companyTierType,
          drive_type: driveType,
          role_level: roleLevel,
          round_2_summary: round2Summary,
          experienceMode: roleLevel === "Fresher/Entry-level" ? "fresher" : roleLevel === "1-3 years" ? "1-3yr" : "experienced",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTechMessages([{ role: "assistant", content: data.message }]);
        if (codingSolves === 0) {
          setTechWeakAreas(["Algorithmic problem solving", "Boundary condition analysis"]);
        } else {
          setTechStrongAreas(["Algorithmic execution", "Hash table application"]);
        }
      } else {
        setTechError("Opening question generation failed after retry. Please click retry.");
      }
    } catch {
      setTechError("Opening question generation failed after retry. Please click retry.");
    } finally {
      setTechLoading(false);
    }
  };

  // ── Round 4: Send Tech Answer (Preserved as per Fix E) ──
  const handleSendTechAnswer = async () => {
    const text = techInput.trim();
    if (!text || techLoading) return;

    setTechError(null);
    setTechWarning(null);
    const userMsg = { role: "user" as const, content: text };
    const updated = [...techMessages, userMsg];
    setTechMessages(updated);
    setTechInput("");
    setTechLoading(true);

    try {
      const res = await fetch("/api/interview-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updated,
          jd: `Target Role: ${targetRole} at ${targetCompany} (${companyTierType})`,
          resume: resumeText,
          qNumber: updated.length,
          target_company: targetCompany,
          company_tier: companyTierType,
          drive_type: driveType,
          role_level: roleLevel,
          round_2_summary: "Candidate technical interview in progress.",
          experienceMode: roleLevel === "Fresher/Entry-level" ? "fresher" : roleLevel === "1-3 years" ? "1-3yr" : "experienced",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTechMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
        if (data.answer_assessment) {
          setTechAssessment(data.answer_assessment);
          if (data.answer_assessment.answer_quality === "strong") {
            setTechScore((prev) => Math.max(prev || 0, 85));
            setTechStrongAreas((prev) => [...new Set([...prev, "Technical Depth", "Clear Communication"])]);
          } else if (data.answer_assessment.answer_quality === "shallow") {
            setTechScore((prev) => (prev !== null ? Math.min(prev, 50) : 50));
            setTechWeakAreas((prev) => [...new Set([...prev, "Surface-level reasoning", "Trade-off articulation"])]);
          } else {
            setTechScore((prev) => prev || 65);
          }
        } else {
          setTechScore((prev) => prev || 70);
        }
      } else {
        setTechError("Question generation failed after retry. Please click retry to continue.");
      }
    } catch {
      setTechError("Question generation failed after retry. Please click retry to continue.");
    } finally {
      setTechLoading(false);
    }
  };

  // ── Round 4: Advance to HR Round with Gating ──
  const handleAdvanceFromTech = (skipRound: boolean = false) => {
    setTechWarning(null);
    if (!skipRound) {
      const gating = canScoreRound("technical_interview", { techMessages });
      if (!gating.canScore) {
        setTechWarning(`Cannot score Technical Interview: ${gating.missingRequirements.join("; ")}. Answer at least 2 questions to earn a score.`);
        return;
      }
    } else {
      setTechScore(null);
    }

    initHR();
    setCurrentRound(5);
  };

  // ── Round 5: Initialize HR Questions (Context-Aware with Tech Gaps) ──
  const initHR = async () => {
    setHrLoading(true);
    setHrError(null);
    setHrWarning(null);
    try {
      const res = await fetch("/api/simulation/hr-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_questions",
          target_company: targetCompany,
          company_tier: companyTierType,
          drive_type: driveType,
          role_level: roleLevel,
          resume_text: `${resumeText}\n[Technical round weak points flagged: ${techWeakAreas.join(", ") || "None"}]`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.questions) && data.questions.length >= 2) {
          setHrQuestions(data.questions);
          setHrAnswers(new Array(data.questions.length).fill(""));
        }
      } else {
        setHrError("HR question generation failed. Please click retry.");
      }
    } catch {
      setHrError("HR question generation failed. Please click retry.");
    } finally {
      setHrLoading(false);
    }
  };

  // ── Round 6: Final Holistic Evaluation (Strict Participation Checks) ──
  const handleGenerateFinalReport = async () => {
    setGeneratingReport(true);
    setHrWarning(null);

    // Check HR Round participation
    let computedHrScore = hrScore;
    let computedHrFeedback = hrFeedback;
    const hrGating = canScoreRound("hr_interview", { hrQuestions, hrAnswers });

    if (hrGating.canScore && hrQuestions.length > 0) {
      try {
        const hrEvalRes = await fetch("/api/simulation/hr-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "evaluate_answers",
            target_company: targetCompany,
            company_tier: companyTierType,
            drive_type: driveType,
            role_level: roleLevel,
            questions: hrQuestions,
            answers: hrAnswers,
          }),
        });
        if (hrEvalRes.ok) {
          const evalData = await hrEvalRes.json();
          if (typeof evalData.score === "number") {
            computedHrScore = evalData.score;
            setHrScore(evalData.score);
          }
          if (evalData.feedback) {
            computedHrFeedback = evalData.feedback;
            setHrFeedback(evalData.feedback);
          }
        }
      } catch (e) {
        console.warn("HR evaluation error:", e);
      }
    } else {
      computedHrScore = null;
      computedHrFeedback = "Not Attempted: Candidate did not provide substantive STAR answers to HR questions.";
    }

    // Check Online Assessment Participation
    const totalApt = oaSession?.aptitudeQuestions.length || 0;
    const answeredApt = Object.keys(oaAnswers).length;
    const codingTested = Object.keys(codingResults).length > 0;
    const oaGating = canScoreRound("online_assessment", {
      oaAnswers,
      totalAptitudeCount: totalApt,
      codingPassCount: codingTested ? 1 : null,
      timeElapsedSeconds: oaElapsedSeconds,
      minTimeSeconds: oaSession?.minTimeSeconds || 180,
    });

    let computedAptScore: number | null = null;
    let computedCodingScore: number | null = null;
    let codingSolvedStr = "Not Attempted";
    let oaResultStr: "pass" | "borderline" | "fail" | "not_attempted" = "not_attempted";

    if (oaGating.canScore && oaSession) {
      let aptCorrect = 0;
      oaSession.aptitudeQuestions.forEach((q) => {
        if (oaAnswers[q.id] === q.correct_option_index) aptCorrect++;
      });
      computedAptScore = Math.round((aptCorrect / totalApt) * 100);

      // Compute coding score
      let totalPassed = 0;
      let totalCases = 0;
      let fullSolvedCount = 0;
      oaSession.codingProblems.forEach((p) => {
        const res = codingResults[p.id];
        if (res) {
          totalPassed += res.passed;
          totalCases += res.total;
          if (res.passed === res.total && res.total > 0) fullSolvedCount++;
        } else {
          totalCases += p.testCases.length;
        }
      });
      computedCodingScore = totalCases > 0 ? Math.round((totalPassed / totalCases) * 100) : 0;
      codingSolvedStr = `${fullSolvedCount}/${oaSession.codingProblems.length}`;
      oaResultStr = fullSolvedCount >= 1 && computedAptScore >= 50 ? "pass" : "fail";
    }

    // Check Group Discussion Participation
    const gdGating = canScoreRound("group_discussion", { gdMessages });
    const gdCandidateCount = gdMessages.filter((m) => m.speaker.includes("Candidate") || m.role === "Candidate").length;
    const finalGdScore = gdGating.canScore ? gdArticulationScore || 65 : null;
    const finalGdResult: "pass" | "borderline" | "fail" | "not_attempted" = gdGating.canScore
      ? (finalGdScore || 0) >= 70
        ? "pass"
        : (finalGdScore || 0) >= 50
        ? "borderline"
        : "fail"
      : "not_attempted";

    // Check Technical Interview Participation
    const techGating = canScoreRound("technical_interview", { techMessages });
    const techCandidateCount = techMessages.filter((m) => m.role === "user").length;
    const finalTechScore = techGating.canScore ? techScore || 70 : null;
    const finalTechResult: "pass" | "borderline" | "fail" | "not_attempted" = techGating.canScore
      ? (finalTechScore || 0) >= 70
        ? "pass"
        : (finalTechScore || 0) >= 50
        ? "borderline"
        : "fail"
      : "not_attempted";

    // Check Resume Screening Participation
    const resumeGating = canScoreRound("resume_screening", {
      resume_text: resumeText,
      screening_performed: Boolean(resumeResult),
      score: resumeResult?.score,
    });
    const finalResumeScore = resumeGating.canScore ? resumeResult?.score || 78 : null;
    const finalResumeResult: "pass" | "borderline" | "fail" | "not_attempted" = resumeGating.canScore
      ? resumeResult?.result || "pass"
      : "not_attempted";

    const sessionData: SimulationSession = {
      id: `sim_${Date.now()}`,
      candidate_id: studentProfile?.candidate_id || "student-demo",
      target_company: targetCompany,
      target_company_tier: targetTier,
      company_tier_type: companyTierType,
      drive_type: driveType,
      role_level: roleLevel,
      target_role: targetRole,
      current_round: 6,
      resume_data: {
        resume_text: resumeText,
        jd_text: `Target: ${targetRole} at ${targetCompany} (${companyTierType})`,
        github_url: githubUrl,
      },
      round_results: {
        resume_screening: {
          result: finalResumeResult,
          score: finalResumeScore,
          evidence: resumeGating.canScore
            ? resumeResult?.evidence || "Resume verified with technical matches."
            : "Not Attempted: Resume screening audit was not run.",
          github_verification: githubResult || undefined,
        },
        online_assessment: {
          aptitude_score: computedAptScore,
          coding_score: computedCodingScore,
          coding_problems_solved: codingSolvedStr,
          result: oaResultStr,
          time_elapsed_seconds: oaElapsedSeconds,
        },
        group_discussion: {
          articulation_score: finalGdScore,
          result: finalGdResult,
          specific_feedback: gdGating.canScore
            ? gdFeedback || "Debate contributions evaluated."
            : "Not Attempted: Candidate did not contribute to the group debate.",
          candidate_interventions_count: gdCandidateCount,
        },
        technical_interview: {
          score: finalTechScore,
          result: finalTechResult,
          strong_areas: techGating.canScore && techStrongAreas.length > 0 ? techStrongAreas : ["Not Attempted"],
          weak_areas: techGating.canScore && techWeakAreas.length > 0 ? techWeakAreas : ["Not Attempted"],
          specific_examples: techGating.canScore
            ? `Candidate responded to ${techCandidateCount} technical questions.`
            : "Not Attempted: Technical questions were not answered.",
          candidate_responses_count: techCandidateCount,
        },
        hr_interview: {
          score: hrGating.canScore ? computedHrScore : null,
          result: hrGating.canScore ? (computedHrScore && computedHrScore >= 65 ? "pass" : "fail") : "not_attempted",
          specific_feedback: computedHrFeedback || "Not Attempted",
          candidate_responses_count: hrAnswers.filter((a) => a.trim().length >= 20).length,
        },
      },
      created_at: new Date().toISOString(),
    };

    try {
      const res = await fetch("/api/simulation/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sessionData),
      });
      if (res.ok) {
        const data = await res.json();
        setHolisticReport(data.report);
      } else {
        const fallback = evaluateHolisticSimulation(sessionData);
        setHolisticReport(fallback);
      }
    } catch {
      const fallback = evaluateHolisticSimulation(sessionData);
      setHolisticReport(fallback);
    } finally {
      setGeneratingReport(false);
      setCurrentRound(6);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#060913", color: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <AppNav role="student" />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>
        
        {/* HEADER & STAGE STEPPER */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
            <div>
              <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "rgba(99,102,241,0.2)", color: "#818cf8", fontWeight: 800 }}>
                HOLISTIC PLACEMENT SIMULATION
              </span>
              <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 900, margin: "6px 0 2px", letterSpacing: "-0.5px" }}>
                Full-Funnel Recruitment Arena
              </h1>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", margin: 0 }}>
                Strict participation gating enforced across all 5 rounds. Real code tests, live debate, and verified evidence.
              </p>
            </div>

            {/* Target Settings Summary */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, padding: "6px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8 }}>
                🏢 {targetCompany}
              </span>
              <span style={{ fontSize: 11, padding: "6px 12px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", color: "#818cf8", borderRadius: 8, fontWeight: 700 }}>
                🎯 {targetTier}
              </span>
            </div>
          </div>

          {/* Stepper Tabs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6, marginTop: 20 }}>
            {[
              { num: 1, label: "Resume Screening", icon: "📄" },
              { num: 2, label: "Online Assessment", icon: "⚡" },
              { num: 3, label: "GD Arena", icon: "🗣️" },
              { num: 4, label: "Tech Interview", icon: "💻" },
              { num: 5, label: "HR Bar-Raiser", icon: "🤝" },
              { num: 6, label: "Holistic Verdict", icon: "📊" },
            ].map((s) => {
              const isActive = currentRound === s.num;
              const isPast = currentRound > s.num;
              return (
                <div
                  key={s.num}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    background: isActive ? "rgba(99,102,241,0.2)" : isPast ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${isActive ? "#6366f1" : isPast ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.06)"}`,
                    textAlign: "center",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ fontSize: 13, marginBottom: 2 }}>{s.icon}</div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: isActive ? "#818cf8" : isPast ? "#34d399" : "#64748b" }}>
                    R{s.num}: {s.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════ */}
        {/* ROUND 1: RESUME SCREENING & GITHUB AUDIT */}
        {/* ═══════════════════════════════════════════════ */}
        {currentRound === 1 && (
          <div style={{ maxWidth: 840, margin: "0 auto", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 26 }}>📄</span>
              <div>
                <span style={{ fontSize: 10, color: "#818cf8", fontWeight: 800, letterSpacing: 1.5 }}>ROUND 1 OF 5</span>
                <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>ATS Resume Screening & Real GitHub Verification</h2>
              </div>
            </div>

            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.5, marginBottom: "1.5rem" }}>
              Every skill and project claim is cross-referenced against your resume text and live GitHub public repositories. Missing or contradictory repos are flagged.
            </p>

            {/* Target Settings Config */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: "1.5rem" }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 4 }}>
                  TARGET COMPANY
                </label>
                <input
                  type="text"
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "white", fontSize: 12, boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 4 }}>
                  TARGET HIRING BAR
                </label>
                <select
                  value={targetTier}
                  onChange={(e) => setTargetTier(e.target.value as CompanyTier)}
                  style={{ width: "100%", padding: "8px 12px", background: "rgba(15,23,42,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "white", fontSize: 12, boxSizing: "border-box" }}
                >
                  <option value="Tier 1 FAANG">Tier 1 FAANG / Extreme Bar</option>
                  <option value="High-Growth Product / FinTech">High-Growth Product / FinTech</option>
                  <option value="Enterprise Service">Enterprise Service (TCS, Infosys, Wipro)</option>
                </select>
              </div>
            </div>

            {/* GitHub URL Input */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#38bdf8", display: "block", marginBottom: 4 }}>
                GITHUB PROFILE URL / USERNAME (FOR LIVE REPO VERIFICATION)
              </label>
              <input
                type="text"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/your-username (or leave empty)"
                style={{ width: "100%", padding: "8px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(56,189,248,0.3)", borderRadius: 8, color: "white", fontSize: 12, boxSizing: "border-box" }}
              />
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 4, display: "block" }}>
                Optional. If omitted, skills are scored purely on resume text without penalization.
              </span>
            </div>

            {/* Resume Text Input */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 4 }}>
                RESUME TEXT CONTENT
              </label>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                rows={5}
                style={{ width: "100%", padding: "0.85rem 1rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "white", fontSize: 12, lineHeight: 1.6, resize: "none", boxSizing: "border-box" }}
              />
            </div>

            {!resumeResult ? (
              <button
                onClick={handleRunScreening}
                disabled={screeningLoading}
                style={{ width: "100%", padding: "0.95rem", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "white", fontSize: 13, fontWeight: 800, cursor: screeningLoading ? "not-allowed" : "pointer" }}
              >
                {screeningLoading ? "Auditing Resume & Verifying GitHub..." : "Run Resume Screening & GitHub Audit ➔"}
              </button>
            ) : (
              <div>
                <div style={{ padding: "1.25rem", borderRadius: 14, background: resumeResult.result === "pass" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)", border: `1.5px solid ${resumeResult.result === "pass" ? "#10b981" : "#f59e0b"}40`, marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: resumeResult.result === "pass" ? "#34d399" : "#fbbf24", textTransform: "uppercase" }}>
                      {resumeResult.result === "pass" ? "✓ SCREENING AUDITED" : "⚠ BORDERLINE SCREENING"}
                    </span>
                    <span style={{ fontSize: 16, fontWeight: 900, color: "white" }}>
                      {resumeResult.score}/100
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.5, margin: "0 0 8px" }}>
                    {resumeResult.evidence}
                  </p>

                  {/* GitHub Verification Card */}
                  {resumeResult.github_verification && (
                    <div style={{ marginTop: 10, padding: "8px 12px", background: "rgba(0,0,0,0.3)", borderRadius: 8, fontSize: 11 }}>
                      <strong style={{ color: "#38bdf8" }}>GitHub Evidence Check:</strong> {resumeResult.github_verification.summary}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setCurrentRound(2)}
                  style={{ width: "100%", padding: "0.95rem", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#10b981,#059669)", color: "white", fontSize: 13, fontWeight: 800, cursor: "pointer" }}
                >
                  Advance to Round 2: Online Assessment ➔
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/* ROUND 2: ONLINE ASSESSMENT (TIMED + DYNAMIC)  */}
        {/* ═══════════════════════════════════════════════ */}
        {currentRound === 2 && oaSession && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* OA Header Banner with Live Timer */}
            <div style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 24 }}>⚡</span>
                  <div>
                    <span style={{ fontSize: 10, color: "#f43f5e", fontWeight: 800, letterSpacing: 1.5 }}>ROUND 2 OF 5</span>
                    <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>Online Assessment: Timed Aptitude & Coding Suite</h2>
                  </div>
                </div>

                {/* Hard Server Timer Badge */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(0,0,0,0.4)", padding: "6px 14px", borderRadius: 10, border: `1px solid ${oaElapsedSeconds >= oaSession.minTimeSeconds ? "#10b981" : "#f59e0b"}` }}>
                  <span style={{ fontSize: 14 }}>⏱️</span>
                  <div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>SESSION TIMER</div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: oaElapsedSeconds >= oaSession.minTimeSeconds ? "#34d399" : "#fbbf24" }}>
                      {Math.floor(oaElapsedSeconds / 60)}m {oaElapsedSeconds % 60}s / {Math.floor(oaSession.minTimeSeconds / 60)}m min
                    </div>
                  </div>
                </div>
              </div>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: 0 }}>
                Calibrated to {oaSession.companyTier}. All {oaSession.aptitudeQuestions.length} aptitude questions must be answered and coding must be executed against the test suite.
              </p>
            </div>

            {oaWarning && (
              <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", borderRadius: 10, color: "#fca5a5", fontSize: 12 }}>
                ⚠️ {oaWarning}
              </div>
            )}

            {/* Section A: Aptitude Questions */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ fontSize: 11, color: "#818cf8", fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" }}>
                  SECTION A: APTITUDE & LOGICAL REASONING ({oaSession.aptitudeQuestions.length} QUESTIONS)
                </span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
                  {Object.keys(oaAnswers).length}/{oaSession.aptitudeQuestions.length} Attempted
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {oaSession.aptitudeQuestions.map((q, idx) => (
                  <div key={q.id} style={{ padding: "1rem", background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>
                        Q{idx + 1} • {q.topic} ({q.difficulty})
                      </span>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "white", marginBottom: 10 }}>
                      {q.question}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                      {q.options.map((opt, oIdx) => {
                        const sel = oaAnswers[q.id] === oIdx;
                        return (
                          <div
                            key={oIdx}
                            onClick={() => setOaAnswers((prev) => ({ ...prev, [q.id]: oIdx }))}
                            style={{
                              padding: "8px 12px",
                              borderRadius: 8,
                              border: `1px solid ${sel ? "#6366f1" : "rgba(255,255,255,0.08)"}`,
                              background: sel ? "rgba(99,102,241,0.2)" : "transparent",
                              color: sel ? "white" : "rgba(255,255,255,0.7)",
                              fontSize: 12,
                              cursor: "pointer",
                            }}
                          >
                            {opt}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section B: Algorithmic Coding Problems (Real blank code, not pre-solved) */}
            {currentCodingProblem && (
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <span style={{ fontSize: 11, color: "#34d399", fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" }}>
                    SECTION B: ALGORITHMIC CODING ({oaSession.codingProblems.length} PROBLEMS)
                  </span>

                  {/* Problem Tabs */}
                  <div style={{ display: "flex", gap: 6 }}>
                    {oaSession.codingProblems.map((p, pIdx) => {
                      const isActive = activeCodingProblemIdx === pIdx;
                      const res = codingResults[p.id];
                      return (
                        <button
                          key={p.id}
                          onClick={() => setActiveCodingProblemIdx(pIdx)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer",
                            background: isActive ? "#6366f1" : "rgba(255,255,255,0.04)",
                            border: `1px solid ${isActive ? "#818cf8" : "rgba(255,255,255,0.08)"}`,
                            color: "white",
                          }}
                        >
                          Problem {pIdx + 1} {res ? (res.passed === res.total ? "✓" : "✗") : ""}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Problem Description */}
                <div style={{ marginBottom: 14, padding: "1rem", background: "rgba(0,0,0,0.2)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: "white", marginBottom: 4 }}>
                    {currentCodingProblem.title} ({currentCodingProblem.difficulty})
                  </div>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", margin: "0 0 10px", whiteSpace: "pre-wrap" }}>
                    {currentCodingProblem.description}
                  </p>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                    <strong>Example:</strong> {currentCodingProblem.examples[0]?.input} ➔ {currentCodingProblem.examples[0]?.output}
                  </div>
                </div>

                {/* Language Switcher */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Write your solution below:</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    {(["python", "javascript"] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setCodingLang(lang)}
                        style={{
                          padding: "3px 8px",
                          borderRadius: 6,
                          fontSize: 10,
                          fontWeight: 700,
                          cursor: "pointer",
                          background: codingLang === lang ? "#818cf8" : "rgba(255,255,255,0.04)",
                          border: "none",
                          color: "white",
                        }}
                      >
                        {lang.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Code Editor */}
                <textarea
                  value={codingCodes[currentCodingProblem.id]?.[codingLang] || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCodingCodes((prev) => ({
                      ...prev,
                      [currentCodingProblem.id]: {
                        ...prev[currentCodingProblem.id],
                        [codingLang]: val,
                      },
                    }));
                  }}
                  rows={10}
                  style={{
                    width: "100%",
                    padding: "1rem",
                    background: "#0a0c16",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    color: "#86efac",
                    fontFamily: "monospace",
                    fontSize: 12,
                    lineHeight: 1.5,
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />

                {/* Execution Bar */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
                  <button
                    onClick={handleRunCodingTests}
                    disabled={codingRunning}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 8,
                      border: "none",
                      background: "linear-gradient(135deg,#6366f1,#4f46e5)",
                      color: "white",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: codingRunning ? "not-allowed" : "pointer",
                    }}
                  >
                    {codingRunning ? "Testing Against Suite..." : "▶ Run Test Suite"}
                  </button>

                  {codingResults[currentCodingProblem.id] && (
                    <span style={{ fontSize: 12, fontWeight: 800, color: codingResults[currentCodingProblem.id].passed === codingResults[currentCodingProblem.id].total ? "#34d399" : "#f87171" }}>
                      {codingResults[currentCodingProblem.id].passed}/{codingResults[currentCodingProblem.id].total} Test Cases Passed
                    </span>
                  )}
                </div>

                {/* Test Run Logs */}
                {codingResults[currentCodingProblem.id]?.logs && (
                  <div style={{ marginTop: 10, padding: "8px 12px", background: "#050711", borderRadius: 8, fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.8)", whiteSpace: "pre-wrap" }}>
                    {codingResults[currentCodingProblem.id].logs.join("\n")}
                  </div>
                )}
              </div>
            )}

            {/* Submission / Gating Actions */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleSubmitOA}
                style={{
                  flex: 2,
                  padding: "1rem",
                  borderRadius: 12,
                  border: "none",
                  background: oaElapsedSeconds >= oaSession.minTimeSeconds && Object.keys(codingResults).length > 0 && Object.keys(oaAnswers).length >= oaSession.aptitudeQuestions.length
                    ? "linear-gradient(135deg,#10b981,#059669)"
                    : "rgba(255,255,255,0.1)",
                  color: "white",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                {oaElapsedSeconds < oaSession.minTimeSeconds
                  ? `⏳ Minimum Assessment Time (${Math.floor(oaElapsedSeconds / 60)}m/${Math.floor(oaSession.minTimeSeconds / 60)}m) — Finish Testing`
                  : "Submit OA & Advance to Round 3: Group Discussion ➔"}
              </button>

              <button
                onClick={() => {
                  initGD();
                  setCurrentRound(3);
                }}
                style={{
                  flex: 1,
                  padding: "1rem",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "transparent",
                  color: "#94a3b8",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Skip OA (Mark as Not Attempted)
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/* ROUND 3: GROUP DISCUSSION (GD) ARENA */}
        {/* ═══════════════════════════════════════════════ */}
        {currentRound === 3 && (
          <div style={{ maxWidth: 840, margin: "0 auto", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "1.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 26 }}>🗣️</span>
                <div>
                  <span style={{ fontSize: 10, color: "#10b981", fontWeight: 800, letterSpacing: 1.5 }}>ROUND 3 OF 5</span>
                  <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>Campus Placement Group Discussion (GD)</h2>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>ARTICULATION SCORE</div>
                <div style={{ fontSize: 15, fontWeight: 900, color: gdArticulationScore !== null ? "#34d399" : "#94a3b8" }}>
                  {gdArticulationScore !== null ? `${gdArticulationScore}/100` : "Not Attempted"}
                </div>
              </div>
            </div>

            <div style={{ padding: "8px 12px", background: "rgba(99,102,241,0.08)", borderRadius: 10, fontSize: 12, color: "#c7d2fe", marginBottom: 14 }}>
              <strong>Topic:</strong> {gdTopicLoading ? `Generating fresh calibrated topic for ${targetCompany}...` : gdTopic}
            </div>

            {gdWarning && (
              <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", borderRadius: 10, color: "#fca5a5", fontSize: 12, marginBottom: 14 }}>
                ⚠️ {gdWarning}
              </div>
            )}

            {/* Live Chat / Transcript Area */}
            <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 14, padding: "1rem", height: 320, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, marginBottom: 14, border: "1px solid rgba(255,255,255,0.05)" }}>
              {gdMessages.map((m, mIdx) => {
                const isCandidate = m.speaker.includes("Candidate") || m.role === "Candidate";
                return (
                  <div key={mIdx} style={{ display: "flex", gap: 8, alignItems: "flex-start", alignSelf: isCandidate ? "flex-end" : "flex-start", maxWidth: "85%" }}>
                    {!isCandidate && <span style={{ fontSize: 20 }}>{m.avatar || "👤"}</span>}
                    <div style={{ background: isCandidate ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.05)", padding: "8px 12px", borderRadius: 12, border: `1px solid ${isCandidate ? "#6366f1" : "rgba(255,255,255,0.08)"}` }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: isCandidate ? "#818cf8" : "#94a3b8", marginBottom: 2 }}>
                        {m.speaker} {m.role ? `• ${m.role}` : ""}
                      </div>
                      <div style={{ fontSize: 12, color: "white", lineHeight: 1.4 }}>
                        {m.content}
                      </div>
                    </div>
                    {isCandidate && <span style={{ fontSize: 20 }}>🧑</span>}
                  </div>
                );
              })}
            </div>

            {/* Candidate Intervention Input */}
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <input
                type="text"
                value={gdInput}
                onChange={(e) => setGdInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendGDTurn()}
                placeholder="Intervene in the debate (e.g. 'To synthesize both points, starting with a modular monolith...')"
                style={{ flex: 1, padding: "10px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "white", fontSize: 12 }}
              />
              <button
                onClick={handleSendGDTurn}
                disabled={gdSending || !gdInput.trim()}
                style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#6366f1,#4f46e5)", color: "white", fontSize: 12, fontWeight: 800, cursor: (gdSending || !gdInput.trim()) ? "not-allowed" : "pointer" }}
              >
                {gdSending ? "Responding..." : "Intervene ➔"}
              </button>
            </div>

            {gdFeedback && (
              <div style={{ padding: "8px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 8, fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: "1.5rem" }}>
                💡 <strong>Panel Feedback:</strong> {gdFeedback}
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => handleAdvanceFromGD(false)}
                style={{ flex: 2, padding: "0.95rem", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#10b981,#059669)", color: "white", fontSize: 13, fontWeight: 800, cursor: "pointer" }}
              >
                Conclude GD & Advance to Round 4: Technical Interview ➔
              </button>

              <button
                onClick={() => handleAdvanceFromGD(true)}
                style={{ flex: 1, padding: "0.95rem", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#94a3b8", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                Skip GD (Mark as Not Attempted)
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/* ROUND 4: TECHNICAL INTERVIEW (PRESERVED)      */}
        {/* ═══════════════════════════════════════════════ */}
        {currentRound === 4 && (
          <div style={{ maxWidth: 840, margin: "0 auto", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "1.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 26 }}>💻</span>
                <div>
                  <span style={{ fontSize: 10, color: "#38bdf8", fontWeight: 800, letterSpacing: 1.5 }}>ROUND 4 OF 5</span>
                  <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>Technical Interview & System Boundaries</h2>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>LIVE TECH SCORE</div>
                <div style={{ fontSize: 15, fontWeight: 900, color: techScore !== null ? "#38bdf8" : "#94a3b8" }}>
                  {techScore !== null ? `${techScore}/100` : "Not Attempted"}
                </div>
              </div>
            </div>

            {techWarning && (
              <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", borderRadius: 10, color: "#fca5a5", fontSize: 12, marginBottom: 14 }}>
                ⚠️ {techWarning}
              </div>
            )}

            {/* Conversation Log */}
            <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 14, padding: "1rem", height: 320, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, marginBottom: 14, border: "1px solid rgba(255,255,255,0.05)" }}>
              {techMessages.map((m, idx) => {
                const isUser = m.role === "user";
                return (
                  <div key={idx} style={{ display: "flex", gap: 8, alignItems: "flex-start", alignSelf: isUser ? "flex-end" : "flex-start", maxWidth: "85%" }}>
                    {!isUser && <span style={{ fontSize: 20 }}>🧑‍💻</span>}
                    <div style={{ background: isUser ? "rgba(56,189,248,0.25)" : "rgba(255,255,255,0.05)", padding: "8px 12px", borderRadius: 12, border: `1px solid ${isUser ? "#38bdf8" : "rgba(255,255,255,0.08)"}` }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: isUser ? "#38bdf8" : "#94a3b8", marginBottom: 2 }}>
                        {isUser ? "You (Candidate)" : "Principal Interviewer"}
                      </div>
                      <div style={{ fontSize: 12, color: "white", lineHeight: 1.4 }}>{m.content}</div>
                    </div>
                    {isUser && <span style={{ fontSize: 20 }}>🧑</span>}
                  </div>
                );
              })}
            </div>

            {/* Technical Answer Input */}
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <textarea
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                placeholder="Articulate your technical solution, time/space complexity, and architecture trade-offs..."
                rows={3}
                style={{ flex: 1, padding: "10px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "white", fontSize: 12, resize: "none" }}
              />
              <button
                onClick={handleSendTechAnswer}
                disabled={techLoading || !techInput.trim()}
                style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#38bdf8,#0284c7)", color: "white", fontSize: 12, fontWeight: 800, cursor: (techLoading || !techInput.trim()) ? "not-allowed" : "pointer" }}
              >
                {techLoading ? "Evaluating..." : "Submit Answer ➔"}
              </button>
            </div>

            {techAssessment && (
              <div style={{ padding: "8px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 8, fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: "1.5rem" }}>
                <strong>Live Assessment:</strong> {techAssessment.answer_quality?.toUpperCase()} — {techAssessment.reasoning}
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => handleAdvanceFromTech(false)}
                style={{ flex: 2, padding: "0.95rem", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#10b981,#059669)", color: "white", fontSize: 13, fontWeight: 800, cursor: "pointer" }}
              >
                Conclude Tech Round & Advance to Round 5: HR Interview ➔
              </button>

              <button
                onClick={() => handleAdvanceFromTech(true)}
                style={{ flex: 1, padding: "0.95rem", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#94a3b8", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                Skip Tech (Mark as Not Attempted)
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/* ROUND 5: HR / BEHAVIORAL INTERVIEW */}
        {/* ═══════════════════════════════════════════════ */}
        {currentRound === 5 && (
          <div style={{ maxWidth: 800, margin: "0 auto", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 26 }}>🤝</span>
                <div>
                  <span style={{ fontSize: 10, color: "#ec4899", fontWeight: 800, letterSpacing: 1.5 }}>ROUND 5 OF 5</span>
                  <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>HR & Cultural Bar-Raiser Interview</h2>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>HR SCORE</div>
                <div style={{ fontSize: 15, fontWeight: 900, color: hrScore !== null ? "#ec4899" : "#94a3b8" }}>
                  {hrScore !== null ? `${hrScore}/100` : "Not Attempted"}
                </div>
              </div>
            </div>

            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.5, marginBottom: "1.5rem" }}>
              Conditioned on your prior technical round performance at {targetCompany}. Answer in STAR format (Situation, Task, Action, Result).
            </p>

            {hrWarning && (
              <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", borderRadius: 10, color: "#fca5a5", fontSize: 12, marginBottom: "1.5rem" }}>
                ⚠️ {hrWarning}
              </div>
            )}

            {hrLoading && (
              <div style={{ padding: "1.5rem", textAlign: "center", color: "#f472b6", fontSize: 13, background: "rgba(236,72,153,0.05)", borderRadius: 12, marginBottom: "1.5rem" }}>
                ⏳ Generating context-conditioned HR questions for {targetCompany}...
              </div>
            )}

            {/* Questions list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: "2rem" }}>
              {hrQuestions.length > 0 ? (
                hrQuestions.map((q, qIdx) => (
                  <div key={q.id || qIdx} style={{ padding: "1rem", background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#f472b6", marginBottom: 4 }}>
                      Question {qIdx + 1}: {q.competency}
                    </div>
                    <div style={{ fontSize: 12, color: "white", marginBottom: 8, lineHeight: 1.4 }}>
                      {q.question}
                    </div>
                    <textarea
                      value={hrAnswers[qIdx] || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setHrAnswers((prev) => {
                          const copy = [...prev];
                          copy[qIdx] = val;
                          return copy;
                        });
                      }}
                      rows={3}
                      placeholder={q.guidance_placeholder || "Describe Situation, Task, Action ('I decided to...'), and Result..."}
                      style={{ width: "100%", padding: "8px 12px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "white", fontSize: 12, boxSizing: "border-box", resize: "none" }}
                    />
                  </div>
                ))
              ) : !hrLoading && !hrError ? (
                <div style={{ padding: "1rem", textAlign: "center" }}>
                  <button
                    onClick={initHR}
                    style={{ padding: "8px 16px", borderRadius: 8, background: "#ec4899", border: "none", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                  >
                    Generate Context Questions for {targetCompany}
                  </button>
                </div>
              ) : null}
            </div>

            <button
              onClick={handleGenerateFinalReport}
              disabled={generatingReport || hrLoading}
              style={{ width: "100%", padding: "1rem", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#6366f1,#a855f7)", color: "white", fontSize: 14, fontWeight: 800, cursor: (generatingReport || hrLoading) ? "not-allowed" : "pointer" }}
            >
              {generatingReport ? "Synthesizing Final Holistic Report..." : "Complete Simulation & Generate Holistic Report ➔"}
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/* ROUND 6: THE FINAL HOLISTIC REPORT */}
        {/* ═══════════════════════════════════════════════ */}
        {currentRound === 6 && holisticReport && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* REALISTIC OUTCOME BANNER */}
            <div
              style={{
                padding: "1.75rem 2rem",
                borderRadius: 20,
                background: holisticReport.realistic_outcome.would_be_selected
                  ? "rgba(16,185,129,0.1)"
                  : "rgba(239,68,68,0.1)",
                border: `2px solid ${holisticReport.realistic_outcome.would_be_selected ? "#10b981" : "#ef4444"}50`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 8 }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 900,
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    padding: "4px 12px",
                    borderRadius: 999,
                    background: holisticReport.realistic_outcome.would_be_selected ? "#10b981" : "#ef4444",
                    color: "white",
                  }}
                >
                  {holisticReport.realistic_outcome.would_be_selected
                    ? "✓ REALISTIC OUTCOME: CANDIDATE OFFER RECOMMENDED"
                    : `✗ REALISTIC OUTCOME: ELIMINATED AT ${holisticReport.realistic_outcome.likely_elimination_round?.replace("_", " ").toUpperCase()}`}
                </span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                  Audited against {holisticReport.target_role_and_company_tier}
                </span>
              </div>

              <h2 style={{ fontSize: 18, fontWeight: 800, margin: "10px 0 6px", color: "white" }}>
                Honest Recruitment Reality Check
              </h2>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.6, margin: 0 }}>
                {holisticReport.realistic_outcome.reasoning}
              </p>
            </div>

            {/* 5-DIMENSION SCORECARD */}
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>
                Per-Dimension Breakdown (Real Participation Gated)
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                {/* 1. Resume */}
                <div style={{ padding: "1.25rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>1. RESUME (ATS)</span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: holisticReport.round_results.resume_screening.result === "pass" ? "#34d399" : holisticReport.round_results.resume_screening.result === "not_attempted" ? "#f59e0b" : "#f87171", textTransform: "uppercase" }}>
                      {holisticReport.round_results.resume_screening.result.replace("_", " ")}
                    </span>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "white", marginBottom: 4 }}>
                    {holisticReport.round_results.resume_screening.score !== null ? `${holisticReport.round_results.resume_screening.score}/100` : "Not Attempted"}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.4 }}>
                    {holisticReport.round_results.resume_screening.evidence}
                  </div>
                </div>

                {/* 2. Online Assessment */}
                <div style={{ padding: "1.25rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>2. ONLINE ASSESSMENT</span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: holisticReport.round_results.online_assessment.result === "pass" ? "#34d399" : holisticReport.round_results.online_assessment.result === "not_attempted" ? "#f59e0b" : "#f87171", textTransform: "uppercase" }}>
                      {holisticReport.round_results.online_assessment.result.replace("_", " ")}
                    </span>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "white", marginBottom: 4 }}>
                    {holisticReport.round_results.online_assessment.coding_problems_solved}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.4 }}>
                    {holisticReport.round_results.online_assessment.aptitude_score !== null
                      ? `Aptitude: ${holisticReport.round_results.online_assessment.aptitude_score}/100 · Coding: ${holisticReport.round_results.online_assessment.coding_score}/100`
                      : "Round was skipped without submitting answers."}
                  </div>
                </div>

                {/* 3. Group Discussion */}
                <div style={{ padding: "1.25rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>3. GROUP DISCUSSION</span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: holisticReport.round_results.group_discussion.result === "pass" ? "#34d399" : holisticReport.round_results.group_discussion.result === "not_attempted" ? "#f59e0b" : "#f87171", textTransform: "uppercase" }}>
                      {holisticReport.round_results.group_discussion.result.replace("_", " ")}
                    </span>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "white", marginBottom: 4 }}>
                    {holisticReport.round_results.group_discussion.articulation_score !== null ? `${holisticReport.round_results.group_discussion.articulation_score}/100` : "Not Attempted"}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.4 }}>
                    {holisticReport.round_results.group_discussion.specific_feedback}
                  </div>
                </div>

                {/* 4. Technical Interview */}
                <div style={{ padding: "1.25rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>4. TECHNICAL INTERVIEW</span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: holisticReport.round_results.technical_interview.result === "pass" ? "#34d399" : holisticReport.round_results.technical_interview.result === "not_attempted" ? "#f59e0b" : "#f87171", textTransform: "uppercase" }}>
                      {holisticReport.round_results.technical_interview.result.replace("_", " ")}
                    </span>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "white", marginBottom: 4 }}>
                    {holisticReport.round_results.technical_interview.score !== null ? `${holisticReport.round_results.technical_interview.score}/100` : "Not Attempted"}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.4 }}>
                    {holisticReport.round_results.technical_interview.specific_examples}
                  </div>
                </div>

                {/* 5. HR Interview */}
                <div style={{ padding: "1.25rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>5. HR INTERVIEW</span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: holisticReport.round_results.hr_interview.result === "pass" ? "#34d399" : holisticReport.round_results.hr_interview.result === "not_attempted" ? "#f59e0b" : "#f87171", textTransform: "uppercase" }}>
                      {holisticReport.round_results.hr_interview.result.replace("_", " ")}
                    </span>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "white", marginBottom: 4 }}>
                    {holisticReport.round_results.hr_interview.score !== null ? `${holisticReport.round_results.hr_interview.score}/100` : "Not Attempted"}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.4 }}>
                    {holisticReport.round_results.hr_interview.specific_feedback}
                  </div>
                </div>
              </div>
            </div>

            {/* RECOMMENDATIONS LIST */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "1.5rem" }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 12px", color: "#818cf8" }}>
                Targeted Action Plan & Recommended Focus
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {holisticReport.recommended_focus.map((rec, rIdx) => (
                  <div key={rIdx} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.85)" }}>
                    <span style={{ color: "#34d399", fontWeight: 800 }}>#{rIdx + 1}</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={() => {
                  setResumeResult(null);
                  setOaAnswers({});
                  setCodingResults({});
                  setGdMessages([]);
                  setTechMessages([]);
                  setHrAnswers([]);
                  setHolisticReport(null);
                  setCurrentRound(1);
                }}
                style={{ padding: "0.85rem 1.5rem", borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#4f46e5)", border: "none", color: "white", fontSize: 13, fontWeight: 800, cursor: "pointer" }}
              >
                🔄 Launch New Simulation Session
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default function StudentSimulationPage() {
  return (
    <Suspense fallback={<div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>Loading simulation arena...</div>}>
      <SimulationContent />
    </Suspense>
  );
}
