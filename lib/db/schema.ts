/**
 * COGNALYZE EVIDENCE OPERATING SYSTEM — DRIZZLE SCHEMA (SPINE DATA MODEL)
 * 
 * Part 3 Spine Tables:
 * Role -> Requirements -> Sources -> Claims + Evidence -> Assessments -> Validation Plans -> Decisions -> Outcomes
 * 
 * Strict Type-Safety, Org-Scoped, Additive, Zero-Fabrication.
 */

import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  jsonb,
  varchar,
  index,
} from "drizzle-orm/pg-core";

// ─── 1. ORGANIZATIONS & MEMBERSHIP ───
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  feedbackDisclosureMode: varchar("feedback_disclosure_mode", { length: 32 })
    .default("opt_in_per_role")
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const members = pgTable("members", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  userId: text("user_id").notNull(), // Clerk User ID
  role: varchar("role", { length: 32 }).notNull().default("recruiter"), // "admin" | "recruiter" | "interviewer" | "viewer"
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("members_org_user_idx").on(t.orgId, t.userId),
]);

// ─── 2. ROLES & REQUIREMENTS ───
export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  jdRaw: text("jd_raw").notNull(),
  hiresTarget: integer("hires_target").default(1).notNull(),
  status: varchar("status", { length: 32 }).default("active").notNull(), // "active" | "closed" | "draft"
  version: integer("version").default(1).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("roles_org_idx").on(t.orgId),
]);

export const roleRequirements = pgTable("role_requirements", {
  id: uuid("id").primaryKey().defaultRandom(),
  roleId: uuid("role_id").references(() => roles.id, { onDelete: "cascade" }).notNull(),
  text: text("text").notNull(),
  category: varchar("category", { length: 32 }).notNull(), // "core" | "trainable" | "evaluated" | "context"
  origin: varchar("origin", { length: 32 }).notNull(), // "llm_proposed" | "recruiter_added" | "recruiter_edited"
  jdSpan: jsonb("jd_span"), // { startChar: number, endChar: number, rawSnippet: string }
  status: varchar("status", { length: 32 }).default("active").notNull(), // "active" | "dismissed"
  version: integer("version").default(1).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("role_req_role_idx").on(t.roleId),
]);

// ─── 3. PERSONS & APPLICATIONS ───
export const persons = pgTable("persons", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "set null" }),
  userId: text("user_id"), // Optional Clerk ID if linked
  fullName: text("full_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  isSynthetic: boolean("is_synthetic").default(false).notNull(), // Anti-Simulation: flagged if seed test data
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const applications = pgTable("applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  personId: uuid("person_id").references(() => persons.id, { onDelete: "cascade" }).notNull(),
  roleId: uuid("role_id").references(() => roles.id, { onDelete: "cascade" }).notNull(),
  stage: varchar("stage", { length: 32 }).default("applied").notNull(), // "applied" | "screened" | "deep_review" | "interview" | "finalists" | "hired" | "rejected"
  channel: varchar("channel", { length: 64 }).default("direct_upload").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("apps_role_idx").on(t.roleId),
  index("apps_person_idx").on(t.personId),
]);

// ─── 4. SOURCES, CLAIMS, & EVIDENCE ITEMS ───
export const sources = pgTable("sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  personId: uuid("person_id").references(() => persons.id, { onDelete: "cascade" }).notNull(),
  type: varchar("type", { length: 64 }).notNull(), // "resume_pdf" | "github" | "work_sample" | "assessment" | "interview" | "candidate_submitted" | "cognalyze_activity" | "reference" | "post"
  uriBlobKey: text("uri_blob_key"),
  contentHash: text("content_hash").notNull(),
  retrievedAt: timestamp("retrieved_at", { withTimezone: true }).defaultNow().notNull(),
  consentGrantId: uuid("consent_grant_id"),
  rawTextRef: text("raw_text_ref"),
}, (t) => [
  index("sources_person_idx").on(t.personId),
]);

