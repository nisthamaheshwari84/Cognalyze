"use client";

import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface DsaTopic {
  id: string;
  name: string;
  slug: string;
  description: string;
  order_index: number;
}

interface DsaProgress {
  status: "unsolved" | "attempted" | "solved";
  time_spent_seconds?: number;
  next_review_date?: string | null;
  review_count: number;
  notes?: string | null;
  solved_at?: string | null;
}

interface DsaProblem {
  id: string;
  topic_id: string;
  step_title?: string;
  subtopic_title?: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  problem_url: string;
  article_url?: string;
  video_url?: string;
  companies?: string[];
  description: string;
  markdown_details?: string;
  time_complexity?: string;
  space_complexity?: string;
  progress: DsaProgress;
}

function formatInline(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} style={{ color: "white" }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          style={{
            padding: "2px 5px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: 4,
            color: "#fbbf24",
            fontFamily: "monospace",
            fontSize: 12
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function MarkdownView({ content }: { content: string }) {
  if (!content) return null;
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];

  lines.forEach((line, idx) => {
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={`code-${idx}`}
            style={{
              padding: "12px 14px",
              background: "rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              overflowX: "auto",
              fontSize: 12,
              color: "#a5b4fc",
              fontFamily: "monospace",
              margin: "10px 0"
            }}
          >
            <code>{codeBuffer.join("\n")}</code>
          </pre>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      return;
    }

    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={idx} style={{ fontSize: 17, fontWeight: 800, color: "white", margin: "16px 0 8px" }}>
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3 key={idx} style={{ fontSize: 14, fontWeight: 700, color: "#38bdf8", margin: "14px 0 6px" }}>
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <li key={idx} style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", marginLeft: 20, marginBottom: 4 }}>
          {formatInline(line.slice(2))}
        </li>
      );
    } else if (line.trim().length > 0) {
      elements.push(
        <p key={idx} style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.6, margin: "6px 0" }}>
          {formatInline(line)}
        </p>
      );
    }
  });

  return <div>{elements}</div>;
}

interface DsaSuggestion {
  topic_id: string;
  topic_name: string;
  topic_slug: string;
  message: string;
  recommended_difficulty: "medium" | "hard";
  next_problem?: DsaProblem;
}

interface MilestoneBadge {
  type: string;
  title: string;
  description: string;
  icon: string;
  is_earned: boolean;
  earned_at: string | null;
}

const STRIVER_STEPS_OPTIONS = [
  { id: "arrays", step: "Step 3: Solve Problems on Arrays", topic: "arrays" },
  { id: "binary_search", step: "Step 4: Binary Search", topic: "binary_search" },
  { id: "strings", step: "Step 5: Strings (Basic and Medium)", topic: "strings" },
  { id: "linkedlist", step: "Step 6: Learn LinkedList", topic: "linkedlist" },
  { id: "recursion", step: "Step 7: Recursion & Backtracking", topic: "recursion" },
  { id: "bit_manipulation", step: "Step 8: Bit Manipulation", topic: "bit_manipulation" },
  { id: "stack_queue", step: "Step 9: Stack and Queues", topic: "stack_queue" },
  { id: "sliding_window", step: "Step 10: Sliding Window & Two Pointer", topic: "sliding_window" },
  { id: "heaps", step: "Step 11: Heaps", topic: "heaps" },
  { id: "greedy", step: "Step 12: Greedy Algorithms", topic: "greedy" },
  { id: "binary_trees", step: "Step 13: Binary Trees", topic: "binary_trees" },
  { id: "bst", step: "Step 14: Binary Search Trees", topic: "bst" },
  { id: "graphs", step: "Step 15: Graphs", topic: "graphs" },
  { id: "dynamic_programming", step: "Step 16: Dynamic Programming", topic: "dynamic_programming" },
  { id: "tries", step: "Step 17: Tries", topic: "tries" },
  { id: "sorting", step: "Step 2: Learn Important Sorting Techniques", topic: "sorting" },
  { id: "basics", step: "Step 1: Learn the basics", topic: "basics" },
];

