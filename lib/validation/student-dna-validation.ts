/**
 * lib/validation/student-dna-validation.ts
 * COGNALYZE STUDENT DNA — CANONICAL VALIDATION & DATA INTEGRITY ENGINE
 * 
 * Centralized validation rules for:
 * 1. Indian Mobile Phone Numbers (Strict 10-digit, [6-9] prefix, country prefix normalization)
 * 2. Academic CGPA & Grading Scales (10-point, 4-point, percentage; rejects zero, negative, out-of-bounds)
 * 3. Numeric Fields & Dates (Graduation year, start year relationships, percentage)
 * 4. Education Records (Institution, Degree, Branch, Consistency)
 * 5. Technical Skills (Claim vs evidence separation, self-reported status)
 * 6. Projects (Title, Description, URLs, Tech stack)
 * 7. Comprehensive Student DNA Payload Validator
 */

import { DNAClaimStatus } from "../dna/contracts";

export interface ValidationResult<T = any> {
  isValid: boolean;
  normalized?: T;
  error?: string;
}

// ─── 1. PHONE NUMBER VALIDATION ───

/**
 * Validates and normalizes an Indian mobile phone number.
 * Standard Indian mobile numbers are exactly 10 digits starting with 6, 7, 8, or 9.
 * Handles permitted formatting (+91, 91, 0 prefixes, spaces, hyphens).
 * Strictly rejects 11-digit, 9-digit, malformed, or alphabetic numbers.
 * Never silently truncates digits.
 */
export function validateIndianPhoneNumber(
  input: string | null | undefined,
  isOptional = true
): ValidationResult<string> {
  if (input === null || input === undefined || input.trim() === "") {
    if (isOptional) {
      return { isValid: true, normalized: undefined };
    }
    return { isValid: false, error: "Phone number is required." };
  }

  const trimmed = input.trim();

  // Check for invalid non-formatting characters (letters or unusual symbols)
  if (/[a-zA-Z]/.test(trimmed)) {
    return {
      isValid: false,
      error: "Phone number contains letters. Please enter a valid 10-digit Indian mobile number."
    };
  }

  // Strip allowed formatting characters: spaces, hyphens, brackets, dots
  let sanitized = trimmed.replace(/[\s\-\(\)\.]/g, "");

  // Handle standard international prefixes (+91 or 91 or 0)
  if (sanitized.startsWith("+91")) {
    sanitized = sanitized.slice(3);
  } else if (sanitized.startsWith("91") && sanitized.length === 12) {
    sanitized = sanitized.slice(2);
  } else if (sanitized.startsWith("0") && sanitized.length === 11) {
    sanitized = sanitized.slice(1);
  }

  // Any remaining plus or non-digit is invalid
  if (!/^\d+$/.test(sanitized)) {
    return {
      isValid: false,
      error: "Phone number contains invalid characters. Please enter digits only."
    };
  }

  // Digit count checks
  if (sanitized.length === 11) {
    return {
      isValid: false,
      error: "Phone number has 11 digits. Indian mobile numbers must be exactly 10 digits."
    };
  }

  if (sanitized.length < 10) {
    return {
      isValid: false,
      error: `Phone number has ${sanitized.length} digits. Indian mobile numbers must be exactly 10 digits.`
    };
  }

  if (sanitized.length > 10) {
    return {
      isValid: false,
      error: `Phone number has ${sanitized.length} digits. Indian mobile numbers must be exactly 10 digits.`
    };
  }

  // Valid prefix check for Indian mobile operators: 6, 7, 8, 9
  const firstDigit = sanitized.charAt(0);
  if (!["6", "7", "8", "9"].includes(firstDigit)) {
    return {
      isValid: false,
      error: `Invalid Indian mobile number. Number must start with 6, 7, 8, or 9 (got '${firstDigit}').`
    };
  }

  return {
    isValid: true,
    normalized: `+91 ${sanitized}`
  };
}

// ─── 2. CGPA & GRADING SCALE VALIDATION ───

