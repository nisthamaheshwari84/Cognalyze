/**
 * app/api/skills/dsa/companies/route.ts
 * 
 * Company-Based DSA Preparation API for Cognalyze.
 * 
 * Supports:
 * - 56 Configured Companies with 100% Verified Coverage across 4 sectors
 * - Verified company tracks and 1,650 question mappings
 * - Filtering by sector, status, difficulty, stage, provenance, role, and keyword search
 * - Coverage audit API endpoint (?audit=true)
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getAllCompanyTracks,
  getCompanyTrackBySlug,
  getProblemsForCompany,
  getCompanyPrepSummary,
  getCompanyCoverageAudit,
  CompanyCategory,
  QuestionProvenance
} from "@/lib/skills/dsa-company-prep";
import { CompanySector, CompanyDataStatus } from "@/lib/skills/company-directory";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isAudit = searchParams.get("audit") === "true";

    if (isAudit) {
      const audit = getCompanyCoverageAudit();
      return NextResponse.json({ success: true, audit });
    }

    const slug = searchParams.get("slug") || searchParams.get("company");
    const sector = searchParams.get("sector") as CompanySector | null;
    const category = searchParams.get("category") as CompanyCategory | null;
    const status = searchParams.get("status") as CompanyDataStatus | null;
    const q = searchParams.get("q") || searchParams.get("search");
    const hasQuestionsOnly = searchParams.get("hasQuestions") === "true";
    const difficulty = searchParams.get("difficulty") as "easy" | "medium" | "hard" | null;
    const stage = searchParams.get("stage");
    const provenance = searchParams.get("provenance") as QuestionProvenance | "all" | null;
    const role = searchParams.get("role");
    const limit = searchParams.has("limit") ? Number(searchParams.get("limit")) : undefined;
    const offset = searchParams.has("offset") ? Number(searchParams.get("offset")) : undefined;

    // Single company track lookup
    if (slug) {
      const track = getCompanyTrackBySlug(slug);
      if (!track) {
        return NextResponse.json({ success: false, error: "Company track not found" }, { status: 404 });
      }

      // If pagination or problem filters applied
      if (difficulty || stage || provenance || role || limit !== undefined || offset !== undefined) {
        const pagedProblems = getProblemsForCompany(slug, {
          difficulty: difficulty || undefined,
          stage: stage || undefined,
          provenance: provenance || undefined,
          role: role || undefined,
          limit,
          offset
        });

        return NextResponse.json({
          success: true,
          company: {
            ...track,
            problems: pagedProblems.problems,
            totalProblemsCount: track.problems.length,
            filteredProblemsCount: pagedProblems.filteredCount
          }
        });
      }

      return NextResponse.json({
        success: true,
        company: track
      });
    }

    // Filtered multi-company tracks lookup
    const allTracks = getAllCompanyTracks({
      sector: sector || undefined,
      category: category || undefined,
      status: status || undefined,
      searchQuery: q || undefined,
      hasQuestionsOnly
    });

    const summary = getCompanyPrepSummary();

    return NextResponse.json({
      success: true,
      totalCompanies: allTracks.length,
      summary,
      companies: allTracks
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
