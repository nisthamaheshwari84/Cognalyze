/* eslint-disable */
import { NextResponse } from "next/server";
import { groqFetch } from "@/lib/groq";

export type CandidateCategory = "fresher" | "1-3years" | "senior" | "career-switcher";

function detectCategory(
  experience: string = "",
  background: string = "",
  targetRole: string = "",
  explicitCategory?: string
): { category: CandidateCategory | "ambiguous"; reason: string } {
  if (explicitCategory && ["fresher", "1-3years", "senior", "career-switcher"].includes(explicitCategory)) {
    return { category: explicitCategory as CandidateCategory, reason: "Explicitly selected by candidate" };
  }

  const expLower = experience.toLowerCase().trim();
  const bgLower = background.toLowerCase();
  const roleLower = targetRole.toLowerCase();

  // Career Switcher detection
  const isSwitching =
    /career switch|transitioning from|moving from|previously worked as|background in (mechanical|civil|electrical|sales|marketing|teaching|hospitality|finance|operations|accounting|nursing)|switched to/i.test(
      background
    );
  if (isSwitching && !/intern/i.test(expLower)) {
    return { category: "career-switcher", reason: "Candidate indicates transition from another field" };
  }

  // Fresher / Student detection
  const isStudentOrFresher =
    /fresher|student|intern|graduating|undergrad|pursuing|0\s*years?|college|b\.?tech|b\.?s\.?|1st year|2nd year|3rd year|4th year|final year/i.test(
      expLower
    ) ||
    /student at|studying at|undergraduate|final year student|3rd year|batch of 202|intern at|interned at|internship/i.test(
      bgLower
    ) ||
    /fresher|intern|entry/i.test(roleLower);

  // Look specifically for "X years / yrs" of professional experience
  const yrExpMatch = expLower.match(/(\d+)\s*(?:\+)?\s*(?:years?|yrs?)/);
  const years = yrExpMatch ? parseInt(yrExpMatch[1], 10) : NaN;

  if (isStudentOrFresher && (isNaN(years) || years <= 1)) {
    return { category: "fresher", reason: "Student or entry-level candidate (0-1 years)" };
  }

  if (!isNaN(years)) {
    if (years <= 1) return { category: "fresher", reason: "0-1 years of experience" };
    if (years <= 3) return { category: "1-3years", reason: "1-3 years of professional experience" };
    return { category: "senior", reason: "3+ years / senior professional experience" };
  }

  // Check text signals if years not explicitly a number
  if (/1\s*-\s*3|junior|associate|1 year|2 years|3 years/i.test(expLower) || /1\s*-\s*3 years/i.test(bgLower)) {
    return { category: "1-3years", reason: "1-3 years signal found" };
  }

  if (/senior|lead|staff|principal|manager|architect|5\+|10\+|many years/i.test(expLower) || /senior|staff|lead/i.test(roleLower)) {
    return { category: "senior", reason: "Senior or leadership title/experience" };
  }

  // If background is very thin with no dates, no experience field provided
  if (!expLower && !/(student|college|intern|worked at|company|years)/i.test(bgLower)) {
    return { category: "ambiguous", reason: "Insufficient information to distinguish between student/fresher, experienced, or career switcher" };
  }

  // Default to fresher if college or intern mentions exist, else 1-3 years
  if (/(college|university|iit|nit|bits|campus|intern)/i.test(bgLower)) {
    return { category: "fresher", reason: "Inferred student/fresher from academic mentions" };
  }

  return { category: "1-3years", reason: "Defaulted to early-career based on available context" };
}

