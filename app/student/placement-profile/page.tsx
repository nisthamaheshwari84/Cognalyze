"use client";

import React, { useState, useEffect } from "react";
import AppNav from "@/components/AppNav";
import Link from "next/link";
import {
  StudentPlacementProfile,
  RoadmapRecommendation,
  CompetencyStatus,
  KnowledgeTier,
} from "@/lib/skills/placement-profile-engine";
import {
  User,
  GraduationCap,
  Target,
  Briefcase,
  Code,
  Terminal,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Plus,
  Trash2,
  Layers,
  Database,
  Globe,
  Cpu,
  Zap,
  Save,
  AlertCircle
} from "lucide-react";

export default function StudentPlacementProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileState, setProfileState] = useState<"NO_PROFILE" | "PARTIAL" | "COMPLETE">("NO_PROFILE");
  const [profile, setProfile] = useState<StudentPlacementProfile | null>(null);
  const [roadmap, setRoadmap] = useState<RoadmapRecommendation[]>([]);
  const [activeTab, setActiveTab] = useState<"profile" | "competencies" | "roadmap">("profile");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Editable Form Fields
  const [college, setCollege] = useState("");
  const [degree, setDegree] = useState("B.Tech");
  const [branch, setBranch] = useState("Computer Science & Engineering");
  const [graduationYear, setGraduationYear] = useState("2026");
  const [cgpa, setCgpa] = useState("8.5");
  const [targetRoles, setTargetRoles] = useState<string[]>(["Software Development Engineer (SDE-1)"]);
  const [targetCompanies, setTargetCompanies] = useState<string[]>(["Google", "Amazon", "Razorpay"]);
  const [dailyPrepMinutes, setDailyPrepMinutes] = useState(90);
  const [preferredLanguage, setPreferredLanguage] = useState("cpp");
  const [preferredInterviewFormat, setPreferredInterviewFormat] = useState<"coding" | "spoken" | "mixed">("mixed");
  const [programmingLanguages, setProgrammingLanguages] = useState<string[]>(["C++", "Python", "SQL"]);
  const [dsaProficiency, setDsaProficiency] = useState<"Beginner" | "Intermediate" | "Advanced">("Intermediate");

  // Temporary inputs for array additions
  const [newRoleInput, setNewRoleInput] = useState("");
  const [newCompanyInput, setNewCompanyInput] = useState("");

  useEffect(() => {
    loadPlacementProfile();
  }, []);

  const loadPlacementProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/student/placement-profile");
      const data = await res.json();
      if (data.success && data.profile) {
        setProfile(data.profile);
        setProfileState(data.profileState || "COMPLETE");
        setRoadmap(data.roadmap || []);

        // Hydrate form fields
        setCollege(data.profile.college || "");
        setDegree(data.profile.degree || "B.Tech");
        setBranch(data.profile.branch || "Computer Science");
        setGraduationYear(data.profile.graduationYear || "2026");
        setCgpa(data.profile.cgpa || "");
        setTargetRoles(data.profile.targetRoles || ["Software Development Engineer (SDE-1)"]);
        setTargetCompanies(data.profile.targetCompanies || ["Google", "Amazon"]);
        setDailyPrepMinutes(data.profile.dailyPrepMinutes || 90);
        setPreferredLanguage(data.profile.preferredLanguage || "cpp");
        setPreferredInterviewFormat(data.profile.preferredInterviewFormat || "mixed");
        setProgrammingLanguages(data.profile.programmingLanguages || ["C++", "Python", "SQL"]);
        setDsaProficiency(data.profile.dsaProficiencyLevel || "Intermediate");
      } else {
        setProfileState("NO_PROFILE");
        setRoadmap(data.roadmap || []);
      }
    } catch (err: any) {
      console.error("Failed to load placement profile:", err);
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
          targetRoles,
          targetCompanies,
          dailyPrepMinutes,
          preferredLanguage,
          preferredInterviewFormat,
          programmingLanguages,
          dsaProficiencyLevel: dsaProficiency
        })
      });
      const data = await res.json();
      if (data.success && data.profile) {
        setProfile(data.profile);
        setProfileState("COMPLETE");
        setRoadmap(data.roadmap || []);
        setSaveSuccessMsg("Placement Profile and Adaptive Roadmap updated successfully!");
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

  const handleAddRole = () => {
    if (newRoleInput.trim() && !targetRoles.includes(newRoleInput.trim())) {
      setTargetRoles([...targetRoles, newRoleInput.trim()]);
      setNewRoleInput("");
    }
  };

  const handleAddCompany = () => {
    if (newCompanyInput.trim() && !targetCompanies.includes(newCompanyInput.trim())) {
      setTargetCompanies([...targetCompanies, newCompanyInput.trim()]);
      setNewCompanyInput("");
    }
  };

  const getTierBadge = (tier: KnowledgeTier) => {
    switch (tier) {
      case "code_demonstrated":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Code Demonstrated</span>;
      case "verified_external":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Verified External</span>;
      case "question_assessed":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">Question Assessed</span>;
      case "self_reported":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">Self-Reported</span>;
      case "unassessed":
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-800 text-gray-400 border border-gray-700">Unassessed</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-gray-100 flex flex-col font-sans">
      <AppNav role="student" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                Placement Profile & Evidence Intelligence
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                profileState === "COMPLETE" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              }`}>
                {profileState === "COMPLETE" ? "Active Configuration" : "Setup Required"}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Your central placement-preparation intelligence layer connecting roles, target companies, verified competencies, and roadmaps.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/student/skills"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition"
            >
              Open Skill Practice Hub
            </Link>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20 transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saving..." : "Save Placement Profile"}
            </button>
          </div>
        </div>

        {/* Success/Error Alerts */}
        {saveSuccessMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2.5 shadow-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2.5 shadow-lg">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-gray-800/80">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition flex items-center gap-2 ${
              activeTab === "profile"
                ? "border-cyan-500 text-cyan-400 bg-cyan-500/5"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <User className="w-4 h-4" />
            Target Roles & Academic Context
          </button>
          <button
            onClick={() => setActiveTab("competencies")}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition flex items-center gap-2 ${
              activeTab === "competencies"
                ? "border-cyan-500 text-cyan-400 bg-cyan-500/5"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Evidence-Grounded Competencies ({profile ? Object.keys(profile.competencies).length : 0})
          </button>
          <button
            onClick={() => setActiveTab("roadmap")}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition flex items-center gap-2 ${
              activeTab === "roadmap"
                ? "border-cyan-500 text-cyan-400 bg-cyan-500/5"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Adaptive Placement Roadmap ({roadmap.length})
          </button>
        </div>

        {/* TAB 1: PROFILE SETUP */}
        {activeTab === "profile" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Card 1: Academic & Placement Context */}
              <div className="bg-[#0e1320] border border-gray-800/80 rounded-2xl p-6 space-y-4 shadow-xl">
                <div className="flex items-center gap-2.5 text-sm font-bold text-white mb-2">
                  <GraduationCap className="w-4 h-4 text-cyan-400" />
                  Academic & Placement Context
                </div>

                <div>
                  <label className="text-xs text-gray-400 font-medium mb-1 block">College / University</label>
                  <input
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="e.g. Indian Institute of Technology / NIT / BITS"
                    className="w-full bg-[#080c14] border border-gray-700/80 rounded-xl px-3.5 py-2 text-xs text-gray-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 font-medium mb-1 block">Degree</label>
                    <input
                      type="text"
                      value={degree}
                      onChange={(e) => setDegree(e.target.value)}
                      placeholder="B.Tech / M.Tech / MCA"
                      className="w-full bg-[#080c14] border border-gray-700/80 rounded-xl px-3.5 py-2 text-xs text-gray-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-medium mb-1 block">Graduation Year</label>
                    <input
                      type="text"
                      value={graduationYear}
                      onChange={(e) => setGraduationYear(e.target.value)}
                      placeholder="2026"
                      className="w-full bg-[#080c14] border border-gray-700/80 rounded-xl px-3.5 py-2 text-xs text-gray-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 font-medium mb-1 block">Branch / Major</label>
                    <input
                      type="text"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      placeholder="Computer Science"
                      className="w-full bg-[#080c14] border border-gray-700/80 rounded-xl px-3.5 py-2 text-xs text-gray-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-medium mb-1 block">CGPA / Percentage</label>
                    <input
                      type="text"
                      value={cgpa}
                      onChange={(e) => setCgpa(e.target.value)}
                      placeholder="e.g. 8.6"
                      className="w-full bg-[#080c14] border border-gray-700/80 rounded-xl px-3.5 py-2 text-xs text-gray-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Placement Goals & Target Roles */}
              <div className="bg-[#0e1320] border border-gray-800/80 rounded-2xl p-6 space-y-4 shadow-xl">
                <div className="flex items-center gap-2.5 text-sm font-bold text-white mb-2">
                  <Target className="w-4 h-4 text-purple-400" />
                  Target Roles & Aspirations
                </div>

                {/* Target Roles Tags */}
                <div>
                  <label className="text-xs text-gray-400 font-medium mb-1.5 block">Target Roles</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {targetRoles.map((role, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs bg-purple-500/10 border border-purple-500/20 text-purple-300">
                        {role}
                        <button
                          onClick={() => setTargetRoles(targetRoles.filter((_, i) => i !== idx))}
                          className="hover:text-white"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newRoleInput}
                      onChange={(e) => setNewRoleInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddRole())}
                      placeholder="Add role (e.g. Backend Engineer, Systems Programmer)"
                      className="flex-1 bg-[#080c14] border border-gray-700/80 rounded-xl px-3.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-purple-500"
                    />
                    <button
                      onClick={handleAddRole}
                      className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-xs font-semibold rounded-xl text-white transition"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Target Companies Tags */}
                <div>
                  <label className="text-xs text-gray-400 font-medium mb-1.5 block">Target Companies</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {targetCompanies.map((comp, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                        {comp}
                        <button
                          onClick={() => setTargetCompanies(targetCompanies.filter((_, i) => i !== idx))}
                          className="hover:text-white"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCompanyInput}
                      onChange={(e) => setNewCompanyInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCompany())}
                      placeholder="Add company (e.g. Google, Flipkart, Microsoft)"
                      className="flex-1 bg-[#080c14] border border-gray-700/80 rounded-xl px-3.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      onClick={handleAddCompany}
                      className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-xs font-semibold rounded-xl text-white transition"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Daily prep time slider */}
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Daily Preparation Commitment</span>
                    <span className="text-cyan-400 font-bold">{dailyPrepMinutes} mins / day</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="240"
                    step="15"
                    value={dailyPrepMinutes}
                    onChange={(e) => setDailyPrepMinutes(Number(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EVIDENCE-GROUNDED COMPETENCIES GRID */}
        {activeTab === "competencies" && (
          <div className="space-y-6">
            <div className="bg-[#0e1320] p-6 rounded-2xl border border-gray-800/80 shadow-xl space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  Competency Verification Matrix
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Cognalyze strictly separates self-reported claims from verified code executions and Socratic defense evidence.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {profile && Object.values(profile.competencies).map((c: CompetencyStatus) => (
                  <div key={c.competencyId} className="bg-[#080c14] p-4 rounded-xl border border-gray-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-200">{c.name}</span>
                      {getTierBadge(c.tier)}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-gray-500">
                      <span>Domain: {c.domain.toUpperCase()}</span>
                      <span>Confidence: {c.confidenceScore}%</span>
                    </div>
                    {c.demonstratedProof && (
                      <div className="text-[11px] text-emerald-300/80 bg-emerald-950/20 p-2 rounded border border-emerald-800/30">
                        {c.demonstratedProof}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ADAPTIVE PLACEMENT ROADMAP */}
        {activeTab === "roadmap" && (
          <div className="space-y-6">
            <div className="bg-[#0e1320] p-6 rounded-2xl border border-gray-800/80 shadow-xl space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  Personalized Next Actions (Driven by Placement Intelligence)
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Recommendations derived from your target roles, companies, and observed competency gaps.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {roadmap.map((rec) => (
                  <div key={rec.id} className="p-4 rounded-xl bg-[#080c14] border border-gray-800 flex items-center justify-between gap-4 hover:border-gray-700 transition">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{rec.title}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          rec.priority === "high" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                          "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}>
                          {rec.priority} Priority
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{rec.reasoning}</p>
                    </div>

                    <Link
                      href={rec.targetHref}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 transition shrink-0"
                    >
                      <span>Start Action</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
