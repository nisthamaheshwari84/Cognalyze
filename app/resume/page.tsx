"use client";

import React, { Suspense } from "react";
import AppNav from "@/components/AppNav";
import ResumeBuilderView from "@/components/resume/ResumeBuilderView";

export default function ResumePage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F6F5F1", color: "#17191C", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <AppNav role="student" />
      <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "#667085" }}>Loading Resume Workspace...</div>}>
        <ResumeBuilderView />
      </Suspense>
    </div>
  );
}