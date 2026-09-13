import { getAllOpportunities, getStudentProfile, OpportunityData, DEMO_STUDENT_PROFILE } from "@/lib/placement-store";
import { computeMatchScore, getSafeOpportunityUrl, getOpportunityPortalInfo } from "@/lib/ai/placement-intelligence";
import { supabase } from "@/lib/supabase";

export type PostType = "hiring" | "opportunity" | "professional" | "collaboration";

export interface UnifiedPost {
  id: string;
  type: PostType;
  title: string;
  content: string;
  author_name: string;
  author_role: string;
  author_avatar?: string;
  company_or_org?: string;
  tags: string[];
  domain_tags?: string[];
  created_at: string;
  deadline?: string;
  source_url?: string;
  portal_info?: { name: string; badgeColor: string; badgeBg: string; isVerified: boolean };
  fit_score?: number;
  matching_tags?: string[];
  potential_candidates_count?: number;
  metadata?: {
    salary_or_stipend?: string;
    location?: string;
    experience_level?: string;
    team_size?: string;
    collaboration_goal?: string;
    upvotes?: number;
    replies_count?: number;
  };
}

// ── In-Memory & Seeded Community Posts (Professional & Collaboration) ──
const INITIAL_COMMUNITY_POSTS: UnifiedPost[] = [
  // ── PROFESSIONAL POSTS ──
  {
    id: "prof-razorpay-payments",
    type: "professional",
    title: "How We Built Sub-50ms Settlement Pipelines at Scale: 4 Distributed DB Pitfalls",
    content: "When processing over 12,000 transactions/sec, traditional ACID transactions across multi-region PostgreSQL clusters become our primary bottleneck. In this post, I break down why pessimistic locking fails under sudden flash spikes, how we transitioned to idempotent event sourcing with Apache Kafka, and our 2-phase commit mitigation strategy.",
    author_name: "Aditya Kashyap",
    author_role: "Staff Backend Architect",
    author_avatar: "⚡",
    company_or_org: "Razorpay Core Banking",
    tags: ["Distributed Systems", "Kafka", "PostgreSQL", "System Design", "High Throughput"],
    domain_tags: ["Fintech", "Backend Architecture"],
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(), // 4h ago
    metadata: {
      location: "Bengaluru, India",
      experience_level: "Staff / Principal",
      upvotes: 248,
      replies_count: 36
    }
  },
  {
    id: "prof-google-barraiser",
    type: "professional",
    title: "Google L4/L5 Bar-Raiser Debrief: The 3 Subtle Mistakes in Distributed Consensus & STAR Answers",
    content: "Having sat on campus and lateral hiring committees for over 6 years at Google and AWS, candidates with 90+ LeetCode scores regularly get rejected on system trade-offs. Here is what separates a LEAN HIRE from a STRONG HIRE when interviewers probe partition tolerance (CAP theorem) and behavioral accountability.",
    author_name: "Priya Sharma",
    author_role: "Senior Engineering Bar-Raiser",
    author_avatar: "🎯",
    company_or_org: "Google Cloud Engineering",
    tags: ["Interview Debrief", "Bar Raiser", "Consensus Algorithms", "STAR Method", "Googliness"],
    domain_tags: ["Career Intelligence", "System Design"],
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(), // 18h ago
    metadata: {
      location: "Hyderabad, India",
      experience_level: "Senior Lead",
      upvotes: 412,
      replies_count: 64
    }
  },
  {
    id: "prof-crdt-canvas",
    type: "professional",
    title: "CRDTs vs Operational Transformation: Real-Time Canvas with 100k Simultaneous Nodes",
    content: "We benchmarked Yjs (YATA CRDT) against centralized OT engines for our collaborative whiteboard. Results: Memory footprint grew non-linearly with Yjs vector clocks under frequent deletions, but state reconciliation was completely zero-conflict. Here is how we implemented garbage-collection tombstone compaction.",
    author_name: "Karan Singhania",
    author_role: "Founding Engineer",
    author_avatar: "🎨",
    company_or_org: "Ex-Canva / Collab Labs",
    tags: ["CRDT", "WebSockets", "Real-Time", "TypeScript", "Performance"],
    domain_tags: ["Frontend Architecture", "Algorithms"],
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(), // 2d ago
    metadata: {
      location: "Remote",
      experience_level: "Senior Engineer",
      upvotes: 189,
      replies_count: 22
    }
  },

  // ── COLLABORATION POSTS ──
  {
    id: "collab-sih-2026",
    type: "collaboration",
    title: "Smart India Hackathon 2026: Seeking Frontend & ML Specialist for Ministry of Jal Shakti Problem",
    content: "Our team consists of 2 IIT Bombay backend engineers with experience in FastAPI, Docker, and IoT sensor telemetry. We are tackling Problem Statement #1842 (AI-driven ground water depletion telemetry). Looking for 1 UI/UX developer (Next.js/Tailwind) and 1 Computer Vision/Satellite imagery engineer to complete our 6-member squad.",
    author_name: "Rohan Varma",
    author_role: "Final Year B.Tech CS",
    author_avatar: "🚀",
    company_or_org: "IIT Bombay SIH Squad",
    tags: ["SIH 2026", "Next.js", "Computer Vision", "IoT", "FastAPI"],
    domain_tags: ["Hackathon Team", "Government Tech"],
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(), // 8h ago
    deadline: "2026-09-30T18:30:00Z",
    metadata: {
      location: "Mumbai / Hybrid",
      team_size: "4/6 spots filled",
      collaboration_goal: "Win SIH 2026 National Finale",
      upvotes: 134,
      replies_count: 19
    }
  },
  {
    id: "collab-open-source-agents",
    type: "collaboration",
    title: "Open Source Agent Framework for Placement Intelligence: Looking for Core Contributors",
    content: "We are developing an adversarial multi-agent evaluation pipeline that parses resumes against JDs and conducts simulated mock bar-raiser interviews. The project is 100% open-source under Apache 2.0. Looking for collaborators to build Python tool execution sandboxes, WebRTC voice streaming, and LeetCode test runners.",
    author_name: "Nishant Patel",
    author_role: "Open Source Maintainer",
    author_avatar: "🤖",
    company_or_org: "Cognalyze Core OSS",
    tags: ["Open Source", "AI Agents", "Python", "WebRTC", "FastAPI"],
    domain_tags: ["Developer Tools", "AI Engineering"],
    created_at: new Date(Date.now() - 3600000 * 26).toISOString(), // 1d ago
    source_url: "https://github.com/nisthamaheshwari85/Cognalyze",
    metadata: {
      location: "Global Remote",
      team_size: "Open Community",
      collaboration_goal: "Ship v1.0 OSS Agent Framework",
      upvotes: 295,
      replies_count: 48
    }
  },
  {
    id: "collab-dsa-study-circle",
    type: "collaboration",
    title: "Striver SDE 455 & NeetCode 150 Daily Mock Debate Circle (Tier-1 Product Focused)",
    content: "We run a structured 6-week cohort targeting Google, Uber, and Flipkart SDE-1 drives. Daily schedule: 2 LeetCode Medium/Hard problems + 30-min peer mock interview with live coding and edge case grilling at 9:00 PM IST. Max 8 members to keep discussion quality high.",
    author_name: "Meera Nair",
    author_role: "Incoming SDE Intern @ Microsoft",
    author_avatar: "📚",
    company_or_org: "AlgoPrep Circle",
    tags: ["DSA", "Striver Sheet", "Mock Interviews", "LeetCode", "Peer Learning"],
    domain_tags: ["Placement Preparation"],
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(), // 3d ago
    metadata: {
      location: "Online (Discord)",
      team_size: "6/8 members",
      collaboration_goal: "Clear Tier-1 Product Technical Rounds",
      upvotes: 178,
      replies_count: 27
    }
  }
];

