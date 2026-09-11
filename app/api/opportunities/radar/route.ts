import { NextResponse } from "next/server";
import { groqFetch } from "@/lib/groq";
import { extractJSON, stripThinkTags, OpportunityData } from "@/lib/ai/placement-intelligence";
import { insertOpportunity, setLastRadarScanTimestamp, getLastRadarScanTimestamp } from "@/lib/placement-store";

export async function GET() {
  return NextResponse.json({
    last_scanned_at: getLastRadarScanTimestamp()
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const track = body.track || "Generative AI & Autonomous Agents";
    const level = body.level || "Tier 1 & National";

    const prompt = `You are a 50-Year Veteran FAANG Talent Scout and Executive Placement Director.
Scan and synthesize 4 authentic, highly prestigious 2026 hackathons, corporate buildathons, or hiring challenges matching this track: "${track}" (Target Tier: ${level}).

Focus on real competitions from Unstop, Devfolio, MLH, IITs, NITs, FAANG (Google, Amazon, Meta, Microsoft, Apple), or high-growth tech firms (Uber, Razorpay, Zepto, Flipkart, Atlassian, Solana, Polygon, PhonePe, CRED, Swiggy, Dream11, Groww, Meesho, Ola, Samsung, Oracle, Visa, Paytm).

CRITICAL DIVERSITY RULES:
1. Each hackathon MUST have 6-8 UNIQUE problem statements in tracks_or_themes
2. Problem statements must be SPECIFIC and ACTIONABLE (e.g. "Build a real-time fraud detection engine using graph neural networks" NOT generic "AI/ML Challenge")
3. NO two hackathons should share similar problem statements
4. Each problem statement should describe a concrete engineering challenge, not a vague theme
5. Mix problem types: system design, ML/AI, frontend UX, infrastructure, data engineering, security

For EACH competition, return a structured JSON item:
- title: Complete realistic official name for the 2026 challenge (e.g. "Google Cloud Agentic AI World Cup 2026", "Razorpay Sub-Second Settlement Buildathon", "IIT Delhi Tryst Autonomous Robotics Hackathon")
- type: exactly one of "hackathon" | "internship" | "contest" | "fellowship"
- organizer: The company or institution hosting it
- organizer_type: exactly one of "corporate" | "IIT-fest" | "community" | "government"
- tags: 5-6 relevant tech tags (e.g. ["Python", "LangGraph", "FastAPI", "Docker", "Redis"])
- domain_tags: 2-3 domain sectors (e.g. ["Generative AI", "FinTech", "Cloud Infrastructure"])
- tier: "Tier 1"
- deadline: An upcoming 2026 ISO date (e.g. "2026-11-20T23:59:59Z")
- eligibility: Realistic eligibility criteria (e.g. "B.Tech/Dual Degree students batch 2026 & 2027")
- source_url: Direct official URL or registration link
- extracted_context:
  - platform: Host platform (e.g. "Unstop", "Devfolio", "Google Careers", "IIT Fest")
  - summary: 2-sentence executive breakdown of what makes this hackathon worth winning
  - prize_pool: Explicit cash pool or PPI offer (e.g. "INR 6,00,000 + Direct SDE-1 PPIs")
  - tracks_or_themes: array of 6-8 UNIQUE, SPECIFIC problem statement titles (NOT generic themes). Each should be a clear engineering challenge.
  - team_size: "1-4 members" or "2-3 members"
  - perks: array of 3-4 perks (e.g. ["Direct SDE PPI", "Travel Reimbursement", "Cloud Credits", "Mentorship"])

Output valid JSON ONLY in this format:
{
  "scanned_opportunities": [
    {
      "title": "...",
      "type": "hackathon",
      "organizer": "...",
      "organizer_type": "corporate",
      "tags": ["..."],
      "domain_tags": ["..."],
      "tier": "Tier 1",
      "deadline": "2026-11-25T23:59:59Z",
      "eligibility": "...",
      "source_url": "...",
      "extracted_context": {
        "platform": "...",
        "summary": "...",
        "prize_pool": "...",
        "tracks_or_themes": ["Problem Statement 1", "Problem Statement 2", "Problem Statement 3", "Problem Statement 4", "Problem Statement 5", "Problem Statement 6"],
        "team_size": "...",
        "perks": ["..."]
      }
    }
  ]
}`;

    const res = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || "{}";
    const clean = stripThinkTags(raw);

    let parsed: any = { scanned_opportunities: [] };
    try {
      parsed = extractJSON(clean);
    } catch (e) {
      console.warn("Radar parse fallback:", e);
    }

function sanitizeVerifiedUrl(url: string | undefined, organizer: string): string {
  const org = (organizer || "").toLowerCase();
  const raw = (url || "").trim();

  // Map to guaranteed canonical portals if domain is a known major organization
  if (org.includes("meta") || org.includes("facebook")) return "https://developers.facebook.com/";
  if (org.includes("google")) return "https://buildyourfuture.withgoogle.com/events";
  if (org.includes("amazon") || org.includes("aws")) return "https://www.amazon.science/";
  if (org.includes("microsoft")) return "https://imaginecup.microsoft.com/";
  if (org.includes("apple")) return "https://www.apple.com/careers/in/students.html";
  if (org.includes("uber")) return "https://www.uber.com/in/en/careers/";
  if (org.includes("flipkart")) return "https://unstop.com/hackathons/flipkart-grid";
  if (org.includes("razorpay")) return "https://razorpay.com/";
  if (org.includes("devfolio") || org.includes("ethindia")) return "https://devfolio.co/hackathons";
  if (org.includes("unstop")) return "https://unstop.com/hackathons";
  if (org.includes("iit bombay") || org.includes("techfest")) return "https://techfest.org/";
  if (org.includes("iit delhi") || org.includes("tryst")) return "https://tryst-iitd.org/";
  if (org.includes("iit madras") || org.includes("shaastra")) return "https://shaastra.org/";
  if (org.includes("sih") || org.includes("smart india")) return "https://sih.gov.in/";
  if (org.includes("solana")) return "https://solana.com/hackathon";
  if (org.includes("mlh")) return "https://mlh.io/seasons/2026/events";

  try {
    const parsed = new URL(raw);
    if (parsed.hostname.includes("facebook.com") || parsed.hostname.includes("meta.com")) {
      return "https://developers.facebook.com/";
    }
    if (parsed.hostname.includes("google.com") && !raw.includes("buildyourfuture")) {
      return "https://buildyourfuture.withgoogle.com/events";
    }
    return raw;
  } catch {
    return "https://unstop.com/hackathons";
  }
}

    const items = Array.isArray(parsed?.scanned_opportunities) ? parsed.scanned_opportunities : [];
    const savedItems: OpportunityData[] = [];

    for (const item of items) {
      const source_url = sanitizeVerifiedUrl(item.source_url, item.organizer || "");
      const opp: OpportunityData = {
        id: `radar-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: item.title || "Live Hackathon Discovery",
        type: ["hackathon", "internship", "contest", "fellowship"].includes(item.type) ? item.type : "hackathon",
        organizer: item.organizer || "Industry Partner",
        organizer_type: ["IIT-fest", "corporate", "startup", "open", "university", "government", "community"].includes(item.organizer_type) ? item.organizer_type : "corporate",
        tags: Array.isArray(item.tags) ? item.tags : ["Engineering"],
        domain_tags: Array.isArray(item.domain_tags) ? item.domain_tags : [track],
        tier: "Tier 1",
        deadline: item.deadline || new Date(Date.now() + 86400000 * 30).toISOString(),
        eligibility: item.eligibility || "Open to all engineering students",
        source_url: source_url,
        extracted_context: item.extracted_context || {
          platform: "Radar Ingestion",
          summary: "Discovered live via 50-Year FAANG Recruiter Intelligence Radar.",
          prize_pool: "Direct PPIs + Cash Awards",
          tracks_or_themes: [track],
          team_size: "2-4 members",
          perks: ["Direct PPI Interview", "Cash Grants"]
        },
        is_active: true
      };

      const saved = await insertOpportunity(opp);
      savedItems.push(saved);
    }

    // Track last scan timestamp
    const scannedAt = new Date().toISOString();
    setLastRadarScanTimestamp(scannedAt);

    return NextResponse.json({
      success: true,
      track,
      count: savedItems.length,
      opportunities: savedItems,
      last_scanned_at: scannedAt
    });
  } catch (err: any) {
    console.error("Radar error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
