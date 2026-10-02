"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppNav from "@/components/AppNav";

type ProfileTab =
  | "basic"
  | "academic"
  | "skills"
  | "projects"
  | "experience"
  | "achievements"
  | "certifications"
  | "career"
  | "links";

export default function StudentProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ProfileTab>("basic");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Section 1: Basic Information
  const [basicInfo, setBasicInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
  });

  // Section 2: Academic Information
  const [academicInfo, setAcademicInfo] = useState({
    college: "",
    degree: "",
    branch: "",
    year: "",
    graduationYear: "",
    cgpa: "",
  });

  // Section 3: Technical Skills
  const [skillsList, setSkillsList] = useState<
    Array<{ name: string; level: string; evidence?: string }>
  >([]);
  const [newSkill, setNewSkill] = useState({ name: "", level: "Intermediate", evidence: "" });

  // Section 4: Projects
  const [projectsList, setProjectsList] = useState<
    Array<{
      name: string;
      description: string;
      techStack: string[];
      githubUrl?: string;
      liveUrl?: string;
      duration?: string;
    }>
  >([]);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    techStack: "",
    githubUrl: "",
    liveUrl: "",
    duration: "",
  });

  // Section 5: Experience
  const [experienceList, setExperienceList] = useState<
    Array<{
      organization: string;
      role: string;
      duration: string;
      responsibilities: string;
      technologies?: string;
    }>
  >([]);
  const [newExp, setNewExp] = useState({
    organization: "",
    role: "",
    duration: "",
    responsibilities: "",
    technologies: "",
  });

  // Section 6: Achievements
  const [achievementsList, setAchievementsList] = useState<
    Array<{ title: string; organization?: string; description?: string }>
  >([]);
  const [newAch, setNewAch] = useState({ title: "", organization: "", description: "" });

  // Section 7: Certifications
  const [certificationsList, setCertificationsList] = useState<
    Array<{ name: string; issuer: string; date?: string; credentialUrl?: string }>
  >([]);
  const [newCert, setNewCert] = useState({ name: "", issuer: "", date: "", credentialUrl: "" });

  // Section 8: Career Goals & Interests
  const [careerGoals, setCareerGoals] = useState({
    targetRoles: [] as string[],
    preferredDomains: [] as string[],
    targetCompanies: [] as string[],
    preferredLocations: [] as string[],
  });
  const [targetRoleInput, setTargetRoleInput] = useState("");
  const [domainInput, setDomainInput] = useState("");
  const [companyInput, setCompanyInput] = useState("");

  // Section 9: Links & Preferences
  const [linksInfo, setLinksInfo] = useState({
    githubUrl: "",
    linkedinUrl: "",
    portfolioUrl: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/student/profile");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (data.profile) {
        const p = data.profile;
        setBasicInfo({
          fullName: p.fullName || "",
          email: p.email || "",
          phone: p.phone || "",
          location: p.location || "",
          bio: p.bio || "",
        });
        setAcademicInfo({
          college: p.college || "",
          degree: p.degree || "",
          branch: p.branch || "",
          year: p.year || "",
          graduationYear: p.graduationYear || "",
          cgpa: p.cgpa || "",
        });
        setSkillsList(
          Array.isArray(p.skills)
            ? p.skills.map((s: any) =>
                typeof s === "string" ? { name: s, level: "Intermediate" } : s
              )
            : []
        );
        setProjectsList(
          Array.isArray(p.projects)
            ? p.projects.map((proj: any) => ({
                name: proj.name || proj.title || "",
                description: proj.description || "",
                techStack: Array.isArray(proj.techStack)
                  ? proj.techStack
                  : Array.isArray(proj.tech_stack)
                  ? proj.tech_stack
                  : [],
                githubUrl: proj.githubUrl || proj.github_url || "",
                liveUrl: proj.liveUrl || proj.live_url || "",
                duration: proj.duration || "",
              }))
            : []
        );
        setExperienceList(
          Array.isArray(p.experience)
            ? p.experience.map((exp: any) => ({
                organization: exp.organization || exp.company || "",
                role: exp.role || "",
                duration: exp.duration || "",
                responsibilities: exp.responsibilities || exp.details || "",
                technologies: exp.technologies || "",
              }))
            : []
        );
        setAchievementsList(
          Array.isArray(p.achievements)
            ? p.achievements.map((a: any) =>
                typeof a === "string" ? { title: a } : a
              )
            : []
        );
        setCertificationsList(
          Array.isArray(p.certifications)
            ? p.certifications.map((c: any) =>
                typeof c === "string" ? { name: c, issuer: "Certified" } : c
              )
            : []
        );
        setCareerGoals({
          targetRoles: p.careerGoals?.targetRoles || [],
          preferredDomains: p.careerGoals?.preferredDomains || [],
          targetCompanies: p.careerGoals?.targetCompanies || [],
          preferredLocations: p.careerGoals?.preferredLocations || [],
        });
        setLinksInfo({
          githubUrl: p.githubUrl || "",
          linkedinUrl: p.linkedinUrl || "",
          portfolioUrl: p.portfolioUrl || "",
        });
      }
    } catch (err: any) {
      console.error("Failed to load profile:", err);
      setErrorMessage("Could not load your profile data.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMessage("");
    try {
      const payload = {
        fullName: basicInfo.fullName,
        email: basicInfo.email,
        phone: basicInfo.phone,
        location: basicInfo.location,
        bio: basicInfo.bio,
        college: academicInfo.college,
        degree: academicInfo.degree,
        branch: academicInfo.branch,
        year: academicInfo.year,
        graduationYear: academicInfo.graduationYear,
        cgpa: academicInfo.cgpa,
        skills: skillsList,
        projects: projectsList,
        experience: experienceList,
        achievements: achievementsList,
        certifications: certificationsList,
        careerGoals,
        githubUrl: linksInfo.githubUrl,
        linkedinUrl: linksInfo.linkedinUrl,
        portfolioUrl: linksInfo.portfolioUrl,
        profileCompleted: true,
      };

      const res = await fetch("/api/student/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update profile.");
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err: any) {
      console.error("Save error:", err);
      setErrorMessage(err.message || "Failed to save profile changes.");
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (!newSkill.name.trim()) return;
    setSkillsList([...skillsList, { ...newSkill, name: newSkill.name.trim() }]);
    setNewSkill({ name: "", level: "Intermediate", evidence: "" });
  };

  const removeSkill = (index: number) => {
    setSkillsList(skillsList.filter((_, idx) => idx !== index));
  };

  const addProject = () => {
    if (!newProject.name.trim()) return;
    const stack = newProject.techStack
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    setProjectsList([
      ...projectsList,
      {
        name: newProject.name.trim(),
        description: newProject.description.trim(),
        techStack: stack,
        githubUrl: newProject.githubUrl.trim(),
        liveUrl: newProject.liveUrl.trim(),
        duration: newProject.duration.trim(),
      },
    ]);
    setNewProject({ name: "", description: "", techStack: "", githubUrl: "", liveUrl: "", duration: "" });
  };

  const removeProject = (index: number) => {
    setProjectsList(projectsList.filter((_, idx) => idx !== index));
  };

  const addExperience = () => {
    if (!newExp.organization.trim() || !newExp.role.trim()) return;
    setExperienceList([...experienceList, { ...newExp }]);
    setNewExp({ organization: "", role: "", duration: "", responsibilities: "", technologies: "" });
  };

  const removeExperience = (index: number) => {
    setExperienceList(experienceList.filter((_, idx) => idx !== index));
  };

  const addAchievement = () => {
    if (!newAch.title.trim()) return;
    setAchievementsList([...achievementsList, { ...newAch }]);
    setNewAch({ title: "", organization: "", description: "" });
  };

  const removeAchievement = (index: number) => {
    setAchievementsList(achievementsList.filter((_, idx) => idx !== index));
  };

  const addCertification = () => {
    if (!newCert.name.trim()) return;
    setCertificationsList([...certificationsList, { ...newCert }]);
    setNewCert({ name: "", issuer: "", date: "", credentialUrl: "" });
  };

  const removeCertification = (index: number) => {
    setCertificationsList(certificationsList.filter((_, idx) => idx !== index));
  };

  const addTargetRole = () => {
    if (!targetRoleInput.trim()) return;
    if (!careerGoals.targetRoles.includes(targetRoleInput.trim())) {
      setCareerGoals({
        ...careerGoals,
        targetRoles: [...careerGoals.targetRoles, targetRoleInput.trim()],
      });
    }
    setTargetRoleInput("");
  };

  const removeTargetRole = (role: string) => {
    setCareerGoals({
      ...careerGoals,
      targetRoles: careerGoals.targetRoles.filter((r) => r !== role),
    });
  };

  const addDomain = () => {
    if (!domainInput.trim()) return;
    if (!careerGoals.preferredDomains.includes(domainInput.trim())) {
      setCareerGoals({
        ...careerGoals,
        preferredDomains: [...careerGoals.preferredDomains, domainInput.trim()],
      });
    }
    setDomainInput("");
  };

  const removeDomain = (domain: string) => {
    setCareerGoals({
      ...careerGoals,
      preferredDomains: careerGoals.preferredDomains.filter((d) => d !== domain),
    });
  };

  const addCompany = () => {
    if (!companyInput.trim()) return;
    if (!careerGoals.targetCompanies.includes(companyInput.trim())) {
      setCareerGoals({
        ...careerGoals,
        targetCompanies: [...careerGoals.targetCompanies, companyInput.trim()],
      });
    }
    setCompanyInput("");
  };

  const removeCompany = (company: string) => {
    setCareerGoals({
      ...careerGoals,
      targetCompanies: careerGoals.targetCompanies.filter((c) => c !== company),
    });
  };

  const tabs: Array<{ id: ProfileTab; label: string; icon: string }> = [
    { id: "basic", label: "Basic Information", icon: "👤" },
    { id: "academic", label: "Education & Academics", icon: "🎓" },
    { id: "skills", label: "Technical Skills", icon: "⚡" },
    { id: "projects", label: "Projects", icon: "💻" },
    { id: "experience", label: "Experience", icon: "💼" },
    { id: "achievements", label: "Achievements", icon: "🏆" },
    { id: "certifications", label: "Certifications", icon: "📜" },
    { id: "career", label: "Career Goals & Interests", icon: "🎯" },
    { id: "links", label: "Links & Socials", icon: "🔗" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F6F5F1",
        color: "#17191C",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <AppNav role="student" />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 80px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 28,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                backgroundColor: "#EFF4FE",
                border: "1px solid #D2E0FB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                color: "#356AE6",
                boxShadow: "0 1px 3px rgba(16, 24, 40, 0.04)"
              }}
            >
              👤
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: "#162A43", margin: 0, letterSpacing: "-0.4px" }}>
                  {basicInfo.fullName || (loading ? "Loading..." : "Student Profile")}
                </h1>
                <span
                  style={{
                    fontSize: 10,
                    padding: "2px 8px",
                    borderRadius: 5,
                    backgroundColor: "#EAF4EE",
                    color: "#2E7D5B",
                    border: "1px solid #C8E4D3",
                    fontWeight: 700,
                  }}
                >
                  ✓ VERIFIED PROFILE
                </span>
              </div>
              <div style={{ fontSize: 13, color: "#667085", marginTop: 4 }}>
                {academicInfo.degree && academicInfo.branch
                  ? `${academicInfo.degree} in ${academicInfo.branch}`
                  : "Comprehensive Academic & Technical Candidate Profile"}
                {academicInfo.college ? ` • ${academicInfo.college}` : ""}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {savedSuccess && (
              <span style={{ fontSize: 12, color: "#2E7D5B", fontWeight: 600 }}>
                ✓ Profile saved successfully
              </span>
            )}
            {errorMessage && (
              <span style={{ fontSize: 12, color: "#C24141", fontWeight: 600 }}>
                {errorMessage}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: "8px 20px",
                backgroundColor: "#356AE6",
                border: "none",
                borderRadius: 7,
                color: "white",
                fontSize: 13,
                fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
                boxShadow: "0 2px 6px rgba(53, 106, 230, 0.2)",
                transition: "all 0.15s ease",
              }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <Link
              href="/student/dna"
              style={{
                padding: "8px 16px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E4E1DA",
                borderRadius: 7,
                color: "#162A43",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                boxShadow: "0 1px 2px rgba(16, 24, 40, 0.04)"
              }}
            >
              View Student DNA ↗
            </Link>
          </div>
        </div>

        {/* Tabbed Layout: Left Clean Tabs, Right Content */}
        <div style={{ display: "grid", gridTemplateColumns: "250px 1fr", gap: 24, alignItems: "flex-start" }}>
          {/* Tabs Sidebar */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E4E1DA",
              borderRadius: 10,
              padding: 8,
              display: "flex",
              flexDirection: "column",
              gap: 4,
              boxShadow: "0 1px 3px rgba(16, 24, 40, 0.04)"
            }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: 7,
                  border: "none",
                  backgroundColor: activeTab === tab.id ? "#EFF4FE" : "transparent",
                  color: activeTab === tab.id ? "#356AE6" : "#667085",
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  fontSize: 13,
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.12s ease",
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content Panel */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E4E1DA",
              borderRadius: 10,
              padding: "24px 28px",
              boxShadow: "0 1px 3px rgba(16, 24, 40, 0.04)"
            }}
          >
            {/* 1. Basic Information */}
            {activeTab === "basic" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#162A43", margin: "0 0 8px" }}>
                  Basic Information
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#667085", marginBottom: 6, letterSpacing: 0.5 }}>
                      FULL NAME
                    </label>
                    <input
                      type="text"
                      value={basicInfo.fullName}
                      onChange={(e) => setBasicInfo({ ...basicInfo, fullName: e.target.value })}
                      placeholder="e.g. Rahul Sharma"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E4E1DA",
                        borderRadius: 7,
                        color: "#17191C",
                        fontSize: 13,
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#667085", marginBottom: 6, letterSpacing: 0.5 }}>
                      EMAIL ADDRESS
                    </label>
                    <input
                      type="email"
                      value={basicInfo.email}
                      disabled
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        backgroundColor: "#F6F5F1",
                        border: "1px solid #E4E1DA",
                        borderRadius: 7,
                        color: "#667085",
                        fontSize: 13,
                        outline: "none",
                        cursor: "not-allowed",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#667085", marginBottom: 6, letterSpacing: 0.5 }}>
                      PHONE NUMBER
                    </label>
                    <input
                      type="text"
                      value={basicInfo.phone}
                      onChange={(e) => setBasicInfo({ ...basicInfo, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E4E1DA",
                        borderRadius: 7,
                        color: "#17191C",
                        fontSize: 13,
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#667085", marginBottom: 6, letterSpacing: 0.5 }}>
                      LOCATION
                    </label>
                    <input
                      type="text"
                      value={basicInfo.location}
                      onChange={(e) => setBasicInfo({ ...basicInfo, location: e.target.value })}
                      placeholder="Bengaluru, Karnataka, India"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E4E1DA",
                        borderRadius: 7,
                        color: "#17191C",
                        fontSize: 13,
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#667085", marginBottom: 6, letterSpacing: 0.5 }}>
                    PROFESSIONAL BIO
                  </label>
                  <textarea
                    rows={3}
                    value={basicInfo.bio}
                    onChange={(e) => setBasicInfo({ ...basicInfo, bio: e.target.value })}
                    placeholder="Brief description of your background, engineering passions, and career focus..."
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E4E1DA",
                      borderRadius: 7,
                      color: "#17191C",
                      fontSize: 13,
                      outline: "none",
                      resize: "vertical",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
              </div>
            )}

            {/* 2. Academic Information */}
            {activeTab === "academic" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#162A43", margin: "0 0 8px" }}>
                  Education &amp; Academics
                </h2>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#667085", marginBottom: 6, letterSpacing: 0.5 }}>
                    COLLEGE / UNIVERSITY
                  </label>
                  <input
                    type="text"
                    value={academicInfo.college}
                    onChange={(e) => setAcademicInfo({ ...academicInfo, college: e.target.value })}
                    placeholder="e.g. Indian Institute of Technology Bombay"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E4E1DA",
                      borderRadius: 7,
                      color: "#17191C",
                      fontSize: 13,
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#667085", marginBottom: 6, letterSpacing: 0.5 }}>
                      DEGREE
                    </label>
                    <input
                      type="text"
                      value={academicInfo.degree}
                      onChange={(e) => setAcademicInfo({ ...academicInfo, degree: e.target.value })}
                      placeholder="e.g. B.Tech / B.E."
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E4E1DA",
                        borderRadius: 7,
                        color: "#17191C",
                        fontSize: 13,
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#667085", marginBottom: 6, letterSpacing: 0.5 }}>
                      BRANCH / MAJOR
                    </label>
                    <input
                      type="text"
                      value={academicInfo.branch}
                      onChange={(e) => setAcademicInfo({ ...academicInfo, branch: e.target.value })}
                      placeholder="e.g. Computer Science & Engineering"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E4E1DA",
                        borderRadius: 7,
                        color: "#17191C",
                        fontSize: 13,
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#667085", marginBottom: 6, letterSpacing: 0.5 }}>
                      GRADUATION YEAR
                    </label>
                    <input
                      type="text"
                      value={academicInfo.graduationYear}
                      onChange={(e) => setAcademicInfo({ ...academicInfo, graduationYear: e.target.value })}
                      placeholder="e.g. 2026"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E4E1DA",
                        borderRadius: 7,
                        color: "#17191C",
                        fontSize: 13,
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#667085", marginBottom: 6, letterSpacing: 0.5 }}>
                      CGPA / PERCENTAGE
                    </label>
                    <input
                      type="text"
                      value={academicInfo.cgpa}
                      onChange={(e) => setAcademicInfo({ ...academicInfo, cgpa: e.target.value })}
                      placeholder="e.g. 8.9 / 10"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E4E1DA",
                        borderRadius: 7,
                        color: "#17191C",
                        fontSize: 13,
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. Technical Skills */}
            {activeTab === "skills" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#162A43", margin: 0 }}>
                  Technical Skills &amp; Competencies
                </h2>
                <p style={{ fontSize: 12, color: "#667085", margin: 0 }}>
                  Add your programming languages, frameworks, databases, and cloud tools.
                </p>

                {/* Add new skill inline */}
                <div
                  style={{
                    padding: "14px",
                    backgroundColor: "#F6F5F1",
                    border: "1px solid #E4E1DA",
                    borderRadius: 8,
                    display: "grid",
                    gridTemplateColumns: "1fr 140px 1fr auto",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Skill name (e.g. Python, React, Go)"
                    value={newSkill.name}
                    onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                    style={{
                      padding: "8px 10px",
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E4E1DA",
                      borderRadius: 6,
                      color: "#17191C",
                      fontSize: 12,
                      outline: "none",
                    }}
                  />
                  <select
                    value={newSkill.level}
                    onChange={(e) => setNewSkill({ ...newSkill, level: e.target.value })}
                    style={{
                      padding: "8px 10px",
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E4E1DA",
                      borderRadius: 6,
                      color: "#17191C",
                      fontSize: 12,
                      outline: "none",
                    }}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Evidence note (e.g. Used in 2 microservices)"
                    value={newSkill.evidence}
                    onChange={(e) => setNewSkill({ ...newSkill, evidence: e.target.value })}
                    style={{
                      padding: "8px 10px",
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E4E1DA",
                      borderRadius: 6,
                      color: "#17191C",
                      fontSize: 12,
                      outline: "none",
                    }}
                  />
                  <button
                    onClick={addSkill}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#356AE6",
                      border: "none",
                      borderRadius: 6,
                      color: "white",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    + Add
                  </button>
                </div>

                {/* Skills List */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                  {skillsList.length === 0 ? (
                    <div style={{ padding: "24px", textAlign: "center", color: "#667085", fontSize: 13, backgroundColor: "#F6F5F1", borderRadius: 8, border: "1px dashed #E4E1DA" }}>
                      No skills added yet. Add your core languages and frameworks above.
                    </div>
                  ) : (
                    skillsList.map((skill, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 14px",
                          backgroundColor: "#FFFFFF",
                          border: "1px solid #E4E1DA",
                          borderRadius: 8,
                          boxShadow: "0 1px 2px rgba(16, 24, 40, 0.02)"
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#162A43" }}>
                            {skill.name}
                          </div>
                          {skill.evidence && (
                            <div style={{ fontSize: 11, color: "#667085", marginTop: 2 }}>
                              {skill.evidence}
                            </div>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span
                            style={{
                              fontSize: 11,
                              padding: "2px 8px",
                              backgroundColor: "#EFF4FE",
                              color: "#356AE6",
                              border: "1px solid #D2E0FB",
                              borderRadius: 4,
                              fontWeight: 600,
                            }}
                          >
                            {skill.level}
                          </span>
                          <button
                            onClick={() => removeSkill(idx)}
                            style={{
                              backgroundColor: "#FDF2F2",
                              border: "1px solid #F8C8C8",
                              color: "#C24141",
                              fontSize: 12,
                              borderRadius: 5,
                              cursor: "pointer",
                              padding: "3px 8px",
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 4. Projects */}
            {activeTab === "projects" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#162A43", margin: 0 }}>
                  Projects &amp; Code Evidence
                </h2>
                <p style={{ fontSize: 12, color: "#667085", margin: 0 }}>
                  Real projects provide the strongest evidence for your Student DNA.
                </p>

                {/* Add project form */}
                <div
                  style={{
                    padding: "16px",
                    backgroundColor: "#F6F5F1",
                    border: "1px solid #E4E1DA",
                    borderRadius: 8,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <input
                      type="text"
                      placeholder="Project Name *"
                      value={newProject.name}
                      onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                      style={{
                        padding: "8px 10px",
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E4E1DA",
                        borderRadius: 6,
                        color: "#17191C",
                        fontSize: 12,
                        outline: "none",
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Technologies (comma-separated, e.g. React, Python, PostgreSQL)"
                      value={newProject.techStack}
                      onChange={(e) => setNewProject({ ...newProject, techStack: e.target.value })}
                      style={{
                        padding: "8px 10px",
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E4E1DA",
                        borderRadius: 6,
                        color: "#17191C",
                        fontSize: 12,
                        outline: "none",
                      }}
                    />
                  </div>

                  <textarea
                    rows={2}
                    placeholder="Description of what you built and the technical problem solved..."
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    style={{
                      padding: "8px 10px",
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E4E1DA",
                      borderRadius: 6,
                      color: "#17191C",
                      fontSize: 12,
                      outline: "none",
                      resize: "vertical",
                    }}
                  />

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "center" }}>
                    <input
                      type="url"
                      placeholder="GitHub URL (optional)"
                      value={newProject.githubUrl}
                      onChange={(e) => setNewProject({ ...newProject, githubUrl: e.target.value })}
                      style={{
                        padding: "8px 10px",
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E4E1DA",
                        borderRadius: 6,
                        color: "#17191C",
                        fontSize: 12,
                        outline: "none",
                      }}
                    />
                    <input
                      type="url"
                      placeholder="Live Demo URL (optional)"
                      value={newProject.liveUrl}
                      onChange={(e) => setNewProject({ ...newProject, liveUrl: e.target.value })}
                      style={{
                        padding: "8px 10px",
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E4E1DA",
                        borderRadius: 6,
                        color: "#17191C",
                        fontSize: 12,
                        outline: "none",
                      }}
                    />
                    <button
                      onClick={addProject}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#356AE6",
                        border: "none",
                        borderRadius: 6,
                        color: "white",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      + Add Project
                    </button>
                  </div>
                </div>

                {/* Projects List */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {projectsList.length === 0 ? (
                    <div style={{ padding: "24px", textAlign: "center", color: "#667085", fontSize: 13, backgroundColor: "#F6F5F1", borderRadius: 8, border: "1px dashed #E4E1DA" }}>
                      No projects added yet. Add a project above to provide proof of your engineering skills.
                    </div>
                  ) : (
                    projectsList.map((p, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: "14px 16px",
                          backgroundColor: "#FFFFFF",
                          border: "1px solid #E4E1DA",
                          borderRadius: 8,
                          boxShadow: "0 1px 2px rgba(16, 24, 40, 0.02)"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#162A43" }}>{p.name}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            {p.githubUrl && (
                              <a
                                href={p.githubUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{ fontSize: 11, color: "#356AE6", textDecoration: "none", fontWeight: 600 }}
                              >
                                GitHub ↗
                              </a>
                            )}
                            <button
                              onClick={() => removeProject(idx)}
                              style={{
                                backgroundColor: "#FDF2F2",
                                border: "1px solid #F8C8C8",
                                color: "#C24141",
                                fontSize: 12,
                                borderRadius: 5,
                                cursor: "pointer",
                                padding: "3px 8px",
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                        {p.techStack && p.techStack.length > 0 && (
                          <div style={{ fontSize: 11, color: "#356AE6", fontWeight: 600, marginBottom: 6 }}>
                            {p.techStack.join(" • ")}
                          </div>
                        )}
                        <div style={{ fontSize: 12, color: "#667085", lineHeight: 1.4 }}>
                          {p.description}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 5. Experience */}
            {activeTab === "experience" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#162A43", margin: "0 0 8px" }}>
                  Work &amp; Practical Experience
                </h2>
                <div
                  style={{
                    padding: "16px",
                    backgroundColor: "#F6F5F1",
                    border: "1px solid #E4E1DA",
                    borderRadius: 8,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    <input
                      type="text"
                      placeholder="Organization / Company *"
                      value={newExp.organization}
                      onChange={(e) => setNewExp({ ...newExp, organization: e.target.value })}
                      style={{ padding: "8px 10px", backgroundColor: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 6, color: "#17191C", fontSize: 12, outline: "none" }}
                    />
                    <input
                      type="text"
                      placeholder="Role (e.g. SDE Intern) *"
                      value={newExp.role}
                      onChange={(e) => setNewExp({ ...newExp, role: e.target.value })}
                      style={{ padding: "8px 10px", backgroundColor: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 6, color: "#17191C", fontSize: 12, outline: "none" }}
                    />
                    <input
                      type="text"
                      placeholder="Duration (e.g. May 2025 - July 2025)"
                      value={newExp.duration}
                      onChange={(e) => setNewExp({ ...newExp, duration: e.target.value })}
                      style={{ padding: "8px 10px", backgroundColor: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 6, color: "#17191C", fontSize: 12, outline: "none" }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <textarea
                      rows={2}
                      placeholder="Key responsibilities and technical contributions..."
                      value={newExp.responsibilities}
                      onChange={(e) => setNewExp({ ...newExp, responsibilities: e.target.value })}
                      style={{ flex: 1, padding: "8px 10px", backgroundColor: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 6, color: "#17191C", fontSize: 12, resize: "vertical", outline: "none" }}
                    />
                    <button
                      onClick={addExperience}
                      style={{ padding: "8px 16px", backgroundColor: "#356AE6", border: "none", borderRadius: 6, color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                    >
                      + Add
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {experienceList.length === 0 ? (
                    <div style={{ padding: "24px", textAlign: "center", color: "#667085", fontSize: 13, backgroundColor: "#F6F5F1", borderRadius: 8, border: "1px dashed #E4E1DA" }}>
                      No experience added yet. (Internships, research, open source, or freelance).
                    </div>
                  ) : (
                    experienceList.map((exp, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: "14px 16px",
                          backgroundColor: "#FFFFFF",
                          border: "1px solid #E4E1DA",
                          borderRadius: 8,
                          boxShadow: "0 1px 2px rgba(16, 24, 40, 0.02)"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#162A43" }}>{exp.role}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 11, color: "#B7791F", fontWeight: 600 }}>{exp.duration}</span>
                            <button
                              onClick={() => removeExperience(idx)}
                              style={{
                                backgroundColor: "#FDF2F2",
                                border: "1px solid #F8C8C8",
                                color: "#C24141",
                                fontSize: 12,
                                borderRadius: 5,
                                cursor: "pointer",
                                padding: "3px 8px",
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                        <div style={{ fontSize: 12, color: "#356AE6", fontWeight: 600, marginBottom: 6 }}>
                          {exp.organization}
                        </div>
                        <div style={{ fontSize: 12, color: "#667085", lineHeight: 1.4 }}>
                          {exp.responsibilities}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 6. Achievements */}
            {activeTab === "achievements" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#162A43", margin: "0 0 8px" }}>
                  Achievements &amp; Honors
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, padding: 14, backgroundColor: "#F6F5F1", borderRadius: 8, border: "1px solid #E4E1DA" }}>
                  <input
                    type="text"
                    placeholder="Achievement Title (e.g. Smart India Hackathon Finalist)"
                    value={newAch.title}
                    onChange={(e) => setNewAch({ ...newAch, title: e.target.value })}
                    style={{ padding: "8px 10px", backgroundColor: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 6, color: "#17191C", fontSize: 12, outline: "none" }}
                  />
                  <input
                    type="text"
                    placeholder="Awarding Body / Organization"
                    value={newAch.organization}
                    onChange={(e) => setNewAch({ ...newAch, organization: e.target.value })}
                    style={{ padding: "8px 10px", backgroundColor: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 6, color: "#17191C", fontSize: 12, outline: "none" }}
                  />
                  <button
                    onClick={addAchievement}
                    style={{ padding: "8px 16px", backgroundColor: "#356AE6", border: "none", borderRadius: 6, color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                  >
                    + Add
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {achievementsList.length === 0 ? (
                    <div style={{ padding: "24px", textAlign: "center", color: "#667085", fontSize: 13, backgroundColor: "#F6F5F1", borderRadius: 8, border: "1px dashed #E4E1DA" }}>
                      No achievements recorded yet. Add hackathon rankings, competitive programming medals, or awards.
                    </div>
                  ) : (
                    achievementsList.map((a, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "10px 14px",
                          backgroundColor: "#FFFFFF",
                          border: "1px solid #E4E1DA",
                          borderRadius: 8,
                          boxShadow: "0 1px 2px rgba(16, 24, 40, 0.02)"
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#162A43" }}>{a.title}</div>
                          {a.organization && (
                            <div style={{ fontSize: 11, color: "#667085", marginTop: 2 }}>{a.organization}</div>
                          )}
                        </div>
                        <button
                          onClick={() => removeAchievement(idx)}
                          style={{
                            backgroundColor: "#FDF2F2",
                            border: "1px solid #F8C8C8",
                            color: "#C24141",
                            fontSize: 12,
                            borderRadius: 5,
                            cursor: "pointer",
                            padding: "3px 8px",
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 7. Certifications */}
            {activeTab === "certifications" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#162A43", margin: "0 0 8px" }}>
                  Certifications &amp; Credentials
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, padding: 14, backgroundColor: "#F6F5F1", borderRadius: 8, border: "1px solid #E4E1DA" }}>
                  <input
                    type="text"
                    placeholder="Certification Name (e.g. AWS Certified Developer)"
                    value={newCert.name}
                    onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
                    style={{ padding: "8px 10px", backgroundColor: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 6, color: "#17191C", fontSize: 12, outline: "none" }}
                  />
                  <input
                    type="text"
                    placeholder="Issuer (e.g. Amazon Web Services)"
                    value={newCert.issuer}
                    onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })}
                    style={{ padding: "8px 10px", backgroundColor: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 6, color: "#17191C", fontSize: 12, outline: "none" }}
                  />
                  <button
                    onClick={addCertification}
                    style={{ padding: "8px 16px", backgroundColor: "#356AE6", border: "none", borderRadius: 6, color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                  >
                    + Add
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {certificationsList.length === 0 ? (
                    <div style={{ padding: "24px", textAlign: "center", color: "#667085", fontSize: 13, backgroundColor: "#F6F5F1", borderRadius: 8, border: "1px dashed #E4E1DA" }}>
                      No certifications added yet.
                    </div>
                  ) : (
                    certificationsList.map((c, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "10px 14px",
                          backgroundColor: "#FFFFFF",
                          border: "1px solid #E4E1DA",
                          borderRadius: 8,
                          boxShadow: "0 1px 2px rgba(16, 24, 40, 0.02)"
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#162A43" }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: "#667085", marginTop: 2 }}>{c.issuer}</div>
                        </div>
                        <button
                          onClick={() => removeCertification(idx)}
                          style={{
                            backgroundColor: "#FDF2F2",
                            border: "1px solid #F8C8C8",
                            color: "#C24141",
                            fontSize: 12,
                            borderRadius: 5,
                            cursor: "pointer",
                            padding: "3px 8px",
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 8. Career Goals & Interests */}
            {activeTab === "career" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#162A43", margin: 0 }}>
                  Career Goals &amp; Matching Preferences
                </h2>

                {/* Target Roles */}
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#667085", marginBottom: 6, letterSpacing: 0.5 }}>
                    TARGET ROLES
                  </label>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <input
                      type="text"
                      placeholder="e.g. Backend Engineer, AI/ML Engineer, SDE-1"
                      value={targetRoleInput}
                      onChange={(e) => setTargetRoleInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addTargetRole()}
                      style={{ flex: 1, padding: "8px 10px", backgroundColor: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 6, color: "#17191C", fontSize: 12, outline: "none" }}
                    />
                    <button
                      onClick={addTargetRole}
                      style={{ padding: "8px 14px", backgroundColor: "#356AE6", border: "none", borderRadius: 6, color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                    >
                      Add
                    </button>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {careerGoals.targetRoles.map((role) => (
                      <span
                        key={role}
                        style={{
                          padding: "4px 10px",
                          backgroundColor: "#EAF4EE",
                          border: "1px solid #C8E4D3",
                          color: "#2E7D5B",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 500,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        {role}
                        <button
                          onClick={() => removeTargetRole(role)}
                          style={{ background: "transparent", border: "none", color: "#2E7D5B", cursor: "pointer", padding: 0 }}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Preferred Domains */}
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#667085", marginBottom: 6, letterSpacing: 0.5 }}>
                    PREFERRED DOMAINS
                  </label>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <input
                      type="text"
                      placeholder="e.g. Distributed Systems, FinTech, AI Platforms"
                      value={domainInput}
                      onChange={(e) => setDomainInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addDomain()}
                      style={{ flex: 1, padding: "8px 10px", backgroundColor: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 6, color: "#17191C", fontSize: 12, outline: "none" }}
                    />
                    <button
                      onClick={addDomain}
                      style={{ padding: "8px 14px", backgroundColor: "#356AE6", border: "none", borderRadius: 6, color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                    >
                      Add
                    </button>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {careerGoals.preferredDomains.map((dom) => (
                      <span
                        key={dom}
                        style={{
                          padding: "4px 10px",
                          backgroundColor: "#EFF4FE",
                          border: "1px solid #D2E0FB",
                          color: "#356AE6",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 500,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        {dom}
                        <button
                          onClick={() => removeDomain(dom)}
                          style={{ background: "transparent", border: "none", color: "#356AE6", cursor: "pointer", padding: 0 }}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Target Companies */}
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#667085", marginBottom: 6, letterSpacing: 0.5 }}>
                    TARGET COMPANIES
                  </label>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <input
                      type="text"
                      placeholder="e.g. Google, Microsoft, Atlassian, TCS Digital"
                      value={companyInput}
                      onChange={(e) => setCompanyInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addCompany()}
                      style={{ flex: 1, padding: "8px 10px", backgroundColor: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 6, color: "#17191C", fontSize: 12, outline: "none" }}
                    />
                    <button
                      onClick={addCompany}
                      style={{ padding: "8px 14px", backgroundColor: "#356AE6", border: "none", borderRadius: 6, color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                    >
                      Add
                    </button>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {careerGoals.targetCompanies.map((c) => (
                      <span
                        key={c}
                        style={{
                          padding: "4px 10px",
                          backgroundColor: "#FEF7ED",
                          border: "1px solid #F8D8A7",
                          color: "#B7791F",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 500,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        {c}
                        <button
                          onClick={() => removeCompany(c)}
                          style={{ background: "transparent", border: "none", color: "#B7791F", cursor: "pointer", padding: 0 }}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 9. Links & Socials */}
            {activeTab === "links" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#162A43", margin: "0 0 8px" }}>
                  Profiles &amp; Verifiable Links
                </h2>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#667085", marginBottom: 6, letterSpacing: 0.5 }}>
                    GITHUB PROFILE
                  </label>
                  <input
                    type="url"
                    placeholder="https://github.com/yourusername"
                    value={linksInfo.githubUrl}
                    onChange={(e) => setLinksInfo({ ...linksInfo, githubUrl: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E4E1DA",
                      borderRadius: 7,
                      color: "#17191C",
                      fontSize: 13,
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#667085", marginBottom: 6, letterSpacing: 0.5 }}>
                    LINKEDIN URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/yourprofile"
                    value={linksInfo.linkedinUrl}
                    onChange={(e) => setLinksInfo({ ...linksInfo, linkedinUrl: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E4E1DA",
                      borderRadius: 7,
                      color: "#17191C",
                      fontSize: 13,
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#667085", marginBottom: 6, letterSpacing: 0.5 }}>
                    PORTFOLIO OR PERSONAL SITE
                  </label>
                  <input
                    type="url"
                    placeholder="https://yourdomain.dev"
                    value={linksInfo.portfolioUrl}
                    onChange={(e) => setLinksInfo({ ...linksInfo, portfolioUrl: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E4E1DA",
                      borderRadius: 7,
                      color: "#17191C",
                      fontSize: 13,
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
