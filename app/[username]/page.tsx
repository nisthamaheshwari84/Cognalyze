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
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg-canvas)",
        color: "var(--text-primary)",
        fontFamily: "var(--font-inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
      }}
      className="relative overflow-x-hidden"
    >
      {/* Top Navbar */}
      <header
        style={{
          backgroundColor: "var(--bg-navbar)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
        className="relative z-10"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-bold text-base tracking-tight flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <span>Cognalyze</span>
            <span
              style={{
                backgroundColor: "var(--bg-surface-inner)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-subtle)",
              }}
              className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold"
            >
              Public Passport
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/signup"
              style={{
                backgroundColor: "var(--accent)",
                color: "#FFFFFF",
              }}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-opacity hover:opacity-90"
            >
              Create your profile
            </Link>
          </div>
        </div>
      </header>

      {/* Main Profile Canvas */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        {/* Profile Card Header */}
        <div
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            boxShadow: "var(--shadow-card)",
          }}
          className="rounded-xl p-6 sm:p-8 space-y-6"
        >
          <div
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
            className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 pb-6"
          >
            <div className="flex items-start gap-4">
              <div
                style={{
                  backgroundColor: "var(--bg-surface-inner)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--accent)",
                }}
                className="w-16 h-16 rounded-xl flex items-center justify-center font-bold text-xl shrink-0"
              >
                {profile.fullName.slice(0, 2).toUpperCase()}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h1 style={{ color: "var(--text-primary)" }} className="text-xl sm:text-2xl font-bold tracking-tight">
                    {profile.fullName}
                  </h1>
                  <span
                    style={{
                      color: "var(--accent)",
                      backgroundColor: "var(--color-info-bg)",
                      border: "1px solid var(--border-subtle)",
                    }}
                    className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold"
                  >
                    @{profile.username}
                  </span>
                </div>

                <p style={{ color: "var(--text-secondary)" }} className="text-sm font-medium">
                  {profile.degree} · Class of {profile.graduationYear}
                </p>

                <p style={{ color: "var(--text-muted)" }} className="text-xs">
                  {profile.college}
                </p>
              </div>
            </div>

            {/* Identity Badge */}
            <div
              style={{
                backgroundColor: "var(--color-success-bg)",
                border: "1px solid var(--color-success)",
                color: "var(--color-success)",
              }}
              className="flex items-center gap-2 self-start sm:self-auto px-2.5 py-1 rounded-full text-xs font-semibold"
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--color-success)" }} />
              <span>Identity Verified</span>
            </div>
          </div>

          {/* Technical Interests */}
          {profile.primaryInterests && profile.primaryInterests.length > 0 && (
            <div className="space-y-2">
              <span style={{ color: "var(--text-muted)" }} className="text-xs font-mono font-semibold uppercase tracking-wider block">
                Focus Areas
              </span>
              <div className="flex flex-wrap gap-2">
                {profile.primaryInterests.map((interest, idx) => (
                  <span
                    key={idx}
                    style={{
                      backgroundColor: "var(--bg-surface-inner)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-primary)",
                    }}
                    className="px-3 py-1 rounded-md text-xs font-semibold"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Connected Accounts */}
          <div style={{ borderTop: "1px solid var(--border-subtle)" }} className="space-y-2 pt-4">
            <span style={{ color: "var(--text-muted)" }} className="text-xs font-mono font-semibold uppercase tracking-wider block">
              Connected Proof Channels
            </span>
            <div className="flex flex-wrap gap-3">
              <div
                style={{
                  backgroundColor: profile.connectedAccounts.github ? "var(--color-success-bg)" : "var(--bg-surface-inner)",
                  borderColor: profile.connectedAccounts.github ? "var(--color-success)" : "var(--border-subtle)",
                  color: profile.connectedAccounts.github ? "var(--color-success)" : "var(--text-muted)",
                }}
                className="px-3 py-1.5 rounded-lg border text-xs flex items-center gap-2 font-medium"
              >
                <span>●</span>
                <span>GitHub {profile.connectedAccounts.github ? "Connected" : "Not connected"}</span>
              </div>

              <div
                style={{
                  backgroundColor: profile.connectedAccounts.linkedin ? "var(--color-success-bg)" : "var(--bg-surface-inner)",
                  borderColor: profile.connectedAccounts.linkedin ? "var(--color-success)" : "var(--border-subtle)",
                  color: profile.connectedAccounts.linkedin ? "var(--color-success)" : "var(--text-muted)",
                }}
                className="px-3 py-1.5 rounded-lg border text-xs flex items-center gap-2 font-medium"
              >
                <span>●</span>
                <span>LinkedIn {profile.connectedAccounts.linkedin ? "Connected" : "Not connected"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Observable Evidence Layer */}
        <div
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            boxShadow: "var(--shadow-card)",
          }}
          className="rounded-xl p-6 sm:p-8 space-y-6"
        >
          <div style={{ borderBottom: "1px solid var(--border-subtle)" }} className="flex items-center justify-between pb-4">
            <div>
              <span style={{ color: "var(--accent)" }} className="text-xs font-mono font-semibold uppercase tracking-wider block">
                Evidence Layer
              </span>
              <h2 style={{ color: "var(--text-primary)" }} className="text-lg font-bold">
                Technical Capabilities & Observed Work
              </h2>
            </div>
            <span
              style={{
                backgroundColor: "var(--bg-surface-inner)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-subtle)",
              }}
              className="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold"
            >
              Provenance Verified
            </span>
          </div>

          <div className="space-y-3">
            {profile.evidenceSignals.map((item, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: "var(--bg-surface-inner)",
                  border: "1px solid var(--border-subtle)",
                }}
                className="p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span style={{ color: "var(--color-success)" }} className="font-bold">✓</span>
                    <span style={{ color: "var(--text-primary)" }} className="font-semibold text-sm">{item.name}</span>
                    <span
                      style={{
                        backgroundColor: "var(--color-success-bg)",
                        color: "var(--color-success)",
                        borderColor: "var(--color-success)",
                      }}
                      className="px-2 py-0.5 rounded text-[10px] font-mono uppercase border font-semibold"
                    >
                      {item.status.replace("_", " ")}
                    </span>
                  </div>
                  {item.details && (
                    <p style={{ color: "var(--text-secondary)" }} className="text-[11px] pl-4">{item.details}</p>
                  )}
                </div>

                <span style={{ color: "var(--text-muted)" }} className="text-[11px] font-mono pl-4 sm:pl-0 shrink-0">
                  {item.source}
                </span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px solid var(--border-subtle)", color: "var(--text-muted)" }} className="pt-2 text-xs font-mono flex items-center justify-between">
            <span>Direct repository inspection · Zero keyword gaming</span>
            <span>Cognalyze Verified Identity</span>
          </div>
        </div>
      </main>
    </div>
  );
}
