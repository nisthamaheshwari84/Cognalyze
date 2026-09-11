"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

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
      const res = await fetch("/api/opportunities/ingest");
      const data = await res.json();
      if (data.opportunities) {
        setOpportunities(data.opportunities);
      }
    } catch (err: any) {
      console.error("Failed to fetch opportunities:", err);
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
      const res = await fetch("/api/opportunities/ingest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey
        },
        body: JSON.stringify({
          rawDescription: description,
          sourceUrl: url
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
    <div style={{ minHeight: "100vh", background: "#06030f", color: "#f3f4f6", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 2rem", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(6,3,15,0.85)", backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 34, height: 34, background: "linear-gradient(135deg,#f59e0b,#ef4444)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900 }}>🛡️</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: -0.5 }}>COGNALYZE ADMIN</div>
            <div style={{ fontSize: 10, color: "#f59e0b", fontWeight: 700, letterSpacing: 1.5 }}>OPPORTUNITY INGESTION ENGINE</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/student" style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", textDecoration: "none", padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)" }}>
            Student View ➔
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1.5rem", display: "grid", gridTemplateColumns: "480px 1fr", gap: "2.5rem" }}>
        
        {/* Ingestion Form */}
        <div>
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "1.75rem", position: "sticky", top: 100 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>Add Opportunity</h2>
              <span style={{ fontSize: 10, padding: "3px 8px", background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 6, color: "#fbbf24", fontWeight: 700 }}>
                ADMIN ONLY
              </span>
            </div>

            <form onSubmit={handleIngest} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600, display: "block", marginBottom: 6 }}>
                  ADMIN SECURITY KEY
                </label>
                <input
                  type="password"
                  value={adminKey}
                  onChange={e => setAdminKey(e.target.value)}
                  placeholder="Enter admin secret key"
                  style={{ width: "100%", padding: "0.75rem 1rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "white", fontSize: 13, outline: "none" }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600, display: "block", marginBottom: 6 }}>
                  SOURCE URL (Optional)
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://unstop.com/hackathons/..."
                  style={{ width: "100%", padding: "0.75rem 1rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "white", fontSize: 13, outline: "none" }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600, display: "block", marginBottom: 6 }}>
                  RAW DESCRIPTION OR BROCHURE TEXT
                </label>
                <textarea
                  rows={8}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Paste problem statement, brochure, hackathon tracks, eligibility, or internship JD..."
                  required
                  style={{ width: "100%", padding: "0.85rem 1rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "white", fontSize: 13, outline: "none", resize: "vertical" }}
                />
              </div>

              {error && (
                <div style={{ padding: "0.75rem 1rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, color: "#f87171", fontSize: 12 }}>
                  ⚠️ {error}
                </div>
              )}

              {success && (
                <div style={{ padding: "0.75rem 1rem", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10, color: "#34d399", fontSize: 12 }}>
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !description.trim()}
                style={{ marginTop: 6, padding: "0.9rem", background: loading ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg,#f59e0b,#ef4444)", color: "white", border: "none", borderRadius: 12, fontWeight: 800, fontSize: 14, cursor: loading ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                {loading ? "⚡ AI Extracting Tags & Context..." : "Parse & Ingest Opportunity ➔"}
              </button>
            </form>
          </div>
        </div>

        {/* Opportunity Review List */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
              Active Ingested Opportunities ({opportunities.length})
            </h2>
            <button
              onClick={fetchOpportunities}
              style={{ fontSize: 11, padding: "5px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "rgba(255,255,255,0.7)", cursor: "pointer" }}
            >
              ↻ Refresh
            </button>
          </div>

          {fetchingOpps ? (
            <div style={{ textAlign: "center", padding: "4rem 2rem", color: "rgba(255,255,255,0.4)" }}>
              Loading opportunities...
            </div>
          ) : opportunities.length === 0 ? (
            <div style={{ textAlign: "center", padding: "4rem 2rem", background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>No opportunities added yet.</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>Paste a description on the left to add one!</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {opportunities.map((opp, idx) => (
                <div key={opp.id || idx} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 10, textTransform: "uppercase", padding: "2px 8px", background: opp.type === "hackathon" ? "rgba(99,102,241,0.15)" : "rgba(16,185,129,0.15)", color: opp.type === "hackathon" ? "#818cf8" : "#34d399", borderRadius: 6, fontWeight: 700 }}>
                          {opp.type}
                        </span>
                        <span style={{ fontSize: 10, padding: "2px 8px", background: "rgba(245,158,11,0.12)", color: "#fbbf24", borderRadius: 6, fontWeight: 700 }}>
                          {opp.tier}
                        </span>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>• {opp.organizer}</span>
                      </div>
                      <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: "#ffffff" }}>{opp.title}</h3>
                    </div>
                    {opp.deadline && (
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textAlign: "right" }}>
                        Deadline: <span style={{ color: "#f87171", fontWeight: 600 }}>{new Date(opp.deadline).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.5, margin: "6px 0 10px" }}>
                    {opp.extracted_context?.summary || opp.eligibility}
                  </p>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                    {(opp.tags || []).map((t, i) => (
                      <span key={i} style={{ fontSize: 10, padding: "2px 8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "#94a3b8" }}>
                        #{t}
                      </span>
                    ))}
                    {(opp.domain_tags || []).map((d, i) => (
                      <span key={i} style={{ fontSize: 10, padding: "2px 8px", background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 6, color: "#c084fc" }}>
                        {d}
                      </span>
                    ))}
                  </div>

                  {opp.extracted_context?.prize_pool && (
                    <div style={{ fontSize: 11, color: "#34d399", fontWeight: 600 }}>
                      🏆 Prize: {opp.extracted_context.prize_pool}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
