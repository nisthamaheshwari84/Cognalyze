/**
 * lib/recruitment/company-registry.ts
 * 
 * Company Registry for the Cognalyze Recruitment Arena.
 * Contains verified institutional metadata, tiers, official URLs, and competency associations
 * for all 10 initial enterprise hiring partners.
 */

import { CompanyProfile, CompanyTierCategory, RoleFamily, HiringChannel } from "./types";

export const RECRUITMENT_COMPANIES: CompanyProfile[] = [
  {
    id: "google",
    name: "Google",
    slug: "google",
    tierCategory: "TIER_1_FAANG",
    headquarters: "Mountain View, California, USA",
    overview:
      "Global leader in search, cloud, artificial intelligence, and operating systems. Google hires Software Engineers and AI researchers through rigorous algorithmic assessments and structured four-pillar interviews.",
    officialCareersUrl: "https://careers.google.com",
    supportedRoleFamilies: ["sde", "ai_ml", "data_analyst"],
    supportedChannels: ["campus", "off_campus", "internship", "experienced"],
    competencyFrameworkId: "comp_google_googlyness",
  },
  {
    id: "amazon",
    name: "Amazon",
    slug: "amazon",
    tierCategory: "TIER_1_FAANG",
    headquarters: "Seattle, Washington, USA",
    overview:
      "World's largest e-commerce and cloud computing provider. Amazon evaluates technical candidates on algorithmic competence, systems architecture, and relentless alignment with the 16 Leadership Principles.",
    officialCareersUrl: "https://amazon.jobs",
    supportedRoleFamilies: ["sde", "ai_ml", "data_analyst"],
    supportedChannels: ["campus", "off_campus", "internship", "experienced"],
    competencyFrameworkId: "comp_amazon_lp",
  },
  {
    id: "microsoft",
    name: "Microsoft",
    slug: "microsoft",
    tierCategory: "TIER_1_FAANG",
    headquarters: "Redmond, Washington, USA",
    overview:
      "Global technology company delivering Windows, Azure, Office 365, GitHub, and enterprise AI. Microsoft emphasizes growth mindset, clean algorithmic design, and customer empathy.",
    officialCareersUrl: "https://careers.microsoft.com",
    supportedRoleFamilies: ["sde", "ai_ml", "data_analyst"],
    supportedChannels: ["campus", "off_campus", "internship", "experienced"],
    competencyFrameworkId: "comp_microsoft_culture",
  },
  {
    id: "adobe",
    name: "Adobe",
    slug: "adobe",
    tierCategory: "HIGH_GROWTH_PRODUCT",
    headquarters: "San Jose, California, USA",
    overview:
      "Creator of Photoshop, Acrobat, Premiere, and Adobe Experience Cloud. Adobe looks for strong computer science fundamentals, creative problem solving, and low-level optimization.",
    officialCareersUrl: "https://www.adobe.com/careers.html",
    supportedRoleFamilies: ["sde", "ai_ml", "data_analyst"],
    supportedChannels: ["campus", "off_campus", "internship", "experienced"],
    competencyFrameworkId: "comp_adobe_values",
  },
  {
    id: "atlassian",
    name: "Atlassian",
    slug: "atlassian",
    tierCategory: "HIGH_GROWTH_PRODUCT",
    headquarters: "Sydney, Australia",
    overview:
      "Enterprise collaboration software leader (Jira, Confluence, Trello, Bitbucket). Known for collaborative, open culture and deep code design / values interview loops.",
    officialCareersUrl: "https://www.atlassian.com/company/careers",
    supportedRoleFamilies: ["sde", "ai_ml"],
    supportedChannels: ["campus", "off_campus", "internship", "experienced"],
    competencyFrameworkId: "comp_atlassian_values",
  },
  {
    id: "deloitte",
    name: "Deloitte",
    slug: "deloitte",
    tierCategory: "ENTERPRISE_SERVICE",
    headquarters: "London, UK & New York, USA",
    overview:
      "Global professional services network providing audit, consulting, financial advisory, and technology consulting. Hiring emphasizes case studies, business analysis, and client-centric data solutions.",
    officialCareersUrl: "https://www2.deloitte.com/us/en/pages/careers/careers.html",
    supportedRoleFamilies: ["data_analyst", "sde"],
    supportedChannels: ["campus", "off_campus", "internship", "experienced"],
    competencyFrameworkId: "comp_deloitte_values",
  },
  {
    id: "tcs",
    name: "Tata Consultancy Services (TCS)",
    slug: "tcs",
    tierCategory: "ENTERPRISE_SERVICE",
    headquarters: "Mumbai, Maharashtra, India",
    overview:
      "Global IT services, consulting, and business solutions leader. Conducts TCS NQT (National Qualifier Test) offering Ninja, Digital, and Prime career tracks.",
    officialCareersUrl: "https://www.tcs.com/careers",
    supportedRoleFamilies: ["sde", "ai_ml", "data_analyst"],
    supportedChannels: ["campus", "off_campus"],
    competencyFrameworkId: "comp_tata_code",
  },
  {
    id: "infosys",
    name: "Infosys",
    slug: "infosys",
    tierCategory: "ENTERPRISE_SERVICE",
    headquarters: "Bengaluru, Karnataka, India",
    overview:
      "Next-generation digital services and consulting pioneer. Evaluates engineers through HackWithInfy / InfyTQ / Campus Recruitment across Systems Engineer (SE), Digital Specialist Engineer (DSE), and Specialist Programmer (SP).",
    officialCareersUrl: "https://www.infosys.com/careers/",
    supportedRoleFamilies: ["sde", "ai_ml", "data_analyst"],
    supportedChannels: ["campus", "off_campus"],
    competencyFrameworkId: "comp_infosys_clife",
  },
  {
    id: "accenture",
    name: "Accenture",
    slug: "accenture",
    tierCategory: "ENTERPRISE_SERVICE",
    headquarters: "Dublin, Ireland",
    overview:
      "Global professional services company with leading capabilities in digital, cloud, and security. Evaluates via cognitive, technical assessment, coding, and communication tests.",
    officialCareersUrl: "https://www.accenture.com/us-en/careers",
    supportedRoleFamilies: ["sde", "ai_ml", "data_analyst"],
    supportedChannels: ["campus", "off_campus"],
    competencyFrameworkId: "comp_accenture_values",
  },
  {
    id: "jpmorgan",
    name: "JPMorgan Chase & Co.",
    slug: "jpmorgan",
    tierCategory: "FINTECH_GLOBAL",
    headquarters: "New York City, New York, USA",
    overview:
      "Worldwide leader in financial services, investment banking, and asset management. Tech recruitment features HackerRank coding, HireVue on-demand video interviews, and high-impact Superday technical loops.",
    officialCareersUrl: "https://careers.jpmorgan.com",
    supportedRoleFamilies: ["sde", "ai_ml", "data_analyst"],
    supportedChannels: ["campus", "off_campus", "internship", "experienced"],
    competencyFrameworkId: "comp_jpmorgan_principles",
  },
];

export function getAllCompanies(): CompanyProfile[] {
  return [...RECRUITMENT_COMPANIES];
}

export function getCompanyById(id: string): CompanyProfile | null {
  return RECRUITMENT_COMPANIES.find((c) => c.id.toLowerCase() === id.toLowerCase()) || null;
}

export function getCompanyBySlug(slug: string): CompanyProfile | null {
  return RECRUITMENT_COMPANIES.find((c) => c.slug.toLowerCase() === slug.toLowerCase()) || null;
}

export function getCompaniesByTier(tier: CompanyTierCategory): CompanyProfile[] {
  return RECRUITMENT_COMPANIES.filter((c) => c.tierCategory === tier);
}

export function getCompaniesByRole(role: RoleFamily): CompanyProfile[] {
  return RECRUITMENT_COMPANIES.filter((c) => c.supportedRoleFamilies.includes(role));
}

export function getCompaniesByChannel(channel: HiringChannel): CompanyProfile[] {
  return RECRUITMENT_COMPANIES.filter((c) => c.supportedChannels.includes(channel));
}

