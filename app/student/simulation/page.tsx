"use client";

import React, { useState, useEffect, Suspense } from "react";
import AppNav from "@/components/AppNav";
import UniversalCompanySelector from "@/components/recruitment/UniversalCompanySelector";
import JourneyStageStepper from "@/components/recruitment/JourneyStageStepper";
import ImmersiveStageWorkspace from "@/components/recruitment/ImmersiveStageWorkspace";
import StageResultView from "@/components/recruitment/StageResultView";
import FinalRecruitmentReportView from "@/components/recruitment/FinalRecruitmentReportView";
import {
  RoleFamily,
  HiringChannel,
  StudentRecruitmentJourney,
  RecruitmentBlueprint,
  BlueprintStageDefinition,
  StageProgressItem,
} from "@/lib/recruitment/types";
import { StageAssessmentBundle } from "@/lib/recruitment/assessment-types";
import { ParsedJobDescriptionAnalysis } from "@/lib/recruitment/company-research-engine";

type ViewMode = "SETUP" | "STAGE_WORKSPACE" | "STAGE_RESULT" | "FINAL_DOSSIER";

function RecruitmentArenaContent() {
  const [viewMode, setViewMode] = useState<ViewMode>("SETUP");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("google");
  const [selectedRole, setSelectedRole] = useState<RoleFamily>("sde");
  const [selectedChannel, setSelectedChannel] = useState<HiringChannel>("campus");
  const [selectedCountry, setSelectedCountry] = useState<string>("India");

  const [activeJourney, setActiveJourney] = useState<StudentRecruitmentJourney | null>(null);
  const [activeBlueprint, setActiveBlueprint] = useState<RecruitmentBlueprint | null>(null);
  const [activeStageId, setActiveStageId] = useState<string>("");
  const [stageBundle, setStageBundle] = useState<StageAssessmentBundle | null>(null);

  // Result view state after an attempt
  const [lastSubmittedStageId, setLastSubmittedStageId] = useState<string>("");
  const [lastSubmittedProgress, setLastSubmittedProgress] = useState<StageProgressItem | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isStartingJourney, setIsStartingJourney] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch or calibrate journey
  const fetchOrCreateJourney = async (forceNew = false, jdAnalysis?: ParsedJobDescriptionAnalysis) => {
    setIsStartingJourney(true);
    setErrorMessage(null);

    try {
      if (forceNew) {
        const createRes = await fetch("/api/recruitment/journeys", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyId: selectedCompanyId,
            roleFamily: selectedRole,
            hiringChannel: selectedChannel,
            country: selectedCountry,
            jdAnalysis,
          }),
        });

        const data = await createRes.json();
        if (!data.success) {
          throw new Error(data.error || "Failed to start journey.");
        }

        setActiveJourney(data.journey);
        await loadJourneyDetails(data.journey.id);
        setViewMode("STAGE_WORKSPACE");
      } else {
        // Look up existing journeys
        const listRes = await fetch("/api/recruitment/journeys");
        const listData = await listRes.json();

        const existing = (listData.journeys || []).find(
          (j: StudentRecruitmentJourney) =>
            j.companyId.toLowerCase() === selectedCompanyId.toLowerCase() &&
            j.roleFamily === selectedRole &&
            j.hiringChannel === selectedChannel
        );

        if (existing) {
          setActiveJourney(existing);
          await loadJourneyDetails(existing.id);
        } else {
          // Initialize draft
          const createRes = await fetch("/api/recruitment/journeys", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              companyId: selectedCompanyId,
              roleFamily: selectedRole,
              hiringChannel: selectedChannel,
              country: selectedCountry,
            }),
          });
          const createData = await createRes.json();
          if (createData.success) {
            setActiveJourney(createData.journey);
            await loadJourneyDetails(createData.journey.id);
          }
        }
      }
    } catch (err: any) {
      console.error("Journey calibration error:", err);
      setErrorMessage(err.message || "Failed to load recruitment journey.");
    } finally {
      setIsStartingJourney(false);
    }
  };

  const loadJourneyDetails = async (journeyId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/recruitment/journeys/${journeyId}`);
      const data = await res.json();

      if (data.success) {
        setActiveJourney(data.journey);
        setActiveBlueprint(data.blueprint);

        const currentId = data.journey.currentStageId || data.blueprint?.stages[0]?.id;
        setActiveStageId(currentId);

        if (currentId) {
          await loadStageAssessmentBundle(currentId);
        }
      }
    } catch (err: any) {
      console.error("Failed to load journey details:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStageAssessmentBundle = async (stageId: string) => {
    try {
      const res = await fetch(`/api/recruitment/assessments/evaluate?stageId=${stageId}`);
      const data = await res.json();
      if (data.success && data.bundle) {
        setStageBundle(data.bundle);
      } else {
        setStageBundle(null);
      }
    } catch {
      setStageBundle(null);
    }
  };

  useEffect(() => {
    fetchOrCreateJourney();
  }, [selectedCompanyId, selectedRole, selectedChannel, selectedCountry]);

  // Handle stage attempt submission
  const handleAttemptSubmitted = (updatedJourney: StudentRecruitmentJourney) => {
    setActiveJourney(updatedJourney);

    const submittedStageId = activeStageId;
    const progress = updatedJourney.stageProgress[submittedStageId];
    setLastSubmittedStageId(submittedStageId);
    setLastSubmittedProgress(progress || null);

    // If final verdict stage or journey completed, show final dossier
    if (
      updatedJourney.status === "OFFER_EXTENDED" ||
      updatedJourney.status === "DID_NOT_PASS" ||
      submittedStageId === "stage_verdict"
    ) {
      setViewMode("FINAL_DOSSIER");
    } else {
      setViewMode("STAGE_RESULT");
    }
  };

  const handleContinueToNextStage = async () => {
    if (!activeJourney || !activeBlueprint) return;

    // Find next unpassed stage whose dependencies are satisfied
    const allStages = [...activeBlueprint.stages].sort((a, b) => a.order - b.order);
    const nextCandidate = allStages.find((s) => {
      const status = activeJourney.stageProgress[s.id]?.status;
      return status !== "PASSED" && s.dependsOn.every((dep) => activeJourney.stageProgress[dep]?.status === "PASSED");
    });

    if (nextCandidate) {
      setActiveStageId(nextCandidate.id);
      await loadStageAssessmentBundle(nextCandidate.id);
      setViewMode("STAGE_WORKSPACE");
    } else {
      setViewMode("FINAL_DOSSIER");
    }
  };

  const activeStageDef = activeBlueprint?.stages.find((s) => s.id === activeStageId);
  const lastSubmittedStageDef = activeBlueprint?.stages.find((s) => s.id === lastSubmittedStageId);

  // Compute next stage def for StageResultView
  const nextStageDef = activeBlueprint
    ? activeBlueprint.stages.find(
        (s) =>
          s.id !== lastSubmittedStageId &&
          activeJourney?.stageProgress[s.id]?.status !== "PASSED" &&
          s.dependsOn.every((d) => activeJourney?.stageProgress[d]?.status === "PASSED")
      ) || null
    : null;

  return (
    <div className="min-h-screen bg-[#F6F5F1] text-stone-900 flex flex-col font-sans">
      <AppNav role="student" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {errorMessage && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
            {errorMessage}
          </div>
        )}

        {/* 1. SETUP EXPERIENCE MODE */}
        {viewMode === "SETUP" && (
          <div>
            <UniversalCompanySelector
              selectedCompanyId={selectedCompanyId}
              selectedRole={selectedRole}
              selectedChannel={selectedChannel}
              selectedCountry={selectedCountry}
              onSelectCompany={(id) => setSelectedCompanyId(id)}
              onSelectRole={(role) => setSelectedRole(role)}
              onSelectChannel={(ch) => setSelectedChannel(ch)}
              onSelectCountry={(country) => setSelectedCountry(country)}
              onStartJourney={(jd) => fetchOrCreateJourney(true, jd)}
              isStarting={isStartingJourney}
              activeJourney={activeJourney}
              activeBlueprint={activeBlueprint}
            />

            {/* Pre-flight DAG Stepper Preview */}
            {activeBlueprint && (
              <div className="bg-white border border-[#E4E1DA] rounded-2xl p-6 shadow-sm mb-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#E4E1DA] mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#162A43]">
                      Calibrated Stage Evaluation DAG
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {activeBlueprint.stages.length} Stages • Strict Prerequisite Dependencies
                    </p>
                  </div>
                  <button
                    onClick={() => setViewMode("STAGE_WORKSPACE")}
                    className="px-4 py-2 bg-[#356AE6] hover:bg-[#2855C7] text-white text-xs font-semibold rounded-xl shadow-sm transition"
                  >
                    Enter Dedicated Workspace →
                  </button>
                </div>

                <JourneyStageStepper
                  stages={activeBlueprint.stages}
                  journey={activeJourney}
                  activeStageId={activeStageId}
                  onSelectStage={(id) => {
                    setActiveStageId(id);
                    loadStageAssessmentBundle(id);
                    setViewMode("STAGE_WORKSPACE");
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* 2. IMMERSIVE DEDICATED STAGE WORKSPACE MODE */}
        {viewMode === "STAGE_WORKSPACE" && activeStageDef && activeJourney && activeBlueprint && (
          <ImmersiveStageWorkspace
            stageDef={activeStageDef}
            journey={activeJourney}
            blueprint={activeBlueprint}
            stageBundle={stageBundle}
            onAttemptSubmitted={handleAttemptSubmitted}
            onExitWorkspace={() => setViewMode("SETUP")}
          />
        )}

        {/* 3. STAGE RESULT & CONTINUATION VIEW */}
        {viewMode === "STAGE_RESULT" && lastSubmittedStageDef && lastSubmittedProgress && activeJourney && (
          <StageResultView
            stageDef={lastSubmittedStageDef}
            stageProgress={lastSubmittedProgress}
            journey={activeJourney}
            nextStageDef={nextStageDef}
            onContinueToNextStage={handleContinueToNextStage}
            onViewFinalDossier={() => setViewMode("FINAL_DOSSIER")}
          />
        )}

        {/* 4. FINAL RECRUITMENT VERDICT DOSSIER */}
        {viewMode === "FINAL_DOSSIER" && activeJourney && activeBlueprint && (
          <FinalRecruitmentReportView
            journey={activeJourney}
            blueprint={activeBlueprint}
            onResetOrNewJourney={() => {
              setViewMode("SETUP");
              fetchOrCreateJourney(true);
            }}
          />
        )}
      </main>
    </div>
  );
}

export default function StudentSimulationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F6F5F1] flex items-center justify-center text-xs text-stone-500">
          Loading Universal Recruitment Arena...
        </div>
      }
    >
      <RecruitmentArenaContent />
    </Suspense>
  );
}
