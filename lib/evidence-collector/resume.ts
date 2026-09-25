/**
 * RESUME EVIDENCE COLLECTOR
 * 
 * Rules:
 * 1. Wraps existing deterministic resume section parsing.
 * 2. Normalizes it into plain structured facts (skills, projects, companies, experience years — NO interpretation).
 * 3. Never calls an LLM and never assigns an evidence status directly.
 */

import { ResumeFacts } from "./types";
import {
  parseResumeSections,
  calculateDocumentedExperienceYears,
} from "@/lib/screening/candidate-screening-engine";

export function extractResumeFacts(
  resumeText: string
): { raw_data: any; normalized_facts: ResumeFacts | null } {
  const text = (resumeText || "").trim();
  if (!text || text.length < 20) {
    return {
      raw_data: { error: "Resume text empty or too short" },
      normalized_facts: null,
    };
  }

  try {
    const sections = parseResumeSections(text);
    const expCalc = calculateDocumentedExperienceYears(text);

    // Extract claimed skills from skills section or bullet points
    const skillsClaimed: string[] = [];
    for (const line of sections.skills) {
      // Split by commas, pipes, bullets
      const parts = line.split(/[,|•·\n]/).map((p) => p.trim()).filter((p) => p.length > 1 && p.length < 40);
      for (const part of parts) {
        const cleaned = part.replace(/^skills\s*:\s*/i, "").trim();
        if (cleaned && !skillsClaimed.includes(cleaned)) {
          skillsClaimed.push(cleaned);
        }
      }
    }

    // Extract project records
    const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const projects: ResumeFacts["projects"] = sections.projects.map((proj) => {
      const allText = `${proj.title || ""} ${proj.bullets.join(" ")}`;
      // Detect mentioned technologies (e.g. React, Node, Python, AWS, Docker, PostgreSQL)
      const commonTech = [
        "React", "Next.js", "Node.js", "Express", "TypeScript", "JavaScript",
        "Python", "Django", "FastAPI", "Go", "Java", "Spring", "C++",
        "PostgreSQL", "MySQL", "MongoDB", "Redis", "Docker", "Kubernetes",
        "AWS", "GCP", "GraphQL", "REST", "Kafka", "RabbitMQ", "Tailwind"
      ];
      const matchedTech = commonTech.filter((t) =>
        new RegExp(`(?:^|[^a-zA-Z0-9])${escapeRegExp(t)}(?:$|[^a-zA-Z0-9])`, "i").test(allText)
      );

      return {
        name: proj.title || "Technical Project",
        technologies: matchedTech,
        descriptionSnippet: proj.bullets.slice(0, 2).join("; "),
      };
    });

    // Extract company / experience names
    const cleanCompany = (str: string) =>
      str
        .replace(/^(?:Software Engineer|Engineer|Developer|Intern|Lead|Architect|Consultant|Manager)\s*(?:at|-)\s*/i, "")
        .replace(/\s*\([^)]*\)$/, "")
        .replace(/\s*[-–—]\s*(?:20\d\d|19\d\d|present).*$/i, "")
        .trim();

    const companies: string[] = sections.experience
      .map((e) => cleanCompany(e.company || e.title || ""))
      .filter((c): c is string => Boolean(c && c.length > 1));

    // Detect DSA mentions in resume text
    let dsaClaim: string | undefined = undefined;
    const dsaMatch = text.match(/(?:solved\s*\d+\+?\s*(?:dsa|leetcode|problems)?|leetcode|codeforces|competitive programming)/i);
    if (dsaMatch) {
      const matchIndex = dsaMatch.index || 0;
      dsaClaim = text.slice(Math.max(0, matchIndex - 15), Math.min(text.length, matchIndex + 60)).trim();
    }

    // Detect education
    const educationStr = sections.education.join(" ").slice(0, 200) || undefined;

    const normalized: ResumeFacts = {
      skills_claimed: skillsClaimed.slice(0, 30),
      projects,
      companies: Array.from(new Set(companies)).slice(0, 10),
      documented_experience_years: expCalc.approxYears,
      dsa_claim: dsaClaim,
      education: educationStr,
    };

    return {
      raw_data: {
        text_length: text.length,
        sections_found: {
          skills_lines: sections.skills.length,
          experience_blocks: sections.experience.length,
          project_blocks: sections.projects.length,
          education_lines: sections.education.length,
        },
      },
      normalized_facts: normalized,
    };
  } catch (err: any) {
    return {
      raw_data: { error: err?.message || String(err) },
      normalized_facts: null,
    };
  }
}
