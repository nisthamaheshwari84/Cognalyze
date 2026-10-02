"use client";

import React, { useState } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";

interface CapabilityMatrixItem {
  id: string;
  name: string;
  domain: "Distributed Systems" | "Backend Systems" | "Algorithms & DSA" | "Cloud & DevOps" | "Frontend & Edge";
  status: "Verified in Code" | "Verified in Work Sample" | "Verified in Interview" | "Claimed in Portfolio" | "Identified Gap";
  proofDescription: string;
  relevanceToRoles: string[];
}

export default function StudentCapabilitiesPage() {
  const [selectedDomain, setSelectedDomain] = useState<string>("All");

  const capabilities: CapabilityMatrixItem[] = [
    {
      id: "cap-raft",
      name: "Raft Consensus & Leader Election",
      domain: "Distributed Systems",
      status: "Verified in Code",
      proofDescription: "Written in Go; passed partitioned network simulation with quorum election.",
      relevanceToRoles: ["Senior Distributed Systems Engineer", "Platform Engineer"]
    },
    {
      id: "cap-outbox",
      name: "Transactional Outbox & Kafka Streaming",
      domain: "Backend Systems",
      status: "Verified in Work Sample",
      proofDescription: "Built transactional outbox with PostgreSQL LISTEN/NOTIFY and idempotent consumer.",
      relevanceToRoles: ["Core Backend Engineer", "Payment Infrastructure Engineer"]
    },
    {
      id: "cap-mvcc",
      name: "PostgreSQL MVCC & Isolation Levels",
      domain: "Backend Systems",
      status: "Verified in Interview",
      proofDescription: "Articulated phantom reads, serialization anomalies, and VACUUM optimization under concurrent write load.",
      relevanceToRoles: ["Staff Data Engineer", "Database Reliability Engineer"]
    },
    {
      id: "cap-dsa",
      name: "Tree & Graph Traversal (DFS/BFS)",
      domain: "Algorithms & DSA",
      status: "Verified in Code",
      proofDescription: "480 LeetCode problems solved with top 1.2% contest rating; verified topological sorts and shortest path algorithms.",
      relevanceToRoles: ["All Software Engineering Roles"]
    },
    {
      id: "cap-k8s",
      name: "Kubernetes Operator & Controller Development",
      domain: "Cloud & DevOps",
      status: "Identified Gap",
      proofDescription: "Basic manifests configured; custom resource controller reconciliation loop not yet demonstrated.",
      relevanceToRoles: ["Cloud Infrastructure Engineer", "SRE"]
    },
    {
      id: "cap-nextjs",
      name: "Next.js App Router & Server Actions",
      domain: "Frontend & Edge",
      status: "Verified in Code",
      proofDescription: "Fullstack web applications authored with optimistic updates and streaming server side rendering.",
      relevanceToRoles: ["Fullstack Engineer", "Product Engineer"]
    },
    {
      id: "cap-tracing",
      name: "OpenTelemetry Distributed Tracing",
      domain: "Cloud & DevOps",
      status: "Claimed in Portfolio",
      proofDescription: "Exporter setup present in demo project; trace propagation across async boundary pending verification.",
      relevanceToRoles: ["Platform Observability Engineer"]
    }
  ];

  const domains = ["All", "Distributed Systems", "Backend Systems", "Algorithms & DSA", "Cloud & DevOps", "Frontend & Edge"];

  const filtered = selectedDomain === "All" 
    ? capabilities 
    : capabilities.filter(c => c.domain === selectedDomain);

  const getStatusBadge = (status: CapabilityMatrixItem["status"]) => {
    switch (status) {
      case "Verified in Code":
        return { bg: "#EAF4EE", color: "#2E7D5B", border: "#C8E4D3" };
      case "Verified in Work Sample":
        return { bg: "#EFF4FE", color: "#356AE6", border: "#D2E0FB" };
      case "Verified in Interview":
        return { bg: "#EFF4FE", color: "#162A43", border: "#D2E0FB" };
      case "Claimed in Portfolio":
        return { bg: "#FEF7ED", color: "#B7791F", border: "#F8D8A7" };
      case "Identified Gap":
        return { bg: "#FDF2F2", color: "#C24141", border: "#F8C8C8" };
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F6F5F1", color: "#17191C", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <AppNav role="student" />

      <main style={{ maxWidth: 1380, margin: "0 auto", padding: "32px 24px 60px" }}>
        
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 5, background: "#EFF4FE", color: "#356AE6", fontWeight: 700, border: "1px solid #D2E0FB", textTransform: "uppercase" }}>
                Capability Matrix
              </span>
              <span style={{ fontSize: 11, color: "#667085", fontWeight: 600 }}>
                Factual Competency Map
              </span>
            </div>
            <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, margin: 0, color: "#162A43", letterSpacing: "-0.5px" }}>
              Where do I stand?
            </h1>
            <p style={{ fontSize: 13, color: "#667085", margin: "8px 0 0", maxWidth: 750, lineHeight: 1.5 }}>
              A factual breakdown of what you can actually do across engineering domains. Understand which capabilities have concrete evidence and where targeted practice will yield the highest return.
            </p>
          </div>

          <Link
            href="/student/growth"
            style={{
              padding: "9px 18px",
              borderRadius: 7,
              background: "#2E7D5B",
              color: "white",
              fontSize: 13,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Resolve Gaps in Growth Track ➔
          </Link>
        </div>

        {/* DOMAIN FILTER TABS */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginBottom: 24 }}>
          {domains.map(dom => {
            const isSelected = selectedDomain === dom;
            return (
              <button
                key={dom}
                onClick={() => setSelectedDomain(dom)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 7,
                  background: isSelected ? "#EFF4FE" : "#FFFFFF",
                  border: `1px solid ${isSelected ? "#356AE6" : "#E4E1DA"}`,
                  color: isSelected ? "#356AE6" : "#667085",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                  transition: "all 0.15s ease",
                }}
              >
                {dom}
              </button>
            );
          })}
        </div>

        {/* CAPABILITIES GRID */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 16 }}>
          {filtered.map(item => {
            const badge = getStatusBadge(item.status);
            return (
              <div
                key={item.id}
                style={{
                  padding: "20px",
                  borderRadius: 10,
                  background: "#FFFFFF",
                  border: "1px solid #E4E1DA",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <span style={{ fontSize: 11, color: "#667085", fontWeight: 600 }}>{item.domain}</span>
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, fontWeight: 800 }}>
                      {item.status.toUpperCase()}
                    </span>
                  </div>

                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "#162A43", margin: "0 0 8px" }}>
                    {item.name}
                  </h3>

                  <div style={{ fontSize: 13, color: "#17191C", lineHeight: 1.5, background: "#F6F5F1", border: "1px solid #E4E1DA", padding: "10px 12px", borderRadius: 7, marginBottom: 12 }}>
                    {item.proofDescription}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", marginBottom: 4 }}>
                    RELEVANT OPPORTUNITIES:
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {item.relevanceToRoles.map((r, i) => (
                      <span key={i} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 4, background: "#F6F5F1", border: "1px solid #E4E1DA", color: "#162A43" }}>
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </main>
    </div>
  );
}