export const claims = pgTable("claims", {
  id: uuid("id").primaryKey().defaultRandom(),
  personId: uuid("person_id").references(() => persons.id, { onDelete: "cascade" }).notNull(),
  sourceId: uuid("source_id").references(() => sources.id, { onDelete: "cascade" }).notNull(),
  kind: varchar("kind", { length: 32 }).notNull(), // "skill" | "project" | "role_held" | "responsibility" | "achievement" | "education"
  text: text("text").notNull(),
  span: jsonb("span"), // { startChar: number, endChar: number }
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const evidenceItems = pgTable("evidence_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  personId: uuid("person_id").references(() => persons.id, { onDelete: "cascade" }).notNull(),
  sourceId: uuid("source_id").references(() => sources.id, { onDelete: "cascade" }).notNull(),
  span: jsonb("span"), // { startChar: number, endChar: number }
  quote: text("quote").notNull(), // verbatim verified quote
  artifactRef: text("artifact_ref"), // repo URL, commit hash, or submission key
  tier: varchar("tier", { length: 8 }).notNull(), // "T0" | "T1" | "T2" | "T3" | "T4"
  occurredAt: timestamp("occurred_at", { withTimezone: true }),
  observedAt: timestamp("observed_at", { withTimezone: true }).defaultNow().notNull(),
  verificationStatus: varchar("verification_status", { length: 32 }).default("verified").notNull(), // "verified" | "rejected" | "pending"
  extractor: varchar("extractor", { length: 64 }).notNull(), // "deterministic" | "llm(model,prompt_version)" | "human"
  quoteVerified: boolean("quote_verified").default(false).notNull(), // verified by deterministic quote verifier
  supersedesId: uuid("supersedes_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("evidence_person_idx").on(t.personId),
  index("evidence_source_idx").on(t.sourceId),
]);

// ─── 5. CAPABILITY GRAPH & EVIDENCE LINKS ───
export const capabilityNodes = pgTable("capability_nodes", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  category: varchar("category", { length: 64 }).notNull(),
  description: text("description"),
});

export const capabilityEdges = pgTable("capability_edges", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceNodeId: uuid("source_node_id").references(() => capabilityNodes.id, { onDelete: "cascade" }).notNull(),
  targetNodeId: uuid("target_node_id").references(() => capabilityNodes.id, { onDelete: "cascade" }).notNull(),
  kind: varchar("kind", { length: 32 }).notNull(), // "part_of" | "related_to" | "prerequisite_of" | "transferable_to"
  origin: varchar("origin", { length: 32 }).default("curated").notNull(), // "curated" | "proposed"
  justification: text("justification"),
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
});

export const evidenceLinks = pgTable("evidence_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  evidenceId: uuid("evidence_id").references(() => evidenceItems.id, { onDelete: "cascade" }).notNull(),
  capabilityNodeId: uuid("capability_node_id").references(() => capabilityNodes.id, { onDelete: "set null" }),
  claimId: uuid("claim_id").references(() => claims.id, { onDelete: "set null" }),
  requirementId: uuid("requirement_id").references(() => roleRequirements.id, { onDelete: "set null" }),
  relation: varchar("relation", { length: 32 }).notNull(), // "supports" | "partially_supports" | "adjacent_to" | "contradicts"
  coverage: varchar("coverage", { length: 16 }).notNull(), // "direct" | "adjacent" | "partial"
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("links_evidence_idx").on(t.evidenceId),
  index("links_req_idx").on(t.requirementId),
]);

// ─── 6. ASSESSMENTS (APPEND-ONLY HISTORY) ───
export const assessments = pgTable("assessments", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "cascade" }).notNull(),
  requirementId: uuid("requirement_id").references(() => roleRequirements.id, { onDelete: "cascade" }).notNull(),
  state: varchar("state", { length: 64 }).notNull(), // "ESTABLISHED" | "PARTIAL" | "UNKNOWN" | "CONFLICTING" | "NOT_ESTABLISHED_AFTER_VALIDATION" | "NOT_APPLICABLE"
  derivationVersion: varchar("derivation_version", { length: 32 }).notNull(),
  inputEvidenceIds: jsonb("input_evidence_ids").notNull(), // array of UUIDs
  explanation: text("explanation").notNull(),
  computedAt: timestamp("computed_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("assessments_app_idx").on(t.applicationId),
]);

