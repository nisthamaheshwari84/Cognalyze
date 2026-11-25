/**
 * lib/interview-intelligence/handoff.ts
 *
 * Canonical Cognalyze <-> Interview Intelligence security handoff, replay protection,
 * server-to-server request signing, and authoritative Shared Student DNA builder.
 */

import crypto from "crypto";
import fs from "fs";
import path from "path";
import { getUserById, getStudentProfileByUserId } from "@/lib/auth/store";
import { getStudentDNAFull, addStudentEvidenceRecord, invalidateUserDNAScope } from "@/lib/dna/store";
import { getStudentIntelligenceProfile } from "@/lib/intelligence/student-intelligence";
import { getCandidateAttempts } from "@/lib/skills/candidate-history";
import { getSessionHistory, saveSession } from "@/lib/interview-session-store";
import { isSupabaseAvailable, supabaseAdmin } from "@/lib/supabase";
import { isTestRuntime } from "@/lib/env";

export const HANDOFF_ISSUER = "cognalyze";
export const HANDOFF_AUDIENCE = "interview-intelligence";
export const DEFAULT_HANDOFF_SCOPE = "interview:launch student_dna:read interview_reports:write";
export const TICKET_TTL_SECONDS = 60;

export interface LaunchTicketPayload {
  iss: typeof HANDOFF_ISSUER;
  aud: typeof HANDOFF_AUDIENCE;
  sub: string; // Immutable Cognalyze Auth UUID
  username: string;
  fullName: string;
  accountType: "student";
  scope: string;
  jti: string;
  nonce: string;
  iat: number;
  exp: number;
}

export interface TicketRecord {
  jti: string;
  userId: string;
  scope: string;
  audience: string;
  expiresAtMs: number;
  redeemedAtMs: number | null;
  createdAtMs: number;
}

export interface SharedStudentDNAContext {
  schemaVersion: "1.0.0";
  source: "cognalyze_authoritative_dna";
  retrievedAt: string;
  hasDna: boolean;
  profileStatus: string;
  profileStatusReason: string;
  identity: {
    userId: string;
    username: string;
    fullName: string;
    college: string;
    degree: string;
    branch: string;
    graduationYear: string;
    cgpa?: string;
  };
  skills: Array<{
    name: string;
    category: string;
    level: string;
    verificationState: string;
    confidence: number;
    evidenceCount: number;
  }>;
  projects: Array<{
    title: string;
    description: string;
    problemSolved?: string;
    techStack: string[];
    role?: string;
    contributions?: string;
    githubUrl?: string;
    liveUrl?: string;
  }>;
  experience: Array<{
    organization: string;
    role: string;
    duration: string;
    type?: string;
    responsibilities?: string;
    achievements?: string;
    technologies: string[];
  }>;
  careerGoals: {
    targetRoles: string[];
    preferredDomains: string[];
    targetCompanies: string[];
    careerGoalsSummary?: string;
    activeTargetRoleKey?: string;
    activeTargetRoleTitle?: string;
  };
  skillGaps: Array<{
    skillName: string;
    status: string;
    importance: string;
    currentLevel: string;
    targetLevel: string;
    reason: string;
  }>;
  evidence: Array<{
    id: string;
    title: string;
    category: string;
    sourceType: string;
    verificationStatus: string;
    confidence: number;
    claim: string;
    date?: string;
  }>;
  assessmentHistory: Array<{
    id: string;
    domain: string;
    topic: string;
    mode: string;
    score: number;
    accuracy: number;
    weaknesses: string[];
    strengths: string[];
    timestamp: string;
  }>;
  priorInterviewCount: number;
  sourceMetrics: {
    githubConnected: boolean;
    githubReposCount: number | null;
    githubTopLanguages: string[];
    leetcodeSolved: number | null;
    projectsCount: number;
  };
  resumeSummaryText: string;
  interviewDnaProfile: {
    schemaVersion: "1.0.0";
    candidateId: string;
    candidateName: string;
    targetRoles: string[];
    interviewCount: number;
    updatedAt: string;
    dimensions: Record<string, any>;
    skillRecords: Array<{
      skill: string;
      status: "claimed_only" | "partially_demonstrated" | "demonstrated" | "verified";
      confidence: number;
      lastEvidenceAt: string;
      sourceInterviewId: string;
    }>;
    historicalObservations: Array<{
      id: string;
      interviewId: string;
      dimension: string;
      observation: string;
      evidenceSource: string;
      evidenceQuality: "unverified_claim" | "interview_demonstrated" | "verified";
      confidence: number;
      recordedAt: string;
    }>;
  };
}

// ─── SECRET & ORIGIN RESOLUTION ──────────────────────────────────────────────

export function getHandoffSecret(): string {
  const configured = (process.env.COGNALYZE_INTERVIEW_HANDOFF_SECRET || "").trim();
  if (configured.length >= 16) {
    return configured;
  }

  const isProd = process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);
  if (isProd && !isTestRuntime()) {
    throw new Error(
      "COGNALYZE_INTERVIEW_HANDOFF_SECRET is not configured in production environment."
    );
  }

  // Deterministic development-only secret derived from local environment when explicit secret is unset
  const seed = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "cognalyze-local-dev-handoff-secret-2026";
  return crypto.createHash("sha256").update(`cognalyze-ii-dev:${seed}`).digest("hex");
}

