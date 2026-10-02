"use client";

import React, { Suspense } from "react";
import DsaTrackerPage from "@/app/student/dsa-tracker/page";

export default function DsaTrackerRoute() {
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
          Loading DSA Tracker...
        </div>
      }
    >
      <DsaTrackerPage />
    </Suspense>
  );
}
