/**
 * lib/skills/dsa-company-prep.ts
 * 
 * Scalable Company-Based DSA Preparation Engine for Cognalyze Programming Arena.
 * 
 * Permanently resolves the "limited to 16 questions" bug by integrating:
 * 1. Comprehensive 65+ Company Directory across Tier 1, Indian Tech, IT Services, and Quant Finance.
 * 2. Deep cross-mappings from the 455 Striver A2Z canonical problem catalog (1,002 company mappings).
 * 3. Transparent provenance attribution (verified_historical, community_reported, role_pattern).
 * 4. Honest reporting of companies awaiting data vs companies with verified sourced mappings.
 * 5. Full search, sector, difficulty, and stage filtering with pagination support.
 */

import {
  COMPANY_DIRECTORY,
  CompanyDirectoryEntry,
  CompanySector,
  CompanyDataStatus,
  getCompanyBySlug
} from "./company-directory";
import {
  getCompanyQuestions,
  CompanyProblemEntry,
  getTotalCompanyQuestionMappings,
  getDistinctCanonicalProblemCount,
  resolveCompanySlug
} from "./dsa-company-mappings";

export type CompanyCategory = "tier1_faang" | "fintech_product" | "enterprise_mass" | "quant_finance";
export type QuestionProvenance =
  | "historical_verified"
  | "historical_reported"
  | "curated_practice"
  | "ai_generated_fallback"
  | "verified_historical"
  | "community_reported"
  | "role_pattern"
  | "cognalyze_simulation";

export interface CompanyProblemMapping {
  problemId: string;
  title: string;
  stepTitle: string;
  subtopicTitle: string;
  difficulty: "easy" | "medium" | "hard";
  provenance: QuestionProvenance;
  provenanceNote: string;
  frequencyScore: number; // 1-100
  assessmentStage: "online_assessment" | "technical_round_1" | "technical_round_2" | "hiring_manager";
  problemUrl?: string;
  timeComplexity?: string;
  spaceComplexity?: string;
  roles?: string[];
}

export interface CompanyTrack {
  id: string;
  name: string;
  slug: string;
  category: CompanyCategory;
  categoryLabel: string;
  sector: CompanySector;
  status: CompanyDataStatus;
  statusLabel: string;
  badge: string;
  icon: string;
  accentColor: string;
  roles: string[];
  assessmentFormat: {
    oaDurationMinutes: number;
    oaQuestionCount: number;
    interviewRounds: number;
    coreTopics: string[];
    description: string;
  };
  problems: CompanyProblemMapping[];
  totalProblemsCount: number;
  sourceAttribution?: string;
}

/**
 * Maps a CompanyDirectoryEntry to a fully hydrated CompanyTrack.
 */
function buildCompanyTrack(entry: CompanyDirectoryEntry): CompanyTrack {
  const rawProblems = getCompanyQuestions(entry.slug);

  const mappedCategory: CompanyCategory = 
    entry.sector === "global_tech" ? "tier1_faang" :
    entry.sector === "india_product" ? "fintech_product" :
    entry.sector === "finance_quant" ? "quant_finance" : "enterprise_mass";

  const problems: CompanyProblemMapping[] = rawProblems.map((rp) => ({
    problemId: rp.problemId,
    title: rp.title,
    stepTitle: rp.stepTitle,
    subtopicTitle: rp.subtopicTitle,
    difficulty: rp.difficulty,
    provenance: rp.provenance as QuestionProvenance,
    provenanceNote: rp.provenanceNote,
    frequencyScore: rp.frequencyScore,
    assessmentStage: (rp.assessmentStage === "machine_coding_lld" || rp.assessmentStage === "system_architecture"
      ? "technical_round_2"
      : rp.assessmentStage === "bar_raiser"
      ? "hiring_manager"
      : rp.assessmentStage) as any,
    problemUrl: rp.problemUrl,
    timeComplexity: rp.timeComplexity,
    spaceComplexity: rp.spaceComplexity,
    roles: rp.roles
  }));

  return {
    id: entry.id,
    name: entry.name,
    slug: entry.slug,
    category: mappedCategory,
    categoryLabel: entry.sectorLabel,
    sector: entry.sector,
    status: problems.length > 0 ? "questions_available" : entry.status,
    statusLabel: problems.length > 0 ? "Questions Available" : entry.statusLabel,
    badge: entry.badge,
    icon: entry.icon,
    accentColor: entry.accentColor,
    roles: entry.primaryRoles,
    assessmentFormat: entry.assessmentFormat,
    problems,
    totalProblemsCount: problems.length,
    sourceAttribution: entry.sourceAttribution
  };
}

/**
 * Master catalog of all Company Tracks.
 */
export const COMPANY_TRACKS: CompanyTrack[] = COMPANY_DIRECTORY.map(buildCompanyTrack);

/**
 * Filter options for company tracks query.
 */
export interface CompanyTrackQueryOptions {
  sector?: CompanySector;
  category?: CompanyCategory;
  status?: CompanyDataStatus;
  searchQuery?: string;
  hasQuestionsOnly?: boolean;
}

/**
 * Returns all company tracks with optional filtering.
 */
export function getAllCompanyTracks(options: CompanyTrackQueryOptions = {}): CompanyTrack[] {
  let tracks = [...COMPANY_TRACKS];

  if (options.sector) {
    tracks = tracks.filter((t) => t.sector === options.sector);
  }

  if (options.category) {
    tracks = tracks.filter((t) => t.category === options.category);
  }

  if (options.status) {
    tracks = tracks.filter((t) => t.status === options.status);
  }

  if (options.hasQuestionsOnly) {
    tracks = tracks.filter((t) => t.problems.length > 0);
  }

  if (options.searchQuery) {
    const q = options.searchQuery.toLowerCase().trim();
    tracks = tracks.filter((t) => 
      t.name.toLowerCase().includes(q) ||
      t.slug.toLowerCase().includes(q) ||
      t.roles.some((r) => r.toLowerCase().includes(q))
    );
  }

  return tracks;
}

