"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Search,
  GitBranch,
  FolderGit2,
  FileText,
  ShieldCheck,
  Code2,
  Trophy
} from "lucide-react";

// ==========================================
// 1. BUTTON
// Radius: 7px, Transitions: 150-200ms
// ==========================================
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  icon,
  children,
  className = "",
  style,
  ...props
}: ButtonProps) {
  const baseStyles: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 7,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 150ms cubic-bezier(0.22, 1, 0.36, 1)",
    border: "1px solid transparent",
    outline: "none",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: "5px 10px", fontSize: 12, height: 28 },
    md: { padding: "7px 14px", fontSize: 13, height: 34 },
    lg: { padding: "10px 18px", fontSize: 14, height: 42 },
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: "var(--accent, #356AE6)",
      color: "#FFFFFF",
      boxShadow: "0 1px 2px rgba(53, 106, 230, 0.2)",
    },
    secondary: {
      backgroundColor: "var(--bg-card, #FFFFFF)",
      color: "var(--text-primary, #17191C)",
      border: "1px solid var(--border-subtle, #E4E1DA)",
      boxShadow: "var(--shadow-subtle, 0 1px 2px rgba(16, 24, 40, 0.04))",
    },
    outline: {
      backgroundColor: "transparent",
      color: "var(--text-primary, #162A43)",
      border: "1px solid var(--border-subtle, #E4E1DA)",
    },
    ghost: {
      backgroundColor: "transparent",
      color: "var(--text-secondary, #667085)",
    },
    danger: {
      backgroundColor: "var(--color-error, #C24141)",
      color: "#FFFFFF",
    },
  };

  return (
    <button
      style={{
        ...baseStyles,
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style,
      }}
      className={`hover:opacity-90 active:scale-[0.98] ${className}`}
      {...props}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}

// ==========================================
// 2. BADGE
// Radius: 5px, Compact 11-12px metadata
// ==========================================
export interface BadgeProps {
  variant?: "verified" | "limited" | "unverified" | "cobalt" | "navy" | "neutral";
  icon?: boolean;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Badge({
  variant = "neutral",
  icon = true,
  children,
  className = "",
  style,
}: BadgeProps) {
  const configs = {
    verified: {
      bg: "var(--color-success-bg, #EAF4EE)",
      color: "var(--color-success, #2E7D5B)",
      border: "var(--color-success-border, #C8E4D3)",
      defaultIcon: <CheckCircle2 size={11} className="shrink-0" />,
    },
    limited: {
      bg: "var(--color-warning-bg, #FDF6E9)",
      color: "var(--color-warning, #B7791F)",
      border: "var(--color-warning-border, #F5DFBA)",
      defaultIcon: <AlertTriangle size={11} className="shrink-0" />,
    },
    unverified: {
      bg: "var(--bg-surface-elevated, #F0EFEA)",
      color: "var(--text-secondary, #667085)",
      border: "var(--border-subtle, #E4E1DA)",
      defaultIcon: <HelpCircle size={11} className="shrink-0" />,
    },
    cobalt: {
      bg: "var(--color-info-bg, #EEF4FD)",
      color: "var(--accent, #356AE6)",
      border: "var(--color-info-border, #D1E2FB)",
      defaultIcon: null,
    },
    navy: {
      bg: "var(--brand-navy, #162A43)",
      color: "var(--text-primary, #FFFFFF)",
      border: "var(--border-strong, #162A43)",
      defaultIcon: null,
    },
    neutral: {
      bg: "var(--bg-surface-inner, #F6F5F1)",
      color: "var(--text-secondary, #667085)",
      border: "var(--border-subtle, #E4E1DA)",
      defaultIcon: null,
    },
  };

  const conf = configs[variant];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 7px",
        borderRadius: 5,
        fontSize: 11,
        fontWeight: 600,
        backgroundColor: conf.bg,
        color: conf.color,
        border: `1px solid ${conf.border}`,
        letterSpacing: "0.2px",
        lineHeight: 1.4,
        ...style,
      }}
      className={className}
    >
      {icon && conf.defaultIcon}
      {children}
    </span>
  );
}

