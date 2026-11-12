"use client";

import React, { useState, useMemo } from "react";
import {
  getAllUniversalCompanies,
  CANONICAL_ROLE_FAMILIES,
  SUPPORTED_GEOGRAPHIES,
  HIRING_CHANNELS_LIST,
  registerCustomCompany,
  getRoleMetadata,
} from "@/lib/recruitment/universal-company-registry";
import {
  RoleFamily,
  HiringChannel,
  StudentRecruitmentJourney,
  RecruitmentBlueprint,
  CompanyProfile,
  CompanyTierCategory,
} from "@/lib/recruitment/types";
import { ParsedJobDescriptionAnalysis } from "@/lib/recruitment/company-research-engine";

interface UniversalCompanySelectorProps {
  selectedCompanyId: string;
  selectedRole: RoleFamily;
  selectedChannel: HiringChannel;
  selectedCountry: string;
  onSelectCompany: (companyId: string) => void;
  onSelectRole: (role: RoleFamily) => void;
  onSelectChannel: (channel: HiringChannel) => void;
  onSelectCountry: (country: string) => void;
  onStartJourney: (jdAnalysis?: ParsedJobDescriptionAnalysis) => void;
  isStarting: boolean;
  activeJourney: StudentRecruitmentJourney | null;
  activeBlueprint: RecruitmentBlueprint | null;
}