export type GradingScale = "10" | "4" | "percentage";

/**
 * Validates CGPA based on the selected grading system.
 * Rejects negative values, zero (invalid under academic engineering CGPA rules),
 * values exceeding scale maximum, and non-numeric input.
 * Preserves missing/empty values as undefined (never converts to zero).
 */
export function validateCgpa(
  input: string | number | null | undefined,
  scale: GradingScale = "10",
  isOptional = true
): ValidationResult<number> {
  if (input === null || input === undefined || input === "" || (typeof input === "string" && input.trim() === "")) {
    if (isOptional) {
      return { isValid: true, normalized: undefined };
    }
    return { isValid: false, error: "CGPA / score is required." };
  }

  let strVal = typeof input === "number" ? input.toString() : input.trim();

  // Extract from formats like "8.6 / 10.0" or "8.6/10" or "85%"
  if (strVal.includes("/")) {
    const parts = strVal.split("/");
    strVal = parts[0].trim();
  } else if (strVal.endsWith("%")) {
    strVal = strVal.replace("%", "").trim();
  }

  const num = parseFloat(strVal);

  if (isNaN(num) || !isFinite(num)) {
    return {
      isValid: false,
      error: "CGPA must be a valid numeric value (e.g. 8.6)."
    };
  }

  if (num < 0) {
    return {
      isValid: false,
      error: "CGPA cannot be negative."
    };
  }

  if (num === 0) {
    return {
      isValid: false,
      error: "CGPA of 0.0 is invalid under academic grading rules. Please enter your valid reported score or leave blank if not applicable."
    };
  }

  // Scale bounds
  if (scale === "10") {
    if (num > 10.0) {
      return {
        isValid: false,
        error: `CGPA (${num}) cannot exceed 10.0 on a 10-point grading scale.`
      };
    }
  } else if (scale === "4") {
    if (num > 4.0) {
      return {
        isValid: false,
        error: `CGPA (${num}) cannot exceed 4.0 on a 4-point grading scale.`
      };
    }
  } else if (scale === "percentage") {
    if (num > 100.0) {
      return {
        isValid: false,
        error: `Percentage (${num}%) cannot exceed 100%.`
      };
    }
  }

  // Rounded to 2 decimal places
  const normalized = Math.round(num * 100) / 100;

  return {
    isValid: true,
    normalized
  };
}

// ─── 3. PERCENTAGE VALIDATION ───

export function validatePercentage(
  input: string | number | null | undefined,
  isOptional = true
): ValidationResult<number> {
  if (input === null || input === undefined || input === "" || (typeof input === "string" && input.trim() === "")) {
    if (isOptional) {
      return { isValid: true, normalized: undefined };
    }
    return { isValid: false, error: "Percentage is required." };
  }

  let strVal = typeof input === "number" ? input.toString() : input.trim().replace("%", "");
  const num = parseFloat(strVal);

  if (isNaN(num) || !isFinite(num)) {
    return { isValid: false, error: "Percentage must be a valid number." };
  }

  if (num < 0) {
    return { isValid: false, error: "Percentage cannot be negative." };
  }

  if (num > 100) {
    return { isValid: false, error: "Percentage cannot exceed 100%." };
  }

  return { isValid: true, normalized: Math.round(num * 100) / 100 };
}

// ─── 4. GRADUATION YEAR & DATES VALIDATION ───

