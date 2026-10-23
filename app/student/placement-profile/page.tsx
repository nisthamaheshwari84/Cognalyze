"use client";

import React, { useState, useEffect } from "react";
import AppNav from "@/components/AppNav";
import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";
import {
  StudentPlacementProfile,
  RoadmapRecommendation,
  CompetencyStatus,
  KnowledgeTier,
} from "@/lib/skills/placement-profile-engine";
import {
  PlacementProofItem,
  PlacementOfferRecord,
  ExplainableOpportunityMatch,
  RoleGapAnalysis,
  PlacementOverviewSnapshot,
  ProofVerificationTier,
} from "@/lib/skills/placement-intelligence-engine";
import {
  User,
  GraduationCap,
  Target,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Plus,
  Save,
  AlertCircle,
  Briefcase,
  Code2,
  Code,
  Terminal,
  Trash2,
  Database,
  Globe,
  Sliders,
  Award,
  Layers,
  ChevronRight,
  Clock,
  BookOpen,
  Building2,
  Compass,
  FileCheck2,
  Calendar,
  ExternalLink,
  HelpCircle,
  XCircle,
  Check,
  Filter,
  DollarSign,
  Send,
  Lock,
} from "lucide-react";

type PlacementTab =
  | "overview"
  | "identity"
  | "portfolio"
  | "opportunities"
  | "roadmap"
  | "interviews"
  | "applications"
  | "outcomes";