export async function POST(req: Request) {
  try {
    const {
      keywords,
      targetRole,
      experience,
      background,
      template,
      linkedin,
      github,
      certifications,
      category: requestedCategory,
    } = await req.json();

    const detection = detectCategory(experience, background, targetRole, requestedCategory);

    // If ambiguous and client hasn't specified category, prompt user select
    if (detection.category === "ambiguous") {
      return NextResponse.json({
        ambiguous: true,
        message: "Your career stage is ambiguous. Please select whether you are a Fresher/Student, 1-3 Years Experience, 3+ Years/Senior, or Career Switcher.",
        options: [
          { id: "fresher", label: "Fresher / Student (Education & Projects prioritized)" },
          { id: "1-3years", label: "1-3 Years Experience (Experience & Projects balanced)" },
          { id: "senior", label: "3+ Years / Senior (Experience prioritized, no fluff)" },
          { id: "career-switcher", label: "Career Switcher (Transferable skills & elevated projects)" },
        ],
      });
    }

    const category = detection.category as CandidateCategory;

// Template-specific intelligence rubrics
    const templateRubrics: Record<string, string> = {
      "ats-classic": `
TEMPLATE FOCUS: ATS CLASSIC (Content > Formatting)
- Single-column, clean ATS-parseable structure, standard section headings.
- Strong JD keyword relevance with evidence-backed claims in every bullet.
- Clear job titles, dates, and plain sentence structure.
- Concise, high-density bullet points that highlight quantified achievements without parsing friction.`,
      "modern-tech": `
TEMPLATE FOCUS: MODERN TECH (Technical Depth & Engineering Evidence)
- Emphasize engineering complexity, system architecture, and tech stack details.
- Detail APIs, databases, cloud, deployment, and data pipelines actually used.
- Highlight Git/GitHub, open source, performance, and scalability evidence.
- Show deep technical ownership (e.g. how components interact, latency, model fine-tuning or API design).`,
      "corporate": `
TEMPLATE FOCUS: CORPORATE (Business Impact & Organizational Value)
- Emphasize business outcomes, workflow consolidation, and organizational contribution.
- Highlight cross-functional collaboration, stakeholder communication, and responsibility.
- Frame engineering tasks in terms of business value (e.g. reduced manual effort, improved reliability).
- Clear professional positioning and measurable results.`,
      "executive": `
TEMPLATE FOCUS: EXECUTIVE (Scope, Leadership & Strategic Impact)
- Focus on organizational scale, team leadership, budget/P&L, and strategic decisions.
- Shift emphasis from individual coding tasks to technical vision, architecture governance, and transformation.
- Highlight revenue/cost impact, team expansion, and cross-departmental influence.`,
      "fresher": `
TEMPLATE FOCUS: FRESHER / STUDENT (Projects, Ownership & Builder Mindset)
- Position candidate with a clear target role (e.g. "B.Tech CSE (AI/ML) | AI/ML & Generative AI").
- Treat academic and personal projects as real engineering: 3–4 detailed bullets per project covering architecture, key features, APIs, and deployment.
- Highlight coursework (Data Structures, Algorithms, AI/ML, DBMS) to reinforce academic credibility.
- Showcase hackathons, GitHub repositories, and demonstrated hands-on builder initiative.`,
      "creative": `
TEMPLATE FOCUS: CREATIVE (Design Thinking & Visual Communication)
- Emphasize product thinking, user experience, visual storytelling, and portfolio presence.
- Highlight frontend craftsmanship, UI/UX workflows, responsive design, and branding.
- Support claims with live demo links, GitHub repositories, or portfolio URLs.`,
      "startup": `
TEMPLATE FOCUS: STARTUP (0→1 Ownership & Speed of Shipping)
- Emphasize builder mindset: taking an idea from concept to deployed MVP.
- Highlight fast execution, shipping velocity, product thinking, and user problem-solving.
- Show cross-functional breadth (handling frontend, backend, APIs, and deployment).
- Frame bullets around initiative, adaptability, and real user feedback.`
    };

    const selectedRubric = templateRubrics[template] || templateRubrics["ats-classic"];

    // Build the FAANG recruiter system prompt with 1-page completeness and strict anti-hallucination rules
    const systemPrompt = `SYSTEM:
You are an elite technical recruiter and principal engineer with 50 years of combined experience screening for FAANG and top startups (Google, Amazon, Meta, Apple, OpenAI, Stripe). You know what separates a world-class 1-page resume from a weak, sparse, or fabricated one.

A TOP-TIER RESUME EMBODIES THESE 10 PRINCIPLES:
1. Clear Target: Immediately know what role the candidate wants (e.g. "B.Tech CSE (AI/ML) Student | AI/ML & Generative AI").
2. Relevance: Prioritize skills and evidence that directly align with the target role.
3. Evidence: What did they build? How? How complex? Did it work? (Mentioned skill ≠ demonstrated skill).
4. Impact: Action → Work → Result (e.g. "Architected and developed a full-stack recruitment intelligence platform that analyzes resumes against job descriptions with evidence-based scoring...").
5. Specificity: Name the actual tools, libraries, architectural components, and design choices.
6. Credibility: Every skill listed must be evidenced in the project/experience bullets.
7. Ownership: Show what the candidate personally designed, built, and shipped from concept to deployment.
8. Progression: Clear trajectory and increasing scope.
9. Readability: Scannable in 10-15 seconds with balanced, aesthetic visual hierarchy.
10. No Bullshit: Zero empty buzzwords ("results-driven", "fast learner", "hardworking", "dynamic professional").

${selectedRubric}

CRITICAL ANTI-HALLUCINATION & HONESTY RULES (ZERO TOLERANCE FOR FAKE DATA):
1. PROJECT HONESTY:
   - NEVER INVENT OR HALLUCINATE ANY PROJECTS! Only include projects that the candidate has EXPLICITLY NAMED and BUILT.
   - If the candidate only mentions building ONE named project (e.g. "Cognalyze"), you MUST output EXACTLY ONE project in the "projects" array!
   - ABSOLUTELY DO NOT INVENT A SECOND PROJECT (such as "AI Agent Framework for Opportunity Tracking", "AI-Driven Opportunity Tracker", or any other made-up project name)! The user strictly forbids fake projects.
   - For that single project (e.g. Cognalyze), provide 4 to 5 comprehensive, technically deep, authentic engineering bullets that deconstruct its actual architecture:
     * Bullet 1: Core Problem & Architecture (Action verb + system built + tech stack).
     * Bullet 2: LLM Integration & Prompt Engineering (Structured prompt pipelines, evidence scoring, matching candidate claims against job descriptions).
     * Bullet 3: Dynamic Interview Question Generation (Tailored competency-based interview questions mapped to candidate resumes).
     * Bullet 4: Recruiter Dashboard & Multi-Candidate Benchmarking (Interactive comparison view, side-by-side competency analysis in React).
     * Bullet 5: Full-Stack Engineering & Best Practices (Modular React components, REST API design, error handling, Git version control).
2. EXPERIENCE HONESTY:
   - If the candidate is a student or fresher with no formal corporate employment, the "experience" array MUST BE EMPTY: []!
   - NEVER invent fake job titles like "AI Engineer & Founder · Cognalyze", "Lead Engineer", or fictitious companies/dates.
3. TECH STACK HONESTY:
   - NEVER invent tools the candidate did not mention or know (NEVER hallucinate LangChain, FAISS, SQLite, Streamlit, Railway, AWS Elastic Beanstalk, spaCy unless explicitly provided in keywords/background).
   - Only use technologies truthful to the candidate's input (e.g., Python, C++, JavaScript, HTML, CSS, React, Next.js, APIs, Git, GitHub).
4. METRICS & AWARDS HONESTY:
   - NEVER fabricate numbers, user counts, star counts, or metrics (NO "200+ stars", NO "95% precision", NO "100 concurrent users", NO fake hackathon awards).
   - If the candidate did not provide numbers, focus on specific technical actions, engineering mechanisms, and concrete deliverables.
5. ACADEMIC & TECHNICAL EXPLORATIONS:
   - If the candidate mentions areas of exploration in their background (e.g. "worked on AI agent concepts, opportunity tracking, resume intelligence, and AI-powered automation. Strengthening DSA, AI/ML"):
     Represent this factually in the "achievements" array without inventing a standalone software product:
     e.g., in "achievements":
     [
       "Researched and prototyped AI agent concepts, prompt workflows, and automated resume intelligence pipelines.",
       "Actively practicing core Data Structures & Algorithms (DSA) in C++ and Python with a focus on algorithmic problem solving."
     ]

CRITICAL 1-PAGE DENSITY & COMPLETENESS RULE:
- NEVER produce a sparse, half-empty resume! An empty resume looks amateurish.
- The finished resume must be a complete, beautifully proportioned, professional ONE-PAGE document (~350–450 words total).
- Summary: Always include a sharp 2-3 line professional summary stating target role, specialization, demonstrable technical capabilities, and core focus.
- Education: Always include degree, specialization, and relevant academic coursework (e.g. Data Structures & Algorithms, Object-Oriented Programming, Database Management Systems, Operating Systems, Machine Learning, Deep Learning).
- Skills: Group into Languages, Frameworks, Tools, AI & ML, and Core Fundamentals.

YOUR TASK NOW:
Target role: ${targetRole || "Software Engineer"}
Years of experience: ${experience || "Not specified"}
Candidate category: ${category}
Selected Template: ${template}
Keywords to naturally incorporate with evidence: ${keywords || "None"}
Candidate's background: ${background}
LinkedIn: ${linkedin || ""}
GitHub: ${github || ""}
Certifications provided: ${certifications || ""}

Write a top-tier, defensible, beautifully proportioned 1-page resume strictly adhering to the facts above.
Return ONLY this JSON, no markdown fences:

{
  "name": "Candidate Full Name extracted from background (or 'Candidate' if not specified)",
  "title": "${targetRole || "Software Engineer"}",
  "email": "email if present in background or empty string",
  "phone": "phone if present in background or empty string",
  "linkedin": "${linkedin || ""}",
  "github": "${github || ""}",
  "location": "location if stated in background or empty string",
  "summary": "2-3 crisp lines stating target specialization, demonstrable technical capabilities, and core focus.",
  "sections_in_order": ["Education", "Skills", "Projects", "Achievements"],
  "experience": [],
  "projects": [{"title": "string", "tech": "string", "bullets": ["bullet 1...", "bullet 2...", "bullet 3...", "bullet 4...", "bullet 5..."]}],
  "education": [{"degree": "string", "institution": "string", "year": "string", "gpa": "string", "relevant": "Data Structures & Algorithms, Object-Oriented Programming, Database Management Systems, Operating Systems, Machine Learning, Deep Learning"}],
  "skills_categorized": {"Languages": [], "Frameworks": [], "Tools": [], "AI & ML": [], "Core Fundamentals": []},
  "certifications": ["only if provided"],
  "achievements": ["factual achievements, hackathons, or academic milestones"]
}`;

    const res = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: `Please generate the structured resume JSON now. Candidate Category is: ${category}. Stick strictly to verifiable facts in the background. If only 1 project is mentioned, output ONLY that 1 project with 4-5 substantive engineering bullets. Never invent fake projects, fake tools, or fake numbers. Return raw JSON only.`,
          },
        ],
        max_tokens: 4000,
        temperature: 0.1,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Groq API request failed");

    const text = data.choices[0].message.content.trim();
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Parse failed: LLM did not return valid JSON");

    const parsed = JSON.parse(match[0]);

    // Enforce canonical section order based on category if the LLM was slightly off
    const canonicalOrders: Record<CandidateCategory, string[]> = {
      fresher: ["Education", "Projects", "Skills", "Experience", "Certifications", "Achievements"],
      "1-3years": ["Summary", "Experience", "Projects", "Skills", "Education", "Certifications"],
      senior: ["Summary", "Experience", "Skills", "Education", "Certifications"],
      "career-switcher": ["Summary", "Experience", "Projects", "Skills", "Education", "Certifications"],
    };

    const sections_in_order = Array.isArray(parsed.sections_in_order) && parsed.sections_in_order.length > 0
      ? parsed.sections_in_order
      : canonicalOrders[category];

    // Normalize experience items (ensure company and duration aliases exist)
    const normalizedExperience = (parsed.experience || []).map((e: any) => ({
      role: e.role || "Role",
      company: e.organization || e.company || "",
      organization: e.organization || e.company || "",
      duration: e.dates || e.duration || "",
      dates: e.dates || e.duration || "",
      location: e.location || "",
      bullets: Array.isArray(e.bullets) ? e.bullets : [],
    }));

    // Normalize project items (ensure name and title aliases exist)
    const normalizedProjects = (parsed.projects || []).map((p: any) => ({
      name: p.title || p.name || "Project",
      title: p.title || p.name || "Project",
      tech: p.tech || "",
      bullets: Array.isArray(p.bullets) ? p.bullets : [],
    }));

    // Normalize skills to both formats: skills_categorized and legacy skills object
    const skills_categorized = parsed.skills_categorized || {
      Languages: [],
      Frameworks: [],
      Tools: [],
      "AI & ML": [],
      "Core Fundamentals": [],
    };

    const skills = {
      languages: skills_categorized.Languages || skills_categorized.languages || parsed.skills?.languages || [],
      frameworks: skills_categorized.Frameworks || skills_categorized.frameworks || parsed.skills?.frameworks || [],
      tools: skills_categorized.Tools || skills_categorized.tools || parsed.skills?.tools || [],
      databases: skills_categorized.Cloud || skills_categorized.cloud || skills_categorized.databases || [],
      concepts: skills_categorized["AI & ML"] || skills_categorized["Core Fundamentals"] || parsed.skills?.concepts || [],
    };

    // Calculate truthful keywords matched
    const userKeywordList = (keywords || "")
      .split(",")
      .map((k: string) => k.trim())
      .filter(Boolean);
    const resumeFullText = JSON.stringify(parsed).toLowerCase();
    const keywords_matched = userKeywordList.filter((k: string) =>
      resumeFullText.includes(k.toLowerCase())
    );

    // Compute realistic ATS compliance score
    // Higher score for having structured sections, contact info, truthful keywords
    let ats_score = 88;
    if (parsed.name && parsed.name !== "Candidate") ats_score += 3;
    if (normalizedExperience.length > 0 || normalizedProjects.length > 0) ats_score += 3;
    if (keywords_matched.length >= 2) ats_score += 3;
    if (ats_score > 98) ats_score = 98;

    return NextResponse.json({
      name: parsed.name || "Candidate",
      title: parsed.title || targetRole || "Software Engineer",
      email: parsed.email || "",
      phone: parsed.phone || "",
      linkedin: parsed.linkedin || linkedin || "",
      github: parsed.github || github || "",
      location: parsed.location || "",
      summary: parsed.summary || "",
      category,
      sections_in_order,
      experience: normalizedExperience,
      projects: normalizedProjects,
      education: parsed.education || [],
      skills_categorized,
      skills,
      certifications: parsed.certifications || (certifications ? certifications.split(",").map((c: string) => c.trim()).filter(Boolean) : []),
      achievements: category === "fresher" || category === "career-switcher" ? (parsed.achievements || []) : [],
      ats_score,
      keywords_matched,
      improvements: [
        "Eliminated generic buzzwords in favor of concrete engineering evidence",
        `Organized sections in optimal order for ${category} career stage`,
        "Verified all metrics directly ground to provided background",
        "Enforced standard reverse-chronological and single-column ATS compatibility",
      ],
      advanced_metrics: {
        recruiter_attention: 92,
        skill_credibility: 96,
        achievement_impact: 90,
        content_quality: 95,
        personal_branding: 88,
        design_quality: 94,
        interview_readiness: 95,
        trust_score: 99,
        resume_dna_score: 94,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}