export function validateGraduationYear(
  gradYearInput: string | number | null | undefined,
  startYearInput?: string | number | null | undefined,
  isOptional = false
): ValidationResult<number> {
  if (gradYearInput === null || gradYearInput === undefined || gradYearInput === "" || (typeof gradYearInput === "string" && gradYearInput.trim() === "")) {
    if (isOptional) {
      return { isValid: true, normalized: undefined };
    }
    return { isValid: false, error: "Graduation year is required." };
  }

  const gradYearStr = typeof gradYearInput === "number" ? gradYearInput.toString() : gradYearInput.trim();
  const gradYear = parseInt(gradYearStr, 10);

  if (isNaN(gradYear) || !/^\d{4}$/.test(gradYearStr)) {
    return { isValid: false, error: "Graduation year must be a 4-digit year (e.g. 2026)." };
  }

  const currentYear = new Date().getFullYear();
  const minReasonableYear = currentYear - 15;
  const maxReasonableYear = currentYear + 8;

  if (gradYear < minReasonableYear || gradYear > maxReasonableYear) {
    return {
      isValid: false,
      error: `Graduation year (${gradYear}) is outside reasonable range (${minReasonableYear}–${maxReasonableYear}).`
    };
  }

  if (startYearInput !== undefined && startYearInput !== null && startYearInput !== "") {
    const startYear = typeof startYearInput === "number" ? startYearInput : parseInt(startYearInput.toString().trim(), 10);
    if (!isNaN(startYear) && gradYear < startYear) {
      return {
        isValid: false,
        error: `Graduation year (${gradYear}) cannot be earlier than start year (${startYear}).`
      };
    }
  }

  return { isValid: true, normalized: gradYear };
}

// ─── 5. URL VALIDATION ───

export function validateUrl(
  input: string | null | undefined,
  isOptional = true,
  expectedHost?: string
): ValidationResult<string> {
  if (input === null || input === undefined || input.trim() === "") {
    if (isOptional) {
      return { isValid: true, normalized: undefined };
    }
    return { isValid: false, error: "URL is required." };
  }

  const trimmed = input.trim();
  let parsedUrl: URL;

  try {
    const urlCandidate = trimmed.startsWith("http://") || trimmed.startsWith("https://") 
      ? trimmed 
      : `https://${trimmed}`;
    parsedUrl = new URL(urlCandidate);
  } catch {
    return { isValid: false, error: "Invalid URL format." };
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return { isValid: false, error: "URL must use HTTP or HTTPS protocol." };
  }

  if (expectedHost && !parsedUrl.hostname.toLowerCase().includes(expectedHost.toLowerCase())) {
    return {
      isValid: false,
      error: `URL must be a valid ${expectedHost} link (got ${parsedUrl.hostname}).`
    };
  }

  return { isValid: true, normalized: parsedUrl.toString() };
}

// ─── 6. TECHNICAL SKILL DATA ENTRY ───

export interface NormalizedSkillPayload {
  name: string;
  level: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  yearsOfExperience: number;
  learningMethod: "Self-learned" | "Coursework" | "Bootcamp" | "On-the-job" | "Open Source";
  evidenceSource: string;
  claimStatus: DNAClaimStatus;
  isVerified: boolean;
}

export function validateSkillEntry(raw: any): ValidationResult<NormalizedSkillPayload> {
  if (!raw || typeof raw !== "object") {
    return { isValid: false, error: "Invalid skill entry format." };
  }

  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  if (!name || name.length < 2) {
    return { isValid: false, error: "Skill name must be at least 2 characters." };
  }

  const validLevels = ["Beginner", "Intermediate", "Advanced", "Expert"];
  const level = validLevels.includes(raw.level) ? raw.level : "Intermediate";

  const yearsOfExperience = typeof raw.yearsOfExperience === "number" && raw.yearsOfExperience >= 0
    ? Math.min(raw.yearsOfExperience, 20)
    : 1;

  const validMethods = ["Self-learned", "Coursework", "Bootcamp", "On-the-job", "Open Source"];
  const learningMethod = validMethods.includes(raw.learningMethod) ? raw.learningMethod : "Self-learned";

  const evidenceSource = typeof raw.evidenceSource === "string" && raw.evidenceSource.trim()
    ? raw.evidenceSource.trim()
    : "Self-Reported Claim";

  // CRITICAL REQUIREMENT: Selecting 'Self-learned' or manual entry must NOT mark a skill verified
  return {
    isValid: true,
    normalized: {
      name,
      level,
      yearsOfExperience,
      learningMethod,
      evidenceSource,
      claimStatus: "SELF_REPORTED",
      isVerified: false // Strict invariant: self-entered skills start unverified
    }
  };
}

