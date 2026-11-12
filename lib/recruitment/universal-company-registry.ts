/**
 * lib/recruitment/universal-company-registry.ts
 * 
 * Enterprise-grade Universal Company Registry for the Cognalyze Recruitment Arena.
 * Supports universal search, multi-tier classification, geographical contextualization,
 * dynamic startup registration, and 15 canonical tech roles.
 */

import { CompanyProfile, CompanyTierCategory, RoleFamily, HiringChannel } from "./types";
import { RECRUITMENT_COMPANIES as SEED_COMPANIES } from "./company-registry";

export interface RoleFamilyMetadata {
  id: RoleFamily;
  label: string;
  category: "engineering" | "data_ai" | "product_design" | "consulting";
  description: string;
  coreCompetencies: string[];
}

export const CANONICAL_ROLE_FAMILIES: RoleFamilyMetadata[] = [
  {
    id: "sde",
    label: "Software Development Engineer (General)",
    category: "engineering",
    description: "Core algorithms, data structures, low-level object-oriented design, and reliable software systems.",
    coreCompetencies: ["algorithmic_coding", "system_design_lld", "data_structures", "problem_solving"],
  },
  {
    id: "frontend_engineer",
    label: "Frontend Engineer",
    category: "engineering",
    description: "Modern UI architecture, state management, DOM performance, rendering lifecycle, and accessibility.",
    coreCompetencies: ["frontend_architecture", "javascript_typescript", "ui_performance", "system_design_lld"],
  },
  {
    id: "backend_engineer",
    label: "Backend Engineer",
    category: "engineering",
    description: "High-throughput APIs, distributed concurrency, microservice architecture, and relational/NoSQL datastores.",
    coreCompetencies: ["api_architecture", "concurrency", "database_optimization", "system_design_hld"],
  },
  {
    id: "fullstack_engineer",
    label: "Full-Stack Engineer",
    category: "engineering",
    description: "End-to-end web architectures spanning performant client interfaces to scalable backend services.",
    coreCompetencies: ["algorithmic_coding", "api_architecture", "database_optimization", "frontend_architecture"],
  },
  {
    id: "ai_ml",
    label: "AI / Machine Learning Engineer",
    category: "data_ai",
    description: "Deep learning frameworks, model training, evaluation metrics, pipeline deployment, and PyTorch/TensorFlow.",
    coreCompetencies: ["machine_learning_algorithms", "python_deep_learning", "model_evaluation", "data_pipelines"],
  },
  {
    id: "data_scientist",
    label: "Data Scientist",
    category: "data_ai",
    description: "Statistical modeling, predictive analytics, hypothesis testing, feature engineering, and executive storytelling.",
    coreCompetencies: ["statistical_inference", "python_analytics", "feature_engineering", "business_impact"],
  },
  {
    id: "data_engineer",
    label: "Data Engineer",
    category: "data_ai",
    description: "Large-scale batch and streaming ETL pipelines, distributed query engines, partitioning, and data lakehouse architecture.",
    coreCompetencies: ["sql_database", "data_pipelines", "distributed_systems", "spark_lakehouse"],
  },
  {
    id: "data_analyst",
    label: "Data Analyst",
    category: "data_ai",
    description: "Relational SQL querying, business metrics, cohort analysis, exploratory data analysis, and dashboard synthesis.",
    coreCompetencies: ["sql_database", "business_metrics", "exploratory_analysis", "communication"],
  },
  {
    id: "devops_cloud_engineer",
    label: "DevOps & Cloud Infrastructure Engineer",
    category: "engineering",
    description: "Container orchestration, CI/CD automation, cloud architecture (AWS/GCP/Azure), and site reliability engineering.",
    coreCompetencies: ["cloud_architecture", "ci_cd_automation", "linux_systems", "infrastructure_as_code"],
  },
  {
    id: "cybersecurity_engineer",
    label: "Cybersecurity & Application Security Engineer",
    category: "engineering",
    description: "Threat modeling, authentication protocols (OAuth2/OIDC), vulnerability remediation, cryptography, and network defense.",
    coreCompetencies: ["security_fundamentals", "threat_modeling", "cryptography", "secure_coding"],
  },
  {
    id: "qa_sdet",
    label: "Software Development Engineer in Test (SDET)",
    category: "engineering",
    description: "Automated test frameworks, test pyramid execution, regression suites, performance benchmarking, and flaky test triage.",
    coreCompetencies: ["test_automation", "algorithmic_coding", "ci_cd_integration", "system_reliability"],
  },
  {
    id: "product_manager",
    label: "Technical Product Manager",
    category: "product_design",
    description: "Product vision, user research, roadmap prioritization, feature specification, KPI tracking, and cross-functional leadership.",
    coreCompetencies: ["product_strategy", "user_centricity", "analytical_thinking", "stakeholder_alignment"],
  },
  {
    id: "business_analyst",
    label: "Business & Strategy Analyst",
    category: "consulting",
    description: "Client requirements translation, process mapping, case study financial modeling, and operational consulting.",
    coreCompetencies: ["business_case_analysis", "structured_problem_solving", "quantitative_aptitude", "executive_presentation"],
  },
  {
    id: "quantitative_analyst",
    label: "Quantitative Analyst / FinTech Engineer",
    category: "data_ai",
    description: "High-frequency algorithms, risk modeling, numerical optimization, stochastic calculus, and low-latency C++/Python.",
    coreCompetencies: ["quantitative_aptitude", "low_latency_algorithms", "statistical_inference", "algorithmic_coding"],
  },
  {
    id: "ui_ux_engineer",
    label: "UI/UX Product Designer & Design Engineer",
    category: "product_design",
    description: "User journey mapping, design systems, interactive prototyping, cognitive walkthroughs, and frontend craft.",
    coreCompetencies: ["design_systems", "user_research", "interaction_design", "frontend_architecture"],
  },
  {
    id: "custom",
    label: "Custom / Role-Specific Track",
    category: "engineering",
    description: "Dynamically calibrated recruitment blueprint tailored to candidate target role and specific Job Description.",
    coreCompetencies: ["algorithmic_coding", "domain_expertise", "problem_solving", "communication"],
  },
];

