import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { extractEmailDomain, isGenericEmailDomain } from "@/lib/auth/security";
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

    if (!companyName || typeof companyName !== "string" || companyName.trim().length < 2) {
      return NextResponse.json({ error: "A valid company name is required." }, { status: 400 });
    }

    const workEmail = auth.user.email;
    const workEmailDomain = extractEmailDomain(workEmail);

    // 1. Consumer Email Rejection (Section 20 & 21)
    // Personal emails (gmail, yahoo, etc.) CANNOT be automatically verified as company identity.
    if (isGenericEmailDomain(workEmail)) {
      return NextResponse.json({
        success: false,
        status: "FAILED",
        verificationStatus: "FAILED",
        domainMatches: false,
        error: "Personal/consumer email addresses cannot be used for company verification. Please register with your official company work email."
      }, { status: 400 });
    }

    // 2. Normalize company website domain
    let companyDomain = workEmailDomain;
    if (companyWebsite && typeof companyWebsite === "string" && companyWebsite.trim().length > 3) {
      try {
        const urlStr = companyWebsite.startsWith("http") ? companyWebsite : `https://${companyWebsite}`;
        const parsed = new URL(urlStr);
        companyDomain = parsed.hostname.replace(/^www\./, "").toLowerCase();
      } catch {
        companyDomain = workEmailDomain;
      }
    }

    // 3. Domain Consistency Check (Section 21, 22, 23)
    const domainMatches = workEmailDomain.toLowerCase() === companyDomain.toLowerCase();
    
    // Explicit verification states: PENDING, VERIFIED, FAILED, MANUAL_REVIEW
    let verificationStatus: "VERIFIED" | "MANUAL_REVIEW" | "PENDING" | "FAILED" = "PENDING";
    let verificationMessage = "";

    if (domainMatches && auth.user.emailVerifiedAt) {
      verificationStatus = "VERIFIED";
      verificationMessage = "Company identity and work email domain verified successfully.";
    } else if (!domainMatches) {
      verificationStatus = "MANUAL_REVIEW";
      verificationMessage = `Email domain (${workEmailDomain}) differs from company website domain (${companyDomain}). Submitted for manual compliance review.`;
    } else {
      verificationStatus = "PENDING";
      verificationMessage = "Work email verification pending.";
    }

    // 4. Create or reuse company entity (Section 24)
    let organization = getOrganizationByDomain(companyDomain);
    if (!organization) {
      organization = createOrganization({
        name: companyName.trim(),
        domain: companyDomain,
        website: companyWebsite ? (companyWebsite.startsWith("http") ? companyWebsite : `https://${companyWebsite}`) : `https://${companyDomain}`,
        industry: industry || "Technology & Software",
        companySize: companySize || "50-250",
        verificationStatus: verificationStatus as any
      });
    }

    // 5. Update Recruiter Profile
    updateRecruiterProfile(auth.user.id, {
      organizationId: organization.id,
      designation: designation || auth.recruiterProfile?.designation || "Technical Recruiter",
      status: verificationStatus === "VERIFIED" ? "ACTIVE" : "ORGANIZATION_PENDING"
    });

    // 6. Update User Status
    if (verificationStatus === "VERIFIED") {
      updateUser(auth.user.id, { status: "ACTIVE" });
    }

    return NextResponse.json({
      success: true,
      organization,
      domainMatches,
      verificationStatus,
      status: verificationStatus === "VERIFIED" ? "ACTIVE" : "ORGANIZATION_PENDING",
      message: verificationMessage,
      nextUrl: verificationStatus === "VERIFIED" ? "/recruiter/dashboard" : "/recruiter/organization/setup"
    });
  } catch (err: any) {
    console.error("Organization setup error:", err);
    return NextResponse.json({ error: err.message || "Failed to set up organization." }, { status: 500 });
  }
}