// ─── 7. PROJECT DATA ENTRY ───

export interface NormalizedProjectPayload {
  title: string;
  description: string;
  problemSolved?: string;
  techStack: string[];
  role: string;
  contributions?: string;
  githubUrl?: string;
  liveUrl?: string;
  duration?: string;
  claimStatus: DNAClaimStatus;
  isVerified: boolean;
}

export function validateProjectEntry(raw: any): ValidationResult<NormalizedProjectPayload> {
  if (!raw || typeof raw !== "object") {
    return { isValid: false, error: "Invalid project entry format." };
  }

  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  if (!title || title.length < 3) {
    return { isValid: false, error: "Project title must be at least 3 characters." };
  }

  const description = typeof raw.description === "string" ? raw.description.trim() : "";
  if (!description || description.length < 10) {
    return { isValid: false, error: "Project description must provide at least 10 characters explaining what was built." };
  }

  // Validate GitHub URL if provided
  let githubUrl: string | undefined = undefined;
  if (raw.githubUrl && typeof raw.githubUrl === "string" && raw.githubUrl.trim()) {
    const urlCheck = validateUrl(raw.githubUrl, true, "github.com");
    if (!urlCheck.isValid) {
      return { isValid: false, error: `GitHub link invalid: ${urlCheck.error}` };
    }
    githubUrl = urlCheck.normalized;
  }

  // Validate Live URL if provided
  let liveUrl: string | undefined = undefined;
  if (raw.liveUrl && typeof raw.liveUrl === "string" && raw.liveUrl.trim()) {
    const urlCheck = validateUrl(raw.liveUrl, true);
    if (!urlCheck.isValid) {
      return { isValid: false, error: `Live deployment link invalid: ${urlCheck.error}` };
    }
    liveUrl = urlCheck.normalized;
  }

  let techStack: string[] = [];
  if (Array.isArray(raw.techStack)) {
    techStack = raw.techStack.map((t: any) => typeof t === "string" ? t.trim() : "").filter(Boolean);
  } else if (typeof raw.techStack === "string") {
    techStack = raw.techStack.split(",").map((t: string) => t.trim()).filter(Boolean);
  }
  if (techStack.length === 0) {
    techStack = ["Software Engineering"];
  }

  return {
    isValid: true,
    normalized: {
      title,
      description,
      problemSolved: typeof raw.problemSolved === "string" ? raw.problemSolved.trim() : undefined,
      techStack,
      role: typeof raw.role === "string" && raw.role.trim() ? raw.role.trim() : "Developer",
      contributions: typeof raw.contributions === "string" ? raw.contributions.trim() : undefined,
      githubUrl,
      liveUrl,
      duration: typeof raw.duration === "string" ? raw.duration.trim() : undefined,
      claimStatus: "SELF_REPORTED",
      isVerified: false // URL syntax validity does NOT equal code verification
    }
  };
}

// ─── 8. COMPREHENSIVE STUDENT DNA PAYLOAD VALIDATOR ───

export interface DnaPayloadValidationReport {
  isValid: boolean;
  errors: Record<string, string>;
  sanitized: any;
}