function DsaTrackerContent() {
  const searchParams = useSearchParams();
  const topicParam = searchParams.get("topic");
  const opportunityParam = searchParams.get("for_opportunity");

  const [studentId, setStudentId] = useState("student-demo");
  const [topics, setTopics] = useState<DsaTopic[]>([]);
  const [problems, setProblems] = useState<DsaProblem[]>([]);
  const [loading, setLoading] = useState(true);

  // Dynamic question addition & AI synthesis
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [activeGenStep, setActiveGenStep] = useState<string | null>(null);
  const [showCustomAddModal, setShowCustomAddModal] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [customProblemData, setCustomProblemData] = useState({
    title: "",
    topic_id: "arrays",
    step_title: "Step 3: Solve Problems on Arrays",
    difficulty: "medium" as "easy" | "medium" | "hard",
    companies: "Google, Amazon, Microsoft",
    url: "https://leetcode.com/problems/",
    markdown_statement: "## Problem Statement\n\nGiven an array of integers, solve the challenge optimally.\n\n### Examples\n- **Input**: `nums = [2, 7, 11, 15], target = 9`\n- **Output**: `[0, 1]`",
    time_complexity_target: "O(N)"
  });

  // Filters
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [groupByStep, setGroupByStep] = useState<boolean>(true);
  const [modalProblem, setModalProblem] = useState<DsaProblem | null>(null);

  // Extract all distinct companies that asked questions in this sheet
  const allCompanies = useMemo(() => {
    const set = new Set<string>();
    problems.forEach(p => {
      (p.companies || []).forEach(c => set.add(c));
    });
    return Array.from(set).sort();
  }, [problems]);

  // Adaptive & Cross-feature states
  const [dueProblems, setDueProblems] = useState<DsaProblem[]>([]);
  const [suggestions, setSuggestions] = useState<DsaSuggestion[]>([]);
  const [opportunityReadiness, setOpportunityReadiness] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [badges, setBadges] = useState<MilestoneBadge[]>([]);
  const [goalData, setGoalData] = useState<any>(null);

  // Social states
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isOptedIn, setIsOptedIn] = useState(false);
  const [displayHandle, setDisplayHandle] = useState("");
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [friendCodeInput, setFriendCodeInput] = useState("");
  const [friendSuccessMsg, setFriendSuccessMsg] = useState("");
  const [friendsList, setFriendsList] = useState<any[]>([]);

  // Active view tab
  const [activeTab, setActiveTab] = useState<"problems" | "spaced_review" | "heatmap" | "social" | "badges">("problems");

  // Problem timers & Notes state
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<string>("");

  // Reminder & Calendar Schedule state
  const [reminderModalProblem, setReminderModalProblem] = useState<DsaProblem | null>(null);
  const [reminderDate, setReminderDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split("T")[0];
  });
  const [reminderSuccessMsg, setReminderSuccessMsg] = useState<string>("");
  const [syncWithCalendar, setSyncWithCalendar] = useState<boolean>(true);

  useEffect(() => {
    const stored = localStorage.getItem("cognalyze_student_id") || "student-demo";
    setStudentId(stored);
    loadAllData(stored);
  }, [topicParam, opportunityParam]);

  // Handle timer interval
  useEffect(() => {
    if (activeTimerId) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeTimerId]);

  const loadAllData = async (sId: string) => {
    setLoading(true);
    try {
      const [progRes, dueRes, suggRes, analRes, badgeRes, goalRes, leadRes, friendRes] = await Promise.all([
        fetch(`/api/dsa/progress?studentId=${sId}`),
        fetch(`/api/dsa/due-for-review?studentId=${sId}`),
        fetch(`/api/dsa/suggestions?studentId=${sId}`),
        fetch(`/api/dsa/analytics?studentId=${sId}`),
        fetch(`/api/dsa/badges?studentId=${sId}`),
        fetch(`/api/dsa/goals?studentId=${sId}`),
        fetch(`/api/dsa/social/leaderboard?studentId=${sId}`),
        fetch(`/api/dsa/social/friends?studentId=${sId}`)
      ]);

      const [progData, dueData, suggData, analData, badgeData, goalDataRes, leadData, friendData] = await Promise.all([
        progRes.json(), dueRes.json(), suggRes.json(), analRes.json(), badgeRes.json(), goalRes.json(), leadRes.json(), friendRes.json()
      ]);

      if (progData.topics) setTopics(progData.topics);
      if (progData.problems) setProblems(progData.problems);
      if (dueData.problems) setDueProblems(dueData.problems);
      if (suggData.suggestions) setSuggestions(suggData.suggestions);
      if (analData.heatmap) setAnalytics(analData);
      if (badgeData.badges) setBadges(badgeData.badges);
      if (goalDataRes.daily_target) setGoalData(goalDataRes);
      if (leadData.leaderboard) {
        setLeaderboard(leadData.leaderboard);
        setIsOptedIn(leadData.is_opted_in);
        setDisplayHandle(leadData.my_preference?.display_handle || "");
      }
      if (friendData.friends) setFriendsList(friendData.friends);

      // Handle Topic Deep Link
      if (topicParam) {
        const found = progData.topics?.find((t: DsaTopic) => t.slug === topicParam);
        if (found) setSelectedTopic(found.id);
      }

      // Handle Opportunity Specific View
      if (opportunityParam) {
        const oppRes = await fetch(`/api/dsa/company-readiness?opportunityId=${opportunityParam}&studentId=${sId}`);
        const oppData = await oppRes.json();
        if (oppData.readiness_percentage !== undefined) {
          setOpportunityReadiness(oppData);
        }
      }
    } catch (err) {
      console.error("DSA Tracker load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (problemId: string, nextStatus: "unsolved" | "attempted" | "solved") => {
    let spent = 0;
    if (activeTimerId === problemId) {
      spent = timerSeconds;
      setActiveTimerId(null);
      setTimerSeconds(0);
    }

    try {
      const res = await fetch("/api/dsa/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          problemId,
          status: nextStatus,
          timeSpentSeconds: spent > 0 ? spent : undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        setProblems(prev =>
          prev.map(p => (p.id === problemId ? { ...p, progress: data.progress } : p))
        );
        // Refresh due, analytics, badges
        fetch(`/api/dsa/due-for-review?studentId=${studentId}`).then(r => r.json()).then(d => d.problems && setDueProblems(d.problems));
        fetch(`/api/dsa/badges?studentId=${studentId}`).then(r => r.json()).then(d => d.badges && setBadges(d.badges));
        fetch(`/api/dsa/goals?studentId=${studentId}`).then(r => r.json()).then(setGoalData);
      }
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  const handleReviewAction = async (problemId: string, result: "retained" | "forgot") => {
    try {
      const res = await fetch(`/api/dsa/progress/${problemId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, result })
      });
      const data = await res.json();
      if (data.success) {
        setDueProblems(prev => prev.filter(p => p.id !== problemId));
        setProblems(prev =>
          prev.map(p =>
            p.id === problemId
              ? {
                  ...p,
                  progress: {
                    ...p.progress,
                    review_count: data.review_count,
                    next_review_date: data.next_review_date
                  }
                }
              : p
          )
        );
      }
    } catch (err) {
      console.error("Review action error:", err);
    }
  };

  const handleSaveNotes = async (problemId: string) => {
    try {
      const res = await fetch("/api/dsa/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, problemId, notes: notesDraft })
      });
      const data = await res.json();
      if (data.success) {
        setProblems(prev =>
          prev.map(p => (p.id === problemId ? { ...p, progress: data.progress } : p))
        );
        setEditingNotesId(null);
      }
    } catch (err) {
      console.error("Notes save error:", err);
    }
  };

  const getGoogleCalendarDsaUrl = (prob: DsaProblem, dateStr: string): string => {
    const title = encodeURIComponent(`DSA Review: ${prob.title}`);
    const cleanDate = dateStr.replace(/-/g, "");
    const d = new Date(dateStr + "T00:00:00Z");
    d.setDate(d.getDate() + 1);
    const nextDate = d.toISOString().split("T")[0].replace(/-/g, "");
    const dates = `${cleanDate}/${nextDate}`;
    const details = encodeURIComponent(
      `⚡ Cognalyze DSA Practice & Review\n` +
      `📌 Problem: ${prob.title}\n` +
      `🎯 Difficulty: ${prob.difficulty.toUpperCase()}\n` +
      (prob.step_title ? `📚 Step: ${prob.step_title}\n` : "") +
      (prob.time_complexity ? `⏱️ Target Time: ${prob.time_complexity}\n` : "") +
      (prob.problem_url ? `🔗 LeetCode: ${prob.problem_url}\n` : "") +
      (prob.article_url ? `📖 Striver Article: ${prob.article_url}\n` : "") +
      `\nTrack progress on Cognalyze: http://localhost:3001/student/dsa-tracker`
    );
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=LeetCode`;
  };

  const handleSaveReminder = async (prob: DsaProblem, targetDate: string) => {
    try {
      const res = await fetch("/api/dsa/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          problemId: prob.id,
          nextReviewDate: targetDate
        })
      });
      const data = await res.json();

      if (syncWithCalendar) {
        await fetch("/api/student/calendar/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId,
            title: `DSA Review: ${prob.title}`,
            event_date: targetDate,
            event_type: "reminder",
            notes: `Spaced review reminder for Striver A2Z problem (${prob.difficulty}). LeetCode: ${prob.problem_url}`
          })
        });
      }

      if (data.success) {
        setProblems(prev =>
          prev.map(p =>
            p.id === prob.id
              ? { ...p, progress: { ...p.progress, next_review_date: targetDate } }
              : p
          )
        );
        fetch(`/api/dsa/due-for-review?studentId=${studentId}`)
          .then(r => r.json())
          .then(d => d.problems && setDueProblems(d.problems));

        setReminderSuccessMsg(`Reminder scheduled for ${targetDate}! Synced to Placement Calendar.`);
        setTimeout(() => {
          setReminderSuccessMsg("");
          setReminderModalProblem(null);
        }, 1200);
      }
    } catch (err) {
      console.error("Save reminder error:", err);
    }
  };

  const handleToggleLeaderboard = async () => {
    const nextVal = !isOptedIn;
    setIsOptedIn(nextVal);
    try {
      await fetch("/api/dsa/social/leaderboard/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, isOptedIn: nextVal, displayHandle })
      });
      const leadRes = await fetch(`/api/dsa/social/leaderboard?studentId=${studentId}`);
      const leadData = await leadRes.json();
      if (leadData.leaderboard) setLeaderboard(leadData.leaderboard);
    } catch (err) {
      console.error("Leaderboard toggle error:", err);
    }
  };

  const handleCreateInviteCode = async () => {
    try {
      const res = await fetch("/api/dsa/social/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, action: "create_invite" })
      });
      const data = await res.json();
      if (data.connection_code) setInviteCode(data.connection_code);
    } catch (err) {
      console.error("Create invite error:", err);
    }
  };

  const handleAcceptInviteCode = async () => {
    if (!friendCodeInput.trim()) return;
    try {
      const res = await fetch("/api/dsa/social/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, action: "accept_invite", code: friendCodeInput.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setFriendSuccessMsg("Connected! Mutual progress viewing is now enabled.");
        setFriendCodeInput("");
        const fRes = await fetch(`/api/dsa/social/friends?studentId=${studentId}`);
        const fData = await fRes.json();
        if (fData.friends) setFriendsList(fData.friends);
      } else {
        alert(data.error || "Failed to connect");
      }
    } catch (err) {
      console.error("Accept invite error:", err);
    }
  };

  const handleUpdateGoal = async (target: number) => {
    try {
      const res = await fetch("/api/dsa/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, dailyTarget: target })
      });
      const data = await res.json();
      if (data.success) setGoalData(data);
    } catch (err) {
      console.error("Update goal error:", err);
    }
  };

  const handleTriggerAiGeneration = async (topicId?: string, stepTitle?: string) => {
    setIsGeneratingAi(true);
    if (stepTitle) setActiveGenStep(stepTitle);
    try {
      const targetTopic = topicId || (selectedTopic !== "all" ? selectedTopic : "arrays");
      const res = await fetch("/api/dsa/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_ai",
          topic_id: targetTopic,
          step_title: stepTitle,
          difficulty: selectedDifficulty !== "all" ? selectedDifficulty : "medium",
          company_target: selectedCompany !== "all" ? selectedCompany : undefined
        })
      });
      const data = await res.json();
      const generatedProbs: DsaProblem[] = data.problems || (data.problem ? [data.problem] : []);
      if (data.success && generatedProbs.length > 0) {
        setProblems(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const toAdd = generatedProbs.filter(p => !existingIds.has(p.id));
          return [...toAdd, ...prev];
        });
        const first = generatedProbs[0];
        setActionNotice(`✨ AI Synthesized & Added ${generatedProbs.length} Problem(s): "${first.title}" to ${first.step_title || "Tracker"}!`);
        setTimeout(() => setActionNotice(null), 6000);
      } else {
        setActionNotice(`⚠️ ${data.error || data.message || "AI question synthesis service is momentarily busy. Please try again."}`);
        setTimeout(() => setActionNotice(null), 6000);
      }
    } catch (err) {
      console.error("AI Generation error:", err);
      setActionNotice("⚠️ Network error while connecting to AI question synthesis service.");
      setTimeout(() => setActionNotice(null), 6000);
    } finally {
      setIsGeneratingAi(false);
      setActiveGenStep(null);
    }
  };

  const handleCustomAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customProblemData.title.trim()) {
      alert("Please enter a problem title.");
      return;
    }

    try {
      const companiesArray = customProblemData.companies
        .split(",")
        .map(c => c.trim())
        .filter(Boolean);

      const res = await fetch("/api/dsa/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "custom_add",
          problem: {
            title: customProblemData.title.trim(),
            topic_id: customProblemData.topic_id,
            step_title: customProblemData.step_title,
            difficulty: customProblemData.difficulty,
            companies: companiesArray.length > 0 ? companiesArray : ["Product Tech"],
            url: customProblemData.url.trim() || `https://leetcode.com/problemset/all/?search=${encodeURIComponent(customProblemData.title)}`,
            markdown_statement: customProblemData.markdown_statement,
            time_complexity_target: customProblemData.time_complexity_target || "O(N)"
          }
        })
      });

      const data = await res.json();
      if (data.success && data.problem) {
        setProblems(prev => [data.problem, ...prev]);
        setShowCustomAddModal(false);
        setActionNotice(`🎉 Successfully added "${data.problem.title}" into ${data.problem.step_title}!`);
        setTimeout(() => setActionNotice(null), 6000);
        setCustomProblemData(prev => ({
          ...prev,
          title: "",
          url: "https://leetcode.com/problems/"
        }));
      } else {
        alert(data.error || "Failed to add problem");
      }
    } catch (err) {
      console.error("Custom add error:", err);
      alert("Error saving custom problem.");
    }
  };

  // Filter problems across topic, difficulty, status, company, and search query
  const filteredProblems = useMemo(() => {
    return problems.filter(prob => {
      if (selectedTopic !== "all" && prob.topic_id !== selectedTopic) return false;
      if (selectedDifficulty !== "all" && prob.difficulty !== selectedDifficulty) return false;
      if (selectedStatus === "due_review") {
        const today = new Date().toISOString().split("T")[0];
        if (!prob.progress?.next_review_date || prob.progress.next_review_date > today) return false;
      } else if (selectedStatus === "has_reminder") {
        if (!prob.progress?.next_review_date) return false;
      } else if (selectedStatus !== "all" && prob.progress?.status !== selectedStatus) {
        return false;
      }
      if (selectedCompany !== "all" && !(prob.companies || []).includes(selectedCompany)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = prob.title.toLowerCase().includes(q);
        const matchDesc = prob.description.toLowerCase().includes(q);
        const matchStep = (prob.step_title || "").toLowerCase().includes(q);
        const matchSub = (prob.subtopic_title || "").toLowerCase().includes(q);
        const matchComp = (prob.companies || []).some(c => c.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchStep && !matchSub && !matchComp) return false;
      }
      return true;
    });
  }, [problems, selectedTopic, selectedDifficulty, selectedStatus, selectedCompany, searchQuery]);

  // Group problems by Striver Step
  const groupedProblems = useMemo(() => {
    const map = new Map<string, DsaProblem[]>();
    const order: string[] = [];
    filteredProblems.forEach((p: DsaProblem) => {
      const step = p.step_title || "Other Classic DSA Problems";
      if (!map.has(step)) {
        map.set(step, []);
        order.push(step);
      }
      map.get(step)!.push(p);
    });
    return order.map(step => ({
      step,
      items: map.get(step)!
    }));
  }, [filteredProblems]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? "0" : ""}${secs}s`;
  };

  const renderProblemCard = (prob: DsaProblem) => {
    const isTimerActive = activeTimerId === prob.id;
    const isNotesOpen = editingNotesId === prob.id;
    const diffColor = prob.difficulty === "easy" ? "#00ff88" : prob.difficulty === "medium" ? "#fbbf24" : "#ff4466";
    const status = prob.progress?.status || "unsolved";

    return (
      <div
        key={prob.id}
        style={{
          background: "rgba(255, 255, 255, 0.03)",
          border: isTimerActive ? "1px solid rgba(99, 102, 241, 0.6)" : "1px solid rgba(255, 255, 255, 0.07)",
          borderRadius: 14,
          padding: "1rem 1.25rem",
          transition: "border-color 0.2s, background 0.2s",
          boxShadow: isTimerActive ? "0 0 20px rgba(99, 102, 241, 0.15)" : "none"
        }}
      >
        {/* Top meta row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 6,
                fontWeight: 800,
                textTransform: "capitalize",
                background: `${diffColor}18`,
                color: diffColor,
                border: `1px solid ${diffColor}35`
              }}
            >
              {prob.difficulty === "easy" ? "🟢 Easy" : prob.difficulty === "medium" ? "🟡 Medium" : "🔴 Hard"}
            </span>

            {prob.subtopic_title && (
              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: "rgba(255, 255, 255, 0.06)", color: "rgba(255, 255, 255, 0.75)", fontWeight: 600 }}>
                {prob.subtopic_title}
              </span>
            )}

            {prob.time_complexity && (
              <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 6, background: "rgba(0, 255, 136, 0.08)", color: "#00ff88", border: "1px solid rgba(0, 255, 136, 0.2)" }}>
                ⏱️ {prob.time_complexity}
              </span>
            )}

            {prob.space_complexity && (
              <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 6, background: "rgba(168, 85, 247, 0.08)", color: "#c084fc", border: "1px solid rgba(168, 85, 247, 0.2)" }}>
                💾 {prob.space_complexity}
              </span>
            )}

            {prob.progress?.next_review_date && (
              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: "rgba(251, 191, 36, 0.12)", color: "#fbbf24", border: "1px solid rgba(251, 191, 36, 0.3)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                🔁 Due: {prob.progress.next_review_date} (Box {prob.progress.review_count || 0})
              </span>
            )}
          </div>

          {/* Quick External Links & Modal trigger */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => setModalProblem(prob)}
              style={{
                background: "rgba(99, 102, 241, 0.15)",
                border: "1px solid rgba(99, 102, 241, 0.35)",
                borderRadius: 8,
                color: "#a5b4fc",
                padding: "4px 10px",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5
              }}
            >
              📖 Problem Statement & Intuition
            </button>

            {prob.problem_url && (
              <a
                href={prob.problem_url}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: "#38bdf8",
                  fontSize: 11,
                  fontWeight: 700,
                  textDecoration: "none",
                  padding: "4px 9px",
                  borderRadius: 8,
                  background: "rgba(56, 189, 248, 0.1)",
                  border: "1px solid rgba(56, 189, 248, 0.25)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4
                }}
              >
                LeetCode ↗
              </a>
            )}

            {prob.article_url && (
              <a
                href={prob.article_url}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: "#f59e0b",
                  fontSize: 11,
                  fontWeight: 700,
                  textDecoration: "none",
                  padding: "4px 9px",
                  borderRadius: 8,
                  background: "rgba(245, 158, 11, 0.1)",
                  border: "1px solid rgba(245, 158, 11, 0.25)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4
                }}
              >
                Striver Article ↗
              </a>
            )}
          </div>
        </div>

        {/* Problem Title & Short Description */}
        <div style={{ marginBottom: 10 }}>
          <h4
            onClick={() => setModalProblem(prob)}
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: "white",
              margin: "0 0 4px",
              cursor: "pointer",
              transition: "color 0.15s"
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "#818cf8")}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "white")}
          >
            {prob.title}
          </h4>
          <p style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.6)", margin: 0, lineHeight: 1.5 }}>
            {prob.description}
          </p>
        </div>

        {/* Company Tags */}
        {prob.companies && prob.companies.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            <span style={{ fontSize: 10, color: "rgba(255, 255, 255, 0.4)", fontWeight: 700, letterSpacing: 0.5 }}>
              ASKED IN:
            </span>
            {prob.companies.map(comp => (
              <button
                key={comp}
                onClick={() => setSelectedCompany(selectedCompany === comp ? "all" : comp)}
                style={{
                  background: selectedCompany === comp ? "rgba(56, 189, 248, 0.25)" : "rgba(255, 255, 255, 0.04)",
                  border: selectedCompany === comp ? "1px solid rgba(56, 189, 248, 0.6)" : "1px solid rgba(255, 255, 255, 0.08)",
                  color: selectedCompany === comp ? "#38bdf8" : "rgba(255, 255, 255, 0.7)",
                  padding: "2px 8px",
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                {comp}
              </button>
            ))}
          </div>
        )}

        {/* Control Bar: Timer, Status buttons, Notes */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, borderTop: "1px solid rgba(255, 255, 255, 0.05)", paddingTop: 10 }}>
          {/* Timer & Time Spent */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {isTimerActive ? (
              <button
                onClick={() => {
                  handleUpdateStatus(prob.id, status === "unsolved" ? "attempted" : status);
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 12px",
                  borderRadius: 8,
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  color: "#f87171",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: 999, background: "#ef4444" }} />
                Stop & Save ({formatTime(timerSeconds)})
              </button>
            ) : (
              <button
                onClick={() => {
                  setActiveTimerId(prob.id);
                  setTimerSeconds(0);
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "5px 12px",
                  borderRadius: 8,
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "rgba(255, 255, 255, 0.75)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                ⏱️ Start Timer
              </button>
            )}

            {prob.progress?.time_spent_seconds && prob.progress.time_spent_seconds > 0 ? (
              <span style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.45)" }}>
                Total: {formatTime(prob.progress.time_spent_seconds)}
              </span>
            ) : null}
          </div>

          {/* Status Buttons, Reminder & Notes Drawer Toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => {
                if (isNotesOpen) {
                  setEditingNotesId(null);
                } else {
                  setEditingNotesId(prob.id);
                  setNotesDraft(prob.progress?.notes || "");
                }
              }}
              style={{
                padding: "5px 11px",
                borderRadius: 8,
                background: prob.progress?.notes ? "rgba(168, 85, 247, 0.15)" : "rgba(255, 255, 255, 0.04)",
                border: prob.progress?.notes ? "1px solid rgba(168, 85, 247, 0.35)" : "1px solid rgba(255, 255, 255, 0.08)",
                color: prob.progress?.notes ? "#c084fc" : "rgba(255, 255, 255, 0.6)",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 4
              }}
            >
              📝 {prob.progress?.notes ? "Notes ✓" : "Notes"}
            </button>

            {/* Set Reminder Button */}
            <button
              onClick={() => {
                setReminderModalProblem(prob);
                setReminderDate(prob.progress?.next_review_date || (() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 3);
                  return d.toISOString().split("T")[0];
                })());
              }}
              style={{
                padding: "5px 11px",
                borderRadius: 8,
                background: prob.progress?.next_review_date ? "rgba(251, 191, 36, 0.15)" : "rgba(255, 255, 255, 0.04)",
                border: prob.progress?.next_review_date ? "1px solid rgba(251, 191, 36, 0.4)" : "1px solid rgba(255, 255, 255, 0.08)",
                color: prob.progress?.next_review_date ? "#fbbf24" : "rgba(255, 255, 255, 0.7)",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 4
              }}
              title="Schedule spaced review reminder or sync to Google Calendar"
            >
              🔔 {prob.progress?.next_review_date ? `Review: ${prob.progress.next_review_date.slice(5)}` : "Set Reminder"}
            </button>

            <div style={{ display: "flex", gap: 4 }}>
              {(["unsolved", "attempted", "solved"] as const).map(st => {
                const isCur = status === st;
                const col = st === "solved" ? "#00ff88" : st === "attempted" ? "#fbbf24" : "rgba(255, 255, 255, 0.4)";
                return (
                  <button
                    key={st}
                    onClick={() => handleUpdateStatus(prob.id, st)}
                    style={{
                      padding: "5px 11px",
                      borderRadius: 7,
                      fontSize: 11,
                      fontWeight: isCur ? 800 : 500,
                      border: isCur ? `1px solid ${col}` : "1px solid rgba(255, 255, 255, 0.08)",
                      background: isCur ? `${col}25` : "transparent",
                      color: isCur ? col : "rgba(255, 255, 255, 0.5)",
                      cursor: "pointer",
                      textTransform: "capitalize"
                    }}
                  >
                    {st === "solved" ? "✓ Solved" : st === "attempted" ? "⏳ In Prog" : "○ Reset"}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Private Notes Drawer */}
        {isNotesOpen && (
          <div style={{ marginTop: 12, padding: 12, background: "rgba(0, 0, 0, 0.3)", borderRadius: 10, border: "1px solid rgba(168, 85, 247, 0.25)" }}>
            <div style={{ fontSize: 11, color: "#c084fc", fontWeight: 700, marginBottom: 6 }}>
              Personal Intuition & Edge Cases (Private)
            </div>
            <textarea
              value={notesDraft}
              onChange={e => setNotesDraft(e.target.value)}
              placeholder="Write your key takeaways, edge cases (e.g. integer overflow, empty array), or optimal approach summary..."
              rows={3}
              style={{
                width: "100%",
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: 8,
                color: "white",
                fontSize: 12,
                padding: "8px 10px",
                fontFamily: "inherit",
                resize: "vertical",
                boxSizing: "border-box"
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
              <button
                onClick={() => setEditingNotesId(null)}
                style={{ padding: "4px 10px", borderRadius: 6, background: "transparent", border: "1px solid rgba(255, 255, 255, 0.1)", color: "rgba(255, 255, 255, 0.6)", fontSize: 11, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveNotes(prob.id)}
                style={{ padding: "4px 12px", borderRadius: 6, background: "#6366f1", border: "none", color: "white", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
              >
                Save Notes
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const totalSolved = problems.filter(p => p.progress?.status === "solved").length;

  return (
    <div style={{ minHeight: "100vh", background: "#090d16", color: "#f8fafc", fontFamily: "var(--font-geist-sans), sans-serif", paddingBottom: "5rem" }}>
      {/* Glow Ambient Gradients */}
      <div style={{ position: "fixed", top: 0, left: "20%", width: "600px", height: "400px", background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: 0, right: "10%", width: "500px", height: "400px", background: "radial-gradient(circle, rgba(168,85,247,0.07) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      {/* TOP NAVIGATION BAR */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(9, 13, 22, 0.85)", backdropFilter: "blur(16px)", padding: "0.8rem 1.5rem" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/student" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "white" }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16 }}>⚡</div>
              <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.5px" }}>Cognalyze</span>
            </Link>
            <span style={{ fontSize: 11, padding: "2px 8px", background: "rgba(99,102,241,0.18)", border: "1px solid rgba(99,102,241,0.35)", borderRadius: 6, color: "#818cf8", fontWeight: 700 }}>DSA TRACKER</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, overflowX: "auto" }}>
            {[
              { href: "/student", label: "🎯 Discover" },
              { href: "/student/calendar", label: "📅 Calendar" },
              { href: "/student/dsa-tracker", label: "⚡ DSA Tracker", active: true },
              { href: "/student/practice-interview", label: "🎙️ Mock Interview" },
              { href: "/student/gd-practice", label: "👥 GD Arena" },
              { href: "/student/applications", label: "📋 Pipeline" },
              { href: "/student/community", label: "💡 Question Bank" },
              { href: "/student/onboarding", label: "🚀 Dossier" }
            ].map((item) => (
              <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
                <button
                  style={{
                    padding: "6px 13px",
                    borderRadius: 9,
                    border: item.active ? "1px solid rgba(99,102,241,0.5)" : "1px solid rgba(255,255,255,0.06)",
                    background: item.active ? "rgba(99,102,241,0.18)" : "transparent",
                    color: item.active ? "#ffffff" : "rgba(255,255,255,0.6)",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: item.active ? 700 : 500
                  }}
                >
                  {item.label}
                </button>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT CONTAINER */}
      <main style={{ position: "relative", zIndex: 10, maxWidth: 1240, margin: "0 auto", padding: "2rem 1.5rem" }}>
        {/* HERO METRICS & OVERVIEW */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: "1.75rem" }}>
          <div style={{ padding: "1.2rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16 }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Total Solved</div>
            <div style={{ fontSize: "2rem", fontWeight: 900, color: "#00ff88" }}>{totalSolved} <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>/ {problems.length}</span></div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{Math.round((totalSolved / Math.max(1, problems.length)) * 100)}% Curriculum Cleared</div>
          </div>

          <div
            onClick={() => setActiveTab("spaced_review")}
            style={{
              padding: "1.2rem",
              background: dueProblems.length > 0 ? "rgba(251,191,36,0.08)" : "rgba(255,255,255,0.03)",
              border: dueProblems.length > 0 ? "1px solid rgba(251,191,36,0.3)" : "1px solid rgba(255,255,255,0.07)",
              borderRadius: 16,
              cursor: "pointer",
              transition: "transform 0.15s"
            }}
          >
            <div style={{ fontSize: 11, color: dueProblems.length > 0 ? "#fbbf24" : "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
              Due For Review 🔁
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 900, color: dueProblems.length > 0 ? "#fbbf24" : "#94a3b8" }}>{dueProblems.length}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
              {dueProblems.length > 0 ? "Spaced repetition intervals due today" : "All reviews up to date"}
            </div>
          </div>

          <div style={{ padding: "1.2rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16 }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Daily Goal (Phase 5b)</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: "2rem", fontWeight: 900, color: "#818cf8" }}>
                {goalData?.daily_target || 2} <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>probs/day</span>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {[1, 2, 3, 5].map(t => (
                  <button
                    key={t}
                    onClick={() => handleUpdateGoal(t)}
                    style={{
                      padding: "3px 7px",
                      borderRadius: 6,
                      fontSize: 10,
                      fontWeight: 700,
                      border: goalData?.daily_target === t ? "1px solid #818cf8" : "1px solid rgba(255,255,255,0.1)",
                      background: goalData?.daily_target === t ? "rgba(99,102,241,0.25)" : "transparent",
                      color: goalData?.daily_target === t ? "#c7d2fe" : "rgba(255,255,255,0.5)",
                      cursor: "pointer"
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
              7d Reflection: {goalData?.last_7_days_completion_pct || 0}% ({goalData?.total_solved_7_days || 0} solved)
            </div>
          </div>

          <div style={{ padding: "1.2rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16 }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Milestones Unlocked</div>
            <div style={{ fontSize: "2rem", fontWeight: 900, color: "#ec4899" }}>
              {badges.filter(b => b.is_earned).length} <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>/ {badges.length}</span>
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>Verified milestone badges earned</div>
          </div>
        </div>

        {/* OPPORTUNITY SPECIFIC READINESS BANNER (Phase 2c & 3c) */}
        {opportunityReadiness && (
          <div style={{ padding: "1.25rem 1.5rem", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 16, marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, padding: "2px 8px", background: "rgba(99,102,241,0.3)", borderRadius: 999, color: "#a5b4fc", fontWeight: 700 }}>
                    🎯 TARGET OPPORTUNITY PROBLEM SET
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{opportunityReadiness.opportunity_title}</span>
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>
                  {opportunityReadiness.disclaimer}
                </div>
              </div>
              <div style={{ textAlign: "center", padding: "0.5rem 1.25rem", background: "rgba(0,0,0,0.3)", borderRadius: 12, border: "1px solid rgba(99,102,241,0.3)" }}>
                <div style={{ fontSize: "1.8rem", fontWeight: 900, color: opportunityReadiness.readiness_percentage >= 70 ? "#00ff88" : "#fbbf24" }}>
                  {opportunityReadiness.readiness_percentage}%
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: 1 }}>COVERAGE</div>
              </div>
            </div>
          </div>
        )}

        {/* DIFFICULTY-ADAPTIVE SUGGESTIONS BANNER (Phase 1b) */}
        {suggestions.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: "1.5rem" }}>
            {suggestions.map((sugg, i) => (
              <div key={i} style={{ padding: "1rem 1.25rem", background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.25)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 22 }}>💡</div>
                  <div>
                    <div style={{ fontSize: 11, color: "#c084fc", fontWeight: 700, letterSpacing: 1 }}>DIFFICULTY ADAPTIVE NUDGE</div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 2 }}>{sugg.message}</div>
                  </div>
                </div>
                {sugg.next_problem && (
                  <button
                    onClick={() => {
                      setSelectedTopic(sugg.topic_id);
                      setSearchQuery(sugg.next_problem!.title);
                    }}
                    style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(168,85,247,0.25)", border: "1px solid rgba(168,85,247,0.4)", color: "#e9d5ff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                  >
                    Try {sugg.next_problem.title} →
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CONSISTENCY VS CRAMMING NOTE (Phase 3b) */}
        {analytics?.cramming_analysis?.is_cramming && analytics.cramming_analysis.note && (
          <div style={{ padding: "1rem 1.25rem", background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.25)", borderRadius: 14, display: "flex", alignItems: "center", gap: 12, marginBottom: "1.5rem" }}>
            <div style={{ fontSize: 20 }}>🧠</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
              <strong style={{ color: "#38bdf8" }}>Learning Science Insight: </strong>
              {analytics.cramming_analysis.note}
            </div>
          </div>
        )}

        {/* NAVIGATION TABS */}
        <div style={{ display: "flex", gap: 8, borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "0.75rem", marginBottom: "1.5rem", overflowX: "auto" }}>
          {[
            { key: "problems", label: "📚 Problem Bank" },
            { key: "spaced_review", label: `🔁 Review Deck (${dueProblems.length})` },
            { key: "heatmap", label: "📊 Topic Mastery Heatmap" },
            { key: "social", label: "👥 Social Arena & Leaderboard" },
            { key: "badges", label: "🏆 Milestone Badges" }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                padding: "8px 16px",
                borderRadius: 10,
                border: activeTab === tab.key ? "1px solid rgba(99,102,241,0.5)" : "1px solid rgba(255,255,255,0.05)",
                background: activeTab === tab.key ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.02)",
                color: activeTab === tab.key ? "#ffffff" : "rgba(255,255,255,0.55)",
                fontSize: 13,
                fontWeight: activeTab === tab.key ? 700 : 500,
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── TAB 1: PROBLEMS ─── */}
        {activeTab === "problems" && (
          <div>
            {/* Filters bar */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: "1.25rem", alignItems: "center" }}>
              <input
                type="text"
                placeholder="Search problem, company, topic..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ flex: "1 1 200px", padding: "9px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: 13 }}
              />

              <select
                value={selectedTopic}
                onChange={e => setSelectedTopic(e.target.value)}
                style={{ padding: "9px 12px", borderRadius: 10, background: "#131b2e", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: 13 }}
              >
                <option value="all">All Topics ({topics.length})</option>
                {topics.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>

              <select
                value={selectedDifficulty}
                onChange={e => setSelectedDifficulty(e.target.value)}
                style={{ padding: "9px 12px", borderRadius: 10, background: "#131b2e", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: 13 }}
              >
                <option value="all">All Difficulties</option>
                <option value="easy">🟢 Easy</option>
                <option value="medium">🟡 Medium</option>
                <option value="hard">🔴 Hard</option>
              </select>

              <select
                value={selectedCompany}
                onChange={e => setSelectedCompany(e.target.value)}
                style={{ padding: "9px 12px", borderRadius: 10, background: "#131b2e", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: 13 }}
              >
                <option value="all">🏢 All Companies ({allCompanies.length})</option>
                {allCompanies.map((c: string) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                style={{ padding: "9px 12px", borderRadius: 10, background: "#131b2e", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: 13 }}
              >
                <option value="all">All Statuses</option>
                <option value="due_review">🔔 Due for Review ({dueProblems.length})</option>
                <option value="has_reminder">⏰ Has Scheduled Reminder</option>
                <option value="solved">✓ Solved</option>
                <option value="attempted">⏳ Attempted</option>
                <option value="unsolved">○ Unsolved</option>
              </select>

              <button
                onClick={() => setGroupByStep(!groupByStep)}
                style={{
                  padding: "9px 13px",
                  borderRadius: 10,
                  background: groupByStep ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)",
                  border: groupByStep ? "1px solid rgba(99,102,241,0.5)" : "1px solid rgba(255,255,255,0.1)",
                  color: groupByStep ? "#a5b4fc" : "rgba(255,255,255,0.7)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                {groupByStep ? "📑 Striver Steps View" : "📜 Flat List"}
              </button>

              <button
                onClick={() => handleTriggerAiGeneration()}
                disabled={isGeneratingAi}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "9px 14px",
                  borderRadius: 10,
                  background: isGeneratingAi ? "rgba(168,85,247,0.2)" : "linear-gradient(135deg, rgba(168,85,247,0.25), rgba(99,102,241,0.25))",
                  border: "1px solid rgba(168,85,247,0.5)",
                  color: "#e9d5ff",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: isGeneratingAi ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 10px rgba(168,85,247,0.15)"
                }}
                title="Use Groq AI to synthesize and expand interview questions in this sheet"
              >
                {isGeneratingAi && !activeGenStep ? "⏳ AI Synthesizing..." : "✨ AI Auto-Add Problem"}
              </button>

              <button
                onClick={() => setShowCustomAddModal(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "9px 14px",
                  borderRadius: 10,
                  background: "linear-gradient(135deg, rgba(14,165,233,0.25), rgba(59,130,246,0.25))",
                  border: "1px solid rgba(56,189,248,0.5)",
                  color: "#bae6fd",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 2px 10px rgba(56,189,248,0.15)"
                }}
                title="Add your own custom problem or question link"
              >
                ➕ Quick Add Problem
              </button>

              {(selectedTopic !== "all" || selectedDifficulty !== "all" || selectedStatus !== "all" || selectedCompany !== "all" || searchQuery) && (
                <button
                  onClick={() => { setSelectedTopic("all"); setSelectedDifficulty("all"); setSelectedStatus("all"); setSelectedCompany("all"); setSearchQuery(""); }}
                  style={{ padding: "9px 14px", borderRadius: 10, background: "rgba(255,68,102,0.1)", border: "1px solid rgba(255,68,102,0.3)", color: "#ff4466", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                >
                  Reset Filters
                </button>
              )}
            </div>

            {/* Dynamic Action Notification */}
            {actionNotice && (
              <div style={{
                padding: "12px 16px",
                background: "linear-gradient(135deg, rgba(0, 255, 136, 0.15), rgba(56, 189, 248, 0.15))",
                border: "1px solid rgba(0, 255, 136, 0.4)",
                borderRadius: 14,
                color: "#a7f3d0",
                fontSize: 13,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
                boxShadow: "0 4px 18px rgba(0, 255, 136, 0.12)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 18 }}>🚀</span>
                  <span>{actionNotice}</span>
                </div>
                <button
                  onClick={() => setActionNotice(null)}
                  style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 16, padding: "2px 6px" }}
                >
                  ✕
                </button>
              </div>
            )}

            {/* Active Review Reminders Due Banner */}
            {dueProblems.length > 0 && (
              <div style={{ padding: "1.1rem 1.4rem", background: "linear-gradient(135deg, rgba(251,191,36,0.12), rgba(245,158,11,0.06))", border: "1px solid rgba(251,191,36,0.35)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(251,191,36,0.2)", border: "1px solid rgba(251,191,36,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                    🔔
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#fbbf24" }}>
                      {dueProblems.length} Spaced Review Reminder{dueProblems.length > 1 ? "s" : ""} Due Today!
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
                      {dueProblems.slice(0, 2).map(p => p.title).join(", ")}{dueProblems.length > 2 ? ` and ${dueProblems.length - 2} more` : ""} — Review today to advance retention interval.
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setSelectedStatus("due_review")}
                    style={{ padding: "7px 14px", borderRadius: 8, background: "rgba(251,191,36,0.18)", border: "1px solid rgba(251,191,36,0.4)", color: "#fef08a", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                  >
                    Filter in Bank
                  </button>
                  <button
                    onClick={() => setActiveTab("spaced_review")}
                    style={{ padding: "7px 16px", borderRadius: 8, background: "#fbbf24", border: "none", color: "#090d16", fontSize: 12, fontWeight: 800, cursor: "pointer" }}
                  >
                    Open Review Deck ({dueProblems.length}) →
                  </button>
                </div>
              </div>
            )}

            {/* Results count */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
              <span>Showing <strong>{filteredProblems.length}</strong> problems</span>
              {selectedCompany !== "all" && (
                <span>Filtered by company: <strong style={{ color: "#38bdf8" }}>{selectedCompany}</strong></span>
              )}
            </div>

            {/* Problem Cards List (Grouped by Striver Step or Flat List) */}
            {groupByStep ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {groupedProblems.map((grp: { step: string; items: DsaProblem[] }) => {
                  const stepSolved = grp.items.filter((p: DsaProblem) => p.progress.status === "solved").length;
                  const stepPct = Math.round((stepSolved / Math.max(1, grp.items.length)) * 100);

                  return (
                    <div key={grp.step} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "1.25rem" }}>
                      {/* Step Header */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ padding: "4px 10px", borderRadius: 8, background: "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(168,85,247,0.25))", border: "1px solid rgba(99,102,241,0.4)", color: "#c7d2fe", fontSize: 12, fontWeight: 800 }}>
                            Striver A2Z
                          </span>
                          <h3 style={{ fontSize: 16, fontWeight: 800, color: "white", margin: 0 }}>{grp.step}</h3>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                          <span>{stepSolved}/{grp.items.length} Solved ({stepPct}%)</span>
                          <div style={{ width: 80, height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 999, overflow: "hidden" }}>
                            <div style={{ width: `${stepPct}%`, height: "100%", background: "#00ff88", borderRadius: 999 }} />
                          </div>
                          <button
                            onClick={() => {
                              const sampleProb = grp.items[0];
                              handleTriggerAiGeneration(sampleProb?.topic_id, grp.step);
                            }}
                            disabled={isGeneratingAi}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "4px 11px",
                              borderRadius: 8,
                              background: activeGenStep === grp.step ? "rgba(168,85,247,0.3)" : "rgba(168,85,247,0.15)",
                              border: "1px solid rgba(168,85,247,0.4)",
                              color: "#d8b4fe",
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: isGeneratingAi ? "not-allowed" : "pointer",
                              transition: "all 0.2s"
                            }}
                            title={`Generate additional real interview problem for ${grp.step}`}
                          >
                            {activeGenStep === grp.step ? "⏳ Synthesizing..." : "✨ AI Add More"}
                          </button>
                        </div>
                      </div>

                      {/* Problems in this Step */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {grp.items.map((prob: DsaProblem) => renderProblemCard(prob))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {filteredProblems.map((prob: DsaProblem) => renderProblemCard(prob))}
              </div>
            )}

            {filteredProblems.length === 0 && (
              <div style={{ textAlign: "center", padding: "3rem", color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px dashed rgba(255,255,255,0.08)" }}>
                No problems match your search or filter criteria. Try resetting your filters.
              </div>
            )}
          </div>
        )}

        {/* ─── MODAL: FULL PROBLEM STATEMENT & STRIVER INTUITION ─── */}
        {modalProblem && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.85)",
              backdropFilter: "blur(8px)",
              zIndex: 999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem"
            }}
            onClick={() => setModalProblem(null)}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: 780,
                maxHeight: "88vh",
                overflowY: "auto",
                background: "#0d1322",
                border: "1px solid rgba(99,102,241,0.3)",
                borderRadius: 20,
                padding: "2rem",
                boxShadow: "0 25px 60px -15px rgba(0,0,0,0.9)",
                position: "relative"
              }}
            >
              {/* Close button */}
              <button
                onClick={() => setModalProblem(null)}
                style={{
                  position: "absolute",
                  top: 18,
                  right: 18,
                  background: "rgba(255,255,255,0.07)",
                  border: "none",
                  color: "white",
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                ✕
              </button>

              {/* Step & Subtopic Tags */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                {modalProblem.step_title && (
                  <span style={{ fontSize: 11, padding: "2px 9px", borderRadius: 6, background: "rgba(99,102,241,0.18)", color: "#a5b4fc", fontWeight: 700 }}>
                    {modalProblem.step_title}
                  </span>
                )}
                {modalProblem.subtopic_title && (
                  <span style={{ fontSize: 11, padding: "2px 9px", borderRadius: 6, background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>
                    {modalProblem.subtopic_title}
                  </span>
                )}
                <span
                  style={{
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: modalProblem.difficulty === "easy" ? "rgba(0,255,136,0.15)" : modalProblem.difficulty === "medium" ? "rgba(251,191,36,0.15)" : "rgba(255,68,102,0.15)",
                    color: modalProblem.difficulty === "easy" ? "#00ff88" : modalProblem.difficulty === "medium" ? "#fbbf24" : "#ff4466",
                    fontWeight: 800,
                    textTransform: "capitalize"
                  }}
                >
                  {modalProblem.difficulty}
                </span>
              </div>

              {/* Problem Title */}
              <h1 style={{ fontSize: 22, fontWeight: 900, color: "white", margin: "0 0 12px" }}>
                {modalProblem.title}
              </h1>

              {/* Target Companies Badges */}
              {modalProblem.companies && modalProblem.companies.length > 0 && (
                <div style={{ marginBottom: 18, padding: "12px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 8, fontWeight: 700 }}>
                    🏢 FREQUENTLY ASKED IN TECHNICAL ROUNDS:
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {modalProblem.companies.map(comp => (
                      <span
                        key={comp}
                        style={{
                          fontSize: 12,
                          padding: "3px 10px",
                          borderRadius: 999,
                          background: "rgba(56,189,248,0.15)",
                          border: "1px solid rgba(56,189,248,0.3)",
                          color: "#7dd3fc",
                          fontWeight: 700
                        }}
                      >
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Optimal Complexity Target */}
              {(modalProblem.time_complexity || modalProblem.space_complexity) && (
                <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                  {modalProblem.time_complexity && (
                    <div style={{ padding: "6px 12px", background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.2)", borderRadius: 8, fontSize: 12, color: "#00ff88", fontWeight: 700 }}>
                      ⏱️ Time Target: {modalProblem.time_complexity}
                    </div>
                  )}
                  {modalProblem.space_complexity && (
                    <div style={{ padding: "6px 12px", background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 8, fontSize: 12, color: "#c084fc", fontWeight: 700 }}>
                      💾 Space Target: {modalProblem.space_complexity}
                    </div>
                  )}
                </div>
              )}

              {/* Spaced Review Reminder Bar in Modal */}
              <div style={{ marginBottom: 18, padding: "12px 16px", background: "rgba(251, 191, 36, 0.08)", borderRadius: 12, border: "1px solid rgba(251, 191, 36, 0.3)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>🔔</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#fbbf24" }}>
                      Spaced Repetition Review Schedule
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
                      {modalProblem.progress?.next_review_date
                        ? `Next review scheduled for ${modalProblem.progress.next_review_date} (Box ${modalProblem.progress.review_count || 0})`
                        : "No review reminder scheduled yet. Set a reminder to retain this problem."}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => {
                      setReminderModalProblem(modalProblem);
                      setReminderDate(modalProblem.progress?.next_review_date || (() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 3);
                        return d.toISOString().split("T")[0];
                      })());
                    }}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 8,
                      background: "#fbbf24",
                      color: "#090d16",
                      fontSize: 11,
                      fontWeight: 800,
                      border: "none",
                      cursor: "pointer"
                    }}
                  >
                    🔔 {modalProblem.progress?.next_review_date ? "Change Reminder" : "Set Reminder"}
                  </button>

                  {modalProblem.progress?.next_review_date && (
                    <a
                      href={getGoogleCalendarDsaUrl(modalProblem, modalProblem.progress.next_review_date)}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        color: "white",
                        fontSize: 11,
                        fontWeight: 700,
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4
                      }}
                    >
                      📅 Google Calendar ↗
                    </a>
                  )}
                </div>
              </div>

              {/* Rendered Problem Statement Markdown */}
              <div style={{ marginBottom: 24, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 16 }}>
                <MarkdownView content={modalProblem.markdown_details || modalProblem.description} />
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 16, justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <a
                    href={modalProblem.problem_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: "9px 18px",
                      borderRadius: 10,
                      background: "#6366f1",
                      color: "white",
                      fontSize: 13,
                      fontWeight: 700,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6
                    }}
                  >
                    Solve on LeetCode ↗
                  </a>
                  {modalProblem.article_url && (
                    <a
                      href={modalProblem.article_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        padding: "9px 16px",
                        borderRadius: 10,
                        background: "rgba(251,191,36,0.12)",
                        border: "1px solid rgba(251,191,36,0.3)",
                        color: "#fbbf24",
                        fontSize: 13,
                        fontWeight: 700,
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6
                      }}
                    >
                      TakeUforward Article ↗
                    </a>
                  )}
                </div>

                <div style={{ display: "flex", gap: 6 }}>
                  {(["unsolved", "attempted", "solved"] as const).map(st => {
                    const isCurrent = modalProblem.progress.status === st;
                    const color = st === "solved" ? "#00ff88" : st === "attempted" ? "#fbbf24" : "rgba(255,255,255,0.5)";
                    return (
                      <button
                        key={st}
                        onClick={() => {
                          handleUpdateStatus(modalProblem.id, st);
                          setModalProblem({
                            ...modalProblem,
                            progress: { ...modalProblem.progress, status: st }
                          });
                        }}
                        style={{
                          padding: "8px 14px",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: isCurrent ? 800 : 500,
                          border: isCurrent ? `1px solid ${color}` : "1px solid rgba(255,255,255,0.1)",
                          background: isCurrent ? `${color}25` : "transparent",
                          color: isCurrent ? color : "rgba(255,255,255,0.5)",
                          cursor: "pointer",
                          textTransform: "capitalize"
                        }}
                      >
                        {st === "solved" ? "✓ Solved" : st}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── MODAL: SCHEDULE REVIEW REMINDER & CALENDAR SYNC ─── */}
        {reminderModalProblem && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.8)",
              backdropFilter: "blur(6px)",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem"
            }}
            onClick={() => setReminderModalProblem(null)}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: 520,
                background: "#0d1322",
                border: "1px solid rgba(251, 191, 36, 0.4)",
                borderRadius: 18,
                padding: "1.75rem",
                boxShadow: "0 25px 60px -15px rgba(0,0,0,0.9)",
                position: "relative"
              }}
            >
              <button
                onClick={() => setReminderModalProblem(null)}
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  background: "rgba(255,255,255,0.08)",
                  border: "none",
                  color: "white",
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                ✕
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                  🔔
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: "white", margin: 0 }}>
                    Schedule Review Reminder
                  </h3>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                    Spaced repetition interval & calendar notification
                  </div>
                </div>
              </div>

              <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 18 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#f8fafc" }}>
                  {reminderModalProblem.title}
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
                  {reminderModalProblem.step_title || "Striver A2Z Sheet"} • {reminderModalProblem.difficulty.toUpperCase()}
                </div>
              </div>

              {reminderSuccessMsg && (
                <div style={{ padding: "10px 14px", background: "rgba(0, 255, 136, 0.12)", border: "1px solid rgba(0, 255, 136, 0.3)", borderRadius: 10, color: "#00ff88", fontSize: 12, fontWeight: 700, marginBottom: 16 }}>
                  ✓ {reminderSuccessMsg}
                </div>
              )}

              {/* Quick Preset Intervals */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 8, letterSpacing: 0.5 }}>
                  QUICK PRESET SCHEDULE:
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 90px), 1fr))", gap: 8 }}>
                  {[
                    { label: "Tomorrow (+1d)", days: 1 },
                    { label: "Spaced (+3d)", days: 3 },
                    { label: "1 Week (+7d)", days: 7 }
                  ].map(preset => {
                    const d = new Date();
                    d.setDate(d.getDate() + preset.days);
                    const ds = d.toISOString().split("T")[0];
                    const isSel = reminderDate === ds;
                    return (
                      <button
                        key={preset.days}
                        onClick={() => setReminderDate(ds)}
                        style={{
                          padding: "8px 6px",
                          borderRadius: 8,
                          background: isSel ? "rgba(251,191,36,0.2)" : "rgba(255,255,255,0.04)",
                          border: isSel ? "1px solid #fbbf24" : "1px solid rgba(255,255,255,0.08)",
                          color: isSel ? "#fbbf24" : "rgba(255,255,255,0.8)",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer"
                        }}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Date Input */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>
                  OR PICK CUSTOM REMINDER DATE:
                </label>
                <input
                  type="date"
                  value={reminderDate}
                  onChange={e => setReminderDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "white",
                    fontSize: 13,
                    boxSizing: "border-box"
                  }}
                />
              </div>

              {/* Sync Options */}
              <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  id="syncCal"
                  checked={syncWithCalendar}
                  onChange={e => setSyncWithCalendar(e.target.checked)}
                  style={{ accentColor: "#fbbf24", cursor: "pointer" }}
                />
                <label htmlFor="syncCal" style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", cursor: "pointer" }}>
                  Also sync to my <strong>Placement Season Calendar</strong> (/student/calendar)
                </label>
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap" }}>
                <a
                  href={getGoogleCalendarDsaUrl(reminderModalProblem, reminderDate)}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: "9px 14px",
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "white",
                    fontSize: 12,
                    fontWeight: 700,
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  📅 Google Calendar ↗
                </a>

                <button
                  onClick={() => handleSaveReminder(reminderModalProblem, reminderDate)}
                  style={{
                    padding: "9px 18px",
                    borderRadius: 10,
                    background: "#fbbf24",
                    border: "none",
                    color: "#090d16",
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer"
                  }}
                >
                  Confirm Reminder
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── MODAL: QUICK ADD CUSTOM PROBLEM ─── */}
        {showCustomAddModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.85)",
              backdropFilter: "blur(8px)",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem"
            }}
            onClick={() => setShowCustomAddModal(false)}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: "#0d1527",
                border: "1px solid rgba(56, 189, 248, 0.3)",
                borderRadius: 20,
                width: "100%",
                maxWidth: 620,
                maxHeight: "90vh",
                overflowY: "auto",
                padding: "2rem",
                position: "relative",
                boxShadow: "0 25px 60px rgba(0,0,0,0.8), 0 0 30px rgba(56, 189, 248, 0.15)"
              }}
            >
              <button
                onClick={() => setShowCustomAddModal(false)}
                style={{
                  position: "absolute",
                  top: 18,
                  right: 18,
                  background: "rgba(255,255,255,0.08)",
                  border: "none",
                  color: "white",
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  cursor: "pointer",
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                ✕
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(56, 189, 248, 0.15)", border: "1px solid rgba(56, 189, 248, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                  ➕
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "white", margin: 0 }}>
                    Add Custom DSA Problem
                  </h3>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                    Expand your practice library with custom interview questions
                  </div>
                </div>
              </div>

              <form onSubmit={handleCustomAddSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 6 }}>
                    Problem Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Longest Consecutive Sequence"
                    value={customProblemData.title}
                    onChange={e => setCustomProblemData({ ...customProblemData, title: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 10,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "white",
                      fontSize: 13,
                      boxSizing: "border-box"
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 6 }}>
                      Striver Step Category *
                    </label>
                    <select
                      value={customProblemData.step_title}
                      onChange={e => {
                        const sel = STRIVER_STEPS_OPTIONS.find(s => s.step === e.target.value);
                        setCustomProblemData({
                          ...customProblemData,
                          step_title: e.target.value,
                          topic_id: sel ? sel.topic : "arrays"
                        });
                      }}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 10,
                        background: "#131b2e",
                        border: "1px solid rgba(255,255,255,0.15)",
                        color: "white",
                        fontSize: 12,
                        boxSizing: "border-box"
                      }}
                    >
                      {STRIVER_STEPS_OPTIONS.map(s => (
                        <option key={s.step} value={s.step}>
                          {s.step}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 6 }}>
                      Difficulty *
                    </label>
                    <select
                      value={customProblemData.difficulty}
                      onChange={e => setCustomProblemData({ ...customProblemData, difficulty: e.target.value as any })}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 10,
                        background: "#131b2e",
                        border: "1px solid rgba(255,255,255,0.15)",
                        color: "white",
                        fontSize: 12,
                        boxSizing: "border-box"
                      }}
                    >
                      <option value="easy">🟢 Easy</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="hard">🔴 Hard</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 6 }}>
                      Company Tags (Comma separated)
                    </label>
                    <input
                      type="text"
                      placeholder="Google, Microsoft, Amazon"
                      value={customProblemData.companies}
                      onChange={e => setCustomProblemData({ ...customProblemData, companies: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: 10,
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        color: "white",
                        fontSize: 13,
                        boxSizing: "border-box"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 6 }}>
                      Target Time Complexity
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. O(N), O(log N)"
                      value={customProblemData.time_complexity_target}
                      onChange={e => setCustomProblemData({ ...customProblemData, time_complexity_target: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: 10,
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        color: "white",
                        fontSize: 13,
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 6 }}>
                    Practice / LeetCode URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://leetcode.com/problems/..."
                    value={customProblemData.url}
                    onChange={e => setCustomProblemData({ ...customProblemData, url: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 10,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "white",
                      fontSize: 13,
                      boxSizing: "border-box"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 6 }}>
                    Markdown Problem Statement & Intuition
                  </label>
                  <textarea
                    rows={5}
                    value={customProblemData.markdown_statement}
                    onChange={e => setCustomProblemData({ ...customProblemData, markdown_statement: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 10,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "white",
                      fontSize: 12,
                      fontFamily: "monospace",
                      boxSizing: "border-box",
                      resize: "vertical"
                    }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setShowCustomAddModal(false)}
                    style={{
                      padding: "10px 18px",
                      borderRadius: 10,
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.7)",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: "10px 22px",
                      borderRadius: 10,
                      background: "linear-gradient(135deg, #0ea5e9, #3b82f6)",
                      border: "none",
                      color: "white",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      boxShadow: "0 4px 15px rgba(14, 165, 233, 0.4)"
                    }}
                  >
                    Add to Striver Tracker
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── TAB 2: SPACED REPETITION REVIEW DECK (Phase 1a) ─── */}
        {activeTab === "spaced_review" && (
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <div style={{ padding: "1.5rem", background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 16, marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#fbbf24", margin: "0 0 6px" }}>Spaced Repetition Review Deck</h2>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", margin: 0, lineHeight: 1.5 }}>
                Problems automatically enter your review schedule when solved. Confirmed retention expands the interval (3 → 7 → 14 → 30 days). If forgotten, the interval resets to 3 days to protect long-term recall.
              </p>
            </div>

            {dueProblems.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {dueProblems.map(prob => (
                  <div key={prob.id} style={{ padding: "1.5rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 11, padding: "2px 8px", background: "rgba(251,191,36,0.15)", color: "#fbbf24", borderRadius: 6, fontWeight: 700 }}>
                        Review #{prob.progress.review_count + 1} Due
                      </span>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                        Scheduled: {prob.progress.next_review_date}
                      </span>
                    </div>

                    <h3 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 8px" }}>
                      <a href={prob.problem_url} target="_blank" rel="noreferrer" style={{ color: "white", textDecoration: "none" }}>
                        {prob.title} ↗
                      </a>
                    </h3>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>{prob.description}</p>

                    {prob.progress.notes && (
                      <div style={{ padding: "10px 12px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 8, fontSize: 12, color: "rgba(255,255,255,0.8)", marginBottom: 16 }}>
                        <strong>Your Saved Note:</strong> {prob.progress.notes}
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                      <button
                        onClick={() => handleReviewAction(prob.id, "forgot")}
                        style={{ padding: "8px 16px", borderRadius: 8, background: "rgba(255,68,102,0.12)", border: "1px solid rgba(255,68,102,0.3)", color: "#ff4466", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                      >
                        🔁 Forgot (Reset to 3 days)
                      </button>
                      <button
                        onClick={() => handleReviewAction(prob.id, "retained")}
                        style={{ padding: "8px 18px", borderRadius: 8, background: "rgba(0,255,136,0.15)", border: "1px solid rgba(0,255,136,0.4)", color: "#00ff88", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                      >
                        ✅ Retained (+Advance interval)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "4rem 2rem", background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px dashed rgba(255,255,255,0.1)" }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🎉</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "white", marginBottom: 6 }}>All Caught Up on Reviews!</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>No problems are due today. Solve new problems in the Problem Bank to populate your review intervals.</div>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 3: TOPIC MASTERY HEATMAP (Phase 3a) ─── */}
        {activeTab === "heatmap" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
              {analytics?.heatmap?.map((item: any) => {
                const pct = item.completion_pct;
                const heatColor = pct >= 70 ? "#00ff88" : pct >= 35 ? "#38bdf8" : pct > 0 ? "#fbbf24" : "rgba(255,255,255,0.2)";

                return (
                  <div
                    key={item.topic.id}
                    onClick={() => { setSelectedTopic(item.topic.id); setActiveTab("problems"); }}
                    style={{ padding: "1.25rem", background: "rgba(255,255,255,0.03)", border: `1px solid ${heatColor}30`, borderRadius: 16, cursor: "pointer", transition: "transform 0.15s" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontWeight: 800, fontSize: 15, color: "white" }}>{item.topic.name}</span>
                      <span style={{ fontSize: 14, fontWeight: 900, color: heatColor }}>{pct}%</span>
                    </div>

                    {/* Progress bar */}
                    <div style={{ height: 6, background: "rgba(255,255,255,0.07)", borderRadius: 999, overflow: "hidden", marginBottom: 12 }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: heatColor, borderRadius: 999 }} />
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                      <span>Cleared: {item.solved}/{item.total}</span>
                      <span>🟢 {item.easy} | 🟡 {item.medium} | 🔴 {item.hard}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── TAB 4: SOCIAL ARENA & LEADERBOARD (Phase 4a & 4b) ─── */}
        {activeTab === "social" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: 20 }}>
            {/* Friend Progress Comparison (Phase 4a) */}
            <div style={{ padding: "1.5rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 11, padding: "2px 7px", background: "rgba(99,102,241,0.2)", borderRadius: 6, color: "#818cf8", fontWeight: 700 }}>OPT-IN MUTUAL</span>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Friend Progress Comparison</h3>
              </div>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.5, marginBottom: 16 }}>
                Progress is 100% private by default. To compare solve counts and topic strengths, exchange an invite code. Both students must explicitly connect before stats are shared.
              </p>

              {/* Generate Invite Code */}
              <div style={{ marginBottom: 16 }}>
                <button
                  onClick={handleCreateInviteCode}
                  style={{ width: "100%", padding: "10px", borderRadius: 8, background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)", color: "#c7d2fe", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  ⚡ Generate My Friend Invite Code
                </button>
                {inviteCode && (
                  <div style={{ marginTop: 8, padding: "8px 12px", background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.25)", borderRadius: 8, textAlign: "center", fontSize: 13, fontWeight: 700, color: "#00ff88" }}>
                    Share Code: {inviteCode}
                  </div>
                )}
              </div>

              {/* Connect with Code */}
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <input
                  type="text"
                  placeholder="Enter peer's code (e.g. COG-5145)"
                  value={friendCodeInput}
                  onChange={e => setFriendCodeInput(e.target.value)}
                  style={{ flex: 1, padding: "8px 12px", borderRadius: 8, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: 12 }}
                />
                <button
                  onClick={handleAcceptInviteCode}
                  style={{ padding: "8px 14px", borderRadius: 8, background: "#6366f1", border: "none", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  Connect
                </button>
              </div>
              {friendSuccessMsg && <div style={{ fontSize: 12, color: "#00ff88", marginBottom: 14 }}>{friendSuccessMsg}</div>}

              {/* Friends list */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>Connected Friends ({friendsList.length})</div>
                {friendsList.map(f => (
                  <div key={f.friend_student_id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{f.display_name}</span>
                    <span style={{ fontSize: 12, color: "#00ff88", fontWeight: 700 }}>{f.solved_count} solved</span>
                  </div>
                ))}
                {friendsList.length === 0 && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>No connected friends yet.</div>}
              </div>
            </div>

            {/* College Leaderboard (Phase 4b) */}
            <div style={{ padding: "1.5rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>College Leaderboard</h3>
                <span style={{ fontSize: 11, padding: "2px 7px", background: isOptedIn ? "rgba(0,255,136,0.15)" : "rgba(255,255,255,0.1)", borderRadius: 6, color: isOptedIn ? "#00ff88" : "rgba(255,255,255,0.4)", fontWeight: 700 }}>
                  {isOptedIn ? "OPTED-IN" : "OPTED-OUT (DEFAULT)"}
                </span>
              </div>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.5, marginBottom: 14 }}>
                Anonymized handle only. Never exposes your real name. Defaults to opted-out for student privacy.
              </p>

              {/* Opt-in toggle */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 10, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>Show on College Leaderboard</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Handle: {displayHandle || "Coder#0421"}</div>
                </div>
                <button
                  onClick={handleToggleLeaderboard}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 8,
                    border: isOptedIn ? "1px solid rgba(255,68,102,0.4)" : "1px solid rgba(0,255,136,0.4)",
                    background: isOptedIn ? "rgba(255,68,102,0.12)" : "rgba(0,255,136,0.15)",
                    color: isOptedIn ? "#ff4466" : "#00ff88",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  {isOptedIn ? "Opt Out" : "Opt In"}
                </button>
              </div>

              {/* Leaderboard Table */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {leaderboard.map(entry => (
                  <div
                    key={entry.rank}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderRadius: 8,
                      background: entry.display_handle === displayHandle ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.02)",
                      border: entry.display_handle === displayHandle ? "1px solid rgba(99,102,241,0.35)" : "1px solid transparent"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 22, fontWeight: 900, color: entry.rank === 1 ? "#fbbf24" : entry.rank === 2 ? "#94a3b8" : entry.rank === 3 ? "#92400e" : "rgba(255,255,255,0.4)", fontSize: 12 }}>
                        #{entry.rank}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{entry.display_handle}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 11, color: "#fbbf24" }}>🔥 {entry.streak_days}d</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#00ff88" }}>{entry.solved_count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 5: MILESTONE BADGES (Phase 5a) ─── */}
        {activeTab === "badges" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {badges.map(b => (
                <div
                  key={b.type}
                  style={{
                    padding: "1.5rem",
                    borderRadius: 16,
                    background: b.is_earned ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.01)",
                    border: b.is_earned ? "1px solid rgba(236,72,153,0.3)" : "1px solid rgba(255,255,255,0.05)",
                    opacity: b.is_earned ? 1 : 0.45,
                    filter: b.is_earned ? "none" : "grayscale(80%)",
                    transition: "all 0.2s"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <div style={{ fontSize: 32 }}>{b.icon}</div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "white" }}>{b.title}</h4>
                      <span style={{ fontSize: 11, color: b.is_earned ? "#00ff88" : "rgba(255,255,255,0.4)", fontWeight: 700 }}>
                        {b.is_earned ? "✓ UNLOCKED" : "LOCKED"}
                      </span>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.5, margin: 0 }}>
                    {b.description}
                  </p>
                  {b.earned_at && (
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 8 }}>
                      Earned: {new Date(b.earned_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function DsaTrackerPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#090d16", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading DSA Practice Tracker...</div>}>
      <DsaTrackerContent />
    </Suspense>
  );
}
