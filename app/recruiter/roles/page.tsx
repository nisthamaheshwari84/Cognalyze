"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppNav from "@/components/AppNav";
import { RoleDNA, StructuredRoleRequirement } from "@/lib/ai/role-dna";
import { RoleExtractionConflict, RoleExtractionResult, RoleCategory } from "@/lib/roles/role-extractor";
import { RoleDNAStructure } from "@/lib/roles/types";
import AdaptiveRoleClarificationCard from "@/components/roles/AdaptiveRoleClarificationCard";
import ResponsibilityGraphViewer from "@/components/roles/ResponsibilityGraphViewer";
import WorkforceIntelligencePanel from "@/components/roles/WorkforceIntelligencePanel";
import RoleApprovalAndVersionVault from "@/components/roles/RoleApprovalAndVersionVault";

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

  // Adaptive Recruiter Clarifications State
  const [recruiterAnswers, setRecruiterAnswers] = useState<Record<string, string>>({});

  // Active Role View Tabs in Selected Role Inspection
  const [activeRoleTab, setActiveRoleTab] = useState<"requirements" | "graph" | "market_signals" | "versions">("requirements");

  // Version Vault & Approval State
  const [roleVersions, setRoleVersions] = useState<any[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  // Workforce Intelligence Signals for Selected Role
  const [marketSignals, setMarketSignals] = useState<any[]>([]);
  const [evolutionProposals, setEvolutionProposals] = useState<any[]>([]);
  const [loadingWorkforce, setLoadingWorkforce] = useState(false);

  // Fetch version history & workforce signals when selectedRole changes
  useEffect(() => {
    if (!selectedRole?.id) return;

    setLoadingVersions(true);
    fetch(`/api/recruiter/roles?roleId=${selectedRole.id}&versions=true`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.versions) {
          setRoleVersions(data.versions);
        }
      })
      .catch((err) => console.error("Error fetching versions:", err))
      .finally(() => setLoadingVersions(false));

    setLoadingWorkforce(true);
    fetch(`/api/workforce/signals?roleId=${selectedRole.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMarketSignals(data.matchingSignals || []);
          setEvolutionProposals(data.proposals || []);
        }
      })
      .catch((err) => console.error("Error fetching workforce signals:", err))
      .finally(() => setLoadingWorkforce(false));
  }, [selectedRole?.id]);

  const handleApproveRole = async (notes: string) => {
    if (!selectedRole?.id) return;
    try {
      const res = await fetch("/api/recruiter/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          roleId: selectedRole.id,
          approvalStatus: "approved",
          approvalNotes: notes || "Verified candidate requirements signed off for active candidate screening.",
          changeSummary: "Role approved and signed off by lead recruiter."
        }),
      });
      const data = await res.json();
      if (data.success && data.role) {
        setSelectedRole(data.role);
        setRoles((prev) => prev.map((r) => (r.id === data.role.id ? data.role : r)));
        setSavedSuccessMessage(`Role "${data.role.title}" officially approved & signed off!`);
        if (data.version) {
          setRoleVersions((prev) => [data.version, ...prev]);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to approve role.");
    }
  };

  const handleReviewProposal = async (proposalId: string, decision: "approved" | "rejected") => {
    try {
      const res = await fetch("/api/workforce/signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "review_proposal",
          proposalId,
          decision,
        }),
      });
      const data = await res.json();
      if (data.success && data.proposal) {
        setEvolutionProposals((prev) =>
          prev.map((p) => (p.id === proposalId ? data.proposal : p))
        );
        if (decision === "approved" && data.proposal.suggestedCapability && selectedRole) {
          const cap = data.proposal.suggestedCapability;
          const newReq: StructuredRoleRequirement = {
            id: `req-market-${Date.now().toString().slice(-4)}`,
            name: cap.name,
            canonicalName: cap.name,
            category: cap.tier === "Critical" ? "required" : "preferred",
            semanticCategory: cap.tier === "Critical" ? "MUST_HAVE" : "PREFERRED",
            evidenceQuote: `Adopted from Global Workforce Intelligence signal (${data.proposal.marketRationale})`,
            source: "recruiter_added",
            needsConfirmation: false,
            importance: cap.tier === "Critical" ? "mandatory" : "preferred",
            verificationStrategy: ["Implementation > Claim", `Evaluate via ${cap.verificationMethod}`],
            evidenceSignals: ["Production repos", "Work sample", "Technical interview"],
            rationale: data.proposal.marketRationale
          };
          const updatedStructured = [...(selectedRole.structuredRequirements || []), newReq];
          const updateRes = await fetch("/api/recruiter/roles", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...selectedRole,
              structuredRequirements: updatedStructured,
              version: (selectedRole.version || 1) + 1,
              changeSummary: `Adopted workforce proposal: ${data.proposal.proposedChange}`
            })
          });
          const updateData = await updateRes.json();
          if (updateData.success && updateData.role) {
            setSelectedRole(updateData.role);
            setRoles((prev) => prev.map((r) => (r.id === updateData.role.id ? updateData.role : r)));
            setSavedSuccessMessage(`Capability "${cap.name}" added to role!`);
          }
        }
      }
    } catch (err: any) {
      console.error("Failed to review proposal:", err);
    }
  };

  const handleGenerateProposals = async () => {
    if (!selectedRole?.id) return;
    try {
      const res = await fetch("/api/workforce/signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_proposals",
          roleId: selectedRole.id,
        }),
      });
      const data = await res.json();
      if (data.success && data.proposals) {
        setEvolutionProposals(data.proposals);
      }
    } catch (err) {
      console.error("Failed to refresh proposals:", err);
    }
  };

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
      const updatedRoleDna = roleDna ? {
        ...roleDna,
        adaptiveQuestions: roleDna.adaptiveQuestions?.map(q => ({
          ...q,
          recruiterAnswer: recruiterAnswers[q.id] || ""
        }))
      } : undefined;

      const payload = {
        title: title.trim(),
        department: department.trim() || "Engineering",
        targetHires: targetHires || 1,
        workMode,
        location: location.trim() || undefined,
        structuredRequirements: requirements,
        roleDna: updatedRoleDna,
        responsibilityGraph: roleDna?.responsibilityGraph,
        adaptiveQuestions: updatedRoleDna?.adaptiveQuestions,
        jdRaw: rawJdText || jdText,
        success90Days: success90Days.trim() || recruiterAnswers["q_business_outcome"] || undefined,
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
        backgroundColor: "var(--bg-canvas)",
        color: "var(--text-primary)",
      }}
    >
      <AppNav role="recruiter" />

      <main style={{ maxWidth: 1240, margin: "0 auto", padding: "32px 32px 96px" }}>
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
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  fontSize: 11,
                  padding: "2px 8px",
                  borderRadius: 5,
                  background: "var(--color-info-bg)",
                  color: "var(--brand-cobalt)",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                ROLE ARCHITECT
              </span>
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Evidence-Grounded DNA</span>
            </div>
            <h1
              style={{
                fontSize: 26,
                fontWeight: 600,
                color: "var(--brand-navy)",
                margin: 0,
                letterSpacing: "-0.3px",
              }}
            >
              {isCreating ? "Create a New Role" : "Active Roles & Role DNA"}
            </h1>
            <p
              style={{
                fontSize: 13,
                color: "var(--text-secondary)",
                margin: "6px 0 0",
                maxWidth: 640,
                lineHeight: 1.5,
              }}
            >
              {isCreating
                ? "Structure the job description into explicit MUST HAVE, GOOD TO HAVE, and ROLE SIGNALS requirements."
                : "Inspect verified Role DNA models and calibrated screening criteria across your hiring pipelines."}
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
                  padding: "8px 16px",
                  borderRadius: 7,
                  background: isCreating ? "#FFFFFF" : "var(--brand-cobalt)",
                  border: isCreating ? "1px solid var(--border-subtle)" : "none",
                  color: isCreating ? "#162A43" : "var(--surface)",
                  fontSize: 13,
                  fontWeight: 600,
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
              borderRadius: 8,
              background: "var(--color-error-bg)",
              border: "1px solid #F8D7D7",
              color: "var(--color-error)",
              fontSize: 13,
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontWeight: 500,
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
              borderRadius: 8,
              background: "var(--color-success-bg)",
              border: "1px solid #C8E4D3",
              color: "var(--color-success)",
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
                gap: 16,
                marginBottom: 24,
                padding: "14px 22px",
                background: "var(--surface)",
                borderRadius: 10,
                border: "1px solid var(--border-subtle)",
                boxShadow: "var(--shadow-subtle)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  color: currentStep === "details" ? "var(--brand-cobalt)" : "#2E7D5B",
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: currentStep === "details" ? "var(--brand-cobalt)" : "#2E7D5B",
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
                <span>1. Role &amp; Job Description</span>
              </div>
              <span style={{ color: "var(--border-strong)" }}>➔</span>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  color: currentStep === "review" ? "var(--brand-cobalt)" : currentStep === "confirmation" ? "#2E7D5B" : "var(--text-secondary)",
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: currentStep === "review" ? "var(--brand-cobalt)" : currentStep === "confirmation" ? "#2E7D5B" : "var(--surface-subtle)",
                    color: currentStep === "review" || currentStep === "confirmation" ? "white" : "var(--text-secondary)",
                    border: currentStep === "review" || currentStep === "confirmation" ? "none" : "1px solid var(--border-subtle)",
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
              <span style={{ color: "var(--border-strong)" }}>➔</span>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  color: currentStep === "confirmation" ? "var(--brand-cobalt)" : "var(--text-secondary)",
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: currentStep === "confirmation" ? "var(--brand-cobalt)" : "var(--surface-subtle)",
                    color: currentStep === "confirmation" ? "white" : "var(--text-secondary)",
                    border: currentStep === "confirmation" ? "none" : "1px solid var(--border-subtle)",
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
                  background: "var(--surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 10,
                  padding: "24px 28px",
                  boxShadow: "var(--shadow-subtle)",
                }}
              >
                {/* SECTION 1: ROLE DETAILS */}
                <div style={{ marginBottom: 24 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 4px", color: "var(--brand-navy)" }}>
                    Role Details
                  </h2>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
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
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
                        Job Title <span style={{ color: "var(--color-error)" }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Senior Backend Engineer"
                        style={{
                          width: "100%",
                          padding: "9px 12px",
                          borderRadius: 7,
                          background: "var(--surface)",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-primary)",
                          fontSize: 13,
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>

                    {/* Department */}
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
                        Department / Team <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="e.g. Engineering / Core Systems"
                        style={{
                          width: "100%",
                          padding: "9px 12px",
                          borderRadius: 7,
                          background: "var(--surface)",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-primary)",
                          fontSize: 13,
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>

                    {/* Number of Openings */}
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
                        Number of Openings <span style={{ color: "var(--color-error)" }}>*</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={targetHires}
                        onChange={(e) => setTargetHires(parseInt(e.target.value, 10) || 1)}
                        style={{
                          width: "100%",
                          padding: "9px 12px",
                          borderRadius: 7,
                          background: "var(--surface)",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-primary)",
                          fontSize: 13,
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>

                    {/* Work Mode */}
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
                        Work Mode <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>(Optional)</span>
                      </label>
                      <div style={{ display: "flex", gap: 4, background: "var(--surface-subtle)", padding: 3, borderRadius: 7, border: "1px solid var(--border-subtle)" }}>
                        {(["Remote", "Hybrid", "On-site"] as const).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setWorkMode(mode)}
                            style={{
                              flex: 1,
                              padding: "6px 10px",
                              borderRadius: 5,
                              background: workMode === mode ? "var(--surface)" : "transparent",
                              border: workMode === mode ? "1px solid var(--border-subtle)" : "1px solid transparent",
                              color: workMode === mode ? "var(--brand-cobalt)" : "var(--text-secondary)",
                              boxShadow: workMode === mode ? "0 1px 2px rgba(16, 24, 40, 0.05)" : "none",
                              fontSize: 12,
                              fontWeight: workMode === mode ? 700 : 500,
                              cursor: "pointer",
                              transition: "all 0.15s ease",
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
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
                          Location <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="e.g. Bengaluru, India"
                          style={{
                            width: "100%",
                            padding: "9px 12px",
                            borderRadius: 7,
                            background: "var(--surface)",
                            border: "1px solid var(--border-subtle)",
                            color: "var(--text-primary)",
                            fontSize: 13,
                            outline: "none",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* SECTION 2: JOB DESCRIPTION (PRIMARY INPUT) */}
                <div style={{ paddingTop: 20, borderTop: "1px solid var(--border-subtle)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
                    <div>
                      <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 4px", color: "var(--brand-navy)" }}>
                        Job Description
                      </h2>
                      <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
                        Paste the job description or upload it. Cognalyze will identify the requirements automatically.
                      </p>
                    </div>

                    {/* Toggle: Paste vs Upload */}
                    <div style={{ display: "flex", gap: 4, background: "var(--surface-subtle)", padding: 3, borderRadius: 7, border: "1px solid var(--border-subtle)" }}>
                      <button
                        type="button"
                        onClick={() => setJdInputMode("paste")}
                        style={{
                          padding: "5px 12px",
                          borderRadius: 5,
                          background: jdInputMode === "paste" ? "var(--surface)" : "transparent",
                          color: jdInputMode === "paste" ? "var(--brand-cobalt)" : "var(--text-secondary)",
                          border: jdInputMode === "paste" ? "1px solid var(--border-subtle)" : "1px solid transparent",
                          boxShadow: jdInputMode === "paste" ? "0 1px 2px rgba(16, 24, 40, 0.05)" : "none",
                          fontSize: 12,
                          fontWeight: jdInputMode === "paste" ? 700 : 500,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        ✏️ Paste Text
                      </button>
                      <button
                        type="button"
                        onClick={() => setJdInputMode("upload")}
                        style={{
                          padding: "5px 12px",
                          borderRadius: 5,
                          background: jdInputMode === "upload" ? "var(--surface)" : "transparent",
                          color: jdInputMode === "upload" ? "var(--brand-cobalt)" : "var(--text-secondary)",
                          border: jdInputMode === "upload" ? "1px solid var(--border-subtle)" : "1px solid transparent",
                          boxShadow: jdInputMode === "upload" ? "0 1px 2px rgba(16, 24, 40, 0.05)" : "none",
                          fontSize: 12,
                          fontWeight: jdInputMode === "upload" ? 700 : 500,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
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
                          padding: "12px 14px",
                          borderRadius: 8,
                          background: "var(--surface)",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-primary)",
                          fontSize: 13,
                          lineHeight: 1.6,
                          outline: "none",
                          fontFamily: "inherit",
                          resize: "vertical",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  ) : (
                    /* Option B: File Upload */
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        padding: "36px 24px",
                        borderRadius: 10,
                        background: "var(--surface-hover)",
                        border: "2px dashed var(--border-strong)",
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
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--brand-navy)", marginBottom: 4 }}>
                        {uploadedFile ? uploadedFile.name : "Click or drag your JD file here"}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                        Supported formats: PDF, DOCX, TXT (up to 10MB)
                      </div>
                      {uploadedFile && (
                        <div
                          style={{
                            display: "inline-block",
                            marginTop: 10,
                            padding: "4px 12px",
                            borderRadius: 5,
                            background: "var(--color-success-bg)",
                            color: "var(--color-success)",
                            fontSize: 11,
                            fontWeight: 700,
                            border: "1px solid #C8E4D3",
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
                        padding: "10px 22px",
                        borderRadius: 7,
                        background: analyzing ? "var(--brand-cobalt-hover)" : "var(--brand-cobalt)",
                        color: "#FFFFFF",
                        fontSize: 13,
                        fontWeight: 600,
                        border: "none",
                        cursor: analyzing ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        boxShadow: "0 1px 3px rgba(53, 106, 230, 0.25)",
                        transition: "all 0.15s ease",
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
                  background: "var(--surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 10,
                  padding: "24px 28px",
                  boxShadow: "var(--shadow-subtle)",
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
                          background: "var(--color-info-bg)",
                          color: "var(--brand-cobalt)",
                          border: "1px solid #D2E0FB",
                          fontWeight: 700,
                          letterSpacing: 0.5,
                        }}
                      >
                        ROLE DNA
                      </span>
                      <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                        Semantic Analysis &amp; Evidence Strategy
                      </span>
                    </div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px", color: "var(--brand-navy)" }}>
                      Role DNA: {title || "Engineering Role"}
                    </h2>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, maxWidth: 740 }}>
                      Cognalyze semantically structured your job description into verified requirements, on-the-job responsibilities, eligibility constraints, and evidence signals.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 7,
                      background: "var(--surface)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--brand-navy)",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      boxShadow: "0 1px 2px rgba(16, 24, 40, 0.04)",
                    }}
                  >
                    <span>+</span> Add Requirement
                  </button>
                </div>

                {/* ROLE DNA STAT SUMMARY BAR */}
                <div
                  style={{
                    padding: "14px 18px",
                    borderRadius: 8,
                    background: "var(--surface-subtle)",
                    border: "1px solid var(--border-subtle)",
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
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--brand-navy)" }}>
                      Verified Scope:
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "var(--color-error-bg)", color: "var(--color-error)", border: "1px solid #F8D7D7" }}>
                      {mustHaveList.length} Must-Have{mustHaveList.length === 1 ? "" : "s"}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "var(--color-info-bg)", color: "var(--brand-cobalt)", border: "1px solid #D2E0FB" }}>
                      {preferredList.length} Preferred
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "var(--color-success-bg)", color: "var(--color-success)", border: "1px solid #C8E4D3" }}>
                      {eligibilityList.length} Eligibility
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#F5F3FF", color: "#7C3AED", border: "1px solid #DDD6FE" }}>
                      {evidenceSignalList.length} Evidence Signal{evidenceSignalList.length === 1 ? "" : "s"}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "var(--color-warning-bg)", color: "var(--color-warning)", border: "1px solid #F8D8A7" }}>
                      {responsibilityList.length} Responsibilit{responsibilityList.length === 1 ? "y" : "ies"}
                    </span>
                    {ambiguityList.length > 0 && (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "var(--color-warning-bg)", color: "var(--color-warning)", border: "1px solid #F8D8A7" }}>
                        ⚠️ {ambiguityList.length} Needs Confirmation
                      </span>
                    )}
                  </div>
                </div>

                {/* ADAPTIVE RECRUITER CALIBRATION QUESTIONS */}
                {roleDna?.adaptiveQuestions && roleDna.adaptiveQuestions.length > 0 && (
                  <AdaptiveRoleClarificationCard
                    questions={roleDna.adaptiveQuestions}
                    answers={recruiterAnswers}
                    onAnswerChange={(qId, val) =>
                      setRecruiterAnswers((prev) => ({ ...prev, [qId]: val }))
                    }
                  />
                )}

                {/* CONFLICT ALERTS */}
                {conflicts.length > 0 && (
                  <div
                    style={{
                      padding: "16px 20px",
                      borderRadius: 8,
                      background: "var(--color-warning-bg)",
                      border: "1px solid #F8D8A7",
                      marginBottom: 24,
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-warning)", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
                      <span>⚠️</span>
                      <span>Conflicting requirements found in job description</span>
                    </div>
                    {conflicts.map((c, i) => (
                      <div key={i} style={{ fontSize: 12, color: "var(--text-primary)", marginTop: 6, lineHeight: 1.5 }}>
                        <div>{c.reason}</div>
                        <div style={{ marginTop: 4, display: "flex", gap: 12, flexWrap: "wrap" }}>
                          <span style={{ padding: "2px 8px", background: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: 4 }}>• &ldquo;{c.statementA}&rdquo;</span>
                          <span style={{ padding: "2px 8px", background: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: 4 }}>• &ldquo;{c.statementB}&rdquo;</span>
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
                      borderRadius: 8,
                      background: "var(--color-warning-bg)",
                      border: "1px solid #F8D8A7",
                      marginBottom: 24,
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-warning)", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
                      <span>⚠️</span>
                      <span>Items Needing Recruiter Confirmation ({ambiguityList.length})</span>
                    </div>
                    <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 12px" }}>
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
                        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "var(--color-error-bg)", color: "var(--color-error)", border: "1px solid #F8D7D7", fontWeight: 700 }}>
                          MUST-HAVE
                        </span>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--brand-navy)", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>
                          Core Must-Have Requirements ({mustHaveList.length})
                        </h3>
                      </div>
                      <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 12px" }}>
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
                        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "var(--color-info-bg)", color: "var(--brand-cobalt)", border: "1px solid #D2E0FB", fontWeight: 700 }}>
                          PREFERRED
                        </span>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--brand-navy)", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>
                          Preferred Capabilities ({preferredList.length})
                        </h3>
                      </div>
                      <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 12px" }}>
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
                        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "var(--color-success-bg)", color: "var(--color-success)", border: "1px solid #C8E4D3", fontWeight: 700 }}>
                          ELIGIBILITY
                        </span>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--brand-navy)", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>
                          Eligibility Conditions ({eligibilityList.length})
                        </h3>
                      </div>
                      <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 12px" }}>
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
                        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "#F5F3FF", color: "#7C3AED", border: "1px solid #DDD6FE", fontWeight: 700 }}>
                          EVIDENCE SIGNALS
                        </span>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--brand-navy)", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>
                          Evidence Signals ({evidenceSignalList.length})
                        </h3>
                      </div>
                      <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 12px" }}>
                        Where Cognalyze's evidence engine searches for proof (GitHub, deployed demos, hackathons, publications).
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {evidenceSignalList.map((req) => renderRequirementCard(req))}
                      </div>
                    </div>
                  )}

                  {/* 5. ON-THE-JOB RESPONSIBILITIES (NOT SCREENING REQUIREMENTS) */}
                  {responsibilityList.length > 0 && (
                    <div style={{ padding: "18px 20px", borderRadius: 8, background: "var(--surface-subtle)", border: "1px solid var(--border-subtle)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "var(--color-warning-bg)", color: "var(--color-warning)", border: "1px solid #F8D8A7", fontWeight: 700 }}>
                          RESPONSIBILITY
                        </span>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--brand-navy)", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>
                          On-The-Job Responsibilities ({responsibilityList.length})
                        </h3>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 12, lineHeight: 1.5 }}>
                        ℹ️ <strong>Informs role context only:</strong> These describe what the candidate will do on the job. They inform candidate alignment but are <em>never</em> used to disqualify candidates during automated screening.
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {responsibilityList.map((req) => renderRequirementCard(req))}
                      </div>

                      {/* RESPONSIBILITY-TO-CAPABILITY GRAPH */}
                      {roleDna?.responsibilityGraph && roleDna.responsibilityGraph.length > 0 && (
                        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px dashed var(--border-subtle)" }}>
                          <ResponsibilityGraphViewer
                            graph={roleDna.responsibilityGraph}
                            roleTitle={title}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* 6. ROLE CONSTRAINTS */}
                  {otherList.length > 0 && (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "var(--surface-subtle)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)", fontWeight: 700 }}>
                          CONSTRAINTS
                        </span>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--brand-navy)", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>
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
                    borderTop: "1px solid var(--border-subtle)",
                  }}
                >
                  {!show90DaySection ? (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--brand-navy)" }}>
                          Optional: What would success look like in the first 90 days?
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
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
                            background: "var(--surface)",
                            border: "1px solid var(--border-subtle)",
                            color: "var(--brand-cobalt)",
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
                    <div style={{ background: "var(--surface-subtle)", padding: 18, borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <label style={{ fontSize: 13, fontWeight: 700, color: "var(--brand-navy)" }}>
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
                            color: "var(--text-secondary)",
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
                          borderRadius: 7,
                          background: "var(--surface)",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-primary)",
                          fontSize: 12,
                          lineHeight: 1.5,
                          outline: "none",
                          boxSizing: "border-box",
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
                    borderTop: "1px solid var(--border-subtle)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setCurrentStep("details")}
                    style={{
                      padding: "9px 18px",
                      borderRadius: 7,
                      background: "var(--surface)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--brand-navy)",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    ← Edit Details
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStep("confirmation")}
                    style={{
                      padding: "10px 22px",
                      borderRadius: 7,
                      background: "var(--brand-cobalt)",
                      color: "#FFFFFF",
                      fontSize: 13,
                      fontWeight: 600,
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 1px 3px rgba(53, 106, 230, 0.25)",
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
                  background: "var(--surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 10,
                  padding: 32,
                  textAlign: "center",
                  boxShadow: "var(--shadow-subtle)",
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    background: "var(--color-success-bg)",
                    color: "var(--color-success)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 28,
                    margin: "0 auto 16px",
                    border: "1px solid #C8E4D3",
                  }}
                >
                  ✓
                </div>

                <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 8px", color: "var(--brand-navy)" }}>
                  Your role is ready
                </h2>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", maxWidth: 540, margin: "0 auto 24px", lineHeight: 1.5 }}>
                  All requirements are traceable to your job description or clearly marked as recruiter-provided.
                </p>

                {/* ROLE SUMMARY CARD */}
                <div
                  style={{
                    maxWidth: 600,
                    margin: "0 auto 32px",
                    background: "var(--surface-subtle)",
                    borderRadius: 10,
                    border: "1px solid var(--border-subtle)",
                    padding: "20px 24px",
                    textAlign: "left",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 700, color: "var(--brand-navy)" }}>{title}</div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                        {department || "Engineering"} • {workMode} {location ? `(${location})` : ""}
                      </div>
                    </div>
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: 6,
                        background: "var(--color-info-bg)",
                        color: "var(--brand-cobalt)",
                        border: "1px solid #D2E0FB",
                        fontSize: 11,
                        fontWeight: 700,
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
                      borderTop: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 700 }}>MUST-HAVES</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-error)" }}>{mustHaveList.length}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 700 }}>PREFERRED</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--brand-cobalt)" }}>{preferredList.length}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 700 }}>ELIGIBILITY</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-success)" }}>{eligibilityList.length}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 700 }}>SIGNALS</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#7C3AED" }}>{evidenceSignalList.length}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 700 }}>RESPONSIBILITIES</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-warning)" }}>{responsibilityList.length}</div>
                    </div>
                    {otherList.length > 0 && (
                      <div>
                        <div style={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 700 }}>CONSTRAINTS</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-secondary)" }}>{otherList.length}</div>
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
                      padding: "10px 20px",
                      borderRadius: 7,
                      background: "var(--surface)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--brand-navy)",
                      fontSize: 13,
                      fontWeight: 600,
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
                      padding: "10px 24px",
                      borderRadius: 7,
                      background: "var(--brand-cobalt)",
                      color: "var(--surface)",
                      fontSize: 13,
                      fontWeight: 600,
                      border: "none",
                      cursor: saving ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span>{saving ? "Creating Role..." : "Create Role & Start Screening →"}</span>
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
              {roles.map((role) => {
                const isSelected = selectedRole?.id === role.id;
                const reqCount = role.structuredRequirements?.length || role.tieredRequirements?.length || 0;

                return (
                  <div
                    key={role.id}
                    onClick={() => setSelectedRole(role)}
                    style={{
                      background: "var(--surface)",
                      border: isSelected ? "2px solid #356AE6" : "1px solid var(--border-subtle)",
                      borderRadius: 10,
                      padding: 20,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <span
                        style={{
                          fontSize: 10,
                          padding: "2px 6px",
                          borderRadius: 4,
                          background: "var(--bg-canvas)",
                          color: "var(--text-secondary)",
                          fontWeight: 700,
                          border: "1px solid var(--border-subtle)",
                          textTransform: "uppercase"
                        }}
                      >
                        {role.department}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 4,
                          background: "var(--color-success-bg)",
                          color: "var(--color-success)",
                          fontWeight: 600,
                          border: "1px solid #C8E4D3",
                        }}
                      >
                        {role.targetHires} Opening{role.targetHires > 1 ? "s" : ""}
                      </span>
                    </div>

                    <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--brand-navy)", margin: "0 0 4px" }}>
                      {role.title}
                    </h3>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 16 }}>
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
                          padding: "7px 12px",
                          borderRadius: 7,
                          background: "var(--brand-cobalt)",
                          color: "var(--surface)",
                          textDecoration: "none",
                          fontSize: 12,
                          fontWeight: 600,
                          textAlign: "center",
                        }}
                      >
                        Screen Candidates →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SELECTED ROLE DETAILS INSPECTION — IMPLEMENTING SECTION 15 ROLE DNA */}
            {selectedRole && (
              <div
                style={{
                  marginTop: 24,
                  background: "var(--surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 10,
                  padding: "24px 28px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 20, borderBottom: "1px solid var(--border-subtle)", paddingBottom: 16 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--brand-cobalt)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        ROLE DNA
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: "2px 6px",
                          borderRadius: 4,
                          background: selectedRole.approvalRecord?.approvalStatus === "approved" || selectedRole.approvalRecord?.approvalStatus === "published" ? "#ECFDF5" : "var(--color-warning-bg)",
                          color: selectedRole.approvalRecord?.approvalStatus === "approved" || selectedRole.approvalRecord?.approvalStatus === "published" ? "#065F46" : "var(--color-warning)",
                          border: selectedRole.approvalRecord?.approvalStatus === "approved" || selectedRole.approvalRecord?.approvalStatus === "published" ? "1px solid #A7F3D0" : "1px solid #F8D8A7",
                        }}
                      >
                        v{selectedRole.version || 1}.0 {selectedRole.approvalRecord?.approvalStatus === "approved" ? "Approved" : "Draft"}
                      </span>
                    </div>
                    <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--brand-navy)", margin: "4px 0 0" }}>
                      {selectedRole.title}
                    </h2>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "4px 0 0" }}>
                      {selectedRole.department} • {selectedRole.targetHires} Opening{selectedRole.targetHires > 1 ? "s" : ""} • Evidence-calibrated screening model
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <Link
                      href={`/recruiter/candidates?roleId=${selectedRole.id}`}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 7,
                        background: "var(--brand-cobalt)",
                        color: "var(--surface)",
                        textDecoration: "none",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      View Matched Candidates →
                    </Link>
                  </div>
                </div>

                {/* ROLE EXPLORER TABS */}
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    borderBottom: "1px solid var(--border-subtle)",
                    marginBottom: 20,
                    overflowX: "auto",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setActiveRoleTab("requirements")}
                    style={{
                      padding: "8px 16px",
                      background: "transparent",
                      border: "none",
                      borderBottom: activeRoleTab === "requirements" ? "2px solid var(--brand-cobalt)" : "2px solid transparent",
                      color: activeRoleTab === "requirements" ? "var(--brand-cobalt)" : "var(--text-secondary)",
                      fontWeight: activeRoleTab === "requirements" ? 700 : 500,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    🧬 Requirements &amp; Scope
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveRoleTab("graph")}
                    style={{
                      padding: "8px 16px",
                      background: "transparent",
                      border: "none",
                      borderBottom: activeRoleTab === "graph" ? "2px solid var(--brand-cobalt)" : "2px solid transparent",
                      color: activeRoleTab === "graph" ? "var(--brand-cobalt)" : "var(--text-secondary)",
                      fontWeight: activeRoleTab === "graph" ? 700 : 500,
                      fontSize: 13,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>🕸️</span> Responsibility Graph
                    {selectedRole.responsibilityGraph && (
                      <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 10, background: "var(--surface-subtle)" }}>
                        {selectedRole.responsibilityGraph.length}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveRoleTab("market_signals")}
                    style={{
                      padding: "8px 16px",
                      background: "transparent",
                      border: "none",
                      borderBottom: activeRoleTab === "market_signals" ? "2px solid var(--brand-cobalt)" : "2px solid transparent",
                      color: activeRoleTab === "market_signals" ? "var(--brand-cobalt)" : "var(--text-secondary)",
                      fontWeight: activeRoleTab === "market_signals" ? 700 : 500,
                      fontSize: 13,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>🌐</span> Workforce Intelligence &amp; India Trends
                    {marketSignals.length > 0 && (
                      <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 10, background: "#ECFDF5", color: "#065F46" }}>
                        {marketSignals.length}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveRoleTab("versions")}
                    style={{
                      padding: "8px 16px",
                      background: "transparent",
                      border: "none",
                      borderBottom: activeRoleTab === "versions" ? "2px solid var(--brand-cobalt)" : "2px solid transparent",
                      color: activeRoleTab === "versions" ? "var(--brand-cobalt)" : "var(--text-secondary)",
                      fontWeight: activeRoleTab === "versions" ? 700 : 500,
                      fontSize: 13,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>📜</span> Approval &amp; Version Vault (v{selectedRole.version || 1}.0)
                  </button>
                </div>

                {/* TAB 1: REQUIREMENTS & SCOPE */}
                {activeRoleTab === "requirements" && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
                    {/* MUST HAVE */}
                    <div style={{ background: "#FAF9F6", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: "18px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--brand-navy)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          MUST HAVE
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "#FDF2F2", color: "var(--color-error)", border: "1px solid #F8D7DA" }}>
                          REQUIRED
                        </span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {(selectedRole.structuredRequirements?.filter(r => r.semanticCategory === "MUST_HAVE" || r.category === "required") || []).length > 0 ? (
                          selectedRole.structuredRequirements?.filter(r => r.semanticCategory === "MUST_HAVE" || r.category === "required").map(r => (
                            <div key={r.id} style={{ padding: "8px 10px", background: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: 6, fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                              {r.canonicalName || r.name}
                            </div>
                          ))
                        ) : (
                          ["Python", "FastAPI", "PostgreSQL", "REST APIs"].map(item => (
                            <div key={item} style={{ padding: "8px 10px", background: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: 6, fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                              {item}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* GOOD TO HAVE */}
                    <div style={{ background: "#FAF9F6", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: "18px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--brand-navy)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          GOOD TO HAVE
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "var(--color-info-bg)", color: "var(--brand-cobalt)", border: "1px solid #D2E0FB" }}>
                          PREFERRED
                        </span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {(selectedRole.structuredRequirements?.filter(r => r.semanticCategory === "PREFERRED" || r.category === "preferred") || []).length > 0 ? (
                          selectedRole.structuredRequirements?.filter(r => r.semanticCategory === "PREFERRED" || r.category === "preferred").map(r => (
                            <div key={r.id} style={{ padding: "8px 10px", background: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: 6, fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                              {r.canonicalName || r.name}
                            </div>
                          ))
                        ) : (
                          ["AWS", "Docker", "Redis"].map(item => (
                            <div key={item} style={{ padding: "8px 10px", background: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: 6, fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                              {item}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* ROLE SIGNALS */}
                    <div style={{ background: "#FAF9F6", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: "18px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--brand-navy)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          ROLE SIGNALS
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "var(--color-success-bg)", color: "var(--color-success)", border: "1px solid #C8E4D3" }}>
                          EVIDENCE
                        </span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {(selectedRole.structuredRequirements?.filter(r => r.semanticCategory === "EVIDENCE_SIGNAL" || r.category === "experience") || []).length > 0 ? (
                          selectedRole.structuredRequirements?.filter(r => r.semanticCategory === "EVIDENCE_SIGNAL" || r.category === "experience").map(r => (
                            <div key={r.id} style={{ padding: "8px 10px", background: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: 6, fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                              {r.canonicalName || r.name}
                            </div>
                          ))
                        ) : (
                          ["Production experience", "System design", "Open-source evidence"].map(item => (
                            <div key={item} style={{ padding: "8px 10px", background: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: 6, fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                              {item}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: RESPONSIBILITY-TO-CAPABILITY GRAPH */}
                {activeRoleTab === "graph" && (
                  <ResponsibilityGraphViewer
                    graph={selectedRole.responsibilityGraph || selectedRole.roleDna?.responsibilityGraph || []}
                    roleTitle={selectedRole.title}
                  />
                )}

                {/* TAB 3: WORKFORCE INTELLIGENCE & INDIA SIGNALS */}
                {activeRoleTab === "market_signals" && (
                  <WorkforceIntelligencePanel
                    signals={marketSignals}
                    proposals={evolutionProposals}
                    onReviewProposal={handleReviewProposal}
                    onGenerateProposals={handleGenerateProposals}
                  />
                )}

                {/* TAB 4: APPROVAL & VERSION VAULT */}
                {activeRoleTab === "versions" && (
                  <RoleApprovalAndVersionVault
                    role={selectedRole}
                    versions={roleVersions}
                    onApprove={handleApproveRole}
                    loadingVersions={loadingVersions}
                  />
                )}
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
              background: "rgba(16, 24, 40, 0.4)",
              backdropFilter: "blur(4px)",
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
                background: "var(--surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 12,
                padding: 24,
                boxShadow: "var(--shadow-modal)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--brand-navy)", margin: 0 }}>
                  Add Requirement Manually
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ background: "transparent", border: "none", color: "var(--text-secondary)", fontSize: 18, cursor: "pointer" }}
                >
                  ✕
                </button>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>
                  Requirement Name
                </label>
                <input
                  type="text"
                  value={customReqName}
                  onChange={(e) => setCustomReqName(e.target.value)}
                  placeholder="e.g. Distributed Tracing with OpenTelemetry"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 7,
                    background: "var(--surface)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                    fontSize: 13,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>
                  Category
                </label>
                <select
                  value={customReqCategory}
                  onChange={(e) => setCustomReqCategory(e.target.value as RoleCategory)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 7,
                    background: "var(--surface)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                    fontSize: 13,
                    outline: "none",
                    boxSizing: "border-box",
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
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>
                  Requirement Type
                </label>
                <select
                  value={customReqType}
                  onChange={(e) => setCustomReqType(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 7,
                    background: "var(--surface)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                    fontSize: 13,
                    outline: "none",
                    boxSizing: "border-box",
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
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>
                  Evidence Expectation (Proof Requirement)
                </label>
                <select
                  value={customReqExpectation}
                  onChange={(e) => setCustomReqExpectation(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 7,
                    background: "var(--surface)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                    fontSize: 13,
                    outline: "none",
                    boxSizing: "border-box",
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
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>
                  Evidence Signals (Comma-separated)
                </label>
                <input
                  type="text"
                  value={customReqSignals}
                  onChange={(e) => setCustomReqSignals(e.target.value)}
                  placeholder="e.g. GitHub, Deployed Project, Technical Assessment"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 7,
                    background: "var(--surface)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                    fontSize: 13,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 7,
                  background: "var(--color-info-bg)",
                  border: "1px solid #D2E0FB",
                  fontSize: 12,
                  color: "var(--brand-cobalt)",
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
                    borderRadius: 7,
                    background: "var(--surface)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--brand-navy)",
                    fontSize: 12,
                    fontWeight: 600,
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
                    borderRadius: 7,
                    background: "var(--brand-cobalt)",
                    color: "white",
                    fontSize: 12,
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 1px 3px rgba(53, 106, 230, 0.25)",
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
    let catBadgeColor = "var(--color-error-bg)";
    let catTextColor = "var(--color-error)";
    let catBorderColor = "#F8D7D7";
    let catLabel = "Must-Have";

    if (req.semanticCategory === "RESPONSIBILITY" || req.category === "responsibility") {
      catBadgeColor = "var(--color-warning-bg)";
      catTextColor = "var(--color-warning)";
      catBorderColor = "#F8D8A7";
      catLabel = "On-The-Job Task";
    } else if (req.semanticCategory === "PREFERRED" || req.category === "preferred") {
      catBadgeColor = "var(--color-info-bg)";
      catTextColor = "var(--brand-cobalt)";
      catBorderColor = "#D2E0FB";
      catLabel = "Preferred";
    } else if (req.semanticCategory === "ELIGIBILITY" || req.category === "education") {
      catBadgeColor = "var(--color-success-bg)";
      catTextColor = "var(--color-success)";
      catBorderColor = "#C8E4D3";
      catLabel = "Eligibility";
    } else if (req.semanticCategory === "EVIDENCE_SIGNAL") {
      catBadgeColor = "#F5F3FF";
      catTextColor = "#7C3AED";
      catBorderColor = "#DDD6FE";
      catLabel = "Evidence Signal";
    } else if (req.semanticCategory === "UNKNOWN" || req.needsConfirmation) {
      catBadgeColor = "var(--color-warning-bg)";
      catTextColor = "var(--color-warning)";
      catBorderColor = "#F8D8A7";
      catLabel = "Needs Confirmation";
    } else if (req.category === "other" || req.semanticCategory === "CONSTRAINT") {
      catBadgeColor = "var(--surface-subtle)";
      catTextColor = "var(--text-secondary)";
      catBorderColor = "var(--border-subtle)";
      catLabel = "Constraint";
    }

    return (
      <div
        key={req.id}
        style={{
          padding: "14px 18px",
          borderRadius: 8,
          background: "var(--surface)",
          border: req.needsConfirmation
            ? "1px solid var(--color-warning)"
            : "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-subtle)",
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
                background: "var(--surface)",
                border: "1px solid var(--brand-cobalt)",
                color: "var(--text-primary)",
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
                background: "var(--surface)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-primary)",
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
                background: "var(--surface)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-primary)",
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
                background: "var(--color-success)",
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
                border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)",
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
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--brand-navy)", letterSpacing: "-0.2px" }}>
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
                      border: `1px solid ${catBorderColor}`,
                      fontWeight: 700,
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
                        background: "var(--color-info-bg)",
                        color: "var(--brand-cobalt)",
                        border: "1px solid #D2E0FB",
                        fontWeight: 600,
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
                        background: "var(--color-success-bg)",
                        color: "var(--color-success)",
                        border: "1px solid #C8E4D3",
                        fontWeight: 600,
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
                        background: "var(--surface-subtle)",
                        color: "var(--text-secondary)",
                        border: "1px solid var(--border-subtle)",
                        fontWeight: 600,
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
                        background: "var(--color-warning-bg)",
                        color: "var(--color-warning)",
                        border: "1px solid #F8D8A7",
                        fontWeight: 600,
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
                        background: "var(--color-info-bg)",
                        color: "var(--brand-cobalt)",
                        border: "1px solid #D2E0FB",
                        fontWeight: 600,
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
                      background: isRecruiterAdded ? "#F5F3FF" : "var(--surface-subtle)",
                      color: isRecruiterAdded ? "#7C3AED" : "var(--text-secondary)",
                      border: isRecruiterAdded ? "1px solid #DDD6FE" : "1px solid var(--border-subtle)",
                      fontWeight: 600,
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
                        background: "var(--color-warning-bg)",
                        color: "var(--color-warning)",
                        border: "1px solid #F8D8A7",
                        fontWeight: 700,
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
                      color: "var(--text-secondary)",
                      fontStyle: "italic",
                      background: "var(--surface-subtle)",
                      borderLeft: "3px solid var(--brand-cobalt)",
                      padding: "6px 12px",
                      borderRadius: "0 6px 6px 0",
                      marginTop: 6,
                      marginBottom: 8,
                      lineHeight: 1.45,
                    }}
                  >
                    &ldquo;{req.evidenceQuote}&rdquo;
                  </div>
                )}

                {/* Inline Evidence Signals Chips */}
                {req.evidenceSignals && req.evidenceSignals.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 4, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 700 }}>Signals:</span>
                    {req.evidenceSignals.map((sig, sIdx) => (
                      <span
                        key={sIdx}
                        style={{
                          fontSize: 10,
                          padding: "1px 6px",
                          borderRadius: 4,
                          background: "var(--surface-subtle)",
                          color: "var(--text-secondary)",
                          border: "1px solid var(--border-subtle)",
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
                      color: "var(--text-primary)",
                      background: "var(--color-warning-bg)",
                      border: "1px solid #F8D8A7",
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
                      <span style={{ fontWeight: 700, color: "var(--color-warning)" }}>Ambiguity Detected: </span>
                      <span>{req.ambiguityReason}</span>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => handleKeepAsWritten(req.id)}
                        style={{
                          padding: "3px 10px",
                          borderRadius: 4,
                          background: "var(--surface)",
                          color: "var(--brand-navy)",
                          border: "1px solid var(--border-subtle)",
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
                          background: "var(--color-info-bg)",
                          color: "var(--brand-cobalt)",
                          border: "1px solid #D2E0FB",
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
                          background: "var(--color-error-bg)",
                          color: "var(--color-error)",
                          border: "1px solid #F8D7D7",
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
                      color: "var(--brand-cobalt)",
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
                        borderRadius: 8,
                        background: "var(--surface-subtle)",
                        border: "1px solid var(--border-subtle)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                        fontSize: 12,
                      }}
                    >
                      {/* 1. WHY IDENTIFIED */}
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--brand-navy)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>
                          Why This Was Identified:
                        </div>
                        <div style={{ color: "var(--text-secondary)", lineHeight: 1.5 }}>
                          {req.rationale || "Identified directly from job description qualifications."}
                        </div>
                      </div>

                      {/* 2. EVIDENCE EXPECTED */}
                      {req.evidenceSignals && req.evidenceSignals.length > 0 && (
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--brand-cobalt)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>
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
                                  background: "var(--color-info-bg)",
                                  color: "var(--brand-cobalt)",
                                  border: "1px solid #D2E0FB",
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
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-success)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>
                          Verification Rule (Tier 1 Implementation &gt; Tier 3 Claim):
                        </div>
                        <div style={{ color: "var(--text-secondary)", lineHeight: 1.5 }}>
                          {req.verificationStrategy && req.verificationStrategy.length > 0
                            ? req.verificationStrategy.join(" • ")
                            : "Implementation > Claim. Require genuine technical demonstration rather than resume keyword mentions."}
                        </div>
                      </div>

                      {/* 4. PROVENANCE IN JD */}
                      {req.evidenceQuote && (
                        <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 8 }}>
                          <div style={{ fontSize: 10, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>
                            Source Section &amp; Verbatim Text:
                          </div>
                          <div style={{ color: "var(--text-secondary)", fontStyle: "italic", fontSize: 11, lineHeight: 1.4 }}>
                            &ldquo;{req.evidenceQuote}&rdquo;
                          </div>
                        </div>
                      )}

                      {/* 5. INFERRED CAPABILITIES (IF ANY) */}
                      {req.relatedCapabilities && req.relatedCapabilities.length > 0 && (
                        <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 8 }}>
                          <div style={{ fontSize: 10, color: "var(--color-warning)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>
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
                                  background: "var(--color-warning-bg)",
                                  color: "var(--color-warning)",
                                  border: "1px solid #F8D8A7",
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
                      background: "var(--surface)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--brand-navy)",
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
                      background: "var(--color-error-bg)",
                      border: "1px solid #F8D7D7",
                      color: "var(--color-error)",
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
