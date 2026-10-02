"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { UnifiedPost, PostType } from "@/lib/posts-store";
import CollaborationFeed from "@/components/collab/CollaborationFeed";
import { useTheme } from "@/components/ThemeProvider";

function PostFeedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Design system theme tokens
  const bgCanvas = isDark ? "#07111F" : "#F6F5F1";
  const bgCard = isDark ? "#0E1B2E" : "#FFFFFF";
  const bgHeader = isDark ? "#0A1626" : "#FFFFFF";
  const bgInner = isDark ? "#13243A" : "#F6F5F1";
  const borderSubtle = isDark ? "#223750" : "#E4E1DA";
  const textPrimary = isDark ? "#F2F6FC" : "#17191C";
  const textSecondary = isDark ? "#B6C4D6" : "#667085";
  const headingColor = isDark ? "#F2F6FC" : "#162A43";
  const inputBg = isDark ? "#13243A" : "#FFFFFF";
  const accent = isDark ? "#3478F6" : "#356AE6";
  const accentLight = isDark ? "rgba(52, 120, 246, 0.15)" : "#EFF4FE";
  const accentBorder = isDark ? "rgba(52, 120, 246, 0.3)" : "#D2E0FB";

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
      const parsedTags = newTags
        .split(",")
        .map(t => t.trim())
        .filter(Boolean);

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: newType,
          title: newTitle.trim(),
          content: newContent.trim(),
          company_or_org: newCompany.trim() || undefined,
          tags: parsedTags,
          source_url: newUrl.trim() || undefined,
          author_id: candidateId,
          author_role: viewerRole === "recruiter" ? "Enterprise Talent Lead" : "Engineering Student"
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCreateSuccess(true);
        if (data.post) {
          setPosts(prev => [data.post, ...prev]);
        }
        setTimeout(() => {
          setShowCreateModal(false);
          setCreateSuccess(false);
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
    <div style={{ minHeight: "100vh", backgroundColor: bgCanvas, color: textPrimary, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
      {/* ── TOP HEADER / NAV ── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: bgHeader,
          borderBottom: `1px solid ${borderSubtle}`,
          padding: "12px 24px"
        }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: isDark ? "#13243A" : "#162A43", border: `1px solid ${borderSubtle}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "white" }}>
                📢
              </div>
              <div>
                <span style={{ fontSize: 16, fontWeight: 800, color: headingColor, letterSpacing: "-0.3px" }}>COGNALYZE</span>
                <span style={{ fontSize: 10, marginLeft: 6, padding: "2px 6px", borderRadius: 4, fontWeight: 700, background: accentLight, color: accent, border: `1px solid ${accentBorder}` }}>
                  POST / FEED
                </span>
              </div>
            </Link>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            {/* Viewer role indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 7, background: bgInner, border: `1px solid ${borderSubtle}`, fontSize: 12 }}>
              <span style={{ color: textSecondary }}>Viewing as:</span>
              <strong style={{ color: headingColor, textTransform: "capitalize" }}>
                {viewerRole === "recruiter" ? "💼 Recruiter" : "🎓 Student"}
              </strong>
            </div>

            {/* Back to Dashboard Link */}
            <Link href={viewerRole === "recruiter" ? "/recruiter/dashboard" : "/student/dashboard"} style={{ textDecoration: "none" }}>
              <button style={{ padding: "7px 14px", borderRadius: 7, background: bgCard, border: `1px solid ${borderSubtle}`, color: textPrimary, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                ← {viewerRole === "recruiter" ? "Recruiter Dashboard" : "Student Dashboard"}
              </button>
            </Link>

            {/* Switch Section Button */}
            <Link href="/?switch=true" style={{ textDecoration: "none" }}>
              <button style={{ padding: "7px 14px", borderRadius: 7, background: accentLight, border: `1px solid ${accentBorder}`, color: accent, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                <span>⇄</span>
                <span>Switch Section</span>
              </button>
            </Link>

            {/* Create Post Button */}
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: "8px 16px",
                borderRadius: 7,
                background: accent,
                border: "none",
                color: "white",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: isDark ? "0 1px 3px rgba(0,0,0,0.5)" : "0 1px 3px rgba(53, 106, 230, 0.25)"
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
            background: bgCard,
            border: `1px solid ${borderSubtle}`,
            borderRadius: 10,
            padding: "24px 28px",
            marginBottom: 24,
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 5, background: accentLight, color: accent, fontWeight: 700, border: `1px solid ${accentBorder}` }}>
                  SHARED PLATFORM FEED
                </span>
                <span style={{ fontSize: 12, color: textSecondary }}>
                  Hiring · Opportunities · Engineering Debriefs · Team Collaborations
                </span>
              </div>
              <h1 style={{ fontSize: "24px", fontWeight: 800, margin: "0 0 6px", letterSpacing: "-0.5px", color: headingColor }}>
                The Unified Post Feed
              </h1>
              <p style={{ fontSize: 14, color: textSecondary, margin: 0, maxWidth: 680, lineHeight: 1.5 }}>
                A role-neutral discovery layer connecting campus candidates and engineering teams.
                {viewerRole === "student" ? " Hiring posts display your real algorithmic fit score." : " Recruiter views show potential candidate matches."}
              </p>
            </div>

            {/* Quick stats badge */}
            <div style={{ display: "flex", gap: 16, background: bgInner, padding: "12px 18px", borderRadius: 8, border: `1px solid ${borderSubtle}` }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: headingColor }}>{posts.length}</div>
                <div style={{ fontSize: 11, color: textSecondary, textTransform: "uppercase", fontWeight: 600 }}>Total Posts</div>
              </div>
              <div style={{ width: 1, background: borderSubtle }} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: accent }}>
                  {posts.filter(p => p.type === "hiring").length}
                </div>
                <div style={{ fontSize: 11, color: textSecondary, textTransform: "uppercase", fontWeight: 600 }}>Hiring Drives</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── SEARCH & FILTER CONTROLS ── */}
        <div style={{ marginBottom: 24, display: "flex", flexDirection: "column", gap: 14 }}>
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
                padding: "12px 18px 12px 42px",
                borderRadius: 7,
                border: `1px solid ${borderSubtle}`,
                background: inputBg,
                color: textPrimary,
                fontSize: 14,
                boxSizing: "border-box",
                outline: "none"
              }}
            />
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: textSecondary }}>
              🔍
            </span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: textSecondary, cursor: "pointer", fontSize: 14 }}
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
                    padding: "7px 14px",
                    borderRadius: 7,
                    fontSize: 13,
                    fontWeight: isActive ? 700 : 500,
                    cursor: "pointer",
                    border: isActive ? `1px solid ${accent}` : `1px solid ${borderSubtle}`,
                    background: isActive ? accent : bgCard,
                    color: isActive ? "#FFFFFF" : textSecondary,
                    transition: "all 0.15s ease",
                    whiteSpace: "nowrap"
                  }}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  <span style={{ fontSize: 11, padding: "1px 6px", borderRadius: 999, background: isActive ? "rgba(255,255,255,0.2)" : bgInner, color: isActive ? "#FFFFFF" : textSecondary }}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── POSTS FEED LIST ── */}
        {activeFilter === "collaboration" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <CollaborationFeed />
          </div>
        ) : loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: textSecondary }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>⚡</div>
            <p style={{ margin: 0, fontWeight: 600 }}>Aggregating unified feed across hiring, opportunities, and community...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", background: bgCard, borderRadius: 10, border: `1px solid ${borderSubtle}` }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 6px", color: headingColor }}>No posts matched your criteria</h3>
            <p style={{ fontSize: 13, color: textSecondary, margin: "0 0 16px" }}>Try changing your keyword query or resetting type filter.</p>
            <button
              onClick={() => { setActiveFilter("all"); setSearchQuery(""); }}
              style={{ padding: "8px 16px", borderRadius: 7, background: accent, border: "none", color: "white", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
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
                hiring: { label: "Hiring", icon: "💼", color: accent, bg: accentLight, border: accentBorder },
                opportunity: { label: "Opportunity", icon: "🎯", color: isDark ? "#fbbf24" : "#B7791F", bg: isDark ? "rgba(251,191,36,0.15)" : "#FEF7ED", border: isDark ? "rgba(251,191,36,0.3)" : "#F8D8A7" },
                professional: { label: "Professional", icon: "💡", color: isDark ? "#4ade80" : "#2E7D5B", bg: isDark ? "rgba(46,125,91,0.2)" : "#EAF4EE", border: isDark ? "rgba(46,125,91,0.4)" : "#C8E4D3" },
                collaboration: { label: "Collaboration", icon: "🤝", color: headingColor, bg: bgInner, border: borderSubtle }
              };
              const tStyle = typeConfig[post.type] || typeConfig.opportunity;

              return (
                <article
                  key={post.id}
                  style={{
                    background: bgCard,
                    border: `1px solid ${borderSubtle}`,
                    borderRadius: 10,
                    padding: "22px 24px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                    transition: "border-color 0.15s ease, box-shadow 0.15s ease"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = accent;
                    e.currentTarget.style.boxShadow = isDark ? "0 4px 16px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.06)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = borderSubtle;
                    e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.03)";
                  }}
                >
                  {/* Card Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, gap: 12, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 8, background: tStyle.bg, border: `1px solid ${tStyle.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                        {post.author_avatar || tStyle.icon}
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: headingColor }}>{post.author_name}</span>
                          {post.company_or_org && (
                            <span style={{ fontSize: 12, color: textSecondary }}>· {post.company_or_org}</span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: textSecondary }}>
                          {post.author_role} · {new Date(post.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {/* Type Badge */}
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 5, background: tStyle.bg, color: tStyle.color, border: `1px solid ${tStyle.border}`, display: "flex", alignItems: "center", gap: 4 }}>
                        <span>{tStyle.icon}</span>
                        <span>{tStyle.label}</span>
                      </span>

                      {/* Verified portal badge if opportunity */}
                      {post.portal_info && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 5, background: isDark ? "rgba(46,125,91,0.2)" : "#EAF4EE", color: isDark ? "#4ade80" : "#2E7D5B", border: `1px solid ${isDark ? "rgba(46,125,91,0.4)" : "#C8E4D3"}` }}>
                          {post.portal_info.isVerified ? `✓ ${post.portal_info.name}` : post.portal_info.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Post Title */}
                  <h2 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 10px", lineHeight: 1.4, color: headingColor }}>
                    {post.title}
                  </h2>

                  {/* Post Content */}
                  <p style={{ fontSize: 14, color: textPrimary, lineHeight: 1.6, margin: "0 0 16px", whiteSpace: "pre-line" }}>
                    {post.content}
                  </p>

                  {/* Role-Aware Intelligence Badges */}
                  {(post.type === "hiring" || post.type === "opportunity") && (
                    <div style={{ marginBottom: 16 }}>
                      {/* STUDENT VIEW: Real Personalized Fit Score */}
                      {viewerRole === "student" && post.fit_score !== undefined && (
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 7, background: post.fit_score >= 80 ? (isDark ? "rgba(46,125,91,0.2)" : "#EAF4EE") : accentLight, border: `1px solid ${post.fit_score >= 80 ? (isDark ? "rgba(46,125,91,0.4)" : "#C8E4D3") : accentBorder}` }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: post.fit_score >= 80 ? (isDark ? "#4ade80" : "#2E7D5B") : accent }}>
                            🎯 {post.fit_score}% Fit Score
                          </span>
                          <span style={{ fontSize: 11, color: textSecondary }}>
                            {post.fit_score >= 85 ? "Top Placement Synergy" : post.fit_score >= 70 ? "Strong Skill Overlap" : "Eligible Track"}
                          </span>
                          {post.matching_tags && post.matching_tags.length > 0 && (
                            <span style={{ fontSize: 11, color: textSecondary, borderLeft: `1px solid ${borderSubtle}`, paddingLeft: 8 }}>
                              Matched: {post.matching_tags.slice(0, 3).join(", ")}
                            </span>
                          )}
                        </div>
                      )}

                      {/* RECRUITER VIEW: Potential Candidates Indicator */}
                      {viewerRole === "recruiter" && post.potential_candidates_count !== undefined && (
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 7, background: accentLight, border: `1px solid ${accentBorder}` }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: accent }}>
                            👥 {post.potential_candidates_count} Potential Candidates
                          </span>
                          <span style={{ fontSize: 11, color: textSecondary }}>
                            with ≥70% algorithmic match in active cohort
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Collaboration Meta Details (team size, goal, deadline) */}
                  {post.type === "collaboration" && post.metadata && (
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16, fontSize: 12, color: textSecondary }}>
                      {post.metadata.team_size && (
                        <span style={{ padding: "3px 8px", borderRadius: 5, background: bgInner, border: `1px solid ${borderSubtle}`, color: headingColor }}>
                          👥 Team: {post.metadata.team_size}
                        </span>
                      )}
                      {post.metadata.collaboration_goal && (
                        <span style={{ padding: "3px 8px", borderRadius: 5, background: bgInner, border: `1px solid ${borderSubtle}`, color: headingColor }}>
                          🎯 Goal: {post.metadata.collaboration_goal}
                        </span>
                      )}
                      {post.deadline && (
                        <span style={{ padding: "3px 8px", borderRadius: 5, background: isDark ? "rgba(230,57,70,0.15)" : "#FDF2F2", color: "#E63946", border: `1px solid ${isDark ? "rgba(230,57,70,0.3)" : "#F8C8C8"}` }}>
                          ⏰ Deadline: {new Date(post.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
                      {post.tags.map((tag, i) => (
                        <span key={i} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, background: bgInner, border: `1px solid ${borderSubtle}`, color: textSecondary }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Card Action Footer */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${borderSubtle}`, paddingTop: 14, flexWrap: "wrap", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      {/* Upvote Button */}
                      <button
                        onClick={() => handleUpvote(post.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          background: isUpvoted ? accentLight : bgCard,
                          border: isUpvoted ? `1px solid ${accent}` : `1px solid ${borderSubtle}`,
                          color: isUpvoted ? accent : textSecondary,
                          padding: "6px 12px",
                          borderRadius: 7,
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 600
                        }}
                      >
                        <span>{isUpvoted ? "▲ Upvoted" : "▲ Upvote"}</span>
                        <span>{upvoteCount}</span>
                      </button>

                      {/* Replies Counter */}
                      <span style={{ fontSize: 12, color: textSecondary, display: "flex", alignItems: "center", gap: 4 }}>
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
                            borderRadius: 7,
                            background: accent,
                            color: "white",
                            fontSize: 12,
                            fontWeight: 600,
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
                            borderRadius: 7,
                            background: isDark ? "#13243A" : "#162A43",
                            border: `1px solid ${borderSubtle}`,
                            color: "white",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer"
                          }}
                        >
                          Join Squad / Connect ✉
                        </button>
                      ) : (
                        <span style={{ fontSize: 11, color: textSecondary }}>
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
            background: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20
          }}
        >
          <div
            style={{
              background: bgCard,
              border: `1px solid ${borderSubtle}`,
              borderRadius: 12,
              padding: "24px",
              maxWidth: 580,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: headingColor }}>
                Create New Community Post
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: "none", border: "none", color: textSecondary, fontSize: 18, cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {createSuccess ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: isDark ? "#4ade80" : "#2E7D5B" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>✓</div>
                <h4 style={{ margin: "0 0 6px", fontSize: 18, color: headingColor }}>Post Published Successfully!</h4>
                <p style={{ margin: 0, fontSize: 13, color: textSecondary }}>Added to the unified platform feed.</p>
              </div>
            ) : (
              <form onSubmit={handleCreatePost} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: headingColor, marginBottom: 6 }}>
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
                          borderRadius: 7,
                          textAlign: "left",
                          cursor: "pointer",
                          border: newType === opt.type ? `1px solid ${accent}` : `1px solid ${borderSubtle}`,
                          background: newType === opt.type ? accentLight : bgCard,
                          color: headingColor
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{opt.label}</div>
                        <div style={{ fontSize: 11, color: textSecondary }}>{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: headingColor, marginBottom: 6 }}>
                    Post Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="e.g. Seeking 2 Backend Engineers for Smart India Hackathon 2026..."
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 7, border: `1px solid ${borderSubtle}`, background: inputBg, color: textPrimary, fontSize: 13, boxSizing: "border-box", outline: "none" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: headingColor, marginBottom: 6 }}>
                    Content & Details *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={newContent}
                    onChange={e => setNewContent(e.target.value)}
                    placeholder="Describe your project, team requirements, engineering architecture, or opportunity..."
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 7, border: `1px solid ${borderSubtle}`, background: inputBg, color: textPrimary, fontSize: 13, boxSizing: "border-box", resize: "vertical", outline: "none" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: headingColor, marginBottom: 6 }}>
                      Organization / Team
                    </label>
                    <input
                      type="text"
                      value={newCompany}
                      onChange={e => setNewCompany(e.target.value)}
                      placeholder="e.g. IIT Delhi SIH Team / Startup"
                      style={{ width: "100%", padding: "8px 12px", borderRadius: 7, border: `1px solid ${borderSubtle}`, background: inputBg, color: textPrimary, fontSize: 12, boxSizing: "border-box", outline: "none" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: headingColor, marginBottom: 6 }}>
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={newTags}
                      onChange={e => setNewTags(e.target.value)}
                      placeholder="e.g. Next.js, Python, Kafka"
                      style={{ width: "100%", padding: "8px 12px", borderRadius: 7, border: `1px solid ${borderSubtle}`, background: inputBg, color: textPrimary, fontSize: 12, boxSizing: "border-box", outline: "none" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: headingColor, marginBottom: 6 }}>
                    External Link / Repository (Optional)
                  </label>
                  <input
                    type="url"
                    value={newUrl}
                    onChange={e => setNewUrl(e.target.value)}
                    placeholder="https://github.com/... or https://unstop.com/..."
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 7, border: `1px solid ${borderSubtle}`, background: inputBg, color: textPrimary, fontSize: 12, boxSizing: "border-box", outline: "none" }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    style={{ padding: "8px 16px", borderRadius: 7, background: "transparent", border: `1px solid ${borderSubtle}`, color: textSecondary, cursor: "pointer", fontSize: 12 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    style={{ padding: "8px 20px", borderRadius: 7, background: accent, border: "none", color: "white", fontWeight: 600, cursor: creating ? "not-allowed" : "pointer", fontSize: 13 }}
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
            background: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20
          }}
        >
          <div
            style={{
              background: bgCard,
              border: `1px solid ${borderSubtle}`,
              borderRadius: 12,
              padding: "24px",
              maxWidth: 480,
              width: "100%",
              boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 8px", color: headingColor }}>
              Connect with {joinModalPost.author_name}
            </h3>
            <p style={{ fontSize: 13, color: textSecondary, margin: "0 0 16px" }}>
              Regarding: <strong>{joinModalPost.title}</strong>
            </p>

            {joinSuccess ? (
              <div style={{ textAlign: "center", padding: "20px 0", color: isDark ? "#4ade80" : "#2E7D5B" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
                <div style={{ fontWeight: 700, color: headingColor }}>Collaboration Request Sent!</div>
                <p style={{ fontSize: 12, color: textSecondary, margin: "4px 0 0" }}>The author has been notified via their placement inbox.</p>
                <button
                  onClick={() => setJoinModalPost(null)}
                  style={{ marginTop: 16, padding: "6px 14px", borderRadius: 7, background: isDark ? "#13243A" : "#162A43", border: `1px solid ${borderSubtle}`, color: "white", cursor: "pointer", fontSize: 12 }}
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
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 7, border: `1px solid ${borderSubtle}`, background: inputBg, color: textPrimary, fontSize: 12, boxSizing: "border-box", marginBottom: 16, outline: "none" }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button
                    onClick={() => setJoinModalPost(null)}
                    style={{ padding: "6px 12px", borderRadius: 7, background: "transparent", border: `1px solid ${borderSubtle}`, color: textSecondary, cursor: "pointer", fontSize: 12 }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setJoinSuccess(true)}
                    style={{ padding: "6px 16px", borderRadius: 7, background: accent, border: "none", color: "white", fontWeight: 600, cursor: "pointer", fontSize: 12 }}
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
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--bg-canvas, #F6F5F1)", color: "var(--text-primary, #162A43)", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading Unified Feed...</div>}>
      <PostFeedContent />
    </Suspense>
  );
}
