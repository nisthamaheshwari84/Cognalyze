import { NextResponse } from "next/server";
import { groqFetch } from "@/lib/groq";
import { extractJSON, stripThinkTags } from "@/lib/ai/placement-intelligence";
import {
  getOpportunityById,
  getStudentProfile,
  updateOpportunityExtractedContext,
  getProjectSuggestions,
  saveProjectSuggestions,
  getAllPreviousProjectTitles,
  DEMO_STUDENT_PROFILE
} from "@/lib/placement-store";

export async function GET(
  req: Request,
  props: { params: Promise<{ opportunityId: string }> }
) {
  try {
    const params = await props.params;
    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get("candidateId") || "student-demo";
    const opportunityId = params.opportunityId;

    const existing = await getProjectSuggestions(candidateId, opportunityId);
    return NextResponse.json({
      cached: !!existing,
      suggestions: existing || null
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  props: { params: Promise<{ opportunityId: string }> }
) {
  try {
    const params = await props.params;
    const body = await req.json();
    const candidateId = body.candidateId || "student-demo";
    const opportunityId = params.opportunityId;

    // 1. Fetch Opportunity & Student Profile (with fallback)
    const [opp, rawProfile] = await Promise.all([
      getOpportunityById(opportunityId),
      getStudentProfile(candidateId)
    ]);

    if (!opp) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    const profile = rawProfile || DEMO_STUDENT_PROFILE;

    // Build anti-repetition blocklist from all previously generated project titles
    const previousTitles = getAllPreviousProjectTitles(candidateId);
    const blocklist = previousTitles.length > 0
      ? `\n\nDO NOT REPEAT BLOCKLIST — these projects have already been suggested before. Do NOT generate anything with the same title, concept, or core approach:\n${previousTitles.map((t, i) => `${i + 1}. "${t}"`).join("\n")}`
      : "";

    // Extract tracks_or_themes for per-hackathon anchoring
    const tracksOrThemes = opp.extracted_context?.tracks_or_themes || [];
    const tracksSection = tracksOrThemes.length > 0
      ? `\n- SPECIFIC PROBLEM STATEMENTS / TRACKS from this hackathon (use these as DIRECT ANCHORS — at least 3 of 6 ideas must be directly inspired by one of these):\n${tracksOrThemes.map((t: string, i: number) => `  ${i + 1}. ${t}`).join("\n")}`
      : "";

    // ── STAGE 1: Opportunity Context Deep Extraction (Cached) ──
    let stage1Context = opp.extracted_context?.stage1_deep_context;
    let stage1Cached = true;

    if (!stage1Context) {
      stage1Cached = false;
      console.log(`[suggest-projects] Running Stage 1 context extraction for ${opportunityId}...`);
      
      const stage1Prompt = `You are a Principal Hackathon & Placement Architect.
Perform a deep analysis of this opportunity to identify core friction points, hidden themes, and high-scoring angles.

OPPORTUNITY:
Title: ${opp.title} (${opp.type})
Organizer: ${opp.organizer} (${opp.organizer_type})
Tags: ${opp.tags.join(", ")}
Domain Tags: ${opp.domain_tags.join(", ")}
Extracted Summary: ${opp.extracted_context?.summary || opp.eligibility}
Tracks: ${tracksOrThemes.join(", ")}

Extract in JSON format:
{
  "core_problem_spaces": ["Problem 1 with real friction", "Problem 2"],
  "judge_scoring_priorities": ["What judges actually reward most in this event"],
  "technical_depth_requirements": "Level of architecture expected (e.g. distributed, real-time, high-accuracy ML, edge computing)",
  "winning_moat": "What separates top 1% winning submissions from standard clones",
  "difficulty_tier": "high",
  "deadline_if_mentioned": "ISO date string (e.g. YYYY-MM-DD) or null",
  "assessment_dates": [
    {"label": "Round 1 Coding or Quiz", "date_if_mentioned": "ISO date string or null"}
  ]
}

STRICT RULE FOR DATES: Never guess a date — if not clearly stated in the opportunity details, date_if_mentioned stays null. Only include dates explicitly stated.`;

      const s1Res = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.GROQ_API_KEY}` },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [{ role: "user", content: stage1Prompt }],
          max_tokens: 1500,
          temperature: 0.2,
          response_format: { type: "json_object" }
        })
      });

      const s1Data = await s1Res.json();
      stage1Context = extractJSON(s1Data.choices?.[0]?.message?.content || "{}");
      await updateOpportunityExtractedContext(opportunityId, {
        stage1_deep_context: stage1Context,
        assessment_dates: stage1Context?.assessment_dates || [],
        deadline_if_mentioned: stage1Context?.deadline_if_mentioned || null,
        difficulty_tier: stage1Context?.difficulty_tier || "medium"
      });
    } else {
      console.log(`[suggest-projects] Using cached Stage 1 context for ${opportunityId}`);
    }

    // ── STAGE 2: Personalized Project Idea Generation (6 raw ideas) ──
    console.log(`[suggest-projects] Running Stage 2 idea generation for candidate ${candidateId}...`);
    const stage2Prompt = `You are a 50-Year Veteran FAANG Talent Scout, Grand Hackathon Judge, and Principal Solutions Architect.
Generate 6 distinct, authentic, high-impact project ideas tailored specifically to this student's skills and this opportunity.

STRICT RULES:
1. Under NO circumstances generate toy apps, basic CRUD, or thin AI chatbot wrappers.
2. Each project MUST tackle a critical, authentic real-world problem with serious engineering depth.
3. Each project must name a SPECIFIC industry, company type, regulation, or infrastructure bottleneck it addresses (e.g., "RBI UPI mandate compliance", "HIPAA-compliant telemetry", "Tier-2 ISP peering congestion") — NOT generic concepts.
4. No two projects may share the same core technical approach OR domain. Each must be genuinely different in both what it solves and how.
5. At least 3 ideas must be DIRECTLY INSPIRED by one of the hackathon's specific problem statements/tracks listed below.

STUDENT PROFILE:
- Target Roles: ${profile.target_roles.join(", ")}
- Skills: ${profile.skills.map(s => `${s.name} (${s.level})`).join(", ")}
- Past Projects: ${profile.past_projects.map(p => p.title).join(", ")}

OPPORTUNITY & PROBLEM CONTEXT:
- Opportunity: ${opp.title} (${opp.organizer})
- Core Problems: ${(stage1Context.core_problem_spaces || []).join("; ")}
- Judge Priorities: ${(stage1Context.judge_scoring_priorities || []).join("; ")}${tracksSection}${blocklist}

Generate 6 projects covering these categories:
1. Idea A: High-utility Enterprise / B2B Real-World Infrastructure Solution
2. Idea B: Novel DeepTech Developer Tool, Agentic Automation, or Systems Architecture
3. Idea C: High-impact Critical Consumer / Public Infrastructure / Social Good Problem
4. Idea D: Real-time Data Pipeline / Observability / Telemetry Engineering Challenge
5. Idea E: Security / Compliance / Trust & Safety Engineering Solution
6. Idea F: Cross-domain innovation (combining 2+ tracks from the hackathon in a novel way)

Return JSON:
{
  "raw_ideas": [
    {
      "title": "Project Title",
      "concept": "2 sentence description of the real-world problem and system solution",
      "student_skill_alignment": "Which student skills this leverages",
      "key_features": ["Feature 1", "Feature 2", "Feature 3"],
      "inspired_by_track": "Which specific hackathon track this is inspired by, or 'original' if none"
    }
  ]
}`;

    const s2Res = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [{ role: "user", content: stage2Prompt }],
        max_tokens: 3200,
        temperature: 0.45,
        response_format: { type: "json_object" }
      })
    });

    const s2Data = await s2Res.json();
    const stage2Output = extractJSON(s2Data.choices?.[0]?.message?.content || "{}");

    // ── STAGE 3: Self-Critique & Refinement (6 raw → 5 curated) ──
    console.log(`[suggest-projects] Running Stage 3 self-critique & refinement...`);
    const stage3Prompt = `You are a Senior Judge & Venture Reviewer performing the FINAL quality gate.
Critique and refine these raw ideas into final, production-ready hackathon/interview project blueprints.

STRICT FILTERING RULES:
1. REJECT any project that could be described as "yet another X wrapper" or "basic Y with AI"
2. REJECT any project whose problem statement doesn't name a specific industry pain point
3. If two projects share similar core approaches, KEEP only the stronger one and REPLACE the weaker with a genuinely different concept
4. Every project must have a clear, defensible technical moat and realistic 36-hour build plan
5. Output exactly 5 curated projects from the 6 raw ideas (drop the weakest)

RAW IDEAS:
${JSON.stringify(stage2Output.raw_ideas || [], null, 2)}

STUDENT STACK:
${profile.skills.map(s => s.name).join(", ")}

Produce the final curated blueprints. Return ONLY this JSON:
{
  "projects": [
    {
      "id": "proj-1",
      "title": "Clear Name",
      "tagline": "One sentence punchy elevator pitch",
      "problem_statement": "The exact painful problem being solved — must name a specific industry, regulation, or bottleneck",
      "architecture": "Architecture and data flow overview",
      "tech_stack": ["React", "Next.js", "Python", "FastAPI"],
      "winning_moat": "Why this beats 99% of submissions",
      "mvp_timeline": [
        {"hours": "0-12h", "task": "Core pipeline setup and schema design"},
        {"hours": "12-24h", "task": "AI agent loop and API integrations"},
        {"hours": "24-36h", "task": "UI polish, demo script and edge-case testing"}
      ],
      "demo_wow_factor": "The exact 30-second live demo moment that gets judges to vote YES",
      "potential_judge_question": "What is the hardest technical challenge here and how do you defend it?"
    }
  ]
}`;

    const s3Res = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [{ role: "user", content: stage3Prompt }],
        max_tokens: 4000,
        temperature: 0.2,
        response_format: { type: "json_object" }
      })
    });

    const s3Data = await s3Res.json();
    const finalResult = extractJSON(s3Data.choices?.[0]?.message?.content || "{}");

    // Persist idempotently
    await saveProjectSuggestions(candidateId, opportunityId, {
      opportunity_id: opportunityId,
      stage1_cached: stage1Cached,
      generated_at: new Date().toISOString(),
      projects: finalResult.projects || []
    });

    return NextResponse.json({
      success: true,
      stage1Cached,
      opportunityTitle: opp.title,
      projects: finalResult.projects || []
    });
  } catch (err: any) {
    console.error("[suggest-projects POST] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
