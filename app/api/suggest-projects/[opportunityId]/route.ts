import { NextResponse } from "next/server";
import { groqFetch } from "@/lib/groq";
import { extractJSON } from "@/lib/ai/placement-intelligence";
import {
  getOpportunityById,
  getStudentProfile,
  updateOpportunityExtractedContext,
  getProjectSuggestions,
  saveProjectSuggestions,
  getAllPreviousProjectTitles,
  DEMO_STUDENT_PROFILE
} from "@/lib/placement-store";
import { dynamicPreparationEngine } from "@/lib/opportunities/engines/dynamic-preparation-engine";
import { opportunityService } from "@/lib/opportunities/opportunity-service";
import { CanonicalOpportunity } from "@/lib/opportunities/types";

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

    // 1. Fetch Opportunity from placement store or OpportunityService
    let opp = await getOpportunityById(opportunityId);
    let canonicalOpp: CanonicalOpportunity | undefined;

    if (!opp) {
      canonicalOpp = opportunityService.getAllOpportunities().find(o => o.id === opportunityId || o.sourceId === opportunityId);
      if (canonicalOpp) {
        opp = {
          id: canonicalOpp.id,
          title: canonicalOpp.title,
          type: (canonicalOpp.opportunityType?.toLowerCase() as any) || "hackathon",
          organizer: canonicalOpp.organizer || canonicalOpp.companyName,
          organizer_type: "corporate",
          tags: canonicalOpp.tags || [],
          domain_tags: canonicalOpp.domains || [],
          tier: "Tier 1",
          deadline: canonicalOpp.deadline || new Date(Date.now() + 14 * 86400000).toISOString(),
          eligibility: canonicalOpp.eligibilityRequirements?.[0] || "Open to eligible students",
          source_url: canonicalOpp.sourceUrl,
          extracted_context: {
            platform: canonicalOpp.source,
            summary: canonicalOpp.description,
            prize_pool: canonicalOpp.prize,
            tracks_or_themes: canonicalOpp.domains || [],
            team_size: canonicalOpp.teamSize || "1-3 members"
          }
        };
      }
    } else {
      // Map to CanonicalOpportunity if we have opp from placement store
      canonicalOpp = {
        id: opp.id || opportunityId,
        source: opp.extracted_context?.platform || "Cognalyze Verified",
        sourceType: "UNSTOP",
        sourceUrl: opp.source_url || "",
        applicationUrl: opp.source_url || "",
        companyId: "org-partner",
        companyName: opp.organizer,
        organizer: opp.organizer,
        title: opp.title,
        normalizedTitle: opp.title.toLowerCase(),
        description: opp.extracted_context?.summary || opp.eligibility,
        responsibilities: [],
        location: "Virtual",
        country: "India",
        city: "Online",
        remoteType: "remote",
        employmentType: "internship",
        experienceLevel: "intern",
        educationRequirements: { degreesAllowed: ["All"], fieldsAllowed: ["All"], isMandatory: false },
        graduationRequirements: { isMandatory: false },
        requiredSkills: opp.tags || [],
        preferredSkills: [],
        eligibilityRequirements: [opp.eligibility],
        disqualifiers: [],
        postedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deadline: opp.deadline,
        status: "ACTIVE",
        freshness: "FRESH",
        roleDNA: {
          roleCategory: "Engineering Challenge",
          mustHaveSkills: opp.tags.slice(0, 3),
          preferredSkills: [],
          experienceYearsMin: 0,
          experienceYearsMax: 2,
          educationSummary: opp.eligibility,
          graduationWindow: "Open",
          locationMode: "Remote",
          disqualifiers: []
        },
        createdAt: new Date().toISOString(),
        lastVerifiedAt: new Date().toISOString()
      };
    }

    if (!opp || !canonicalOpp) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    const rawProfile = await getStudentProfile(candidateId);
    const profile = rawProfile || DEMO_STUDENT_PROFILE;

    // 2. Generate Deterministic Evidence-First Preparation Plan
    const deterministicPlan = dynamicPreparationEngine.generatePreparationPlan(canonicalOpp, null);
    const classification = deterministicPlan.classification;

    // Build anti-repetition blocklist from all previously generated project titles
    const previousTitles = getAllPreviousProjectTitles(candidateId);
    const blocklist = previousTitles.length > 0
      ? `\n\nDO NOT REPEAT BLOCKLIST:\n${previousTitles.map((t, i) => `${i + 1}. "${t}"`).join("\n")}`
      : "";

    const tracksOrThemes = opp.extracted_context?.tracks_or_themes || [];
    const tracksSection = tracksOrThemes.length > 0
      ? `\n- SPECIFIC PROBLEM STATEMENTS / TRACKS:\n${tracksOrThemes.map((t: string, i: number) => `  ${i + 1}. ${t}`).join("\n")}`
      : "";

    // ── STAGE 1: Opportunity Context Deep Extraction ──
    let stage1Context = opp.extracted_context?.stage1_deep_context;
    let stage1Cached = true;

    if (!stage1Context) {
      stage1Cached = false;
      const stage1Prompt = `You are a Principal Technical Architect.
Analyze this opportunity to identify core friction points, hidden constraints, and high-scoring angles.

OPPORTUNITY:
Title: ${opp.title} (${opp.type})
Organizer: ${opp.organizer} (${opp.organizer_type})
Classification: ${classification}
Tags: ${opp.tags.join(", ")}
Summary: ${opp.extracted_context?.summary || opp.eligibility}
Tracks: ${tracksOrThemes.join(", ")}

Extract in JSON format:
{
  "core_problem_spaces": ["Problem 1 with real friction", "Problem 2"],
  "judge_scoring_priorities": ["What judges actually reward most in this event"],
  "technical_depth_requirements": "Level of architecture expected",
  "winning_moat": "What separates top winning submissions from standard clones",
  "difficulty_tier": "high",
  "deadline_if_mentioned": "${opp.deadline || "null"}"
}
RULE FOR DATES: Never guess a date. If not clearly stated, use null.`;

      try {
        const s1Res = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.GROQ_API_KEY}` },
          body: JSON.stringify({
            model: "openai/gpt-oss-120b",
            messages: [{ role: "user", content: stage1Prompt }],
            max_tokens: 1200,
            temperature: 0.2,
            response_format: { type: "json_object" }
          })
        });

        const s1Data = await s1Res.json();
        stage1Context = extractJSON(s1Data.choices?.[0]?.message?.content || "{}");
        await updateOpportunityExtractedContext(opportunityId, {
          stage1_deep_context: stage1Context,
          deadline_if_mentioned: stage1Context?.deadline_if_mentioned || opp.deadline || null,
          difficulty_tier: stage1Context?.difficulty_tier || "medium"
        });
      } catch (e) {
        console.warn("[suggest-projects] Groq Stage 1 fallback to deterministic context:", e);
        stage1Context = {
          core_problem_spaces: [deterministicPlan.whatOpportunityAsks],
          judge_scoring_priorities: deterministicPlan.judgingAlignment.map(j => j.criterion),
          technical_depth_requirements: deterministicPlan.architecture.overview,
          winning_moat: deterministicPlan.demoMoment.whyItProvesSuccess,
          difficulty_tier: "high",
          deadline_if_mentioned: opp.deadline || null
        };
      }
    }

    // ── STAGE 2 & 3: Generate Opportunity-Specific Projects Grounded in Opportunity DNA ──
    const isRazorpay = `${opp.title} ${opp.organizer}`.toLowerCase().includes("razorpay");
    const isContest = classification === "CODING_CONTEST" || classification === "DSA_CONTEST";
    const isKaggle = classification === "ML_COMPETITION";
    const isOpenSource = classification === "OPEN_SOURCE_PROGRAM";

    const stage3Prompt = `You are a Principal Solutions Architect generating evidence-first project blueprints tailored specifically for:
Opportunity: ${opp.title} (${opp.organizer})
Opportunity Classification: ${classification}
${isRazorpay ? "CRITICAL RAZORPAY REQUIREMENT: The solution MUST integrate Razorpay Payment/Orders APIs or Webhooks. DO NOT inject Kafka or Kubernetes unless high throughput streaming is explicitly justified." : ""}
${isContest ? "CRITICAL CONTEST REQUIREMENT: Focus on algorithmic test suites, asymptotic complexity O(N log N), fast I/O, and test case generators." : ""}
${isKaggle ? "CRITICAL ML REQUIREMENT: Focus on cross-validation, feature engineering, and model ensemble pipelines optimizing the metric without leakage." : ""}
${isOpenSource ? "CRITICAL OPEN SOURCE REQUIREMENT: Focus on upstream repository audit, PR workflow, unit test suites, and proposal milestones." : ""}

STUDENT SKILLS:
${profile.skills.map(s => `${s.name} (${s.level})`).join(", ")}

OPPORTUNITY CONTEXT:
- Problem Spaces: ${(stage1Context?.core_problem_spaces || []).join("; ")}
- Judge Priorities: ${(stage1Context?.judge_scoring_priorities || []).join("; ")}${tracksSection}${blocklist}

RULES:
1. NO GENERIC TEMPLATES: Every project must be genuinely designed for ${opp.title}.
2. DEMO MOMENT: Replace generic "WOW Factor" with what the judge sees, why it proves success, and requirement demonstrated.
3. TIMELINE: Produce a realistic milestone timeline (e.g. Phase 1, Phase 2, Phase 3).
4. TECH STACK PROVENANCE: Distinguish between official requirements vs recommendations.

Return JSON in this structure:
{
  "projects": [
    {
      "id": "proj-1",
      "title": "Specific Project Blueprint Name",
      "tagline": "One sentence technical proposition",
      "problem_statement": "Specific problem statement addressing official requirements",
      "target_user": "Specific stakeholder",
      "observed_pain": "Documented friction or failure mode",
      "existing_gap": "Why existing tools fail to solve this",
      "why_it_fits_you": {
        "aligned_skills": ["Skill1", "Skill2"],
        "required_capabilities": ["Capability1"],
        "explanation": "Why this aligns with student evidence"
      },
      "architecture": "Architecture overview without fabricated complexity",
      "tech_stack": ["Tech1", "Tech2", "Tech3"],
      "winning_moat": "Why this fulfills the core judging criteria",
      "mvp_timeline": [
        {"hours": "${deterministicPlan.mvpMilestones[0]?.targetDuration || "Sprint 1"}", "task": "${deterministicPlan.mvpMilestones[0]?.deliverable || "Scaffolding"}"},
        {"hours": "${deterministicPlan.mvpMilestones[1]?.targetDuration || "Sprint 2"}", "task": "${deterministicPlan.mvpMilestones[1]?.deliverable || "Core Features"}"},
        {"hours": "${deterministicPlan.mvpMilestones[2]?.targetDuration || "Sprint 3"}", "task": "${deterministicPlan.mvpMilestones[2]?.deliverable || "Demo & Verification"}"}
      ],
      "demo_moment": {
        "what_judge_sees": "${deterministicPlan.demoMoment.whatJudgeSees}",
        "why_it_proves_success": "${deterministicPlan.demoMoment.whyItProvesSuccess}",
        "requirement_demonstrated": "${deterministicPlan.demoMoment.requirementDemonstrated}"
      },
      "potential_judge_question": "${deterministicPlan.judgeQuestions[0]?.question || "How do you defend this technical architecture?"}"
    }
  ]
}`;

    let finalProjects: any[] = [];

    try {
      const s3Res = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.GROQ_API_KEY}` },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [{ role: "user", content: stage3Prompt }],
          max_tokens: 3500,
          temperature: 0.3,
          response_format: { type: "json_object" }
        })
      });

      const s3Data = await s3Res.json();
      const parsed = extractJSON(s3Data.choices?.[0]?.message?.content || "{}");
      if (parsed.projects && Array.isArray(parsed.projects) && parsed.projects.length > 0) {
        finalProjects = parsed.projects;
      }
    } catch (llmErr) {
      console.warn("[suggest-projects] Groq Stage 3 failed, using deterministic preparation blueprint:", llmErr);
    }

    // If LLM returned empty or failed, fallback gracefully to deterministic preparation plan!
    if (finalProjects.length === 0) {
      finalProjects = [
        {
          id: `proj-evidence-${opp.id}`,
          title: deterministicPlan.headline,
          tagline: `Evidence-backed architecture addressing ${opp.title} requirements`,
          problem_statement: deterministicPlan.whatOpportunityAsks,
          target_user: canonicalOpp.organizer || "System Operators",
          observed_pain: `Manual or unverified integration workflows without end-to-end safeguards`,
          existing_gap: `Existing implementations lack sub-second verification and cryptographic signature validation`,
          why_it_fits_you: {
            aligned_skills: deterministicPlan.whatYouAlreadyHave.slice(0, 3),
            required_capabilities: deterministicPlan.whatYouAreMissing.slice(0, 2),
            explanation: `Requirement Evidence Coverage: ${deterministicPlan.requirementEvidenceCoverage.coveragePercentage}% based on your Student DNA.`
          },
          architecture: deterministicPlan.architecture.overview,
          tech_stack: deterministicPlan.architecture.components.map(c => c.technology),
          winning_moat: deterministicPlan.demoMoment.whyItProvesSuccess,
          mvp_timeline: deterministicPlan.mvpMilestones.map(m => ({ hours: m.targetDuration, task: m.deliverable })),
          demo_moment: {
            what_judge_sees: deterministicPlan.demoMoment.whatJudgeSees,
            why_it_proves_success: deterministicPlan.demoMoment.whyItProvesSuccess,
            requirement_demonstrated: deterministicPlan.demoMoment.requirementDemonstrated
          },
          potential_judge_question: deterministicPlan.judgeQuestions[0]?.question || "How do you defend this technical architecture?"
        }
      ];
    }

    // Persist idempotently
    await saveProjectSuggestions(candidateId, opportunityId, {
      opportunity_id: opportunityId,
      stage1_cached: stage1Cached,
      generated_at: new Date().toISOString(),
      projects: finalProjects
    });

    return NextResponse.json({
      success: true,
      stage1Cached,
      opportunityTitle: opp.title,
      classification,
      preparationPlan: deterministicPlan,
      projects: finalProjects
    });
  } catch (err: any) {
    console.error("[suggest-projects POST] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
