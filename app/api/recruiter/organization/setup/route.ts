import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { extractEmailDomain } from "@/lib/auth/security";
import {
  createOrganization,
  getOrganizationByDomain,
  updateRecruiterProfile,
  updateUser
} from "@/lib/auth/store";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    if (!auth || auth.user.accountType !== "recruiter") {
      return NextResponse.json({ error: "Unauthorized. Recruiter session required." }, { status: 401 });
    }

    const body = await req.json();
    const { companyName, companyWebsite, industry, companySize, designation } = body;

    if (!companyName || typeof companyName !== "string") {
      return NextResponse.json({ error: "Company name is required." }, { status: 400 });
    }

    // Extract work email domain from recruiter work email
    const workEmailDomain = extractEmailDomain(auth.user.email);

    // Normalize company domain from website if provided, else use work email domain
    let companyDomain = workEmailDomain;
    if (companyWebsite) {
      try {
        const urlStr = companyWebsite.startsWith("http") ? companyWebsite : `https://${companyWebsite}`;
        const parsed = new URL(urlStr);
        companyDomain = parsed.hostname.replace(/^www\./, "").toLowerCase();
      } catch {
        companyDomain = workEmailDomain;
      }
    }

    // Domain Match Verification Logic
    const domainMatches = workEmailDomain.toLowerCase() === companyDomain.toLowerCase();
    const verificationStatus = domainMatches ? "VERIFIED" : "DOMAIN_MATCHED";

    // Check if organization already registered for this domain
    let organization = getOrganizationByDomain(companyDomain);
    if (!organization) {
      organization = createOrganization({
        name: companyName,
        domain: companyDomain,
        website: companyWebsite || `https://${companyDomain}`,
        industry: industry || "Technology & Software",
        companySize: companySize || "50-250",
        verificationStatus
      });
    }

    // Link recruiter to organization
    updateRecruiterProfile(auth.user.id, {
      organizationId: organization.id,
      designation: designation || auth.recruiterProfile?.designation || "Technical Recruiter",
      status: verificationStatus === "VERIFIED" ? "ACTIVE" : "ORGANIZATION_PENDING"
    });

    // Update user status
    if (verificationStatus === "VERIFIED") {
      updateUser(auth.user.id, { status: "ACTIVE" });
    }

    return NextResponse.json({
      success: true,
      organization,
      domainMatches,
      status: verificationStatus === "VERIFIED" ? "ACTIVE" : "ORGANIZATION_PENDING",
      nextUrl: verificationStatus === "VERIFIED" ? "/recruiter/dashboard" : "/recruiter/organization/setup"
    });
  } catch (err: any) {
    console.error("Organization setup error:", err);
    return NextResponse.json({ error: err.message || "Failed to set up organization." }, { status: 500 });
  }
}
