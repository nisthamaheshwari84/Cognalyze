"use client";

import React from "react";
import AppNav from "@/components/AppNav";
import CollaborationFeed from "@/components/collab/CollaborationFeed";

export default function StudentCollaborationPage() {
  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col font-sans">
      <AppNav />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 space-y-6">
        {/* Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
            <span>🤝</span> Verified Enterprise Placement
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Collaboration Feed
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Direct collaboration roles posted exclusively by enterprise recruiters. When you apply, your verified Cognalyze DNA radar and project credentials are automatically attached as a frozen snapshot.
          </p>
        </div>

        {/* Feed Component */}
        <CollaborationFeed />
      </main>
    </div>
  );
}