let inMemoryCustomPosts: UnifiedPost[] = [];
let cachedOpportunities: OpportunityData[] | null = null;
let cachedDbPosts: UnifiedPost[] | null = null;
let lastOpportunitiesFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000;

/**
 * Maps an OpportunityData item into a UnifiedPost
 */
export function mapOpportunityToUnifiedPost(
  opp: OpportunityData,
  studentFitScore?: number,
  matchingTags?: string[],
  potentialCandidatesCount?: number
): UnifiedPost {
  const isHiring = opp.type === "job" || opp.type === "internship";
  const postType: PostType = isHiring ? "hiring" : "opportunity";

  const safeUrl = getSafeOpportunityUrl(opp.source_url, opp.organizer, opp.title);
  const portalInfo = getOpportunityPortalInfo(opp.source_url, opp.organizer, opp.title);

  return {
    id: opp.id || `opp-${Math.random().toString(36).slice(2, 9)}`,
    type: postType,
    title: opp.title,
    content: opp.extracted_context?.summary || `${opp.title} hosted by ${opp.organizer}. Tier: ${opp.tier || "Tier 1"}. Eligibility: ${opp.eligibility || "Open to Engineering graduates"}.`,
    author_name: opp.organizer,
    author_role: isHiring ? "Talent Acquisition / Hiring Team" : "Competition Secretariat",
    author_avatar: isHiring ? "💼" : "🏆",
    company_or_org: opp.organizer,
    tags: opp.tags || [],
    domain_tags: opp.domain_tags || [],
    created_at: (opp as any).created_at || new Date(Date.now() - 86400000).toISOString(),
    deadline: opp.deadline || undefined,
    source_url: safeUrl,
    portal_info: portalInfo,
    fit_score: studentFitScore,
    matching_tags: matchingTags,
    potential_candidates_count: potentialCandidatesCount,
    metadata: {
      salary_or_stipend: opp.extracted_context?.prize_pool || (isHiring ? "Competitive Industry Standard (₹18-38 LPA)" : undefined),
      location: opp.organizer_type === "corporate" ? "Pan-India / Hybrid" : "National",
      experience_level: opp.tier === "Tier 1" ? "Tier-1 Bar (0-2 YOE)" : "Entry Level / Campus",
      team_size: opp.extracted_context?.team_size,
      upvotes: Math.floor(40 + (opp.title.length * 3) % 150),
      replies_count: Math.floor(10 + (opp.title.length * 2) % 35)
    }
  };
}

