/**
 * app/api/recruitment/companies/research/route.ts
 * 
 * Company Research & Job Description Intelligence API.
 * POST: Analyzes raw JD text or returns transparent provenance claims for a company.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  analyzeJobDescription,
  getCompanyResearchReport,
} from "@/lib/recruitment/company-research-engine";
import { RoleFamily, HiringChannel } from "@/lib/recruitment/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyId, jdText, roleFamily = "sde", country = "India", channel = "campus" } = body;

    let jdAnalysis = null;
    if (jdText && typeof jdText === "string" && jdText.trim().length > 10) {
      jdAnalysis = analyzeJobDescription(jdText, companyId);
    }

    let researchReport = null;
    if (companyId) {
      researchReport = getCompanyResearchReport(
        companyId,
        (jdAnalysis?.detectedRoleFamily || roleFamily) as RoleFamily,
        country,
        channel as HiringChannel
      );
    }

    return NextResponse.json({
      success: true,
      jdAnalysis,
      researchReport,
    });
  } catch (err: any) {
    console.error("[POST /api/recruitment/companies/research] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to analyze research/JD." },
      { status: 500 }
    );
  }
}

