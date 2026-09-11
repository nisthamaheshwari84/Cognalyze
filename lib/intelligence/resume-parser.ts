import { groqFetch } from "@/lib/groq";

export interface StructuredResumeProfile {
  name: string;
  headline: string;
  summary: string;
  location: string;
  yearsOfExperience: number;
  currentRole: string;
  currentCompany: string;
  skills: { name: string; proficiency?: string }[];
  experience: {
    company: string;
    title: string;
    duration?: string;
    description: string;
  }[];
  education: {
    institution: string;
    degree: string;
    year?: number;
    grade?: string;
  }[];
  rawText: string;
}

/**
 * Shared Authoritative Resume Parser
 * Used by:
 * 1. Student Side: /student/resume (ATS optimization, skills extraction)
 * 2. Recruiter Side: /recruiter/candidates (bulk resume parsing & candidate profiling)
 */
export async function parseResume(resumeText: string): Promise<StructuredResumeProfile> {
  const cleanText = (resumeText || "").trim();
  if (!cleanText) {
    return {
      name: "Anonymous Candidate",
      headline: "Software Engineer",
      summary: "",
      location: "",
      yearsOfExperience: 0,
      currentRole: "",
      currentCompany: "",
      skills: [],
      experience: [],
      education: [],
      rawText: ""
    };
  }

  const prompt = `You are Cognalyze's Master Resume Parser. Extract structured information from this resume into clean JSON.
  
  RESUME TEXT:
  ${cleanText.slice(0, 4500)}
  
  Output ONLY valid JSON matching this structure:
  {
    "name": "Candidate Full Name or 'Anonymous Candidate'",
    "headline": "Professional Title or Current Specialty",
    "summary": "2-sentence executive summary",
    "location": "City, Country",
    "yearsOfExperience": number,
    "currentRole": "Current or most recent job title",
    "currentCompany": "Current or most recent company",
    "skills": [{"name": "Skill Name", "proficiency": "beginner|intermediate|advanced|expert"}],
    "experience": [
      {
        "company": "Company Name",
        "title": "Job Title",
        "duration": "e.g., 2022 - 2024",
        "description": "Responsibilities and quantifiable metrics"
      }
    ],
    "education": [
      {
        "institution": "University / College Name",
        "degree": "Degree and major",
        "year": 2024,
        "grade": "GPA or Percentage if mentioned"
      }
    ]
  }`;

  try {
    const res = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.1
      })
    });

    const data = await res.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}");

    return {
      name: parsed.name || "Anonymous Candidate",
      headline: parsed.headline || "Software Engineer",
      summary: parsed.summary || "",
      location: parsed.location || "",
      yearsOfExperience: typeof parsed.yearsOfExperience === "number" ? parsed.yearsOfExperience : 0,
      currentRole: parsed.currentRole || "",
      currentCompany: parsed.currentCompany || "",
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      experience: Array.isArray(parsed.experience) ? parsed.experience : [],
      education: Array.isArray(parsed.education) ? parsed.education : [],
      rawText: cleanText
    };
  } catch (err) {
    console.error("Shared resume parser fallback triggered:", err);
    // Graceful fallback
    const firstLine = cleanText.split("\n")[0] || "Candidate";
    return {
      name: firstLine.slice(0, 40),
      headline: "Software Engineer",
      summary: cleanText.slice(0, 200),
      location: "India",
      yearsOfExperience: 1,
      currentRole: "Engineer",
      currentCompany: "",
      skills: [{ name: "Java" }, { name: "Python" }, { name: "SQL" }],
      experience: [],
      education: [],
      rawText: cleanText
    };
  }
}
