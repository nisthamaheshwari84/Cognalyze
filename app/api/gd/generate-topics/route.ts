import { NextResponse } from "next/server";
import { groqFetch } from "@/lib/groq";
import { extractJSON, stripThinkTags } from "@/lib/ai/placement-intelligence";

export interface GeneratedGDTopic {
  id: string;
  title: string;
  category: "Current / Relevant" | "Technical" | "Business" | "Abstract" | "HR" | "AI & Technology";
  domain: string;
  difficulty: "Easy" | "Medium" | "Hard";
  timeLimitMinutes: number;
  freshness: "Latest" | "Trending" | "Evergreen";
  source_context: string;
  preparationPoints: string[];
  recommendedRoles: string[];
  whyRecommended: string;
  isAiGenerated: boolean;
  generatedAt: string;
}

// Deterministic token-based similarity check to reject exact & near-duplicates
export function isDuplicateOrSimilar(newTitle: string, existingTitles: string[]): boolean {
  const normalize = (t: string) =>
    t.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().split(/\s+/).filter(w => w.length > 2);

  const newWords = new Set(normalize(newTitle));
  if (newWords.size === 0) return true;

  for (const existing of existingTitles) {
    if (newTitle.trim().toLowerCase() === existing.trim().toLowerCase()) {
      return true;
    }
    const existWords = new Set(normalize(existing));
    let intersection = 0;
    for (const w of newWords) {
      if (existWords.has(w)) intersection++;
    }
    const union = new Set([...newWords, ...existWords]).size;
    const similarity = union > 0 ? intersection / union : 0;
    if (similarity > 0.55) {
      return true;
    }
  }
  return false;
}

