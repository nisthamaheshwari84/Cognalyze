"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppNav from "@/components/AppNav";
import { RoleDNA, StructuredRoleRequirement } from "@/lib/ai/role-dna";
import { RoleExtractionConflict, RoleExtractionResult, RoleCategory } from "@/lib/roles/role-extractor";
import { RoleDNAStructure } from "@/lib/roles/types";

type WizardStep = "details" | "review" | "confirmation";

export default function RecruiterRolesPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [roles, setRoles] = useState<RoleDNA[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<RoleDNA | null>(null);

  // Wizard flow state
  const [isCreating, setIsCreating] = useState(true);
  const [currentStep, setCurrentStep] = useState<WizardStep>("details");
  const [roleDna, setRoleDna] = useState<RoleDNAStructure | null>(null);

  // Step 1: Role Details
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [targetHires, setTargetHires] = useState(1);
  const [workMode, setWorkMode] = useState<"Remote" | "Hybrid" | "On-site">("Remote");
  const [location, setLocation] = useState("");

  // Step 1: JD Input
  const [jdInputMode, setJdInputMode] = useState<"paste" | "upload">("paste");
  const [jdText, setJdText] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Step 1: Analysis Progress State
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Step 2: Extracted Requirements Review
  const [requirements, setRequirements] = useState<StructuredRoleRequirement[]>([]);
  const [conflicts, setConflicts] = useState<RoleExtractionConflict[]>([]);
  const [rawJdText, setRawJdText] = useState("");
  const [expandedEvidenceId, setExpandedEvidenceId] = useState<string | null>(null);

  // Inline Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState<RoleCategory>("required");
  const [editType, setEditType] = useState<string>("technical_skill");

  // Add Custom Requirement Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [customReqName, setCustomReqName] = useState("");
  const [customReqCategory, setCustomReqCategory] = useState<RoleCategory>("required");
  const [customReqType, setCustomReqType] = useState<string>("technical_skill");
  const [customReqExpectation, setCustomReqExpectation] = useState<string>("implementation");
  const [customReqSignals, setCustomReqSignals] = useState<string>("GitHub, Projects, Assessment");

  // Optional 90-day success
  const [show90DaySection, setShow90DaySection] = useState(false);
  const [success90Days, setSuccess90Days] = useState("");

  // Step 3: Creation state
  const [saving, setSaving] = useState(false);
  const [savedSuccessMessage, setSavedSuccessMessage] = useState<string | null>(null);

  // Fetch existing roles
  useEffect(() => {
    async function fetchRoles() {
      try {
        const res = await fetch("/api/recruiter/roles");
        const data = await res.json();
        if (data.success && data.roles) {
          setRoles(data.roles);
          if (data.roles.length > 0) {
            setSelectedRole(data.roles[0]);
            setIsCreating(false);
          } else {
            setIsCreating(true);
          }
        }
      } catch (err) {
        console.error("Failed to fetch roles:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRoles();
  }, []);

  // Handle File Drop or Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      setErrorMessage(null);
    }
  };

  // Primary Action: Analyze Job Description
  const handleAnalyzeJd = async () => {
    setErrorMessage(null);

    // Validation
    if (jdInputMode === "paste" && !jdText.trim()) {
      setErrorMessage("Add a job description to continue.");
      return;
    }
    if (jdInputMode === "upload" && !uploadedFile) {
      setErrorMessage("Please select a job description file (.pdf, .docx, .txt) to upload.");
      return;
    }
    if (!title.trim()) {
      setErrorMessage("Please specify a Job Title before analyzing.");
      return;
    }

    setAnalyzing(true);
    setAnalysisProgress("Reading job description…");

    try {
      let response: Response;

      if (jdInputMode === "upload" && uploadedFile) {
        setAnalysisProgress("Parsing document file…");
        const formData = new FormData();
        formData.append("file", uploadedFile);
        formData.append("fallbackTitle", title.trim());
        response = await fetch("/api/recruiter/analyze-jd", {
          method: "POST",
          body: formData,
        });
      } else {
        setAnalysisProgress("Identifying requirements…");
        response = await fetch("/api/recruiter/analyze-jd", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jdText: jdText.trim() }),
        });
      }

      setAnalysisProgress("Separating required and preferred…");

      const data = await response.json();
      if (!data.success && data.error) {
        throw new Error(data.error);
      }

      const result: RoleExtractionResult = data.result || data.structured;
      if (!result || !result.requirements || result.requirements.length === 0) {
        throw new Error(
          "We couldn't reliably identify enough role requirements from this description. Add more detail or paste the JD directly."
        );
      }

      setAnalysisProgress("Preparing role…");

      // Populate extracted fields
      setRequirements(result.requirements);
      setConflicts(result.conflicts || []);
      setRawJdText(result.rawText || jdText);
      if (data.roleDna || result.roleDna) {
        setRoleDna(data.roleDna || result.roleDna);
      }

      // Transition to Review
      setTimeout(() => {
        setAnalyzing(false);
        setCurrentStep("review");
      }, 350);
    } catch (err: any) {
      setAnalyzing(false);
      setErrorMessage(err.message || "We couldn't reliably read this file. Try another file or paste the JD directly.");
    }
  };

  // Edit / Delete Requirement Handlers
  const handleStartEdit = (req: StructuredRoleRequirement) => {
    setEditingId(req.id);
    setEditName(req.canonicalName || req.name);
    setEditCategory(req.category);
    setEditType(req.requirementType || "technical_skill");
  };

  const handleSaveEdit = (id: string) => {
    setRequirements((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              name: editName.trim() || r.name,
              canonicalName: editName.trim() || r.canonicalName || r.name,
              category: editCategory,
              requirementType: editType as any,
              needsConfirmation: false, // User explicitly edited/confirmed
            }
          : r
      )
    );
    setEditingId(null);
  };

  const handleDeleteRequirement = (id: string) => {
    setRequirements((prev) => prev.filter((r) => r.id !== id));
  };

  const handleKeepAsWritten = (id: string) => {
    setRequirements((prev) =>
      prev.map((r) => (r.id === id ? { ...r, needsConfirmation: false } : r))
    );
  };

  // Add Custom Requirement (Strictly marked as recruiter_added)
  const handleAddCustomRequirement = () => {
    if (!customReqName.trim()) return;
    const signals = customReqSignals.split(",").map(s => s.trim()).filter(Boolean);
    const newReq: StructuredRoleRequirement = {
      id: `req-custom-${Date.now().toString().slice(-4)}`,
      name: customReqName.trim(),
      canonicalName: customReqName.trim(),
      category: customReqCategory,
      evidenceQuote: "Manually added by recruiter during role setup.",
      source: "recruiter_added",
      needsConfirmation: false,
      semanticCategory: customReqCategory === "required" ? "MUST_HAVE" : customReqCategory === "preferred" ? "PREFERRED" : customReqCategory === "education" ? "ELIGIBILITY" : customReqCategory === "responsibility" ? "RESPONSIBILITY" : "CONSTRAINT",
      requirementType: customReqType as any,
      importance: customReqCategory === "required" ? "mandatory" : customReqCategory === "preferred" ? "preferred" : "conditional",
      evidenceExpectation: customReqExpectation as any,
      rationale: "Explicitly specified as a required capability by the recruiter.",
      evidenceSignals: signals.length > 0 ? signals : ["Projects", "Work Experience", "Assessment"],
      verificationStrategy: ["Implementation > Claim", "Verify in technical work sample"]
    };
    setRequirements((prev) => [newReq, ...prev]);
    setCustomReqName("");
    setCustomReqSignals("GitHub, Projects, Assessment");
    setShowAddModal(false);
  };

  // Final Action: Create Role & Start Screening
  const handleCreateRole = async () => {
    if (!title.trim() || requirements.length === 0) return;
    setSaving(true);
    setErrorMessage(null);

    try {
      const payload = {
        title: title.trim(),
        department: department.trim() || "Engineering",
        targetHires: targetHires || 1,
        workMode,
        location: location.trim() || undefined,
        structuredRequirements: requirements,
        roleDna: roleDna || undefined,
        jdRaw: rawJdText || jdText,
        success90Days: success90Days.trim() || undefined,
      };

      const res = await fetch("/api/recruiter/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.role) {
        setRoles((prev) => [data.role, ...prev]);
        setSelectedRole(data.role);
        if (typeof window !== "undefined") {
          localStorage.setItem("cognalyze_active_role_id", data.role.id);
        }
        setSavedSuccessMessage(`Role "${data.role.title}" successfully created!`);
        // Navigate directly to screening
        router.push(`/recruiter/candidates?roleId=${data.role.id}`);
      } else {
        throw new Error(data.error || "Failed to save role.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create role.");
      setSaving(false);
    }
  };

  // Group requirements for display by semantic categories
  const mustHaveList = requirements.filter(
    (r) => r.semanticCategory === "MUST_HAVE" || (r.category === "required" && r.semanticCategory !== "RESPONSIBILITY")
  );
  const preferredList = requirements.filter(
    (r) => r.semanticCategory === "PREFERRED" || (r.category === "preferred" && r.semanticCategory !== "EVIDENCE_SIGNAL")
  );
  const eligibilityList = requirements.filter(
    (r) => r.semanticCategory === "ELIGIBILITY" || r.category === "education"
  );
  const responsibilityList = requirements.filter(
    (r) => r.semanticCategory === "RESPONSIBILITY" || r.category === "responsibility"
  );
  const evidenceSignalList = requirements.filter(
    (r) => r.semanticCategory === "EVIDENCE_SIGNAL"
  );
  const ambiguityList = requirements.filter(
    (r) => r.semanticCategory === "UNKNOWN" || r.needsConfirmation
  );
  const otherList = requirements.filter(
    (r) => (r.category === "other" || r.semanticCategory === "CONSTRAINT") && r.semanticCategory !== "EVIDENCE_SIGNAL" && !r.needsConfirmation
  );

  // Backward-compatibility aliases
  const requiredList = mustHaveList;
  const experienceList = requirements.filter((r) => r.category === "experience" && r.semanticCategory !== "MUST_HAVE");
  const educationList = eligibilityList;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#060913",
        color: "#f8fafc",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <AppNav role="recruiter" />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 20px" }}>
        {/* TOP HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 28,
            paddingBottom: 20,
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  fontSize: 11,
                  padding: "3px 8px",
                  borderRadius: 6,
                  background: "rgba(168,85,247,0.15)",
                  color: "#d8b4fe",
                  fontWeight: 800,
                  border: "1px solid rgba(168,85,247,0.3)",
                }}
              >
                ROLE CREATION
              </span>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>Evidence-Grounded Setup</span>
            </div>
            <h1
              style={{
                fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
                fontWeight: 900,
                margin: 0,
                letterSpacing: "-0.5px",
              }}
            >
              {isCreating ? "Create a New Role" : "Active Roles & Architect"}
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.65)",
                margin: "6px 0 0",
                maxWidth: 720,
                lineHeight: 1.5,
              }}
            >
              {isCreating
                ? "Add the job details and job description. Cognalyze will automatically structure the requirements for you."
                : "Select a role to review its verified requirements or create a new role from a job description."}
            </p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            {roles.length > 0 && (
              <button
                onClick={() => {
                  setIsCreating(!isCreating);
                  setCurrentStep("details");
                  setErrorMessage(null);
                }}
                style={{
                  padding: "10px 18px",
                  borderRadius: 10,
                  background: isCreating ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg, #a855f7, #6366f1)",
                  border: isCreating ? "1px solid rgba(255,255,255,0.15)" : "none",
                  color: "white",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {isCreating ? "← Back to Roles List" : "+ Create a New Role"}
              </button>
            )}
          </div>
        </div>

        {/* ERROR NOTICE */}
        {errorMessage && (
          <div
            style={{
              padding: "14px 18px",
              borderRadius: 10,
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              color: "#fca5a5",
              fontSize: 13,
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* SUCCESS NOTICE */}
        {savedSuccessMessage && (
          <div
            style={{
              padding: "14px 18px",
              borderRadius: 10,
              background: "rgba(16, 185, 129, 0.15)",
              border: "1px solid rgba(16, 185, 129, 0.4)",
              color: "#6ee7b7",
              fontSize: 13,
              marginBottom: 24,
              fontWeight: 700,
            }}
          >
            ✓ {savedSuccessMessage}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            WIZARD FLOW: CREATE ROLE
        ════════════════════════════════════════════════════════════════ */}
        {isCreating && (
          <div>
            {/* STEP PROGRESS BAR */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 28,
                padding: "12px 18px",
                background: "rgba(15, 23, 42, 0.6)",
                borderRadius: 12,
                border: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: currentStep === "details" ? "#c084fc" : "#10b981",
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: currentStep === "details" ? "#a855f7" : "#10b981",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  {currentStep === "details" ? "1" : "✓"}
                </span>
                <span>1. Role & Job Description</span>
              </div>
              <span style={{ color: "rgba(255,255,255,0.2)" }}>➔</span>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: currentStep === "review" ? "#c084fc" : currentStep === "confirmation" ? "#10b981" : "#64748b",
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: currentStep === "review" ? "#a855f7" : currentStep === "confirmation" ? "#10b981" : "rgba(255,255,255,0.1)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  {currentStep === "confirmation" ? "✓" : "2"}
                </span>
                <span>2. Review Extracted Requirements</span>
              </div>
              <span style={{ color: "rgba(255,255,255,0.2)" }}>➔</span>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: currentStep === "confirmation" ? "#c084fc" : "#64748b",
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: currentStep === "confirmation" ? "#a855f7" : "rgba(255,255,255,0.1)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  3
                </span>
                <span>3. Ready for Screening</span>
              </div>
            </div>

            {/* ────────────────────────────────────────────────────────────
                STEP 1: ROLE DETAILS & JOB DESCRIPTION
            ──────────────────────────────────────────────────────────── */}
            {currentStep === "details" && (
              <div
                style={{
                  background: "rgba(15, 23, 42, 0.45)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: 16,
                  padding: 28,
                }}
              >
                {/* SECTION 1: ROLE DETAILS */}
                <div style={{ marginBottom: 28 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 4px", color: "white" }}>
                    Role Details
                  </h2>
                  <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
                    Basic information about the role you are hiring for.
                  </p>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                      gap: 16,
                      marginTop: 18,
                    }}
                  >
                    {/* Job Title */}
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#cbd5e1", marginBottom: 6 }}>
                        Job Title <span style={{ color: "#f87171" }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Senior Backend Engineer"
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: 8,
                          background: "rgba(0,0,0,0.3)",
                          border: "1px solid rgba(255,255,255,0.15)",
                          color: "white",
                          fontSize: 13,
                          outline: "none",
                        }}
                      />
                    </div>

                    {/* Department */}
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#cbd5e1", marginBottom: 6 }}>
                        Department / Team <span style={{ color: "#64748b", fontWeight: 400 }}>(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="e.g. Engineering / Core Systems"
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: 8,
                          background: "rgba(0,0,0,0.3)",
                          border: "1px solid rgba(255,255,255,0.15)",
                          color: "white",
                          fontSize: 13,
                          outline: "none",
                        }}
                      />
                    </div>

                    {/* Number of Openings */}
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#cbd5e1", marginBottom: 6 }}>
                        Number of Openings <span style={{ color: "#f87171" }}>*</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={targetHires}
                        onChange={(e) => setTargetHires(parseInt(e.target.value, 10) || 1)}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: 8,
                          background: "rgba(0,0,0,0.3)",
                          border: "1px solid rgba(255,255,255,0.15)",
                          color: "white",
                          fontSize: 13,
                          outline: "none",
                        }}
                      />
                    </div>

                    {/* Work Mode */}
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#cbd5e1", marginBottom: 6 }}>
                        Work Mode <span style={{ color: "#64748b", fontWeight: 400 }}>(Optional)</span>
                      </label>
                      <div style={{ display: "flex", gap: 8 }}>
                        {(["Remote", "Hybrid", "On-site"] as const).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setWorkMode(mode)}
                            style={{
                              flex: 1,
                              padding: "9px 8px",
                              borderRadius: 8,
                              background: workMode === mode ? "rgba(168,85,247,0.25)" : "rgba(0,0,0,0.3)",
                              border: workMode === mode ? "1px solid #a855f7" : "1px solid rgba(255,255,255,0.1)",
                              color: workMode === mode ? "#d8b4fe" : "#94a3b8",
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Location */}
                    {workMode !== "Remote" && (
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#cbd5e1", marginBottom: 6 }}>
                          Location <span style={{ color: "#64748b", fontWeight: 400 }}>(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="e.g. Bengaluru, India"
                          style={{
                            width: "100%",
                            padding: "10px 14px",
                            borderRadius: 8,
                            background: "rgba(0,0,0,0.3)",
                            border: "1px solid rgba(255,255,255,0.15)",
                            color: "white",
                            fontSize: 13,
                            outline: "none",
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* SECTION 2: JOB DESCRIPTION (PRIMARY INPUT) */}
                <div style={{ paddingTop: 20, borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
                    <div>
                      <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 4px", color: "white" }}>
                        Job Description
                      </h2>
                      <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
                        Paste the job description or upload it. Cognalyze will identify the requirements automatically.
                      </p>
                    </div>

                    {/* Toggle: Paste vs Upload */}
                    <div style={{ display: "flex", gap: 6, background: "rgba(0,0,0,0.3)", padding: 4, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)" }}>
                      <button
                        type="button"
                        onClick={() => setJdInputMode("paste")}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 6,
                          background: jdInputMode === "paste" ? "rgba(168,85,247,0.3)" : "transparent",
                          color: jdInputMode === "paste" ? "#e9d5ff" : "#94a3b8",
                          border: "none",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        ✏️ Paste Text
                      </button>
                      <button
                        type="button"
                        onClick={() => setJdInputMode("upload")}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 6,
                          background: jdInputMode === "upload" ? "rgba(168,85,247,0.3)" : "transparent",
                          color: jdInputMode === "upload" ? "#e9d5ff" : "#94a3b8",
                          border: "none",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        📄 Upload File
                      </button>
                    </div>
                  </div>

                  {/* Option A: Paste Textarea */}
                  {jdInputMode === "paste" ? (
                    <div>
                      <textarea
                        rows={10}
                        value={jdText}
                        onChange={(e) => setJdText(e.target.value)}
                        placeholder="Paste your job description here (e.g. responsibilities, must-haves, preferred qualifications, experience requirements)..."
                        style={{
                          width: "100%",
                          padding: "14px 16px",
                          borderRadius: 12,
                          background: "rgba(0,0,0,0.35)",
                          border: "1px solid rgba(255,255,255,0.12)",
                          color: "white",
                          fontSize: 13,
                          lineHeight: 1.6,
                          outline: "none",
                          fontFamily: "inherit",
                          resize: "vertical",
                        }}
                      />
                    </div>
                  ) : (
                    /* Option B: File Upload */
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        padding: "36px 24px",
                        borderRadius: 12,
                        background: "rgba(0,0,0,0.35)",
                        border: "2px dashed rgba(168,85,247,0.35)",
                        textAlign: "center",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.docx,.txt,.md,.json"
                        onChange={handleFileChange}
                        style={{ display: "none" }}
                      />
                      <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "white", marginBottom: 4 }}>
                        {uploadedFile ? uploadedFile.name : "Click or drag your JD file here"}
                      </div>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>
                        Supported formats: PDF, DOCX, TXT (up to 10MB)
                      </div>
                      {uploadedFile && (
                        <div
                          style={{
                            display: "inline-block",
                            marginTop: 10,
                            padding: "4px 12px",
                            borderRadius: 6,
                            background: "rgba(16, 185, 129, 0.2)",
                            color: "#6ee7b7",
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          ✓ File selected ({Math.round(uploadedFile.size / 1024)} KB)
                        </div>
                      )}
                    </div>
                  )}

                  {/* Primary CTA: Analyze Job Description */}
                  <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      onClick={handleAnalyzeJd}
                      disabled={analyzing}
                      style={{
                        padding: "13px 28px",
                        borderRadius: 10,
                        background: analyzing ? "rgba(168,85,247,0.5)" : "linear-gradient(135deg, #a855f7, #6366f1)",
                        color: "white",
                        fontSize: 14,
                        fontWeight: 800,
                        border: "none",
                        cursor: analyzing ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        boxShadow: "0 4px 20px rgba(168,85,247,0.35)",
                      }}
                    >
                      {analyzing ? (
                        <>
                          <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>🔄</span>
                          <span>{analysisProgress}</span>
                        </>
                      ) : (
                        <>
                          <span>✨</span>
                          <span>Analyze Job Description</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ────────────────────────────────────────────────────────────
                STEP 2: REQUIREMENT REVIEW SCREEN
            ──────────────────────────────────────────────────────────── */}
            {currentStep === "review" && (
              <div
                style={{
                  background: "rgba(15, 23, 42, 0.45)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: 16,
                  padding: 28,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span
                        style={{
                          fontSize: 10,
                          padding: "2px 8px",
                          borderRadius: 4,
                          background: "rgba(168,85,247,0.2)",
                          color: "#d8b4fe",
                          fontWeight: 800,
                          letterSpacing: 0.5,
                        }}
                      >
                        ROLE DNA
                      </span>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>
                        Semantic Analysis & Evidence Strategy
                      </span>
                    </div>
                    <h2 style={{ fontSize: 20, fontWeight: 900, margin: "0 0 4px", color: "white" }}>
                      Role DNA: {title || "Engineering Role"}
                    </h2>
                    <p style={{ fontSize: 13, color: "#94a3b8", margin: 0, maxWidth: 740 }}>
                      Cognalyze semantically structured your job description into verified requirements, on-the-job responsibilities, eligibility constraints, and evidence signals.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 8,
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "white",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>+</span> Add Requirement
                  </button>
                </div>

                {/* ROLE DNA STAT SUMMARY BAR */}
                <div
                  style={{
                    padding: "14px 18px",
                    borderRadius: 12,
                    background: "rgba(168,85,247,0.07)",
                    border: "1px solid rgba(168,85,247,0.2)",
                    marginBottom: 24,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16 }}>🧬</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#e9d5ff" }}>
                      Verified Scope:
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 20, background: "rgba(239,68,68,0.2)", color: "#f87171" }}>
                      {mustHaveList.length} Must-Have{mustHaveList.length === 1 ? "" : "s"}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 20, background: "rgba(59,130,246,0.2)", color: "#60a5fa" }}>
                      {preferredList.length} Preferred
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 20, background: "rgba(16,185,129,0.2)", color: "#34d399" }}>
                      {eligibilityList.length} Eligibility
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 20, background: "rgba(168,85,247,0.2)", color: "#c084fc" }}>
                      {evidenceSignalList.length} Evidence Signal{evidenceSignalList.length === 1 ? "" : "s"}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 20, background: "rgba(245,158,11,0.2)", color: "#fbbf24" }}>
                      {responsibilityList.length} Responsibilit{responsibilityList.length === 1 ? "y" : "ies"}
                    </span>
                    {ambiguityList.length > 0 && (
                      <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 20, background: "rgba(245,158,11,0.25)", color: "#fef08a" }}>
                        ⚠️ {ambiguityList.length} Needs Confirmation
                      </span>
                    )}
                  </div>
                </div>

                {/* CONFLICT ALERTS */}
                {conflicts.length > 0 && (
                  <div
                    style={{
                      padding: "16px 20px",
                      borderRadius: 12,
                      background: "rgba(245, 158, 11, 0.12)",
                      border: "1px solid rgba(245, 158, 11, 0.35)",
                      marginBottom: 24,
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#fbbf24", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
                      <span>⚠️</span>
                      <span>Conflicting requirements found in job description</span>
                    </div>
                    {conflicts.map((c, i) => (
                      <div key={i} style={{ fontSize: 12, color: "#fef3c7", marginTop: 6, lineHeight: 1.5 }}>
                        <div>{c.reason}</div>
                        <div style={{ marginTop: 4, display: "flex", gap: 12, flexWrap: "wrap", opacity: 0.9 }}>
                          <span style={{ padding: "2px 8px", background: "rgba(0,0,0,0.2)", borderRadius: 4 }}>• &ldquo;{c.statementA}&rdquo;</span>
                          <span style={{ padding: "2px 8px", background: "rgba(0,0,0,0.2)", borderRadius: 4 }}>• &ldquo;{c.statementB}&rdquo;</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* AMBIGUITY ALERTS (NEEDS CONFIRMATION) */}
                {ambiguityList.length > 0 && (
                  <div
                    style={{
                      padding: "16px 20px",
                      borderRadius: 12,
                      background: "rgba(245, 158, 11, 0.08)",
                      border: "1px solid rgba(245, 158, 11, 0.3)",
                      marginBottom: 24,
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#fbbf24", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
                      <span>⚠️</span>
                      <span>Items Needing Recruiter Confirmation ({ambiguityList.length})</span>
                    </div>
                    <p style={{ fontSize: 12, color: "#fef3c7", margin: "0 0 12px", opacity: 0.9 }}>
                      Cognalyze avoids guessing specific technologies when the JD is vague. Confirm or edit these before screening.
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {ambiguityList.map((req) => renderRequirementCard(req))}
                    </div>
                  </div>
                )}

                {/* GROUPED ROLE DNA SECTIONS */}
                <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                  {/* 1. CORE MUST-HAVES */}
                  {mustHaveList.length > 0 && (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(239,68,68,0.2)", color: "#f87171", fontWeight: 800 }}>
                          MUST-HAVE
                        </span>
                        <h3 style={{ fontSize: 14, fontWeight: 800, color: "#cbd5e1", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>
                          Core Must-Have Requirements ({mustHaveList.length})
                        </h3>
                      </div>
                      <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 12px" }}>
                        Explicit mandatory candidate qualifications. Candidates must show authentic proof (Implementation &gt; Claim).
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {mustHaveList.map((req) => renderRequirementCard(req))}
                      </div>
                    </div>
                  )}

                  {/* 2. PREFERRED CAPABILITIES */}
                  {preferredList.length > 0 && (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(59,130,246,0.2)", color: "#60a5fa", fontWeight: 800 }}>
                          PREFERRED
                        </span>
                        <h3 style={{ fontSize: 14, fontWeight: 800, color: "#cbd5e1", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>
                          Preferred Capabilities ({preferredList.length})
                        </h3>
                      </div>
                      <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 12px" }}>
                        Desirable capabilities and differentiators. Not treated as dealbreakers for initial shortlist.
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {preferredList.map((req) => renderRequirementCard(req))}
                      </div>
                    </div>
                  )}

                  {/* 3. ELIGIBILITY CONDITIONS */}
                  {eligibilityList.length > 0 && (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(16,185,129,0.2)", color: "#34d399", fontWeight: 800 }}>
                          ELIGIBILITY
                        </span>
                        <h3 style={{ fontSize: 14, fontWeight: 800, color: "#cbd5e1", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>
                          Eligibility Conditions ({eligibilityList.length})
                        </h3>
                      </div>
                      <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 12px" }}>
                        Academic degree, graduation timeline, and work authorization prerequisites.
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {eligibilityList.map((req) => renderRequirementCard(req))}
                      </div>
                    </div>
                  )}

                  {/* 4. EVIDENCE SIGNALS */}
                  {evidenceSignalList.length > 0 && (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(168,85,247,0.2)", color: "#c084fc", fontWeight: 800 }}>
                          EVIDENCE SIGNALS
                        </span>
                        <h3 style={{ fontSize: 14, fontWeight: 800, color: "#cbd5e1", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>
                          Evidence Signals ({evidenceSignalList.length})
                        </h3>
                      </div>
                      <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 12px" }}>
                        Where Cognalyze's evidence engine searches for proof (GitHub, deployed demos, hackathons, publications).
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {evidenceSignalList.map((req) => renderRequirementCard(req))}
                      </div>
                    </div>
                  )}

                  {/* 5. ON-THE-JOB RESPONSIBILITIES (NOT SCREENING REQUIREMENTS) */}
                  {responsibilityList.length > 0 && (
                    <div style={{ padding: "18px 20px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(245,158,11,0.15)", color: "#fbbf24", fontWeight: 800 }}>
                          RESPONSIBILITY
                        </span>
                        <h3 style={{ fontSize: 14, fontWeight: 800, color: "#cbd5e1", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>
                          On-The-Job Responsibilities ({responsibilityList.length})
                        </h3>
                      </div>
                      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12, lineHeight: 1.5 }}>
                        ℹ️ <strong>Informs role context only:</strong> These describe what the candidate will do on the job. They inform candidate alignment but are <em>never</em> used to disqualify candidates during automated screening.
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {responsibilityList.map((req) => renderRequirementCard(req))}
                      </div>
                    </div>
                  )}

                  {/* 6. ROLE CONSTRAINTS */}
                  {otherList.length > 0 && (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(148,163,184,0.2)", color: "#cbd5e1", fontWeight: 800 }}>
                          CONSTRAINTS
                        </span>
                        <h3 style={{ fontSize: 14, fontWeight: 800, color: "#cbd5e1", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>
                          Role Constraints ({otherList.length})
                        </h3>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {otherList.map((req) => renderRequirementCard(req))}
                      </div>
                    </div>
                  )}
                </div>

                {/* OPTIONAL 90-DAY SUCCESS SECTION */}
                <div
                  style={{
                    marginTop: 32,
                    paddingTop: 20,
                    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  {!show90DaySection ? (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#cbd5e1" }}>
                          Optional: What would success look like in the first 90 days?
                        </div>
                        <div style={{ fontSize: 12, color: "#94a3b8" }}>
                          Add this only if you want Cognalyze to consider a specific outcome during evaluation.
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => setShow90DaySection(true)}
                          style={{
                            padding: "6px 14px",
                            borderRadius: 6,
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.12)",
                            color: "#c084fc",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          + Add 90-Day Outcome
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ background: "rgba(0,0,0,0.25)", padding: 18, borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <label style={{ fontSize: 13, fontWeight: 700, color: "white" }}>
                          Recruiter-provided 90-day success outcome
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setSuccess90Days("");
                            setShow90DaySection(false);
                          }}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#94a3b8",
                            fontSize: 11,
                            cursor: "pointer",
                          }}
                        >
                          Skip / Remove
                        </button>
                      </div>
                      <textarea
                        rows={3}
                        value={success90Days}
                        onChange={(e) => setSuccess90Days(e.target.value)}
                        placeholder="e.g. Successfully deploy the distributed settlement pipeline with zero data loss under peak load."
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: 8,
                          background: "rgba(0,0,0,0.3)",
                          border: "1px solid rgba(255,255,255,0.15)",
                          color: "white",
                          fontSize: 12,
                          lineHeight: 1.5,
                          outline: "none",
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* REVIEW STEP ACTION BUTTONS */}
                <div
                  style={{
                    marginTop: 32,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 12,
                    paddingTop: 20,
                    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setCurrentStep("details")}
                    style={{
                      padding: "10px 20px",
                      borderRadius: 8,
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "#94a3b8",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    ← Edit Details
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStep("confirmation")}
                    style={{
                      padding: "11px 26px",
                      borderRadius: 8,
                      background: "linear-gradient(135deg, #a855f7, #6366f1)",
                      color: "white",
                      fontSize: 13,
                      fontWeight: 800,
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 4px 15px rgba(168,85,247,0.3)",
                    }}
                  >
                    Proceed to Confirmation →
                  </button>
                </div>
              </div>
            )}

            {/* ────────────────────────────────────────────────────────────
                STEP 3: FINAL CONFIRMATION & ROLE CREATION
            ──────────────────────────────────────────────────────────── */}
            {currentStep === "confirmation" && (
              <div
                style={{
                  background: "rgba(15, 23, 42, 0.45)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: 16,
                  padding: 32,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: "rgba(16, 185, 129, 0.15)",
                    color: "#34d399",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 28,
                    margin: "0 auto 16px",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                  }}
                >
                  ✓
                </div>

                <h2 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 8px", color: "white" }}>
                  Your role is ready
                </h2>
                <p style={{ fontSize: 14, color: "#94a3b8", maxWidth: 540, margin: "0 auto 28px", lineHeight: 1.5 }}>
                  All requirements are traceable to your job description or clearly marked as recruiter-provided.
                </p>

                {/* ROLE SUMMARY CARD */}
                <div
                  style={{
                    maxWidth: 600,
                    margin: "0 auto 32px",
                    background: "rgba(0,0,0,0.35)",
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.1)",
                    padding: "20px 24px",
                    textAlign: "left",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: "white" }}>{title}</div>
                      <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                        {department || "Engineering"} • {workMode} {location ? `(${location})` : ""}
                      </div>
                    </div>
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: 6,
                        background: "rgba(168,85,247,0.2)",
                        color: "#d8b4fe",
                        fontSize: 11,
                        fontWeight: 800,
                      }}
                    >
                      {targetHires} Opening{targetHires > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
                      gap: 10,
                      paddingTop: 14,
                      borderTop: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700 }}>MUST-HAVES</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "#f87171" }}>{mustHaveList.length}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700 }}>PREFERRED</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "#60a5fa" }}>{preferredList.length}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700 }}>ELIGIBILITY</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "#34d399" }}>{eligibilityList.length}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700 }}>SIGNALS</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "#c084fc" }}>{evidenceSignalList.length}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700 }}>RESPONSIBILITIES</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "#fbbf24" }}>{responsibilityList.length}</div>
                    </div>
                    {otherList.length > 0 && (
                      <div>
                        <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700 }}>CONSTRAINTS</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#cbd5e1" }}>{otherList.length}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* PRIMARY ACTIONS */}
                <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => setCurrentStep("review")}
                    style={{
                      padding: "12px 24px",
                      borderRadius: 10,
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "#cbd5e1",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Edit Requirements
                  </button>

                  <button
                    type="button"
                    onClick={handleCreateRole}
                    disabled={saving}
                    style={{
                      padding: "12px 32px",
                      borderRadius: 10,
                      background: "linear-gradient(135deg, #10b981, #059669)",
                      color: "white",
                      fontSize: 14,
                      fontWeight: 800,
                      border: "none",
                      cursor: saving ? "not-allowed" : "pointer",
                      boxShadow: "0 4px 20px rgba(16,185,129,0.35)",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span>🚀</span>
                    <span>{saving ? "Creating Role..." : "Create Role & Start Screening"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            ACTIVE ROLES LIST (WHEN NOT CREATING OR AS ARCHIVE)
        ════════════════════════════════════════════════════════════════ */}
        {!isCreating && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20 }}>
              {roles.map((role) => {
                const isSelected = selectedRole?.id === role.id;
                const reqCount = role.structuredRequirements?.length || role.tieredRequirements?.length || 0;

                return (
                  <div
                    key={role.id}
                    onClick={() => setSelectedRole(role)}
                    style={{
                      background: isSelected ? "rgba(168,85,247,0.1)" : "rgba(15, 23, 42, 0.45)",
                      border: isSelected ? "1px solid rgba(168,85,247,0.4)" : "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 14,
                      padding: 22,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <span
                        style={{
                          fontSize: 10,
                          padding: "2px 6px",
                          borderRadius: 4,
                          background: "rgba(255,255,255,0.06)",
                          color: "#94a3b8",
                          fontWeight: 700,
                        }}
                      >
                        {role.department}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 4,
                          background: "rgba(16,185,129,0.15)",
                          color: "#34d399",
                          fontWeight: 800,
                        }}
                      >
                        {role.targetHires} Opening{role.targetHires > 1 ? "s" : ""}
                      </span>
                    </div>

                    <h3 style={{ fontSize: 17, fontWeight: 900, color: "white", margin: "0 0 6px" }}>
                      {role.title}
                    </h3>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 16 }}>
                      {reqCount} Verified Requirements • Created {new Date(role.createdAt).toLocaleDateString()}
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <Link
                        href={`/recruiter/candidates?roleId=${role.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (typeof window !== "undefined") {
                            localStorage.setItem("cognalyze_active_role_id", role.id);
                          }
                        }}
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          borderRadius: 8,
                          background: "linear-gradient(135deg, #10b981, #059669)",
                          color: "white",
                          textDecoration: "none",
                          fontSize: 12,
                          fontWeight: 800,
                          textAlign: "center",
                        }}
                      >
                        Screen Candidates ➔
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SELECTED ROLE DETAILS INSPECTION */}
            {selectedRole && (
              <div
                style={{
                  marginTop: 32,
                  background: "rgba(15, 23, 42, 0.45)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16,
                  padding: 28,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 900, color: "white", margin: 0 }}>
                      Requirements for {selectedRole.title}
                    </h2>
                    <p style={{ fontSize: 13, color: "#94a3b8", margin: "4px 0 0" }}>
                      Verified day-one capabilities and growth tracks used for candidate screening.
                    </p>
                  </div>
                  <Link
                    href={`/recruiter/candidates?roleId=${selectedRole.id}`}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 8,
                      background: "rgba(99,102,241,0.2)",
                      border: "1px solid rgba(99,102,241,0.4)",
                      color: "#a5b4fc",
                      textDecoration: "none",
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    View Matched Candidates ➔
                  </Link>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {selectedRole.structuredRequirements && selectedRole.structuredRequirements.length > 0 ? (
                    selectedRole.structuredRequirements.map((r) => renderRequirementCard(r, false))
                  ) : (
                    selectedRole.tieredRequirements.map((r) => (
                      <div
                        key={r.id}
                        style={{
                          padding: "12px 16px",
                          borderRadius: 10,
                          background: "rgba(0,0,0,0.25)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "white" }}>{r.name}</div>
                          <div style={{ fontSize: 12, color: "#94a3b8" }}>{r.description}</div>
                        </div>
                        <span
                          style={{
                            fontSize: 11,
                            padding: "2px 8px",
                            borderRadius: 4,
                            background: r.tier === "Critical" ? "rgba(239,68,68,0.2)" : "rgba(59,130,246,0.2)",
                            color: r.tier === "Critical" ? "#f87171" : "#60a5fa",
                            fontWeight: 700,
                          }}
                        >
                          {r.tier}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            MODAL: ADD CUSTOM REQUIREMENT (RECRUITER-ADDED)
        ════════════════════════════════════════════════════════════════ */}
        {showAddModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 100,
              background: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(6px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 480,
                background: "#0b0f19",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 16,
                padding: 24,
                boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "white", margin: 0 }}>
                  Add Requirement Manually
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ background: "transparent", border: "none", color: "#94a3b8", fontSize: 18, cursor: "pointer" }}
                >
                  ✕
                </button>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#cbd5e1", marginBottom: 6 }}>
                  Requirement Name
                </label>
                <input
                  type="text"
                  value={customReqName}
                  onChange={(e) => setCustomReqName(e.target.value)}
                  placeholder="e.g. Distributed Tracing with OpenTelemetry"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "white",
                    fontSize: 13,
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#cbd5e1", marginBottom: 6 }}>
                  Category
                </label>
                <select
                  value={customReqCategory}
                  onChange={(e) => setCustomReqCategory(e.target.value as RoleCategory)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    background: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "white",
                    fontSize: 13,
                    outline: "none",
                  }}
                >
                  <option value="required">Required (Must-have day 1)</option>
                  <option value="preferred">Preferred (Plus / Growth)</option>
                  <option value="experience">Experience (Years / Tenure)</option>
                  <option value="education">Education & Eligibility</option>
                  <option value="other">Other Constraint</option>
                </select>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#cbd5e1", marginBottom: 6 }}>
                  Requirement Type
                </label>
                <select
                  value={customReqType}
                  onChange={(e) => setCustomReqType(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    background: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "white",
                    fontSize: 13,
                    outline: "none",
                  }}
                >
                  <option value="programming_language">Programming Language</option>
                  <option value="framework">Framework</option>
                  <option value="tool">Developer Tool / Infrastructure</option>
                  <option value="domain_knowledge">Domain Knowledge / Concept</option>
                  <option value="education">Education / Degree</option>
                  <option value="experience">Experience / Tenure</option>
                  <option value="behavioral">Behavioral / Soft Skill</option>
                  <option value="operational_task">Operational Task</option>
                </select>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#cbd5e1", marginBottom: 6 }}>
                  Evidence Expectation (Proof Requirement)
                </label>
                <select
                  value={customReqExpectation}
                  onChange={(e) => setCustomReqExpectation(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    background: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "white",
                    fontSize: 13,
                    outline: "none",
                  }}
                >
                  <option value="implementation">Implementation (Code, PRs, Commits)</option>
                  <option value="portfolio">Portfolio (Projects, Live Demos)</option>
                  <option value="certification">Certification (Credentials, Transcripts)</option>
                  <option value="interview">Interview (Deep-Dive Discussion)</option>
                  <option value="assessment">Assessment (Technical Challenge)</option>
                </select>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#cbd5e1", marginBottom: 6 }}>
                  Evidence Signals (Comma-separated)
                </label>
                <input
                  type="text"
                  value={customReqSignals}
                  onChange={(e) => setCustomReqSignals(e.target.value)}
                  placeholder="e.g. GitHub, Deployed Project, Technical Assessment"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "white",
                    fontSize: 13,
                    outline: "none",
                  }}
                />
              </div>

              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "rgba(168,85,247,0.1)",
                  border: "1px solid rgba(168,85,247,0.25)",
                  fontSize: 11,
                  color: "#d8b4fe",
                  marginBottom: 20,
                  lineHeight: 1.4,
                }}
              >
                ℹ️ This requirement will be explicitly marked as <strong>&ldquo;Recruiter-added requirement&rdquo;</strong> for complete auditability.
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "#94a3b8",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddCustomRequirement}
                  style={{
                    padding: "8px 18px",
                    borderRadius: 8,
                    background: "linear-gradient(135deg, #a855f7, #6366f1)",
                    color: "white",
                    fontSize: 12,
                    fontWeight: 800,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Add Requirement
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );

  // ────────────────────────────────────────────────────────────
  // HELPER: RENDER A SINGLE REQUIREMENT CARD
  // ────────────────────────────────────────────────────────────
  function renderRequirementCard(req: StructuredRoleRequirement, editable = true) {
    const isExpanded = expandedEvidenceId === req.id;
    const isEditing = editingId === req.id;
    const isRecruiterAdded = req.source === "recruiter_added";
    const displayName = req.canonicalName || req.name;

    // Determine category style & label
    let catBadgeColor = "rgba(239,68,68,0.2)";
    let catTextColor = "#f87171";
    let catLabel = "Must-Have";

    if (req.semanticCategory === "RESPONSIBILITY" || req.category === "responsibility") {
      catBadgeColor = "rgba(245,158,11,0.18)";
      catTextColor = "#fbbf24";
      catLabel = "On-The-Job Task";
    } else if (req.semanticCategory === "PREFERRED" || req.category === "preferred") {
      catBadgeColor = "rgba(59,130,246,0.2)";
      catTextColor = "#60a5fa";
      catLabel = "Preferred";
    } else if (req.semanticCategory === "ELIGIBILITY" || req.category === "education") {
      catBadgeColor = "rgba(16,185,129,0.2)";
      catTextColor = "#34d399";
      catLabel = "Eligibility";
    } else if (req.semanticCategory === "EVIDENCE_SIGNAL") {
      catBadgeColor = "rgba(168,85,247,0.2)";
      catTextColor = "#d8b4fe";
      catLabel = "Evidence Signal";
    } else if (req.semanticCategory === "UNKNOWN" || req.needsConfirmation) {
      catBadgeColor = "rgba(245,158,11,0.25)";
      catTextColor = "#fef08a";
      catLabel = "Needs Confirmation";
    } else if (req.category === "other" || req.semanticCategory === "CONSTRAINT") {
      catBadgeColor = "rgba(148,163,184,0.2)";
      catTextColor = "#cbd5e1";
      catLabel = "Constraint";
    }

    return (
      <div
        key={req.id}
        style={{
          padding: "14px 18px",
          borderRadius: 12,
          background: "rgba(0,0,0,0.3)",
          border: req.needsConfirmation
            ? "1px solid rgba(245,158,11,0.4)"
            : "1px solid rgba(255,255,255,0.06)",
          transition: "all 0.15s ease",
        }}
      >
        {isEditing ? (
          /* Inline Edit Form */
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              style={{
                flex: 2,
                minWidth: 200,
                padding: "8px 12px",
                borderRadius: 6,
                background: "rgba(0,0,0,0.4)",
                border: "1px solid rgba(168,85,247,0.4)",
                color: "white",
                fontSize: 13,
                outline: "none",
              }}
            />
            <select
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value as RoleCategory)}
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                background: "#0f172a",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "white",
                fontSize: 12,
              }}
            >
              <option value="required">Must-Have (Required)</option>
              <option value="preferred">Preferred</option>
              <option value="education">Eligibility</option>
              <option value="responsibility">Responsibility (Task)</option>
              <option value="experience">Experience</option>
              <option value="other">Constraint</option>
            </select>
            <select
              value={editType}
              onChange={(e) => setEditType(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                background: "#0f172a",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "white",
                fontSize: 12,
              }}
            >
              <option value="programming_language">Programming Language</option>
              <option value="framework">Framework</option>
              <option value="tool">Developer Tool / Infrastructure</option>
              <option value="domain_knowledge">Domain Knowledge / Concept</option>
              <option value="education">Education / Degree</option>
              <option value="experience">Experience / Tenure</option>
              <option value="behavioral">Behavioral / Soft Skill</option>
              <option value="operational_task">Operational Task</option>
            </select>
            <button
              type="button"
              onClick={() => handleSaveEdit(req.id)}
              style={{
                padding: "8px 14px",
                borderRadius: 6,
                background: "#10b981",
                color: "white",
                border: "none",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditingId(null)}
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#94a3b8",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          /* Standard Display View */
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
              <div style={{ flex: 1, minWidth: 260 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                  <span style={{ fontSize: 15, fontWeight: 900, color: "white", letterSpacing: "-0.2px" }}>
                    {displayName}
                  </span>

                  {/* Category Pill */}
                  <span
                    style={{
                      fontSize: 10,
                      padding: "2px 8px",
                      borderRadius: 4,
                      background: catBadgeColor,
                      color: catTextColor,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    {catLabel}
                  </span>

                  {/* Requirement Type Badge */}
                  {req.requirementType && (
                    <span
                      style={{
                        fontSize: 10,
                        padding: "2px 7px",
                        borderRadius: 4,
                        background: "rgba(99, 102, 241, 0.18)",
                        color: "#a5b4fc",
                        fontWeight: 700,
                        textTransform: "capitalize",
                      }}
                    >
                      {req.requirementType.replace(/_/g, " ")}
                    </span>
                  )}

                  {/* Evidence Expectation Badge */}
                  {req.evidenceExpectation && (
                    <span
                      style={{
                        fontSize: 10,
                        padding: "2px 7px",
                        borderRadius: 4,
                        background: "rgba(16, 185, 129, 0.15)",
                        color: "#6ee7b7",
                        fontWeight: 700,
                      }}
                    >
                      Proof: {req.evidenceExpectation}
                    </span>
                  )}

                  {/* Confidence Badge */}
                  {req.confidence && (
                    <span
                      style={{
                        fontSize: 10,
                        padding: "2px 7px",
                        borderRadius: 4,
                        background: "rgba(255, 255, 255, 0.06)",
                        color: "#94a3b8",
                        fontWeight: 700,
                      }}
                    >
                      {Math.round(req.confidence * 100)}% Match
                    </span>
                  )}

                  {/* Acceptable Options Badge */}
                  {req.acceptableOptions && req.acceptableOptions.length > 0 && (
                    <span
                      style={{
                        fontSize: 10,
                        padding: "2px 7px",
                        borderRadius: 4,
                        background: "rgba(234, 179, 8, 0.15)",
                        color: "#fde047",
                        fontWeight: 700,
                      }}
                    >
                      Either: {req.acceptableOptions.join(" or ")}
                    </span>
                  )}

                  {/* Minimum Experience Years Badge */}
                  {req.minimumExperienceYears && (
                    <span
                      style={{
                        fontSize: 10,
                        padding: "2px 7px",
                        borderRadius: 4,
                        background: "rgba(59, 130, 246, 0.15)",
                        color: "#93c5fd",
                        fontWeight: 700,
                      }}
                    >
                      {req.minimumExperienceYears}+ yrs exp
                    </span>
                  )}

                  {/* Source Badge */}
                  <span
                    style={{
                      fontSize: 10,
                      padding: "2px 6px",
                      borderRadius: 4,
                      background: isRecruiterAdded ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.06)",
                      color: isRecruiterAdded ? "#d8b4fe" : "#94a3b8",
                      fontWeight: 700,
                    }}
                  >
                    {isRecruiterAdded ? "Recruiter added" : "Extracted from JD"}
                  </span>

                  {/* Ambiguity Flag */}
                  {req.needsConfirmation && (
                    <span
                      style={{
                        fontSize: 10,
                        padding: "2px 8px",
                        borderRadius: 4,
                        background: "rgba(245,158,11,0.2)",
                        color: "#fbbf24",
                        fontWeight: 800,
                      }}
                    >
                      ⚠️ Needs confirmation
                    </span>
                  )}
                </div>

                {/* Verbatim JD Evidence Quote Callout */}
                {req.evidenceQuote && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "rgba(255, 255, 255, 0.75)",
                      fontStyle: "italic",
                      background: "rgba(255, 255, 255, 0.03)",
                      borderLeft: "2px solid rgba(168, 85, 247, 0.5)",
                      padding: "4px 10px",
                      borderRadius: "0 6px 6px 0",
                      marginTop: 4,
                      marginBottom: 6,
                      lineHeight: 1.4,
                    }}
                  >
                    &ldquo;{req.evidenceQuote}&rdquo;
                  </div>
                )}

                {/* Inline Evidence Signals Chips */}
                {req.evidenceSignals && req.evidenceSignals.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 4, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Signals:</span>
                    {req.evidenceSignals.map((sig, sIdx) => (
                      <span
                        key={sIdx}
                        style={{
                          fontSize: 10,
                          padding: "1px 6px",
                          borderRadius: 4,
                          background: "rgba(255,255,255,0.05)",
                          color: "#cbd5e1",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        {sig}
                      </span>
                    ))}
                  </div>
                )}

                {/* Ambiguity Warning Details */}
                {req.needsConfirmation && req.ambiguityReason && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "#fef3c7",
                      background: "rgba(245,158,11,0.08)",
                      border: "1px solid rgba(245,158,11,0.25)",
                      padding: "8px 12px",
                      borderRadius: 8,
                      marginTop: 6,
                      marginBottom: 8,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 800, color: "#fbbf24" }}>Ambiguity Detected: </span>
                      <span>{req.ambiguityReason}</span>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => handleKeepAsWritten(req.id)}
                        style={{
                          padding: "3px 10px",
                          borderRadius: 4,
                          background: "rgba(255,255,255,0.1)",
                          color: "white",
                          border: "none",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Keep as written
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartEdit(req)}
                        style={{
                          padding: "3px 10px",
                          borderRadius: 4,
                          background: "rgba(168,85,247,0.25)",
                          color: "#e9d5ff",
                          border: "none",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRequirement(req.id)}
                        style={{
                          padding: "3px 10px",
                          borderRadius: 4,
                          background: "rgba(239,68,68,0.2)",
                          color: "#fca5a5",
                          border: "none",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}

                {/* Expandable "Why this was identified & verification strategy" toggle */}
                <div style={{ marginTop: 6 }}>
                  <button
                    type="button"
                    onClick={() => setExpandedEvidenceId(isExpanded ? null : req.id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: isExpanded ? "#c084fc" : "#818cf8",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      padding: 0,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <span>{isExpanded ? "▾ Hide Evidence Strategy & Rationale" : "▸ Why this was identified & Evidence Strategy"}</span>
                  </button>

                  {/* RICH EXPANDED DRAWER */}
                  {isExpanded && (
                    <div
                      style={{
                        marginTop: 10,
                        padding: "14px 16px",
                        borderRadius: 10,
                        background: "rgba(15, 23, 42, 0.6)",
                        border: "1px solid rgba(168,85,247,0.25)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                        fontSize: 12,
                      }}
                    >
                      {/* 1. WHY IDENTIFIED */}
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: "#d8b4fe", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>
                          Why This Was Identified:
                        </div>
                        <div style={{ color: "#f1f5f9", lineHeight: 1.5 }}>
                          {req.rationale || "Identified directly from job description qualifications."}
                        </div>
                      </div>

                      {/* 2. EVIDENCE EXPECTED */}
                      {req.evidenceSignals && req.evidenceSignals.length > 0 && (
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 800, color: "#93c5fd", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>
                            Evidence Cognalyze Looks For:
                          </div>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
                            {req.evidenceSignals.map((sig, sIdx) => (
                              <span
                                key={sIdx}
                                style={{
                                  fontSize: 11,
                                  padding: "2px 8px",
                                  borderRadius: 4,
                                  background: "rgba(59,130,246,0.15)",
                                  color: "#93c5fd",
                                  border: "1px solid rgba(59,130,246,0.25)",
                                }}
                              >
                                {sig}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 3. VERIFICATION STRATEGY (IMPLEMENTATION > CLAIM) */}
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: "#86efac", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>
                          Verification Rule (Tier 1 Implementation &gt; Tier 3 Claim):
                        </div>
                        <div style={{ color: "#cbd5e1", lineHeight: 1.5 }}>
                          {req.verificationStrategy && req.verificationStrategy.length > 0
                            ? req.verificationStrategy.join(" • ")
                            : "Implementation > Claim. Require genuine technical demonstration rather than resume keyword mentions."}
                        </div>
                      </div>

                      {/* 4. PROVENANCE IN JD */}
                      {req.evidenceQuote && (
                        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 8 }}>
                          <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>
                            Source Section &amp; Verbatim Text:
                          </div>
                          <div style={{ color: "#94a3b8", fontStyle: "italic", fontSize: 11, lineHeight: 1.4 }}>
                            &ldquo;{req.evidenceQuote}&rdquo;
                          </div>
                        </div>
                      )}

                      {/* 5. INFERRED CAPABILITIES (IF ANY) */}
                      {req.relatedCapabilities && req.relatedCapabilities.length > 0 && (
                        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 8 }}>
                          <div style={{ fontSize: 10, color: "#fef08a", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>
                            Inferred Potential Capabilities (Non-Mandatory):
                          </div>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
                            {req.relatedCapabilities.map((cap, cIdx) => (
                              <span
                                key={cIdx}
                                style={{
                                  fontSize: 11,
                                  padding: "2px 8px",
                                  borderRadius: 4,
                                  background: "rgba(245,158,11,0.15)",
                                  color: "#fef08a",
                                }}
                              >
                                {cap.name} ({Math.round(cap.confidence * 100)}% confidence)
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons: Edit & Delete */}
              {editable && (
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    title="Edit requirement"
                    onClick={() => handleStartEdit(req)}
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#cbd5e1",
                      borderRadius: 6,
                      padding: "4px 8px",
                      fontSize: 11,
                      cursor: "pointer",
                    }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    type="button"
                    title="Delete requirement"
                    onClick={() => handleDeleteRequirement(req.id)}
                    style={{
                      background: "rgba(239,68,68,0.1)",
                      border: "1px solid rgba(239,68,68,0.25)",
                      color: "#fca5a5",
                      borderRadius: 6,
                      padding: "4px 8px",
                      fontSize: 11,
                      cursor: "pointer",
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
}
