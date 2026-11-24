import { NextRequest, NextResponse } from "next/server";
import {
  resolveCanonicalCompany,
  resolveCanonicalRole,
  getCanonicalRole,
  validateCompanyIdentity,
  assertCompanyIsolation
} from "@/lib/question-bank/canonical-identity";
import {
  queryCompanyQuestionBank,
  auditCompanyIsolation
} from "@/lib/question-bank/company-question-store";
import { getCompanyIntelligenceGuide } from "@/lib/question-bank/company-intelligence-registry";
import { QuestionDifficulty, QuestionType, CompanyRound } from "@/lib/question-bank-types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyParam = searchParams.get("company") || "All Companies";
    const roleParam = searchParams.get("role") || "All Roles";
    const roundParam = searchParams.get("round") || undefined;
    const categoryParam = searchParams.get("category") || undefined;
    const subtopicParam = searchParams.get("subtopic") || undefined;
    const difficultyParam = searchParams.get("difficulty") as QuestionDifficulty | undefined;
    const typeParam = searchParams.get("type") as QuestionType | undefined;
    const searchQuery = searchParams.get("searchQuery") || undefined;
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50", 10), 1), 200);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0);

    // Validate Company Identity if specific company requested
    let canonicalCompany = undefined;
    if (companyParam !== "All Companies") {
      const validation = validateCompanyIdentity(companyParam);
      if (!validation.isValid || !validation.canonical) {
        return NextResponse.json(
          {
            success: false,
            error: "INVALID_COMPANY_IDENTITY",
            message: `Company '${companyParam}' could not be identified or resolved to a canonical company.`
          },
          { status: 400 }
        );
      }
      canonicalCompany = validation.canonical;
    }

    // Validate Role Identity if specific role requested
    let canonicalRole = undefined;
    if (roleParam !== "All Roles") {
      canonicalRole = getCanonicalRole(roleParam);
    }

    // Query Isolated Question Store
    const queryResult = queryCompanyQuestionBank({
      company: canonicalCompany?.displayName || companyParam,
      role: canonicalRole?.displayName || roleParam,
      round: roundParam as CompanyRound,
      category: categoryParam,
      subtopic: subtopicParam,
      difficulty: difficultyParam,
      type: typeParam,
      searchQuery,
      limit,
      offset
    });

    // Enforce Company Isolation Check
    if (canonicalCompany) {
      assertCompanyIsolation(
        canonicalCompany.displayName,
        canonicalCompany.displayName
      );
    }

    // Retrieve Company Prep & Intelligence Metadata if company specified
    let intelligenceGuide = null;
    if (canonicalCompany) {
      intelligenceGuide = getCompanyIntelligenceGuide(canonicalCompany.displayName);
    }

    return NextResponse.json({
      success: true,
      company: canonicalCompany ? {
        id: canonicalCompany.id,
        displayName: canonicalCompany.displayName,
        sector: canonicalCompany.sector,
        sectorLabel: canonicalCompany.sectorLabel,
        headquarters: canonicalCompany.headquarters,
        careersUrl: canonicalCompany.careersUrl,
        techStack: canonicalCompany.primaryTechStack
      } : null,
      role: canonicalRole ? {
        id: canonicalRole.id,
        displayName: canonicalRole.displayName
      } : null,
      intelligenceGuide,
      pagination: {
        total: queryResult.totalMatching,
        limit,
        offset,
        hasMore: offset + limit < queryResult.totalMatching
      },
      cached: queryResult.isCached,
      questions: queryResult.questions
    });
  } catch (error: any) {
    console.error("[api/question-bank] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: error.message || "An unexpected error occurred while querying the question bank."
      },
      { status: 500 }
    );
  }
}