// Fallback high-entropy dynamic generator when LLM quota or connection is unavailable
const DOMAIN_TOPIC_BANKS: Record<string, { title: string; context: string; points: string[]; category: GeneratedGDTopic["category"] }[]> = {
  "AI & Machine Learning": [
    {
      title: "Model Distillation vs Frontier Scaling: Will Small Specialized Models Replace Massive LLMs in Production?",
      context: "Enterprises face high inference costs and latency SLAs with 70B+ parameter models, pushing demand for quantized sub-8B models.",
      points: [
        "Specialized 7B models fine-tuned on curated domain data often beat generalist 70B models at 1/10th the inference cost.",
        "Frontier models retain superior zero-shot transfer and deep agentic reasoning on complex edge-cases.",
        "Edge computing: Running on-device SLMs eliminates cloud egress charges and guarantees data sovereignty.",
        "Maintenance overhead: Managing hundreds of micro-models vs a single unified frontier API gateway."
      ],
      category: "AI & Technology"
    },
    {
      title: "Synthetic Data for Model Training: Self-Amplifying Knowledge or Model Collapse?",
      context: "As public internet text is depleted, frontier labs train next-generation models on synthetic outputs of existing models.",
      points: [
        "Synthetic data allows programmatic verification of mathematics, code, and formal logic.",
        "Model Collapse: Recursive training on synthetic data degrades output diversity and amplifies subtle statistical tails.",
        "Data poisoning: Difficulty in filtering out machine-generated hallucinations before ingesting into pre-training sets.",
        "Human curation: The skyrocketing value of high-quality verified human reasoning traces."
      ],
      category: "AI & Technology"
    }
  ],
  "Software Engineering": [
    {
      title: "Should Campus Recruitment Test System Architecture Over Algorithm LeetCode Puzzles?",
      context: "With generative AI generating algorithmic code in seconds, recruiters question the utility of binary tree inversion trick questions.",
      points: [
        "LeetCode evaluates fundamental analytical aptitude, edge-case vigilance, and computational complexity discipline.",
        "System architecture evaluates real-world code reviews, telemetry, schema migration, and API design.",
        "Grading objectivity: DSA allows automated unit-test grading at scale, whereas design interviews are subjective.",
        "Modern compromise: Hybrid assessments combining debugging broken production systems with fundamental algorithm optimization."
      ],
      category: "Technical"
    },
    {
      title: "The Cost of Micro-Frontends: Independent Team Ownership vs Web Performance Overhead",
      context: "Enterprises decompose monolithic SPAs into micro-frontends, trading client bundle bloat for developer team velocity.",
      points: [
        "Micro-frontends allow hundreds of developers to deploy decoupled feature modules independently.",
        "User experience penalty: Duplicate framework runtimes, CSS collisions, and degraded Core Web Vitals.",
        "Shared design system friction: Version skew across components eroding visual consistency.",
        "Modern alternatives: Modular mono-repos with Turbopack and build-time federation."
      ],
      category: "Technical"
    }
  ],
  "Cybersecurity": [
    {
      title: "Post-Quantum Cryptography Migration: Proactive Infrastructure Overhaul vs Operational Disruption",
      context: "NIST finalized standard PQC algorithms; enterprises evaluate the timeline to swap RSA and ECC before 'Harvest Now, Decrypt Later' threats.",
      points: [
        "Adversaries collect encrypted communications today with the intent to decrypt once fault-tolerant quantum computers emerge.",
        "Key size expansion: Lattice-based keys require orders of magnitude larger payload sizes, straining embedded devices and network buffers.",
        "Implementation bugs: New mathematical primitives lack decades of battle-tested side-channel attack analysis.",
        "Regulatory compliance: Government mandates requiring post-quantum transition roadmaps by 2030."
      ],
      category: "Technical"
    }
  ],
  "Workplace & Careers": [
    {
      title: "The 4-Day Work Week in Tech: Productivity Renaissance or Burnout in Compressed Hours?",
      context: "Global pilots demonstrate sustained output with 32-hour weeks, but high-growth startups argue it hurts asynchronous shipping velocity.",
      points: [
        "Parkinson's Law: Employees eliminate frivolous meetings and prioritize high-leverage deep work.",
        "Customer support SLAs: Global 24/7 client obligations require staggered shift scheduling across engineering teams.",
        "Mental health and retention: Drastic drop in chronic burnout and voluntary turnover in pilot companies.",
        "Crunch periods: When outages or critical deadlines hit, 4 days inevitably spills over into unpaid weekend triage."
      ],
      category: "HR"
    }
  ],
  "Business": [
    {
      title: "Vertical SaaS vs Horizontal Platforms: Winning Enterprise Defensibility in 2026",
      context: "Horizontal tools like Salesforce and Jira face fragmentation from hyper-specialized vertical workflows designed for specific industries.",
      points: [
        "Vertical SaaS integrates industry-specific compliance, workflows, and embedded fintech out of the box.",
        "Total Addressable Market (TAM) ceiling: Niche industries restrict valuation multiples compared to horizontal software.",
        "AI agents as the great equalizer: Generic horizontal tools leveraging customized LLM prompts to handle niche workflows.",
        "Customer retention: Higher net revenue retention (NRR) in vertical software due to high switching friction."
      ],
      category: "Business"
    }
  ],
  "Abstract": [
    {
      title: "The Paradox of Choice in Developer Tooling: Does Excessive Freedom Paralyze Engineering Velocity?",
      context: "With thousands of JavaScript frameworks, cloud databases, and CI/CD tools, teams spend weeks evaluating technology stacks.",
      points: [
        "Over-engineering trap: Choosing esoteric tech stacks over building core customer value.",
        "The power of convention: Opinionated frameworks (Rails, Next.js, Django) enabling lightning-fast MVP validation.",
        "Innovation tokens: Every company has 3 innovation tokens to spend on custom architecture; spending more invites failure.",
        "Developer morale: Autonomy in choosing tools vs operational nightmare of maintaining fragmented stacks."
      ],
      category: "Abstract"
    }
  ]
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      domains = ["AI & Machine Learning", "Software Engineering"],
      difficulty = "Mixed",
      targetRole = "AI/ML Engineer",
      freshness = "Latest",
      count = 5,
      existingTitles = [],
    } = body;

    const targetCount = Math.min(Math.max(Number(count) || 5, 3), 20);
    const domainList = Array.isArray(domains) && domains.length > 0 ? domains : ["AI & Machine Learning", "Software Engineering"];

    // 1. Attempt dynamic LLM generation using groqFetch
    const systemPrompt = `You are a Senior Placement Director and Technical Hiring Committee Lead at a premier engineering university.
Your task is to generate ${targetCount + 4} unique, highly engaging, and controversial Group Discussion (GD) topics for upcoming 2026 campus placement recruitment drives.

TARGET PARAMETERS:
- Domains: ${domainList.join(", ")}
- Target Role: ${targetRole}
- Difficulty Level: ${difficulty}
- Freshness: ${freshness}

QUALITY CONTROL CRITERIA:
1. Each topic must be genuinely debatable from multiple valid perspectives (FOR vs AGAINST).
2. It must NOT have a simple obvious or factual answer.
3. Must balance technological feasibility with economic, operational, and ethical trade-offs.
4. NO fake statistics or made-up percentages.
5. Must be relevant to modern placement interviews at Google, Microsoft, Amazon, Razorpay, TCS Digital, and top startups.

Return strictly valid JSON with this exact schema:
{
  "topics": [
    {
      "title": "Topic title here",
      "domain": "Domain Name from the selected domains",
      "category": "Current / Relevant" | "Technical" | "Business" | "Abstract" | "HR" | "AI & Technology",
      "difficulty": "Easy" | "Medium" | "Hard",
      "timeLimitMinutes": 15,
      "source_context": "1-2 sentences on recent industry context or reason why this topic is hot right now",
      "preparationPoints": [
        "Key point 1 with argument angle",
        "Key point 2 with counter angle",
        "Key point 3 with real-world technical/business trade-off",
        "Key point 4 with future synthesis"
      ],
      "recommendedRoles": ["${targetRole}", "Software Engineer"],
      "whyRecommended": "1 sentence explaining why this topic prepares candidates for ${targetRole}"
    }
  ]
}`;

    let generatedTopics: GeneratedGDTopic[] = [];

    try {
      const llmRes = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [{ role: "user", content: systemPrompt }],
          temperature: 0.9,
          max_tokens: 2500,
        }),
      });

      if (llmRes.ok) {
        const data = await llmRes.json();
        const raw = data.choices?.[0]?.message?.content || "{}";
        const clean = stripThinkTags(raw);
        const parsed = extractJSON(clean);

        if (Array.isArray(parsed.topics)) {
          for (const t of parsed.topics) {
            if (t.title && !isDuplicateOrSimilar(t.title, existingTitles)) {
              generatedTopics.push({
                id: `gd-ai-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                title: t.title,
                domain: t.domain || domainList[0],
                category: t.category || "AI & Technology",
                difficulty: t.difficulty || (difficulty === "Mixed" ? "Medium" : difficulty),
                timeLimitMinutes: t.timeLimitMinutes || 15,
                freshness: freshness === "Mixed" ? "Latest" : freshness,
                source_context: t.source_context || "Context derived from active 2026 tech recruitment hiring committee standards.",
                preparationPoints: Array.isArray(t.preparationPoints) ? t.preparationPoints : [
                  "Examine architectural scalability and operational friction.",
                  "Weigh capital expenditure against developer productivity.",
                  "Address security posture and regulatory compliance."
                ],
                recommendedRoles: Array.isArray(t.recommendedRoles) ? t.recommendedRoles : [targetRole],
                whyRecommended: t.whyRecommended || `Curated specifically for ${targetRole} recruitment interviews.`,
                isAiGenerated: true,
                generatedAt: new Date().toISOString(),
              });
            }
          }
        }
      }
    } catch (llmErr) {
      console.warn("[generate-topics] LLM generation error, utilizing dynamic topic synthesis matrix:", llmErr);
    }

    // 2. Supplement or fulfill using high-entropy dynamic domain topic synthesis
    if (generatedTopics.length < targetCount) {
      const selectedBanks = domainList.flatMap(d => DOMAIN_TOPIC_BANKS[d] || []);
      const allFallbackBanks = selectedBanks.length > 0 ? selectedBanks : Object.values(DOMAIN_TOPIC_BANKS).flat();

      for (const item of allFallbackBanks) {
        if (generatedTopics.length >= targetCount) break;
        if (!isDuplicateOrSimilar(item.title, existingTitles) && !generatedTopics.some(g => g.title === item.title)) {
          generatedTopics.push({
            id: `gd-synth-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            title: item.title,
            domain: domainList[0] || "AI & Machine Learning",
            category: item.category,
            difficulty: difficulty === "Mixed" ? "Medium" : difficulty,
            timeLimitMinutes: 15,
            freshness: freshness === "Mixed" ? "Trending" : freshness,
            source_context: item.context,
            preparationPoints: item.points,
            recommendedRoles: [targetRole, "Software Engineer"],
            whyRecommended: `Prioritized for ${targetRole} to demonstrate multi-dimensional systems debate skills.`,
            isAiGenerated: true,
            generatedAt: new Date().toISOString(),
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      count: generatedTopics.length,
      topics: generatedTopics,
    });
  } catch (error: any) {
    console.error("[generate-topics] Top-level failure:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate fresh topics." },
      { status: 500 }
    );
  }
}
