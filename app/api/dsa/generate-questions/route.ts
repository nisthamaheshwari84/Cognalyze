import { NextResponse } from "next/server";
import { groqFetch } from "@/lib/groq";
import { extractJSON, stripThinkTags } from "@/lib/ai/placement-intelligence";
import { addDsaProblem, DsaProblem } from "@/lib/dsa-store";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || "generate_ai";
    const topicId = body.topicId || body.topic_id || "dynamic-programming";
    const stepTitle = body.stepTitle || body.step_title || "Step 16: Dynamic Programming";
    const targetCompany = body.targetCompany || body.company_target;
    const customProblem = body.customProblem || body.problem;

    // Handle Custom Problem Ingestion
    if (action === "custom_add" && customProblem) {
      const newId = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const cleanProb: DsaProblem = {
        id: newId,
        topic_id: customProblem.topic_id || topicId,
        step_title: customProblem.step_title || stepTitle,
        subtopic_title: customProblem.subtopic_title || "Custom Practice Problems",
        title: customProblem.title.trim(),
        difficulty: customProblem.difficulty || "medium",
        problem_url: (customProblem.problem_url || customProblem.url)?.trim() || `https://leetcode.com/problemset/?search=${encodeURIComponent(customProblem.title)}`,
        article_url: customProblem.article_url?.trim() || undefined,
        companies: Array.isArray(customProblem.companies) && customProblem.companies.length > 0
          ? customProblem.companies
          : ["Amazon", "Google"],
        description: customProblem.description?.trim() || `Solve ${customProblem.title} with optimal algorithmic efficiency.`,
        markdown_details: customProblem.markdown_details || customProblem.markdown_statement || `### Problem Statement\n\nSolve **${customProblem.title}**.\n\n### Constraints\n- Standard constraints apply.\n\n### Direct Link\n[Open Problem on LeetCode](${customProblem.problem_url || customProblem.url || `https://leetcode.com/problemset/?search=${encodeURIComponent(customProblem.title)}`})`,
        time_complexity: customProblem.time_complexity || customProblem.time_complexity_target || "O(N)",
        space_complexity: customProblem.space_complexity || "O(1)",
        order_index: 999
      };

      await addDsaProblem(cleanProb);
      return NextResponse.json({ success: true, problem: cleanProb, problems: [cleanProb], message: "Custom problem added successfully!" });
    }

    // AI Generation Pipeline
    const companyContext = targetCompany ? `specifically tailored for technical rounds at ${targetCompany}` : "frequently asked in Tier-1 product companies (Google, Amazon, Microsoft, Flipkart, Uber)";
    const prompt = `You are a Principal Algorithms Engineer and Top-Ranked Competitive Programmer.
Generate 2 distinct, highly authentic, interview-standard DSA practice problems for the curriculum topic: "${topicId}" (${stepTitle}), ${companyContext}.

Do NOT invent non-existent esoteric problems. Use real LeetCode/Codeforces patterns that candidates encounter in actual technical interviews.

For EACH problem, return a JSON object with:
- id: unique string e.g. "ai-dp-123"
- topic_id: "${topicId}"
- step_title: "${stepTitle}"
- subtopic_title: specific subcategory (e.g. "DP on Subsequences", "Shortest Path in DAG", "Monotonic Deque")
- title: exact official problem title (e.g. "Longest Increasing Subsequence", "Cheapest Flights Within K Stops", "Burst Balloons")
- difficulty: exactly one of "easy" | "medium" | "hard"
- problem_url: realistic LeetCode search or direct URL (e.g. "https://leetcode.com/problems/longest-increasing-subsequence/")
- article_url: "https://takeuforward.org/data-structure/striver-dsa-sheet-problems"
- companies: array of 2 to 4 companies that actively ask this (e.g. ["Amazon", "Flipkart", "Google"])
- description: concise 1-2 sentence core requirement
- markdown_details: rich Markdown containing:
  - "### Problem Statement" (concise problem prompt)
  - "### Examples" (Example 1 and Example 2 with Input and Output in code blocks)
  - "### Constraints" (e.g. 1 <= N <= 10^5)
  - "### Intuition & Optimal Approach" (key insight, base case, transitions)
- time_complexity: optimal target (e.g. "O(N log N)", "O(N)", "O(V + E)")
- space_complexity: optimal auxiliary space (e.g. "O(N)", "O(1)")

Respond ONLY with a JSON object in this exact schema:
{
  "problems": [
    {
      "id": "...",
      "topic_id": "${topicId}",
      "step_title": "${stepTitle}",
      "subtopic_title": "...",
      "title": "...",
      "difficulty": "medium",
      "problem_url": "...",
      "article_url": "https://takeuforward.org/data-structure/striver-dsa-sheet-problems",
      "companies": ["..."],
      "description": "...",
      "markdown_details": "...",
      "time_complexity": "...",
      "space_complexity": "..."
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
        max_tokens: 2500
      })
    });

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || "{}";
    const cleaned = stripThinkTags(raw);
    const parsed = extractJSON(cleaned);

    const generatedList: DsaProblem[] = (parsed?.problems || []).map((p: any, idx: number) => ({
      id: p.id || `ai-${topicId}-${Date.now()}-${idx}`,
      topic_id: p.topic_id || topicId,
      step_title: p.step_title || stepTitle,
      subtopic_title: p.subtopic_title || "Advanced Practice",
      title: p.title || "Target Interview Problem",
      difficulty: (["easy", "medium", "hard"].includes(p.difficulty) ? p.difficulty : "medium") as any,
      problem_url: p.problem_url || `https://leetcode.com/problemset/?search=${encodeURIComponent(p.title || "")}`,
      article_url: p.article_url || "https://takeuforward.org/data-structure/striver-dsa-sheet-problems",
      companies: Array.isArray(p.companies) && p.companies.length > 0 ? p.companies : ["Amazon", "Google"],
      description: p.description || `Master this core ${topicId} pattern.`,
      markdown_details: p.markdown_details || `### Problem Statement\n\n${p.description || p.title}\n\n### Target Complexity\nTime: ${p.time_complexity || "O(N)"}, Space: ${p.space_complexity || "O(1)"}`,
      time_complexity: p.time_complexity || "O(N)",
      space_complexity: p.space_complexity || "O(1)",
      order_index: 999
    }));

    // Ingest generated problems into store
    for (const prob of generatedList) {
      await addDsaProblem(prob);
    }

    return NextResponse.json({
      success: true,
      problem: generatedList[0],
      problems: generatedList,
      message: `Successfully generated ${generatedList.length} new interview problems for ${topicId}!`
    });
  } catch (error: any) {
    console.error("POST /api/dsa/generate-questions error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate questions" }, { status: 500 });
  }
}
