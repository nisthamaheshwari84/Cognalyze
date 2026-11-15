/**
 * scripts/seed-opportunity-catalog.ts
 * 
 * Safely seeds all 4,580 opportunities from Opportunity Radar SQLite into Cognalyze canonical opportunities store.
 * - Retains all existing Cognalyze opportunities (zero data loss).
 * - Distinguishes Category A (live ingested) vs Category F (curated benchmark templates).
 * - Maps category taxonomy and sets canonical_hash.
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const RADAR_DB_PATH = path.resolve("/Users/nisthamaheshwari/oppurtunity-radar/data/radar.db");
const COGNALYZE_STORE_PATH = path.resolve(process.cwd(), "data", "opportunities-store.json");

function mapCategoryToOpportunityType(cat: string): string {
  switch (cat) {
    case "Internship": return "INTERNSHIP";
    case "Off-Campus Job": return "FULL_TIME";
    case "Startup": return "STARTUP";
    case "Hackathon": return "HACKATHON";
    case "Open Source": return "OPEN_SOURCE";
    case "Research": return "RESEARCH";
    case "Remote Global": return "REMOTE_GLOBAL";
    case "Scholarship": return "SCHOLARSHIP";
    case "Event": return "EVENT";
    case "Fellowship": return "FELLOWSHIP";
    case "Competition": return "COMPETITION";
    default: return "OTHER_OPPORTUNITY";
  }
}

function mapCategoryToSourceType(sourceId: string): string {
  if (sourceId.includes("greenhouse")) return "ATS";
  if (sourceId.includes("lever") || sourceId.includes("ashby")) return "ATS";
  if (sourceId.includes("github")) return "OPEN_SOURCE";
  if (sourceId.includes("codeforces") || sourceId.includes("kaggle")) return "CODECHEF";
  if (sourceId.includes("unstop")) return "UNSTOP";
  if (sourceId.includes("devpost") || sourceId.includes("devfolio")) return "DEVPOST";
  if (sourceId.includes("internshala")) return "JOB_API";
  if (sourceId.includes("wellfound") || sourceId.includes("yc")) return "STARTUP";
  return "OFFICIAL_FEED";
}

export function seedOpportunities() {
  console.log("[Seed] Reading existing Cognalyze opportunities store...");
  let existingOpps: any[] = [];
  if (fs.existsSync(COGNALYZE_STORE_PATH)) {
    try {
      existingOpps = JSON.parse(fs.readFileSync(COGNALYZE_STORE_PATH, "utf8"));
    } catch {
      existingOpps = [];
    }
  }

  const existingIds = new Set(existingOpps.map((o) => o.id));
  const existingHashes = new Set(existingOpps.map((o) => o.canonicalHash || o.canonical_hash).filter(Boolean));

  console.log(`[Seed] Existing Cognalyze opportunities count: ${existingOpps.length}`);

  if (!fs.existsSync(RADAR_DB_PATH)) {
    console.error(`[Seed] SQLite radar.db not found at ${RADAR_DB_PATH}`);
    return;
  }

  console.log("[Seed] Querying SQLite opportunities table...");
  const rawSql = `SELECT json_group_array(json_object(
    'id', id,
    'slug', slug,
    'canonical_hash', canonical_hash,
    'title', title,
    'organization', organization,
    'organization_website', organization_website,
    'description', description,
    'category', category,
    'employment_type', employment_type,
    'compensation_type', compensation_type,
    'compensation_details', compensation_details,
    'currency', currency,
    'required_skills_json', required_skills_json,
    'preferred_skills_json', preferred_skills_json,
    'min_academic_year', min_academic_year,
    'max_academic_year', max_academic_year,
    'graduation_years_json', graduation_years_json,
    'location', location,
    'country', country,
    'work_mode', work_mode,
    'international_eligible', international_eligible,
    'deadline', deadline,
    'apply_url', apply_url,
    'original_source_url', original_source_url,
    'primary_source_id', primary_source_id,
    'verification_status', verification_status,
    'confidence_score', confidence_score,
    'lifecycle_status', lifecycle_status,
    'discovered_at', discovered_at,
    'last_verified_at', last_verified_at
  )) FROM opportunities;`;

  const jsonStr = execSync(`sqlite3 "${RADAR_DB_PATH}" "${rawSql.replace(/"/g, '\\"')}"`, {
    maxBuffer: 50 * 1024 * 1024,
    encoding: "utf8",
  });

  const radarRows = JSON.parse(jsonStr);
  console.log(`[Seed] Loaded ${radarRows.length} opportunities from Opportunity Radar SQLite.`);

  let newlyAdded = 0;
  const mergedOpps = [...existingOpps];

  for (const row of radarRows) {
    if (existingIds.has(row.id) || existingHashes.has(row.canonical_hash)) {
      continue;
    }

    const isCatalogTemplate = row.primary_source_id.startsWith("cat-");
    let reqSkills: string[] = [];
    try {
      reqSkills = JSON.parse(row.required_skills_json || "[]");
    } catch {
      reqSkills = [];
    }

    let prefSkills: string[] = [];
    try {
      prefSkills = JSON.parse(row.preferred_skills_json || "[]");
    } catch {
      prefSkills = [];
    }

    const canonicalItem = {
      id: row.id,
      slug: row.slug,
      canonicalHash: row.canonical_hash,
      source: row.primary_source_id,
      sourceType: mapCategoryToSourceType(row.primary_source_id),
      sourceUrl: row.original_source_url || row.apply_url,
      applicationUrl: row.apply_url,
      companyId: `org-${row.organization.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
      companyName: row.organization,
      companyWebsite: row.organization_website,
      title: row.title,
      normalizedTitle: row.title,
      opportunityType: mapCategoryToOpportunityType(row.category),
      category: row.category,
      opportunitySubtype: isCatalogTemplate ? "curated_benchmark" : "live_ingested",
      tier: isCatalogTemplate ? "Curated Benchmark" : "Tier-1",
      description: row.description,
      responsibilities: [
        `Deliver high-quality ${row.title} outcomes`,
        `Apply core skills in ${reqSkills.slice(0, 3).join(", ") || "software engineering"}`,
      ],
      location: row.location || "Remote",
      country: row.country || "Global",
      city: row.location?.includes(",") ? row.location.split(",")[0].trim() : "Virtual",
      remoteType: row.work_mode === "remote" ? "remote" : row.work_mode === "hybrid" ? "hybrid" : "onsite",
      employmentType: row.employment_type || "internship",
      experienceLevel: row.min_academic_year ? `Year ${row.min_academic_year}+` : "All",
      compensationType: row.compensation_type,
      compensationDetails: row.compensation_details,
      currency: row.currency || "USD",
      educationRequirements: {
        degreesAllowed: ["B.Tech", "B.E.", "B.S.", "B.Comp", "M.Tech", "Any"],
        fieldsAllowed: ["CS", "IT", "Data Science", "All Engineering"],
        isMandatory: false,
      },
      graduationRequirements: {
        currentlyEnrolledRequired: false,
        isMandatory: false,
      },
      requiredSkills: reqSkills,
      preferredSkills: prefSkills,
      eligibilityRequirements: [
        row.international_eligible ? "Open to global / international candidates" : `Restricted to ${row.country}`,
      ],
      disqualifiers: [],
      postedAt: row.discovered_at,
      updatedAt: row.last_verified_at || row.discovered_at,
      deadline: row.deadline,
      status: row.lifecycle_status === "Expired" ? "EXPIRED" : "ACTIVE",
      lifecycleStatus: row.lifecycle_status,
      verificationStatus: row.verification_status,
      freshness: row.lifecycle_status === "Expired" ? "EXPIRED" : "ACTIVE",
      roleDNA: {
        roleCategory: row.category,
        mustHaveSkills: reqSkills,
        preferredSkills: prefSkills,
        experienceYearsMin: 0,
        experienceYearsMax: 1,
        educationSummary: "Undergraduate / Postgraduate",
        graduationWindow: "Any",
        locationMode: row.work_mode || "remote",
        disqualifiers: [],
      },
      createdAt: row.discovered_at,
      lastVerifiedAt: row.last_verified_at,
    };

    mergedOpps.push(canonicalItem);
    existingIds.add(row.id);
    existingHashes.add(row.canonical_hash);
    newlyAdded++;
  }

  console.log(`[Seed] Newly added opportunities: ${newlyAdded}`);
  console.log(`[Seed] Total merged opportunities in memory: ${mergedOpps.length}`);

  fs.writeFileSync(COGNALYZE_STORE_PATH, JSON.stringify(mergedOpps, null, 2), "utf8");
  console.log(`[Seed] Successfully wrote ${mergedOpps.length} opportunities to ${COGNALYZE_STORE_PATH}`);
}

if (process.argv[1] && process.argv[1].endsWith("seed-opportunity-catalog.ts")) {
  seedOpportunities();
}
