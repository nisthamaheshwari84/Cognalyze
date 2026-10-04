/**
 * COGNALYZE OPPORTUNITY INTELLIGENCE — STARTUP HIRING ADAPTER
 * 
 * Ingests opportunities from high-growth startups, accelerator directories (YC, Surge),
 * and VC portfolio job boards.
 * Captures startup stage (Seed, Series A, Series B+), company size, and engineering autonomy.
 */

import { BaseOpportunitySourceAdapter } from "./base-adapter";
import { RawOpportunity, CanonicalOpportunity, OpportunitySourceType } from "../types";

export class StartupAdapter extends BaseOpportunitySourceAdapter {
  id = "adapter-startup-hiring";
  name = "Startup & VC Portfolio Careers (YC / Seed / Series A-B)";
  type: OpportunitySourceType = "STARTUP";
  description = "High-growth engineering startups offering high-ownership internships and founding engineer tracks";

  private seedStartupListings: RawOpportunity[] = [
    {
      id: "startup-bifrost-ai-founding-intern",
      source: "YC Work at a Startup",
      sourceType: "STARTUP",
      sourceUrl: "https://www.workatastartup.com/companies/bifrost-ai/jobs/founding-ai-intern",
      applicationUrl: "https://www.workatastartup.com/companies/bifrost-ai/jobs/founding-ai-intern/apply",
      companyName: "Bifrost AI",
      title: "Founding AI Engineer Intern (YC W25)",
      description: "Bifrost is building autonomous agent evaluation pipelines for enterprise codebases. We are an early-stage YC-backed team (Seed, $3.2M) seeking an ambitious AI/ML engineering intern. You will build agent memory graphs, integrate LangGraph/FastAPI services, and work directly with the founders. Tech stack: Python, FastAPI, Docker, PyTorch, Supabase.",
      location: "Bengaluru, India / Remote",
      remoteType: "remote",
      employmentType: "internship",
      experienceLevel: "intern",
      requirements: [
        "Python and FastAPI backend engineering",
        "LLM agent orchestration (LangChain, LangGraph, or LlamaIndex)",
        "Docker containerization and local reproduction",
        "Vector databases (Qdrant, Pinecone, or pgvector)"
      ],
      eligibilityText: "Undergraduate or postgraduate students with proven GitHub projects. Open to 2026, 2027, 2028 graduates.",
      postedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      deadline: new Date(Date.now() + 10 * 86400000).toISOString(),
      compensationText: "₹50,000 / month + equity upside",
      metadata: {
        companyType: "startup",
        startupStage: "Seed",
        companySize: "4-10 employees",
        vcBacking: "Y Combinator"
      }
    },
    {
      id: "startup-hyperflow-fullstack-intern",
      source: "Peak XV Surge Portfolio",
      sourceType: "STARTUP",
      sourceUrl: "https://jobs.peakxv.com/hyperflow/frontend-engineer-intern",
      applicationUrl: "https://jobs.peakxv.com/hyperflow/frontend-engineer-intern/apply",
      companyName: "Hyperflow Data",
      title: "Fullstack Engineering Intern — Real-time Canvas",
      description: "Series A data infrastructure startup building low-latency visual pipeline editors. Looking for an intern who loves React, TypeScript, Next.js, and canvas / WebGL rendering. You'll build drag-and-drop state machines and collaborate with our distributed core team.",
      location: "Bengaluru, Karnataka, India",
      remoteType: "hybrid",
      employmentType: "internship",
      experienceLevel: "intern",
      requirements: [
        "React, Next.js, and modern TypeScript",
        "State management (Zustand, Redux, or Jotai)",
        "CSS Modules / Tailwind and responsive UI design",
        "Canvas API or SVG interactive nodes"
      ],
      eligibilityText: "Students graduating in 2026, 2027, 2028.",
      postedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      deadline: new Date(Date.now() + 12 * 86400000).toISOString(),
      compensationText: "₹55,000 / month stipend",
      metadata: {
        companyType: "startup",
        startupStage: "Series A",
        companySize: "15-30 employees"
      }
    }
  ];

