"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function StudentOnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 9;

  const [loading, setLoading] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [githubConnectedHandle, setGithubConnectedHandle] = useState<string | null>(null);

  // Authenticated user identity
  const [userId, setUserId] = useState<string>("");

  // SECTION 1: Personal Information
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");

  // SECTION 2: Education
  const [college, setCollege] = useState("");
  const [degree, setDegree] = useState("B.Tech");
  const [branch, setBranch] = useState("Computer Science & Engineering");
  const [year, setYear] = useState("3rd Year");
  const [graduationYear, setGraduationYear] = useState("2026");
  const [cgpa, setCgpa] = useState("");
  const [coursework, setCoursework] = useState<string[]>([]);
  const [courseInput, setCourseInput] = useState("");

  // SECTION 3: Technical Skills
  const [skills, setSkills] = useState<Array<{
    name: string;
    level: "Beginner" | "Intermediate" | "Advanced" | "Expert";
    yearsOfExperience: number;
    evidenceSource: string;
  }>>([]);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState<"Beginner" | "Intermediate" | "Advanced" | "Expert">("Intermediate");
  const [newSkillYears, setNewSkillYears] = useState<number>(1);
  const [newSkillSource, setNewSkillSource] = useState("");

  // SECTION 4: Projects
  const [projects, setProjects] = useState<Array<{
    title: string;
    description: string;
    problemSolved: string;
    techStack: string[];
    role: string;
    contributions: string;
    githubUrl: string;
    liveUrl: string;
    duration: string;
  }>>([]);
  const [projTitle, setProjTitle] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [projProblem, setProjProblem] = useState("");
  const [projTech, setProjTech] = useState("");
  const [projRole, setProjRole] = useState("Lead Developer");
  const [projContributions, setProjContributions] = useState("");
  const [projGithub, setProjGithub] = useState("");
  const [projLive, setProjLive] = useState("");
  const [projDuration, setProjDuration] = useState("2 months");

  // SECTION 5: Experience
  const [experience, setExperience] = useState<Array<{
    organization: string;
    role: string;
    duration: string;
    type: string;
    responsibilities: string;
    technologies: string[];
  }>>([]);
  const [expOrg, setExpOrg] = useState("");
  const [expRole, setExpRole] = useState("");
  const [expDuration, setExpDuration] = useState("");
  const [expType, setExpType] = useState("Internship");
  const [expResp, setExpResp] = useState("");
  const [expTech, setExpTech] = useState("");

  // SECTION 6: Achievements
  const [achievements, setAchievements] = useState<Array<{
    title: string;
    type: string;
    description: string;
    date: string;
  }>>([]);
  const [achTitle, setAchTitle] = useState("");
  const [achType, setAchType] = useState("Hackathon");
  const [achDesc, setAchDesc] = useState("");
  const [achDate, setAchDate] = useState("");

  // SECTION 7: Certifications
  const [certifications, setCertifications] = useState<Array<{
    title: string;
    issuer: string;
    date: string;
    credentialUrl: string;
  }>>([]);
  const [certTitle, setCertTitle] = useState("");
  const [certIssuer, setCertIssuer] = useState("");
  const [certDate, setCertDate] = useState("");
  const [certUrl, setCertUrl] = useState("");

  // SECTION 8: Interests & Career Goals
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [targetCompanies, setTargetCompanies] = useState<string[]>([]);
  const [careerGoals, setCareerGoals] = useState("");

  // SECTION 9: Resume
  const [resumeFileName, setResumeFileName] = useState("");
  const [resumeUploaded, setResumeUploaded] = useState(false);

  // Load authenticated session on mount
  useEffect(() => {
    async function loadAuth() {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();

        if (!data.authenticated || !data.user) {
          router.push("/login?redirect=/student/onboarding");
          return;
        }

        if (data.user.accountType === "recruiter") {
          router.push("/recruiter/dashboard");
          return;
        }

        setUserId(data.user.id);
        if (data.user.email) setEmail(data.user.email);
        if (data.user.fullName) setFullName(data.user.fullName);

        // Pre-populate GitHub if connected via OAuth
        if (Array.isArray(data.connectedAccounts)) {
          const ghAcc = data.connectedAccounts.find((a: any) => a.provider === "github");
          if (ghAcc && ghAcc.providerUserId) {
            setGithubConnectedHandle(ghAcc.providerUserId);
            setGithubUrl(`https://github.com/${ghAcc.providerUserId}`);
          }
        }

        // If partial profile exists, populate
        if (data.studentProfile) {
          const sp = data.studentProfile;
          if (sp.fullName) setFullName(sp.fullName);
          if (sp.phone) setPhone(sp.phone);
          if (sp.location) setLocation(sp.location);
          if (sp.githubUrl) setGithubUrl(sp.githubUrl);
          if (sp.linkedinUrl) setLinkedinUrl(sp.linkedinUrl);
          if (sp.college) setCollege(sp.college);
          if (sp.degree) setDegree(sp.degree);
          if (sp.branch) setBranch(sp.branch);
          if (sp.graduationYear) setGraduationYear(sp.graduationYear);
          if (sp.cgpa) setCgpa(sp.cgpa);
          if (sp.skills?.length) setSkills(sp.skills);
          if (sp.projects?.length) setProjects(sp.projects);
          if (sp.experience?.length) setExperience(sp.experience);
          if (sp.achievements?.length) setAchievements(sp.achievements);
          if (sp.certifications?.length) setCertifications(sp.certifications);
          if (sp.careerGoals?.targetRoles?.length) setTargetRoles(sp.careerGoals.targetRoles);
          if (sp.careerGoals?.targetCompanies?.length) setTargetCompanies(sp.careerGoals.targetCompanies);
          if (sp.careerGoals?.careerGoals) setCareerGoals(sp.careerGoals.careerGoals);
          if (sp.resumeFileName) {
            setResumeFileName(sp.resumeFileName);
            setResumeUploaded(true);
          }
        }
      } catch (err) {
        console.error("Session load error:", err);
      } finally {
        setSessionLoading(false);
      }
    }
    loadAuth();
  }, [router]);

  // Skill Add
  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    setSkills([
      ...skills,
      {
        name: newSkillName.trim(),
        level: newSkillLevel,
        yearsOfExperience: Number(newSkillYears) || 1,
        evidenceSource: newSkillSource.trim() || "Self-Reported & Projects",
      },
    ]);
    setNewSkillName("");
    setNewSkillSource("");
  };

  // Project Add
  const handleAddProject = () => {
    if (!projTitle.trim() || !projDesc.trim()) {
      setError("Please provide a project title and description.");
      return;
    }
    setError(null);
    const techArr = projTech.split(",").map((t) => t.trim()).filter(Boolean);
    setProjects([
      ...projects,
      {
        title: projTitle.trim(),
        description: projDesc.trim(),
        problemSolved: projProblem.trim(),
        techStack: techArr.length > 0 ? techArr : ["Software Engineering"],
        role: projRole.trim(),
        contributions: projContributions.trim(),
        githubUrl: projGithub.trim(),
        liveUrl: projLive.trim(),
        duration: projDuration.trim(),
      },
    ]);
    setProjTitle("");
    setProjDesc("");
    setProjProblem("");
    setProjTech("");
    setProjContributions("");
    setProjGithub("");
    setProjLive("");
  };

  // Experience Add
  const handleAddExperience = () => {
    if (!expOrg.trim() || !expRole.trim()) return;
    const techArr = expTech.split(",").map((t) => t.trim()).filter(Boolean);
    setExperience([
      ...experience,
      {
        organization: expOrg.trim(),
        role: expRole.trim(),
        duration: expDuration.trim(),
        type: expType,
        responsibilities: expResp.trim(),
        technologies: techArr,
      },
    ]);
    setExpOrg("");
    setExpRole("");
    setExpDuration("");
    setExpResp("");
    setExpTech("");
  };

  // Achievement Add
  const handleAddAchievement = () => {
    if (!achTitle.trim()) return;
    setAchievements([
      ...achievements,
      {
        title: achTitle.trim(),
        type: achType,
        description: achDesc.trim(),
        date: achDate.trim(),
      },
    ]);
    setAchTitle("");
    setAchDesc("");
    setAchDate("");
  };

  // Certification Add
  const handleAddCertification = () => {
    if (!certTitle.trim() || !certIssuer.trim()) return;
    setCertifications([
      ...certifications,
      {
        title: certTitle.trim(),
        issuer: certIssuer.trim(),
        date: certDate.trim(),
        credentialUrl: certUrl.trim(),
      },
    ]);
    setCertTitle("");
    setCertIssuer("");
    setCertDate("");
    setCertUrl("");
  };

  // Resume File Selection
  const handleResumeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setResumeFileName(file.name);
      setResumeUploaded(true);
    }
  };

  // Helper to save current progress without forcing completion
  const handleSaveAndReturn = async () => {
    setSavingProgress(true);
    try {
      const payload = {
        fullName: fullName || "Student",
        email,
        phone,
        location,
        linkedinUrl,
        githubUrl,
        portfolioUrl,
        college,
        degree,
        branch,
        year,
        graduationYear,
        cgpa,
        coursework,
        skills,
        projects,
        experience,
        achievements,
        certifications,
        careerGoals: {
          targetRoles,
          preferredDomains: [],
          targetCompanies,
          preferredLocations: [],
          careerGoals,
        },
        resumeFileName: resumeFileName || undefined,
      };

      await fetch("/api/student/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      router.push("/student/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Save progress error:", err);
      router.push("/student/dashboard");
    } finally {
      setSavingProgress(false);
    }
  };

  // Final Submission: Build and Generate Student DNA
  const handleFinalSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        fullName,
        email,
        phone,
        location,
        linkedinUrl,
        githubUrl,
        portfolioUrl,
        college,
        degree,
        branch,
        year,
        graduationYear,
        cgpa,
        coursework,
        skills,
        projects,
        experience,
        achievements,
        certifications,
        careerGoals: {
          targetRoles,
          preferredDomains: [],
          targetCompanies,
          preferredLocations: [],
          careerGoals,
        },
        resumeFileName: resumeFileName || `${(fullName || "student").toLowerCase().replace(/[^a-z0-9]/g, "_")}_resume.pdf`,
        resumeUrl: resumeUploaded ? `/uploads/resumes/${userId}.pdf` : undefined,
      };

      const res = await fetch("/api/student/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate Student DNA.");
      }

      router.push("/student/dashboard?dna=ready");
      router.refresh();
    } catch (err: any) {
      console.error("Onboarding error:", err);
      setError(err.message || "An error occurred while saving your profile.");
    } finally {
      setLoading(false);
    }
  };

  // Section Purpose Explanations (What will Cognalyze use this for?)
  const sectionExplanations: Record<number, { title: string; why: string; isRequired: boolean }> = {
    1: {
      title: "Personal Information",
      why: "Helps us establish your verified student identity and link your portfolio accounts.",
      isRequired: true,
    },
    2: {
      title: "Education & Academics",
      why: "Helps us understand your academic background, degree trajectory, and campus eligibility.",
      isRequired: true,
    },
    3: {
      title: "Technical Skills",
      why: "Helps us benchmark your technical stack against real market requirements and skill-gap maps.",
      isRequired: false,
    },
    4: {
      title: "Projects & Codebase Proof",
      why: "Helps us understand what you've actually built and extract verifiable code proof.",
      isRequired: false,
    },
    5: {
      title: "Experience & Internships",
      why: "Helps us understand your professional exposure, team collaboration, and industry readiness.",
      isRequired: false,
    },
    6: {
      title: "Achievements & Contests",
      why: "Highlights your competitive edge from hackathons, ICPC, LeetCode ratings, and research.",
      isRequired: false,
    },
    7: {
      title: "Certifications",
      why: "Validates your structured domain specializations across cloud, AI, and developer tools.",
      isRequired: false,
    },
    8: {
      title: "Career Goals & Target Roles",
      why: "Matches you with high-signal roles and personalized opportunity feeds.",
      isRequired: false,
    },
    9: {
      title: "Resume & Evidence Synthesis",
      why: "Extracts automated ATS signals, keyword match, and cross-references your claims.",
      isRequired: false,
    },
  };

  if (sessionLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#F6F5F1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#667085",
          fontSize: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              border: "2px solid #356AE6",
              borderTopColor: "transparent",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <span>Verifying student session...</span>
        </div>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "9px 12px",
    background: "#FFFFFF",
    border: "1px solid #E4E1DA",
    borderRadius: 7,
    marginTop: 6,
    fontSize: 13,
    color: "#17191C",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: "#162A43",
    display: "block",
  };

  const cardStyle: React.CSSProperties = {
    background: "#FFFFFF",
    border: "1px solid #E4E1DA",
    borderRadius: 10,
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
  };

  const itemStyle: React.CSSProperties = {
    background: "#FFFFFF",
    border: "1px solid #E4E1DA",
    borderRadius: 8,
    padding: "12px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
  };

  const primaryBtnStyle: React.CSSProperties = {
    backgroundColor: "#356AE6",
    color: "#ffffff",
    border: "none",
    borderRadius: 7,
    padding: "8px 16px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    alignSelf: "flex-start",
  };

  const currentMeta = sectionExplanations[currentStep];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F6F5F1",
        color: "#17191C",
        fontFamily: "var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
      }}
    >
      {/* ── HEADER ── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          backgroundColor: "#FFFFFF",
          borderBottom: "1px solid #E4E1DA",
          padding: "14px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/student/dashboard" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                background: "#162A43",
                borderRadius: 7,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                fontSize: 14,
                fontWeight: 900,
              }}
            >
              ⚡
            </div>
            <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.5px", color: "#162A43" }}>
              COGNALYZE
            </span>
          </Link>
          <span
            style={{
              fontSize: 11,
              padding: "3px 8px",
              borderRadius: 5,
              background: "#EFF4FE",
              color: "#356AE6",
              border: "1px solid #D2E0FB",
              fontWeight: 700,
            }}
          >
            STUDENT DNA STUDIO
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 12, color: "#667085", fontWeight: 600 }}>
            Step <span style={{ color: "#356AE6", fontWeight: 800 }}>{currentStep}</span> of {totalSteps}
          </div>
          <button
            onClick={handleSaveAndReturn}
            disabled={savingProgress}
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E4E1DA",
              borderRadius: 7,
              padding: "7px 14px",
              fontSize: 12,
              fontWeight: 600,
              color: "#162A43",
              cursor: savingProgress ? "wait" : "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {savingProgress ? "Saving..." : "Save & Return to Dashboard ↗"}
          </button>
        </div>
      </header>

      {/* ── PROGRESS BAR ── */}
      <div style={{ height: 3, backgroundColor: "#E4E1DA", width: "100%" }}>
        <div
          style={{
            height: "100%",
            width: `${(currentStep / totalSteps) * 100}%`,
            background: "#356AE6",
            transition: "width 300ms ease",
          }}
        />
      </div>

      {/* ── FORM CONTAINER ── */}
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "40px 20px 80px" }}>
        {/* Soft developing notice */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#EFF4FE",
            border: "1px solid #D2E0FB",
            borderRadius: 8,
            padding: "12px 18px",
            marginBottom: 28,
            fontSize: 13,
            color: "#162A43",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span>🧬</span>
            <span>
              <strong>Your DNA is still developing.</strong> You can complete this now or return anytime. Partial evidence will immediately activate personalized guidance.
            </span>
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: 5,
              background: currentMeta.isRequired ? "#FDF2F2" : "#EAF4EE",
              color: currentMeta.isRequired ? "#C24141" : "#2E7D5B",
              border: `1px solid ${currentMeta.isRequired ? "#F8C8C8" : "#C8E4D3"}`,
              whiteSpace: "nowrap",
            }}
          >
            {currentMeta.isRequired ? "Required Section" : "Optional Section"}
          </span>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: "#FDF2F2",
              border: "1px solid #F8C8C8",
              color: "#C24141",
              padding: "12px 16px",
              borderRadius: 8,
              fontSize: 13,
              marginBottom: 24,
            }}
          >
            {error}
          </div>
        )}

        {/* Section Heading & Why It Matters Callout */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#356AE6", textTransform: "uppercase", letterSpacing: 1.2 }}>
            SECTION 0{currentStep} OF 09
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#162A43", margin: "6px 0 8px" }}>
            {currentMeta.title}
          </h1>

          {/* Section explanation callout */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E4E1DA",
              borderRadius: 8,
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginTop: 12,
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ fontSize: 18 }}>💡</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase", letterSpacing: 0.5 }}>
                What Cognalyze will use this for
              </div>
              <div style={{ fontSize: 13, color: "#17191C", marginTop: 2 }}>
                {currentMeta.why}
              </div>
            </div>
          </div>
        </div>

        {/* ── STEP 1: PERSONAL INFORMATION ── */}
        {currentStep === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {githubConnectedHandle && (
              <div
                style={{
                  background: "#EAF4EE",
                  border: "1px solid #C8E4D3",
                  borderRadius: 8,
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 18, color: "#2E7D5B" }}>✓</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#2E7D5B" }}>
                      GitHub Identity Verified ({githubConnectedHandle})
                    </div>
                    <div style={{ fontSize: 11, color: "#667085" }}>
                      Connected via OAuth. Repositories and commits will be automatically ingested.
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ gridColumn: "span 2" }}>
                <label style={labelStyle}>
                  Full Legal Name <span style={{ color: "#C24141" }}>*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Email Address</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  style={{
                    ...inputStyle,
                    background: "#F6F5F1",
                    color: "#667085",
                  }}
                />
              </div>

              <div>
                <label style={labelStyle}>Phone Number (Optional)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Current Location (Optional)</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. New Delhi, India"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>GitHub Profile URL (Optional)</label>
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username"
                  style={inputStyle}
                />
              </div>

              <div style={{ gridColumn: "span 2" }}>
                <label style={labelStyle}>LinkedIn Profile URL (Optional)</label>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: EDUCATION ── */}
        {currentStep === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ gridColumn: "span 2" }}>
                <label style={labelStyle}>
                  College / University Name <span style={{ color: "#C24141" }}>*</span>
                </label>
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="e.g. Indian Institute of Technology / Delhi Technological University"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Degree Program</label>
                <input
                  type="text"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  placeholder="e.g. B.Tech / B.E."
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Branch / Major</label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="e.g. Computer Science & Engineering"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Graduation Year</label>
                <input
                  type="text"
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  placeholder="2026"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>CGPA / Score (Optional)</label>
                <input
                  type="text"
                  value={cgpa}
                  onChange={(e) => setCgpa(e.target.value)}
                  placeholder="e.g. 8.6 / 10.0"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: TECHNICAL SKILLS ── */}
        {currentStep === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Added Skills List */}
            {skills.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {skills.map((s, idx) => (
                  <div
                    key={idx}
                    style={itemStyle}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#162A43" }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: "#667085", marginTop: 2 }}>
                        {s.level} • {s.yearsOfExperience} yr(s) • Source: {s.evidenceSource}
                      </div>
                    </div>
                    <button
                      onClick={() => setSkills(skills.filter((_, i) => i !== idx))}
                      style={{ background: "none", border: "none", color: "#C24141", fontSize: 12, cursor: "pointer", fontWeight: 600 }}
                    >
                      ✕ Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Skill Form */}
            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#162A43", textTransform: "uppercase", letterSpacing: 0.5 }}>
                + Add a Technical Skill
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Skill Name</label>
                  <input
                    type="text"
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    placeholder="e.g. Python, Docker, PostgreSQL"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Level</label>
                  <select
                    value={newSkillLevel}
                    onChange={(e: any) => setNewSkillLevel(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Years</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={newSkillYears}
                    onChange={(e) => setNewSkillYears(Number(e.target.value))}
                    style={inputStyle}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddSkill}
                style={primaryBtnStyle}
              >
                + Add Skill Entry
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: PROJECTS ── */}
        {currentStep === 4 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {projects.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {projects.map((p, idx) => (
                  <div
                    key={idx}
                    style={itemStyle}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#162A43" }}>{p.title}</div>
                      <div style={{ fontSize: 12, color: "#667085", marginTop: 2 }}>
                        Stack: {p.techStack.join(", ")} • Role: {p.role}
                      </div>
                    </div>
                    <button
                      onClick={() => setProjects(projects.filter((_, i) => i !== idx))}
                      style={{ background: "none", border: "none", color: "#C24141", fontSize: 12, cursor: "pointer", fontWeight: 600 }}
                    >
                      ✕ Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#162A43", textTransform: "uppercase", letterSpacing: 0.5 }}>
                + Document a Technical Project
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={labelStyle}>Project Title</label>
                  <input
                    type="text"
                    value={projTitle}
                    onChange={(e) => setProjTitle(e.target.value)}
                    placeholder="e.g. Distributed Consensus Engine"
                    style={inputStyle}
                  />
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={labelStyle}>Description & Architecture</label>
                  <textarea
                    rows={2}
                    value={projDesc}
                    onChange={(e) => setProjDesc(e.target.value)}
                    placeholder="Architected a Raft-based distributed key-value store with continuous replication..."
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Tech Stack (comma-separated)</label>
                  <input
                    type="text"
                    value={projTech}
                    onChange={(e) => setProjTech(e.target.value)}
                    placeholder="Go, gRPC, Protobuf, Docker"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>GitHub Repo Link (Optional)</label>
                  <input
                    type="url"
                    value={projGithub}
                    onChange={(e) => setProjGithub(e.target.value)}
                    placeholder="https://github.com/user/repo"
                    style={inputStyle}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddProject}
                style={primaryBtnStyle}
              >
                + Add Project Entry
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 5: EXPERIENCE ── */}
        {currentStep === 5 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {experience.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {experience.map((e, idx) => (
                  <div
                    key={idx}
                    style={itemStyle}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#162A43" }}>
                        {e.role} @ {e.organization}
                      </div>
                      <div style={{ fontSize: 12, color: "#667085", marginTop: 2 }}>
                        {e.type} • {e.duration}
                      </div>
                    </div>
                    <button
                      onClick={() => setExperience(experience.filter((_, i) => i !== idx))}
                      style={{ background: "none", border: "none", color: "#C24141", fontSize: 12, cursor: "pointer", fontWeight: 600 }}
                    >
                      ✕ Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#162A43", textTransform: "uppercase", letterSpacing: 0.5 }}>
                + Add Work Experience / Internship
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Organization / Company</label>
                  <input
                    type="text"
                    value={expOrg}
                    onChange={(e) => setExpOrg(e.target.value)}
                    placeholder="e.g. Razorpay, Startup Labs"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Role / Designation</label>
                  <input
                    type="text"
                    value={expRole}
                    onChange={(e) => setExpRole(e.target.value)}
                    placeholder="Backend Engineering Intern"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Duration</label>
                  <input
                    type="text"
                    value={expDuration}
                    onChange={(e) => setExpDuration(e.target.value)}
                    placeholder="May 2025 - July 2025"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Type</label>
                  <select
                    value={expType}
                    onChange={(e) => setExpType(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="Internship">Internship</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Research">Academic Research</option>
                    <option value="Freelance">Contract / Freelance</option>
                  </select>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddExperience}
                style={primaryBtnStyle}
              >
                + Add Experience Entry
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 6: ACHIEVEMENTS ── */}
        {currentStep === 6 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {achievements.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {achievements.map((a, idx) => (
                  <div
                    key={idx}
                    style={itemStyle}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#162A43" }}>{a.title}</div>
                      <div style={{ fontSize: 12, color: "#667085", marginTop: 2 }}>{a.type} • {a.date}</div>
                    </div>
                    <button
                      onClick={() => setAchievements(achievements.filter((_, i) => i !== idx))}
                      style={{ background: "none", border: "none", color: "#C24141", fontSize: 12, cursor: "pointer", fontWeight: 600 }}
                    >
                      ✕ Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#162A43", textTransform: "uppercase", letterSpacing: 0.5 }}>
                + Add Hackathon / Contest / Honor
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Achievement Title</label>
                  <input
                    type="text"
                    value={achTitle}
                    onChange={(e) => setAchTitle(e.target.value)}
                    placeholder="Winner - Smart India Hackathon 2025"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Type</label>
                  <select
                    value={achType}
                    onChange={(e) => setAchType(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="Hackathon">Hackathon</option>
                    <option value="Coding Contest">Competitive Coding</option>
                    <option value="Research Paper">Publication / Patent</option>
                    <option value="Open Source">Open Source Contribution</option>
                  </select>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddAchievement}
                style={primaryBtnStyle}
              >
                + Add Achievement Entry
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 7: CERTIFICATIONS ── */}
        {currentStep === 7 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {certifications.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {certifications.map((c, idx) => (
                  <div
                    key={idx}
                    style={itemStyle}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#162A43" }}>{c.title}</div>
                      <div style={{ fontSize: 12, color: "#667085", marginTop: 2 }}>Issuer: {c.issuer}</div>
                    </div>
                    <button
                      onClick={() => setCertifications(certifications.filter((_, i) => i !== idx))}
                      style={{ background: "none", border: "none", color: "#C24141", fontSize: 12, cursor: "pointer", fontWeight: 600 }}
                    >
                      ✕ Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#162A43", textTransform: "uppercase", letterSpacing: 0.5 }}>
                + Add Certification
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Certificate Name</label>
                  <input
                    type="text"
                    value={certTitle}
                    onChange={(e) => setCertTitle(e.target.value)}
                    placeholder="AWS Solutions Architect / CKA"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Issuing Body</label>
                  <input
                    type="text"
                    value={certIssuer}
                    onChange={(e) => setCertIssuer(e.target.value)}
                    placeholder="Amazon Web Services"
                    style={inputStyle}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddCertification}
                style={primaryBtnStyle}
              >
                + Add Certification Entry
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 8: CAREER GOALS ── */}
        {currentStep === 8 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={labelStyle}>Target Engineering Roles</label>
                <input
                  type="text"
                  value={targetRoles.join(", ")}
                  onChange={(e) => setTargetRoles(e.target.value.split(",").map((r) => r.trim()).filter(Boolean))}
                  placeholder="Backend Engineer, Distributed Systems, ML Engineer"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Dream / Target Companies (Optional)</label>
                <input
                  type="text"
                  value={targetCompanies.join(", ")}
                  onChange={(e) => setTargetCompanies(e.target.value.split(",").map((c) => c.trim()).filter(Boolean))}
                  placeholder="Google, Stripe, Datadog, Razorpay"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Primary Career Goal / Direction</label>
                <textarea
                  rows={3}
                  value={careerGoals}
                  onChange={(e) => setCareerGoals(e.target.value)}
                  placeholder="e.g. Seeking high-scale distributed backend systems engineering role building low-latency payment rails..."
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 9: RESUME UPLOAD & SYNTHESIS ── */}
        {currentStep === 9 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div
              style={{
                background: "#FFFFFF",
                border: "1px dashed #356AE6",
                borderRadius: 10,
                padding: "32px 20px",
                textAlign: "center",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#162A43" }}>
                {resumeUploaded ? `Selected: ${resumeFileName}` : "Upload Your Resume (Optional)"}
              </div>
              <div style={{ fontSize: 13, color: "#667085", marginTop: 4, marginBottom: 18 }}>
                PDF or Word Document. Cognalyze synthesizes claims against your entered evidence.
              </div>
              <label
                style={{
                  backgroundColor: "#356AE6",
                  color: "#ffffff",
                  padding: "9px 18px",
                  borderRadius: 7,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-block",
                  transition: "background-color 0.15s ease",
                }}
              >
                {resumeUploaded ? "Replace File" : "Choose Resume File"}
                <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeFileChange} style={{ display: "none" }} />
              </label>
            </div>

            {/* Review Summary */}
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E4E1DA",
                borderRadius: 10,
                padding: "20px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: "#162A43", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 14 }}>
                Profile Summary • {fullName || "Candidate"}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13, color: "#667085" }}>
                <div>• College: <strong style={{ color: "#162A43" }}>{college || "Not set"}</strong></div>
                <div>• Degree: <strong style={{ color: "#162A43" }}>{degree} in {branch}</strong></div>
                <div>• Skills Added: <strong style={{ color: "#162A43" }}>{skills.length} skills</strong></div>
                <div>• Projects Documented: <strong style={{ color: "#162A43" }}>{projects.length} projects</strong></div>
                <div>• Experience Entries: <strong style={{ color: "#162A43" }}>{experience.length} entries</strong></div>
                <div>• Target Roles: <strong style={{ color: "#162A43" }}>{targetRoles.join(", ") || "General Engineering"}</strong></div>
              </div>
            </div>
          </div>
        )}

        {/* ── NAVIGATION CONTROLS (PREV / SKIP / NEXT) ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 36,
            paddingTop: 24,
            borderTop: "1px solid #E4E1DA",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              disabled={currentStep === 1}
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              style={{
                backgroundColor: "#FFFFFF",
                color: currentStep === 1 ? "#98A2B3" : "#162A43",
                border: "1px solid #E4E1DA",
                borderRadius: 7,
                padding: "10px 18px",
                fontSize: 13,
                fontWeight: 600,
                cursor: currentStep === 1 ? "not-allowed" : "pointer",
              }}
            >
              ← Previous
            </button>

            {/* Skip this optional section */}
            {!currentMeta.isRequired && currentStep < totalSteps && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                style={{
                  backgroundColor: "transparent",
                  color: "#667085",
                  border: "none",
                  padding: "10px 14px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Skip this section →
              </button>
            )}
          </div>

          <div>
            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={() => {
                  if (currentStep === 1 && !fullName.trim()) {
                    setError("Please enter your full name.");
                    return;
                  }
                  if (currentStep === 2 && !college.trim()) {
                    setError("Please enter your college / university name.");
                    return;
                  }
                  setError(null);
                  setCurrentStep(currentStep + 1);
                }}
                style={{
                  backgroundColor: "#356AE6",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 7,
                  padding: "10px 22px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 1px 3px rgba(53, 106, 230, 0.25)",
                }}
              >
                Continue to Step {currentStep + 1} →
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={handleFinalSubmit}
                style={{
                  backgroundColor: "#162A43",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 7,
                  padding: "10px 24px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: loading ? "wait" : "pointer",
                  boxShadow: "0 2px 8px rgba(22, 42, 67, 0.25)",
                }}
              >
                {loading ? "Generating Student DNA..." : "Generate My Student DNA ➔"}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
