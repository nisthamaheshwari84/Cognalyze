/**
 * lib/ai/company-intelligence.ts
 * 
 * Company Intelligence Resolver for Cognalyze Personalized Interview Arena.
 * 
 * Provides verified interview styles, evaluation dimensions, and company-specific patterns.
 * Explicitly distinguishes verified company intelligence from role-specific industry patterns.
 * Never fabricates fake interview questions.
 */

import { getCompanyDirectory, CompanyDirectoryEntry } from "@/lib/skills/company-directory";
import { COMPANY_PREP_GUIDES } from "@/lib/company-prep-data";
import { CompanyPrepGuide } from "@/lib/question-bank-types";

export interface CompanyIntelligenceProfile {
  companyName: string;
  isVerifiedCompany: boolean;
  sectorLabel: string;
  cultureAndEmphasis: string;
  evaluationDimensions: string[];
  verifiedCoreTopics: string[];
  sourceAttribution?: string;
  interviewVibe: "algorithmic_rigor" | "high_scale_systems" | "pragmatic_velocity" | "enterprise_reliability" | "product_domain_depth";
}

/**
 * Resolves comprehensive interview intelligence for any requested company.
 */
export function resolveCompanyIntelligence(companyName?: string): CompanyIntelligenceProfile {
  const clean = (companyName || "").trim();
  const lower = clean.toLowerCase();

  if (!clean || lower === "general" || lower === "standard" || lower === "default") {
    return {
      companyName: "Tier-1 Industry Standard",
      isVerifiedCompany: false,
      sectorLabel: "General Technology Standards",
      cultureAndEmphasis: "Industry-standard engineering bar: clean code invariants, algorithmic correctness, modular architecture, and production testing.",
      evaluationDimensions: ["Correctness", "Code Quality", "Edge Case Handling", "Time & Space Complexity"],
      verifiedCoreTopics: ["Data Structures", "System Architecture", "API Design", "Database Fundamentals"],
      interviewVibe: "algorithmic_rigor",
    };
  }

  // 1. Startup & High-Velocity Environment Pattern
  if (/startup|early[- ]stage|stealth|seed|series\s*[a-b]|y\s*combinator|\byc\b|bootstrap/i.test(lower)) {
    return {
      companyName: clean || "High-Growth Startup",
      isVerifiedCompany: false,
      sectorLabel: "High-Growth Startup",
      cultureAndEmphasis: "Fast-paced startup engineering: high full-stack ownership, pragmatic trade-offs (build vs buy), dealing with ambiguity, shipping reliably under tight timelines, and hotfixing production outages.",
      evaluationDimensions: [
        "Full-Stack Ownership & Velocity",
        "Pragmatic Build vs Buy Decisions",
        "Ambiguity Navigation & Product Intuition",
        "Root Cause Production Debugging",
        "Cost & Resource Efficiency"
      ],
      verifiedCoreTopics: [
        "Rapid End-to-End Implementation",
        "API Integration & Webhooks",
        "Database Schema Iteration",
        "Production Incident Diagnosis",
        "Third-Party Service Resilience"
      ],
      interviewVibe: "pragmatic_velocity",
    };
  }

  // 2. Lookup in Cognalyze Verified Company Directory (65+ companies)
  const dir = getCompanyDirectory();
  const matchedEntry = dir.find((entry) => {
    const eName = entry.name.toLowerCase();
    const eSlug = entry.slug.toLowerCase();
    return (
      eName === lower ||
      eSlug === lower ||
      lower.includes(eName) ||
      eName.includes(lower)
    );
  });

  if (matchedEntry) {
    const isVerified = matchedEntry.status === "questions_available" || matchedEntry.status === "limited_sourced";
    
    // Check if rich prep guide exists
    const prepGuide = COMPANY_PREP_GUIDES[matchedEntry.slug];

    let vibe: CompanyIntelligenceProfile["interviewVibe"] = "algorithmic_rigor";
    if (matchedEntry.slug === "google") {
      vibe = "algorithmic_rigor";
    } else if (matchedEntry.slug === "amazon" || matchedEntry.slug === "meta" || matchedEntry.slug === "netflix" || matchedEntry.slug === "uber") {
      vibe = "high_scale_systems";
    } else if (matchedEntry.sector === "finance_quant") {
      vibe = "product_domain_depth";
    } else if (matchedEntry.sector === "it_services") {
      vibe = "enterprise_reliability";
    }

    return {
      companyName: matchedEntry.name,
      isVerifiedCompany: isVerified,
      sectorLabel: matchedEntry.sectorLabel,
      cultureAndEmphasis: `${matchedEntry.name} Interview Standard: ${matchedEntry.badge}. ${matchedEntry.assessmentFormat.description}`,
      evaluationDimensions: prepGuide
        ? prepGuide.topicWeightage.map((t) => `${t.topic} (${t.percentage}%)`)
        : [
            "Algorithmic Correctness & Bounds",
            "Optimal Data Structure Selection",
            "Architectural Invariants & Modularity",
            "Production Failure Handling",
          ],
      verifiedCoreTopics: matchedEntry.assessmentFormat.coreTopics || [],
      sourceAttribution: matchedEntry.sourceAttribution,
      interviewVibe: vibe,
    };
  }

  // 3. Fallback for uncatalogued enterprise or bespoke company name
  return {
    companyName: clean,
    isVerifiedCompany: false,
    sectorLabel: "Enterprise Technology & Product",
    cultureAndEmphasis: `${clean} Engineering Standards: Role-specific industry interview standards evaluating domain expertise, scalable architecture, and production resilience.`,
    evaluationDimensions: [
      "Domain Technical Competence",
      "System Scalability & Latency",
      "Code Reliability & Defensive Design",
      "Operational Observability",
    ],
    verifiedCoreTopics: ["System Design", "Domain Primitives", "Data Flow", "Resilience Patterns"],
    interviewVibe: "enterprise_reliability",
  };
}
