"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";

interface Opportunity {
  id?: string;
  title: string;
  type: string;
  organizer: string;
  organizer_type: string;
  tags: string[];
  domain_tags: string[];
  tier: string;
  deadline: string | null;
  eligibility: string;
  source_url?: string;
  extracted_context?: any;
}

export default function AdminOpportunitiesPage() {
  const { isDark } = useTheme();
  const [adminKey, setAdminKey] = useState("cognalyze-admin-secret");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [fetchingOpps, setFetchingOpps] = useState(true);

  const fetchOpportunities = async () => {
    setFetchingOpps(true);
    try {
      const res = await fetch("/api/admin/opportunities");
      const data = await res.json();
      if (data.opportunities) {
        setOpportunities(data.opportunities);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFetchingOpps(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminKey,
          url: url.trim() || undefined,
          description: description.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to ingest opportunity");
      }

      setSuccess(`✓ Ingested: "${data.opportunity.title}" (${data.opportunity.tier})`);
      setDescription("");
      setUrl("");
      fetchOpportunities();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: isDark ? "#07111F" : "#F6F5F1",
        color: isDark ? "#F2F6FC" : "#17191C",
        fontFamily: "var(--font-inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
      }}
    >
      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 28px",
          borderBottom: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
          backgroundColor: isDark ? "#0A1626" : "#FFFFFF",
          position: "sticky",
          top: 0,
          zIndex: 20
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              backgroundColor: isDark ? "#13243A" : "#EFF4FE",
              border: `1px solid ${isDark ? "#2A435F" : "#D2E0FB"}`,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
          >
            🛡️
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: isDark ? "#F2F6FC" : "#162A43", letterSpacing: "-0.2px" }}>
              COGNALYZE ADMIN
            </div>
            <div style={{ fontSize: 10, color: "#356AE6", fontWeight: 700, letterSpacing: 1 }}>
              OPPORTUNITY INGESTION ENGINE
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link
            href="/student"
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: isDark ? "#B6C4D6" : "#667085",
              textDecoration: "none",
              padding: "6px 14px",
              borderRadius: 7,
              border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
              backgroundColor: isDark ? "#13243A" : "#FFFFFF"
            }}
          >
            Student View ➔
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: 1240, margin: "0 auto", padding: "32px 24px 80px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 24 }}>
        
        {/* Ingestion Form */}
        <div>
          <div
            style={{
              backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF",
              border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
              borderRadius: 12,
              padding: 24,
              boxShadow: isDark ? "none" : "0 1px 3px rgba(16, 24, 40, 0.04)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: isDark ? "#F2F6FC" : "#162A43" }}>
                Add Opportunity
              </h2>
              <span
                style={{
                  fontSize: 10,
                  padding: "3px 8px",
                  backgroundColor: isDark ? "rgba(234, 182, 90, 0.12)" : "#FEF7ED",
                  border: `1px solid ${isDark ? "#EAB65A" : "#F8D8A7"}`,
                  borderRadius: 5,
                  color: isDark ? "#EAB65A" : "#B7791F",
                  fontWeight: 700
                }}
              >
                ADMIN ONLY
              </span>
            </div>

            <form onSubmit={handleIngest} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: isDark ? "#8292A8" : "#667085", fontWeight: 600, display: "block", marginBottom: 6 }}>
                  ADMIN SECURITY KEY
                </label>
                <input
                  type="password"
                  value={adminKey}
                  onChange={e => setAdminKey(e.target.value)}
                  placeholder="Enter admin secret key"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    backgroundColor: isDark ? "#13243A" : "#FAF9F6",
                    border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                    borderRadius: 7,
                    color: isDark ? "#F2F6FC" : "#17191C",
                    fontSize: 13,
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: isDark ? "#8292A8" : "#667085", fontWeight: 600, display: "block", marginBottom: 6 }}>
                  SOURCE URL (Optional)
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://unstop.com/hackathons/..."
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    backgroundColor: isDark ? "#13243A" : "#FAF9F6",
                    border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                    borderRadius: 7,
                    color: isDark ? "#F2F6FC" : "#17191C",
                    fontSize: 13,
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: isDark ? "#8292A8" : "#667085", fontWeight: 600, display: "block", marginBottom: 6 }}>
                  RAW DESCRIPTION OR BROCHURE TEXT
                </label>
                <textarea
                  rows={8}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Paste problem statement, brochure, hackathon tracks, eligibility, or internship JD..."
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    backgroundColor: isDark ? "#13243A" : "#FAF9F6",
                    border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                    borderRadius: 7,
                    color: isDark ? "#F2F6FC" : "#17191C",
                    fontSize: 13,
                    outline: "none",
                    resize: "vertical",
                    boxSizing: "border-box",
                    lineHeight: 1.5
                  }}
                />
              </div>

              {error && (
                <div style={{ padding: "10px 14px", backgroundColor: isDark ? "rgba(233, 104, 114, 0.12)" : "#FDF2F2", border: `1px solid ${isDark ? "#E96872" : "#F8C8C8"}`, borderRadius: 8, color: isDark ? "#E96872" : "#C24141", fontSize: 12 }}>
                  ⚠️ {error}
                </div>
              )}

              {success && (
                <div style={{ padding: "10px 14px", backgroundColor: isDark ? "rgba(53, 185, 130, 0.12)" : "#EAF4EE", border: `1px solid ${isDark ? "#35B982" : "#C8E4D3"}`, borderRadius: 8, color: isDark ? "#35B982" : "#2E7D5B", fontSize: 12 }}>
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !description.trim()}
                style={{
                  marginTop: 6,
                  padding: "10px 18px",
                  backgroundColor: "#356AE6",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 7,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: loading ? "wait" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: "0 1px 2px rgba(53, 106, 230, 0.2)"
                }}
              >
                {loading ? "⚡ AI Extracting Tags & Context..." : "Parse & Ingest Opportunity ➔"}
              </button>
            </form>
          </div>
        </div>

        {/* Opportunity Review List */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: isDark ? "#F2F6FC" : "#162A43" }}>
              Active Ingested Opportunities ({opportunities.length})
            </h2>
            <button
              onClick={fetchOpportunities}
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "6px 12px",
                backgroundColor: isDark ? "#13243A" : "#FFFFFF",
                border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                borderRadius: 7,
                color: isDark ? "#F2F6FC" : "#162A43",
                cursor: "pointer"
              }}
            >
              ↻ Refresh
            </button>
          </div>

          {fetchingOpps ? (
            <div style={{ textAlign: "center", padding: "4rem 2rem", color: isDark ? "#8292A8" : "#98A2B3" }}>
              Loading opportunities...
            </div>
          ) : opportunities.length === 0 ? (
            <div style={{ textAlign: "center", padding: "4rem 2rem", backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF", borderRadius: 12, border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}` }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: isDark ? "#F2F6FC" : "#162A43" }}>No opportunities added yet.</div>
              <div style={{ fontSize: 12, color: isDark ? "#8292A8" : "#667085", marginTop: 4 }}>Paste a description on the left to add one!</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {opportunities.map((opp, idx) => (
                <div
                  key={opp.id || idx}
                  style={{
                    backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF",
                    border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                    borderRadius: 10,
                    padding: 16,
                    boxShadow: isDark ? "none" : "0 1px 2px rgba(16, 24, 40, 0.03)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span
                          style={{
                            fontSize: 10,
                            textTransform: "uppercase",
                            padding: "2px 7px",
                            backgroundColor: isDark ? "#13243A" : "#EFF4FE",
                            color: isDark ? "#4C8DFF" : "#356AE6",
                            border: `1px solid ${isDark ? "#2A435F" : "#D2E0FB"}`,
                            borderRadius: 5,
                            fontWeight: 700
                          }}
                        >
                          {opp.type}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            padding: "2px 7px",
                            backgroundColor: isDark ? "rgba(234, 182, 90, 0.12)" : "#FEF7ED",
                            border: `1px solid ${isDark ? "#EAB65A" : "#F8D8A7"}`,
                            color: isDark ? "#EAB65A" : "#B7791F",
                            borderRadius: 5,
                            fontWeight: 700
                          }}
                        >
                          {opp.tier}
                        </span>
                        <span style={{ fontSize: 12, color: isDark ? "#8292A8" : "#667085" }}>• {opp.organizer}</span>
                      </div>
                      <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: isDark ? "#F2F6FC" : "#17191C" }}>{opp.title}</h3>
                    </div>
                    {opp.deadline && (
                      <div style={{ fontSize: 11, color: isDark ? "#8292A8" : "#667085", textAlign: "right" }}>
                        Deadline: <span style={{ color: "#C24141", fontWeight: 600 }}>{new Date(opp.deadline).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <p style={{ fontSize: 12, color: isDark ? "#B6C4D6" : "#667085", lineHeight: 1.5, margin: "6px 0 10px" }}>
                    {opp.extracted_context?.summary || opp.eligibility}
                  </p>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                    {(opp.tags || []).map((t, i) => (
                      <span key={i} style={{ fontSize: 11, padding: "2px 7px", backgroundColor: isDark ? "#13243A" : "#FAF9F6", border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`, borderRadius: 5, color: isDark ? "#B6C4D6" : "#667085" }}>
                        #{t}
                      </span>
                    ))}
                    {(opp.domain_tags || []).map((d, i) => (
                      <span key={i} style={{ fontSize: 11, padding: "2px 7px", backgroundColor: isDark ? "#13243A" : "#EFF4FE", border: `1px solid ${isDark ? "#2A435F" : "#D2E0FB"}`, borderRadius: 5, color: isDark ? "#4C8DFF" : "#356AE6" }}>
                        {d}
                      </span>
                    ))}
                  </div>

                  {opp.extracted_context?.prize_pool && (
                    <div style={{ fontSize: 11, color: isDark ? "#35B982" : "#2E7D5B", fontWeight: 600 }}>
                      🏆 Prize: {opp.extracted_context.prize_pool}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