export interface GeographicRegion {
  id: string;
  label: string;
  flagEmoji: string;
  countryCode: string;
}

export const SUPPORTED_GEOGRAPHIES: GeographicRegion[] = [
  { id: "India", label: "India", flagEmoji: "🇮🇳", countryCode: "IN" },
  { id: "US", label: "United States", flagEmoji: "🇺🇸", countryCode: "US" },
  { id: "UK", label: "United Kingdom", flagEmoji: "🇬🇧", countryCode: "UK" },
  { id: "Ireland", label: "Ireland", flagEmoji: "🇮🇪", countryCode: "IE" },
  { id: "Singapore", label: "Singapore", flagEmoji: "🇸🇬", countryCode: "SG" },
  { id: "Germany", label: "Germany / Europe", flagEmoji: "🇩🇪", countryCode: "DE" },
  { id: "Canada", label: "Canada", flagEmoji: "🇨🇦", countryCode: "CA" },
  { id: "Remote", label: "Global Remote", flagEmoji: "🌐", countryCode: "REMOTE" },
  { id: "Global", label: "Global / Universal", flagEmoji: "🌍", countryCode: "GLOBAL" },
];

export const HIRING_CHANNELS_LIST: { id: HiringChannel; label: string; description: string }[] = [
  { id: "campus", label: "Campus Recruitment", description: "Standard university placement drive with cognitive and coding online rounds." },
  { id: "off_campus", label: "Off-Campus Drive", description: "National qualifiers or open hiring portal assessments." },
  { id: "internship", label: "Summer / Pre-Placement Internship", description: "Evaluates foundational problem solving, aptitude, and high growth potential." },
  { id: "experienced", label: "Experienced Professional", description: "Focused on depth in systems architecture, past project ownership, and behavioral depth." },
  { id: "graduate_scheme", label: "Graduate Scheme (EU/UK)", description: "Structured multi-stage scheme emphasizing strengths, collaboration, and case simulations." },
  { id: "lateral", label: "Lateral Direct Hire", description: "Fast-tracked technical screens and senior competency evaluation." },
];

