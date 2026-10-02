"use client";

import React, { Suspense } from "react";
import SkillPracticeHubPage from "@/app/student/skills/page";

export default function SkillPracticeRoute() {
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
          Loading Skill Practice Hub...
        </div>
      }
    >
      <SkillPracticeHubPage />
    </Suspense>
  );
}