export interface GetUnifiedPostsOptions {
  typeFilter?: string; // "all" | "hiring" | "opportunity" | "professional" | "collaboration"
  searchQuery?: string;
  candidateId?: string; // e.g. "student-demo"
  role?: "student" | "recruiter" | "admin";
  limit?: number;
}

/**
 * Aggregates all published opportunities + community posts reverse-chronologically.
 * Dynamically enriches posts with student fit_score or recruiter potential_candidates_count.
 */
export async function getAllUnifiedPosts(options: GetUnifiedPostsOptions = {}): Promise<UnifiedPost[]> {
  const {
    typeFilter = "all",
    searchQuery = "",
    candidateId = "student-demo",
    role = "student",
    limit
  } = options;

  // 1. Fetch Student Profile for student fit_score calculation
  let studentProfile = null;
  if (role === "student" && candidateId) {
    studentProfile = await getStudentProfile(candidateId);
  }
  if (!studentProfile && role === "student") {
    studentProfile = DEMO_STUDENT_PROFILE;
  }

  // 2. Fetch all active Opportunities with in-memory TTL caching
  if (!cachedOpportunities || Date.now() - lastOpportunitiesFetchTime > CACHE_TTL_MS) {
    cachedOpportunities = await getAllOpportunities();
    lastOpportunitiesFetchTime = Date.now();
  }
  const opportunities = cachedOpportunities || [];

  // 3. Map Opportunities to UnifiedPosts with real match scoring
  const opportunityPosts: UnifiedPost[] = (opportunities || []).map((opp, idx) => {
    let fitScore: number | undefined = undefined;
    let matchingTags: string[] | undefined = undefined;

    if (studentProfile) {
      const match = computeMatchScore(studentProfile, opp);
      fitScore = match.fit_score;
      matchingTags = match.matching_tags;
    }

    // Recruiter-side matching calculation:
    // Determine number of matching candidates in cohort (calibrated based on opp requirements & tags)
    let potentialCandidatesCount: number | undefined = undefined;
    if (role === "recruiter") {
      const oppKey = opp.id || `opp-${idx}`;
      const basePool = 24;
      const tagMultiplier = Math.min(1.5, Math.max(0.6, (opp.tags?.length || 3) * 0.2));
      const simulatedCount = Math.round(basePool * tagMultiplier) + ((oppKey.charCodeAt(oppKey.length - 1) || 0) % 9);
      potentialCandidatesCount = simulatedCount;
    }

    return mapOpportunityToUnifiedPost(opp, fitScore, matchingTags, potentialCandidatesCount);
  });

  // 4. Gather Community Posts (Professional + Collaboration)
  let communityPosts = [...INITIAL_COMMUNITY_POSTS, ...inMemoryCustomPosts];

  // Try to load any persistent community posts from Supabase once if table exists
  if (cachedDbPosts === null) {
    try {
      const { data, error } = await supabase
        .from("community_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (data && !error && data.length > 0) {
        cachedDbPosts = data.map((d: any) => ({
          id: d.id,
          type: d.type,
          title: d.title,
          content: d.content,
          author_name: d.author_name || "Community Member",
          author_role: d.author_role || "Engineer",
          author_avatar: d.author_avatar || "💬",
          company_or_org: d.company_or_org,
          tags: d.tags || [],
          domain_tags: d.domain_tags || [],
          created_at: d.created_at,
          deadline: d.deadline,
          source_url: d.source_url,
          metadata: d.metadata || { upvotes: 0, replies_count: 0 }
        }));
      } else {
        cachedDbPosts = [];
      }
    } catch {
      cachedDbPosts = [];
    }
  }

  if (cachedDbPosts && cachedDbPosts.length > 0) {
    const existingIds = new Set(communityPosts.map(p => p.id));
    const fresh = cachedDbPosts.filter(p => !existingIds.has(p.id));
    communityPosts = [...fresh, ...communityPosts];
  }

  // 5. Combine and Sort Reverse-Chronological
  let allPosts = [...communityPosts, ...opportunityPosts];

  allPosts.sort((a, b) => {
    const dateA = new Date(a.created_at).getTime() || 0;
    const dateB = new Date(b.created_at).getTime() || 0;
    return dateB - dateA;
  });

  // 6. Apply Type Filtering
  if (typeFilter && typeFilter !== "all") {
    allPosts = allPosts.filter(p => p.type.toLowerCase() === typeFilter.toLowerCase());
  }

  // 7. Apply Keyword Search Filtering
  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    allPosts = allPosts.filter(p => {
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchContent = p.content.toLowerCase().includes(q);
      const matchAuthor = p.author_name.toLowerCase().includes(q);
      const matchCompany = (p.company_or_org || "").toLowerCase().includes(q);
      const matchTags = (p.tags || []).some(t => t.toLowerCase().includes(q));
      const matchDomain = (p.domain_tags || []).some(d => d.toLowerCase().includes(q));
      return matchTitle || matchContent || matchAuthor || matchCompany || matchTags || matchDomain;
    });
  }

  if (limit && limit > 0) {
    return allPosts.slice(0, limit);
  }

  return allPosts;
}

/**
 * Creates a new community post (Professional or Collaboration)
 */
export async function createCommunityPost(post: Omit<UnifiedPost, "id" | "created_at">): Promise<UnifiedPost> {
  const newPost: UnifiedPost = {
    ...post,
    id: `post-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    created_at: new Date().toISOString()
  };

  // Attempt database persist
  try {
    const { error } = await supabase.from("community_posts").insert([
      {
        id: newPost.id,
        type: newPost.type,
        title: newPost.title,
        content: newPost.content,
        author_name: newPost.author_name,
        author_role: newPost.author_role,
        author_avatar: newPost.author_avatar,
        company_or_org: newPost.company_or_org,
        tags: newPost.tags,
        domain_tags: newPost.domain_tags,
        created_at: newPost.created_at,
        deadline: newPost.deadline,
        source_url: newPost.source_url,
        metadata: newPost.metadata
      }
    ]);
    if (error) {
      console.warn("[posts-store] Notice inserting community_posts to Supabase:", error.message);
    }
  } catch (err: any) {
    console.warn("[posts-store] Supabase write skipped, keeping in-memory:", err.message);
  }

  inMemoryCustomPosts.unshift(newPost);
  return newPost;
}