/**
 * Universal Seed Registry extending the initial 10 companies to 25+ major employers
 * across FAANG, High-Growth Tech, Global Enterprise Services, FinTech, and Consulting.
 */
export const EXTENDED_ENTERPRISE_REGISTRY: CompanyProfile[] = [
  ...SEED_COMPANIES.map((c) => ({
    ...c,
    domain: `${c.id}.com`,
    hiringGeographies: ["India", "US", "Global", "UK", "Ireland", "Singapore"],
    confidenceScore: 98,
  })),
  {
    id: "apple",
    name: "Apple",
    slug: "apple",
    domain: "apple.com",
    tierCategory: "TIER_1_FAANG",
    headquarters: "Cupertino, California, USA",
    regionalOffices: ["Austin, Texas", "Hyderabad, India", "Cork, Ireland", "London, UK"],
    overview:
      "Global leader in consumer electronics, operating systems, and custom silicon. Evaluates engineers on precision, low-level performance, clean design, and craft.",
    officialCareersUrl: "https://www.apple.com/careers/",
    supportedRoleFamilies: ["sde", "frontend_engineer", "backend_engineer", "ai_ml", "devops_cloud_engineer", "qa_sdet"],
    supportedChannels: ["campus", "off_campus", "internship", "experienced"],
    hiringGeographies: ["US", "India", "Ireland", "UK", "Global"],
    confidenceScore: 95,
  },
  {
    id: "meta",
    name: "Meta",
    slug: "meta",
    domain: "meta.com",
    tierCategory: "TIER_1_FAANG",
    headquarters: "Menlo Park, California, USA",
    regionalOffices: ["London, UK", "Singapore", "New York, USA", "Remote"],
    overview:
      "Social technology and metaverse infrastructure company (Facebook, Instagram, WhatsApp, Llama). Known for fast-paced 45-minute coding rounds and systems architecture.",
    officialCareersUrl: "https://www.metacareers.com",
    supportedRoleFamilies: ["sde", "frontend_engineer", "backend_engineer", "ai_ml", "data_engineer", "product_manager"],
    supportedChannels: ["campus", "internship", "experienced"],
    hiringGeographies: ["US", "UK", "Singapore", "Remote", "Global"],
    confidenceScore: 96,
  },
  {
    id: "netflix",
    name: "Netflix",
    slug: "netflix",
    domain: "netflix.com",
    tierCategory: "TIER_1_FAANG",
    headquarters: "Los Gatos, California, USA",
    regionalOffices: ["Amsterdam, Netherlands", "Los Angeles, USA", "Remote"],
    overview:
      "Streaming entertainment pioneer. Evaluates engineers on freedom, responsibility, extreme ownership, and massive-scale distributed microservices.",
    officialCareersUrl: "https://jobs.netflix.com",
    supportedRoleFamilies: ["sde", "backend_engineer", "data_engineer", "ai_ml", "devops_cloud_engineer"],
    supportedChannels: ["experienced", "lateral"],
    hiringGeographies: ["US", "Germany", "Remote", "Global"],
    confidenceScore: 92,
  },
  {
    id: "uber",
    name: "Uber",
    slug: "uber",
    domain: "uber.com",
    tierCategory: "HIGH_GROWTH_PRODUCT",
    headquarters: "San Francisco, California, USA",
    regionalOffices: ["Bengaluru, India", "Hyderabad, India", "Amsterdam, Netherlands"],
    overview:
      "Global mobility and delivery platform. Technical hiring focuses heavily on concurrent algorithms, real-time dispatch systems, graph algorithms, and system reliability.",
    officialCareersUrl: "https://www.uber.com/us/en/careers/",
    supportedRoleFamilies: ["sde", "backend_engineer", "ai_ml", "data_scientist", "devops_cloud_engineer"],
    supportedChannels: ["campus", "off_campus", "internship", "experienced"],
    hiringGeographies: ["India", "US", "Germany", "Global"],
    confidenceScore: 94,
  },
  {
    id: "salesforce",
    name: "Salesforce",
    slug: "salesforce",
    domain: "salesforce.com",
    tierCategory: "HIGH_GROWTH_PRODUCT",
    headquarters: "San Francisco, California, USA",
    regionalOffices: ["Hyderabad, India", "Dublin, Ireland", "London, UK"],
    overview:
      "World's leading CRM and enterprise cloud application platform. Emphasizes clean code, multi-tenant architecture, algorithms, and Ohana core values.",
    officialCareersUrl: "https://www.salesforce.com/company/careers/",
    supportedRoleFamilies: ["sde", "fullstack_engineer", "backend_engineer", "devops_cloud_engineer", "qa_sdet"],
    supportedChannels: ["campus", "off_campus", "internship", "experienced"],
    hiringGeographies: ["US", "India", "Ireland", "UK", "Global"],
    confidenceScore: 94,
  },
  {
    id: "stripe",
    name: "Stripe",
    slug: "stripe",
    domain: "stripe.com",
    tierCategory: "HIGH_GROWTH_PRODUCT",
    headquarters: "San Francisco, USA & Dublin, Ireland",
    regionalOffices: ["Dublin, Ireland", "Singapore", "London, UK", "Remote"],
    overview:
      "Financial infrastructure for the internet. Technical assessments uniquely use real-world codebases, git diff debugging, bug investigations, and clean API design.",
    officialCareersUrl: "https://stripe.com/jobs",
    supportedRoleFamilies: ["sde", "backend_engineer", "frontend_engineer", "cybersecurity_engineer", "product_manager"],
    supportedChannels: ["campus", "internship", "experienced"],
    hiringGeographies: ["US", "Ireland", "UK", "Singapore", "Remote"],
    confidenceScore: 95,
  },
  {
    id: "databricks",
    name: "Databricks",
    slug: "databricks",
    domain: "databricks.com",
    tierCategory: "HIGH_GROWTH_PRODUCT",
    headquarters: "San Francisco, California, USA",
    regionalOffices: ["Bengaluru, India", "Amsterdam, Netherlands", "London, UK"],
    overview:
      "Pioneer of Apache Spark and Unified Data & AI Lakehouse platforms. Evaluates deep algorithmic optimizations, distributed storage internals, and systems programming.",
    officialCareersUrl: "https://www.databricks.com/company/careers",
    supportedRoleFamilies: ["sde", "data_engineer", "ai_ml", "backend_engineer"],
    supportedChannels: ["campus", "internship", "experienced"],
    hiringGeographies: ["US", "India", "Germany", "Global"],
    confidenceScore: 93,
  },
  {
    id: "goldman_sachs",
    name: "Goldman Sachs",
    slug: "goldman-sachs",
    domain: "goldmansachs.com",
    tierCategory: "FINTECH_GLOBAL",
    headquarters: "New York City, New York, USA",
    regionalOffices: ["Bengaluru, India", "Hyderabad, India", "London, UK", "Singapore"],
    overview:
      "Leading global investment bank and financial services firm. Engineering assessments test advanced math, competitive programming algorithms, and Superday technical loops.",
    officialCareersUrl: "https://www.goldmansachs.com/careers/",
    supportedRoleFamilies: ["sde", "quantitative_analyst", "data_analyst", "cybersecurity_engineer"],
    supportedChannels: ["campus", "off_campus", "internship", "experienced"],
    hiringGeographies: ["US", "India", "UK", "Singapore", "Global"],
    confidenceScore: 97,
  },
  {
    id: "morgan_stanley",
    name: "Morgan Stanley",
    slug: "morgan-stanley",
    domain: "morganstanley.com",
    tierCategory: "FINTECH_GLOBAL",
    headquarters: "New York City, New York, USA",
    regionalOffices: ["Mumbai, India", "Bengaluru, India", "London, UK", "Tokyo, Japan"],
    overview:
      "Global wealth management and investment banking enterprise. Evaluates engineers on object-oriented programming, data structures, relational SQL, and institutional values.",
    officialCareersUrl: "https://www.morganstanley.com/people-opportunities/students-graduates",
    supportedRoleFamilies: ["sde", "data_analyst", "quantitative_analyst", "devops_cloud_engineer"],
    supportedChannels: ["campus", "off_campus", "internship", "experienced"],
    hiringGeographies: ["US", "India", "UK", "Global"],
    confidenceScore: 95,
  },
  {
    id: "wipro",
    name: "Wipro",
    slug: "wipro",
    domain: "wipro.com",
    tierCategory: "ENTERPRISE_SERVICE",
    headquarters: "Bengaluru, Karnataka, India",
    overview:
      "Multinational IT consulting and digital solutions corporation. Features the Wipro Elite National Talent Hunt (NTH) and Turbo tracks testing quantitative, coding, and English aptitude.",
    officialCareersUrl: "https://careers.wipro.com/",
    supportedRoleFamilies: ["sde", "fullstack_engineer", "data_analyst", "devops_cloud_engineer"],
    supportedChannels: ["campus", "off_campus"],
    hiringGeographies: ["India", "US", "Global"],
    confidenceScore: 95,
  },
  {
    id: "cognizant",
    name: "Cognizant",
    slug: "cognizant",
    domain: "cognizant.com",
    tierCategory: "ENTERPRISE_SERVICE",
    headquarters: "Teaneck, New Jersey, USA / Chennai, India",
    overview:
      "Global provider of IT consulting and outsourcing services. Organizes hiring into GenC, GenC Elevate, and GenC Next tracks with tiered technical assessments.",
    officialCareersUrl: "https://careers.cognizant.com",
    supportedRoleFamilies: ["sde", "fullstack_engineer", "data_analyst", "qa_sdet"],
    supportedChannels: ["campus", "off_campus"],
    hiringGeographies: ["India", "US", "Global"],
    confidenceScore: 94,
  },
  {
    id: "pwc",
    name: "PwC (PricewaterhouseCoopers)",
    slug: "pwc",
    domain: "pwc.com",
    tierCategory: "GLOBAL_CONSULTING",
    headquarters: "London, United Kingdom",
    regionalOffices: ["New York, USA", "Mumbai, India", "Dublin, Ireland"],
    overview:
      "Global Big 4 accounting and management consultancy. Uses game-based cognitive assessments, video screening, case study problem solving, and partner interviews.",
    officialCareersUrl: "https://jobs.pwc.com/",
    supportedRoleFamilies: ["data_analyst", "business_analyst", "cybersecurity_engineer", "devops_cloud_engineer"],
    supportedChannels: ["campus", "graduate_scheme", "experienced"],
    hiringGeographies: ["UK", "US", "India", "Ireland", "Global"],
    confidenceScore: 93,
  },
  {
    id: "ey",
    name: "EY (Ernst & Young)",
    slug: "ey",
    domain: "ey.com",
    tierCategory: "GLOBAL_CONSULTING",
    headquarters: "London, United Kingdom",
    regionalOffices: ["New York, USA", "Bengaluru, India", "Frankfurt, Germany"],
    overview:
      "Multinational professional services network. Evaluates candidates on numerical reasoning, inductive logic, structured business cases, and technology consulting.",
    officialCareersUrl: "https://careers.ey.com/",
    supportedRoleFamilies: ["data_analyst", "business_analyst", "sde", "cybersecurity_engineer"],
    supportedChannels: ["campus", "graduate_scheme", "experienced"],
    hiringGeographies: ["UK", "US", "India", "Germany", "Global"],
    confidenceScore: 92,
  },
];

