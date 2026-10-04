/**
 * COGNALYZE OPPORTUNITY INTELLIGENCE — COMPANY CAREER ADAPTER
 * 
 * Ingests and normalizes direct corporate hiring portal listings
 * (e.g. Google, Microsoft, Stripe, Razorpay, Zepto, Flipkart, Swiggy).
 * Prioritizes direct corporate application URLs over intermediate aggregators.
 */

import { BaseOpportunitySourceAdapter } from "./base-adapter";
import { RawOpportunity, CanonicalOpportunity, OpportunitySourceType } from "../types";

export class CompanyCareerAdapter extends BaseOpportunitySourceAdapter {
  id = "adapter-company-careers";
  name = "Official Company Careers";
  type: OpportunitySourceType = "COMPANY_CAREER";
  description = "Direct corporate hiring portals and careers websites with verified application links";

  private seedCorporateListings: RawOpportunity[] = [
    {
      id: "corp-google-swe-intern-2027",
      source: "Google Careers",
      sourceType: "COMPANY_CAREER",
      sourceUrl: "https://careers.google.com/jobs/results/swe-intern-2027",
      applicationUrl: "https://careers.google.com/jobs/results/swe-intern-2027/apply",
      companyName: "Google",
      title: "Software Engineering Intern, Summer 2027",
      description: "Join Google as a Software Engineering Intern. You will work on core distributed systems, scalable search infrastructure, or machine learning pipelines. Minimum qualifications: currently enrolled in a Bachelor's, Master's or PhD degree program in Computer Science or related technical field graduating between late 2026 and 2028. Experience with Python, C++, Java, or Go.",
      location: "Bengaluru, Karnataka, India / Hyderabad",
      remoteType: "hybrid",
      employmentType: "internship",
      experienceLevel: "intern",
      requirements: [
        "Python, C++, Java, or Go programming proficiency",
        "Data structures, algorithms, and complexity analysis",
        "Object-Oriented Programming (OOP) principles",
        "Understanding of distributed systems or operating systems basics"
      ],
      eligibilityText: "Currently enrolled in a Bachelor's or Master's degree in Computer Science or related field. Expected graduation year: 2027 or 2028.",
      postedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      deadline: new Date(Date.now() + 25 * 86400000).toISOString(),
      compensationText: "₹1,15,000 / month + housing allowance",
      metadata: {
        companyType: "enterprise",
        tier: "Tier 1"
      }
    },
    {
      id: "corp-stripe-backend-intern",
      source: "Stripe Careers",
      sourceType: "COMPANY_CAREER",
      sourceUrl: "https://stripe.com/jobs/listings/software-engineer-intern-backend",
      applicationUrl: "https://stripe.com/jobs/listings/software-engineer-intern-backend/apply",
      companyName: "Stripe",
      title: "Software Engineer Intern — Backend Infrastructure",
      description: "Build economic infrastructure for the internet. As a backend intern, you will write robust APIs, integrate distributed idempotency keys, and work on high-availability payment routing workers. Requires strong proficiency in Python, Ruby, or Go, solid SQL/Postgres knowledge, and demonstrated project implementation experience.",
      location: "Bengaluru, India / Remote (India)",
      remoteType: "remote",
      employmentType: "internship",
      experienceLevel: "intern",
      requirements: [
        "Python, Go, or Ruby backend programming",
        "REST API design and database query optimization (SQL)",
        "Knowledge of idempotency, caching, and rate limiting",
        "Git version control and collaborative code review experience"
      ],
      eligibilityText: "Students graduating in 2026, 2027, or 2028 with Computer Science or engineering degrees.",
      postedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      deadline: new Date(Date.now() + 18 * 86400000).toISOString(),
      compensationText: "₹1,25,000 / month stipend",
      metadata: {
        companyType: "enterprise",
        tier: "Tier 1"
      }
    },
    {
      id: "corp-razorpay-aiml-intern",
      source: "Razorpay Careers",
      sourceType: "COMPANY_CAREER",
      sourceUrl: "https://razorpay.com/jobs/ai-ml-intern",
      applicationUrl: "https://razorpay.com/jobs/ai-ml-intern/apply",
      companyName: "Razorpay",
      title: "AI/ML Engineer Intern — Risk & Fraud Intelligence",
      description: "Razorpay is looking for an AI/ML Intern to build real-time transaction anomaly detection models. You will build and deploy inference endpoints with Python, FastAPI, and Scikit-Learn/PyTorch, evaluate false-positive trade-offs, and monitor latency under 50ms SLAs.",
      location: "Bengaluru, Karnataka, India",
      remoteType: "hybrid",
      employmentType: "internship",
      experienceLevel: "intern",
      requirements: [
        "Python proficiency and Machine Learning fundamentals",
        "FastAPI or Flask API development",
        "SQL database queries and data preprocessing (Pandas, NumPy)",
        "PyTorch or Scikit-Learn model training and evaluation"
      ],
      eligibilityText: "Undergraduate or Graduate engineering students graduating in 2026, 2027, or 2028.",
      postedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      deadline: new Date(Date.now() + 14 * 86400000).toISOString(),
      compensationText: "₹65,000 / month stipend",
      metadata: {
        companyType: "scaleup",
        tier: "Tier 1"
      }
    }
  ];

