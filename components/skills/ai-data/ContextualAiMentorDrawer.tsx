"use client";

import React, { useState } from "react";
import { TaxonomyTopic, TaxonomySubject } from "@/lib/skills/ai-data/master-curriculum-taxonomy";
import { TargetRoleSlug } from "@/lib/skills/ai-data/types";
import { TARGET_ROLE_PROFILES } from "@/lib/skills/ai-data/roles";

export interface ContextualAiMentorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  topic: TaxonomyTopic;
  subject: TaxonomySubject;
  targetRole: TargetRoleSlug;
}

interface ChatMessage {
  id: string;
  sender: "user" | "mentor";
  text: string;
  timestamp: string;
}

export default function ContextualAiMentorDrawer({
  isOpen,
  onClose,
  topic,
  subject,
  targetRole,
}: ContextualAiMentorDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "mentor",
      text: `Hello! I'm your Cognalyze Socratic AI Mentor for **${topic.title}**.\n\nWhether you need an intuitive analogy, a progressive hint for code, or want to practice an interview question calibrated for your **${TARGET_ROLE_PROFILES[targetRole]?.title || "AI"}** career pathway, let me know!`,
      timestamp: "Just now",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hintLevel, setHintLevel] = useState(1);

  if (!isOpen) return null;

  const handleSendMessage = (userPrompt?: string) => {
    const textToSend = userPrompt || inputText;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!userPrompt) setInputText("");
    setIsTyping(true);

    setTimeout(() => {
      let mentorReply = "";
      const lower = textToSend.toLowerCase();

      if (lower.includes("hint")) {
        if (hintLevel === 1) {
          mentorReply = `**Progressive Hint 1 (Directional)**: Consider the core invariant of **${topic.title}**. Think about how data is structured in memory before and after the operation. What is the expected return type?`;
          setHintLevel(2);
        } else if (hintLevel === 2) {
          mentorReply = `**Progressive Hint 2 (Algorithmic / Architectural)**: Notice that ${topic.conceptsCovered?.[0] || "the operation"} requires careful handling of edge conditions (such as empty inputs, boundary indices, or zero values). Try writing a guard clause first.`;
          setHintLevel(3);
        } else {
          mentorReply = `**Progressive Hint 3 (Implementation Step)**: Break the solution into 3 steps: 1) Validate input schema; 2) Apply the transformation vectorially; 3) Return the finalized structure. Look at the worked example in the main workspace for the canonical pattern.`;
          setHintLevel(1);
        }
      } else if (lower.includes("analogy") || lower.includes("explain")) {
        mentorReply = `**Intuitive Analogy for ${topic.title}**:\n\n${topic.contextAndIntuition?.english || "Think of this like an assembly line where each station has a dedicated specialized tool, ensuring high throughput and zero memory wastage."}\n\n*Why this matters for ${TARGET_ROLE_PROFILES[targetRole]?.title}*: In production systems, choosing this approach reduces latency and prevents cascading failures.`;
      } else if (lower.includes("interview") || lower.includes("question")) {
        mentorReply = `**Technical Interview Probe (${TARGET_ROLE_PROFILES[targetRole]?.title || "Technical Round"})**:\n\n"Suppose you are deploying a service handling 10,000 requests/sec using **${topic.title}**. Under what condition will this implementation degrade in performance or raise an out-of-memory error? How would you defend your architecture to a Principal Engineer?"\n\n*Take 2 minutes to explain your reasoning.*`;
      } else if (lower.includes("debug")) {
        mentorReply = `**Debugging Assistant**:\n\nWhen troubleshooting **${topic.title}**, inspect these 2 common root causes:\n1. Check for type mismatches between runtime arguments and expectations.\n2. Ensure all external resources (or connections) are closed within a context manager. What specific error message are you encountering in stderr?`;
      } else {
        mentorReply = `Great question regarding **${topic.title}**! When working on this concept in production, always ask yourself: What is the computational complexity (Big-O time and memory), and how does it scale as your dataset grows from megabytes to gigabytes? Try testing your code in the live sandbox on the left!`;
      }

      const replyMsg: ChatMessage = {
        id: `m-${Date.now()}`,
        sender: "mentor",
        text: mentorReply,
        timestamp: "Just now",
      };

      setMessages((prev) => [...prev, replyMsg]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <div
      style={{
        position: "fixed",
        right: 0,
        top: 56,
        bottom: 0,
        width: 360,
        backgroundColor: "#FFFFFF",
        borderLeft: "1px solid #E4E1DA",
        boxShadow: "-4px 0 20px rgba(0,0,0,0.06)",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div style={{ padding: "14px 18px", borderBottom: "1px solid #E4E1DA", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F6F5F1" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>🤖</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#162A43" }}>Socratic AI Mentor</div>
            <div style={{ fontSize: 10, color: "#667085" }}>Context: {topic.title.slice(0, 24)}...</div>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{ background: "transparent", border: "none", color: "#667085", fontSize: 16, cursor: "pointer", padding: "2px 6px" }}
        >
          ✕
        </button>
      </div>

      {/* Quick Action Pills */}
      <div style={{ padding: "10px 14px", borderBottom: "1px solid #E4E1DA", background: "#FFFFFF", display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button
          onClick={() => handleSendMessage("Explain this with a simple analogy")}
          style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #D2E0FB", background: "#EFF4FE", color: "#356AE6", fontSize: 10.5, fontWeight: 700, cursor: "pointer" }}
        >
          💡 Analogy
        </button>
        <button
          onClick={() => handleSendMessage("Give me a progressive hint")}
          style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #E4E1DA", background: "#F6F5F1", color: "#162A43", fontSize: 10.5, fontWeight: 700, cursor: "pointer" }}
        >
          🔍 Hint
        </button>
        <button
          onClick={() => handleSendMessage("Ask me a technical interview question on this")}
          style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #E4E1DA", background: "#F6F5F1", color: "#162A43", fontSize: 10.5, fontWeight: 700, cursor: "pointer" }}
        >
          🎯 Interview Probe
        </button>
      </div>

      {/* Chat Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
              maxWidth: "88%",
              background: m.sender === "user" ? "#162A43" : "#F6F5F1",
              color: m.sender === "user" ? "#FFFFFF" : "#17191C",
              padding: "10px 14px",
              borderRadius: 8,
              fontSize: 12,
              lineHeight: 1.5,
              border: m.sender === "user" ? "none" : "1px solid #E4E1DA",
            }}
          >
            <div style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>
          </div>
        ))}
        {isTyping && (
          <div style={{ alignSelf: "flex-start", padding: "8px 12px", background: "#F6F5F1", borderRadius: 8, fontSize: 11, color: "#667085" }}>
            AI Mentor is formulating a Socratic response...
          </div>
        )}
      </div>

      {/* Input Box */}
      <div style={{ padding: "12px 14px", borderTop: "1px solid #E4E1DA", background: "#FFFFFF", display: "flex", gap: 8 }}>
        <input
          type="text"
          placeholder="Ask a question or request code help..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSendMessage();
          }}
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid #E4E1DA",
            fontSize: 12,
            outline: "none",
          }}
        />
        <button
          onClick={() => handleSendMessage()}
          style={{
            padding: "8px 14px",
            borderRadius: 6,
            border: "none",
            background: "#356AE6",
            color: "#FFFFFF",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

