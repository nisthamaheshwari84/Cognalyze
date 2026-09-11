"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { SystemDesignChallenge, SEED_SYSTEM_DESIGN_CHALLENGES } from "@/lib/skill-hub-store";

export default function SystemDesignPage() {
  const [challenges, setChallenges] = useState<SystemDesignChallenge[]>(SEED_SYSTEM_DESIGN_CHALLENGES);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>(SEED_SYSTEM_DESIGN_CHALLENGES[0].id);
  
  // Interactive architectural inputs
  const [candidateArchitecture, setCandidateArchitecture] = useState("");
  const [databaseChoice, setDatabaseChoice] = useState("");
  const [cachingStrategy, setCachingStrategy] = useState("");
  const [bottleneckStrategy, setBottleneckStrategy] = useState("");

  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<any>(null);

  const activeChallenge = challenges.find(c => c.id === selectedChallengeId) || challenges[0];

  const handleSelectChallenge = (id: string) => {
    setSelectedChallengeId(id);
    setCandidateArchitecture("");
    setDatabaseChoice("");
    setCachingStrategy("");
    setBottleneckStrategy("");
    setEvalResult(null);
  };

  const handleQuickFillExample = () => {
    if (activeChallenge.id === "sd-1" || activeChallenge.id === "sd_rate_limiter") {
      setCandidateArchitecture("Clients -> Cloudflare CDN -> AWS ALB -> Node.js API Gateway -> Rate Limiter Middleware. The middleware queries an in-memory Redis cluster before proxying requests to internal backend microservices.");
      setDatabaseChoice("Redis Cluster with Redis Sentinel for automatic failover. For long-term audit logs and user plan quotas, PostgreSQL RDS with read replicas.");
      setCachingStrategy("Redis sliding window counter using Redis Hashes. Set TTL on keys equal to the rate limit window (e.g., 60 seconds). Execute check-and-increment atomically using Lua scripts.");
      setBottleneckStrategy("If Redis becomes unreachable, fail-open for critical tier-1 users to prevent complete system downtime. Use distributed lock (Redlock) or local in-memory token bucket on API Gateway as secondary fallback.");
    } else if (activeChallenge.id === "sd-2" || activeChallenge.id === "sd_tinyurl") {
      setCandidateArchitecture("Clients -> NGINX Reverse Proxy -> URL Service instances (Stateless Go/Java microservices) -> Read Cache (Redis) -> NoSQL Database (Cassandra/DynamoDB) with range/hash partitioning on short_key.");
      setDatabaseChoice("Distributed NoSQL (Cassandra or AWS DynamoDB). A relational database would hit horizontal scaling limits with billions of records. DynamoDB provides single-digit millisecond latency keyed on short_hash.");
      setCachingStrategy("Cache-Aside pattern using Redis. Cache the top 20% most active URLs (Pareto Principle). Use LRU (Least Recently Used) eviction policy. 80% of traffic will be served directly from memory.");
      setBottleneckStrategy("Hash collisions: Use pre-allocated unique 64-bit ID generator (Twitter Snowflake or ZooKeeper range counter), then encode to Base62. Read replicas deployed in multiple AWS regions behind Route 53 Geo-DNS.");
    } else if (activeChallenge.id === "sd-3" || activeChallenge.id === "sd_whatsapp_chat") {
      setCandidateArchitecture("Clients -> TLS Load Balancer -> WebSocket Gateway Cluster (maintains persistent bi-directional TCP connections) -> Chat Routing Service -> Apache Kafka message queues -> Push Notification Service (APNs/FCM for offline users) + Cassandra persistence.");
      setDatabaseChoice("Apache Cassandra / ScyllaDB for chat history partitioned by (chat_id, bucket_timestamp) with clustering key message_id DESC. Redis Cluster for active session-to-gateway mapping (user_id -> gateway_server_ip).");
      setCachingStrategy("Redis ephemeral pub/sub for instant routing state and presence status (online/offline/last seen). In-memory ring buffer on WebSocket servers for recently delivered messages.");
      setBottleneckStrategy("Group chats with thousands of users: Avoid fanout-on-write at WebSocket tier. Use Kafka topic partitioning per group_id, where workers batch delivery messages to gateway servers holding recipient sockets.");
    } else if (activeChallenge.id === "sd-4" || activeChallenge.id === "sd_uber_dispatch") {
      setCandidateArchitecture("Driver App (Heartbeat every 4s) -> Driver Location Ingestion Service (Netty/Go) -> Redis Geospatial / Uber H3 cluster -> Location Dispatch Engine. Rider Request -> Matching Service queries H3 hexagon rings (radius expansion k=1,2,3) -> Kafka dispatch event -> Driver push offer.");
      setDatabaseChoice("Redis with geospatial indexes or Uber H3 hierarchical hexagonal spatial index in-memory. PostgreSQL + PostGIS for historical trip audit trails and completed ride trajectories.");
      setCachingStrategy("In-memory ephemeral geohash grids in Redis. Driver coordinates are updated with TTL to avoid stale driver availability during network drops.");
      setBottleneckStrategy("Thundering herd matching conflict: When 2 riders request in the same area, driver acceptance uses distributed Redis locks (or single atomic Lua script) so a driver cannot receive or accept concurrent trip assignments.");
    } else if (activeChallenge.id === "sd-5" || activeChallenge.id === "sd_flash_sale") {
      setCandidateArchitecture("Users -> Akamai CDN (Static Assets & Virtual Waiting Room) -> API Gateway with Token Bucket rate limiter -> Inventory Reservation Service -> Redis In-Memory Stock Decrementer (Lua Script) -> Apache Kafka -> Async Order & Payment Processing Workers -> PostgreSQL.");
      setDatabaseChoice("Redis Cluster for atomic in-memory stock counter (DECRBY) with Lua scripting. PostgreSQL with optimistic concurrency control (version column) for persistent finalized orders.");
      setCachingStrategy("Redis holding inventory counters initialized before sale starts. High-frequency item metadata cached at Edge CDN so 99% of page load traffic bypasses backend database.");
      setBottleneckStrategy("Overselling & Race Conditions: All stock validation and decrements are performed atomically inside single Redis Lua script (if stock >= qty then redis.call('decrby') return 1 else return 0). Async reconciliation worker verifies Kafka orders against Redis counts.");
    } else if (activeChallenge.id === "sd-6" || activeChallenge.id === "sd_netflix_cdn") {
      setCandidateArchitecture("Clients -> Open Connect CDN Edges (deployed inside ISP partner networks) for chunked byte streaming (HLS/DASH). For catalog/metadata/auth: AWS API Gateway -> Microservices (Spring Boot/Go) -> Redis Cache -> Amazon DynamoDB/CockroachDB.");
      setDatabaseChoice("Amazon DynamoDB for user metadata, viewing history, and bookmarks (partition key user_id). Apache Cassandra for real-time telemetry and playback heartbeat events.");
      setCachingStrategy("Multi-tier caching: Local device cache for UI state; Redis cluster for user bookmark and playback position; Geographically distributed CDN nodes cache video byte chunks based on predictive popularity models.");
      setBottleneckStrategy("Hot video release: Proactive pre-warming of Open Connect CDN edge appliances overnight across all major Indian ISPs before official episode release time. Adaptive bitrate streaming dynamically lowers resolution under ISP throttling.");
    }
  };

  const handleSubmitArchitecture = async () => {
    if (!candidateArchitecture.trim()) {
      alert("Please describe your architectural components and request flow.");
      return;
    }

    setEvaluating(true);
    setEvalResult(null);

    try {
      const res = await fetch("/api/skills/system-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: activeChallenge.id,
          candidateArchitecture,
          databaseChoice,
          cachingStrategy,
          bottleneckStrategy
        })
      });

      const data = await res.json();
      if (data.evaluation) {
        setEvalResult(data.evaluation);
      }
    } catch (err) {
      console.error("System design evaluation error:", err);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#090d16", color: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
      {/* ── HEADER ── */}
      <header style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", backgroundColor: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(16px)", padding: "16px 24px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1300, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <Link href="/student/skills" style={{ color: "#94a3b8", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
                ← Skill Practice Hub
              </Link>
              <span style={{ color: "rgba(255,255,255,0.2)" }}>/</span>
              <span style={{ color: "#818cf8", fontSize: 13, fontWeight: 700 }}>System Design & Architecture Studio</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: "-0.5px" }}>
              🏗️ High-Scale System Design Arena
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 8, background: "rgba(99,102,241,0.15)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.3)", fontWeight: 700 }}>
              🏛️ Amazon L4/L5, Google & Razorpay Product Track
            </span>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1300, margin: "0 auto", padding: "24px 20px" }}>
        
        {/* System Design Challenge Selector */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
            SELECT SYSTEM DESIGN CHALLENGE:
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))", gap: 14 }}>
            {challenges.map(c => {
              const isSelected = c.id === activeChallenge.id;
              return (
                <div
                  key={c.id}
                  onClick={() => handleSelectChallenge(c.id)}
                  style={{
                    padding: "16px 20px",
                    borderRadius: 14,
                    background: isSelected ? "linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(15,23,42,0.95) 100%)" : "rgba(15, 23, 42, 0.6)",
                    border: isSelected ? "2px solid #6366f1" : "1px solid rgba(255,255,255,0.08)",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(99,102,241,0.2)", color: "#818cf8", fontWeight: 800 }}>
                      SYSTEM DESIGN ROUND
                    </span>
                    <span style={{ fontSize: 11, color: "#cbd5e1" }}>
                      ⏱️ 45 Mins
                    </span>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 6px", color: "white" }}>
                    {c.title}
                  </h3>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>
                    {c.scale_metrics}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ACTIVE CHALLENGE SPECIFICATION DOSSIER */}
        <div style={{ background: "rgba(15, 23, 42, 0.9)", border: "1px solid rgba(99, 102, 241, 0.3)", borderRadius: 16, padding: "24px", marginBottom: 24, boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
            <div>
              <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: "rgba(99,102,241,0.2)", color: "#818cf8", fontWeight: 800 }}>
                SCALE & CONSTRAINTS SPECIFICATION
              </span>
              <h2 style={{ fontSize: 20, fontWeight: 900, margin: "6px 0 2px", color: "white" }}>
                {activeChallenge.title}
              </h2>
              <div style={{ fontSize: 13, color: "#38bdf8", fontWeight: 700, marginTop: 4 }}>
                ⚡ Production Scale: {activeChallenge.scale_metrics}
              </div>
            </div>

            <button
              onClick={handleQuickFillExample}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: "1px solid rgba(99, 102, 241, 0.4)",
                background: "rgba(99, 102, 241, 0.15)",
                color: "#a5b4fc",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              💡 Preload Senior SDE-2 Architecture Sample
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: 14 }}>
            <div style={{ padding: "14px", background: "rgba(0,0,0,0.3)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 11, color: "#818cf8", fontWeight: 800, marginBottom: 6 }}>
                FUNCTIONAL REQUIREMENTS:
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.6 }}>
                {activeChallenge.functional_requirements.map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>
            </div>

            <div style={{ padding: "14px", background: "rgba(0,0,0,0.3)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 11, color: "#38bdf8", fontWeight: 800, marginBottom: 6 }}>
                CORE ARCHITECTURAL COMPONENTS EXPECTED:
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {activeChallenge.ideal_solution.components.map((comp, i) => (
                  <span key={i} style={{ fontSize: 11, padding: "4px 8px", borderRadius: 6, background: "rgba(56,189,248,0.1)", color: "#bae6fd" }}>
                    📦 {comp}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ARCHITECTURE PROPOSAL FORM */}
        <div style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 16, padding: "24px", marginBottom: 28 }}>
          
          <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 16px", color: "white" }}>
            Submit Your System Architecture Proposal
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            
            {/* 1. Request Flow & Components */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#cbd5e1", marginBottom: 6 }}>
                1. System Components & End-to-End Request Flow *
              </label>
              <textarea
                value={candidateArchitecture}
                onChange={e => setCandidateArchitecture(e.target.value)}
                placeholder="Walk through the path of a request from client to CDN, load balancer, API gateways, microservices, and storage layers..."
                rows={4}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 10,
                  background: "#050811",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#f8fafc",
                  fontSize: 13,
                  lineHeight: 1.5,
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>

            {/* 2. Database Selection */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#cbd5e1", marginBottom: 6 }}>
                2. Database Strategy & Data Modeling (SQL vs NoSQL, Sharding Key)
              </label>
              <textarea
                value={databaseChoice}
                onChange={e => setDatabaseChoice(e.target.value)}
                placeholder="Which datastore did you choose (Cassandra, DynamoDB, PostgreSQL, Redis) and why? How will the schema be partitioned?"
                rows={2}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 10,
                  background: "#050811",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#f8fafc",
                  fontSize: 13,
                  lineHeight: 1.5,
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>

            {/* 3. Caching Strategy */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#cbd5e1", marginBottom: 6 }}>
                3. Caching & Memory Layer (Eviction, Invalidation, Consistency)
              </label>
              <textarea
                value={cachingStrategy}
                onChange={e => setCachingStrategy(e.target.value)}
                placeholder="Where does caching sit? What eviction policy (LRU) and cache pattern (Cache-Aside vs Write-Through) will you employ?"
                rows={2}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 10,
                  background: "#050811",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#f8fafc",
                  fontSize: 13,
                  lineHeight: 1.5,
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>

            {/* 4. Bottlenecks & Fault Tolerance */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#cbd5e1", marginBottom: 6 }}>
                4. Bottlenecks, Single Point of Failure (SPOF) & Outage Recovery
              </label>
              <textarea
                value={bottleneckStrategy}
                onChange={e => setBottleneckStrategy(e.target.value)}
                placeholder="What happens if Redis dies? How do you prevent race conditions or thundering herd problems under 100k req/s surge?"
                rows={2}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 10,
                  background: "#050811",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#f8fafc",
                  fontSize: 13,
                  lineHeight: 1.5,
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>

          </div>

          <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={handleSubmitArchitecture}
              disabled={evaluating || !candidateArchitecture.trim()}
              style={{
                padding: "12px 28px",
                borderRadius: 10,
                border: "none",
                background: evaluating ? "rgba(99,102,241,0.4)" : "linear-gradient(135deg, #4f46e5, #7c3aed)",
                color: "white",
                fontSize: 14,
                fontWeight: 800,
                cursor: evaluating || !candidateArchitecture.trim() ? "not-allowed" : "pointer",
                boxShadow: "0 4px 18px rgba(79,70,229,0.3)"
              }}
            >
              {evaluating ? "⚡ Principal Architect is evaluating scale..." : "Submit Architecture for Bar-Raiser Review ➔"}
            </button>
          </div>

        </div>

        {/* AI EVALUATION DOSSIER REPORT */}
        {evalResult && (
          <div style={{ background: "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,27,75,0.9))", border: "1px solid rgba(99,102,241,0.4)", borderRadius: 18, padding: "28px", marginBottom: 32, boxShadow: "0 15px 40px rgba(0,0,0,0.7)" }}>
            
            {/* Header Score Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 20, flexWrap: "wrap", gap: 16 }}>
              <div>
                <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 6, background: "rgba(99,102,241,0.2)", color: "#818cf8", fontWeight: 800 }}>
                  SYSTEM ARCHITECTURE BAR-RAISER VERDICT
                </span>
                <h3 style={{ fontSize: 22, fontWeight: 900, margin: "6px 0 2px", color: "white" }}>
                  {evalResult.verdict} ({evalResult.scalabilityScore}/100)
                </h3>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                  Assessed against FAANG L4/L5 Production Scale Standards
                </div>
              </div>

              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>Data Modeling</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#38bdf8" }}>{evalResult.dataModelingScore}%</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>Fault Tolerance</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#34d399" }}>{evalResult.faultToleranceScore}%</div>
                </div>
              </div>
            </div>

            {/* Strengths & Bottlenecks */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: 16, marginBottom: 20 }}>
              <div style={{ padding: "16px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#34d399", marginBottom: 6 }}>
                  ✓ ARCHITECTURAL HIGHLIGHTS:
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>
                  {evalResult.strengths?.map((s: string, idx: number) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>

              <div style={{ padding: "16px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#f87171", marginBottom: 6 }}>
                  ⚠️ PRODUCTION BOTTLENECK RISKS:
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>
                  {evalResult.architecturalBottlenecks?.map((b: string, idx: number) => (
                    <li key={idx}>{b}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Principal Architect Advice */}
            <div style={{ padding: "16px 20px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#818cf8", marginBottom: 4 }}>
                💡 PRINCIPAL ARCHITECT&apos;S TRADEOFF ADVICE:
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.95)", margin: 0, lineHeight: 1.6 }}>
                {evalResult.principalAdvice}
              </p>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