export default function StudentPlacementProfilePage() {
  const { isDark } = useTheme();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<PlacementTab>("overview");
  const [profileState, setProfileState] = useState<"NO_PROFILE" | "PARTIAL" | "COMPLETE">("NO_PROFILE");
  const [profile, setProfile] = useState<StudentPlacementProfile | null>(null);
  const [overview, setOverview] = useState<PlacementOverviewSnapshot | null>(null);
  const [gapAnalysis, setGapAnalysis] = useState<RoleGapAnalysis | null>(null);
  const [proofPortfolio, setProofPortfolio] = useState<PlacementProofItem[]>([]);
  const [opportunities, setOpportunities] = useState<ExplainableOpportunityMatch[]>([]);
  const [offers, setOffers] = useState<PlacementOfferRecord[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [roadmap, setRoadmap] = useState<RoadmapRecommendation[]>([]);

  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Filters for Opportunities
  const [oppCategoryFilter, setOppCategoryFilter] = useState<string>("ALL");
  const [oppEligibilityFilter, setOppEligibilityFilter] = useState<string>("ALL");
  const [selectedMatchModal, setSelectedMatchModal] = useState<ExplainableOpportunityMatch | null>(null);

  // Form Fields - Placement Identity
  const [college, setCollege] = useState("");
  const [degree, setDegree] = useState("B.Tech");
  const [branch, setBranch] = useState("Computer Science & Engineering");
  const [graduationYear, setGraduationYear] = useState("2026");
  const [cgpa, setCgpa] = useState("8.5");
  const [activeBacklogs, setActiveBacklogs] = useState("0");
  const [targetRoles, setTargetRoles] = useState<string[]>(["Software Development Engineer (SDE-1)"]);
  const [targetCompanies, setTargetCompanies] = useState<string[]>(["Google", "Amazon", "Razorpay"]);
  const [preferredWorkMode, setPreferredWorkMode] = useState<string>("hybrid");
  const [dailyPrepMinutes, setDailyPrepMinutes] = useState(90);
  const [preferredLanguage, setPreferredLanguage] = useState("cpp");
  const [preferredInterviewFormat, setPreferredInterviewFormat] = useState<"coding" | "spoken" | "mixed">("mixed");
  const [programmingLanguages, setProgrammingLanguages] = useState<string[]>(["C++", "Python", "SQL"]);
  const [dsaProficiency, setDsaProficiency] = useState<"Beginner" | "Intermediate" | "Advanced">("Intermediate");

  // Temporary inputs
  const [newRoleInput, setNewRoleInput] = useState("");
  const [newCompanyInput, setNewCompanyInput] = useState("");
  const [newLangInput, setNewLangInput] = useState("");

  // Modals
  const [showAddProofModal, setShowAddProofModal] = useState(false);
  const [proofSkill, setProofSkill] = useState("");
  const [proofTitle, setProofTitle] = useState("");
  const [proofType, setProofType] = useState<PlacementProofItem["evidenceType"]>("github_repo");
  const [proofTier, setProofTier] = useState<ProofVerificationTier>("self_reported");
  const [proofUrl, setProofUrl] = useState("");
  const [proofDesc, setProofDesc] = useState("");
  const [proofSubmitting, setProofSubmitting] = useState(false);

  const [showAddOfferModal, setShowAddOfferModal] = useState(false);
  const [offerEmployer, setOfferEmployer] = useState("");
  const [offerRole, setOfferRole] = useState("");
  const [offerCtc, setOfferCtc] = useState("");
  const [offerStatus, setOfferStatus] = useState<PlacementOfferRecord["status"]>("OFFER_RECEIVED");
  const [offerLevel, setOfferLevel] = useState<PlacementOfferRecord["verificationLevel"]>("document_supported");
  const [offerJoiningDate, setOfferJoiningDate] = useState("");
  const [offerSubmitting, setOfferSubmitting] = useState(false);

  useEffect(() => {
    loadCompletePlacementDashboard();
  }, []);

  const loadCompletePlacementDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/student/placement-profile");
      const data = await res.json();
      if (data.success) {
        setProfile(data.profile);
        setProfileState(data.profileState || "COMPLETE");
        setOverview(data.overview || null);
        setGapAnalysis(data.gapAnalysis || null);
        setProofPortfolio(data.proofPortfolio || []);
        setOpportunities(data.opportunities || []);
        setOffers(data.offers || []);
        setApplications(data.applications || []);
        setRoadmap(data.roadmap || []);

        if (data.profile) {
          setCollege(data.profile.college || "");
          setDegree(data.profile.degree || "B.Tech");
          setBranch(data.profile.branch || "Computer Science & Engineering");
          setGraduationYear(data.profile.graduationYear || "2026");
          setCgpa(data.profile.cgpa || "8.5");
          setTargetRoles(data.profile.targetRoles || ["Software Development Engineer (SDE-1)"]);
          setTargetCompanies(data.profile.targetCompanies || ["Google", "Amazon", "Razorpay"]);
          setDailyPrepMinutes(data.profile.dailyPrepMinutes || 90);
          setPreferredLanguage(data.profile.preferredLanguage || "cpp");
          setPreferredInterviewFormat(data.profile.preferredInterviewFormat || "mixed");
          setProgrammingLanguages(data.profile.programmingLanguages || ["C++", "Python", "SQL"]);
          setDsaProficiency(data.profile.dsaProficiencyLevel || "Intermediate");
        }
      }
    } catch (err: any) {
      console.error("Failed to load placement profile dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setErrorMsg("");
    setSaveSuccessMsg("");
    try {
      const res = await fetch("/api/student/placement-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          college,
          degree,
          branch,
          graduationYear,
          cgpa,
          activeBacklogs: parseInt(activeBacklogs, 10) || 0,
          targetRoles,
          targetCompanies,
          preferredWorkMode,
          dailyPrepMinutes,
          preferredLanguage,
          preferredInterviewFormat,
          programmingLanguages,
          dsaProficiencyLevel: dsaProficiency,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.profile);
        setProfileState("COMPLETE");
        setOverview(data.overview || overview);
        setGapAnalysis(data.gapAnalysis || gapAnalysis);
        setOpportunities(data.opportunities || opportunities);
        setRoadmap(data.roadmap || roadmap);
        setSaveSuccessMsg("Placement Identity and intelligence models synchronized successfully!");
        setTimeout(() => setSaveSuccessMsg(""), 4000);
      } else {
        setErrorMsg(data.error || "Failed to save profile.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofSkill || !proofTitle) return;
    setProofSubmitting(true);
    try {
      const res = await fetch("/api/student/placement-profile/proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillOrClaim: proofSkill,
          title: proofTitle,
          evidenceType: proofType,
          verificationTier: proofTier,
          sourceUrl: proofUrl,
          description: proofDesc,
          confidenceScore: proofTier === "assessment_verified" ? 90 : proofTier === "source_connected" ? 75 : 50,
          assessmentScore: proofTier === "assessment_verified" ? 85 : undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.proof) {
        setProofPortfolio([data.proof, ...proofPortfolio]);
        setShowAddProofModal(false);
        setProofSkill("");
        setProofTitle("");
        setProofUrl("");
        setProofDesc("");
        // Reload dashboard to update gap analysis and matches
        loadCompletePlacementDashboard();
      }
    } catch (err) {
      console.error("Failed to add proof:", err);
    } finally {
      setProofSubmitting(false);
    }
  };

  const handleAddOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerEmployer || !offerRole) return;
    setOfferSubmitting(true);
    try {
      const res = await fetch("/api/student/placement-profile/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employer: offerEmployer,
          roleTitle: offerRole,
          compensationCtc: offerCtc ? parseFloat(offerCtc) : undefined,
          status: offerStatus,
          verificationLevel: offerLevel,
          expectedJoiningDate: offerJoiningDate || undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.offer) {
        setOffers([data.offer, ...offers]);
        setShowAddOfferModal(false);
        setOfferEmployer("");
        setOfferRole("");
        setOfferCtc("");
        setOfferJoiningDate("");
        loadCompletePlacementDashboard();
      }
    } catch (err) {
      console.error("Failed to record offer:", err);
    } finally {
      setOfferSubmitting(false);
    }
  };

  const handleApplyClick = async (oppMatch: ExplainableOpportunityMatch) => {
    // Record application attempt with status 'opened'
    try {
      await fetch("/api/student/placement-profile/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opportunityId: oppMatch.opportunity.id,
          stage: "Applied",
          notes: `Candidate initiated application for ${oppMatch.opportunity.title} at ${oppMatch.opportunity.companyName}`,
        }),
      });
      loadCompletePlacementDashboard();
    } catch (err) {
      console.warn("Application recording:", err);
    }
    // Open application url
    window.open(oppMatch.opportunity.applicationUrl || oppMatch.opportunity.sourceUrl, "_blank");
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "independently_confirmed":
      case "code_demonstrated":
        return (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 5,
              backgroundColor: isDark ? "rgba(46, 125, 91, 0.25)" : "#EAF4EE",
              color: isDark ? "#48C78E" : "#2E7D5B",
              border: isDark ? "1px solid rgba(72, 199, 142, 0.35)" : "1px solid #C8E4D3",
            }}
          >
            ✓ Independently Confirmed
          </span>
        );
      case "assessment_verified":
        return (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 5,
              backgroundColor: isDark ? "rgba(121, 53, 230, 0.2)" : "#F4EFFE",
              color: isDark ? "#C084FC" : "#7935E6",
              border: isDark ? "1px solid rgba(121, 53, 230, 0.35)" : "1px solid #E4D5FB",
            }}
          >
            ⚡ Assessment Verified
          </span>
        );
      case "source_connected":
      case "verified_external":
        return (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 5,
              backgroundColor: isDark ? "rgba(53, 106, 230, 0.2)" : "#EFF4FE",
              color: isDark ? "#60A5FA" : "#356AE6",
              border: isDark ? "1px solid rgba(53, 106, 230, 0.35)" : "1px solid #D2E0FB",
            }}
          >
            🔗 Source Connected
          </span>
        );
      case "self_reported":
      default:
        return (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 5,
              backgroundColor: isDark ? "rgba(245, 158, 11, 0.2)" : "#FEF7E6",
              color: isDark ? "#FBBF24" : "#B54708",
              border: isDark ? "1px solid rgba(245, 158, 11, 0.35)" : "1px solid #FBE6B8",
            }}
          >
            📝 Self-Reported
          </span>
        );
    }
  };

  const getEligibilityBadge = (status: string) => {
    switch (status) {
      case "ELIGIBLE":
        return (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: 5,
              backgroundColor: isDark ? "rgba(46, 125, 91, 0.25)" : "#EAF4EE",
              color: isDark ? "#48C78E" : "#2E7D5B",
              border: isDark ? "1px solid rgba(72, 199, 142, 0.35)" : "1px solid #C8E4D3",
            }}
          >
            ✓ Eligible
          </span>
        );
      case "POTENTIALLY_ELIGIBLE":
        return (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: 5,
              backgroundColor: isDark ? "rgba(245, 158, 11, 0.2)" : "#FEF7E6",
              color: isDark ? "#FBBF24" : "#B54708",
              border: isDark ? "1px solid rgba(245, 158, 11, 0.35)" : "1px solid #FBE6B8",
            }}
          >
            ⚠ Needs Confirmation
          </span>
        );
      case "INELIGIBLE":
      default:
        return (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: 5,
              backgroundColor: isDark ? "rgba(225, 29, 72, 0.2)" : "#FEF3F2",
              color: isDark ? "#FB7185" : "#D92D20",
              border: isDark ? "1px solid rgba(225, 29, 72, 0.3)" : "1px solid #FECDCA",
            }}
          >
            ✕ Ineligible
          </span>
        );
    }
  };

  // Filtered Opportunities
  const filteredOpps = opportunities.filter((m) => {
    if (oppEligibilityFilter !== "ALL" && m.eligibility.overallStatus !== oppEligibilityFilter) return false;
    if (oppCategoryFilter !== "ALL") {
      const type = (m.opportunity.opportunityType || m.opportunity.classification || "").toUpperCase();
      if (!type.includes(oppCategoryFilter)) return false;
    }
    return true;
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: isDark ? "#07111F" : "#F6F5F1",
        color: isDark ? "#F2F6FC" : "#17191C",
        fontFamily: "var(--font-inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
        transition: "background-color 0.15s ease, color 0.15s ease",
      }}
    >
      <AppNav role="student" />

      <main style={{ maxWidth: 1260, margin: "0 auto", padding: "28px 24px 80px" }}>
        {/* Top Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 20,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                backgroundColor: isDark ? "rgba(53, 106, 230, 0.2)" : "#EFF4FE",
                border: isDark ? "1px solid rgba(53, 106, 230, 0.35)" : "1px solid #D2E0FB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                color: "#356AE6",
                boxShadow: "0 1px 3px rgba(16, 24, 40, 0.04)",
              }}
            >
              🎓
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h1
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: isDark ? "#F2F6FC" : "#162A43",
                    margin: 0,
                    letterSpacing: "-0.4px",
                  }}
                >
                  Placement Profile & Intelligence
                </h1>
                <span
                  style={{
                    fontSize: 11,
                    padding: "3px 10px",
                    borderRadius: 20,
                    backgroundColor:
                      profileState === "COMPLETE"
                        ? isDark
                          ? "rgba(46, 125, 91, 0.25)"
                          : "#EAF4EE"
                        : isDark
                        ? "rgba(245, 158, 11, 0.2)"
                        : "#FEF7E6",
                    color:
                      profileState === "COMPLETE"
                        ? isDark
                          ? "#48C78E"
                          : "#2E7D5B"
                        : isDark
                        ? "#FBBF24"
                        : "#B54708",
                    border:
                      profileState === "COMPLETE"
                        ? isDark
                          ? "1px solid rgba(72, 199, 142, 0.35)"
                          : "1px solid #C8E4D3"
                        : isDark
                        ? "1px solid rgba(245, 158, 11, 0.35)"
                        : "1px solid #FBE6B8",
                    fontWeight: 700,
                  }}
                >
                  {profileState === "COMPLETE" ? "● Active Placement Profile" : "● Setup Incomplete"}
                </span>
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: isDark ? "#B6C4D6" : "#667085",
                  marginTop: 4,
                  marginBottom: 0,
                  fontWeight: 500,
                }}
              >
                Evidence-grounded career command center connecting real target roles, verified proof, opportunities, and outcomes.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => setShowAddProofModal(true)}
              style={{
                padding: "8px 16px",
                backgroundColor: isDark ? "#13243A" : "#FFFFFF",
                border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                borderRadius: 8,
                color: isDark ? "#E5EEFA" : "#162A43",
                fontSize: 13,
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(16, 24, 40, 0.04)",
              }}
            >
              <Plus style={{ width: 14, height: 14, color: "#356AE6" }} />
              Add Proof Item
            </button>
            <button
              onClick={() => setShowAddOfferModal(true)}
              style={{
                padding: "8px 16px",
                backgroundColor: isDark ? "#13243A" : "#FFFFFF",
                border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                borderRadius: 8,
                color: isDark ? "#E5EEFA" : "#162A43",
                fontSize: 13,
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(16, 24, 40, 0.04)",
              }}
            >
              <Award style={{ width: 14, height: 14, color: "#2E7D5B" }} />
              Record Offer
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              style={{
                padding: "8px 20px",
                backgroundColor: "#356AE6",
                border: "none",
                borderRadius: 8,
                color: "white",
                fontSize: 13,
                fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 2px 6px rgba(53, 106, 230, 0.25)",
              }}
            >
              <Save style={{ width: 14, height: 14 }} />
              {saving ? "Saving..." : "Save Identity"}
            </button>
          </div>
        </div>

        {/* Feedback Alerts */}
        {saveSuccessMsg && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: 8,
              backgroundColor: isDark ? "rgba(46, 125, 91, 0.2)" : "#EAF4EE",
              border: isDark ? "1px solid rgba(72, 199, 142, 0.3)" : "1px solid #C8E4D3",
              color: isDark ? "#48C78E" : "#2E7D5B",
              fontSize: 13,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 18,
            }}
          >
            <CheckCircle2 style={{ width: 16, height: 16 }} />
            {saveSuccessMsg}
          </div>
        )}
        {errorMsg && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: 8,
              backgroundColor: isDark ? "rgba(225, 29, 72, 0.2)" : "#FEF3F2",
              border: isDark ? "1px solid rgba(225, 29, 72, 0.3)" : "1px solid #FECDCA",
              color: isDark ? "#FB7185" : "#D92D20",
              fontSize: 13,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 18,
            }}
          >
            <AlertCircle style={{ width: 16, height: 16 }} />
            {errorMsg}
          </div>
        )}

        {/* Navigation Tabs Bar */}
        <div
          style={{
            backgroundColor: isDark ? "#13243A" : "#FFFFFF",
            border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
            borderRadius: 10,
            padding: 4,
            display: "flex",
            gap: 4,
            marginBottom: 24,
            overflowX: "auto",
            boxShadow: "0 1px 3px rgba(16, 24, 40, 0.04)",
          }}
        >
          {[
            { id: "overview", label: "Placement Overview", icon: Compass },
            { id: "identity", label: "Placement Identity", icon: Target },
            { id: "portfolio", label: `Proof Portfolio (${proofPortfolio.length})`, icon: ShieldCheck },
            { id: "opportunities", label: `Opportunities (${opportunities.length})`, icon: Briefcase },
            { id: "roadmap", label: "Roadmap & Gaps", icon: Sparkles },
            { id: "interviews", label: "Interview Intelligence", icon: Code2 },
            { id: "applications", label: `Applications (${applications.length})`, icon: Send },
            { id: "outcomes", label: `Offers & Outcomes (${offers.length})`, icon: Award },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as PlacementTab)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "8px 14px",
                  borderRadius: 7,
                  border: isActive ? (isDark ? "1px solid #2D588E" : "1px solid #D2E0FB") : "1px solid transparent",
                  backgroundColor: isActive ? (isDark ? "#17335C" : "#EFF4FE") : "transparent",
                  color: isActive ? (isDark ? "#60A5FA" : "#356AE6") : isDark ? "#94A3B8" : "#667085",
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 12,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  transition: "all 0.12s ease",
                }}
              >
                <Icon style={{ width: 14, height: 14 }} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB 1: PLACEMENT OVERVIEW (Answers the 4 Core Questions)   */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* 4 Cards Answering the 4 Core Questions */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 }}>
              {/* Card 1: Where do I stand? */}
              <div
                style={{
                  backgroundColor: isDark ? "#13243A" : "#FFFFFF",
                  border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                  borderRadius: 12,
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  boxShadow: "0 1px 3px rgba(16, 24, 40, 0.04)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#356AE6", textTransform: "uppercase" }}>
                    1. Role Readiness
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 10,
                      backgroundColor: isDark ? "rgba(53, 106, 230, 0.2)" : "#EFF4FE",
                      color: "#356AE6",
                    }}
                  >
                    {overview?.evidenceCoveragePercent || 0}% Coverage
                  </span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: isDark ? "#F2F6FC" : "#162A43" }}>
                  {overview?.readinessLevel || "Analyzing..."}
                </h3>
                <p style={{ fontSize: 12, color: isDark ? "#94A3B8" : "#667085", margin: 0 }}>
                  Target Role: <strong>{overview?.targetRole}</strong>
                </p>
                <div style={{ fontSize: 11, color: overview?.criticalBlockersCount ? "#D92D20" : "#2E7D5B", fontWeight: 600 }}>
                  {overview?.criticalBlockersCount
                    ? `⚠ ${overview.criticalBlockersCount} eligibility blocker(s) require attention`
                    : "✓ No hard academic eligibility blockers"}
                </div>
              </div>

              {/* Card 2: Which real opportunities are actionable? */}
              <div
                style={{
                  backgroundColor: isDark ? "#13243A" : "#FFFFFF",
                  border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                  borderRadius: 12,
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  boxShadow: "0 1px 3px rgba(16, 24, 40, 0.04)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#2E7D5B", textTransform: "uppercase" }}>
                    2. Actionable Listings
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 10,
                      backgroundColor: isDark ? "rgba(46, 125, 91, 0.2)" : "#EAF4EE",
                      color: "#2E7D5B",
                    }}
                  >
                    {overview?.actionableOpportunitiesCount || 0} Ready
                  </span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: isDark ? "#F2F6FC" : "#162A43" }}>
                  {overview?.actionableOpportunitiesCount || 0} Matched & Eligible
                </h3>
                <p style={{ fontSize: 12, color: isDark ? "#94A3B8" : "#667085", margin: 0 }}>
                  Out of {overview?.activeOpportunitiesCount || 0} active canonical listings in repository.
                </p>
                <button
                  onClick={() => setActiveTab("opportunities")}
                  style={{
                    alignSelf: "flex-start",
                    background: "none",
                    border: "none",
                    color: "#356AE6",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  Explore Matched Feed ➔
                </button>
              </div>

              {/* Card 3: What should I do next? */}
              <div
                style={{
                  backgroundColor: isDark ? "#13243A" : "#FFFFFF",
                  border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                  borderRadius: 12,
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  boxShadow: "0 1px 3px rgba(16, 24, 40, 0.04)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#7935E6", textTransform: "uppercase" }}>
                    3. Recommended Action
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 10,
                      backgroundColor: isDark ? "rgba(121, 53, 230, 0.2)" : "#F4EFFE",
                      color: "#7935E6",
                    }}
                  >
                    High Priority
                  </span>
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: isDark ? "#F2F6FC" : "#162A43", lineHeight: 1.3 }}>
                  {overview?.topAction.title || "Review Placement Roadmap"}
                </h3>
                <p style={{ fontSize: 11, color: isDark ? "#94A3B8" : "#667085", margin: 0 }}>
                  {overview?.topAction.reason}
                </p>
                <Link
                  href={overview?.topAction.ctaHref || "/student/skills"}
                  style={{
                    alignSelf: "flex-start",
                    color: "#356AE6",
                    fontSize: 12,
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  {overview?.topAction.ctaLabel || "Start Action"} ➔
                </Link>
              </div>

              {/* Card 4: How are my applications progressing? */}
              <div
                style={{
                  backgroundColor: isDark ? "#13243A" : "#FFFFFF",
                  border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                  borderRadius: 12,
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  boxShadow: "0 1px 3px rgba(16, 24, 40, 0.04)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#B54708", textTransform: "uppercase" }}>
                    4. Application Pipeline
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 10,
                      backgroundColor: isDark ? "rgba(245, 158, 11, 0.2)" : "#FEF7E6",
                      color: "#B54708",
                    }}
                  >
                    {offers.length} Offer(s)
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", textAlign: "center" }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: isDark ? "#F2F6FC" : "#162A43" }}>
                      {overview?.applicationPipelineSummary.saved || 0}
                    </div>
                    <div style={{ fontSize: 10, color: isDark ? "#94A3B8" : "#667085" }}>Saved</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#356AE6" }}>
                      {overview?.applicationPipelineSummary.applied || 0}
                    </div>
                    <div style={{ fontSize: 10, color: isDark ? "#94A3B8" : "#667085" }}>Applied</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#7935E6" }}>
                      {overview?.applicationPipelineSummary.interviewing || 0}
                    </div>
                    <div style={{ fontSize: 10, color: isDark ? "#94A3B8" : "#667085" }}>Interview</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#2E7D5B" }}>
                      {overview?.applicationPipelineSummary.offers || 0}
                    </div>
                    <div style={{ fontSize: 10, color: isDark ? "#94A3B8" : "#667085" }}>Offers</div>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("applications")}
                  style={{
                    alignSelf: "flex-start",
                    background: "none",
                    border: "none",
                    color: "#356AE6",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  View Full Pipeline ➔
                </button>
              </div>
            </div>

            {/* Top Matched Opportunities Snapshot */}
            <div
              style={{
                backgroundColor: isDark ? "#13243A" : "#FFFFFF",
                border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                borderRadius: 12,
                padding: 24,
                boxShadow: "0 1px 3px rgba(16, 24, 40, 0.04)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: isDark ? "#F2F6FC" : "#162A43", margin: 0 }}>
                    Top Matched Opportunities (Explainable Fit)
                  </h3>
                  <p style={{ fontSize: 12, color: isDark ? "#94A3B8" : "#667085", margin: "2px 0 0" }}>
                    Ranked by role alignment, verified skills, and academic eligibility criteria.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("opportunities")}
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    color: "#356AE6",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  View All ({opportunities.length}) ➔
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
                {opportunities.slice(0, 3).map((match) => (
                  <div
                    key={match.opportunity.id}
                    style={{
                      backgroundColor: isDark ? "#0D1829" : "#FBFBF9",
                      border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                      borderRadius: 10,
                      padding: 16,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: isDark ? "#F2F6FC" : "#162A43" }}>
                          {match.opportunity.title}
                        </span>
                        {getEligibilityBadge(match.eligibility.overallStatus)}
                      </div>
                      <div style={{ fontSize: 12, color: isDark ? "#94A3B8" : "#667085", marginTop: 4 }}>
                        🏢 {match.opportunity.companyName} • 📍 {match.opportunity.location}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#356AE6" }}>
                          {match.matchScore}% Match
                        </span>
                        <span style={{ fontSize: 11, color: isDark ? "#94A3B8" : "#667085" }}>•</span>
                        <span style={{ fontSize: 11, color: isDark ? "#94A3B8" : "#667085" }}>
                          {match.whyItMatches[0] || "Aligned role domain"}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                      <button
                        onClick={() => setSelectedMatchModal(match)}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: isDark ? "#1E293B" : "#F4F5F7",
                          border: isDark ? "1px solid #334155" : "1px solid #E4E7EC",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          color: isDark ? "#E2E8F0" : "#344054",
                          cursor: "pointer",
                        }}
                      >
                        Explain Match
                      </button>
                      <button
                        onClick={() => handleApplyClick(match)}
                        style={{
                          flex: 1,
                          padding: "6px 12px",
                          backgroundColor: "#356AE6",
                          border: "none",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          color: "white",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4,
                        }}
                      >
                        Apply Directly
                        <ExternalLink style={{ width: 12, height: 12 }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB 2: MY PLACEMENT IDENTITY                               */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "identity" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(480px, 1fr))", gap: 24 }}>
              {/* Academic Context Card */}
              <div
                style={{
                  backgroundColor: isDark ? "#13243A" : "#FFFFFF",
                  border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                  borderRadius: 12,
                  padding: 24,
                  boxShadow: "0 1px 3px rgba(16, 24, 40, 0.04)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      backgroundColor: isDark ? "rgba(53, 106, 230, 0.2)" : "#EFF4FE",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#356AE6",
                    }}
                  >
                    <GraduationCap style={{ width: 18, height: 18 }} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: isDark ? "#F2F6FC" : "#162A43", margin: 0 }}>
                      Academic Eligibility Context
                    </h2>
                    <p style={{ fontSize: 12, color: isDark ? "#B6C4D6" : "#667085", margin: 0 }}>
                      Institutional records used for deterministic corporate drive eligibility
                    </p>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: isDark ? "#94A3B8" : "#667085", marginBottom: 6 }}>
                    College / University
                  </label>
                  <input
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="e.g. Indian Institute of Technology / NIT / BITS"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      backgroundColor: isDark ? "#0D1829" : "#FFFFFF",
                      border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                      borderRadius: 7,
                      color: isDark ? "#F2F6FC" : "#17191C",
                      fontSize: 13,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: isDark ? "#94A3B8" : "#667085", marginBottom: 6 }}>
                      Degree
                    </label>
                    <input
                      type="text"
                      value={degree}
                      onChange={(e) => setDegree(e.target.value)}
                      placeholder="B.Tech"
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        backgroundColor: isDark ? "#0D1829" : "#FFFFFF",
                        border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                        borderRadius: 7,
                        color: isDark ? "#F2F6FC" : "#17191C",
                        fontSize: 13,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: isDark ? "#94A3B8" : "#667085", marginBottom: 6 }}>
                      Graduation Year
                    </label>
                    <input
                      type="text"
                      value={graduationYear}
                      onChange={(e) => setGraduationYear(e.target.value)}
                      placeholder="2026"
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        backgroundColor: isDark ? "#0D1829" : "#FFFFFF",
                        border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                        borderRadius: 7,
                        color: isDark ? "#F2F6FC" : "#17191C",
                        fontSize: 13,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: isDark ? "#94A3B8" : "#667085", marginBottom: 6 }}>
                      Branch / Major
                    </label>
                    <input
                      type="text"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      placeholder="Computer Science & Engineering"
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        backgroundColor: isDark ? "#0D1829" : "#FFFFFF",
                        border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                        borderRadius: 7,
                        color: isDark ? "#F2F6FC" : "#17191C",
                        fontSize: 13,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: isDark ? "#94A3B8" : "#667085", marginBottom: 6 }}>
                      CGPA / Percentage
                    </label>
                    <input
                      type="text"
                      value={cgpa}
                      onChange={(e) => setCgpa(e.target.value)}
                      placeholder="e.g. 8.5"
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        backgroundColor: isDark ? "#0D1829" : "#FFFFFF",
                        border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                        borderRadius: 7,
                        color: isDark ? "#F2F6FC" : "#17191C",
                        fontSize: 13,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Target Roles & Aspirations Card */}
              <div
                style={{
                  backgroundColor: isDark ? "#13243A" : "#FFFFFF",
                  border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                  borderRadius: 12,
                  padding: 24,
                  boxShadow: "0 1px 3px rgba(16, 24, 40, 0.04)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      backgroundColor: isDark ? "rgba(121, 53, 230, 0.2)" : "#F4EFFE",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#7935E6",
                    }}
                  >
                    <Target style={{ width: 18, height: 18 }} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: isDark ? "#F2F6FC" : "#162A43", margin: 0 }}>
                      Target Roles & Aspirations
                    </h2>
                    <p style={{ fontSize: 12, color: isDark ? "#B6C4D6" : "#667085", margin: 0 }}>
                      Placement target positions and prioritized organizations
                    </p>
                  </div>
                </div>

                {/* Target Roles */}
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: isDark ? "#94A3B8" : "#667085", marginBottom: 6 }}>
                    Target Roles
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                    {targetRoles.map((role, idx) => (
                      <span
                        key={idx}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "4px 10px",
                          borderRadius: 6,
                          backgroundColor: isDark ? "rgba(121, 53, 230, 0.2)" : "#F4EFFE",
                          border: isDark ? "1px solid rgba(121, 53, 230, 0.35)" : "1px solid #E4D5FB",
                          color: isDark ? "#C084FC" : "#7935E6",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {role}
                        <button
                          type="button"
                          onClick={() => setTargetRoles(targetRoles.filter((_, i) => i !== idx))}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: isDark ? "#C084FC" : "#7935E6",
                            cursor: "pointer",
                            padding: 0,
                            lineHeight: 1,
                            fontSize: 14,
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="text"
                      value={newRoleInput}
                      onChange={(e) => setNewRoleInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), (newRoleInput.trim() && setTargetRoles([...targetRoles, newRoleInput.trim()]), setNewRoleInput("")))}
                      placeholder="Add role (e.g. Backend Engineer)"
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        backgroundColor: isDark ? "#0D1829" : "#FFFFFF",
                        border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                        borderRadius: 7,
                        color: isDark ? "#F2F6FC" : "#17191C",
                        fontSize: 13,
                        outline: "none",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => (newRoleInput.trim() && setTargetRoles([...targetRoles, newRoleInput.trim()]), setNewRoleInput(""))}
                      style={{
                        padding: "8px 14px",
                        backgroundColor: isDark ? "#1E293B" : "#F4F5F7",
                        border: isDark ? "1px solid #334155" : "1px solid #E4E7EC",
                        borderRadius: 7,
                        color: isDark ? "#E2E8F0" : "#344054",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Target Companies */}
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: isDark ? "#94A3B8" : "#667085", marginBottom: 6 }}>
                    Target Companies
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                    {targetCompanies.map((comp, idx) => (
                      <span
                        key={idx}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "4px 10px",
                          borderRadius: 6,
                          backgroundColor: isDark ? "rgba(53, 106, 230, 0.2)" : "#EFF4FE",
                          border: isDark ? "1px solid rgba(53, 106, 230, 0.35)" : "1px solid #D2E0FB",
                          color: isDark ? "#60A5FA" : "#356AE6",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {comp}
                        <button
                          type="button"
                          onClick={() => setTargetCompanies(targetCompanies.filter((_, i) => i !== idx))}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: isDark ? "#60A5FA" : "#356AE6",
                            cursor: "pointer",
                            padding: 0,
                            lineHeight: 1,
                            fontSize: 14,
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="text"
                      value={newCompanyInput}
                      onChange={(e) => setNewCompanyInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), (newCompanyInput.trim() && setTargetCompanies([...targetCompanies, newCompanyInput.trim()]), setNewCompanyInput("")))}
                      placeholder="Add company (e.g. Google, Flipkart)"
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        backgroundColor: isDark ? "#0D1829" : "#FFFFFF",
                        border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                        borderRadius: 7,
                        color: isDark ? "#F2F6FC" : "#17191C",
                        fontSize: 13,
                        outline: "none",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => (newCompanyInput.trim() && setTargetCompanies([...targetCompanies, newCompanyInput.trim()]), setNewCompanyInput(""))}
                      style={{
                        padding: "8px 14px",
                        backgroundColor: isDark ? "#1E293B" : "#F4F5F7",
                        border: isDark ? "1px solid #334155" : "1px solid #E4E7EC",
                        borderRadius: 7,
                        color: isDark ? "#E2E8F0" : "#344054",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Daily prep time slider */}
                <div style={{ marginTop: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: isDark ? "#94A3B8" : "#667085" }}>
                      Daily Preparation Commitment
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#356AE6" }}>
                      {dailyPrepMinutes} mins / day
                    </span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="240"
                    step="15"
                    value={dailyPrepMinutes}
                    onChange={(e) => setDailyPrepMinutes(Number(e.target.value))}
                    style={{ width: "100%", accentColor: "#356AE6", cursor: "pointer" }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB 3: MY PROOF PORTFOLIO (4 Distinct Verification Tiers)  */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "portfolio" && (
          <div
            style={{
              backgroundColor: isDark ? "#13243A" : "#FFFFFF",
              border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
              borderRadius: 12,
              padding: 24,
              boxShadow: "0 1px 3px rgba(16, 24, 40, 0.04)",
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: isDark ? "#F2F6FC" : "#162A43", margin: 0 }}>
                  Evidence-Grounded Proof Portfolio
                </h2>
                <p style={{ fontSize: 12, color: isDark ? "#B6C4D6" : "#667085", margin: "4px 0 0" }}>
                  Rigorous separation of self-reported claims from verified compiler executions, commit histories, and assessments.
                </p>
              </div>
              <button
                onClick={() => setShowAddProofModal(true)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#356AE6",
                  border: "none",
                  borderRadius: 7,
                  color: "white",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Plus style={{ width: 14, height: 14 }} />
                Add Proof Evidence
              </button>
            </div>

            {proofPortfolio.length === 0 ? (
              <div
                style={{
                  padding: 40,
                  textAlign: "center",
                  backgroundColor: isDark ? "#0D1829" : "#FBFBF9",
                  borderRadius: 10,
                  border: isDark ? "1px dashed #2A435F" : "1px dashed #D2E0FB",
                }}
              >
                <ShieldCheck style={{ width: 36, height: 36, color: "#356AE6", margin: "0 auto 12px" }} />
                <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: isDark ? "#F2F6FC" : "#162A43" }}>
                  No Verified Proof Items Registered Yet
                </h4>
                <p style={{ fontSize: 12, color: isDark ? "#94A3B8" : "#667085", maxWidth: 450, margin: "6px auto 16px" }}>
                  Add your GitHub repositories, deployed demos, or complete practice assessments in the Skill Hub to build verified placement proof.
                </p>
                <button
                  onClick={() => setShowAddProofModal(true)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#356AE6",
                    border: "none",
                    borderRadius: 7,
                    color: "white",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Register First Proof Item
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
                {proofPortfolio.map((proof) => (
                  <div
                    key={proof.id}
                    style={{
                      backgroundColor: isDark ? "#0D1829" : "#FFFFFF",
                      border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                      borderRadius: 10,
                      padding: 18,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 12,
                      boxShadow: "0 1px 2px rgba(16, 24, 40, 0.02)",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: isDark ? "#F2F6FC" : "#162A43" }}>
                          {proof.title}
                        </span>
                        {getTierBadge(proof.verificationTier)}
                      </div>
                      <div style={{ fontSize: 11, color: isDark ? "#94A3B8" : "#667085", marginTop: 4 }}>
                        Claim: <strong>{proof.skillOrClaim}</strong> • Method: {proof.verificationMethod}
                      </div>
                      {proof.description && (
                        <p style={{ fontSize: 12, color: isDark ? "#B6C4D6" : "#475467", margin: "8px 0 0", lineHeight: 1.4 }}>
                          {proof.description}
                        </p>
                      )}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: isDark ? "1px solid #1E293B" : "1px solid #F2F4F7", paddingTop: 10, fontSize: 11 }}>
                      <span style={{ color: "#356AE6", fontWeight: 600 }}>
                        Confidence: {proof.confidenceScore}%
                      </span>
                      {proof.sourceUrl && (
                        <a
                          href={proof.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: isDark ? "#94A3B8" : "#667085",
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          Source Link <ExternalLink style={{ width: 11, height: 11 }} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB 4: PERSONALIZED OPPORTUNITIES & ROLE MATCH             */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "opportunities" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Filter Bar */}
            <div
              style={{
                backgroundColor: isDark ? "#13243A" : "#FFFFFF",
                border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                borderRadius: 10,
                padding: "14px 18px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: isDark ? "#94A3B8" : "#667085", textTransform: "uppercase" }}>
                  Filters:
                </span>
                <select
                  value={oppCategoryFilter}
                  onChange={(e) => setOppCategoryFilter(e.target.value)}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: isDark ? "#0D1829" : "#FFFFFF",
                    border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                    borderRadius: 6,
                    color: isDark ? "#F2F6FC" : "#17191C",
                    fontSize: 12,
                    outline: "none",
                  }}
                >
                  <option value="ALL">All Opportunity Types</option>
                  <option value="FULL_TIME">Full-Time Jobs</option>
                  <option value="INTERNSHIP">Internships</option>
                  <option value="HACKATHON">Hackathons & Challenges</option>
                  <option value="RESEARCH">Research & Fellowships</option>
                </select>

                <select
                  value={oppEligibilityFilter}
                  onChange={(e) => setOppEligibilityFilter(e.target.value)}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: isDark ? "#0D1829" : "#FFFFFF",
                    border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                    borderRadius: 6,
                    color: isDark ? "#F2F6FC" : "#17191C",
                    fontSize: 12,
                    outline: "none",
                  }}
                >
                  <option value="ALL">All Eligibility Statuses</option>
                  <option value="ELIGIBLE">Eligible Only</option>
                  <option value="POTENTIALLY_ELIGIBLE">Needs Confirmation</option>
                  <option value="INELIGIBLE">Ineligible</option>
                </select>
              </div>

              <div style={{ fontSize: 12, color: isDark ? "#94A3B8" : "#667085" }}>
                Showing <strong>{filteredOpps.length}</strong> canonical opportunities
              </div>
            </div>

            {/* Opportunities List */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {filteredOpps.map((match) => (
                <div
                  key={match.opportunity.id}
                  style={{
                    backgroundColor: isDark ? "#13243A" : "#FFFFFF",
                    border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                    borderRadius: 12,
                    padding: 20,
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                    boxShadow: "0 1px 3px rgba(16, 24, 40, 0.04)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: isDark ? "#F2F6FC" : "#162A43", margin: 0 }}>
                          {match.opportunity.title}
                        </h3>
                        {getEligibilityBadge(match.eligibility.overallStatus)}
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: 10,
                            backgroundColor: isDark ? "rgba(53, 106, 230, 0.2)" : "#EFF4FE",
                            color: "#356AE6",
                          }}
                        >
                          {match.matchScore}% Relevance
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: isDark ? "#94A3B8" : "#667085", marginTop: 4 }}>
                        🏢 <strong>{match.opportunity.companyName}</strong> • 📍 {match.opportunity.location} ({match.opportunity.remoteType}) • ⏳ Deadline: {match.opportunity.deadline || "Open until filled"}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => setSelectedMatchModal(match)}
                        style={{
                          padding: "8px 14px",
                          backgroundColor: isDark ? "#1E293B" : "#F4F5F7",
                          border: isDark ? "1px solid #334155" : "1px solid #E4E7EC",
                          borderRadius: 7,
                          fontSize: 12,
                          fontWeight: 600,
                          color: isDark ? "#E2E8F0" : "#344054",
                          cursor: "pointer",
                        }}
                      >
                        Explain Eligibility & Match
                      </button>
                      <button
                        onClick={() => handleApplyClick(match)}
                        style={{
                          padding: "8px 18px",
                          backgroundColor: "#356AE6",
                          border: "none",
                          borderRadius: 7,
                          fontSize: 12,
                          fontWeight: 600,
                          color: "white",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          boxShadow: "0 2px 5px rgba(53, 106, 230, 0.2)",
                        }}
                      >
                        Apply Directly
                        <ExternalLink style={{ width: 13, height: 13 }} />
                      </button>
                    </div>
                  </div>

                  {/* Match Explanation Snippet */}
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: 8,
                      backgroundColor: isDark ? "#0D1829" : "#FBFBF9",
                      border: isDark ? "1px solid #1E293B" : "1px solid #E4E7EC",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      fontSize: 12,
                    }}
                  >
                    <div style={{ color: isDark ? "#E2E8F0" : "#344054", fontWeight: 600 }}>
                      Why this matches: {match.whyItMatches.join(" • ")}
                    </div>
                    <div style={{ color: isDark ? "#94A3B8" : "#667085", fontSize: 11 }}>
                      Next Action: {match.nextRecommendedAction}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB 5: ROADMAP & GAPS                                      */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "roadmap" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Gap Analysis Summary Card */}
            <div
              style={{
                backgroundColor: isDark ? "#13243A" : "#FFFFFF",
                border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                borderRadius: 12,
                padding: 24,
                boxShadow: "0 1px 3px rgba(16, 24, 40, 0.04)",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: isDark ? "#F2F6FC" : "#162A43", margin: 0 }}>
                  Target Role Gap Analysis ({gapAnalysis?.targetRole})
                </h2>
                <p style={{ fontSize: 12, color: isDark ? "#B6C4D6" : "#667085", margin: "4px 0 0" }}>
                  Rigorous comparison of your verified evidence against corporate hiring expectations.
                </p>
              </div>

              {gapAnalysis?.hardBlockers && gapAnalysis.hardBlockers.length > 0 && (
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: 8,
                    backgroundColor: isDark ? "rgba(225, 29, 72, 0.15)" : "#FEF3F2",
                    border: isDark ? "1px solid rgba(225, 29, 72, 0.3)" : "1px solid #FECDCA",
                    color: isDark ? "#FB7185" : "#D92D20",
                    fontSize: 12,
                  }}
                >
                  <strong>Hard Eligibility Blockers:</strong>
                  <ul style={{ margin: "4px 0 0", paddingLeft: 20 }}>
                    {gapAnalysis.hardBlockers.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "#B54708", margin: "0 0 8px" }}>
                    Missing Technical Skills
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: isDark ? "#B6C4D6" : "#475467" }}>
                    {gapAnalysis?.missingSkills.map((s, i) => (
                      <li key={i} style={{ marginBottom: 4 }}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "#7935E6", margin: "0 0 8px" }}>
                    Interview Readiness Gaps
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: isDark ? "#B6C4D6" : "#475467" }}>
                    {gapAnalysis?.interviewReadinessGaps.map((s, i) => (
                      <li key={i} style={{ marginBottom: 4 }}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Prioritized Actionable Tasks */}
            <div
              style={{
                backgroundColor: isDark ? "#13243A" : "#FFFFFF",
                border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                borderRadius: 12,
                padding: 24,
                boxShadow: "0 1px 3px rgba(16, 24, 40, 0.04)",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 700, color: isDark ? "#F2F6FC" : "#162A43", margin: 0 }}>
                Prioritized Action Plan to Close Gaps
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {gapAnalysis?.prioritizedActions.map((act) => (
                  <div
                    key={act.id}
                    style={{
                      backgroundColor: isDark ? "#0D1829" : "#FFFFFF",
                      border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                      borderRadius: 10,
                      padding: "16px 20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 280 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: isDark ? "#F2F6FC" : "#162A43" }}>
                          {act.title}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            padding: "2px 8px",
                            borderRadius: 10,
                            backgroundColor: act.priority === "high" ? (isDark ? "rgba(225, 29, 72, 0.2)" : "#FEF3F2") : isDark ? "rgba(245, 158, 11, 0.2)" : "#FEF7E6",
                            color: act.priority === "high" ? "#D92D20" : "#B54708",
                          }}
                        >
                          {act.priority} Priority
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: isDark ? "#B6C4D6" : "#667085", margin: "4px 0" }}>
                        {act.reason}
                      </p>
                      <div style={{ fontSize: 11, color: isDark ? "#94A3B8" : "#98A2B3" }}>
                        Criteria: {act.completionCriteria} • Est. Time: {act.estimatedMinutes} mins
                      </div>
                    </div>

                    <Link
                      href={act.ctaHref}
                      style={{
                        padding: "8px 18px",
                        backgroundColor: "#356AE6",
                        borderRadius: 7,
                        color: "white",
                        fontSize: 12,
                        fontWeight: 600,
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        boxShadow: "0 2px 6px rgba(53, 106, 230, 0.2)",
                      }}
                    >
                      <span>{act.ctaLabel}</span>
                      <ArrowRight style={{ width: 14, height: 14 }} />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB 6: INTERVIEW INTELLIGENCE                              */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "interviews" && (
          <div
            style={{
              backgroundColor: isDark ? "#13243A" : "#FFFFFF",
              border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
              borderRadius: 12,
              padding: 24,
              boxShadow: "0 1px 3px rgba(16, 24, 40, 0.04)",
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: isDark ? "#F2F6FC" : "#162A43", margin: 0 }}>
                Personalized Interview Intelligence
              </h2>
              <p style={{ fontSize: 12, color: isDark ? "#B6C4D6" : "#667085", margin: "4px 0 0" }}>
                Targeted preparation tailored to your dream companies ({targetCompanies.join(", ")}) and target roles.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
              <div
                style={{
                  backgroundColor: isDark ? "#0D1829" : "#FBFBF9",
                  border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                  borderRadius: 10,
                  padding: 18,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: isDark ? "#F2F6FC" : "#162A43" }}>
                    Custom Multi-Subject Interview
                  </h4>
                  <p style={{ fontSize: 12, color: isDark ? "#94A3B8" : "#667085", margin: "6px 0 0" }}>
                    Simulate full corporate placement rounds across DSA, OS, DBMS, SQL, and Architecture with question freezing and final-only scorecards.
                  </p>
                </div>
                <Link
                  href="/student/skills?openInterview=custom"
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#356AE6",
                    borderRadius: 7,
                    color: "white",
                    fontSize: 12,
                    fontWeight: 600,
                    textDecoration: "none",
                    textAlign: "center",
                  }}
                >
                  Configure & Start Interview ➔
                </Link>
              </div>

              <div
                style={{
                  backgroundColor: isDark ? "#0D1829" : "#FBFBF9",
                  border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                  borderRadius: 10,
                  padding: 18,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: isDark ? "#F2F6FC" : "#162A43" }}>
                    CS Fundamentals Core Curriculum
                  </h4>
                  <p style={{ fontSize: 12, color: isDark ? "#94A3B8" : "#667085", margin: "6px 0 0" }}>
                    Master OS Virtual Memory, DBMS ACID/Normalization, SQL Window Functions, and Network Handshakes.
                  </p>
                </div>
                <Link
                  href="/student/skills/cs-interview?subject=dbms"
                  style={{
                    padding: "8px 16px",
                    backgroundColor: isDark ? "#17335C" : "#EFF4FE",
                    border: isDark ? "1px solid #2D588E" : "1px solid #D2E0FB",
                    borderRadius: 7,
                    color: "#356AE6",
                    fontSize: 12,
                    fontWeight: 600,
                    textDecoration: "none",
                    textAlign: "center",
                  }}
                >
                  Open CS Fundamentals ➔
                </Link>
              </div>

              <div
                style={{
                  backgroundColor: isDark ? "#0D1829" : "#FBFBF9",
                  border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                  borderRadius: 10,
                  padding: 18,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: isDark ? "#F2F6FC" : "#162A43" }}>
                    Live DSA Execution Arena
                  </h4>
                  <p style={{ fontSize: 12, color: isDark ? "#94A3B8" : "#667085", margin: "6px 0 0" }}>
                    Verified compiler executions on answer space binary search, trees, graphs, and dynamic programming.
                  </p>
                </div>
                <Link
                  href="/student/skills/dsa"
                  style={{
                    padding: "8px 16px",
                    backgroundColor: isDark ? "#17335C" : "#EFF4FE",
                    border: isDark ? "1px solid #2D588E" : "1px solid #D2E0FB",
                    borderRadius: 7,
                    color: "#356AE6",
                    fontSize: 12,
                    fontWeight: 600,
                    textDecoration: "none",
                    textAlign: "center",
                  }}
                >
                  Open DSA Arena ➔
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB 7: MY APPLICATIONS & PIPELINE                          */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "applications" && (
          <div
            style={{
              backgroundColor: isDark ? "#13243A" : "#FFFFFF",
              border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
              borderRadius: 12,
              padding: 24,
              boxShadow: "0 1px 3px rgba(16, 24, 40, 0.04)",
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: isDark ? "#F2F6FC" : "#162A43", margin: 0 }}>
                My Applications & Placement Pipeline
              </h2>
              <p style={{ fontSize: 12, color: isDark ? "#B6C4D6" : "#667085", margin: "4px 0 0" }}>
                Candidate-controlled tracker recording genuine applications, scheduled interviews, and feedback.
              </p>
            </div>

            {applications.length === 0 ? (
              <div
                style={{
                  padding: 40,
                  textAlign: "center",
                  backgroundColor: isDark ? "#0D1829" : "#FBFBF9",
                  borderRadius: 10,
                  border: isDark ? "1px dashed #2A435F" : "1px dashed #D2E0FB",
                }}
              >
                <Send style={{ width: 36, height: 36, color: "#356AE6", margin: "0 auto 12px" }} />
                <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: isDark ? "#F2F6FC" : "#162A43" }}>
                  No Applications in Active Pipeline
                </h4>
                <p style={{ fontSize: 12, color: isDark ? "#94A3B8" : "#667085", maxWidth: 450, margin: "6px auto 16px" }}>
                  When you apply to opportunities through Cognalyze or external career portals, record them here to track progression.
                </p>
                <button
                  onClick={() => setActiveTab("opportunities")}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#356AE6",
                    border: "none",
                    borderRadius: 7,
                    color: "white",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Browse Matched Opportunities
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {applications.map((app, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: isDark ? "#0D1829" : "#FFFFFF",
                      border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                      borderRadius: 10,
                      padding: "16px 20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: isDark ? "#F2F6FC" : "#162A43" }}>
                          {app.opportunity?.title || app.record?.opportunityId}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: 10,
                            backgroundColor: isDark ? "rgba(53, 106, 230, 0.2)" : "#EFF4FE",
                            color: "#356AE6",
                          }}
                        >
                          Stage: {app.record?.stage}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: isDark ? "#94A3B8" : "#667085", marginTop: 4 }}>
                        🏢 {app.opportunity?.companyName || "Organization"} • Last Updated: {new Date(app.record?.updatedAt).toLocaleDateString()}
                      </div>
                      {app.record?.notes && (
                        <p style={{ fontSize: 11, color: isDark ? "#B6C4D6" : "#475467", margin: "6px 0 0" }}>
                          Note: {app.record.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB 8: OFFERS & OUTCOMES                                   */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === "outcomes" && (
          <div
            style={{
              backgroundColor: isDark ? "#13243A" : "#FFFFFF",
              border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
              borderRadius: 12,
              padding: 24,
              boxShadow: "0 1px 3px rgba(16, 24, 40, 0.04)",
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: isDark ? "#F2F6FC" : "#162A43", margin: 0 }}>
                  Verified Offers & Joining Records
                </h2>
                <p style={{ fontSize: 12, color: isDark ? "#B6C4D6" : "#667085", margin: "4px 0 0" }}>
                  Private outcome tracking with document-supported verification levels.
                </p>
              </div>
              <button
                onClick={() => setShowAddOfferModal(true)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#2E7D5B",
                  border: "none",
                  borderRadius: 7,
                  color: "white",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Plus style={{ width: 14, height: 14 }} />
                Record Offer
              </button>
            </div>

            {offers.length === 0 ? (
              <div
                style={{
                  padding: 40,
                  textAlign: "center",
                  backgroundColor: isDark ? "#0D1829" : "#FBFBF9",
                  borderRadius: 10,
                  border: isDark ? "1px dashed #2A435F" : "1px dashed #D2E0FB",
                }}
              >
                <Award style={{ width: 36, height: 36, color: "#2E7D5B", margin: "0 auto 12px" }} />
                <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: isDark ? "#F2F6FC" : "#162A43" }}>
                  No Offers Recorded Yet
                </h4>
                <p style={{ fontSize: 12, color: isDark ? "#94A3B8" : "#667085", maxWidth: 450, margin: "6px auto 16px" }}>
                  When you receive an internship or placement offer, log it privately with your compensation details and verification documents.
                </p>
                <button
                  onClick={() => setShowAddOfferModal(true)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#2E7D5B",
                    border: "none",
                    borderRadius: 7,
                    color: "white",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Log Offer Details
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
                {offers.map((offer) => (
                  <div
                    key={offer.id}
                    style={{
                      backgroundColor: isDark ? "#0D1829" : "#FFFFFF",
                      border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                      borderRadius: 10,
                      padding: 18,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 12,
                      boxShadow: "0 1px 2px rgba(16, 24, 40, 0.02)",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: isDark ? "#F2F6FC" : "#162A43" }}>
                          {offer.roleTitle}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: 10,
                            backgroundColor: offer.status === "JOINED" ? (isDark ? "rgba(46, 125, 91, 0.25)" : "#EAF4EE") : isDark ? "rgba(53, 106, 230, 0.2)" : "#EFF4FE",
                            color: offer.status === "JOINED" ? "#2E7D5B" : "#356AE6",
                          }}
                        >
                          {offer.status}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: isDark ? "#E2E8F0" : "#344054", marginTop: 4 }}>
                        🏢 {offer.employer}
                      </div>
                      {offer.compensationCtc && (
                        <div style={{ fontSize: 12, color: "#2E7D5B", fontWeight: 700, marginTop: 6 }}>
                          💰 ₹{(offer.compensationCtc / 100000).toFixed(1)} LPA CTC
                        </div>
                      )}
                    </div>

                    <div style={{ borderTop: isDark ? "1px solid #1E293B" : "1px solid #F2F4F7", paddingTop: 10, fontSize: 11, color: isDark ? "#94A3B8" : "#667085" }}>
                      Offer Date: {offer.offerDate} • Verification: <strong>{offer.verificationLevel}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* MODAL 1: EXPLAIN MATCH & ELIGIBILITY BREAKDOWN             */}
        {/* ══════════════════════════════════════════════════════════ */}
        {selectedMatchModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: 20,
            }}
          >
            <div
              style={{
                backgroundColor: isDark ? "#13243A" : "#FFFFFF",
                border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                borderRadius: 14,
                maxWidth: 680,
                width: "100%",
                maxHeight: "90vh",
                overflowY: "auto",
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 20,
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: isDark ? "#F2F6FC" : "#162A43", margin: 0 }}>
                    {selectedMatchModal.opportunity.title}
                  </h3>
                  <p style={{ fontSize: 12, color: isDark ? "#94A3B8" : "#667085", margin: "4px 0 0" }}>
                    {selectedMatchModal.opportunity.companyName} • {selectedMatchModal.opportunity.location}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedMatchModal(null)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: 20,
                    cursor: "pointer",
                    color: isDark ? "#94A3B8" : "#667085",
                  }}
                >
                  ×
                </button>
              </div>

              {/* Eligibility Section */}
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", color: "#356AE6", margin: "0 0 10px" }}>
                  Deterministic Eligibility Evaluation
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {selectedMatchModal.eligibility.criteria.map((crit, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 7,
                        backgroundColor: isDark ? "#0D1829" : "#FBFBF9",
                        border: isDark ? "1px solid #1E293B" : "1px solid #E4E7EC",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: 12,
                      }}
                    >
                      <div>
                        <strong>{crit.label}:</strong> {crit.reason}
                      </div>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: 4,
                          backgroundColor: crit.status === "MET" ? (isDark ? "rgba(46, 125, 91, 0.25)" : "#EAF4EE") : crit.status === "NOT_MET" ? (isDark ? "rgba(225, 29, 72, 0.25)" : "#FEF3F2") : isDark ? "rgba(245, 158, 11, 0.25)" : "#FEF7E6",
                          color: crit.status === "MET" ? "#2E7D5B" : crit.status === "NOT_MET" ? "#D92D20" : "#B54708",
                        }}
                      >
                        {crit.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Match Factors */}
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", color: "#7935E6", margin: "0 0 10px" }}>
                  Match Breakdown ({selectedMatchModal.matchScore}% Score)
                </h4>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: isDark ? "#B6C4D6" : "#475467" }}>
                  {selectedMatchModal.whyItMatches.map((m, i) => (
                    <li key={i} style={{ marginBottom: 4 }}>{m}</li>
                  ))}
                </ul>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  onClick={() => setSelectedMatchModal(null)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: isDark ? "#1E293B" : "#F4F5F7",
                    border: isDark ? "1px solid #334155" : "1px solid #E4E7EC",
                    borderRadius: 7,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    color: isDark ? "#E2E8F0" : "#344054",
                  }}
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleApplyClick(selectedMatchModal);
                    setSelectedMatchModal(null);
                  }}
                  style={{
                    padding: "8px 20px",
                    backgroundColor: "#356AE6",
                    border: "none",
                    borderRadius: 7,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  Apply Directly ➔
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* MODAL 2: ADD PROOF ITEM                                    */}
        {/* ══════════════════════════════════════════════════════════ */}
        {showAddProofModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: 20,
            }}
          >
            <form
              onSubmit={handleAddProofSubmit}
              style={{
                backgroundColor: isDark ? "#13243A" : "#FFFFFF",
                border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                borderRadius: 14,
                maxWidth: 540,
                width: "100%",
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: isDark ? "#F2F6FC" : "#162A43", margin: 0 }}>
                  Register Verified Proof Item
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddProofModal(false)}
                  style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: isDark ? "#94A3B8" : "#667085" }}
                >
                  ×
                </button>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: isDark ? "#94A3B8" : "#667085", marginBottom: 6 }}>
                  Skill or Target Claim
                </label>
                <input
                  type="text"
                  required
                  value={proofSkill}
                  onChange={(e) => setProofSkill(e.target.value)}
                  placeholder="e.g. SQL Window Functions, Binary Search, Spring Boot"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    backgroundColor: isDark ? "#0D1829" : "#FFFFFF",
                    border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                    borderRadius: 7,
                    color: isDark ? "#F2F6FC" : "#17191C",
                    fontSize: 13,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: isDark ? "#94A3B8" : "#667085", marginBottom: 6 }}>
                  Proof Title
                </label>
                <input
                  type="text"
                  required
                  value={proofTitle}
                  onChange={(e) => setProofTitle(e.target.value)}
                  placeholder="e.g. Distributed In-Memory Cache with LRU Eviction"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    backgroundColor: isDark ? "#0D1829" : "#FFFFFF",
                    border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                    borderRadius: 7,
                    color: isDark ? "#F2F6FC" : "#17191C",
                    fontSize: 13,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: isDark ? "#94A3B8" : "#667085", marginBottom: 6 }}>
                    Evidence Type
                  </label>
                  <select
                    value={proofType}
                    onChange={(e) => setProofType(e.target.value as any)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      backgroundColor: isDark ? "#0D1829" : "#FFFFFF",
                      border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                      borderRadius: 7,
                      color: isDark ? "#F2F6FC" : "#17191C",
                      fontSize: 13,
                      outline: "none",
                    }}
                  >
                    <option value="github_repo">GitHub Repository</option>
                    <option value="deployed_app">Deployed Application</option>
                    <option value="coding_assessment">Coding Assessment</option>
                    <option value="cs_interview">CS Fundamentals Defense</option>
                    <option value="internship">Internship Experience</option>
                    <option value="certificate">Verified Certificate</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: isDark ? "#94A3B8" : "#667085", marginBottom: 6 }}>
                    Verification Tier
                  </label>
                  <select
                    value={proofTier}
                    onChange={(e) => setProofTier(e.target.value as any)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      backgroundColor: isDark ? "#0D1829" : "#FFFFFF",
                      border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                      borderRadius: 7,
                      color: isDark ? "#F2F6FC" : "#17191C",
                      fontSize: 13,
                      outline: "none",
                    }}
                  >
                    <option value="self_reported">Self-Reported (Unverified Claim)</option>
                    <option value="source_connected">Source-Connected (Repo/Profile Link)</option>
                    <option value="assessment_verified">Assessment-Verified (Compiler Pass)</option>
                    <option value="independently_confirmed">Independently Confirmed</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: isDark ? "#94A3B8" : "#667085", marginBottom: 6 }}>
                  Source URL (GitHub Repo / Live URL)
                </label>
                <input
                  type="url"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  placeholder="https://github.com/username/project"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    backgroundColor: isDark ? "#0D1829" : "#FFFFFF",
                    border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                    borderRadius: 7,
                    color: isDark ? "#F2F6FC" : "#17191C",
                    fontSize: 13,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowAddProofModal(false)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: isDark ? "#1E293B" : "#F4F5F7",
                    border: isDark ? "1px solid #334155" : "1px solid #E4E7EC",
                    borderRadius: 7,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    color: isDark ? "#E2E8F0" : "#344054",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={proofSubmitting}
                  style={{
                    padding: "8px 20px",
                    backgroundColor: "#356AE6",
                    border: "none",
                    borderRadius: 7,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "white",
                    cursor: proofSubmitting ? "not-allowed" : "pointer",
                  }}
                >
                  {proofSubmitting ? "Registering..." : "Register Proof"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* MODAL 3: RECORD OFFER & OUTCOME                            */}
        {/* ══════════════════════════════════════════════════════════ */}
        {showAddOfferModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: 20,
            }}
          >
            <form
              onSubmit={handleAddOfferSubmit}
              style={{
                backgroundColor: isDark ? "#13243A" : "#FFFFFF",
                border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                borderRadius: 14,
                maxWidth: 540,
                width: "100%",
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: isDark ? "#F2F6FC" : "#162A43", margin: 0 }}>
                  Record Verified Offer / Placement Outcome
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddOfferModal(false)}
                  style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: isDark ? "#94A3B8" : "#667085" }}
                >
                  ×
                </button>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: isDark ? "#94A3B8" : "#667085", marginBottom: 6 }}>
                  Employer / Company
                </label>
                <input
                  type="text"
                  required
                  value={offerEmployer}
                  onChange={(e) => setOfferEmployer(e.target.value)}
                  placeholder="e.g. Google, Amazon, Razorpay"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    backgroundColor: isDark ? "#0D1829" : "#FFFFFF",
                    border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                    borderRadius: 7,
                    color: isDark ? "#F2F6FC" : "#17191C",
                    fontSize: 13,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: isDark ? "#94A3B8" : "#667085", marginBottom: 6 }}>
                  Role Title
                </label>
                <input
                  type="text"
                  required
                  value={offerRole}
                  onChange={(e) => setOfferRole(e.target.value)}
                  placeholder="e.g. Software Development Engineer (SDE-1)"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    backgroundColor: isDark ? "#0D1829" : "#FFFFFF",
                    border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                    borderRadius: 7,
                    color: isDark ? "#F2F6FC" : "#17191C",
                    fontSize: 13,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: isDark ? "#94A3B8" : "#667085", marginBottom: 6 }}>
                    Compensation CTC (Annual INR)
                  </label>
                  <input
                    type="number"
                    value={offerCtc}
                    onChange={(e) => setOfferCtc(e.target.value)}
                    placeholder="e.g. 2400000"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      backgroundColor: isDark ? "#0D1829" : "#FFFFFF",
                      border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                      borderRadius: 7,
                      color: isDark ? "#F2F6FC" : "#17191C",
                      fontSize: 13,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: isDark ? "#94A3B8" : "#667085", marginBottom: 6 }}>
                    Offer Status
                  </label>
                  <select
                    value={offerStatus}
                    onChange={(e) => setOfferStatus(e.target.value as any)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      backgroundColor: isDark ? "#0D1829" : "#FFFFFF",
                      border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                      borderRadius: 7,
                      color: isDark ? "#F2F6FC" : "#17191C",
                      fontSize: 13,
                      outline: "none",
                    }}
                  >
                    <option value="OFFER_RECEIVED">Offer Received</option>
                    <option value="OFFER_ACCEPTED">Offer Accepted</option>
                    <option value="JOINED">Joined & Completed Placement</option>
                    <option value="DECLINED">Declined</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: isDark ? "#94A3B8" : "#667085", marginBottom: 6 }}>
                  Expected / Actual Joining Date
                </label>
                <input
                  type="date"
                  value={offerJoiningDate}
                  onChange={(e) => setOfferJoiningDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    backgroundColor: isDark ? "#0D1829" : "#FFFFFF",
                    border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                    borderRadius: 7,
                    color: isDark ? "#F2F6FC" : "#17191C",
                    fontSize: 13,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowAddOfferModal(false)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: isDark ? "#1E293B" : "#F4F5F7",
                    border: isDark ? "1px solid #334155" : "1px solid #E4E7EC",
                    borderRadius: 7,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    color: isDark ? "#E2E8F0" : "#344054",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={offerSubmitting}
                  style={{
                    padding: "8px 20px",
                    backgroundColor: "#2E7D5B",
                    border: "none",
                    borderRadius: 7,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "white",
                    cursor: offerSubmitting ? "not-allowed" : "pointer",
                  }}
                >
                  {offerSubmitting ? "Saving..." : "Record Offer"}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
