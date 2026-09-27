"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function StudentOnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 9;

  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  const [roleInput, setRoleInput] = useState("");
  const [preferredDomains, setPreferredDomains] = useState<string[]>([]);
  const [domainInput, setDomainInput] = useState("");
  const [targetCompanies, setTargetCompanies] = useState<string[]>([]);
  const [companyInput, setCompanyInput] = useState("");
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

        setUserId(data.user.id);
        if (data.user.email) setEmail(data.user.email);
        if (data.user.fullName) setFullName(data.user.fullName);

        // If existing profile has already been completed, redirect to dashboard
        if (data.studentProfile && data.studentProfile.profileCompleted) {
          router.push("/student/dashboard");
          return;
        }

        // If partial profile exists, populate
        if (data.studentProfile) {
          const sp = data.studentProfile;
          if (sp.fullName) setFullName(sp.fullName);
          if (sp.college) setCollege(sp.college);
          if (sp.degree) setDegree(sp.degree);
          if (sp.branch) setBranch(sp.branch);
          if (sp.skills?.length) setSkills(sp.skills);
          if (sp.projects?.length) setProjects(sp.projects);
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
        evidenceSource: newSkillSource.trim() || "Self-Reported & Projects"
      }
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
    const techArr = projTech.split(",").map(t => t.trim()).filter(Boolean);
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
      }
    ]);
    // Reset project inputs
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
    const techArr = expTech.split(",").map(t => t.trim()).filter(Boolean);
    setExperience([
      ...experience,
      {
        organization: expOrg.trim(),
        role: expRole.trim(),
        duration: expDuration.trim(),
        type: expType,
        responsibilities: expResp.trim(),
        technologies: techArr
      }
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
      }
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
      }
    ]);
    setCertTitle("");
    setCertIssuer("");
    setCertDate("");
    setCertUrl("");
  };

  // Mock Resume File Selection
  const handleResumeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setResumeFileName(file.name);
      setResumeUploaded(true);
    }
  };

  // Final Submission: Build and Generate Student DNA
  const handleFinalSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        explicitUserId: userId,
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
          preferredDomains,
          targetCompanies,
          preferredLocations: [],
          careerGoals,
        },
        resumeFileName: resumeFileName || `${fullName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_resume.pdf`,
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

      // Successfully onboarded -> Proceed directly to Dashboard
      router.push("/student/dashboard");
      router.refresh();
    } catch (err: any) {
      console.error("Onboarding error:", err);
      setError(err.message || "An error occurred while saving your profile.");
    } finally {
      setLoading(false);
    }
  };

  if (sessionLoading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#FAFAF9", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 14, color: "#6B6B6B" }}>Verifying session...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FAFAF9", color: "#18181B" }}>
      {/* ── HEADER ── */}
      <header
        style={{
          backgroundColor: "#FFFFFF",
          borderBottom: "1px solid #E7E5E4",
          padding: "16px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 26,
              height: 26,
              backgroundColor: "#18181B",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            C
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.4px" }}>COGNALYZE</span>
        </div>
        <div style={{ fontSize: 13, color: "#6B6B6B", fontWeight: 500 }}>
          Build Your Student DNA • Step {currentStep} of {totalSteps}
        </div>
      </header>

      {/* ── PROGRESS BAR ── */}
      <div style={{ height: 3, backgroundColor: "#E7E5E4", width: "100%" }}>
        <div
          style={{
            height: "100%",
            width: `${(currentStep / totalSteps) * 100}%`,
            backgroundColor: "#176B5B",
            transition: "width 300ms ease",
          }}
        />
      </div>

      {/* ── FORM CONTAINER ── */}
      <main style={{ maxWidth: 740, margin: "0 auto", padding: "48px 24px 80px" }}>
        {error && (
          <div
            style={{
              backgroundColor: "#FEF2F2",
              border: "1px solid #FCA5A5",
              color: "#991B1B",
              padding: "12px 16px",
              borderRadius: 8,
              fontSize: 13,
              marginBottom: 24,
            }}
          >
            {error}
          </div>
        )}

        {/* ── STEP 1: PERSONAL INFORMATION ── */}
        {currentStep === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#176B5B", textTransform: "uppercase" }}>SECTION 01 OF 09</span>
              <h2 style={{ fontSize: 28, fontWeight: 700, color: "#111111", margin: "6px 0 6px" }}>Personal Information</h2>
              <p style={{ fontSize: 14, color: "#6B6B6B", margin: 0 }}>Establish your verifiable student profile identity.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#18181B" }}>Full Legal Name *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #E7E5E4", borderRadius: 8, marginTop: 6, fontSize: 14 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#18181B" }}>Email Address</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #E7E5E4", borderRadius: 8, marginTop: 6, fontSize: 14, backgroundColor: "#F5F5F4" }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#18181B" }}>Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #E7E5E4", borderRadius: 8, marginTop: 6, fontSize: 14 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#18181B" }}>Current Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. New Delhi, India"
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #E7E5E4", borderRadius: 8, marginTop: 6, fontSize: 14 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#18181B" }}>GitHub Profile URL</label>
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username"
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #E7E5E4", borderRadius: 8, marginTop: 6, fontSize: 14 }}
                />
              </div>

              <div style={{ gridColumn: "span 2" }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#18181B" }}>LinkedIn Profile URL</label>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #E7E5E4", borderRadius: 8, marginTop: 6, fontSize: 14 }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: EDUCATION ── */}
        {currentStep === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#176B5B", textTransform: "uppercase" }}>SECTION 02 OF 09</span>
              <h2 style={{ fontSize: 28, fontWeight: 700, color: "#111111", margin: "6px 0 6px" }}>Education & Academics</h2>
              <p style={{ fontSize: 14, color: "#6B6B6B", margin: 0 }}>Add your university degree and academic track.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#18181B" }}>College / University Name *</label>
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="e.g. Indian Institute of Technology / Delhi Technological University"
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #E7E5E4", borderRadius: 8, marginTop: 6, fontSize: 14 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#18181B" }}>Degree</label>
                <input
                  type="text"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  placeholder="e.g. B.Tech / B.E."
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #E7E5E4", borderRadius: 8, marginTop: 6, fontSize: 14 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#18181B" }}>Branch / Major</label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="e.g. Computer Science & Engineering"
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #E7E5E4", borderRadius: 8, marginTop: 6, fontSize: 14 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#18181B" }}>Graduation Cohort Year</label>
                <input
                  type="text"
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  placeholder="2026"
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #E7E5E4", borderRadius: 8, marginTop: 6, fontSize: 14 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#18181B" }}>CGPA or Percentage</label>
                <input
                  type="text"
                  value={cgpa}
                  onChange={(e) => setCgpa(e.target.value)}
                  placeholder="e.g. 8.6 / 10.0"
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #E7E5E4", borderRadius: 8, marginTop: 6, fontSize: 14 }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: TECHNICAL SKILLS ── */}
        {currentStep === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#176B5B", textTransform: "uppercase" }}>SECTION 03 OF 09</span>
              <h2 style={{ fontSize: 28, fontWeight: 700, color: "#111111", margin: "6px 0 6px" }}>Technical Skills</h2>
              <p style={{ fontSize: 14, color: "#6B6B6B", margin: 0 }}>Add skills with proficiency levels and evidence origins.</p>
            </div>

            {/* Current Added Skills List */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {skills.map((s, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E7E5E4",
                    borderRadius: 8,
                    padding: "10px 14px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#111111" }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: "#6B6B6B" }}>
                      {s.level} • {s.yearsOfExperience} yr(s) • Source: {s.evidenceSource}
                    </div>
                  </div>
                  <button
                    onClick={() => setSkills(skills.filter((_, i) => i !== idx))}
                    style={{ backgroundColor: "transparent", border: "none", color: "#991B1B", fontSize: 12, cursor: "pointer" }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {/* Add Skill Box */}
            <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E7E5E4", borderRadius: 10, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#18181B", textTransform: "uppercase" }}>Add a Skill</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#6B6B6B" }}>Skill Name</label>
                  <input
                    type="text"
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    placeholder="e.g. React, Java, PostgreSQL"
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid #E7E5E4", borderRadius: 6, marginTop: 4, fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#6B6B6B" }}>Proficiency Level</label>
                  <select
                    value={newSkillLevel}
                    onChange={(e: any) => setNewSkillLevel(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid #E7E5E4", borderRadius: 6, marginTop: 4, fontSize: 13, backgroundColor: "#FFFFFF" }}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddSkill}
                style={{
                  backgroundColor: "#18181B",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 6,
                  padding: "8px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  alignSelf: "flex-start",
                }}
              >
                + Add Skill to DNA
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: PROJECTS ── */}
        {currentStep === 4 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#176B5B", textTransform: "uppercase" }}>SECTION 04 OF 09</span>
              <h2 style={{ fontSize: 28, fontWeight: 700, color: "#111111", margin: "6px 0 6px" }}>Technical Projects</h2>
              <p style={{ fontSize: 14, color: "#6B6B6B", margin: 0 }}>
                Every project becomes verifiable evidence for your Student DNA claims.
              </p>
            </div>

            {/* List of Projects */}
            {projects.length === 0 ? (
              <div style={{ backgroundColor: "#FFFFFF", border: "1px dashed #D6D3D1", borderRadius: 8, padding: 18, textAlign: "center", color: "#6B6B6B", fontSize: 13 }}>
                No projects added yet. Add at least one project below to establish technical depth.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {projects.map((p, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E7E5E4",
                      borderRadius: 8,
                      padding: "14px 16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#111111" }}>{p.title}</div>
                      <div style={{ fontSize: 12, color: "#176B5B", marginTop: 2 }}>Tech: {p.techStack.join(", ")}</div>
                      <div style={{ fontSize: 13, color: "#4B5563", marginTop: 6 }}>{p.description}</div>
                    </div>
                    <button
                      onClick={() => setProjects(projects.filter((_, i) => i !== idx))}
                      style={{ backgroundColor: "transparent", border: "none", color: "#991B1B", fontSize: 12, cursor: "pointer" }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Project Creator Form */}
            <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E7E5E4", borderRadius: 10, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#18181B", textTransform: "uppercase" }}>Add a Project</div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#18181B" }}>Project Title *</label>
                <input
                  type="text"
                  value={projTitle}
                  onChange={(e) => setProjTitle(e.target.value)}
                  placeholder="e.g. Distributed Task Queue"
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #E7E5E4", borderRadius: 6, marginTop: 4, fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#18181B" }}>Technologies Used (comma separated) *</label>
                <input
                  type="text"
                  value={projTech}
                  onChange={(e) => setProjTech(e.target.value)}
                  placeholder="e.g. Python, FastAPI, Redis, Docker"
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #E7E5E4", borderRadius: 6, marginTop: 4, fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#18181B" }}>Description & Problem Solved *</label>
                <textarea
                  rows={3}
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  placeholder="What did this project do? What technical challenges did you solve?"
                  style={{ width: "100%", padding: "8px 10px", border: "1px solid #E7E5E4", borderRadius: 6, marginTop: 4, fontSize: 13 }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#18181B" }}>GitHub URL</label>
                  <input
                    type="url"
                    value={projGithub}
                    onChange={(e) => setProjGithub(e.target.value)}
                    placeholder="https://github.com/..."
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid #E7E5E4", borderRadius: 6, marginTop: 4, fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#18181B" }}>Live URL (Optional)</label>
                  <input
                    type="url"
                    value={projLive}
                    onChange={(e) => setProjLive(e.target.value)}
                    placeholder="https://..."
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid #E7E5E4", borderRadius: 6, marginTop: 4, fontSize: 13 }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddProject}
                style={{
                  backgroundColor: "#18181B",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 6,
                  padding: "8px 16px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  alignSelf: "flex-start",
                  marginTop: 4,
                }}
              >
                + Add Project
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 5: EXPERIENCE ── */}
        {currentStep === 5 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#176B5B", textTransform: "uppercase" }}>SECTION 05 OF 09</span>
              <h2 style={{ fontSize: 28, fontWeight: 700, color: "#111111", margin: "6px 0 6px" }}>Experience & Internships</h2>
              <p style={{ fontSize: 14, color: "#6B6B6B", margin: 0 }}>Internships, research, open-source, or freelance roles.</p>
            </div>

            {experience.map((e, idx) => (
              <div key={idx} style={{ backgroundColor: "#FFFFFF", border: "1px solid #E7E5E4", borderRadius: 8, padding: 14, display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{e.role} @ {e.organization}</div>
                  <div style={{ fontSize: 12, color: "#6B6B6B" }}>{e.duration} • {e.type}</div>
                </div>
                <button onClick={() => setExperience(experience.filter((_, i) => i !== idx))} style={{ background: "none", border: "none", color: "#991B1B", cursor: "pointer", fontSize: 12 }}>
                  Remove
                </button>
              </div>
            ))}

            <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E7E5E4", borderRadius: 10, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#18181B", textTransform: "uppercase" }}>Add Work Experience</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>Organization</label>
                  <input type="text" value={expOrg} onChange={(e) => setExpOrg(e.target.value)} placeholder="Company / Lab Name" style={{ width: "100%", padding: "8px 10px", border: "1px solid #E7E5E4", borderRadius: 6, marginTop: 4, fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>Role</label>
                  <input type="text" value={expRole} onChange={(e) => setExpRole(e.target.value)} placeholder="SWE Intern / Contributor" style={{ width: "100%", padding: "8px 10px", border: "1px solid #E7E5E4", borderRadius: 6, marginTop: 4, fontSize: 13 }} />
                </div>
              </div>
              <button type="button" onClick={handleAddExperience} style={{ backgroundColor: "#18181B", color: "#FFFFFF", border: "none", borderRadius: 6, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", alignSelf: "flex-start" }}>
                + Add Experience
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 6: ACHIEVEMENTS ── */}
        {currentStep === 6 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#176B5B", textTransform: "uppercase" }}>SECTION 06 OF 09</span>
              <h2 style={{ fontSize: 28, fontWeight: 700, color: "#111111", margin: "6px 0 6px" }}>Achievements & Hackathons</h2>
              <p style={{ fontSize: 14, color: "#6B6B6B", margin: 0 }}>Add competitive placements, hackathons, or publications.</p>
            </div>

            {achievements.map((a, idx) => (
              <div key={idx} style={{ backgroundColor: "#FFFFFF", border: "1px solid #E7E5E4", borderRadius: 8, padding: 12, display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{a.title} ({a.type})</div>
                  <div style={{ fontSize: 12, color: "#6B6B6B" }}>{a.description}</div>
                </div>
                <button onClick={() => setAchievements(achievements.filter((_, i) => i !== idx))} style={{ background: "none", border: "none", color: "#991B1B", cursor: "pointer", fontSize: 12 }}>
                  Remove
                </button>
              </div>
            ))}

            <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E7E5E4", borderRadius: 10, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Add Achievement</div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Title / Contest Name</label>
                <input type="text" value={achTitle} onChange={(e) => setAchTitle(e.target.value)} placeholder="e.g. Smart India Hackathon Finalist" style={{ width: "100%", padding: "8px 10px", border: "1px solid #E7E5E4", borderRadius: 6, marginTop: 4, fontSize: 13 }} />
              </div>
              <button type="button" onClick={handleAddAchievement} style={{ backgroundColor: "#18181B", color: "#FFFFFF", border: "none", borderRadius: 6, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", alignSelf: "flex-start" }}>
                + Add Achievement
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 7: CERTIFICATIONS ── */}
        {currentStep === 7 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#176B5B", textTransform: "uppercase" }}>SECTION 07 OF 09</span>
              <h2 style={{ fontSize: 28, fontWeight: 700, color: "#111111", margin: "6px 0 6px" }}>Certifications</h2>
              <p style={{ fontSize: 14, color: "#6B6B6B", margin: 0 }}>AWS, Google Cloud, DeepLearning.AI, or other credentials.</p>
            </div>

            {certifications.map((c, idx) => (
              <div key={idx} style={{ backgroundColor: "#FFFFFF", border: "1px solid #E7E5E4", borderRadius: 8, padding: 12, display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{c.title}</div>
                  <div style={{ fontSize: 12, color: "#6B6B6B" }}>Issuer: {c.issuer}</div>
                </div>
                <button onClick={() => setCertifications(certifications.filter((_, i) => i !== idx))} style={{ background: "none", border: "none", color: "#991B1B", cursor: "pointer", fontSize: 12 }}>
                  Remove
                </button>
              </div>
            ))}

            <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E7E5E4", borderRadius: 10, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Add Certification</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>Certificate Name</label>
                  <input type="text" value={certTitle} onChange={(e) => setCertTitle(e.target.value)} placeholder="AWS Certified Solutions Architect" style={{ width: "100%", padding: "8px 10px", border: "1px solid #E7E5E4", borderRadius: 6, marginTop: 4, fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>Issuing Body</label>
                  <input type="text" value={certIssuer} onChange={(e) => setCertIssuer(e.target.value)} placeholder="Amazon Web Services" style={{ width: "100%", padding: "8px 10px", border: "1px solid #E7E5E4", borderRadius: 6, marginTop: 4, fontSize: 13 }} />
                </div>
              </div>
              <button type="button" onClick={handleAddCertification} style={{ backgroundColor: "#18181B", color: "#FFFFFF", border: "none", borderRadius: 6, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", alignSelf: "flex-start" }}>
                + Add Certification
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 8: CAREER GOALS ── */}
        {currentStep === 8 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#176B5B", textTransform: "uppercase" }}>SECTION 08 OF 09</span>
              <h2 style={{ fontSize: 28, fontWeight: 700, color: "#111111", margin: "6px 0 6px" }}>Career Interests & Goals</h2>
              <p style={{ fontSize: 14, color: "#6B6B6B", margin: 0 }}>Configure matching parameters for opportunities and interviews.</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Target Engineering Roles</label>
                <input
                  type="text"
                  value={targetRoles.join(", ")}
                  onChange={(e) => setTargetRoles(e.target.value.split(",").map(r => r.trim()).filter(Boolean))}
                  placeholder="Software Engineer, Backend Developer, Systems Engineer"
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #E7E5E4", borderRadius: 8, marginTop: 6, fontSize: 14 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Target Companies</label>
                <input
                  type="text"
                  value={targetCompanies.join(", ")}
                  onChange={(e) => setTargetCompanies(e.target.value.split(",").map(c => c.trim()).filter(Boolean))}
                  placeholder="Stripe, Google, Datadog, Razorpay"
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #E7E5E4", borderRadius: 8, marginTop: 6, fontSize: 14 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Primary Career Goal</label>
                <textarea
                  rows={3}
                  value={careerGoals}
                  onChange={(e) => setCareerGoals(e.target.value)}
                  placeholder="e.g. Seeking backend infrastructure engineering role building high-concurrency distributed systems."
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #E7E5E4", borderRadius: 8, marginTop: 6, fontSize: 14 }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 9: RESUME UPLOAD & REVIEW ── */}
        {currentStep === 9 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#176B5B", textTransform: "uppercase" }}>SECTION 09 OF 09</span>
              <h2 style={{ fontSize: 28, fontWeight: 700, color: "#111111", margin: "6px 0 6px" }}>Resume & Profile Review</h2>
              <p style={{ fontSize: 14, color: "#6B6B6B", margin: 0 }}>Review your inputs before generating your personal Student DNA.</p>
            </div>

            {/* Resume Upload Box */}
            <div style={{ backgroundColor: "#FFFFFF", border: "1px dashed #D6D3D1", borderRadius: 10, padding: 24, textAlign: "center" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>📄</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111111" }}>
                {resumeUploaded ? `Selected: ${resumeFileName}` : "Upload Your Resume"}
              </div>
              <div style={{ fontSize: 12, color: "#6B6B6B", marginTop: 4, marginBottom: 16 }}>
                PDF or Word Document (Max 10MB)
              </div>
              <label
                style={{
                  backgroundColor: "#18181B",
                  color: "#FFFFFF",
                  padding: "8px 16px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Choose File
                <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeFileChange} style={{ display: "none" }} />
              </label>
            </div>

            {/* Review Card */}
            <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #E7E5E4", borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#18181B", textTransform: "uppercase", marginBottom: 12 }}>
                Profile Summary for {fullName || "Candidate"}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13 }}>
                <div>• College: <strong>{college || "Not set"}</strong></div>
                <div>• Degree: <strong>{degree} in {branch}</strong></div>
                <div>• Skills Added: <strong>{skills.length} skills</strong></div>
                <div>• Projects Documented: <strong>{projects.length} projects</strong></div>
                <div>• Experience Entries: <strong>{experience.length} entries</strong></div>
                <div>• Target Roles: <strong>{targetRoles.join(", ")}</strong></div>
              </div>
            </div>
          </div>
        )}

        {/* ── NAVIGATION CONTROLS (PREV / NEXT) ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 20, borderTop: "1px solid #E7E5E4" }}>
          <button
            type="button"
            disabled={currentStep === 1}
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            style={{
              backgroundColor: "transparent",
              color: currentStep === 1 ? "#D6D3D1" : "#18181B",
              border: "1px solid #E7E5E4",
              borderRadius: 6,
              padding: "10px 18px",
              fontSize: 13,
              fontWeight: 600,
              cursor: currentStep === 1 ? "not-allowed" : "pointer",
            }}
          >
            ← Previous
          </button>

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={() => {
                if (currentStep === 1 && !fullName.trim()) {
                  setError("Please enter your full name.");
                  return;
                }
                setError(null);
                setCurrentStep(currentStep + 1);
              }}
              style={{
                backgroundColor: "#18181B",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 6,
                padding: "10px 22px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
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
                backgroundColor: "#176B5B",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 6,
                padding: "10px 24px",
                fontSize: 13,
                fontWeight: 600,
                cursor: loading ? "wait" : "pointer",
              }}
            >
              {loading ? "Generating Student DNA..." : "Generate My Student DNA ➔"}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