export function getInterviewIntelligenceOrigin(): string {
  const explicit = (
    process.env.NEXT_PUBLIC_INTERVIEW_INTELLIGENCE_URL ||
    process.env.INTERVIEW_INTELLIGENCE_URL ||
    ""
  ).trim().replace(/\/+$/, "");
  const isProdOrVercel = Boolean(process.env.VERCEL) || process.env.NODE_ENV === "production";
  const isLocalhostUrl = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(explicit);
  if (explicit && !(isProdOrVercel && isLocalhostUrl)) {
    return explicit;
  }

  return "https://interview-intelligence-sigma.vercel.app";
}

// ─── CRYPTOGRAPHIC SIGNING & VERIFICATION ───────────────────────────────────

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + "=".repeat(padLen), "base64").toString("utf8");
}

function signHmac(data: string, secret: string): string {
  return base64UrlEncode(crypto.createHmac("sha256", secret).update(data).digest());
}

function verifyHmac(data: string, signature: string, secret: string): boolean {
  try {
    const expected = signHmac(data, secret);
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(signature, "utf8");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// ─── SINGLE-USE LAUNCH TICKET STORE (MEMORY + DISK + SUPABASE) ──────────────

const memoryTicketStore = new Map<string, TicketRecord>();

function getTicketFilePath(): string {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join("/tmp", "cognalyze-ii-tickets.json");
  }
  return path.join(process.cwd(), "data", "interview-launch-tickets.json");
}

function loadTicketsFromDisk(): Record<string, TicketRecord> {
  try {
    const p = getTicketFilePath();
    if (fs.existsSync(p)) {
      const parsed = JSON.parse(fs.readFileSync(p, "utf8"));
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch {}
  return {};
}

function saveTicketToDisk(record: TicketRecord): void {
  try {
    const p = getTicketFilePath();
    const dir = path.dirname(p);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const all = loadTicketsFromDisk();
    const now = Date.now();
    // Prune tickets expired more than 10 minutes ago
    for (const [k, v] of Object.entries(all)) {
      if (v.expiresAtMs + 10 * 60_000 < now) {
        delete all[k];
      }
    }
    all[record.jti] = record;

    const tmp = `${p}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(all), "utf8");
    fs.renameSync(tmp, p);
  } catch {}
}

async function persistTicketToSupabase(record: TicketRecord): Promise<void> {
  if (isTestRuntime()) return;
  try {
    if (!(await isSupabaseAvailable()) || !supabaseAdmin) return;
    // Try dedicated table first; fall back to analyses row if table not yet migrated
    const { error } = await supabaseAdmin
      .from("interview_launch_tickets")
      .upsert({
        jti: record.jti,
        user_id: record.userId,
        scope: record.scope,
        audience: record.audience,
        expires_at: new Date(record.expiresAtMs).toISOString(),
        redeemed_at: record.redeemedAtMs ? new Date(record.redeemedAtMs).toISOString() : null,
      }, { onConflict: "jti" });

    if (error) {
      await supabaseAdmin.from("analyses").insert({
        recruiter_clerk_id: `ii_ticket_${record.jti}`,
        full_report: record,
        created_at: new Date(record.createdAtMs).toISOString(),
      });
    }
  } catch {}
}

async function fetchAndRedeemTicketInStore(
  jti: string,
  expectedUserId: string
): Promise<{ ok: true } | { ok: false; code: "TICKET_REPLAYED" | "TICKET_EXPIRED" | "INVALID_TICKET"; message: string }> {
  const now = Date.now();

  // 1. Check in-memory first
  let record = memoryTicketStore.get(jti);
  if (!record) {
    const disk = loadTicketsFromDisk();
    if (disk[jti]) {
      record = disk[jti];
      memoryTicketStore.set(jti, record);
    }
  }

  // 2. Check Supabase (essential across separate Vercel serverless lambdas)
  if (!isTestRuntime() && (await isSupabaseAvailable()) && supabaseAdmin) {
    try {
      const { data: row, error } = await supabaseAdmin
        .from("interview_launch_tickets")
        .select("*")
        .eq("jti", jti)
        .maybeSingle();

      if (!error && row) {
        if (row.redeemed_at) {
          return { ok: false, code: "TICKET_REPLAYED", message: "Launch ticket has already been redeemed." };
        }
        if (row.user_id !== expectedUserId) {
          return { ok: false, code: "INVALID_TICKET", message: "Launch ticket subject mismatch." };
        }
        if (new Date(row.expires_at).getTime() <= now) {
          return { ok: false, code: "TICKET_EXPIRED", message: "Launch ticket has expired." };
        }

        // Atomic conditional update: only succeed if redeemed_at IS NULL
        const { data: updated, error: updErr } = await supabaseAdmin
          .from("interview_launch_tickets")
          .update({ redeemed_at: new Date(now).toISOString() })
          .eq("jti", jti)
          .is("redeemed_at", null)
          .select("jti");

        if (updErr || !updated || updated.length === 0) {
          return { ok: false, code: "TICKET_REPLAYED", message: "Launch ticket has already been redeemed." };
        }

        const redeemedRecord: TicketRecord = {
          jti,
          userId: row.user_id,
          scope: row.scope,
          audience: row.audience,
          expiresAtMs: new Date(row.expires_at).getTime(),
          redeemedAtMs: now,
          createdAtMs: new Date(row.created_at || now).getTime(),
        };
        memoryTicketStore.set(jti, redeemedRecord);
        saveTicketToDisk(redeemedRecord);
        return { ok: true };
      }

      // Fallback check in analyses table if interview_launch_tickets table wasn't created yet
      if (error) {
        const { data: rows } = await supabaseAdmin
          .from("analyses")
          .select("id, full_report")
          .eq("recruiter_clerk_id", `ii_ticket_${jti}`)
          .order("created_at", { ascending: false })
          .limit(2);

        if (Array.isArray(rows) && rows.length > 0) {
          const alreadyRedeemed = rows.some((r: any) => Boolean(r.full_report?.redeemedAtMs));
          if (alreadyRedeemed) {
            return { ok: false, code: "TICKET_REPLAYED", message: "Launch ticket has already been redeemed." };
          }
          const latest = rows[0].full_report as TicketRecord;
          if (latest.userId !== expectedUserId) {
            return { ok: false, code: "INVALID_TICKET", message: "Launch ticket subject mismatch." };
          }
          if (latest.expiresAtMs <= now) {
            return { ok: false, code: "TICKET_EXPIRED", message: "Launch ticket has expired." };
          }
          const redeemed: TicketRecord = { ...latest, redeemedAtMs: now };
          await supabaseAdmin
            .from("analyses")
            .update({ full_report: redeemed })
            .eq("id", rows[0].id);
          memoryTicketStore.set(jti, redeemed);
          saveTicketToDisk(redeemed);
          return { ok: true };
        }
      }
    } catch {}
  }

  // 3. Memory / disk resolution
  if (!record) {
    return { ok: false, code: "INVALID_TICKET", message: "Launch ticket not recognized or already purged." };
  }
  if (record.userId !== expectedUserId) {
    return { ok: false, code: "INVALID_TICKET", message: "Launch ticket subject mismatch." };
  }
  if (record.redeemedAtMs !== null) {
    return { ok: false, code: "TICKET_REPLAYED", message: "Launch ticket has already been redeemed." };
  }
  if (record.expiresAtMs <= now) {
    return { ok: false, code: "TICKET_EXPIRED", message: "Launch ticket has expired." };
  }

  record.redeemedAtMs = now;
  memoryTicketStore.set(jti, record);
  saveTicketToDisk(record);
  return { ok: true };
}

export async function issueLaunchTicket(params: {
  userId: string;
  username: string;
  fullName: string;
  ttlSeconds?: number;
  scope?: string;
}): Promise<{ ticket: string; payload: LaunchTicketPayload }> {
  const secret = getHandoffSecret();
  const nowSec = Math.floor(Date.now() / 1000);
  const ttl = Math.max(10, Math.min(300, params.ttlSeconds ?? TICKET_TTL_SECONDS));
  const jti = crypto.randomBytes(18).toString("hex");
  const nonce = crypto.randomBytes(12).toString("hex");

  const payload: LaunchTicketPayload = {
    iss: HANDOFF_ISSUER,
    aud: HANDOFF_AUDIENCE,
    sub: params.userId,
    username: params.username,
    fullName: params.fullName,
    accountType: "student",
    scope: params.scope || DEFAULT_HANDOFF_SCOPE,
    jti,
    nonce,
    iat: nowSec,
    exp: nowSec + ttl,
  };

  const encoded = base64UrlEncode(JSON.stringify(payload));
  const sig = signHmac(encoded, secret);
  const ticket = `${encoded}.${sig}`;

  const record: TicketRecord = {
    jti,
    userId: params.userId,
    scope: payload.scope,
    audience: HANDOFF_AUDIENCE,
    expiresAtMs: payload.exp * 1000,
    redeemedAtMs: null,
    createdAtMs: Date.now(),
  };

  memoryTicketStore.set(jti, record);
  saveTicketToDisk(record);
  await persistTicketToSupabase(record);

  return { ticket, payload };
}

export async function verifyAndRedeemLaunchTicket(
  ticket: string,
  expectedAudience = HANDOFF_AUDIENCE
): Promise<
  | { valid: true; payload: LaunchTicketPayload }
  | { valid: false; status: number; code: string; message: string }
> {
  if (!ticket || typeof ticket !== "string" || !ticket.includes(".")) {
    return { valid: false, status: 401, code: "INVALID_TICKET", message: "Malformed launch ticket." };
  }

  const parts = ticket.split(".");
  if (parts.length !== 2) {
    return { valid: false, status: 401, code: "INVALID_TICKET", message: "Invalid launch ticket format." };
  }

  const [encoded, sig] = parts;
  let secret: string;
  try {
    secret = getHandoffSecret();
  } catch (err: any) {
    return { valid: false, status: 503, code: "HANDOFF_NOT_CONFIGURED", message: err?.message || "Handoff secret missing." };
  }

  if (!verifyHmac(encoded, sig, secret)) {
    return { valid: false, status: 401, code: "INVALID_SIGNATURE", message: "Launch ticket signature verification failed." };
  }

  let payload: LaunchTicketPayload;
  try {
    payload = JSON.parse(base64UrlDecode(encoded)) as LaunchTicketPayload;
  } catch {
    return { valid: false, status: 401, code: "INVALID_TICKET", message: "Unreadable launch ticket payload." };
  }

  if (payload.iss !== HANDOFF_ISSUER) {
    return { valid: false, status: 401, code: "INVALID_ISSUER", message: "Invalid launch ticket issuer." };
  }
  if (payload.aud !== expectedAudience) {
    return { valid: false, status: 401, code: "INVALID_AUDIENCE", message: "Invalid launch ticket audience." };
  }
  if (payload.accountType !== "student" || !payload.sub || !payload.jti) {
    return { valid: false, status: 401, code: "INVALID_CLAIMS", message: "Launch ticket missing required student claims." };
  }
  const scopes = new Set(String(payload.scope || "").split(/\s+/).filter(Boolean));
  if (!scopes.has("interview:launch") || !scopes.has("student_dna:read")) {
    return { valid: false, status: 403, code: "INSUFFICIENT_SCOPE", message: "Launch ticket lacks required interview scopes." };
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== "number" || payload.exp <= nowSec) {
    return { valid: false, status: 401, code: "TICKET_EXPIRED", message: "Launch ticket has expired." };
  }

  const redeemed = await fetchAndRedeemTicketInStore(payload.jti, payload.sub);
  if (!redeemed.ok) {
    return {
      valid: false,
      status: redeemed.code === "TICKET_REPLAYED" ? 409 : 401,
      code: redeemed.code,
      message: redeemed.message,
    };
  }

  return { valid: true, payload };
}

// ─── SERVER-TO-SERVER SERVICE AUTHENTICATION ─────────────────────────────────

export function signServiceHeaders(method: string, urlPath: string, bodyString = ""): Record<string, string> {
  const secret = getHandoffSecret();
  const ts = String(Date.now());
  const bodyHash = crypto.createHash("sha256").update(bodyString).digest("hex");
  const canonical = `${ts}:${method.toUpperCase()}:${urlPath}:${bodyHash}`;
  const sig = signHmac(canonical, secret);
  return {
    "X-Cognalyze-Service-Ts": ts,
    "X-Cognalyze-Service-Sig": sig,
  };
}

export function verifyServiceHeaders(
  req: Request,
  rawBody = ""
): { ok: true } | { ok: false; status: number; code: string; message: string } {
  let secret: string;
  try {
    secret = getHandoffSecret();
  } catch (err: any) {
    return { ok: false, status: 503, code: "HANDOFF_NOT_CONFIGURED", message: err?.message || "Service secret missing." };
  }

  const ts = req.headers.get("x-cognalyze-service-ts") || "";
  const sig = req.headers.get("x-cognalyze-service-sig") || "";
  if (!ts || !sig) {
    return { ok: false, status: 401, code: "MISSING_SERVICE_AUTH", message: "Missing server-to-server service authentication headers." };
  }

  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum) || Math.abs(Date.now() - tsNum) > 120_000) {
    return { ok: false, status: 401, code: "EXPIRED_SERVICE_AUTH", message: "Service request timestamp outside allowed skew window." };
  }

  const parsedUrl = new URL(req.url);
  const urlPathWithQuery = `${parsedUrl.pathname}${parsedUrl.search}`;
  const urlPathOnly = parsedUrl.pathname;
  const bodyHash = crypto.createHash("sha256").update(rawBody).digest("hex");

  const validWithQuery = verifyHmac(`${ts}:${req.method.toUpperCase()}:${urlPathWithQuery}:${bodyHash}`, sig, secret);
  const validPathOnly = verifyHmac(`${ts}:${req.method.toUpperCase()}:${urlPathOnly}:${bodyHash}`, sig, secret);

  if (!validWithQuery && !validPathOnly) {
    return { ok: false, status: 401, code: "INVALID_SERVICE_SIGNATURE", message: "Server-to-server service signature mismatch." };
  }

  return { ok: true };
}

// ─── AUTHORITATIVE SHARED STUDENT DNA BUILDER ────────────────────────────────

const BASE_DNA_DIMENSIONS: Array<{ key: string; label: string }> = [
  { key: "academic_professional_identity", label: "Academic & Professional Identity" },
  { key: "technical_skills", label: "Technical Skills" },
  { key: "programming_ability", label: "Programming Ability" },
  { key: "problem_solving", label: "Problem Solving" },
  { key: "conceptual_understanding", label: "Conceptual Understanding" },
  { key: "projects_and_implementation", label: "Projects & Implementation" },
  { key: "communication", label: "Communication" },
  { key: "behavioral_competencies", label: "Behavioral Competencies" },
  { key: "career_goals", label: "Career Goals" },
  { key: "interview_performance", label: "Interview Performance" },
  { key: "learning_progress", label: "Learning Progress" },
  { key: "evidence_and_outcomes", label: "Evidence & Outcomes" },
];

function mapScoreToLevel(score: number | null): "unassessed" | "foundational" | "developing" | "proficient" | "advanced" {
  if (score === null || !Number.isFinite(score)) return "unassessed";
  if (score >= 85) return "advanced";
  if (score >= 70) return "proficient";
  if (score >= 50) return "developing";
  return "foundational";
}

export async function buildSharedStudentDnaForInterview(userId: string): Promise<SharedStudentDNAContext> {
  const user = getUserById(userId);
  const profile = getStudentProfileByUserId(userId);
  const now = new Date().toISOString();

  const [dnaFull, intelligence, attempts, interviewHistory] = await Promise.all([
    getStudentDNAFull(userId).catch(() => null),
    Promise.resolve().then(() => {
      try { return getStudentIntelligenceProfile(userId); } catch { return null; }
    }),
    Promise.resolve().then(() => {
      try { return getCandidateAttempts(userId); } catch { return []; }
    }),
    getSessionHistory(userId).catch(() => []),
  ]);

  const username = profile?.username || (user?.email ? user.email.split("@")[0] : userId.slice(0, 12));
  const fullName = profile?.fullName || user?.fullName || username;

  // Real skills strictly from Student DNA / Profile (no fabrication)
  const evaluatedSkills = dnaFull?.canonicalSkillIntelligence?.evaluatedSkills || [];
  const rawSkills = dnaFull?.skills || [];
  const profileSkills = profile?.skills || [];

  const skillsMap = new Map<string, SharedStudentDNAContext["skills"][number]>();
  for (const es of evaluatedSkills) {
    skillsMap.set(es.canonicalName.toLowerCase(), {
      name: es.canonicalName,
      category: es.category || "Technical",
      level: es.studentReportedLevel || "Intermediate",
      verificationState: es.assessmentStatus || "SUPPORTED",
      confidence: es.assessmentStatus === "INDEPENDENTLY_VERIFIED" ? 0.95 : es.assessmentStatus === "SUPPORTED" ? 0.8 : 0.4,
      evidenceCount: es.evidenceIds?.length || 0,
    });
  }
  for (const rs of rawSkills) {
    // Exclude unassessed global taxonomy placeholders (UNKNOWN with 0 level/evidence) — never fabricate/inflate empty profiles
    if (rs.verificationState === "UNKNOWN" && (!rs.demonstratedLevel || rs.demonstratedLevel <= 0) && (!rs.evidenceCoverage || rs.evidenceCoverage === "NONE")) {
      continue;
    }
    const key = rs.skillName.toLowerCase();
    if (!skillsMap.has(key)) {
      skillsMap.set(key, {
        name: rs.skillName,
        category: rs.category || "Technical",
        level: rs.demonstratedLevel >= 4 ? "Expert" : rs.demonstratedLevel >= 3 ? "Advanced" : rs.demonstratedLevel >= 2 ? "Intermediate" : "Foundational",
        verificationState: rs.verificationState || "SELF_REPORTED",
        confidence: rs.confidence === "HIGH" ? 0.9 : rs.confidence === "MEDIUM" ? 0.65 : 0.35,
        evidenceCount: rs.evidenceCoverage === "HIGH" ? 3 : rs.evidenceCoverage === "MEDIUM" ? 2 : rs.evidenceCoverage === "LOW" ? 1 : 0,
      });
    }
  }
  for (const ps of profileSkills) {
    const name = typeof ps === "string" ? ps : ps.name;
    if (!name) continue;
    const key = name.toLowerCase();
    if (!skillsMap.has(key)) {
      skillsMap.set(key, {
        name,
        category: "Profile Declared",
        level: (typeof ps === "object" && ps.level) || "Intermediate",
        verificationState: (typeof ps === "object" && ps.evidence) ? "SUPPORTED" : "SELF_REPORTED",
        confidence: (typeof ps === "object" && ps.evidence) ? 0.65 : 0.3,
        evidenceCount: (typeof ps === "object" && ps.evidence) ? 1 : 0,
      });
    }
  }
  const skills = Array.from(skillsMap.values());

  const projects: SharedStudentDNAContext["projects"] = (profile?.projects || []).map((p: any) => ({
    title: p.title || p.name || "Untitled Project",
    description: p.description || "",
    ...(p.problemSolved ? { problemSolved: p.problemSolved } : {}),
    techStack: Array.isArray(p.techStack) ? p.techStack : Array.isArray(p.tech_stack) ? p.tech_stack : [],
    ...(p.role ? { role: p.role } : {}),
    ...(p.contributions ? { contributions: p.contributions } : {}),
    ...(p.githubUrl ? { githubUrl: p.githubUrl } : {}),
    ...(p.liveUrl ? { liveUrl: p.liveUrl } : {}),
  }));

  const experience: SharedStudentDNAContext["experience"] = (profile?.experience || []).map((e: any) => ({
    organization: e.organization || "",
    role: e.role || "",
    duration: e.duration || "",
    ...(e.type ? { type: e.type } : {}),
    ...(e.responsibilities ? { responsibilities: e.responsibilities } : {}),
    ...(e.achievements ? { achievements: e.achievements } : {}),
    technologies: Array.isArray(e.technologies) ? e.technologies : [],
  }));

  const rawGaps = dnaFull?.gapReport?.gaps || [];
  const skillGaps: SharedStudentDNAContext["skillGaps"] = rawGaps.map((g: any) => ({
    skillName: g.skillName,
    status: g.status,
    importance: g.importance,
    currentLevel: g.currentLevelLabel || "Unassessed",
    targetLevel: g.targetLevelLabel || "Target",
    reason: g.statusReason || `Gap identified for ${dnaFull?.targetRoleTitle || "target role"}`,
  }));

  const evidence: SharedStudentDNAContext["evidence"] = (dnaFull?.evidence || []).slice(0, 30).map((ev: any) => ({
    id: ev.id,
    title: ev.claim || ev.skillId || ev.sourceType,
    category: ev.skillId || "General",
    sourceType: ev.sourceType,
    verificationStatus: ev.verificationStatus,
    confidence: Number(ev.strength ?? 0.5),
    claim: ev.claim || "",
    date: ev.verifiedAt || ev.date,
  }));

  const assessmentHistory: SharedStudentDNAContext["assessmentHistory"] = (attempts || []).slice(0, 15).map((a: any) => ({
    id: a.id,
    domain: a.domain,
    topic: a.topic,
    mode: a.mode,
    score: a.score,
    accuracy: a.accuracy,
    weaknesses: a.weaknesses || [],
    strengths: a.strengths || [],
    timestamp: a.timestamp,
  }));

  const targetRoles = profile?.careerGoals?.targetRoles || [];
  const preferredDomains = profile?.careerGoals?.preferredDomains || [];
  const targetCompanies = profile?.careerGoals?.targetCompanies || [];

  // Synthesize factual resumeText ONLY from real existing records (empty string if nothing exists)
  const resumeParts: string[] = [];
  if (profile?.college || profile?.degree || profile?.branch) {
    resumeParts.push(
      `${fullName} (@${username}) — ${[profile.degree, profile.branch, profile.college].filter(Boolean).join(", ")}${profile.graduationYear ? ` (${profile.graduationYear})` : ""}${profile.cgpa ? ` | CGPA: ${profile.cgpa}` : ""}`
    );
  }
  if (skills.length > 0) {
    resumeParts.push(`Skills: ${skills.map((s) => `${s.name} (${s.level}, ${s.verificationState})`).join(", ")}`);
  }
  if (projects.length > 0) {
    resumeParts.push(
      "Projects:\n" +
        projects
          .map(
            (p, idx) =>
              `${idx + 1}. ${p.title}${p.techStack.length ? ` [${p.techStack.join(", ")}]` : ""}${p.description ? ` — ${p.description}` : ""}${p.contributions ? ` (Role: ${p.contributions})` : ""}`
          )
          .join("\n")
    );
  }
  if (experience.length > 0) {
    resumeParts.push(
      "Experience:\n" +
        experience
          .map(
            (e) =>
              `- ${e.role} at ${e.organization}${e.duration ? ` (${e.duration})` : ""}${e.responsibilities ? `: ${e.responsibilities}` : ""}`
          )
          .join("\n")
    );
  }
  const resumeSummaryText = resumeParts.join("\n\n");

  const hasRealContent =
    Boolean(profile?.college || profile?.degree) ||
    skills.length > 0 ||
    projects.length > 0 ||
    experience.length > 0 ||
    evidence.length > 0 ||
    assessmentHistory.length > 0 ||
    interviewHistory.length > 0;

  // Build mapped 12-dimension profile strictly grounded in real evidence (unassessed when missing)
  const dimensions: Record<string, any> = {};
  for (const dim of BASE_DNA_DIMENSIONS) {
    dimensions[dim.key] = {
      key: dim.key,
      label: dim.label,
      currentLevel: "unassessed",
      verifiedScore: null,
      confidence: 0,
      evidenceQuality: "none",
      lastUpdatedAt: dnaFull?.lastUpdatedAt || now,
      summary: "No Cognalyze evidence recorded yet for this dimension.",
    };
  }

  if (profile?.college || profile?.degree) {
    dimensions.academic_professional_identity = {
      key: "academic_professional_identity",
      label: "Academic & Professional Identity",
      currentLevel: "developing",
      verifiedScore: null,
      confidence: 0.7,
      evidenceQuality: "unverified_claim",
      lastUpdatedAt: profile.updatedAt || now,
      summary: `${[profile.degree, profile.branch, profile.college].filter(Boolean).join(", ")}${profile.graduationYear ? ` (${profile.graduationYear})` : ""}`,
    };
  }
  if (skills.length > 0) {
    const verifiedCount = skills.filter((s) => s.verificationState === "VERIFIED" || s.verificationState === "INDEPENDENTLY_VERIFIED" || s.verificationState === "SUPPORTED").length;
    const avgConf = skills.reduce((a, b) => a + b.confidence, 0) / skills.length;
    dimensions.technical_skills = {
      key: "technical_skills",
      label: "Technical Skills",
      currentLevel: verifiedCount >= 3 ? "proficient" : "developing",
      verifiedScore: verifiedCount > 0 ? Math.round(avgConf * 100) : null,
      confidence: Number(avgConf.toFixed(2)),
      evidenceQuality: verifiedCount > 0 ? "verified" : "unverified_claim",
      lastUpdatedAt: dnaFull?.lastUpdatedAt || now,
      summary: `${skills.length} tracked skills (${verifiedCount} verified/supported) from Cognalyze Student DNA.`,
    };
  }
  if (projects.length > 0) {
    const hasGithub = projects.some((p) => Boolean(p.githubUrl));
    dimensions.projects_and_implementation = {
      key: "projects_and_implementation",
      label: "Projects & Implementation",
      currentLevel: hasGithub ? "proficient" : "developing",
      verifiedScore: hasGithub ? 75 : null,
      confidence: hasGithub ? 0.8 : 0.45,
      evidenceQuality: hasGithub ? "verified" : "unverified_claim",
      lastUpdatedAt: profile?.updatedAt || now,
      summary: `${projects.length} documented project(s): ${projects.map((p) => p.title).slice(0, 3).join(", ")}.`,
    };
  }
  if (targetRoles.length > 0 || preferredDomains.length > 0) {
    dimensions.career_goals = {
      key: "career_goals",
      label: "Career Goals",
      currentLevel: "developing",
      verifiedScore: null,
      confidence: 0.8,
      evidenceQuality: "unverified_claim",
      lastUpdatedAt: profile?.updatedAt || now,
      summary: `Target roles: ${targetRoles.join(", ") || "Open"}. Domains: ${preferredDomains.join(", ") || "General"}.`,
    };
  }
  if (assessmentHistory.length > 0) {
    const avgScore = Math.round(
      assessmentHistory.reduce((acc, a) => acc + (Number(a.score) || 0), 0) / assessmentHistory.length
    );
    dimensions.problem_solving = {
      key: "problem_solving",
      label: "Problem Solving",
      currentLevel: mapScoreToLevel(avgScore),
      verifiedScore: avgScore,
      confidence: 0.85,
      evidenceQuality: "verified",
      lastUpdatedAt: assessmentHistory[0]?.timestamp || now,
      summary: `Based on ${assessmentHistory.length} Cognalyze assessment/practice session(s), average score ${avgScore}/100.`,
    };
    dimensions.learning_progress = {
      key: "learning_progress",
      label: "Learning Progress",
      currentLevel: mapScoreToLevel(avgScore),
      verifiedScore: avgScore,
      confidence: 0.8,
      evidenceQuality: "verified",
      lastUpdatedAt: assessmentHistory[0]?.timestamp || now,
      summary: `Recent practice focus: ${assessmentHistory.slice(0, 3).map((a) => a.topic).join(", ")}.`,
    };
  }
  if (interviewHistory.length > 0) {
    const scores = interviewHistory
      .map((s: any) => Number(s.overall_score))
      .filter((n: number) => Number.isFinite(n) && n > 0);
    const avgInt = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : null;
    dimensions.interview_performance = {
      key: "interview_performance",
      label: "Interview Performance",
      currentLevel: mapScoreToLevel(avgInt),
      verifiedScore: avgInt,
      confidence: 0.85,
      evidenceQuality: "interview_demonstrated",
      lastUpdatedAt: interviewHistory[0]?.created_at || now,
      summary: `${interviewHistory.length} prior Cognalyze interview session(s) recorded.`,
    };
  }
  if (evidence.length > 0) {
    const avgEv = Math.round(
      (evidence.reduce((a, e) => a + e.confidence, 0) / evidence.length) * 100
    );
    dimensions.evidence_and_outcomes = {
      key: "evidence_and_outcomes",
      label: "Evidence & Outcomes",
      currentLevel: mapScoreToLevel(avgEv),
      verifiedScore: avgEv,
      confidence: 0.85,
      evidenceQuality: "verified",
      lastUpdatedAt: dnaFull?.lastUpdatedAt || now,
      summary: `${evidence.length} evidence item(s) recorded in Cognalyze Evidence Vault.`,
    };
  }

  const mappedSkillRecords = skills.map((s) => ({
    skill: s.name,
    status: (s.verificationState === "INDEPENDENTLY_VERIFIED" || s.verificationState === "VERIFIED"
      ? "verified"
      : s.verificationState === "SUPPORTED" || s.verificationState === "DEMONSTRATED"
      ? "demonstrated"
      : "claimed_only") as "claimed_only" | "partially_demonstrated" | "demonstrated" | "verified",
    confidence: s.confidence,
    lastEvidenceAt: dnaFull?.lastUpdatedAt || now,
    sourceInterviewId: "cognalyze_dna",
  }));

  const historicalObservations = evidence.slice(0, 20).map((ev) => ({
    id: ev.id,
    interviewId: ev.sourceType === "interview" ? ev.id : "cognalyze_vault",
    dimension: ev.sourceType === "interview" ? "interview_performance" : "technical_skills",
    observation: ev.claim || ev.title,
    evidenceSource: `Cognalyze (${ev.sourceType})`,
    evidenceQuality: (ev.verificationStatus === "VERIFIED"
      ? "verified"
      : ev.sourceType === "interview"
      ? "interview_demonstrated"
      : "unverified_claim") as "unverified_claim" | "interview_demonstrated" | "verified",
    confidence: ev.confidence,
    recordedAt: ev.date || now,
  }));

  return {
    schemaVersion: "1.0.0",
    source: "cognalyze_authoritative_dna",
    retrievedAt: now,
    hasDna: hasRealContent,
    profileStatus: dnaFull?.profileStatus || (hasRealContent ? "READY_FOR_REVIEW" : "NOT_STARTED"),
    profileStatusReason:
      dnaFull?.profileStatusReason ||
      (hasRealContent
        ? "Authoritative Cognalyze Student DNA retrieved."
        : "No Student DNA or profile artifacts recorded yet; interview will evaluate from scratch without assuming unverified background."),
    identity: {
      userId,
      username,
      fullName,
      college: profile?.college || "",
      degree: profile?.degree || "",
      branch: profile?.branch || "",
      graduationYear: profile?.graduationYear || "",
      ...(profile?.cgpa ? { cgpa: profile.cgpa } : {}),
    },
    skills,
    projects,
    experience,
    careerGoals: {
      targetRoles,
      preferredDomains,
      targetCompanies,
      ...(profile?.careerGoals?.careerGoals ? { careerGoalsSummary: profile.careerGoals.careerGoals } : {}),
      ...(dnaFull?.targetRoleKey ? { activeTargetRoleKey: dnaFull.targetRoleKey } : {}),
      ...(dnaFull?.targetRoleTitle ? { activeTargetRoleTitle: dnaFull.targetRoleTitle } : {}),
    },
    skillGaps,
    evidence,
    assessmentHistory,
    priorInterviewCount: interviewHistory.length,
    sourceMetrics: {
      githubConnected: Boolean(dnaFull?.sourceIntelligence?.github?.repos_count !== null && dnaFull?.sourceIntelligence?.github?.retrieval_status !== "NOT_CONNECTED"),
      githubReposCount: dnaFull?.sourceIntelligence?.github?.repos_count ?? null,
      githubTopLanguages: dnaFull?.sourceIntelligence?.github?.top_languages || [],
      leetcodeSolved: dnaFull?.sourceIntelligence?.leetcode?.total_solved ?? null,
      projectsCount: projects.length,
    },
    resumeSummaryText,
    interviewDnaProfile: {
      schemaVersion: "1.0.0",
      candidateId: userId,
      candidateName: fullName,
      targetRoles: targetRoles.length > 0 ? targetRoles : dnaFull?.targetRoleTitle ? [dnaFull.targetRoleTitle] : [],
      interviewCount: interviewHistory.length,
      updatedAt: dnaFull?.lastUpdatedAt || now,
      dimensions,
      skillRecords: mappedSkillRecords,
      historicalObservations,
    },
  };
}

// ─── SYNC INTERVIEW SESSIONS & EVIDENCE BACK INTO COGNALYZE ──────────────────

export async function syncInterviewSessionToCognalyze(
  userId: string,
  payload: {
    interview: any;
    report?: any;
  }
): Promise<{ synced: boolean }> {
  const { interview, report } = payload;
  if (!interview || !interview.id) {
    return { synced: false };
  }

  // Strictly enforce identity ownership: override any candidateId on incoming object with verified userId
  const turns = Array.isArray(interview.turns) ? interview.turns : [];
  const transcript = turns.flatMap((t: any) => [
    { role: "assistant", content: t.questionText || t.question?.questionText || "" },
    { role: "user", content: t.rawResponse || "" },
  ]);

  const overallScore =
    typeof report?.overview?.overallScore === "number"
      ? Math.round(report.overview.overallScore * 20) // Convert 0-5 scale to 0-100 if needed, or clamp
      : typeof report?.overallScore === "number"
      ? Math.round(report.overallScore)
      : 0;
  const clampedScore = Math.max(0, Math.min(100, overallScore > 100 ? Math.round(overallScore / 20) : overallScore));

  await saveSession({
    id: interview.id,
    candidate_id: userId,
    session_type: "assessment_arena",
    interview_type: interview.mode || "personalized_arena",
    experience_mode: interview.sessionExperience || "autonomous_assessment",
    target_role: interview.targetRole || "Software Engineer",
    target_company: interview.companyContext || undefined,
    topics_covered: interview.demonstratedSkills || [],
    answer_distribution: { strong: 0, adequate: 0, shallow: 0, off_topic: 0 },
    security_flags: {
      tab_switches: (interview.integrityEvents || []).filter((e: any) => e.type === "tab_switch").length,
      face_violations: (interview.proctoring?.warnings || []).length,
    },
    overall_score: clampedScore,
    weak_topics_identified: interview.misunderstoodConcepts || [],
    transcript,
    report: report ? { ...report, interviewState: interview } : { interviewState: interview },
  });

  // Record verified evidence into Student DNA upon completion
  if (interview.status === "completed") {
    const demonstrated = Array.isArray(interview.demonstratedSkills) ? interview.demonstratedSkills : [];
    const targetRole = interview.targetRole || "Technical Competency";
    const skillsToRecord = demonstrated.length > 0 ? demonstrated.slice(0, 6) : [targetRole];

    for (const sk of skillsToRecord) {
      await addStudentEvidenceRecord(userId, {
        sourceType: "interview",
        sourceId: interview.id,
        userId,
        skillRaw: sk,
        evidenceType: "interview_demonstration",
        claim: `Demonstrated ${sk} during Personalized Interview Arena (${targetRole})`,
        strength: Math.max(0.4, Math.min(0.95, clampedScore / 100 || 0.7)),
        trustedServerVerified: true,
        metadata: {
          score: clampedScore,
          interviewId: interview.id,
          targetRole,
          company: interview.companyContext,
        },
      }).catch(() => {});
    }

    invalidateUserDNAScope(userId);
  }

  return { synced: true };
}
