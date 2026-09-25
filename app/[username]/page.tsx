import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicProfileByUsername } from "@/lib/auth/store";

interface PublicProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { username: rawUsername } = await params;
  const decoded = decodeURIComponent(rawUsername).replace(/^@/, "").toLowerCase();

  const profile = getPublicProfileByUsername(decoded);

  if (!profile) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 selection:bg-indigo-500/20 selection:text-indigo-200 relative overflow-x-hidden font-sans">
      {/* Background Texture */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px"
        }}
      />

      {/* Top Navbar */}
      <header className="relative z-10 border-b border-white/5 bg-[#080b11]/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-semibold text-base tracking-tight text-white flex items-center gap-2">
            <span>Cognalyze</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5">
              Profile
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/signup"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
            >
              Create your profile
            </Link>
          </div>
        </div>
      </header>

      {/* Main Profile Canvas */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        {/* Profile Card Header */}
        <div className="rounded-xl border border-white/10 bg-[#0e131f] p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 pb-6 border-b border-white/5">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-[#161d2d] border border-white/10 flex items-center justify-center text-slate-100 font-bold text-xl shrink-0">
                {profile.fullName.slice(0, 2).toUpperCase()}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                    {profile.fullName}
                  </h1>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono text-indigo-400 bg-indigo-950/60 border border-indigo-800/40">
                    @{profile.username}
                  </span>
                </div>

                <p className="text-sm text-slate-300">
                  {profile.degree} · Class of {profile.graduationYear}
                </p>

                <p className="text-xs text-slate-400">
                  {profile.college}
                </p>
              </div>
            </div>

            {/* Identity Badge */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-mono text-emerald-400">
                Identity Verified
              </span>
            </div>
          </div>

          {/* Technical Interests */}
          {profile.primaryInterests && profile.primaryInterests.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 block">
                Focus Areas
              </span>
              <div className="flex flex-wrap gap-2">
                {profile.primaryInterests.map((interest, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-md text-xs font-medium bg-[#141b2b] border border-white/5 text-slate-200"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Connected Accounts */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 block">
              Connected Proof Channels
            </span>
            <div className="flex flex-wrap gap-3">
              <div className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-2 ${
                profile.connectedAccounts.github
                  ? "bg-emerald-950/30 border-emerald-800/40 text-emerald-300"
                  : "bg-white/5 border-white/5 text-slate-500"
              }`}>
                <span>●</span>
                <span>GitHub {profile.connectedAccounts.github ? "Connected" : "Not connected"}</span>
              </div>

              <div className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-2 ${
                profile.connectedAccounts.linkedin
                  ? "bg-emerald-950/30 border-emerald-800/40 text-emerald-300"
                  : "bg-white/5 border-white/5 text-slate-500"
              }`}>
                <span>●</span>
                <span>LinkedIn {profile.connectedAccounts.linkedin ? "Connected" : "Not connected"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Observable Evidence Layer */}
        <div className="rounded-xl border border-white/10 bg-[#0e131f] p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <div>
              <span className="text-xs font-mono font-semibold text-indigo-400 uppercase tracking-wider block">
                Evidence Layer
              </span>
              <h2 className="text-lg font-bold text-white">
                Technical Capabilities & Observed Work
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5 uppercase">
              Provenance Verified
            </span>
          </div>

          <div className="space-y-3">
            {profile.evidenceSignals.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg bg-[#121826] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span className="font-semibold text-slate-200 text-sm">{item.name}</span>
                    <span className="px-2 py-0.2 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800/40 uppercase">
                      {item.status.replace("_", " ")}
                    </span>
                  </div>
                  {item.details && (
                    <p className="text-slate-400 text-[11px] pl-4">{item.details}</p>
                  )}
                </div>

                <span className="text-[11px] font-mono text-slate-500 pl-4 sm:pl-0 shrink-0">
                  {item.source}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 text-xs text-slate-500 font-mono flex items-center justify-between border-t border-white/5">
            <span>Direct repository inspection · Zero keyword gaming</span>
            <span>Cognalyze Verified Identity</span>
          </div>
        </div>
      </main>
    </div>
  );
}
