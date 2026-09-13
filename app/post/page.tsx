"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { UnifiedPost, PostType } from "@/lib/posts-store";

function PostFeedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [posts, setPosts] = useState<UnifiedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>(searchParams.get("type") || "all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewerRole, setViewerRole] = useState<"student" | "recruiter" | "admin">("student");
  const [candidateId, setCandidateId] = useState("student-demo");
  const [upvotedIds, setUpvotedIds] = useState<Set<string>>(new Set());

  // Create Post Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newType, setNewType] = useState<PostType>("collaboration");
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newTags, setNewTags] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [joinModalPost, setJoinModalPost] = useState<UnifiedPost | null>(null);
  const [joinNote, setJoinNote] = useState("");
  const [joinSuccess, setJoinSuccess] = useState(false);

  // 1. Fetch Viewer Role & Initial Posts
  useEffect(() => {
    async function initFeed() {
      setLoading(true);
      try {
        // Fetch role
        const roleRes = await fetch("/api/auth/role");
        const roleData = await roleRes.json();
        const role = roleData?.role || "student";
        setViewerRole(role);

        // Fetch posts
        const postsRes = await fetch(`/api/posts?type=${encodeURIComponent(activeFilter)}&role=${encodeURIComponent(role)}&candidateId=${encodeURIComponent(candidateId)}`);
        const postsData = await postsRes.json();
        if (postsData?.posts) {
          setPosts(postsData.posts);
        }
      } catch (err) {
        console.error("Failed to load posts:", err);
      } finally {
        setLoading(false);
      }
    }
    initFeed();
  }, [activeFilter, candidateId]);

  // Handle client-side search filtering
  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return posts;
    const q = searchQuery.toLowerCase().trim();
    return posts.filter(p => {
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchContent = p.content.toLowerCase().includes(q);
      const matchAuthor = p.author_name.toLowerCase().includes(q);
      const matchCompany = (p.company_or_org || "").toLowerCase().includes(q);
      const matchTags = (p.tags || []).some(t => t.toLowerCase().includes(q));
      return matchTitle || matchContent || matchAuthor || matchCompany || matchTags;
    });
  }, [posts, searchQuery]);

  const handleUpvote = (postId: string) => {
    setUpvotedIds(prev => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });

    setPosts(prev =>
      prev.map(p => {
        if (p.id === postId) {
          const currentUpvotes = p.metadata?.upvotes || 0;
          const isUpvoted = upvotedIds.has(postId);
          return {
            ...p,
            metadata: {
              ...p.metadata,
              upvotes: isUpvoted ? Math.max(0, currentUpvotes - 1) : currentUpvotes + 1
            }
          };
        }
        return p;
      })
    );
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setCreating(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: newType,
          title: newTitle.trim(),
          content: newContent.trim(),
          author_name: viewerRole === "recruiter" ? "Recruiter Lead" : "Engineering Scholar",
          author_role: viewerRole === "recruiter" ? "Talent Acquisition" : "Fullstack Contributor",
          author_avatar: viewerRole === "recruiter" ? "💼" : "🚀",
          company_or_org: newCompany.trim() || undefined,
          tags: newTags.split(",").map(t => t.trim()).filter(Boolean),
          source_url: newUrl.trim() || undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.post) {
          setPosts(prev => [data.post, ...prev]);
        }
        setCreateSuccess(true);
        setTimeout(() => {
          setCreateSuccess(false);
          setShowCreateModal(false);
          setNewTitle("");
          setNewContent("");
          setNewCompany("");
          setNewTags("");
          setNewUrl("");
        }, 1200);
      }
    } catch (err) {
      console.error("Failed to create post:", err);
    } finally {
      setCreating(false);
    }
  };

  const typeTabs = [
    { key: "all", label: "All Posts", icon: "🌐", count: posts.length },
    { key: "hiring", label: "Hiring", icon: "💼", count: posts.filter(p => p.type === "hiring").length },
    { key: "opportunity", label: "Opportunities", icon: "🎯", count: posts.filter(p => p.type === "opportunity").length },
    { key: "professional", label: "Professional", icon: "💡", count: posts.filter(p => p.type === "professional").length },
    { key: "collaboration", label: "Collaboration", icon: "🤝", count: posts.filter(p => p.type === "collaboration").length },
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#060913", color: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
      {/* ── TOP HEADER / NAV ── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(6, 9, 19, 0.85)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "12px 24px"
        }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #059669, #34d399)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "white" }}>
                📢
              </div>
              <div>
                <span style={{ fontSize: 16, fontWeight: 900, color: "white", letterSpacing: "-0.5px" }}>COGNALYZE</span>
                <span style={{ fontSize: 10, marginLeft: 6, padding: "2px 6px", borderRadius: 4, fontWeight: 800, background: "rgba(52,211,153,0.15)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" }}>
                  POST / FEED
                </span>
              </div>
            </Link>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            {/* Viewer role indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 12 }}>
              <span style={{ color: "#94a3b8" }}>Viewing as:</span>
              <strong style={{ color: viewerRole === "recruiter" ? "#c084fc" : "#38bdf8", textTransform: "capitalize" }}>
                {viewerRole === "recruiter" ? "💼 Recruiter" : "🎓 Student"}
              </strong>
            </div>

            {/* Back to Dashboard Link */}
            <Link href={viewerRole === "recruiter" ? "/recruiter/dashboard" : "/student/dashboard"} style={{ textDecoration: "none" }}>
              <button style={{ padding: "7px 14px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#cbd5e1", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                ← {viewerRole === "recruiter" ? "Recruiter Dashboard" : "Student Dashboard"}
              </button>
            </Link>

            {/* Switch Section Button */}
            <Link href="/?switch=true" style={{ textDecoration: "none" }}>
              <button style={{ padding: "7px 14px", borderRadius: 8, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                <span>⇄</span>
                <span>Switch Section</span>
              </button>
            </Link>

            {/* Create Post Button */}
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                background: "linear-gradient(135deg, #059669, #34d399)",
                border: "none",
                color: "white",
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(52,211,153,0.3)"
              }}
            >
              + Create Post
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT FEED ── */}
      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 20px" }}>

        {/* FEED HERO BANNER */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(52, 211, 153, 0.12) 0%, rgba(10, 15, 29, 0.95) 100%)",
            border: "1px solid rgba(52, 211, 153, 0.25)",
            borderRadius: 20,
            padding: "28px 32px",
            marginBottom: 28
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, background: "rgba(52,211,153,0.2)", color: "#34d399", fontWeight: 800 }}>
                  SHARED PLATFORM FEED
                </span>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>
                  Hiring · Opportunities · Engineering Debriefs · Team Collaborations
                </span>
              </div>
              <h1 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.2rem)", fontWeight: 900, margin: "0 0 8px", letterSpacing: "-1px", color: "white" }}>
                The Unified Post Feed
              </h1>
              <p style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.7)", margin: 0, maxWidth: 680, lineHeight: 1.5 }}>
                A role-neutral discovery layer connecting campus candidates and engineering teams.
                {viewerRole === "student" ? " Hiring posts display your real algorithmic fit score." : " Recruiter views show potential candidate matches."}
              </p>
            </div>

            {/* Quick stats badge */}
            <div style={{ display: "flex", gap: 16, background: "rgba(0,0,0,0.3)", padding: "12px 18px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#34d399" }}>{posts.length}</div>
                <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase" }}>Total Posts</div>
              </div>
              <div style={{ width: 1, background: "rgba(255,255,255,0.1)" }} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#38bdf8" }}>
                  {posts.filter(p => p.type === "hiring").length}
                </div>
                <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase" }}>Hiring Drives</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── SEARCH & FILTER CONTROLS ── */}
        <div style={{ marginBottom: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Search bar */}
          <div style={{ position: "relative" }}>
            <input
              id="post-search-input"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search posts by title, technology (e.g. Distributed, Kafka, Next.js), company, or author..."
              style={{
                width: "100%",
                padding: "14px 20px 14px 44px",
                borderRadius: 14,
                border: "1px solid rgba(255, 255, 255, 0.12)",
                background: "rgba(10, 15, 29, 0.8)",
                color: "white",
                fontSize: 14,
                boxSizing: "border-box"
              }}
            />
            <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "#94a3b8" }}>
              🔍
            </span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 14 }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Type filter pills */}
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
            {typeTabs.map(tab => {
              const isActive = activeFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 16px",
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: isActive ? 800 : 600,
                    cursor: "pointer",
                    border: isActive ? "1px solid rgba(52,211,153,0.4)" : "1px solid rgba(255,255,255,0.08)",
                    background: isActive ? "linear-gradient(135deg, rgba(52,211,153,0.25), rgba(16,185,129,0.15))" : "rgba(255,255,255,0.03)",
                    color: isActive ? "white" : "rgba(255,255,255,0.65)",
                    transition: "all 0.15s ease",
                    whiteSpace: "nowrap"
                  }}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  <span style={{ fontSize: 11, padding: "1px 6px", borderRadius: 999, background: isActive ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.08)", color: isActive ? "#34d399" : "#94a3b8" }}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── POSTS FEED LIST ── */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>⚡</div>
            <p style={{ margin: 0, fontWeight: 700 }}>Aggregating unified feed across hiring, opportunities, and community...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 6px" }}>No posts matched your criteria</h3>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 16px" }}>Try changing your keyword query or resetting type filter.</p>
            <button
              onClick={() => { setActiveFilter("all"); setSearchQuery(""); }}
              style={{ padding: "8px 16px", borderRadius: 8, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "white", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {filteredPosts.map(post => {
              const isUpvoted = upvotedIds.has(post.id);
              const upvoteCount = (post.metadata?.upvotes || 0) + (isUpvoted ? 1 : 0);

              // Type badge styling
              const typeConfig: Record<PostType, { label: string; icon: string; color: string; bg: string; border: string }> = {
                hiring: { label: "Hiring", icon: "💼", color: "#38bdf8", bg: "rgba(56, 189, 248, 0.12)", border: "rgba(56, 189, 248, 0.28)" },
                opportunity: { label: "Opportunity", icon: "🎯", color: "#fbbf24", bg: "rgba(251, 191, 36, 0.12)", border: "rgba(251, 191, 36, 0.28)" },
                professional: { label: "Professional", icon: "💡", color: "#a855f7", bg: "rgba(168, 85, 247, 0.12)", border: "rgba(168, 85, 247, 0.28)" },
                collaboration: { label: "Collaboration", icon: "🤝", color: "#34d399", bg: "rgba(52, 211, 153, 0.12)", border: "rgba(52, 211, 153, 0.28)" }
              };
              const tStyle = typeConfig[post.type] || typeConfig.opportunity;

              return (
                <article
                  key={post.id}
                  style={{
                    background: "rgba(10, 15, 29, 0.75)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: 16,
                    padding: "24px",
                    transition: "border-color 0.2s ease"
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
                >
                  {/* Card Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, gap: 12, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: tStyle.bg, border: `1px solid ${tStyle.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                        {post.author_avatar || tStyle.icon}
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontWeight: 800, fontSize: 14, color: "white" }}>{post.author_name}</span>
                          {post.company_or_org && (
                            <span style={{ fontSize: 12, color: "#94a3b8" }}>· {post.company_or_org}</span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.45)" }}>
                          {post.author_role} · {new Date(post.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {/* Type Badge */}
                      <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 6, background: tStyle.bg, color: tStyle.color, border: `1px solid ${tStyle.border}`, display: "flex", alignItems: "center", gap: 4 }}>
                        <span>{tStyle.icon}</span>
                        <span>{tStyle.label}</span>
                      </span>

                      {/* Verified portal badge if opportunity */}
                      {post.portal_info && (
                        <span style={{ fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 6, background: post.portal_info.badgeBg || "rgba(52,211,153,0.1)", color: post.portal_info.badgeColor || "#34d399", border: `1px solid ${post.portal_info.badgeColor || "rgba(52,211,153,0.25)"}` }}>
                          {post.portal_info.isVerified ? `✓ ${post.portal_info.name}` : post.portal_info.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Post Title */}
                  <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 10px", lineHeight: 1.4, color: "white" }}>
                    {post.title}
                  </h2>

                  {/* Post Content */}
                  <p style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.75)", lineHeight: 1.6, margin: "0 0 16px", whiteSpace: "pre-line" }}>
                    {post.content}
                  </p>

                  {/* Role-Aware Intelligence Badges */}
                  {(post.type === "hiring" || post.type === "opportunity") && (
                    <div style={{ marginBottom: 16 }}>
                      {/* STUDENT VIEW: Real Personalized Fit Score */}
                      {viewerRole === "student" && post.fit_score !== undefined && (
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 10, background: post.fit_score >= 80 ? "rgba(52,211,153,0.15)" : "rgba(56,189,248,0.12)", border: `1px solid ${post.fit_score >= 80 ? "rgba(52,211,153,0.35)" : "rgba(56,189,248,0.28)"}` }}>
                          <span style={{ fontSize: 13, fontWeight: 900, color: post.fit_score >= 80 ? "#34d399" : "#38bdf8" }}>
                            🎯 {post.fit_score}% Fit Score
                          </span>
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>
                            {post.fit_score >= 85 ? "Top Placement Synergy" : post.fit_score >= 70 ? "Strong Skill Overlap" : "Eligible Track"}
                          </span>
                          {post.matching_tags && post.matching_tags.length > 0 && (
                            <span style={{ fontSize: 10, color: "#94a3b8", borderLeft: "1px solid rgba(255,255,255,0.15)", paddingLeft: 8 }}>
                              Matched: {post.matching_tags.slice(0, 3).join(", ")}
                            </span>
                          )}
                        </div>
                      )}

                      {/* RECRUITER VIEW: Potential Candidates Indicator */}
                      {viewerRole === "recruiter" && post.potential_candidates_count !== undefined && (
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 10, background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.35)" }}>
                          <span style={{ fontSize: 13, fontWeight: 900, color: "#c084fc" }}>
                            👥 {post.potential_candidates_count} Potential Candidates
                          </span>
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>
                            with ≥70% algorithmic match in active cohort
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Collaboration Meta Details (team size, goal, deadline) */}
                  {post.type === "collaboration" && post.metadata && (
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16, fontSize: 12, color: "#94a3b8" }}>
                      {post.metadata.team_size && (
                        <span style={{ padding: "3px 8px", borderRadius: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                          👥 Team: {post.metadata.team_size}
                        </span>
                      )}
                      {post.metadata.collaboration_goal && (
                        <span style={{ padding: "3px 8px", borderRadius: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                          🎯 Goal: {post.metadata.collaboration_goal}
                        </span>
                      )}
                      {post.deadline && (
                        <span style={{ padding: "3px 8px", borderRadius: 6, background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}>
                          ⏰ Deadline: {new Date(post.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
                      {post.tags.map((tag, i) => (
                        <span key={i} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#cbd5e1" }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Card Action Footer */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14, flexWrap: "wrap", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      {/* Upvote Button */}
                      <button
                        onClick={() => handleUpvote(post.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          background: isUpvoted ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.04)",
                          border: isUpvoted ? "1px solid rgba(52,211,153,0.4)" : "1px solid rgba(255,255,255,0.1)",
                          color: isUpvoted ? "#34d399" : "#cbd5e1",
                          padding: "6px 12px",
                          borderRadius: 8,
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 700
                        }}
                      >
                        <span>{isUpvoted ? "▲ Upvoted" : "▲ Upvote"}</span>
                        <span>{upvoteCount}</span>
                      </button>

                      {/* Replies Counter */}
                      <span style={{ fontSize: 12, color: "#94a3b8", display: "flex", alignItems: "center", gap: 4 }}>
                        <span>💬</span>
                        <span>{post.metadata?.replies_count || 0} discussion</span>
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {/* CTA based on post type */}
                      {post.source_url ? (
                        <a
                          href={post.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: "6px 14px",
                            borderRadius: 8,
                            background: "linear-gradient(135deg, #059669, #10b981)",
                            color: "white",
                            fontSize: 12,
                            fontWeight: 700,
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4
                          }}
                        >
                          <span>{post.portal_info ? `Apply on ${post.portal_info.name}` : "View Portal"}</span>
                          <span>↗</span>
                        </a>
                      ) : post.type === "collaboration" ? (
                        <button
                          onClick={() => { setJoinModalPost(post); setJoinSuccess(false); }}
                          style={{
                            padding: "6px 14px",
                            borderRadius: 8,
                            background: "linear-gradient(135deg, #2563eb, #38bdf8)",
                            border: "none",
                            color: "white",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          Join Squad / Connect ✉
                        </button>
                      ) : (
                        <span style={{ fontSize: 11, color: "#64748b" }}>
                          Community Verified
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* ── CREATE POST MODAL ── */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20
          }}
        >
          <div
            style={{
              background: "#0a0f1d",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 20,
              padding: "28px",
              maxWidth: 580,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: "white" }}>
                Create New Community Post
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 18, cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {createSuccess ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#34d399" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>✓</div>
                <h4 style={{ margin: "0 0 6px", fontSize: 18 }}>Post Published Successfully!</h4>
                <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>Added to the unified platform feed.</p>
              </div>
            ) : (
              <form onSubmit={handleCreatePost} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#cbd5e1", marginBottom: 6 }}>
                    Post Category
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[
                      { type: "collaboration" as PostType, label: "🤝 Collaboration", desc: "Hackathon team or study group" },
                      { type: "professional" as PostType, label: "💡 Professional", desc: "Engineering insight or interview debrief" },
                      { type: "hiring" as PostType, label: "💼 Hiring Drive", desc: "Recruiter job or internship opening" },
                      { type: "opportunity" as PostType, label: "🎯 Opportunity", desc: "Open contest or fellowship" }
                    ].map(opt => (
                      <button
                        key={opt.type}
                        type="button"
                        onClick={() => setNewType(opt.type)}
                        style={{
                          padding: "10px",
                          borderRadius: 8,
                          textAlign: "left",
                          cursor: "pointer",
                          border: newType === opt.type ? "1px solid #34d399" : "1px solid rgba(255,255,255,0.08)",
                          background: newType === opt.type ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.03)",
                          color: "white"
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 800 }}>{opt.label}</div>
                        <div style={{ fontSize: 10, color: "#94a3b8" }}>{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#cbd5e1", marginBottom: 6 }}>
                    Post Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="e.g. Seeking 2 Backend Engineers for Smart India Hackathon 2026..."
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.3)", color: "white", fontSize: 13, boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#cbd5e1", marginBottom: 6 }}>
                    Content & Details *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={newContent}
                    onChange={e => setNewContent(e.target.value)}
                    placeholder="Describe your project, team requirements, engineering architecture, or opportunity..."
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.3)", color: "white", fontSize: 13, boxSizing: "border-box", resize: "vertical" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#cbd5e1", marginBottom: 6 }}>
                      Organization / Team
                    </label>
                    <input
                      type="text"
                      value={newCompany}
                      onChange={e => setNewCompany(e.target.value)}
                      placeholder="e.g. IIT Delhi SIH Team / Startup"
                      style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.3)", color: "white", fontSize: 12, boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#cbd5e1", marginBottom: 6 }}>
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={newTags}
                      onChange={e => setNewTags(e.target.value)}
                      placeholder="e.g. Next.js, Python, Kafka"
                      style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.3)", color: "white", fontSize: 12, boxSizing: "border-box" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#cbd5e1", marginBottom: 6 }}>
                    External Link / Repository (Optional)
                  </label>
                  <input
                    type="url"
                    value={newUrl}
                    onChange={e => setNewUrl(e.target.value)}
                    placeholder="https://github.com/... or https://unstop.com/..."
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.3)", color: "white", fontSize: 12, boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    style={{ padding: "8px 16px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", cursor: "pointer", fontSize: 12 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    style={{ padding: "8px 20px", borderRadius: 8, background: "linear-gradient(135deg, #059669, #34d399)", border: "none", color: "white", fontWeight: 800, cursor: creating ? "not-allowed" : "pointer", fontSize: 13 }}
                  >
                    {creating ? "Publishing..." : "Publish to Feed"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── SQUAD JOIN MODAL ── */}
      {joinModalPost && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20
          }}
        >
          <div
            style={{
              background: "#0a0f1d",
              border: "1px solid rgba(52,211,153,0.3)",
              borderRadius: 20,
              padding: "24px",
              maxWidth: 480,
              width: "100%"
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 900, margin: "0 0 8px", color: "white" }}>
              Connect with {joinModalPost.author_name}
            </h3>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 16px" }}>
              Regarding: <strong>{joinModalPost.title}</strong>
            </p>

            {joinSuccess ? (
              <div style={{ textAlign: "center", padding: "20px 0", color: "#34d399" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
                <div style={{ fontWeight: 800 }}>Collaboration Request Sent!</div>
                <p style={{ fontSize: 12, color: "#94a3b8", margin: "4px 0 0" }}>The author has been notified via their placement inbox.</p>
                <button
                  onClick={() => setJoinModalPost(null)}
                  style={{ marginTop: 16, padding: "6px 14px", borderRadius: 8, background: "rgba(255,255,255,0.08)", border: "none", color: "white", cursor: "pointer", fontSize: 12 }}
                >
                  Close
                </button>
              </div>
            ) : (
              <div>
                <textarea
                  rows={3}
                  value={joinNote}
                  onChange={e => setJoinNote(e.target.value)}
                  placeholder="Introduce yourself, mention your relevant tech stack, and share how you can contribute to this squad..."
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.3)", color: "white", fontSize: 12, boxSizing: "border-box", marginBottom: 16 }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button
                    onClick={() => setJoinModalPost(null)}
                    style={{ padding: "6px 12px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", cursor: "pointer", fontSize: 12 }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setJoinSuccess(true)}
                    style={{ padding: "6px 16px", borderRadius: 8, background: "linear-gradient(135deg, #059669, #34d399)", border: "none", color: "white", fontWeight: 700, cursor: "pointer", fontSize: 12 }}
                  >
                    Send Invitation
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default function PostPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#060913", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading Unified Feed...</div>}>
      <PostFeedContent />
    </Suspense>
  );
}
