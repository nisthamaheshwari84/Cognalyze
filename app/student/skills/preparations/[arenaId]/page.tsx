import React, { Suspense } from "react";
import DedicatedArenaWorkspace from "@/components/skills/preparations/DedicatedArenaWorkspace";

interface Props {
  params: Promise<{ arenaId: string }>;
}

export default async function DedicatedArenaPage({ params }: Props) {
  const { arenaId } = await params;

  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "#667085" }}>Loading Preparation Arena...</div>}>
      <DedicatedArenaWorkspace arenaSlug={arenaId} />
    </Suspense>
  );
}