export default function UniversalCompanySelector({
  selectedCompanyId,
  selectedRole,
  selectedChannel,
  selectedCountry,
  onSelectCompany,
  onSelectRole,
  onSelectChannel,
  onSelectCountry,
  onStartJourney,
  isStarting,
  activeJourney,
  activeBlueprint,
}: UniversalCompanySelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>("ALL");
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showJdInput, setShowJdInput] = useState(false);
  const [jdText, setJdText] = useState("");
  const [isAnalyzingJd, setIsAnalyzingJd] = useState(false);
  const [jdAnalysis, setJdAnalysis] = useState<ParsedJobDescriptionAnalysis | null>(null);

  // New Custom Company Form State
  const [customName, setCustomName] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [customHq, setCustomHq] = useState("");
  const [customOverview, setCustomOverview] = useState("");

  const allCompanies = useMemo(() => getAllUniversalCompanies(), [showCustomModal]);

  const filteredCompanies = useMemo(() => {
    return allCompanies.filter((c) => {
      const matchesSearch =
        searchQuery === "" ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.overview.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.domain && c.domain.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesTier =
        selectedTierFilter === "ALL" ||
        (selectedTierFilter === "FAANG" && c.tierCategory === "TIER_1_FAANG") ||
        (selectedTierFilter === "PRODUCT" && c.tierCategory === "HIGH_GROWTH_PRODUCT") ||
        (selectedTierFilter === "SERVICE" && c.tierCategory === "ENTERPRISE_SERVICE") ||
        (selectedTierFilter === "FINTECH" && c.tierCategory === "FINTECH_GLOBAL") ||
        (selectedTierFilter === "CONSULTING" && c.tierCategory === "GLOBAL_CONSULTING") ||
        (selectedTierFilter === "STARTUP" && (c.tierCategory === "UNICORN_STARTUP" || c.tierCategory === "EARLY_STAGE_STARTUP" || c.isCustomCompany));

      return matchesSearch && matchesTier;
    });
  }, [allCompanies, searchQuery, selectedTierFilter]);

  const activeCompany =
    allCompanies.find((c) => c.id.toLowerCase() === selectedCompanyId.toLowerCase()) ||
    allCompanies[0];

  const roleMeta = getRoleMetadata(selectedRole);

  const handleRegisterCustomCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newCompany = registerCustomCompany({
      name: customName.trim(),
      domain: customDomain.trim() || undefined,
      headquarters: customHq.trim() || "Global Remote",
      overview: customOverview.trim() || undefined,
      tierCategory: "EARLY_STAGE_STARTUP",
      supportedRoles: [selectedRole, "sde", "fullstack_engineer"],
      supportedChannels: [selectedChannel, "campus", "off_campus"],
      hiringGeographies: [selectedCountry, "India", "US", "Remote"],
    });

    onSelectCompany(newCompany.id);
    setShowCustomModal(false);
    setCustomName("");
    setCustomDomain("");
    setCustomHq("");
    setCustomOverview("");
  };

  const handleAnalyzeJd = async () => {
    if (!jdText.trim()) return;
    setIsAnalyzingJd(true);
    try {
      const res = await fetch("/api/recruitment/companies/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: activeCompany.id,
          jdText,
          roleFamily: selectedRole,
          country: selectedCountry,
          channel: selectedChannel,
        }),
      });
      const data = await res.json();
      if (data.success && data.jdAnalysis) {
        setJdAnalysis(data.jdAnalysis);
        if (data.jdAnalysis.detectedRoleFamily) {
          onSelectRole(data.jdAnalysis.detectedRoleFamily);
        }
      }
    } catch (err) {
      console.error("JD analysis error:", err);
    } finally {
      setIsAnalyzingJd(false);
    }
  };

  const getTierBadge = (tier: CompanyTierCategory) => {
    switch (tier) {
      case "TIER_1_FAANG":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">Tier-1 FAANG</span>;
      case "HIGH_GROWTH_PRODUCT":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">High-Growth Product</span>;
      case "ENTERPRISE_SERVICE":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Enterprise IT</span>;
      case "FINTECH_GLOBAL":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Global FinTech</span>;
      case "GLOBAL_CONSULTING":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">Consulting & Advisory</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700 border border-stone-200">High-Growth Startup</span>;
    }
  };

  return (
    <div className="bg-white border border-[#E4E1DA] rounded-2xl p-6 sm:p-8 shadow-sm mb-8 transition-all">
      {/* Top Banner Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#E4E1DA]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#356AE6] bg-[#356AE6]/10 px-2.5 py-1 rounded-md">
              Universal Recruitment Intelligence
            </span>
            <span className="text-[11px] font-semibold text-stone-500">
              Anti-Simulation Verified • Multi-Tier Ecosystem
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#162A43] tracking-tight">
            Target Company & Role Calibration
          </h1>
          <p className="text-xs text-stone-600 mt-1 max-w-2xl">
            Select or discover any global employer. Calibrate your recruitment DAG by geography, hiring channel,
            and job description to simulate exact company hiring bars.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start lg:self-center">
          <button
            onClick={() => setShowCustomModal(true)}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-dashed border-[#356AE6] text-[#356AE6] hover:bg-[#356AE6]/5 transition flex items-center gap-1.5"
          >
            <span>+ Discover / Add Startup</span>
          </button>
          <button
            onClick={() => onStartJourney(jdAnalysis || undefined)}
            disabled={isStarting}
            className="px-6 py-2.5 bg-[#356AE6] hover:bg-[#2855C7] text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2 disabled:opacity-50"
          >
            {isStarting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Calibrating...</span>
              </>
            ) : activeJourney && activeJourney.companyId === selectedCompanyId ? (
              <>
                <span>Resume Journey</span>
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">
                  Score: {activeJourney.overallScore}%
                </span>
              </>
            ) : (
              <>
                <span>Start Calibrated Journey</span>
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">Verified</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Step 1: Universal Company Discovery */}
      <div className="pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <label className="text-xs font-bold text-[#162A43] uppercase tracking-wider">
            1. Select or Search Employer ({filteredCompanies.length} Organizations)
          </label>
          {/* Tier Filter Chips */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "ALL", label: "All" },
              { id: "FAANG", label: "Tier 1 FAANG" },
              { id: "PRODUCT", label: "High-Growth Product" },
              { id: "FINTECH", label: "Global FinTech" },
              { id: "SERVICE", label: "Enterprise IT" },
              { id: "CONSULTING", label: "Consulting" },
              { id: "STARTUP", label: "Startups" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTierFilter(t.id)}
                className={`px-2.5 py-1 text-[11px] rounded-lg border transition ${
                  selectedTierFilter === t.id
                    ? "bg-[#162A43] text-white border-[#162A43] font-semibold"
                    : "bg-white text-stone-600 border-[#E4E1DA] hover:border-stone-400"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by company name, domain (e.g. stripe.com), or keyword..."
            className="w-full px-4 py-2.5 text-xs rounded-xl border border-[#E4E1DA] focus:outline-none focus:ring-2 focus:ring-[#356AE6]/20 focus:border-[#356AE6] bg-stone-50/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-xs text-stone-400 hover:text-stone-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Company Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 max-h-60 overflow-y-auto pr-1">
          {filteredCompanies.map((company) => {
            const isSelected = company.id.toLowerCase() === selectedCompanyId.toLowerCase();
            return (
              <button
                key={company.id}
                onClick={() => onSelectCompany(company.id)}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "border-[#356AE6] bg-[#356AE6]/5 ring-2 ring-[#356AE6]/20 shadow-sm"
                    : "border-[#E4E1DA] hover:border-stone-400 bg-white"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-xs font-bold text-[#162A43]">
                    {company.name.slice(0, 2).toUpperCase()}
                  </div>
                  {company.isCustomCompany ? (
                    <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1 py-0.5 rounded">Custom</span>
                  ) : (
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">Verified</span>
                  )}
                </div>
                <div className="text-xs font-bold text-[#162A43] truncate w-full">{company.name}</div>
                <div className="text-[10px] text-stone-500 truncate w-full">{company.headquarters}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Role Selection & Step 3: Geographic / Channel Context */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6 mt-6 border-t border-[#E4E1DA]">
        {/* Role Family Selector (15 Roles) */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-[#162A43] uppercase tracking-wider">
              2. Target Role Family ({CANONICAL_ROLE_FAMILIES.length} Tracks)
            </label>
            <span className="text-[11px] text-[#356AE6] font-semibold">{roleMeta.label}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CANONICAL_ROLE_FAMILIES.map((rf) => (
              <button
                key={rf.id}
                onClick={() => onSelectRole(rf.id)}
                className={`p-2.5 rounded-xl border text-left transition ${
                  selectedRole === rf.id
                    ? "border-[#356AE6] bg-[#356AE6]/5 ring-1 ring-[#356AE6]/30 text-[#162A43]"
                    : "border-[#E4E1DA] bg-white text-stone-600 hover:border-stone-400"
                }`}
              >
                <div className="text-xs font-bold truncate">{rf.label}</div>
                <div className="text-[10px] text-stone-500 truncate capitalize">{rf.category.replace("_", " ")}</div>
              </button>
            ))}
          </div>

          <div className="mt-2.5 p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-[11px] text-stone-600">
            <span className="font-semibold text-[#162A43]">Evaluated Competencies: </span>
            {roleMeta.coreCompetencies.map((c) => c.replace(/_/g, " ")).join(", ")}
          </div>
        </div>

        {/* Geography & Hiring Channel */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-[#162A43] uppercase tracking-wider block mb-2">
              3. Geography
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {SUPPORTED_GEOGRAPHIES.map((geo) => (
                <button
                  key={geo.id}
                  onClick={() => onSelectCountry(geo.id)}
                  className={`px-2 py-1.5 rounded-lg border text-center transition text-xs ${
                    selectedCountry.toLowerCase() === geo.id.toLowerCase()
                      ? "border-[#356AE6] bg-[#356AE6]/10 text-[#162A43] font-bold"
                      : "border-[#E4E1DA] bg-white text-stone-600 hover:border-stone-400"
                  }`}
                >
                  <span className="mr-1">{geo.flagEmoji}</span>
                  <span>{geo.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#162A43] uppercase tracking-wider block mb-2">
              4. Hiring Channel
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {HIRING_CHANNELS_LIST.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => onSelectChannel(ch.id)}
                  className={`p-2 rounded-lg border text-left transition text-xs ${
                    selectedChannel === ch.id
                      ? "border-[#356AE6] bg-[#356AE6]/10 text-[#162A43] font-bold"
                      : "border-[#E4E1DA] bg-white text-stone-600 hover:border-stone-400"
                  }`}
                >
                  <div className="font-semibold truncate">{ch.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Optional Step 4: Job Description Ingestion */}
      <div className="pt-6 mt-6 border-t border-[#E4E1DA]">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowJdInput(!showJdInput)}
            className="text-xs font-bold text-[#356AE6] hover:underline flex items-center gap-1.5"
          >
            <span>{showJdInput ? "▼ Hide Job Description Calibration" : "▶ Optional: Paste Specific Job Description (JD) to Calibrate"}</span>
          </button>
          {jdAnalysis && (
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
              JD Parsed: {jdAnalysis.primarySkills.join(", ")}
            </span>
          )}
        </div>

        {showJdInput && (
          <div className="mt-3 p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
            <textarea
              rows={4}
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste job description requirements, responsibilities, or tech stack..."
              className="w-full p-3 text-xs bg-white rounded-lg border border-[#E4E1DA] focus:outline-none focus:ring-1 focus:ring-[#356AE6]"
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-stone-500">
                Extracts required tools, libraries, and adjusts stage weights automatically.
              </span>
              <button
                onClick={handleAnalyzeJd}
                disabled={isAnalyzingJd || !jdText.trim()}
                className="px-4 py-1.5 bg-[#162A43] text-white text-xs font-semibold rounded-lg hover:bg-[#1a3352] transition disabled:opacity-50"
              >
                {isAnalyzingJd ? "Analyzing JD..." : "Calibrate Blueprint to JD"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Active Blueprint & Company Overview Card */}
      <div className="mt-6 p-4 bg-stone-50 border border-stone-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#162A43] text-sm">{activeCompany.name}</span>
            {getTierBadge(activeCompany.tierCategory)}
            <span className="text-stone-400">•</span>
            <span className="text-stone-600">{activeCompany.headquarters}</span>
          </div>
          <p className="text-stone-600 line-clamp-1">{activeCompany.overview}</p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={activeCompany.officialCareersUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#356AE6] hover:underline font-semibold flex items-center gap-1 whitespace-nowrap"
          >
            Official Career Portal ↗
          </a>
          <button
            onClick={() => onStartJourney(jdAnalysis || undefined)}
            disabled={isStarting}
            className="px-4 py-2 bg-[#356AE6] hover:bg-[#2855C7] text-white font-semibold rounded-xl transition whitespace-nowrap shadow-sm disabled:opacity-50"
          >
            {activeJourney && activeJourney.companyId === selectedCompanyId
              ? "Resume Journey →"
              : "Start Verified Journey →"}
          </button>
        </div>
      </div>

      {/* Custom Company Registration Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#E4E1DA] animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E1DA]">
              <h3 className="text-sm font-bold text-[#162A43]">Discover & Add New Organization</h3>
              <button
                onClick={() => setShowCustomModal(false)}
                className="text-stone-400 hover:text-stone-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterCustomCompany} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">Company / Startup Name *</label>
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Anthropic, OpenAI, Perplexity, MyLocalStartup"
                  className="w-full px-3 py-2 text-xs border border-[#E4E1DA] rounded-lg focus:outline-none focus:border-[#356AE6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">Website Domain</label>
                  <input
                    type="text"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    placeholder="e.g. openai.com"
                    className="w-full px-3 py-2 text-xs border border-[#E4E1DA] rounded-lg focus:outline-none focus:border-[#356AE6]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">Headquarters</label>
                  <input
                    type="text"
                    value={customHq}
                    onChange={(e) => setCustomHq(e.target.value)}
                    placeholder="e.g. San Francisco / Bengaluru"
                    className="w-full px-3 py-2 text-xs border border-[#E4E1DA] rounded-lg focus:outline-none focus:border-[#356AE6]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">Overview & Focus</label>
                <textarea
                  rows={2}
                  value={customOverview}
                  onChange={(e) => setCustomOverview(e.target.value)}
                  placeholder="Briefly describe what this company builds..."
                  className="w-full px-3 py-2 text-xs border border-[#E4E1DA] rounded-lg focus:outline-none focus:border-[#356AE6]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-4 py-2 text-xs text-stone-600 hover:text-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-[#356AE6] hover:bg-[#2855C7] text-white rounded-xl shadow-sm transition"
                >
                  Save & Calibrate Journey
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