/**
 * Returns a single company track by its slug.
 */
export function getCompanyTrackBySlug(slug: string): CompanyTrack | undefined {
  const normalized = resolveCompanySlug(slug);
  const found = COMPANY_TRACKS.find((c) => c.slug.toLowerCase() === normalized);
  if (found) return found;

  // Fallback check against directory
  const dirEntry = getCompanyBySlug(normalized);
  if (dirEntry) {
    return buildCompanyTrack(dirEntry);
  }
  return undefined;
}

/**
 * Returns a company track by its id.
 */
export function getCompanyTrackById(id: string): CompanyTrack | undefined {
  return COMPANY_TRACKS.find((c) => c.id === id);
}

/**
 * Returns problems for a specific company with optional difficulty, stage, provenance, and role filters.
 */
export interface CompanyProblemFilters {
  difficulty?: "easy" | "medium" | "hard";
  stage?: string;
  provenance?: QuestionProvenance | "all";
  role?: string;
  limit?: number;
  offset?: number;
}

export function getProblemsForCompany(
  slug: string,
  filters: CompanyProblemFilters = {}
): {
  problems: CompanyProblemMapping[];
  totalCount: number;
  filteredCount: number;
} {
  const track = getCompanyTrackBySlug(slug);
  if (!track) return { problems: [], totalCount: 0, filteredCount: 0 };

  let filtered = [...track.problems];

  if (filters.difficulty) {
    filtered = filtered.filter((p) => p.difficulty === filters.difficulty);
  }

  if (filters.stage) {
    filtered = filtered.filter((p) => p.assessmentStage === filters.stage);
  }

  if (filters.provenance && filters.provenance !== "all") {
    filtered = filtered.filter((p) => p.provenance === filters.provenance);
  }

  if (filters.role) {
    const rLower = filters.role.toLowerCase();
    filtered = filtered.filter((p) => !p.roles || p.roles.some((r) => r.toLowerCase().includes(rLower)));
  }

  const offset = Math.max(0, filters.offset ?? 0);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 25));
  const paged = filtered.slice(offset, offset + limit);

  return {
    problems: paged,
    totalCount: track.problems.length,
    filteredCount: filtered.length
  };
}

/**
 * Inventory statistics across the company prep platform.
 */
export function getCompanyPrepSummary(): {
  totalCompaniesCount: number;
  companiesWithQuestionsCount: number;
  companiesAwaitingDataCount: number;
  totalQuestionMappingsCount: number;
  distinctCanonicalProblemsCount: number;
} {
  const withQuestions = COMPANY_TRACKS.filter((t) => t.problems.length > 0).length;
  return {
    totalCompaniesCount: COMPANY_TRACKS.length,
    companiesWithQuestionsCount: withQuestions,
    companiesAwaitingDataCount: COMPANY_TRACKS.length - withQuestions,
    totalQuestionMappingsCount: getTotalCompanyQuestionMappings(),
    distinctCanonicalProblemsCount: getDistinctCanonicalProblemCount()
  };
}

export interface CompanyCoverageAudit {
  totalCompanies: number;
  companiesWithQuestions: number;
  coveragePercentage: number;
  zeroQuestionCompanies: string[];
  sectorBreakdown: Record<CompanySector, { companyCount: number; questionCount: number }>;
  provenanceBreakdown: Record<string, number>;
  companyList: Array<{
    slug: string;
    name: string;
    sector: CompanySector;
    questionCount: number;
    provenanceBreakdown: Record<string, number>;
  }>;
}

/**
 * Returns comprehensive coverage audit asserting metrics across all 56 companies.
 */
export function getCompanyCoverageAudit(): CompanyCoverageAudit {
  const audit: CompanyCoverageAudit = {
    totalCompanies: COMPANY_TRACKS.length,
    companiesWithQuestions: 0,
    coveragePercentage: 0,
    zeroQuestionCompanies: [],
    sectorBreakdown: {
      global_tech: { companyCount: 0, questionCount: 0 },
      india_product: { companyCount: 0, questionCount: 0 },
      it_services: { companyCount: 0, questionCount: 0 },
      finance_quant: { companyCount: 0, questionCount: 0 }
    },
    provenanceBreakdown: {},
    companyList: []
  };

  for (const track of COMPANY_TRACKS) {
    const qCount = track.problems.length;
    if (qCount > 0) {
      audit.companiesWithQuestions++;
    } else {
      audit.zeroQuestionCompanies.push(track.slug);
    }

    if (audit.sectorBreakdown[track.sector]) {
      audit.sectorBreakdown[track.sector].companyCount++;
      audit.sectorBreakdown[track.sector].questionCount += qCount;
    }

    const trackProvenance: Record<string, number> = {};
    for (const p of track.problems) {
      const prov = p.provenance || "curated_practice";
      audit.provenanceBreakdown[prov] = (audit.provenanceBreakdown[prov] || 0) + 1;
      trackProvenance[prov] = (trackProvenance[prov] || 0) + 1;
    }

    audit.companyList.push({
      slug: track.slug,
      name: track.name,
      sector: track.sector,
      questionCount: qCount,
      provenanceBreakdown: trackProvenance
    });
  }

  audit.coveragePercentage = audit.totalCompanies > 0
    ? Math.round((audit.companiesWithQuestions / audit.totalCompanies) * 100)
    : 0;

  return audit;
}

