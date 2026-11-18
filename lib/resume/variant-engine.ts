/**
 * COGNALYZE RESUME INTELLIGENCE — COMPANY-SPECIFIC VARIANT ENGINE
 * 
 * Generates and manages tailored company-specific resume variants without
 * ever overwriting or contaminating the candidate's master resume.
 */

import { StructuredCandidateIntelligence } from "./candidate-intelligence";
import { OptimizedResumeContent, synthesizeOptimizedResumeContent } from "./content-engine";

export interface CompanyResumeVariant {
  variantId: string;
  candidateId: string;
  targetCompany: string;
  targetRole: string;
  seniorityLevel: string;
  variantName: string;
  content: OptimizedResumeContent;
  createdAt: string;
  updatedAt: string;
}

/**
 * Creates a company-tailored resume variant preserving master resume facts.
 */
export function createCompanyResumeVariant(params: {
  candidateIntel: StructuredCandidateIntelligence;
  targetCompany: string;
  targetRole: string;
  targetJdText?: string;
  seniorityLevel?: string;
}): CompanyResumeVariant {
  const {
    candidateIntel,
    targetCompany,
    targetRole,
    targetJdText = "",
    seniorityLevel = "mid",
  } = params;

  // Clone candidate intelligence to prevent master mutation
  const variantIntel: StructuredCandidateIntelligence = JSON.parse(JSON.stringify(candidateIntel));
  variantIntel.targetCompany = targetCompany;
  variantIntel.targetRole = targetRole;

  // Synthesize optimized content tailored to target JD
  const content = synthesizeOptimizedResumeContent(variantIntel, targetJdText);

  const timestamp = new Date().toISOString();
  const safeComp = targetCompany.replace(/[^a-zA-Z0-9]/g, "_");
  const variantId = `var_${candidateIntel.candidateId}_${safeComp}_${Date.now()}`;

  return {
    variantId,
    candidateId: candidateIntel.candidateId,
    targetCompany,
    targetRole,
    seniorityLevel,
    variantName: `${targetCompany} — ${targetRole}`,
    content,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