// ==========================================
// 3. CARD
// Radius: 10px, Surface: #FFFFFF / #0E1B2E, Border: #E4E1DA / #223750
// ==========================================
export function Card({
  children,
  className = "",
  style,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: "var(--bg-card, #FFFFFF)",
        color: "var(--text-primary, #17191C)",
        border: "1px solid var(--border-subtle, #E4E1DA)",
        borderRadius: 10,
        padding: 20,
        boxShadow: "var(--shadow-card, 0 1px 3px rgba(16, 24, 40, 0.05))",
        transition: "all 200ms cubic-bezier(0.22, 1, 0.36, 1)",
        ...style,
      }}
      className={`${onClick ? "cursor-pointer hover:border-[var(--border-strong,#D1CDC4)] hover:shadow-md" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

// ==========================================
// 4. SIGNATURE PATTERN: "WHY?" DISCLOSURE
// Progressive disclosure of evidence reasoning
// ==========================================
export function WhyDisclosure({
  title = "Why this match?",
  summary,
  evidenceItems,
  evidenceLink,
}: {
  title?: string;
  summary: string;
  evidenceItems?: Array<{ label: string; verified: boolean; source?: string }>;
  evidenceLink?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        marginTop: 10,
        borderRadius: 7,
        border: "1px solid var(--border-subtle, #E4E1DA)",
        backgroundColor: open ? "var(--bg-card, #FFFFFF)" : "var(--bg-surface-inner, #F6F5F1)",
        overflow: "hidden",
        transition: "all 200ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          padding: "7px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 600,
          color: "var(--accent, #356AE6)",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span>💡</span> {title}
        </span>
        <span style={{ color: "var(--text-secondary, #667085)", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
          {open ? "Hide" : "Explain"} {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </span>
      </button>

      {open && (
        <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border-subtle, #E4E1DA)", fontSize: 12, lineHeight: 1.5, color: "var(--text-primary, #17191C)" }}>
          <p style={{ margin: "0 0 8px", color: "var(--text-secondary, #667085)" }}>{summary}</p>

          {evidenceItems && evidenceItems.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 8 }}>
              {evidenceItems.map((item, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    {item.verified ? (
                      <CheckCircle2 size={12} color="var(--color-success, #2E7D5B)" />
                    ) : (
                      <AlertTriangle size={12} color="var(--color-warning, #B7791F)" />
                    )}
                    <span style={{ fontWeight: 500, color: "var(--text-primary, #17191C)" }}>{item.label}</span>
                  </span>
                  {item.source && (
                    <span style={{ color: "var(--text-muted, #98A2B3)", fontSize: 10 }}>Source: {item.source}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {evidenceLink && (
            <Link
              href={evidenceLink}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                color: "var(--accent, #356AE6)",
                fontWeight: 600,
                fontSize: 11,
                textDecoration: "none",
                marginTop: 4,
              }}
            >
              <span>View full evidence trail</span>
              <ExternalLink size={10} />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

// ==========================================
// 5. EVIDENCE SOURCE TAG (Section 11)
// Visual evidence connections (GitHub, Project, Claim)
// ==========================================
export function EvidenceSourceTag({
  type,
  detail,
  verified = true,
}: {
  type: "github" | "project" | "assessment" | "claim";
  detail: string;
  verified?: boolean;
}) {
  const icons = {
    github: <GitBranch size={11} />,
    project: <FolderGit2 size={11} />,
    assessment: <Code2 size={11} />,
    claim: <FileText size={11} />,
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 8px",
        borderRadius: 5,
        fontSize: 11,
        backgroundColor: verified ? "var(--bg-surface-inner, #F6F5F1)" : "var(--color-warning-bg, #FDF6E9)",
        color: verified ? "var(--text-primary, #17191C)" : "var(--color-warning, #B7791F)",
        border: `1px solid ${verified ? "var(--border-subtle, #E4E1DA)" : "var(--color-warning-border, #F5DFBA)"}`,
        fontWeight: 500,
      }}
    >
      <span style={{ color: verified ? "var(--text-secondary, #667085)" : "var(--color-warning, #B7791F)" }}>{icons[type]}</span>
      <span>{detail}</span>
      {verified ? (
        <CheckCircle2 size={10} color="var(--color-success, #2E7D5B)" />
      ) : (
        <AlertTriangle size={10} color="var(--color-warning, #B7791F)" />
      )}
    </span>
  );
}

// ==========================================
// 6. CANDIDATE CARD (Section 12)
// Clean professional candidate card
// ==========================================
export function CandidateCard({
  name,
  role,
  matchPercentage,
  skills,
  evidenceStats,
  gapsCount,
  pendingVerifications,
  candidateLink,
}: {
  name: string;
  role: string;
  matchPercentage: number;
  skills: Array<{ name: string; status: "verified" | "project" | "limited" }>;
  evidenceStats: { githubRepos?: number; projects?: number; solved?: number; hackathons?: number };
  gapsCount: number;
  pendingVerifications: number;
  candidateLink: string;
}) {
  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "var(--text-primary, #17191C)" }}>{name}</h4>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--text-secondary, #667085)" }}>{role}</p>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--accent, #356AE6)", lineHeight: 1 }}>
            {matchPercentage}%
          </div>
          <span style={{ fontSize: 10, color: "var(--text-muted, #98A2B3)", fontWeight: 600, letterSpacing: "0.5px" }}>
            ROLE MATCH
          </span>
        </div>
      </div>

      {/* Role Alignment Skills */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted, #98A2B3)", letterSpacing: "0.5px", marginBottom: 6 }}>
          ROLE ALIGNMENT
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {skills.slice(0, 4).map((s, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
              <span style={{ color: "var(--text-primary, #17191C)", fontWeight: 500 }}>{s.name}</span>
              <Badge variant={s.status === "verified" ? "verified" : s.status === "project" ? "verified" : "limited"}>
                {s.status === "verified" ? "Verified" : s.status === "project" ? "Project evidence" : "Limited evidence"}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Evidence Summary Strip */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "8px 12px",
          background: "var(--bg-surface-inner, #F6F5F1)",
          borderRadius: 7,
          fontSize: 11,
          color: "var(--text-secondary, #667085)",
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        {evidenceStats.githubRepos !== undefined && (
          <span>GitHub: <strong style={{ color: "var(--text-primary, #17191C)" }}>{evidenceStats.githubRepos} repos</strong></span>
        )}
        {evidenceStats.projects !== undefined && (
          <span>Projects: <strong style={{ color: "var(--text-primary, #17191C)" }}>{evidenceStats.projects} relevant</strong></span>
        )}
        {evidenceStats.solved !== undefined && (
          <span>DSA: <strong style={{ color: "var(--text-primary, #17191C)" }}>{evidenceStats.solved} solved</strong></span>
        )}
        {evidenceStats.hackathons !== undefined && (
          <span>Hackathons: <strong style={{ color: "var(--text-primary, #17191C)" }}>{evidenceStats.hackathons}</strong></span>
        )}
      </div>

      {/* Gaps & Verification footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "1px solid var(--border-subtle, #E4E1DA)" }}>
        <div style={{ fontSize: 11, color: "var(--text-secondary, #667085)" }}>
          {gapsCount > 0 ? (
            <span style={{ color: "var(--color-warning, #B7791F)", fontWeight: 600 }}>{gapsCount} open gaps</span>
          ) : (
            <span style={{ color: "var(--color-success, #2E7D5B)", fontWeight: 600 }}>No critical gaps</span>
          )}
          {pendingVerifications > 0 && (
            <span style={{ color: "var(--text-muted, #98A2B3)", marginLeft: 6 }}>• {pendingVerifications} verification pending</span>
          )}
        </div>

        <Link href={candidateLink}>
          <Button variant="secondary" size="sm">
            View candidate →
          </Button>
        </Link>
      </div>
    </Card>
  );
}

// ==========================================
// 7. CONTEXTUAL LOADING STEPS (Section 22)
// Never "AI is thinking..." -> Exact operations
// ==========================================
export function LoadingSteps({
  steps,
  currentStepIndex,
}: {
  steps: string[];
  currentStepIndex: number;
}) {
  return (
    <div style={{ padding: "20px 24px", background: "var(--bg-card, #FFFFFF)", borderRadius: 10, border: "1px solid var(--border-subtle, #E4E1DA)", maxWidth: 460, margin: "0 auto" }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary, #162A43)", marginBottom: 14 }}>
        Intelligence Pipeline Processing
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {steps.map((step, idx) => {
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          return (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                color: isDone ? "var(--color-success, #2E7D5B)" : isCurrent ? "var(--accent, #356AE6)" : "var(--text-muted, #98A2B3)",
                fontWeight: isCurrent ? 600 : 500,
              }}
            >
              {isDone ? (
                <CheckCircle2 size={13} color="var(--color-success, #2E7D5B)" />
              ) : isCurrent ? (
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    border: "2px solid var(--accent, #356AE6)",
                    borderTopColor: "transparent",
                    animation: "spin 1s linear infinite",
                  }}
                />
              ) : (
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--border-subtle, #E4E1DA)" }} />
              )}
              <span>{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// 8. EMPTY STATE (Section 23)
// Clean typography + subtle line graphic
// ==========================================
export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "48px 24px",
        background: "var(--bg-card, #FFFFFF)",
        border: "1px dashed var(--border-subtle, #E4E1DA)",
        borderRadius: 10,
        maxWidth: 520,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 8,
          background: "var(--bg-surface-elevated, #F6F5F1)",
          border: "1px solid var(--border-subtle, #E4E1DA)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 14px",
          color: "var(--text-secondary, #667085)",
        }}
      >
        <ShieldCheck size={20} />
      </div>

      <h4 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 600, color: "var(--text-primary, #17191C)" }}>
        {title}
      </h4>

      <p style={{ margin: "0 0 18px", fontSize: 13, color: "var(--text-secondary, #667085)", lineHeight: 1.5 }}>
        {description}
      </p>

      {actionLabel && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
