"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppNav from "@/components/AppNav";
import CompanyLogo from "@/components/CompanyLogo";
import {
  Briefcase,
  CheckCircle2,
  Clock,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  ChevronLeft,
  Building2,
  MapPin,
  CheckCircle,
  HelpCircle,
  XCircle,
  Send,
  Layers,
  FileText,
  Calendar,
  DollarSign,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  CandidateOpportunityMatch,
  ApplicationStage,
  EvidenceStatus,
} from "@/lib/opportunities/types";

export default function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const opportunityId = resolvedParams.id;

  const [studentId, setStudentId] = useState<string>("student-demo");
  const [loading, setLoading] = useState<boolean>(true);
  const [match, setMatch] = useState<CandidateOpportunityMatch | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [currentStage, setCurrentStage] = useState<ApplicationStage>("Saved");
  const [showOutcomeModal, setShowOutcomeModal] = useState<boolean>(false);
  const [outcomeReason, setOutcomeReason] = useState<string>("Interview rejected");
  const [outcomeNotes, setOutcomeNotes] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [updatingStage, setUpdatingStage] = useState<boolean>(false);

  useEffect(() => {
    const stored = localStorage.getItem("cognalyze_student_id") || "student-demo";
    setStudentId(stored);
    loadOpportunityDetail(stored);
  }, [opportunityId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadOpportunityDetail = async (cId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/opportunities/${opportunityId}?studentId=${cId}`);
      const data = await res.json();

      if (data.success && data.match) {
        setMatch(data.match);
        setIsSaved(data.isSaved);

        // Check if there's an existing tracking stage
        const trackRes = await fetch(`/api/opportunities/track?studentId=${cId}`);
        const trackData = await trackRes.json();
        if (trackData.success && Array.isArray(trackData.applications)) {
          const app = trackData.applications.find(
            (a: any) => a.record?.opportunityId === opportunityId
          );
          if (app) {
            setCurrentStage(app.record.stage);
          }
        }
      }
    } catch (err) {
      console.error("Error loading opportunity details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSave = async () => {
    if (!match) return;
    const action = isSaved ? "unsave" : "save";
    setIsSaved(!isSaved);
    showToast(isSaved ? "Removed from watchlist" : "Saved to your watchlist");

    try {
      await fetch("/api/opportunities/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          opportunityId: match.opportunityId,
          action,
        }),
      });
    } catch (err) {
      console.error("Error toggling save:", err);
    }
  };

  const handleUpdateStage = async (stage: ApplicationStage) => {
    if (!match) return;

    if (stage === "Rejected") {
      setShowOutcomeModal(true);
      return;
    }

    setUpdatingStage(true);
    setCurrentStage(stage);

    try {
      const res = await fetch("/api/opportunities/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          opportunityId: match.opportunityId,
          stage,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          stage === "Applied"
            ? "Marked as Applied! Added to your Career Memory pipeline."
            : `Application updated to ${stage}`
        );
      }
    } catch (err) {
      console.error("Error updating stage:", err);
    } finally {
      setUpdatingStage(false);
    }
  };

  const handleConfirmOutcome = async () => {
    if (!match) return;
    setUpdatingStage(true);
    setCurrentStage("Rejected");
    setShowOutcomeModal(false);

    try {
      const res = await fetch("/api/opportunities/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          opportunityId: match.opportunityId,
          stage: "Rejected",
          outcomeReason,
          feedbackNotes: outcomeNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Outcome recorded in Career Memory. Cognalyze will adapt future recommendations.");
      }
    } catch (err) {
      console.error("Error recording outcome:", err);
    } finally {
      setUpdatingStage(false);
    }
  };

  const getStatusBadge = (status: EvidenceStatus) => {
    switch (status) {
      case "PROVEN":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> PROVEN
          </span>
        );
      case "SUPPORTED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1 w-fit">
            <CheckCircle className="w-3 h-3 text-blue-400" /> SUPPORTED
          </span>
        );
      case "CLAIMED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1 w-fit">
            <AlertCircle className="w-3 h-3 text-amber-400" /> CLAIMED
          </span>
        );
      case "WEAK":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-500/15 text-slate-300 border border-slate-500/30 flex items-center gap-1 w-fit">
            WEAK
          </span>
        );
      case "MISSING":
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1 w-fit">
            <XCircle className="w-3 h-3 text-rose-400" /> MISSING
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F17] text-slate-200">
        <AppNav />
        <div className="max-w-5xl mx-auto px-4 py-20 text-center space-y-4">
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
          <h2 className="text-xl font-bold text-white">Analyzing Opportunity & Role DNA...</h2>
          <p className="text-xs text-slate-400">
            Mapping candidate evidence, verifying eligibility constraints, and generating transparent reasoning.
          </p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-[#0B0F17] text-slate-200">
        <AppNav />
        <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
          <h2 className="text-2xl font-bold text-white">Opportunity Not Found</h2>
          <p className="text-sm text-slate-400">
            This opportunity listing may have expired or is no longer active in the verified ingestion cache.
          </p>
          <Link
            href="/student/opportunities"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-500"
          >
            ← Back to Opportunities
          </Link>
        </div>
      </div>
    );
  }

  const opp = match.opportunity;
  const isApplyNow = match.recommendation === "APPLY_NOW";
  const isBuildEvidence = match.recommendation === "BUILD_EVIDENCE";

  return (
    <div className="min-h-screen bg-[#0B0F17] text-[#E2E8F0] font-sans antialiased pb-24 selection:bg-blue-600 selection:text-white">
      <AppNav />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#162032] border border-[#2B3B55] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Back Link */}
        <Link
          href="/student/opportunities"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Personalized Opportunities
        </Link>

        {/* =========================================================================
            HEADER: COMPANY & ROLE INTELLIGENCE CARD
           ========================================================================= */}
        <div className="rounded-2xl bg-[#121927] border border-[#1E2D45] p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <CompanyLogo companyName={opp.companyName} size={56} className="rounded-2xl shrink-0 mt-1" />
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    {opp.title}
                  </h1>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                  <span className="font-semibold text-slate-200 text-base">{opp.companyName}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-slate-500" />
                    {opp.location} ({opp.remoteType})
                  </span>
                  <span>·</span>
                  <span className="capitalize">{opp.employmentType}</span>
                  {opp.compensation?.stipendText && (
                    <>
                      <span>·</span>
                      <span className="text-emerald-400 font-semibold">{opp.compensation.stipendText}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Direct Apply & Save Controls */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={handleToggleSave}
                className={`p-2.5 rounded-xl border transition-all ${
                  isSaved
                    ? "bg-indigo-950/60 text-indigo-300 border-indigo-500/40"
                    : "bg-[#182338] text-slate-300 hover:bg-[#202E4A] border-[#2A3C59]"
                }`}
                title={isSaved ? "Saved" : "Save opportunity"}
              >
                {isSaved ? <BookmarkCheck className="w-5 h-5 text-indigo-400" /> : <Bookmark className="w-5 h-5" />}
              </button>

              <button
                onClick={() => {
                  window.open(opp.applicationUrl || opp.sourceUrl, "_blank", "noopener,noreferrer");
                  handleUpdateStage("Applied");
                }}
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold shadow-xl transition-all ${
                  isApplyNow
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25"
                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/25"
                }`}
              >
                <span>Apply on {opp.source.includes("Careers") ? "Company Website" : opp.source}</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Provenance & Source Metadata Bar */}
          <div className="pt-4 border-t border-[#1C283E] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">Primary Source</span>
              <span className="text-white font-medium flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                {opp.source}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Freshness State</span>
              <span className="text-slate-200 font-medium mt-0.5 block">
                {opp.freshness === "FRESH" ? "Verified today" : "Verified active"}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Application Deadline</span>
              <span className="text-slate-200 font-medium mt-0.5 block">
                {opp.deadline ? new Date(opp.deadline).toLocaleDateString() : "Rolling admissions"}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Current Pipeline Stage</span>
              <select
                value={currentStage}
                onChange={(e) => handleUpdateStage(e.target.value as ApplicationStage)}
                className="bg-[#182338] border border-[#283852] rounded-lg px-2 py-1 text-slate-200 font-semibold mt-0.5 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="Saved">Saved</option>
                <option value="Considering">Considering</option>
                <option value="Applied">Applied</option>
                <option value="Assessment">Assessment</option>
                <option value="Interview">Interviewing</option>
                <option value="Offer">Offer Received</option>
                <option value="Rejected">Rejected / Not Selected</option>
              </select>
            </div>
          </div>
        </div>

        {/* =========================================================================
            RECOMMENDATION STATUS BANNER
           ========================================================================= */}
        <div
          className={`rounded-2xl p-6 border space-y-3 ${
            isApplyNow
              ? "bg-emerald-950/20 border-emerald-500/40"
              : isBuildEvidence
              ? "bg-amber-950/20 border-amber-500/40"
              : "bg-blue-950/20 border-blue-500/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isApplyNow && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {isBuildEvidence && <TrendingUp className="w-5 h-5 text-amber-400" />}
              {!isApplyNow && !isBuildEvidence && <Sparkles className="w-5 h-5 text-blue-400" />}
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  isApplyNow ? "text-emerald-400" : isBuildEvidence ? "text-amber-400" : "text-blue-400"
                }`}
              >
                Cognalyze Recommendation: {match.recommendation.replace("_", " ")}
              </span>
            </div>
            <span className="text-xs text-slate-400">
              Opportunity Fit: <strong className="text-white">{match.matchBreakdown.roleAlignment}</strong>
            </span>
          </div>

          <p className="text-sm text-slate-200 leading-relaxed font-medium">
            {match.recommendationReason}
          </p>
        </div>

        {/* =========================================================================
            TRANSPARENT EXPLANATION: WHY THIS OPPORTUNITY?
           ========================================================================= */}
        <div className="rounded-2xl bg-[#121927] border border-[#1E2D45] p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-blue-400" />
            Transparent Provenance & Recommendation Reasoning
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Why This Candidate */}
            <div className="p-4 rounded-xl bg-[#0D1422] border border-[#1A263D] space-y-1.5">
              <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Why This Candidate?
              </div>
              <p className="text-slate-300 leading-relaxed">
                {match.why.whyThisCandidate}
              </p>
            </div>

            {/* Why This Opportunity */}
            <div className="p-4 rounded-xl bg-[#0D1422] border border-[#1A263D] space-y-1.5">
              <div className="font-bold text-blue-400 flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                Why This Opportunity?
              </div>
              <p className="text-slate-300 leading-relaxed">
                {match.why.whyThisOpportunity}
              </p>
            </div>

            {/* Why Now */}
            <div className="p-4 rounded-xl bg-[#0D1422] border border-[#1A263D] space-y-1.5">
              <div className="font-bold text-indigo-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                Why Now?
              </div>
              <p className="text-slate-300 leading-relaxed">
                {match.why.whyNow}
              </p>
            </div>
          </div>
        </div>

        {/* =========================================================================
            BUILD EVIDENCE FIRST: ACTION PLAN (IF GAPS EXIST)
           ========================================================================= */}
        {isBuildEvidence && match.actionPlan && (
          <div className="rounded-2xl bg-amber-950/15 border border-amber-500/30 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  Action Engine: {match.actionPlan.title}
                </h3>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                Strategic Gap Bridge
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {match.actionPlan.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#0D1422]/70 border border-[#1E2D45] space-y-1">
                <span className="font-semibold text-amber-400 block">Proposed Project Deliverable:</span>
                <span className="text-slate-200">{match.actionPlan.deliverable}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#0D1422]/70 border border-[#1E2D45] space-y-1">
                <span className="font-semibold text-amber-400 block">Target Technical Capabilities:</span>
                <span className="text-slate-200">{match.actionPlan.targetSkills.join(", ")}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Link
                href={match.actionPlan.actionUrl}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-all shadow-md shadow-amber-600/20"
              >
                Launch Project Blueprint in Action Engine →
              </Link>
            </div>
          </div>
        )}

        {/* =========================================================================
            EVIDENCE MAPPING TABLE: REQUIREMENT VS CANDIDATE EVIDENCE
           ========================================================================= */}
        <div className="rounded-2xl bg-[#121927] border border-[#1E2D45] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              Evidence & Requirement Mapping
            </h3>
            <span className="text-xs text-slate-400">
              Core Coverage: <strong className="text-white">{match.matchBreakdown.coreRequirementCoverage.matched} / {match.matchBreakdown.coreRequirementCoverage.total}</strong> ({match.matchBreakdown.coreRequirementCoverage.percentage}%)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1E2D45] text-slate-400">
                  <th className="pb-3 font-semibold">Requirement</th>
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold">Evidence Status</th>
                  <th className="pb-3 font-semibold">Verified Source & Provenance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A2538]">
                {match.evidenceMapping.map((item) => (
                  <tr key={item.requirement} className="hover:bg-[#162032]/40 transition-colors">
                    <td className="py-3.5 font-medium text-white pr-4">
                      {item.requirement}
                    </td>
                    <td className="py-3.5 pr-4 text-slate-400">
                      {item.isMustHave ? (
                        <span className="text-amber-400/90 font-semibold">Must Have</span>
                      ) : (
                        <span>Preferred</span>
                      )}
                    </td>
                    <td className="py-3.5 pr-4">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="py-3.5 text-slate-300">
                      {item.supportingEvidence.length > 0 ? (
                        <div className="space-y-1">
                          {item.supportingEvidence.slice(0, 1).map((s, idx) => (
                            <div key={idx} className="text-slate-300">
                              <span className="font-semibold text-slate-200">{s.source}</span>
                              {s.extractedSnippet && (
                                <p className="text-[11px] text-slate-400 italic line-clamp-1 mt-0.5">
                                  "{s.extractedSnippet}"
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">No verified artifact found</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* =========================================================================
            ROLE DNA & ELIGIBILITY VERIFICATION
           ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Role DNA Card */}
          <div className="rounded-2xl bg-[#121927] border border-[#1E2D45] p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              Role DNA Specifications
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 font-semibold block">Role Category</span>
                <span className="text-white font-medium">{opp.roleDNA.roleCategory}</span>
              </div>

              <div>
                <span className="text-slate-500 font-semibold block">Education Requirement</span>
                <span className="text-slate-200">{opp.roleDNA.educationSummary}</span>
              </div>

              <div>
                <span className="text-slate-500 font-semibold block">Graduation Window</span>
                <span className="text-slate-200">{opp.roleDNA.graduationWindow}</span>
              </div>

              <div>
                <span className="text-slate-500 font-semibold block">Experience Level</span>
                <span className="text-slate-200">
                  {opp.roleDNA.experienceYearsMin}–{opp.roleDNA.experienceYearsMax} years ({opp.experienceLevel})
                </span>
              </div>

              {opp.responsibilities && opp.responsibilities.length > 0 && (
                <div>
                  <span className="text-slate-500 font-semibold block mb-1">Key Responsibilities</span>
                  <ul className="space-y-1 list-disc list-inside text-slate-300">
                    {opp.responsibilities.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Eligibility Engine Card */}
          <div className="rounded-2xl bg-[#121927] border border-[#1E2D45] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Eligibility Engine Analysis
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  match.eligibilityResult.status === "ELIGIBLE"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : match.eligibilityResult.status === "POTENTIALLY_ELIGIBLE"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                }`}
              >
                {match.eligibilityResult.status}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300 leading-relaxed">
                {match.eligibilityResult.explanation}
              </p>

              {match.eligibilityResult.satisfiedRequirements.length > 0 && (
                <div className="space-y-1">
                  <span className="text-emerald-400 font-semibold block">Satisfied Constraints:</span>
                  <ul className="space-y-1">
                    {match.eligibilityResult.satisfiedRequirements.map((req, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {match.eligibilityResult.blockers.length > 0 && (
                <div className="space-y-1 pt-1">
                  <span className="text-rose-400 font-semibold block">Identified Blockers:</span>
                  <ul className="space-y-1">
                    {match.eligibilityResult.blockers.map((b, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-rose-300">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            BOTTOM ACTIONS
           ========================================================================= */}
        <div className="rounded-2xl bg-[#121927] border border-[#1E2D45] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            Source link: <span className="text-slate-200">{opp.sourceUrl}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleUpdateStage("Applied")}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#1C273C] text-slate-200 hover:bg-[#253550] border border-[#2D3E5D]"
            >
              Mark as Applied
            </button>
            <button
              onClick={() => {
                window.open(opp.applicationUrl || opp.sourceUrl, "_blank", "noopener,noreferrer");
                handleUpdateStage("Applied");
              }}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20"
            >
              <span>Apply on Company Website</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

      {/* =========================================================================
          RECORD OUTCOME MODAL (CAREER MEMORY FEEDBACK LOOP)
         ========================================================================= */}
      {showOutcomeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#121927] border border-[#22334F] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Record Application Outcome</h3>
              <p className="text-xs text-slate-400">
                Help Cognalyze learn from this outcome. This refines your Student DNA and improves future opportunity recommendations.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">What stage was the decision made?</label>
                <select
                  value={outcomeReason}
                  onChange={(e) => setOutcomeReason(e.target.value)}
                  className="w-full bg-[#0D1422] border border-[#1E2D45] rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="Resume screening rejected">Resume screening rejected</option>
                  <option value="Online assessment rejected">Online assessment (OA) rejected</option>
                  <option value="Technical interview rejected">Technical interview rejected</option>
                  <option value="Eligibility or graduation year mismatch">Eligibility or graduation year mismatch</option>
                  <option value="Position filled / cancelled">Position filled or cancelled</option>
                  <option value="Unknown / No response">Unknown / No response</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Optional Feedback / Notes</label>
                <textarea
                  value={outcomeNotes}
                  onChange={(e) => setOutcomeNotes(e.target.value)}
                  placeholder="e.g. interviewer asked for advanced distributed concurrency which I hadn't evidenced..."
                  rows={3}
                  className="w-full bg-[#0D1422] border border-[#1E2D45] rounded-xl p-3 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowOutcomeModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#1C273C] text-slate-200 hover:bg-[#253550]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmOutcome}
                  disabled={updatingStage}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20"
                >
                  Save to Career Memory
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