// In-memory custom/dynamic company registry store for user-discovered startups
const CUSTOM_COMPANIES_STORE: Map<string, CompanyProfile> = new Map();

/**
 * Universal search and retrieval across verified enterprises and user-added organizations.
 */
export function searchCompanies(query: string): CompanyProfile[] {
  const normalized = query.trim().toLowerCase();
  const all = getAllUniversalCompanies();

  if (!normalized) {
    return all;
  }

  return all.filter((c) => {
    return (
      c.name.toLowerCase().includes(normalized) ||
      c.slug.toLowerCase().includes(normalized) ||
      (c.domain && c.domain.toLowerCase().includes(normalized)) ||
      c.overview.toLowerCase().includes(normalized) ||
      c.headquarters.toLowerCase().includes(normalized)
    );
  });
}

/**
 * Returns all active companies including pre-seeded enterprises and dynamically registered startups.
 */
export function getAllUniversalCompanies(): CompanyProfile[] {
  const customList = Array.from(CUSTOM_COMPANIES_STORE.values());
  return [...EXTENDED_ENTERPRISE_REGISTRY, ...customList];
}

/**
 * Finds a company by ID or Slug.
 */
export function getUniversalCompanyById(idOrSlug: string): CompanyProfile | null {
  const normalized = idOrSlug.trim().toLowerCase();
  const all = getAllUniversalCompanies();
  return (
    all.find(
      (c) => c.id.toLowerCase() === normalized || c.slug.toLowerCase() === normalized
    ) || null
  );
}

