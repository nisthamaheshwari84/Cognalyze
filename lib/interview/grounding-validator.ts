/**
 * Grounding Validator — Question Grounding & Anti-Hallucination Guard
 *
 * Intercepts interviewer questions before they reach the candidate.
 * Validates that every project inquiry strictly respects the project's actual tech stack
 * and rejects cross-project tech transfer hallucinations (e.g. ChatDesk + Redis).
 */

import { ClaimLedger, ProjectClaim } from "./ground-truth-service";

export interface GroundingValidationResult {
  isValid: boolean;
  violationType?:
    | "TECH_TRANSFER_HALLUCINATION"
    | "PROHIBITED_TECH_FOR_PROJECT"
    | "EXCESSIVE_SKILL_DEMAND"
    | "UNCLAIMED_TECHNOLOGY";
  reason?: string;
  targetProject?: string;
  offendingTech?: string;
  suggestedRepair?: string;
}

export function validateQuestionGrounding(
  questionText: string,
  claimLedger: ClaimLedger
): GroundingValidationResult {
  const qLower = questionText.toLowerCase();

  // 1. Check for universally disallowed / hallucinated technologies (e.g. DistilBERT, BERT intent classifier)
  const universalDisallowed = [
    { tech: "distilbert", name: "DistilBERT" },
    { tech: "intent classifier", name: "Intent Classifier" },
    { tech: "bert", name: "BERT" },
    { tech: "kubernetes", name: "Kubernetes" },
  ];

  for (const item of universalDisallowed) {
    // If the candidate didn't claim this tech anywhere
    const candidateHasTech = claimLedger.skills.some((s) =>
      s.name.toLowerCase().includes(item.tech)
    );
    if (!candidateHasTech && qLower.includes(item.tech)) {
      // Check if it's explicitly framed as an exploratory hypothetical
      const isHypothetical =
        qLower.includes("if you had to") ||
        qLower.includes("hypothetically") ||
        qLower.includes("how would you choose between");
      if (!isHypothetical) {
        return {
          isValid: false,
          violationType: "UNCLAIMED_TECHNOLOGY",
          offendingTech: item.name,
          reason: `Candidate did not claim ${item.name} in resume. Question falsely assumes candidate built with it.`,
          suggestedRepair: `In your projects, how did you handle natural language processing or LLM prompting?`,
        };
      }
    }
  }

  // 2. Project-Specific Technology Isolation (Anti-Tech-Transfer)
  for (const project of claimLedger.projects) {
    const projNameMatch = new RegExp(`\\b${project.name}\\b`, "i").test(questionText);
    if (projNameMatch) {
      // Check forbidden technologies for this specific project
      for (const forbidden of project.forbiddenTech) {
        const forbiddenMatch = new RegExp(`\\b${forbidden}\\b`, "i").test(questionText);
        if (forbiddenMatch) {
          // Cross-project check: does another project actually own this tech?
          const rightfulProject = claimLedger.projects.find((p) =>
            p.techStack.some((t) => t.toLowerCase() === forbidden.toLowerCase())
          );

          let suggestedRepair: string;
          if (rightfulProject) {
            suggestedRepair = questionText.replace(
              new RegExp(`\\b${project.name}\\b`, "gi"),
              rightfulProject.name
            );
          } else {
            suggestedRepair = `In your ${project.name} project, how did you handle state and concurrent connections using ${project.techStack.slice(0, 3).join(", ")}?`;
          }

          return {
            isValid: false,
            violationType: "TECH_TRANSFER_HALLUCINATION",
            targetProject: project.name,
            offendingTech: forbidden,
            reason: `Tech transfer hallucination: ${forbidden} was attributed to ${project.name}. ${project.name} does not use ${forbidden}.`,
            suggestedRepair,
          };
        }
      }
    }
  }

  // 3. Excessive Skill Demand check (e.g. Docker Beginner vs Expert cluster orchestration)
  const dockerSkill = claimLedger.skills.find(
    (s) => s.name.toLowerCase() === "docker"
  );
  if (dockerSkill && dockerSkill.proficiency === "beginner") {
    const isDemandingExpertDocker =
      qLower.includes("docker swarm") ||
      qLower.includes("multi-stage build optimization for production clusters") ||
      qLower.includes("kubernetes cluster orchestration");
    if (isDemandingExpertDocker) {
      return {
        isValid: false,
        violationType: "EXCESSIVE_SKILL_DEMAND",
        offendingTech: "Docker",
        reason: `Docker skill is declared as beginner. Question demands advanced cluster/orchestration architecture.`,
        suggestedRepair: `How did you use Docker to containerize your local development environment?`,
      };
    }
  }

  return { isValid: true };
}

export function repairUngroundedQuestion(
  questionText: string,
  claimLedger: ClaimLedger
): string {
  const result = validateQuestionGrounding(questionText, claimLedger);
  if (result.isValid) return questionText;
  return result.suggestedRepair || questionText;
}