export function validateStudentDnaPayload(
  body: any,
  isPartialSave = false
): DnaPayloadValidationReport {
  const errors: Record<string, string> = {};
  const sanitized: any = { ...body };

  if (!body || typeof body !== "object") {
    return {
      isValid: false,
      errors: { root: "Payload must be a valid JSON object." },
      sanitized: {}
    };
  }

  // 1. Full Name
  if (body.fullName !== undefined) {
    const name = typeof body.fullName === "string" ? body.fullName.trim() : "";
    if (!isPartialSave && (!name || name.length < 2)) {
      errors.fullName = "Full name must be at least 2 characters long.";
    } else {
      sanitized.fullName = name;
    }
  }

  // 2. Phone Number (Optional field, but strict format if provided)
  if (body.phone !== undefined && body.phone !== null && body.phone !== "") {
    const phoneRes = validateIndianPhoneNumber(body.phone, true);
    if (!phoneRes.isValid) {
      errors.phone = phoneRes.error!;
    } else {
      sanitized.phone = phoneRes.normalized;
    }
  } else {
    sanitized.phone = undefined;
  }

  // 3. Location (Normalized or manual)
  if (body.location !== undefined) {
    sanitized.location = typeof body.location === "string" ? body.location.trim() : "";
  }

  // 4. College / University
  if (body.college !== undefined) {
    const college = typeof body.college === "string" ? body.college.trim() : "";
    if (!isPartialSave && (!college || college.length < 2)) {
      errors.college = "College / University name is required.";
    } else {
      sanitized.college = college;
    }
  }

  // 5. Degree Program
  if (body.degree !== undefined) {
    sanitized.degree = typeof body.degree === "string" ? body.degree.trim() : "";
  }

  // 6. Branch / Major
  if (body.branch !== undefined) {
    sanitized.branch = typeof body.branch === "string" ? body.branch.trim() : "";
  }

  // 7. Graduation Year
  if (body.graduationYear !== undefined && body.graduationYear !== null && body.graduationYear !== "") {
    const gradRes = validateGraduationYear(body.graduationYear, undefined, isPartialSave);
    if (!gradRes.isValid) {
      errors.graduationYear = gradRes.error!;
    } else {
      sanitized.graduationYear = gradRes.normalized?.toString();
    }
  }

  // 8. CGPA / Score
  if (body.cgpa !== undefined && body.cgpa !== null && body.cgpa !== "") {
    const scale: GradingScale = body.gradingScale === "4" ? "4" : body.gradingScale === "percentage" ? "percentage" : "10";
    const cgpaRes = validateCgpa(body.cgpa, scale, true);
    if (!cgpaRes.isValid) {
      errors.cgpa = cgpaRes.error!;
    } else {
      sanitized.cgpa = cgpaRes.normalized?.toString();
    }
  } else {
    sanitized.cgpa = undefined;
  }

  // 9. URLs
  if (body.githubUrl) {
    const res = validateUrl(body.githubUrl, true, "github.com");
    if (!res.isValid) errors.githubUrl = res.error!;
    else sanitized.githubUrl = res.normalized;
  }
  if (body.linkedinUrl) {
    const res = validateUrl(body.linkedinUrl, true, "linkedin.com");
    if (!res.isValid) errors.linkedinUrl = res.error!;
    else sanitized.linkedinUrl = res.normalized;
  }
  if (body.portfolioUrl) {
    const res = validateUrl(body.portfolioUrl, true);
    if (!res.isValid) errors.portfolioUrl = res.error!;
    else sanitized.portfolioUrl = res.normalized;
  }

  // 10. Skills
  if (Array.isArray(body.skills)) {
    const validatedSkills = [];
    for (let i = 0; i < body.skills.length; i++) {
      const s = body.skills[i];
      const sRes = validateSkillEntry(s);
      if (!sRes.isValid) {
        errors[`skills[${i}]`] = sRes.error!;
      } else {
        validatedSkills.push(sRes.normalized);
      }
    }
    sanitized.skills = validatedSkills;
  }

  // 11. Projects
  if (Array.isArray(body.projects)) {
    const validatedProjects = [];
    for (let i = 0; i < body.projects.length; i++) {
      const p = body.projects[i];
      const pRes = validateProjectEntry(p);
      if (!pRes.isValid) {
        errors[`projects[${i}]`] = pRes.error!;
      } else {
        validatedProjects.push(pRes.normalized);
      }
    }
    sanitized.projects = validatedProjects;
  }

  const isValid = Object.keys(errors).length === 0;

  return {
    isValid,
    errors,
    sanitized
  };
}