  async discover(query?: any): Promise<RawOpportunity[]> {
    this.lastUpdated = new Date().toISOString();
    return this.seedStartupListings;
  }

  async fetch(opportunityId: string): Promise<RawOpportunity | null> {
    return this.seedStartupListings.find(o => o.id === opportunityId) || null;
  }

  normalize(raw: RawOpportunity): CanonicalOpportunity {
    const isIntern = raw.title.toLowerCase().includes("intern") || raw.employmentType === "internship";

    return {
      id: raw.id,
      source: raw.source,
      sourceType: "STARTUP",
      sourceUrl: raw.sourceUrl,
      applicationUrl: raw.applicationUrl,
      companyId: `comp-${raw.companyName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
      companyName: raw.companyName,
      companyType: "startup",
      startupStage: (raw.metadata?.startupStage || "Seed") as any,
      title: raw.title,
      normalizedTitle: isIntern
        ? raw.title.toLowerCase().includes("ai")
          ? "AI/ML Engineer Intern"
          : "Fullstack Engineer Intern"
        : raw.title,
      description: raw.description,
      responsibilities: [
        "Own end-to-end features from architecture to shipping in production",
        "Experiment rapidly with prototype loops and user feedback",
        "Maintain clean git commits, issue tracking, and testing"
      ],
      location: raw.location || "Remote / Bengaluru",
      country: "India",
      city: "Bengaluru",
      remoteType: (raw.remoteType as any) || "remote",
      employmentType: (raw.employmentType as any) || "internship",
      experienceLevel: isIntern ? "intern" : "entry_level",
      educationRequirements: {
        degreesAllowed: ["B.Tech", "B.E.", "B.S.", "BCA", "MCA", "Self-Taught / Open"],
        fieldsAllowed: ["Computer Science", "Information Technology", "Any Engineering", "Self-Directed"],
        minEducationLevel: "bachelors",
        isMandatory: false // Startups prioritize project evidence over formal pedigree
      },
      graduationRequirements: {
        minGradYear: 2026,
        maxGradYear: 2029,
        allowedYears: [2026, 2027, 2028, 2029],
        currentlyEnrolledRequired: false,
        isMandatory: false
      },
      workAuthRequirements: {
        country: "India",
        sponsorshipAvailable: false,
        requiresCitizenshipOrPR: false,
        isMandatory: false
      },
      requiredSkills: raw.requirements ? raw.requirements.slice(0, 3) : ["Python", "FastAPI", "Docker"],
      preferredSkills: raw.requirements && raw.requirements.length > 3 ? raw.requirements.slice(3) : ["Docker", "LangChain"],
      eligibilityRequirements: [
        "Must demonstrate public projects or GitHub implementation evidence",
        "Able to work autonomously in a fast-paced environment"
      ],
      disqualifiers: [],
      compensation: {
        stipendText: raw.compensationText || "₹50,000 / month"
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
          sourceType: "STARTUP",
          sourceUrl: raw.sourceUrl,
          applicationUrl: raw.applicationUrl,
          retrievedAt: new Date().toISOString(),
          lastVerifiedAt: new Date().toISOString()
        }
      ],
      roleDNA: {
        roleCategory: raw.title.toLowerCase().includes("ai") ? "AI/ML Engineering" : "Full-Stack Engineering",
        mustHaveSkills: raw.requirements ? raw.requirements.slice(0, 3) : ["Python", "FastAPI", "React"],
        preferredSkills: raw.requirements && raw.requirements.length > 3 ? raw.requirements.slice(3) : ["Docker", "AWS"],
        experienceYearsMin: 0,
        experienceYearsMax: 1,
        educationSummary: "Open to passionate builders with strong GitHub evidence",
        graduationWindow: "2026–2029",
        locationMode: raw.remoteType || "remote",
        disqualifiers: ["Zero demonstrable code artifacts"]
      }
    };
  }
}