// ─── 7. VALIDATION PLANS, METHODS, TASKS, RESULTS ───
export const validationMethods = pgTable("validation_methods", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  resolves: jsonb("resolves").notNull(), // capability categories or state types it resolves
  candidateMinutes: integer("candidate_minutes").notNull(),
  recruiterMinutes: integer("recruiter_minutes").notNull(),
  elapsedTimeHours: integer("elapsed_time_hours").default(24).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const validationPlans = pgTable("validation_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "cascade" }).notNull(),
  status: varchar("status", { length: 32 }).default("proposed").notNull(), // "proposed" | "approved" | "rejected" | "in_progress" | "completed"
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const validationTasks = pgTable("validation_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  planId: uuid("plan_id").references(() => validationPlans.id, { onDelete: "cascade" }).notNull(),
  methodId: uuid("method_id").references(() => validationMethods.id, { onDelete: "cascade" }).notNull(),
  targetAssessmentIds: jsonb("target_assessment_ids").notNull(),
  generatedContent: jsonb("generated_content").notNull(), // questions, coding sandbox specs, or modification task linked to requirement_id
  rubric: jsonb("rubric").notNull(),
  status: varchar("status", { length: 32 }).default("pending").notNull(), // "pending" | "assigned" | "completed" | "cancelled"
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const validationResults = pgTable("validation_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id").references(() => validationTasks.id, { onDelete: "cascade" }).notNull(),
  rubricObservations: jsonb("rubric_observations").notNull(),
  outcome: varchar("outcome", { length: 32 }).notNull(), // "established" | "not_established" | "partial"
  recordedBy: text("recorded_by").notNull(), // human interviewer or evaluator
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── 8. DECISIONS & IMMUTABLE SNAPSHOTS ───
export const decisions = pgTable("decisions", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "cascade" }).notNull(),
  deciderUserId: text("decider_user_id").notNull(),
  decision: varchar("decision", { length: 32 }).notNull(), // "advance" | "hire" | "reject" | "hold"
  rationale: text("rationale").notNull(),
  citedEvidenceIds: jsonb("cited_evidence_ids").notNull(),
  assessmentsSnapshot: jsonb("assessments_snapshot").notNull(), // immutable frozen state of all assessments at decision time
  decidedAt: timestamp("decided_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("decisions_app_idx").on(t.applicationId),
]);

// ─── 9. STAGE EVENTS (SINGLE SOURCE FOR PROCESS ANALYTICS) ───
export const stageEvents = pgTable("stage_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "cascade" }).notNull(),
  fromStage: varchar("from_stage", { length: 32 }),
  toStage: varchar("to_stage", { length: 32 }).notNull(),
  actorUserId: text("actor_user_id").notNull(),
  reason: text("reason"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("stage_events_app_idx").on(t.applicationId),
]);

// ─── 10. OUTCOMES (30 / 60 / 90-DAY GATED LEARNING) ───
export const outcomes = pgTable("outcomes", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "cascade" }).notNull(),
  checkpoint: integer("checkpoint").notNull(), // 30 | 60 | 90
  structuredFields: jsonb("structured_fields").notNull(), // per requirement: expectation met | not met | not observed
  notes: text("notes"),
  recordedBy: text("recorded_by").notNull(),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("outcomes_app_idx").on(t.applicationId),
]);

// ─── 11. PRIVACY, CONSENT, AUDIT, DURABLE JOBS, AI LOGGING ───
export const consentGrants = pgTable("consent_grants", {
  id: uuid("id").primaryKey().defaultRandom(),
  personId: uuid("person_id").references(() => persons.id, { onDelete: "cascade" }).notNull(),
  granteeOrgId: uuid("grantee_org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  scope: jsonb("scope").notNull(), // array of allowed data scopes
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "set null" }),
  actorId: text("actor_id").notNull(),
  action: varchar("action", { length: 64 }).notNull(),
  targetEntityType: varchar("target_entity_type", { length: 64 }).notNull(),
  targetEntityId: text("target_entity_id").notNull(),
  details: jsonb("details"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("audit_org_idx").on(t.orgId),
]);

export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 64 }).notNull(), // "bulk_resume_split" | "evidence_extraction" | "baseline_matcher" | "derive_assessments"
  status: varchar("status", { length: 32 }).default("queued").notNull(), // "queued" | "running" | "completed" | "failed" | "cancelled"
  payload: jsonb("payload"),
  progress: jsonb("progress"), // { processed: number, total: number, step: string }
  result: jsonb("result"),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("jobs_status_idx").on(t.status),
]);

