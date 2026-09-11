export type RoundType =
  | "resume_screening"
  | "online_assessment"
  | "group_discussion"
  | "technical_interview"
  | "hr_interview";

export interface RoundEligibility {
  canScore: boolean;
  status: "attempted" | "not_attempted";
  reason: string;
  missingRequirements: string[];
  metrics?: Record<string, any>;
}

/**
 * Universal Shared Gating Function across all 5 recruitment simulation rounds.
 * Strictly prevents rounds from producing numeric scores or verdicts without real participation.
 */
export function canScoreRound(
  roundType: RoundType,
  sessionData: any
): RoundEligibility {
  const missing: string[] = [];

  if (!sessionData) {
    return {
      canScore: false,
      status: "not_attempted",
      reason: "No session data provided for evaluation.",
      missingRequirements: ["session_data"],
    };
  }

  switch (roundType) {
    case "resume_screening": {
      const resumeText = (sessionData.resume_text || sessionData.resumeText || "").trim();
      const screeningPerformed = Boolean(sessionData.screening_performed ?? sessionData.resumeResult ?? sessionData.score != null);

      if (resumeText.length < 50) {
        missing.push("Substantive resume text (minimum 50 characters required)");
      }
      if (!screeningPerformed) {
        missing.push("Resume screening audit must be explicitly executed for this session");
      }

      const canScore = missing.length === 0;
      return {
        canScore,
        status: canScore ? "attempted" : "not_attempted",
        reason: canScore
          ? "Resume verified and audited against target job description."
          : `Resume screening not attempted: ${missing.join(", ")}.`,
        missingRequirements: missing,
        metrics: { resumeLength: resumeText.length, screeningPerformed },
      };
    }

    case "online_assessment": {
      const answers = sessionData.oaAnswers || sessionData.answers || {};
      const totalAptitude = sessionData.totalAptitudeCount || sessionData.totalQuestions || 0;
      const answeredAptitude = Object.keys(answers).filter(
        (k) => typeof answers[k] === "number"
      ).length;

      const codingTested = Boolean(
        sessionData.codingPassCount !== null && sessionData.codingPassCount !== undefined
      ) || Boolean(sessionData.coding_submitted);

      const elapsedSeconds = Number(
        sessionData.timeElapsedSeconds || sessionData.elapsedSeconds || 0
      );
      // Configurable minimum time: in simulation mode default 180s (3m) or minTimeSeconds from session
      const minRequiredSeconds = Number(sessionData.minTimeSeconds ?? 180);

      if (totalAptitude > 0 && answeredAptitude < totalAptitude) {
        missing.push(
          `All aptitude questions must be attempted (${answeredAptitude}/${totalAptitude} answered)`
        );
      } else if (totalAptitude === 0 && answeredAptitude === 0) {
        missing.push("No aptitude questions attempted");
      }

      if (!codingTested) {
        missing.push("Algorithmic coding problem must be tested against the test suite");
      }

      if (elapsedSeconds < minRequiredSeconds) {
        missing.push(
          `Minimum assessment time not elapsed (${Math.floor(elapsedSeconds)}s / ${minRequiredSeconds}s required)`
        );
      }

      const canScore = missing.length === 0;
      return {
        canScore,
        status: canScore ? "attempted" : "not_attempted",
        reason: canScore
          ? `Online assessment completed with all ${answeredAptitude} questions and coding tests executed.`
          : `Online assessment incomplete: ${missing.join(", ")}.`,
        missingRequirements: missing,
        metrics: {
          answeredAptitude,
          totalAptitude,
          codingTested,
          elapsedSeconds,
          minRequiredSeconds,
        },
      };
    }

    case "group_discussion": {
      const messages: Array<{ speaker?: string; role?: string; content?: string }> =
        sessionData.gdMessages || sessionData.messages || [];

      // Count substantive candidate contributions (at least 15 characters)
      const candidateMessages = messages.filter((m) => {
        const isCandidate =
          (m.speaker && m.speaker.includes("Candidate")) ||
          (m.role && m.role.toLowerCase() === "candidate");
        const hasContent = (m.content || "").trim().length >= 15;
        return isCandidate && hasContent;
      });

      const requiredInterventions = 2;
      if (candidateMessages.length < requiredInterventions) {
        missing.push(
          `Candidate must make at least ${requiredInterventions} substantive debate interventions (made ${candidateMessages.length})`
        );
      }

      const canScore = missing.length === 0;
      return {
        canScore,
        status: canScore ? "attempted" : "not_attempted",
        reason: canScore
          ? `Group discussion completed with ${candidateMessages.length} substantive candidate interventions.`
          : `Group discussion not attempted: candidate did not actively participate in the room (${candidateMessages.length}/${requiredInterventions} interventions).`,
        missingRequirements: missing,
        metrics: {
          candidateInterventions: candidateMessages.length,
          requiredInterventions,
        },
      };
    }

    case "technical_interview": {
      const messages: Array<{ role?: string; content?: string }> =
        sessionData.techMessages || sessionData.messages || [];

      // Count candidate answers (role: "user") with at least 15 characters
      const candidateAnswers = messages.filter(
        (m) => m.role === "user" && (m.content || "").trim().length >= 15
      );

      const requiredAnswers = 2;
      if (candidateAnswers.length < requiredAnswers) {
        missing.push(
          `Candidate must answer at least ${requiredAnswers} technical questions (answered ${candidateAnswers.length})`
        );
      }

      const canScore = missing.length === 0;
      return {
        canScore,
        status: canScore ? "attempted" : "not_attempted",
        reason: canScore
          ? `Technical interview completed with ${candidateAnswers.length} responses.`
          : `Technical interview not attempted: candidate answered fewer than ${requiredAnswers} questions.`,
        missingRequirements: missing,
        metrics: {
          candidateAnswers: candidateAnswers.length,
          requiredAnswers,
        },
      };
    }

    case "hr_interview": {
      const questions = sessionData.hrQuestions || sessionData.questions || [];
      const answers: string[] = sessionData.hrAnswers || sessionData.answers || [];

      if (!Array.isArray(questions) || questions.length === 0) {
        missing.push("HR questions not generated or loaded");
      }

      let substantiveAnswers = 0;
      if (Array.isArray(answers)) {
        substantiveAnswers = answers.filter((a) => (a || "").trim().length >= 20).length;
      }

      const requiredCount = Math.max(1, questions.length);
      if (substantiveAnswers < requiredCount) {
        missing.push(
          `All HR questions must be answered with detailed STAR responses (${substantiveAnswers}/${requiredCount} answered)`
        );
      }

      const canScore = missing.length === 0;
      return {
        canScore,
        status: canScore ? "attempted" : "not_attempted",
        reason: canScore
          ? `HR interview completed with ${substantiveAnswers} STAR responses.`
          : `HR interview not attempted: ${missing.join(", ")}.`,
        missingRequirements: missing,
        metrics: {
          substantiveAnswers,
          requiredCount,
        },
      };
    }

    default:
      return {
        canScore: false,
        status: "not_attempted",
        reason: `Unknown round type: ${roundType}`,
        missingRequirements: ["valid_round_type"],
      };
  }
}
