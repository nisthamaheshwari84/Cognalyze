import { NextRequest, NextResponse } from "next/server";
import {
  resolveCanonicalCompany,
  resolveCanonicalRole,
  getCanonicalRole,
  validateCompanyIdentity
} from "@/lib/question-bank/canonical-identity";
import {
  getResearchJob,
  getResearchJobsByCompany,
  getAllResearchJobs
} from "@/lib/question-bank/research-job-store";
import {
  executeAutonomousResearch
} from "@/lib/question-bank/autonomous-research-engine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");
    const company = searchParams.get("company");

    if (jobId) {
      const job = getResearchJob(jobId);
      if (!job) {
        return NextResponse.json(
          { success: false, error: "JOB_NOT_FOUND", message: `Research job ${jobId} not found.` },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, job });
    }

    if (company) {
      const canonicalComp = resolveCanonicalCompany(company);
      if (!canonicalComp) {
        return NextResponse.json(
          { success: false, error: "UNKNOWN_COMPANY", message: `Unknown company ${company}` },
          { status: 400 }
        );
      }
      const jobs = getResearchJobsByCompany(canonicalComp.id);
      return NextResponse.json({ success: true, company: canonicalComp.displayName, jobs });
    }

    const allJobs = getAllResearchJobs();
    return NextResponse.json({
      success: true,
      totalJobs: allJobs.length,
      jobs: allJobs.slice(0, 100)
    });
  } catch (error: any) {
    console.error("[api/question-bank/research] GET error:", error);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { company, role } = body;

    if (!company) {
      return NextResponse.json(
        { success: false, error: "MISSING_COMPANY", message: "Company name is required." },
        { status: 400 }
      );
    }

    const validation = validateCompanyIdentity(company);
    if (!validation.isValid || !validation.canonical) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_COMPANY_IDENTITY",
          message: `Company '${company}' could not be identified or resolved.`
        },
        { status: 400 }
      );
    }

    const canonicalRole = getCanonicalRole(role || "Software Engineer");
    const roleId = canonicalRole?.id || "role-sde";

    // Launch or retrieve existing research job
    const job = await executeAutonomousResearch({
      companyName: validation.canonical.displayName,
      roleName: canonicalRole?.displayName || "Software Engineer"
    });

    return NextResponse.json({
      success: true,
      message: `Autonomous research job initialized for ${validation.canonical.displayName} (${canonicalRole?.displayName || roleId}).`,
      job
    });
  } catch (error: any) {
    console.error("[api/question-bank/research] POST error:", error);
    return NextResponse.json(
      { success: false, error: "RESEARCH_EXECUTION_FAILED", message: error.message },
      { status: 500 }
    );
  }
}