export const aiRuns = pgTable("ai_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "set null" }),
  model: varchar("model", { length: 64 }).notNull(),
  promptVersion: varchar("prompt_version", { length: 32 }).notNull(),
  inputHash: varchar("input_hash", { length: 64 }).notNull(),
  outputHash: varchar("output_hash", { length: 64 }).notNull(),
  costUsd: numeric("cost_usd", { precision: 8, scale: 6 }).default("0").notNull(),
  latencyMs: integer("latency_ms").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("ai_runs_hash_idx").on(t.inputHash),
]);

// ─── 11. EVIDENCE LAYER (CANONICAL PROOF TABLE) ───
export const evidence = pgTable("evidence", {
  id: uuid("id").primaryKey().defaultRandom(),
  candidateId: uuid("candidate_id"),
  roleId: uuid("role_id"),
  source: text("source").notNull(),              // 'github' | 'leetcode' | 'codeforces' | 'resume' | 'interview' | 'behavioral'
  claim: text("claim").notNull(),                 // e.g. "backend API development"
  rawData: jsonb("raw_data"),                    // unmodified API response, kept for audit trail
  normalizedFacts: jsonb("normalized_facts"),    // code-layer-extracted structured facts
  extractedSummary: text("extracted_summary"),    // LLM Step 1 output — facts only, no verdict
  status: text("status").notNull(),              // established | partial | unknown | conflicting
  statusReason: text("status_reason"),            // LLM Step 2 output — one line, evidence-cited
  roleRelevance: text("role_relevance"),         // which JD requirement this maps to
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow(),
}, (t) => [
  index("evidence_candidate_role_idx").on(t.candidateId, t.roleId),
]);

// ─── 12. IDENTITY & AUTHENTICATION (PRODUCTION TABLES) ───
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  passwordSalt: text("password_salt"),
  accountType: varchar("account_type", { length: 32 }).notNull(), // "student" | "recruiter"
  status: varchar("status", { length: 32 }).notNull().default("EMAIL_PENDING"),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("users_email_idx").on(t.email),
]);

export const studentProfiles = pgTable("student_profiles", {
  id: uuid("id").primaryKey().defaultRandom(), // Permanent Immutable student_profile_id
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  username: varchar("username", { length: 32 }).notNull().unique(), // Normalized lowercase
  fullName: text("full_name").notNull(),
  college: text("college"),
  degree: text("degree"),
  graduationYear: varchar("graduation_year", { length: 16 }),
  primaryInterests: jsonb("primary_interests").$type<string[]>(),
  profileStatus: varchar("profile_status", { length: 32 }).default("IDENTITY_VERIFIED").notNull(),
  privacySetting: varchar("privacy_setting", { length: 32 }).default("PUBLIC").notNull(),
  lastUsernameChangeAt: timestamp("last_username_change_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("student_profiles_username_idx").on(t.username),
]);

export const recruiterProfiles = pgTable("recruiter_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "set null" }),
  fullName: text("full_name").notNull(),
  designation: text("designation").notNull(),
  workEmail: text("work_email").notNull(),
  status: varchar("status", { length: 32 }).default("EMAIL_PENDING").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const connectedAccounts = pgTable("connected_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  provider: varchar("provider", { length: 32 }).notNull(), // "github" | "linkedin" | "email"
  providerUserId: text("provider_user_id").notNull(),
  providerEmail: text("provider_email").notNull(),
  syncStatus: jsonb("sync_status"),
  connectedAt: timestamp("connected_at", { withTimezone: true }).defaultNow().notNull(),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
}, (t) => [
  index("conn_accounts_user_provider_idx").on(t.userId, t.provider),
]);

export const emailVerifications = pgTable("email_verifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  email: text("email").notNull(),
  codeHash: text("code_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  attemptCount: integer("attempt_count").default(0).notNull(),
  lastSentAt: timestamp("last_sent_at", { withTimezone: true }).defaultNow().notNull(),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const usernameHistory = pgTable("username_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentProfileId: uuid("student_profile_id").references(() => studentProfiles.id, { onDelete: "cascade" }).notNull(),
  oldUsername: varchar("old_username", { length: 32 }).notNull(),
  newUsername: varchar("new_username", { length: 32 }).notNull(),
  changedAt: timestamp("changed_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("username_history_profile_idx").on(t.studentProfileId),
]);

