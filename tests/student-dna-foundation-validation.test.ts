import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  validateIndianPhoneNumber,
  validateCgpa,
  validatePercentage,
  validateGraduationYear,
  validateUrl,
  validateSkillEntry,
  validateProjectEntry,
  validateStudentDnaPayload,
} from "../lib/validation/student-dna-validation";

import {
  searchLocations,
  normalizeLocation,
} from "../lib/geo/location-service";

import {
  searchInstitutions,
  normalizeInstitution,
} from "../lib/institution/institution-service";

import {
  CANONICAL_CONNECTION_STATUSES,
  CANONICAL_CLAIM_STATUSES,
  type DNASourceConnectionStatus,
  type DNAClaimStatus,
} from "../lib/dna/contracts";

describe("PHASE 1: STUDENT DNA FOUNDATION, VALIDATION & DATA INTEGRITY", () => {
  // ─── 1. PHONE NUMBER VALIDATION ───
  describe("Phone Number Validation", () => {
    test("Accepts valid 10-digit Indian mobile numbers with prefixes", () => {
      const res1 = validateIndianPhoneNumber("9876543210");
      assert.equal(res1.isValid, true);
      assert.equal(res1.normalized, "+91 9876543210");

      const res2 = validateIndianPhoneNumber("+91 98765 43210");
      assert.equal(res2.isValid, true);
      assert.equal(res2.normalized, "+91 9876543210");

      const res3 = validateIndianPhoneNumber("09876543210");
      assert.equal(res3.isValid, true);
      assert.equal(res3.normalized, "+91 9876543210");

      const res4 = validateIndianPhoneNumber("91-78901-23456");
      assert.equal(res4.isValid, true);
      assert.equal(res4.normalized, "+91 7890123456");
    });

    test("Rejects 11-digit numbers (must not silently truncate)", () => {
      const res = validateIndianPhoneNumber("98765432101");
      assert.equal(res.isValid, false);
      assert.ok(res.error?.includes("11 digits"));
    });

    test("Rejects 9-digit numbers", () => {
      const res = validateIndianPhoneNumber("987654321");
      assert.equal(res.isValid, false);
      assert.ok(res.error?.includes("9 digits"));
    });

    test("Rejects numbers starting with invalid prefixes (1-5)", () => {
      const res = validateIndianPhoneNumber("1234567890");
      assert.equal(res.isValid, false);
      assert.ok(res.error?.includes("must start with 6, 7, 8, or 9"));
    });

    test("Rejects alphabetic and malformed strings", () => {
      const res1 = validateIndianPhoneNumber("987654321a");
      assert.equal(res1.isValid, false);
      assert.ok(res1.error?.includes("contains letters"));

      const res2 = validateIndianPhoneNumber("abcdefghij");
      assert.equal(res2.isValid, false);
      assert.ok(res2.error?.includes("contains letters"));
    });

    test("Preserves empty optional phone number as undefined (never '0')", () => {
      const res = validateIndianPhoneNumber("", true);
      assert.equal(res.isValid, true);
      assert.equal(res.normalized, undefined);
    });

    test("Rejects empty required phone number", () => {
      const res = validateIndianPhoneNumber("", false);
      assert.equal(res.isValid, false);
      assert.equal(res.error, "Phone number is required.");
    });
  });

  // ─── 2. CGPA & GRADING SCALE VALIDATION ───
  describe("CGPA and Grading Scale Validation", () => {
    test("Accepts valid 10-point scale CGPA and formats decimals", () => {
      const res1 = validateCgpa("8.6", "10");
      assert.equal(res1.isValid, true);
      assert.equal(res1.normalized, 8.6);

      const res2 = validateCgpa("9.42 / 10.0", "10");
      assert.equal(res2.isValid, true);
      assert.equal(res2.normalized, 9.42);
    });

    test("Rejects zero CGPA under standard academic rules", () => {
      const res = validateCgpa("0", "10");
      assert.equal(res.isValid, false);
      assert.ok(res.error?.includes("CGPA of 0.0 is invalid"));
    });

    test("Rejects negative CGPA", () => {
      const res = validateCgpa("-3.5", "10");
      assert.equal(res.isValid, false);
      assert.ok(res.error?.includes("cannot be negative"));
    });

    test("Rejects CGPA above scale maximum (e.g. 10.5 on 10 scale)", () => {
      const res = validateCgpa("10.5", "10");
      assert.equal(res.isValid, false);
      assert.ok(res.error?.includes("cannot exceed 10.0"));
    });

    test("Validates 4-point scale correctly", () => {
      const valid = validateCgpa("3.8", "4");
      assert.equal(valid.isValid, true);
      assert.equal(valid.normalized, 3.8);

      const invalid = validateCgpa("4.2", "4");
      assert.equal(invalid.isValid, false);
      assert.ok(invalid.error?.includes("cannot exceed 4.0"));
    });

    test("Validates percentage scale correctly", () => {
      const valid = validateCgpa("88.5%", "percentage");
      assert.equal(valid.isValid, true);
      assert.equal(valid.normalized, 88.5);

      const invalid = validateCgpa("105", "percentage");
      assert.equal(invalid.isValid, false);
      assert.ok(invalid.error?.includes("cannot exceed 100%"));
    });

    test("Preserves empty optional CGPA as undefined (never 0)", () => {
      const res = validateCgpa("", "10", true);
      assert.equal(res.isValid, true);
      assert.equal(res.normalized, undefined);
    });

    test("Rejects non-numeric, NaN, and Infinity inputs", () => {
      const res1 = validateCgpa("abc", "10");
      assert.equal(res1.isValid, false);
      assert.ok(res1.error?.includes("valid numeric value"));

      const res2 = validateCgpa(Infinity, "10");
      assert.equal(res2.isValid, false);
    });
  });

  // ─── 3. PERCENTAGE & YEAR VALIDATION ───
  describe("Percentage and Year Validation", () => {
    test("Validates percentage in 0-100 range", () => {
      const res = validatePercentage("92.5");
      assert.equal(res.isValid, true);
      assert.equal(res.normalized, 92.5);

      const neg = validatePercentage("-5");
      assert.equal(neg.isValid, false);

      const over = validatePercentage("105");
      assert.equal(over.isValid, false);
    });

    test("Validates graduation year in reasonable 4-digit range", () => {
      const currentYear = new Date().getFullYear();
      const validYear = currentYear + 1;
      const res = validateGraduationYear(validYear.toString());
      assert.equal(res.isValid, true);
      assert.equal(res.normalized, validYear);

      const invalidFormat = validateGraduationYear("26");
      assert.equal(invalidFormat.isValid, false);

      const tooOld = validateGraduationYear("1980");
      assert.equal(tooOld.isValid, false);
    });

    test("Rejects graduation year earlier than start year", () => {
      const res = validateGraduationYear("2024", "2025");
      assert.equal(res.isValid, false);
      assert.ok(res.error?.includes("cannot be earlier than start year"));
    });
  });

  // ─── 4. LOCATION AUTOCOMPLETE FOUNDATION ───
  describe("Location Autocomplete & Normalization", () => {
    test("Searches and normalizes 'Ghaziabad' to 'Ghaziabad, Uttar Pradesh, India'", async () => {
      const results = await searchLocations("Ghaziabad");
      assert.ok(results.length > 0, "Must return results for Ghaziabad");
      const found = results[0];
      assert.equal(found.city, "Ghaziabad");
      assert.equal(found.state, "Uttar Pradesh");
      assert.equal(found.country, "India");
      assert.equal(found.displayName, "Ghaziabad, Uttar Pradesh, India");
      assert.equal(found.isManual, false);
    });

    test("Handles short or empty search queries safely", async () => {
      const results = await searchLocations("a");
      assert.deepEqual(results, []);
    });

    test("Normalizes manual entry without fabricating coordinates", () => {
      const normalized = normalizeLocation("Modinagar, Uttar Pradesh, India");
      assert.equal(normalized.city, "Modinagar");
      assert.equal(normalized.state, "Uttar Pradesh");
      assert.equal(normalized.country, "India");
      assert.equal(normalized.isManual, true);
      assert.equal(normalized.isVerified, false);
    });
  });

  // ─── 5. INSTITUTION AUTOCOMPLETE FOUNDATION ───
  describe("Institution Autocomplete & Normalization", () => {
    test("Searches and normalizes 'ABES Engineering College, Ghaziabad'", async () => {
      const results = await searchInstitutions("ABES");
      assert.ok(results.length > 0, "Must find ABES Engineering College");
      const abes = results[0];
      assert.ok(abes.name.includes("ABES Engineering College"));
      assert.equal(abes.city, "Ghaziabad");
      assert.equal(abes.state, "Uttar Pradesh");
      assert.equal(abes.isVerified, true);
      assert.equal(abes.attendanceVerified, false, "Attendance must remain unverified without evidence");
    });

    test("Preserves unlisted institution without silent replacement", () => {
      const rawName = "Government Polytechnic College, Bareilly";
      const normalized = normalizeInstitution(rawName);
      assert.equal(normalized.name, rawName);
      assert.equal(normalized.isManual, true);
      assert.equal(normalized.isVerified, false);
      assert.equal(normalized.attendanceVerified, false);
    });
  });

  // ─── 6. TECHNICAL SKILL & PROJECT DATA ENTRY INTEGRITY ───
  describe("Skill & Project Data Entry Integrity", () => {
    test("Self-learned skill is recorded as SELF_REPORTED and isVerified: false", () => {
      const res = validateSkillEntry({
        name: "Python",
        level: "Advanced",
        yearsOfExperience: 3,
        learningMethod: "Self-learned"
      });
      assert.equal(res.isValid, true);
      assert.equal(res.normalized?.name, "Python");
      assert.equal(res.normalized?.claimStatus, "SELF_REPORTED");
      assert.equal(res.normalized?.isVerified, false, "Self-learned skill must NOT be marked verified");
    });

    test("Rejects empty skill name", () => {
      const res = validateSkillEntry({ name: "", level: "Beginner" });
      assert.equal(res.isValid, false);
      assert.ok(res.error?.includes("at least 2 characters"));
    });

    test("Validates project entry and verifies URL syntax != verified code", () => {
      const res = validateProjectEntry({
        title: "Distributed Pipeline",
        description: "Built high-throughput indexing engine for career intelligence",
        githubUrl: "https://github.com/testuser/pipeline",
        techStack: ["Python", "Docker"]
      });
      assert.equal(res.isValid, true);
      assert.equal(res.normalized?.title, "Distributed Pipeline");
      assert.equal(res.normalized?.claimStatus, "SELF_REPORTED");
      assert.equal(res.normalized?.isVerified, false, "Valid URL does NOT make code verified");
    });

    test("Rejects malformed project URLs", () => {
      const res = validateProjectEntry({
        title: "Test Project",
        description: "Built valid description here with plenty of characters",
        githubUrl: "not-a-valid-url"
      });
      assert.equal(res.isValid, false);
      assert.ok(res.error?.includes("GitHub link invalid"));
    });
  });

  // ─── 7. COMPREHENSIVE PAYLOAD VALIDATOR ───
  describe("Comprehensive Student DNA Payload Validator", () => {
    test("Rejects payload containing invalid 11-digit phone number", () => {
      const report = validateStudentDnaPayload({
        fullName: "Rahul Sharma",
        phone: "98765432101", // 11 digits
        college: "ABES Engineering College, Ghaziabad"
      });
      assert.equal(report.isValid, false);
      assert.ok(report.errors.phone);
    });

    test("Rejects payload containing invalid 0.0 CGPA", () => {
      const report = validateStudentDnaPayload({
        fullName: "Rahul Sharma",
        college: "ABES Engineering College, Ghaziabad",
        cgpa: "0.0"
      });
      assert.equal(report.isValid, false);
      assert.ok(report.errors.cgpa);
    });

    test("Accepts complete valid payload and sanitizes entries", () => {
      const report = validateStudentDnaPayload({
        fullName: "Rahul Sharma",
        phone: "9876543210",
        college: "ABES Engineering College, Ghaziabad",
        degree: "B.Tech",
        branch: "Computer Science & Engineering",
        graduationYear: "2026",
        cgpa: "8.8",
        skills: [
          { name: "Python", level: "Advanced", learningMethod: "Self-learned" }
        ],
        projects: [
          {
            title: "Opportunity Discovery Engine",
            description: "High-throughput indexing engine for career intelligence",
            techStack: ["Python", "FastAPI"]
          }
        ]
      });
      assert.equal(report.isValid, true);
      assert.equal(report.sanitized.phone, "+91 9876543210");
      assert.equal(report.sanitized.cgpa, "8.8");
      assert.equal(report.sanitized.skills[0].isVerified, false);
      assert.equal(report.sanitized.projects[0].isVerified, false);
    });
  });

  // ─── 8. FUTURE EVIDENCE CONTRACT INTEGRITY ───
  describe("Future Evidence Integration Contracts", () => {
    test("Covers all canonical source connection statuses", () => {
      const expectedStatuses: DNASourceConnectionStatus[] = [
        "NOT_PROVIDED",
        "NOT_CONNECTED",
        "PENDING",
        "RETRIEVAL_FAILED",
        "CONTENT_RETRIEVED",
        "INSPECTION_PENDING",
        "INSPECTED",
        "STALE"
      ];
      for (const s of expectedStatuses) {
        assert.ok(CANONICAL_CONNECTION_STATUSES[s], `Status ${s} must have documented label`);
      }
    });

    test("Covers all canonical claim verification statuses", () => {
      const expectedClaims: DNAClaimStatus[] = [
        "SELF_REPORTED",
        "SOURCE_REPORTED",
        "SUPPORTED",
        "PARTIALLY_SUPPORTED",
        "CONFLICTING_EVIDENCE",
        "NOT_FOUND_IN_INSPECTED_SOURCES",
        "NOT_INSPECTED",
        "SOURCE_UNAVAILABLE",
        "PENDING_VERIFICATION",
        "INDEPENDENTLY_VERIFIED"
      ];
      for (const c of expectedClaims) {
        assert.ok(CANONICAL_CLAIM_STATUSES[c], `Claim status ${c} must have documented label`);
      }
    });
  });
});
