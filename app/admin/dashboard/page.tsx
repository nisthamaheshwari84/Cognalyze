"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";
import { ShieldAlert, Database, RefreshCw, CheckCircle2, ArrowRight, LayoutDashboard, Globe, Users } from "lucide-react";

export default function AdminDashboardPage() {
  const { isDark } = useTheme();
  const [stats, setStats] = useState({
    totalOpportunities: 35,
    activeFeeds: 5,
    systemStatus: "Operational",
    verifiedCrawlers: "Active"
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: isDark ? "#07111F" : "#F6F5F1",
        color: isDark ? "#F2F6FC" : "#17191C",
        fontFamily: "var(--font-inter, -apple-system, BlinkMacSystemFont, sans-serif)",
        padding: "32px 24px"
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "#DC2626",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: 800
              }}
            >
              🛡️
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: "-0.4px" }}>
                  Admin Intelligence Console
                </h1>
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(220, 38, 38, 0.15)", color: "#DC2626", fontWeight: 700 }}>
                  SYSTEM ADMIN
                </span>
              </div>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: isDark ? "#94A3B8" : "#667085" }}>
                Platform operations, opportunity ingestion, and network integrity.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Link href="/" style={{ textDecoration: "none" }}>
              <button
                style={{
                  padding: "8px 16px",
                  borderRadius: 7,
                  background: isDark ? "#13243A" : "#FFFFFF",
                  border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                  color: isDark ? "#F2F6FC" : "#17191C",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                ← Return to Platform
              </button>
            </Link>
            <Link href="/admin/opportunities" style={{ textDecoration: "none" }}>
              <button
                style={{
                  padding: "8px 18px",
                  borderRadius: 7,
                  background: "#356AE6",
                  color: "#FFFFFF",
                  border: "none",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <span>Opportunities Ingestion</span>
                <ArrowRight size={14} />
              </button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 28 }}>
          {[
            { label: "Total Opportunities", value: stats.totalOpportunities, icon: "🎯", color: "#356AE6" },
            { label: "Active Permitted Sources", value: stats.activeFeeds, icon: "🌐", color: "#059669" },
            { label: "System Core Status", value: stats.systemStatus, icon: "⚡", color: "#16A34A" },
            { label: "Crawlers & Ingestion", value: stats.verifiedCrawlers, icon: "🤖", color: "#D97706" },
          ].map((card, i) => (
            <div
              key={i}
              style={{
                padding: "20px",
                borderRadius: 10,
                background: isDark ? "#0E1B2E" : "#FFFFFF",
                border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: isDark ? "#94A3B8" : "#667085", fontWeight: 600 }}>{card.label}</span>
                <span style={{ fontSize: 18 }}>{card.icon}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: card.color }}>
                {card.value}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions & Modules */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div
            style={{
              padding: "24px",
              borderRadius: 12,
              background: isDark ? "#0E1B2E" : "#FFFFFF",
              border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Database size={18} color="#356AE6" />
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Opportunity Radar & Sync</h2>
            </div>
            <p style={{ fontSize: 13, color: isDark ? "#94A3B8" : "#667085", lineHeight: 1.5, margin: "0 0 16px" }}>
              Ingest new job descriptions, hackathons, and open source fellowships. Manage active tiers, requirements, and domain tags.
            </p>
            <Link href="/admin/opportunities" style={{ textDecoration: "none" }}>
              <button
                style={{
                  padding: "8px 16px",
                  borderRadius: 7,
                  background: isDark ? "#13243A" : "#EFF4FE",
                  border: `1px solid ${isDark ? "#223750" : "#D2E0FB"}`,
                  color: "#356AE6",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Open Ingestion Suite →
              </button>
            </Link>
          </div>

          <div
            style={{
              padding: "24px",
              borderRadius: 12,
              background: isDark ? "#0E1B2E" : "#FFFFFF",
              border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <ShieldAlert size={18} color="#DC2626" />
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Role & RBAC Security</h2>
            </div>
            <p style={{ fontSize: 13, color: isDark ? "#94A3B8" : "#667085", lineHeight: 1.5, margin: "0 0 16px" }}>
              Multi-tenant student isolation, corporate work email verification, and deterministic evidence cryptographic protection.
            </p>
            <Link href="/recruiter/dashboard" style={{ textDecoration: "none" }}>
              <button
                style={{
                  padding: "8px 16px",
                  borderRadius: 7,
                  background: isDark ? "#13243A" : "#F6F5F1",
                  border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                  color: isDark ? "#F2F6FC" : "#17191C",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Inspect Recruiter Command Center →
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
