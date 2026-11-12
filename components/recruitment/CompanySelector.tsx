"use client";

import React from "react";
import { getAllCompanies } from "@/lib/recruitment/company-registry";
import { RoleFamily, HiringChannel, StudentRecruitmentJourney } from "@/lib/recruitment/types";

interface CompanySelectorProps {
  selectedCompanyId: string;
  selectedRole: RoleFamily;
  selectedChannel: HiringChannel;
  onSelectCompany: (companyId: string) => void;
  onSelectRole: (role: RoleFamily) => void;
  onSelectChannel: (channel: HiringChannel) => void;
  onStartJourney: () => void;
  isStarting: boolean;
  activeJourney: StudentRecruitmentJourney | null;
}

export default function CompanySelector({
  selectedCompanyId,
  selectedRole,
  selectedChannel,
  onSelectCompany,
  onSelectRole,
  onSelectChannel,
  onStartJourney,
  isStarting,
  activeJourney,
}: CompanySelectorProps) {
  const companies = getAllCompanies();
  const activeCompany = companies.find((c) => c.id === selectedCompanyId) || companies[0];

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "TIER_1_FAANG":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "HIGH_GROWTH_PRODUCT":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "ENTERPRISE_SERVICE":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "FINTECH_GLOBAL":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-stone-100 text-stone-700 border-stone-200";
    }
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case "TIER_1_FAANG":
        return "Tier-1 FAANG / Big Tech";
      case "HIGH_GROWTH_PRODUCT":
        return "High-Growth Product Enterprise";
      case "ENTERPRISE_SERVICE":
        return "Global Enterprise IT & Consulting";
      case "FINTECH_GLOBAL":
        return "Global Financial Technology";
      default:
        return tier;
    }
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#E4E1DA] rounded-2xl p-6 shadow-sm mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-[#E4E1DA] gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#356AE6] bg-[#356AE6]/10 px-2.5 py-0.5 rounded-full">
              Verified Recruitment Arena
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getTierColor(activeCompany.tierCategory)}`}>
              {getTierLabel(activeCompany.tierCategory)}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-[#162A43]">Select Enterprise Recruitment Journey</h2>
          <p className="text-sm text-stone-600 mt-1 max-w-2xl">
            Experience realistic hiring processes calibrated against official interview guides and corporate competency rubrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeJourney && activeJourney.companyId === selectedCompanyId && (
            <div className="text-right mr-2 hidden sm:block">
              <span className="text-xs text-stone-500 block">Active Journey Status</span>
              <span className="text-sm font-semibold text-[#162A43]">{activeJourney.status.replace(/_/g, " ")}</span>
            </div>
          )}
          <button
            onClick={onStartJourney}
            disabled={isStarting}
            className="px-5 py-2.5 bg-[#356AE6] hover:bg-[#2855C7] text-white font-medium rounded-xl transition shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            {isStarting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>Loading Journey...</span>
              </>
            ) : activeJourney && activeJourney.companyId === selectedCompanyId ? (
              <>
                <span>Resume Journey</span>
                <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded">
                  Score: {activeJourney.overallScore}%
                </span>
              </>
            ) : (
              <>
                <span>Start New Journey</span>
                <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded">Verified</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 10 Companies Horizontal Scroll / Selector */}
      <div className="pt-6">
        <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-3">
          1. Select Target Company (10 Verified Enterprises)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-5 lg:grid-cols-10 gap-2.5">
          {companies.map((company) => {
            const isSelected = company.id === selectedCompanyId;
            return (
              <button
                key={company.id}
                onClick={() => onSelectCompany(company.id)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  isSelected
                    ? "border-[#356AE6] bg-[#356AE6]/5 ring-2 ring-[#356AE6]/20 shadow-sm"
                    : "border-[#E4E1DA] hover:border-stone-400 bg-white"
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-xs font-bold text-[#162A43] mb-1.5">
                  {company.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-xs font-semibold text-[#162A43] truncate w-full">{company.name}</span>
                <span className="text-[10px] text-stone-400 truncate w-full">
                  {company.tierCategory === "TIER_1_FAANG" ? "Tier 1" : company.tierCategory === "HIGH_GROWTH_PRODUCT" ? "Product" : "Enterprise"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Role Family & Channel Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-[#E4E1DA]">
        <div>
          <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-2">
            2. Target Role Family
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "sde", label: "Software Engineer", tag: "DSA & Systems" },
              { id: "ai_ml", label: "AI / ML Engineer", tag: "Math & Models" },
              { id: "data_analyst", label: "Data Analyst", tag: "SQL & Analytics" },
            ].map((role) => (
              <button
                key={role.id}
                onClick={() => onSelectRole(role.id as RoleFamily)}
                className={`p-3 rounded-xl border text-left transition ${
                  selectedRole === role.id
                    ? "border-[#356AE6] bg-[#356AE6]/5 text-[#162A43] font-semibold"
                    : "border-[#E4E1DA] bg-white text-stone-600 hover:border-stone-400"
                }`}
              >
                <div className="text-xs font-bold">{role.label}</div>
                <div className="text-[11px] text-stone-500 mt-0.5">{role.tag}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-2">
            3. Hiring Context / Channel
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: "campus", label: "Campus Drive" },
              { id: "off_campus", label: "Off-Campus" },
              { id: "internship", label: "Internship" },
              { id: "experienced", label: "Experienced" },
            ].map((ch) => (
              <button
                key={ch.id}
                onClick={() => onSelectChannel(ch.id as HiringChannel)}
                className={`p-2.5 rounded-xl border text-center transition text-xs ${
                  selectedChannel === ch.id
                    ? "border-[#356AE6] bg-[#356AE6]/5 text-[#162A43] font-semibold"
                    : "border-[#E4E1DA] bg-white text-stone-600 hover:border-stone-400"
                }`}
              >
                {ch.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Company Overview Pill */}
      <div className="mt-4 p-3 bg-stone-50 border border-stone-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between text-xs text-stone-600 gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#162A43]">{activeCompany.name} ({activeCompany.headquarters})</span>
          <span>•</span>
          <span className="line-clamp-1">{activeCompany.overview}</span>
        </div>
        <a
          href={activeCompany.officialCareersUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#356AE6] hover:underline whitespace-nowrap font-medium flex items-center gap-1"
        >
          Official Career Portal
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
}

