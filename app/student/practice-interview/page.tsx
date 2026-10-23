"use client";

import React, { Suspense } from "react";
import MockInterviewExperience from "@/components/interview/MockInterviewExperience";

export default function StudentPracticeInterviewPage() {
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
            fontWeight: 600,
          }}
        >
          Loading Personalized Interview Arena...
        </div>
      }
    >
      <MockInterviewExperience />
    </Suspense>
  );
}
