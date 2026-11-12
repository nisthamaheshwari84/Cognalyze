import React, { Suspense } from "react";
import PreparationsCatalogView from "@/components/skills/preparations/PreparationsCatalogView";

export const metadata = {
  title: "Career Launch & Opportunity Preparations | Cognalyze",
  description: "Dedicated preparation environments for GSoC, Flipkart GRID, Amazon HackOn, Walmart Sparkathon, and Top SDE/AI Internships.",
};

export default function PreparationsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "#667085" }}>Loading Preparation Arenas...</div>}>
      <PreparationsCatalogView />
    </Suspense>
  );
}

