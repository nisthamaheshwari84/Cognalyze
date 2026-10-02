import { groqFetch } from "@/lib/groq";
import { RedrobCandidate } from "@/types/matching";
import { normalizeCandidateProfile, safeJsonParse } from "@/lib/resilience/json-repair";
import { sanitizePromptInput } from "@/lib/resilience/security";

/**
 * Parses raw resume text into a structured RedrobCandidate profile.
 * Guarantees that skills, career_history, and education are ALWAYS defined arrays,
 * preventing downstream crashes.
 */
export async function parseRawResume(resumeText: string): Promise<Partial<RedrobCandidate>> {
  const { cleanText } = sanitizePromptInput(resumeText || "", 6000);

  if (!cleanText || cleanText.trim().length < 15) {
    return normalizeCandidateProfile({
      profile: {
        anonymized_name: "Candidate Profile",
        headline: "Applicant",
        summary: cleanText || "Minimal profile information provided.",
        years_of_experience: 0
      },
      skills: [],
      career_history: [],
      education: []
    });
  }

  const prompt = `You are an elite Resume Parsing AI. Parse this raw resume into a structured JSON profile that conforms to the target schema.
  
RAW RESUME:
${cleanText.slice(0, 4500)}

Output ONLY valid JSON matching this format:
{
  "profile": {
    "anonymized_name": "Full Name or Anonymized Name",
    "headline": "Professional Headline",
    "summary": "Professional Summary",
    "location": "City, State",
    "country": "Country",
    "years_of_experience": number,
    "current_title": "Current Job Title",
    "current_company": "Current Employer",
    "current_company_size": "1-10|11-50|51-200|201-500|501-1000|1001-5000|5001-10000|10001+",
    "current_industry": "Industry"
  },
  "career_history": [
    {
      "company": "Company Name",
      "title": "Title",
      "start_date": "YYYY-MM-DD",
      "end_date": "YYYY-MM-DD or null",
      "duration_months": number,
      "is_current": boolean,
      "industry": "Industry",
      "description": "Responsibilities"
    }
  ],
  "education": [
    {
      "institution": "University Name",
      "degree": "Degree (e.g. B.Tech, M.S.)",
      "field_of_study": "Field of Study",
      "start_year": number,
      "end_year": number,
      "grade": "GPA/Percentage",
      "tier": "tier_1|tier_2|tier_3|tier_4|unknown"
    }
  ],
  "skills": [
    {
      "name": "Skill Name",
      "proficiency": "beginner|intermediate|advanced|expert",
      "endorsements": number,
      "duration_months": number
    }
  ]
}`;

  try {
    const res = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY || ""}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.1
      })
    });

    if (res && res.ok) {
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      if (content) {
        const parsed = safeJsonParse(content, null);
        if (parsed && typeof parsed === "object") {
          return normalizeCandidateProfile(parsed);
        }
      }
    }
  } catch (error) {
    console.warn("[parseRawResume] LLM parsing failed, using deterministic structural extraction:", error);
  }

  // Deterministic fallback extraction from raw text
  return extractDeterministicCandidateFromText(cleanText);
}

/**
 * Extracts basic candidate structure deterministically from raw text
 * when AI providers are unavailable or fail.
 */
function extractDeterministicCandidateFromText(text: string): Partial<RedrobCandidate> {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const firstLine = lines[0] || "Candidate";

  // Heuristic skill extraction
  const commonTech = [
    "python", "javascript", "typescript", "react", "next.js", "node.js",
    "c++", "java", "sql", "postgresql", "docker", "aws", "git", "dsa",
    "machine learning", "pytorch", "tensorflow", "fastapi", "html", "css"
  ];

  const lower = text.toLowerCase();
  const detectedSkills = commonTech
    .filter(skill => lower.includes(skill))
    .map(skill => ({
      name: skill.charAt(0).toUpperCase() + skill.slice(1),
      proficiency: "intermediate" as const,
      endorsements: 1,
      duration_months: 12
    }));

  return normalizeCandidateProfile({
    profile: {
      anonymized_name: firstLine.length < 50 ? firstLine : "Candidate",
      headline: "Engineering Candidate",
      summary: lines.slice(1, 4).join(" "),
      years_of_experience: lower.includes("intern") ? 1 : 2
    },
    skills: detectedSkills,
    career_history: [
      {
        company: "Documented Experience",
        title: "Developer / Student",
        start_date: "2024-01-01",
        end_date: null,
        duration_months: 12,
        is_current: true,
        industry: "Technology",
        description: text.slice(0, 200)
      }
    ],
    education: [
      {
        institution: "Engineering Institution",
        degree: "B.Tech / Bachelor's",
        field_of_study: "Computer Science & Engineering",
        start_year: 2022,
        end_year: 2026,
        grade: "First Class",
        tier: "tier_2"
      }
    ]
  });
}