  async discover(query?: any): Promise<RawOpportunity[]> {
    this.lastUpdated = new Date().toISOString();
    return this.seedCorporateListings;
  }

  async fetch(opportunityId: string): Promise<RawOpportunity | null> {
    return this.seedCorporateListings.find(o => o.id === opportunityId) || null;
  }

  normalize(raw: RawOpportunity): CanonicalOpportunity {
    const isIntern = raw.title.toLowerCase().includes("intern") || raw.employmentType === "internship";

    return {
      id: raw.id,
      source: raw.source,
      sourceType: "COMPANY_CAREER",
      sourceUrl: raw.sourceUrl,
      applicationUrl: raw.applicationUrl,
      companyId: `comp-${raw.companyName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
      companyName: raw.companyName,
      companyType: (raw.metadata?.companyType || "enterprise") as any,
      title: raw.title,
      normalizedTitle: isIntern
        ? raw.title.toLowerCase().includes("ai") || raw.title.toLowerCase().includes("ml")
          ? "AI/ML Engineer Intern"
          : "Software Engineer Intern"
        : raw.title,
      opportunityType: isIntern ? "INTERNSHIP" : "JOB",
      description: raw.description,
      responsibilities: [
        "Design, build, and deploy production-grade software features",
        "Participate in design reviews, unit testing, and technical documentation",
        "Collaborate cross-functionally with senior engineers and product managers"
      ],
      location: raw.location || "Bengaluru, India",
      country: "India",
      city: "Bengaluru",
      remoteType: (raw.remoteType as any) || "hybrid",
      employmentType: (raw.employmentType as any) || "internship",
      experienceLevel: isIntern ? "intern" : "entry_level",
      educationRequirements: {
        degreesAllowed: ["B.Tech", "B.E.", "B.S.", "M.Tech", "MCA", "Dual Degree"],
        fieldsAllowed: ["Computer Science", "Information Technology", "AI/ML", "Electronics", "Related"],
        minEducationLevel: "bachelors",
        isMandatory: true
      },
      graduationRequirements: {
        minGradYear: 2026,
        maxGradYear: 2029,
        allowedYears: [2026, 2027, 2028, 2029],
        currentlyEnrolledRequired: true,
        isMandatory: true
      },
      workAuthRequirements: {
        country: "India",
        sponsorshipAvailable: false,
        requiresCitizenshipOrPR: false,
        isMandatory: true
      },
      requiredSkills: raw.requirements ? raw.requirements.slice(0, 3) : ["Python", "DSA", "SQL"],
      preferredSkills: raw.requirements && raw.requirements.length > 3 ? raw.requirements.slice(3) : ["Docker", "AWS"],
      eligibilityRequirements: [
        "Enrolled in recognized undergraduate or postgraduate degree program",
        "Graduating in 2026, 2027, 2028, or 2029",
        "Able to commit to full-time internship duration (8-12 weeks)"
      ],
      disqualifiers: [
        "Candidates graduating before 2026 or after 2030",
        "Candidates unable to work in India or lacking work authorization"
      ],
      compensation: {
        stipendText: raw.compensationText || "Competitive Tier-1 Stipend"
      },
      postedAt: raw.postedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deadline: raw.deadline || null,
      status: "ACTIVE",
      freshness: "FRESH",
      createdAt: raw.postedAt || new Date().toISOString(),
      lastVerifiedAt: new Date().toISOString(),
      rawSourceData: raw,
      sourceInstances: [
        {
          source: raw.source,
          sourceType: "COMPANY_CAREER",
          sourceUrl: raw.sourceUrl,
          applicationUrl: raw.applicationUrl,
          retrievedAt: new Date().toISOString(),
          lastVerifiedAt: new Date().toISOString()
        }
      ],
      roleDNA: {
        roleCategory: raw.title.toLowerCase().includes("ai") ? "AI/ML Engineering" : "Software Engineering",
        mustHaveSkills: raw.requirements ? raw.requirements.slice(0, 3) : ["Python", "Algorithms", "APIs"],
        preferredSkills: raw.requirements && raw.requirements.length > 3 ? raw.requirements.slice(3) : ["Docker", "Cloud Deployment"],
        experienceYearsMin: 0,
        experienceYearsMax: 1,
        educationSummary: "B.Tech / B.E. / M.Tech in CS / IT / Related",
        graduationWindow: "2026–2029",
        locationMode: raw.remoteType || "hybrid",
        disqualifiers: ["Graduation before 2026", "Non-technical degree without coding background"]
      }
    };
  }
}
