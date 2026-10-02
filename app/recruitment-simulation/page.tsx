"use client";

import React, { Suspense } from "react";
import StudentSimulationPage from "@/app/student/simulation/page";

export default function RecruitmentSimulationRoute() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            backgroundColor: "#F6F5F1",
            color: "#667085",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          Loading Recruitment Simulation...
        </div>
      }
    >
      <StudentSimulationPage />
    </Suspense>
  );
}