/**
 * Registers a newly discovered or user-entered organization into the universal catalog.
 */
export function registerCustomCompany(params: {
  name: string;
  domain?: string;
  overview?: string;
  headquarters?: string;
  tierCategory?: CompanyTierCategory;
  officialCareersUrl?: string;
  supportedRoles?: RoleFamily[];
  supportedChannels?: HiringChannel[];
  hiringGeographies?: string[];
}): CompanyProfile {
  const slug = params.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const id = `custom_${slug}_${Date.now().toString(36)}`;

  const newProfile: CompanyProfile = {
    id,
    name: params.name,
    slug,
    domain: params.domain || `${slug}.com`,
    tierCategory: params.tierCategory || "EARLY_STAGE_STARTUP",
    headquarters: params.headquarters || "Global Remote",
    overview:
      params.overview ||
      `${params.name} is a high-growth technology organization evaluated through Cognalyze universal competency benchmarks.`,
    officialCareersUrl: params.officialCareersUrl || `https://${params.domain || `${slug}.com`}/careers`,
    supportedRoleFamilies:
      params.supportedRoles && params.supportedRoles.length > 0
        ? params.supportedRoles
        : ["sde", "fullstack_engineer", "backend_engineer", "frontend_engineer", "custom"],
    supportedChannels:
      params.supportedChannels && params.supportedChannels.length > 0
        ? params.supportedChannels
        : ["campus", "off_campus", "experienced"],
    hiringGeographies:
      params.hiringGeographies && params.hiringGeographies.length > 0
        ? params.hiringGeographies
        : ["India", "US", "Remote", "Global"],
    isCustomCompany: true,
    discoveredAt: new Date().toISOString(),
    confidenceScore: 75,
  };

  CUSTOM_COMPANIES_STORE.set(id, newProfile);
  return newProfile;
}

/**
 * Returns role metadata for any canonical role family.
 */
export function getRoleMetadata(roleId: RoleFamily): RoleFamilyMetadata {
  return (
    CANONICAL_ROLE_FAMILIES.find((r) => r.id === roleId) || {
      id: roleId,
      label: roleId.toUpperCase(),
      category: "engineering",
      description: "Custom role specification calibrated to job description.",
      coreCompetencies: ["algorithmic_coding", "problem_solving", "communication"],
    }
  );
}

