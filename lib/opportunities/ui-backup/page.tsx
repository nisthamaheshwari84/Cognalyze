"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import {
  Briefcase,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  Search,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  SlidersHorizontal,
  Layers,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  PlusCircle,
  X,
  Building2,
  MapPin,
  CheckCircle,
  HelpCircle,
  Send,
  Zap,
} from "lucide-react";
import CompanyLogo from "@/components/CompanyLogo";
import {
  CandidateOpportunityMatch,
  OpportunityResearchSummary,
  RecommendationTier,
  StudentOpportunityPreferences,
  ApplicationStage,
} from "@/lib/opportunities/types";

export default function StudentOpportunitiesPage() {
  const [studentId, setStudentId] = useState<string>("student-demo");
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Core Data
  const [summary, setSummary] = useState<OpportunityResearchSummary | null>(null);
  const [categorized, setCategorized] = useState<{
    applyNow: CandidateOpportunityMatch[];
    buildEvidence: CandidateOpportunityMatch[];
    explore: CandidateOpportunityMatch[];
    verify: CandidateOpportunityMatch[];
    lowPriority: CandidateOpportunityMatch[];
    notEligible: CandidateOpportunityMatch[];
  }>({
    applyNow: [],
    buildEvidence: [],
    explore: [],
    verify: [],
    lowPriority: [],
    notEligible: [],
  });
  const [allMatches, setAllMatches] = useState<CandidateOpportunityMatch[]>([]);
  const [preferences, setPreferences] = useState<StudentOpportunityPreferences | null>(null);
  const [studentContext, setStudentContext] = useState<{
    primaryGoal: string;
    experienceTarget: string;
    topDemonstratedSkills: string[];
    totalEvidenceCount: number;
  }>({
    primaryGoal: "AI/ML Engineer",
    experienceTarget: "Internship",
    topDemonstratedSkills: ["Python", "Git", "REST APIs"],
    totalEvidenceCount: 12,
  });

  // Tracked Applications & Saved
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [applicationMap, setApplicationMap] = useState<Record<string, { stage: ApplicationStage; notes?: string }>>({});

  // Active View Tab
  const [activeTab, setActiveTab] = useState<"applyNow" | "buildEvidence" | "explore" | "applications">("applyNow");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [remoteFilter, setRemoteFilter] = useState<string>("all");
  const [companyTypeFilter, setCompanyTypeFilter] = useState<string>("all");

  // Modals & Drawers
  const [selectedWhyMatch, setSelectedWhyMatch] = useState<CandidateOpportunityMatch | null>(null);
  const [showPreferencesModal, setShowPreferencesModal] = useState<boolean>(false);
  const [showReMatchModal, setShowReMatchModal] = useState<boolean>(false);
  const [newSkillInput, setNewSkillInput] = useState<string>("Docker");
  const [reMatchMessage, setReMatchMessage] = useState<string | null>(null);
  const [reMatching, setReMatching] = useState<boolean>(false);

  // Preference Draft State
  const [prefDraft, setPrefDraft] = useState<{
    targetRoles: string;
    locations: string;
    remote: boolean;
    hybrid: boolean;
    onsite: boolean;
    startups: boolean;
    enterprises: boolean;
  }>({
    targetRoles: "",
    locations: "",
    remote: true,
    hybrid: true,
    onsite: false,
    startups: true,
    enterprises: true,
  });

  // Status Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("cognalyze_student_id") || "student-demo";
    setStudentId(stored);
    loadOpportunities(stored);
    loadTrackingData(stored);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadOpportunities = async (cId: string, force = false) => {
    try {
      if (force) setRefreshing(true);
      else setLoading(true);

      const res = await fetch(`/api/opportunities?studentId=${cId}${force ? "&forceRefresh=true" : ""}`);
      const data = await res.json();

      if (data.success) {
        setSummary(data.summary);
        setCategorized(data.categorized);
        setAllMatches(data.allMatches);
        setPreferences(data.preferences);
        setStudentContext(data.studentContext);

        if (data.preferences) {
          setPrefDraft({
            targetRoles: (data.preferences.targetRoles || []).join(", "),
            locations: (data.preferences.locations || []).join(", "),
            remote: data.preferences.remotePreferences?.includes("remote") ?? true,
            hybrid: data.preferences.remotePreferences?.includes("hybrid") ?? true,
            onsite: data.preferences.remotePreferences?.includes("onsite") ?? false,
            startups: data.preferences.preferredCompanyTypes?.includes("startup") ?? true,
            enterprises: data.preferences.preferredCompanyTypes?.includes("enterprise") ?? true,
          });
        }
      }
    } catch (err) {
      console.error("Error loading personalized opportunities:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadTrackingData = async (cId: string) => {
    try {
      const res = await fetch(`/api/opportunities/track?studentId=${cId}`);
      const data = await res.json();
      if (data.success) {
        const savedSet = new Set<string>();
        if (Array.isArray(data.saved)) {
          data.saved.forEach((m: CandidateOpportunityMatch) => savedSet.add(m.opportunityId));
        }
        setSavedIds(savedSet);

        const appMap: Record<string, { stage: ApplicationStage; notes?: string }> = {};
        if (Array.isArray(data.applications)) {
          data.applications.forEach((item: any) => {
            if (item.record?.opportunityId) {
              appMap[item.record.opportunityId] = {
                stage: item.record.stage,
                notes: item.record.notes,
              };
            }
          });
        }
        setApplicationMap(appMap);
      }
    } catch (err) {
      console.error("Error loading application tracking data:", err);
    }
  };

  const toggleSave = async (oppId: string) => {
    const isSaved = savedIds.has(oppId);
    const action = isSaved ? "unsave" : "save";

    // Optimistic update
    const nextSaved = new Set(savedIds);
    if (isSaved) nextSaved.delete(oppId);
    else nextSaved.add(oppId);
    setSavedIds(nextSaved);

    showToast(isSaved ? "Removed from saved opportunities" : "Saved to your watchlist");

    try {
      await fetch("/api/opportunities/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          opportunityId: oppId,
          action,
        }),
      });
    } catch (err) {
      console.error("Error toggling save:", err);
    }
  };

  const handleApplyClick = async (opp: CandidateOpportunityMatch) => {
    // Open official application in new tab
    const url = opp.opportunity.applicationUrl || opp.opportunity.sourceUrl;
    window.open(url, "_blank", "noopener,noreferrer");

    // Update tracking
    try {
      await fetch("/api/opportunities/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          opportunityId: opp.opportunityId,
          stage: "Applied",
        }),
      });

      setApplicationMap((prev) => ({
        ...prev,
        [opp.opportunityId]: { stage: "Applied" },
      }));

      showToast(`Marked as Applied! Added to your Career Memory pipeline.`);
    } catch (err) {
      console.error("Error tracking apply:", err);
    }
  };

  const handleUpdatePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    const remotePrefs: ("remote" | "hybrid" | "onsite")[] = [];
    if (prefDraft.remote) remotePrefs.push("remote");
    if (prefDraft.hybrid) remotePrefs.push("hybrid");
    if (prefDraft.onsite) remotePrefs.push("onsite");

    const compTypes: ("startup" | "enterprise")[] = [];
    if (prefDraft.startups) compTypes.push("startup");
    if (prefDraft.enterprises) compTypes.push("enterprise");

    const targetRoles = prefDraft.targetRoles.split(",").map((s) => s.trim()).filter(Boolean);
    const locations = prefDraft.locations.split(",").map((s) => s.trim()).filter(Boolean);

    try {
      const res = await fetch("/api/opportunities/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          preferences: {
            targetRoles,
            locations,
            remotePreferences: remotePrefs,
            preferredCompanyTypes: compTypes,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowPreferencesModal(false);
        showToast("Preferences saved. Re-ranking personalized opportunities...");
        loadOpportunities(studentId, true);
      }
    } catch (err) {
      console.error("Error updating preferences:", err);
    }
  };

  const handleTriggerReMatch = async () => {
    if (!newSkillInput.trim()) return;
    setReMatching(true);
    setReMatchMessage(null);

    try {
      const res = await fetch("/api/opportunities/re-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          newEvidenceSkill: newSkillInput.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setReMatchMessage(data.message);
        showToast(data.message);
        // Refresh opportunities to display updated recommendations
        await loadOpportunities(studentId, true);
      }
    } catch (err) {
      console.error("Error triggering re-match:", err);
      setReMatchMessage("Failed to recalculate opportunities.");
    } finally {
      setReMatching(false);
    }
  };

  // Filter current displayed list
  const getFilteredList = (list: CandidateOpportunityMatch[]) => {
    return list.filter((m) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const text = `${m.opportunity.title} ${m.opportunity.companyName} ${m.opportunity.location} ${m.opportunity.requiredSkills.join(" ")}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      if (roleFilter !== "all") {
        if (!m.opportunity.roleDNA.roleCategory.toLowerCase().includes(roleFilter.toLowerCase())) {
          return false;
        }
      }
      if (remoteFilter !== "all") {
        if (m.opportunity.remoteType !== remoteFilter) return false;
      }
      if (companyTypeFilter !== "all") {
        if (m.opportunity.companyType !== companyTypeFilter) return false;
      }
      return true;
    });
  };

  const displayedList =
    activeTab === "applyNow"
      ? getFilteredList(categorized.applyNow)
      : activeTab === "buildEvidence"
      ? getFilteredList(categorized.buildEvidence)
      : activeTab === "explore"
      ? getFilteredList([...categorized.explore, ...categorized.verify])
      : getFilteredList(
          allMatches.filter((m) => savedIds.has(m.opportunityId) || applicationMap[m.opportunityId])
        );

  return (
    <div className="min-h-screen bg-[#0B0F17] text-[#E2E8F0] font-sans antialiased pb-20 selection:bg-blue-600 selection:text-white">
      <AppNav />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#162032] border border-[#2B3B55] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* =========================================================================
            HEADER: OPPORTUNITIES WORTH YOUR ATTENTION
           ========================================================================= */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#121927] via-[#152033] to-[#121927] border border-[#1E2D45] p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                Evidence-First Opportunity Intelligence
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
                Opportunities Worth Your Attention
              </h1>
              <p className="text-sm sm:text-base text-slate-400 max-w-3xl">
                We continuously research the hiring ecosystem on your behalf — analyzing company career portals, ATS feeds, campus drives, and startup directories against your verified Student DNA.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => loadOpportunities(studentId, true)}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#1C273C] text-slate-200 hover:bg-[#253450] border border-[#2E3F5F] transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-blue-400" : ""}`} />
                {refreshing ? "Researching..." : "Re-scan Sources"}
              </button>
              <button
                onClick={() => setShowPreferencesModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Update Preferences
              </button>
              <button
                onClick={() => setShowReMatchModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30 transition-all"
              >
                <Zap className="w-4 h-4 text-emerald-400" />
                Simulate New Evidence
              </button>
            </div>
          </div>

          {/* Research Summary Metrics */}
          {summary && (
            <div className="mt-6 pt-6 border-t border-[#1E2D45] grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-[#0D1422]/60 rounded-xl p-3.5 border border-[#1A263D]">
                <div className="text-xs text-slate-400 font-medium">Opportunities Researched</div>
                <div className="text-xl sm:text-2xl font-bold text-white mt-1">{summary.totalResearched}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Across {summary.sourcesActive} permitted sources</div>
              </div>
              <div className="bg-[#0D1422]/60 rounded-xl p-3.5 border border-[#1A263D]">
                <div className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Apply Now
                </div>
                <div className="text-xl sm:text-2xl font-bold text-emerald-300 mt-1">{summary.applyNowCount}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Core evidence confirmed</div>
              </div>
              <div className="bg-[#0D1422]/60 rounded-xl p-3.5 border border-[#1A263D]">
                <div className="text-xs text-amber-400 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Build Evidence First
                </div>
                <div className="text-xl sm:text-2xl font-bold text-amber-300 mt-1">{summary.buildEvidenceCount}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Actionable skill gaps</div>
              </div>
              <div className="bg-[#0D1422]/60 rounded-xl p-3.5 border border-[#1A263D]">
                <div className="text-xs text-blue-400 font-medium">Explore & Emerging</div>
                <div className="text-xl sm:text-2xl font-bold text-blue-300 mt-1">{summary.exploreCount}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Moderate alignment</div>
              </div>
              <div className="bg-[#0D1422]/60 rounded-xl p-3.5 border border-[#1A263D]">
                <div className="text-xs text-indigo-400 font-medium">New Since Last Visit</div>
                <div className="text-xl sm:text-2xl font-bold text-indigo-300 mt-1">{summary.newSinceLastVisit}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Recently verified</div>
              </div>
              <div className="bg-[#0D1422]/60 rounded-xl p-3.5 border border-[#1A263D]">
                <div className="text-xs text-rose-400 font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-rose-400" />
                  Closing Soon
                </div>
                <div className="text-xl sm:text-2xl font-bold text-rose-300 mt-1">{summary.closingSoonCount}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Within 7 days</div>
              </div>
            </div>
          )}

          {/* Personalization Context Banner */}
          <div className="mt-5 p-3.5 rounded-xl bg-[#0F1726] border border-[#1D2B42] flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-slate-400 font-medium">Personalized from Student DNA:</span>
              <span className="px-2.5 py-1 rounded-md bg-[#182338] text-slate-200 border border-[#253552]">
                🎯 Target: <strong className="text-white">{studentContext.primaryGoal}</strong> ({studentContext.experienceTarget})
              </span>
              <span className="px-2.5 py-1 rounded-md bg-[#182338] text-slate-200 border border-[#253552]">
                📍 Mode: <strong className="text-white">India / Remote</strong>
              </span>
              <span className="px-2.5 py-1 rounded-md bg-[#182338] text-slate-200 border border-[#253552]">
                🛡️ Verified Evidence: <strong className="text-white">{studentContext.topDemonstratedSkills.join(" · ")}</strong>
              </span>
            </div>
            <button
              onClick={() => setShowPreferencesModal(true)}
              className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
            >
              [Adjust parameters]
            </button>
          </div>
        </div>

        {/* =========================================================================
            NAV TABS: APPLY NOW / BUILD EVIDENCE / EXPLORE / TRACKED
           ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E2D45] pb-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab("applyNow")}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === "applyNow"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                  : "bg-[#121927] text-slate-300 hover:bg-[#182338] border border-[#1E2D45]"
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              Apply Now
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-emerald-950/60 text-emerald-200 border border-emerald-500/30">
                {categorized.applyNow.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("buildEvidence")}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === "buildEvidence"
                  ? "bg-amber-600 text-white shadow-lg shadow-amber-600/20"
                  : "bg-[#121927] text-slate-300 hover:bg-[#182338] border border-[#1E2D45]"
              }`}
            >
              <TrendingUp className="w-4 h-4 text-amber-300" />
              Build Evidence First
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-amber-950/60 text-amber-200 border border-amber-500/30">
                {categorized.buildEvidence.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("explore")}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === "explore"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "bg-[#121927] text-slate-300 hover:bg-[#182338] border border-[#1E2D45]"
              }`}
            >
              <Layers className="w-4 h-4 text-blue-300" />
              Explore ({categorized.explore.length + categorized.verify.length})
            </button>

            <button
              onClick={() => setActiveTab("applications")}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === "applications"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "bg-[#121927] text-slate-300 hover:bg-[#182338] border border-[#1E2D45]"
              }`}
            >
              <Bookmark className="w-4 h-4 text-indigo-300" />
              Saved & Applications ({savedIds.size + Object.keys(applicationMap).length})
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-3">
            <div className="relative min-w-[200px] sm:min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search role, skill, company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#121927] border border-[#1E2D45] rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-[#121927] border border-[#1E2D45] rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="ai">AI / ML</option>
              <option value="software">Software Eng</option>
              <option value="backend">Backend</option>
            </select>
          </div>
        </div>

        {/* =========================================================================
            SECTION CONTENT / CARDS
           ========================================================================= */}
        {loading ? (
          <div className="p-16 rounded-2xl bg-[#121927] border border-[#1E2D45] text-center space-y-4">
            <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
            <h3 className="text-lg font-semibold text-white">Synthesizing Opportunity Intelligence...</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Connecting to registered corporate career portals, ATS feeds, and campus drives. Parsing Role DNA and validating candidate evidence.
            </p>
          </div>
        ) : displayedList.length === 0 ? (
          <div className="p-16 rounded-2xl bg-[#121927] border border-[#1E2D45] text-center space-y-4">
            <HelpCircle className="w-10 h-10 text-slate-500 mx-auto" />
            <h3 className="text-lg font-semibold text-white">No opportunities in this category</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {activeTab === "applications"
                ? "You haven't saved or applied to any opportunities yet. Explore the feed and bookmark roles that matter to you."
                : "Try relaxing your search terms or adjusting your preferences to view more results."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedList.map((match) => {
              const opp = match.opportunity;
              const isSaved = savedIds.has(match.opportunityId);
              const appInfo = applicationMap[match.opportunityId];
              const isApplyNow = match.recommendation === "APPLY_NOW";
              const isBuildEvidence = match.recommendation === "BUILD_EVIDENCE";
              const verifiedDays = opp.freshness === "FRESH" ? "Verified today" : "Verified active";

              return (
                <div
                  key={match.opportunityId}
                  className="rounded-2xl bg-[#121927] border border-[#1E2D45] hover:border-[#2D4367] transition-all p-5 sm:p-6 shadow-md hover:shadow-xl space-y-4 group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    {/* Company & Role Details */}
                    <div className="flex items-start gap-3.5">
                      <CompanyLogo companyName={opp.companyName} size={48} className="rounded-xl shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg sm:text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                            {opp.title}
                          </h2>
                          {isApplyNow && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              ● Strong Fit · APPLY NOW
                            </span>
                          )}
                          {isBuildEvidence && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              ● Strategic · BUILD EVIDENCE
                            </span>
                          )}
                          {match.recommendation === "EXPLORE" && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                              ● Moderate Fit
                            </span>
                          )}
                          {appInfo && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                              Status: {appInfo.stage}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                          <span className="font-semibold text-slate-200">{opp.companyName}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            {opp.location} ({opp.remoteType})
                          </span>
                          <span>·</span>
                          <span className="capitalize">{opp.employmentType}</span>
                          {opp.compensation?.stipendText && (
                            <>
                              <span>·</span>
                              <span className="text-slate-300 font-medium">{opp.compensation.stipendText}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Source & Freshness Metadata */}
                    <div className="flex items-center sm:flex-col sm:items-end gap-2 text-xs shrink-0">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#162032] text-slate-300 border border-[#24334D]">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                        <span>Source: <strong className="text-white">{opp.source}</strong></span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {verifiedDays}
                        {opp.deadline && (
                          <span className="text-amber-400/90 ml-1.5">
                            · Closes {new Date(opp.deadline).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Skills / Match Breakdown Bar */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2 border-t border-[#1A2538] text-xs">
                    {/* Matching Evidence */}
                    <div className="space-y-1.5">
                      <div className="text-slate-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>You Match ({match.matchedRequirements.length} verified):</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {match.matchedRequirements.length > 0 ? (
                          match.matchedRequirements.slice(0, 5).map((req) => (
                            <span
                              key={req}
                              className="px-2 py-0.5 rounded-md bg-emerald-950/40 text-emerald-300 border border-emerald-500/20 font-mono text-[11px]"
                            >
                              {req} ✓
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500 italic">Foundational eligibility matches</span>
                        )}
                      </div>
                    </div>

                    {/* Evidence Gaps */}
                    <div className="space-y-1.5">
                      <div className="text-slate-400 font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Evidence Gap ({match.evidenceGaps.length}):</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {match.evidenceGaps.length > 0 ? (
                          match.evidenceGaps.slice(0, 3).map((gap) => (
                            <span
                              key={gap.skill}
                              className="px-2 py-0.5 rounded-md bg-amber-950/40 text-amber-300 border border-amber-500/20 font-mono text-[11px]"
                            >
                              {gap.skill} (Missing)
                            </span>
                          ))
                        ) : (
                          <span className="text-emerald-400/90 font-medium">No critical technical gaps detected</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* "Why this opportunity?" Executive Summary */}
                  <div className="p-3 rounded-xl bg-[#0D1422] border border-[#182338] text-xs space-y-1">
                    <span className="font-semibold text-blue-400">Why Cognalyze recommends this: </span>
                    <span className="text-slate-300">{match.why.summary}</span>
                  </div>

                  {/* Concrete Action Plan Callout for BUILD_EVIDENCE */}
                  {isBuildEvidence && match.actionPlan && (
                    <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="font-bold text-amber-300 flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4 text-amber-400" />
                          Recommended Next Action: {match.actionPlan.title}
                        </div>
                        <div className="text-slate-300 text-[11px]">
                          {match.actionPlan.deliverable}
                        </div>
                      </div>
                      <Link
                        href={match.actionPlan.actionUrl}
                        className="px-3 py-1.5 rounded-lg bg-amber-600/30 text-amber-200 hover:bg-amber-600/40 border border-amber-500/40 font-semibold text-[11px] shrink-0 text-center"
                      >
                        View Action Plan →
                      </Link>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/student/opportunities/${match.opportunityId}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#1C273C] text-white hover:bg-[#263550] border border-[#2C3E5E] transition-all"
                      >
                        Deep-Dive Analysis
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </Link>

                      <button
                        onClick={() => setSelectedWhyMatch(match)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#121A28] text-blue-300 hover:bg-[#182338] border border-blue-500/30 transition-all"
                      >
                        <HelpCircle className="w-4 h-4 text-blue-400" />
                        Why?
                      </button>

                      <button
                        onClick={() => toggleSave(match.opportunityId)}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
                          isSaved
                            ? "bg-indigo-950/60 text-indigo-300 border-indigo-500/40"
                            : "bg-[#121A28] text-slate-300 hover:bg-[#182338] border-[#22314A]"
                        }`}
                      >
                        {isSaved ? <BookmarkCheck className="w-4 h-4 text-indigo-400" /> : <Bookmark className="w-4 h-4" />}
                        {isSaved ? "Saved" : "Save"}
                      </button>
                    </div>

                    <button
                      onClick={() => handleApplyClick(match)}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-lg transition-all ${
                        isApplyNow
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20"
                          : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20"
                      }`}
                    >
                      <span>Apply on {opp.source.includes("Careers") ? "Company Careers" : opp.source}</span>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* =========================================================================
          "WHY THIS OPPORTUNITY?" TRANSPARENT EXPLANATION MODAL
         ========================================================================= */}
      {selectedWhyMatch && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#121927] border border-[#22334F] rounded-2xl max-w-2xl w-full p-6 sm:p-7 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedWhyMatch(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg bg-[#182338]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                Transparent Provenance Breakdown
              </div>
              <h3 className="text-xl font-bold text-white">
                Why Cognalyze Recommends {selectedWhyMatch.opportunity.title}
              </h3>
              <p className="text-xs text-slate-400">
                {selectedWhyMatch.opportunity.companyName} · {selectedWhyMatch.opportunity.location}
              </p>
            </div>

            {/* Why This Candidate */}
            <div className="p-4 rounded-xl bg-[#0D1422] border border-[#1A263D] space-y-2">
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                1. Why This Candidate?
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedWhyMatch.why.whyThisCandidate}
              </p>
              <div className="pt-2 flex flex-wrap gap-1.5">
                {selectedWhyMatch.matchedRequirements.map((req) => (
                  <span
                    key={req}
                    className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-500/30"
                  >
                    {req} ✓
                  </span>
                ))}
              </div>
            </div>

            {/* Why This Opportunity */}
            <div className="p-4 rounded-xl bg-[#0D1422] border border-[#1A263D] space-y-2">
              <div className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                2. Why This Opportunity?
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedWhyMatch.why.whyThisOpportunity}
              </p>
            </div>

            {/* Why Now */}
            <div className="p-4 rounded-xl bg-[#0D1422] border border-[#1A263D] space-y-2">
              <div className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                3. Why Now?
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedWhyMatch.why.whyNow}
              </p>
            </div>

            {/* Eligibility Assessment */}
            <div className="p-4 rounded-xl bg-[#0D1422] border border-[#1A263D] space-y-2">
              <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                4. Eligibility Verification: {selectedWhyMatch.eligibilityResult.status}
              </div>
              <p className="text-xs text-slate-400">
                {selectedWhyMatch.eligibilityResult.explanation}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedWhyMatch(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#1C273C] text-slate-200 hover:bg-[#253550]"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedWhyMatch(null);
                  handleApplyClick(selectedWhyMatch);
                }}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-600/20"
              >
                Apply on Official Site
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          UPDATE PREFERENCES MODAL
         ========================================================================= */}
      {showPreferencesModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#121927] border border-[#22334F] rounded-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowPreferencesModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg bg-[#182338]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-blue-400" />
                Customize Opportunity Research
              </h3>
              <p className="text-xs text-slate-400">
                Tailor how Cognalyze personalizes recommendations for your Student DNA.
              </p>
            </div>

            <form onSubmit={handleUpdatePreferences} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Target Roles (comma-separated)</label>
                <input
                  type="text"
                  value={prefDraft.targetRoles}
                  onChange={(e) => setPrefDraft({ ...prefDraft, targetRoles: e.target.value })}
                  placeholder="AI/ML Engineer, Software Engineer, Backend"
                  className="w-full bg-[#0D1422] border border-[#1E2D45] rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Preferred Locations (comma-separated)</label>
                <input
                  type="text"
                  value={prefDraft.locations}
                  onChange={(e) => setPrefDraft({ ...prefDraft, locations: e.target.value })}
                  placeholder="India, Remote, Bengaluru"
                  className="w-full bg-[#0D1422] border border-[#1E2D45] rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-slate-300 font-semibold">Remote & Work Mode Preference</label>
                <div className="grid grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0D1422] border border-[#1E2D45] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefDraft.remote}
                      onChange={(e) => setPrefDraft({ ...prefDraft, remote: e.target.checked })}
                      className="rounded bg-[#162032] border-[#2A3C59] text-blue-600 focus:ring-0"
                    />
                    <span className="text-slate-200">Remote</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0D1422] border border-[#1E2D45] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefDraft.hybrid}
                      onChange={(e) => setPrefDraft({ ...prefDraft, hybrid: e.target.checked })}
                      className="rounded bg-[#162032] border-[#2A3C59] text-blue-600 focus:ring-0"
                    />
                    <span className="text-slate-200">Hybrid</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0D1422] border border-[#1E2D45] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefDraft.onsite}
                      onChange={(e) => setPrefDraft({ ...prefDraft, onsite: e.target.checked })}
                      className="rounded bg-[#162032] border-[#2A3C59] text-blue-600 focus:ring-0"
                    />
                    <span className="text-slate-200">Onsite</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-slate-300 font-semibold">Company Environments</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0D1422] border border-[#1E2D45] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefDraft.startups}
                      onChange={(e) => setPrefDraft({ ...prefDraft, startups: e.target.checked })}
                      className="rounded bg-[#162032] border-[#2A3C59] text-blue-600 focus:ring-0"
                    />
                    <span className="text-slate-200">Startups (Seed / Series A-B)</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0D1422] border border-[#1E2D45] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefDraft.enterprises}
                      onChange={(e) => setPrefDraft({ ...prefDraft, enterprises: e.target.checked })}
                      className="rounded bg-[#162032] border-[#2A3C59] text-blue-600 focus:ring-0"
                    />
                    <span className="text-slate-200">Enterprises & Scaleups</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPreferencesModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#1C273C] text-slate-200 hover:bg-[#253550]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-600/20"
                >
                  Save & Re-rank
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          DYNAMIC RE-MATCHING SIMULATOR MODAL
         ========================================================================= */}
      {showReMatchModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#121927] border border-[#22334F] rounded-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowReMatchModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg bg-[#182338]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Zap className="w-3.5 h-3.5" />
                Dynamic Intelligence Loop
              </div>
              <h3 className="text-lg font-bold text-white">
                Simulate New Evidence Registration
              </h3>
              <p className="text-xs text-slate-400">
                Demonstrates how Cognalyze re-evaluates opportunities when you add newly verified project evidence (e.g., Docker, PyTorch, Kubernetes).
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Skill / Technology Proven</label>
                <input
                  type="text"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  placeholder="e.g. Docker, PyTorch, AWS"
                  className="w-full bg-[#0D1422] border border-[#1E2D45] rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              {reMatchMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs">
                  {reMatchMessage}
                </div>
              )}

              <div className="p-3 rounded-xl bg-[#0D1422] border border-[#1A263D] text-[11px] text-slate-400">
                💡 <strong>Expected Behavior:</strong> Opportunities requiring this skill that were previously classified as <em>Build Evidence First</em> will automatically recalculate and elevate to <em>Apply Now</em>.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReMatchModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#1C273C] text-slate-200 hover:bg-[#253550]"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={reMatching || !newSkillInput.trim()}
                  onClick={handleTriggerReMatch}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${reMatching ? "animate-spin" : ""}`} />
                  {reMatching ? "Recalculating..." : "Register & Recalculate"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
