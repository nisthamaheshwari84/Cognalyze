/**
 * COGNALYZE OPPORTUNITY INTELLIGENCE — UNIVERSITY & CAMPUS ADAPTER
 * 
 * Ingests opportunities from college placement portals, university career cells,
 * campus hiring announcements, and centralized pool-campus drives.
 * Places high weight on graduation year windows, degree tracks, and minimum CGPA criteria.
 */

import { BaseOpportunitySourceAdapter } from "./base-adapter";
import { RawOpportunity, CanonicalOpportunity, OpportunitySourceType } from "../types";

export class UniversityAdapter extends BaseOpportunitySourceAdapter {
  id = "adapter-university-campus";
  name = "Campus Placement Portals & University Hiring Cells";
  type: OpportunitySourceType = "UNIVERSITY";
  description = "On-campus hiring drives, pooled university assessments, and official university career cell listings";

  private seedCampusListings: RawOpportunity[] = [
    {
      id: "campus-flipkart-grid-sde",
      source: "National Campus Drive (Flipkart GRiD)",
      sourceType: "UNIVERSITY",
      sourceUrl: "https://unstop.com/competitions/flipkart-grid-70",
      applicationUrl: "https://unstop.com/competitions/flipkart-grid-70/apply",
      companyName: "Flipkart",
      title: "Flipkart Campus SDE-1 & Summer Internship Drive",
      description: "Annual university flagship engineering challenge. Offers direct PPIs (Pre-Placement Interviews) and summer internships. Tracks include E-Commerce Flash Sale Architecture, Multimodal Search, and Supply Chain Optimization. Requires algorithms, data structures, and system modeling.",
      location: "Bengaluru, Karnataka, India",
      remoteType: "hybrid",
      employmentType: "internship",
      experienceLevel: "intern",
      requirements: [
        "Data structures and algorithms (DSA)",
        "Core computer science subjects (OS, DBMS, Networks)",
        "Java, C++, or Python implementation skills",
        "System design and high-concurrency thinking"
      ],
      eligibilityText: "Students currently enrolled in B.Tech / B.E. / M.Tech / MCA graduating strictly in 2026, 2027, or 2028. Minimum 6.5 CGPA.",
      postedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      deadline: new Date(Date.now() + 8 * 86400000).toISOString(),
      compensationText: "₹1,00,000 / month internship + ₹32 LPA SDE-1 PPIs",
      metadata: {
        companyType: "enterprise",
        tier: "Tier 1",
        cgpaCutoff: 6.5
      }
    },
    {
      id: "campus-cisco-sec-intern",
      source: "University Pool Campus",
      sourceType: "UNIVERSITY",
      sourceUrl: "https://jobs.cisco.com/campus/intern-network-security",
      applicationUrl: "https://jobs.cisco.com/campus/intern-network-security/apply",
      companyName: "Cisco Systems",
      title: "Campus Technical Intern — Cloud & Network Security",
      description: "Cisco India campus recruitment drive for technical interns. Work on enterprise cloud security, VPN protocols, and automated telemetry collectors. Requires networking fundamentals (TCP/IP, DNS, SSL), Python scripting, and Linux command-line fluency.",
      location: "Bengaluru, Karnataka, India",
      remoteType: "onsite",
      employmentType: "internship",
      experienceLevel: "intern",
      requirements: [
        "Networking fundamentals (TCP/IP, Routing, DNS)",
        "Python scripting and automation",
        "Linux OS internals and shell scripting",
        "Problem solving and analytical debugging"
      ],
      eligibilityText: "B.Tech / B.E. in CS, IT, ECE graduating in 2027 or 2028. No active backlogs. Minimum 7.0 CGPA.",
      postedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
      deadline: new Date(Date.now() + 6 * 86400000).toISOString(),
      compensationText: "₹85,000 / month stipend",
      metadata: {
        companyType: "enterprise",
        tier: "Tier 1",
        cgpaCutoff: 7.0
      }
    }
  ];

  async discover(query?: any): Promise<RawOpportunity[]> {
    this.lastUpdated = new Date().toISOString();
    return this.seedCampusListings;
  }

  async fetch(opportunityId: string): Promise<RawOpportunity | null> {
    return this.seedCampusListings.find(o => o.id === opportunityId) || null;
  }

  normalize(raw: RawOpportunity): CanonicalOpportunity {
    return {
      id: raw.id,
      source: raw.source,
      sourceType: "UNIVERSITY",
      sourceUrl: raw.sourceUrl,
      applicationUrl: raw.applicationUrl,
      companyId: `comp-${raw.companyName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
      companyName: raw.companyName,
      companyType: "enterprise",
      title: raw.title,
      normalizedTitle: "Software Engineer Intern",
      description: raw.description,
      responsibilities: [
        "Participate in campus coding and architectural problem sprints",
        "Solve algorithmic test cases under time-bounded evaluation",
        "Attend technical mentor reviews and system walkthroughs"
      ],
      location: raw.location || "Bengaluru, India",
      country: "India",
      city: "Bengaluru",
      remoteType: (raw.remoteType as any) || "hybrid",
      employmentType: "internship",
      experienceLevel: "intern",
      educationRequirements: {
        degreesAllowed: ["B.Tech", "B.E.", "M.Tech", "MCA"],
        fieldsAllowed: ["Computer Science", "Information Technology", "Electronics & Communication"],
        minEducationLevel: "bachelors",
        isMandatory: true
      },
      graduationRequirements: {
        minGradYear: 2026,
        maxGradYear: 2028,
        allowedYears: [2026, 2027, 2028],
        currentlyEnrolledRequired: true,
        isMandatory: true
      },
      workAuthRequirements: {
        country: "India",
        sponsorshipAvailable: false,
        requiresCitizenshipOrPR: false,
        isMandatory: true
      },
      requiredSkills: raw.requirements ? raw.requirements.slice(0, 3) : ["Algorithms", "Python", "Networking"],
      preferredSkills: raw.requirements && raw.requirements.length > 3 ? raw.requirements.slice(3) : ["Distributed Systems"],
      eligibilityRequirements: [
        "Strictly for students graduating in 2026, 2027, or 2028",
        "No active backlogs at time of joining",
        `Minimum ${raw.metadata?.cgpaCutoff || 6.5} CGPA`
      ],
      disqualifiers: [
        "Graduation year before 2026 or after 2029",
        "Non-engineering degree programs"
      ],
      compensation: {
        stipendText: raw.compensationText || "₹85,000 / month"
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
          sourceType: "UNIVERSITY",
          sourceUrl: raw.sourceUrl,
          applicationUrl: raw.applicationUrl,
          retrievedAt: new Date().toISOString(),
          lastVerifiedAt: new Date().toISOString()
        }
      ],
      roleDNA: {
        roleCategory: "Software Engineering",
        mustHaveSkills: raw.requirements ? raw.requirements.slice(0, 3) : ["DSA", "Python", "Operating Systems"],
        preferredSkills: raw.requirements && raw.requirements.length > 3 ? raw.requirements.slice(3) : ["Cloud", "System Design"],
        experienceYearsMin: 0,
        experienceYearsMax: 1,
        educationSummary: "B.Tech / B.E. / M.Tech in CS/IT/ECE",
        graduationWindow: "2026–2028",
        locationMode: raw.remoteType || "onsite",
        disqualifiers: ["Active academic backlogs", "Graduation after 2028"]
      }
    };
  }
}
