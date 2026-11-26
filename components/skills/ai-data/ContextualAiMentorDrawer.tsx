"use client";

import React, { useState, useRef } from "react";
import { TaxonomyTopic, TaxonomySubject } from "@/lib/skills/ai-data/master-curriculum-taxonomy";
import { TargetRoleSlug } from "@/lib/skills/ai-data/types";
import { TARGET_ROLE_PROFILES } from "@/lib/skills/ai-data/roles";

export interface ContextualAiMentorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  candidateId?: string;
  topic: TaxonomyTopic;
  subject: TaxonomySubject;
  moduleTitle?: string;
  subtopicTitle?: string;
  learningPhase?: string;
  language?: "english" | "hinglish";
  userCode?: string;
  executionStdout?: string;
  executionStderr?: string;
  weakConcepts?: string[];
  assessmentScore?: number | null;
  targetRole: TargetRoleSlug | string;
}

interface ChatMessage {
  id: string;
  topicId?: string;
  sender: "user" | "mentor";
  text: string;
  source?: string;
  timestamp: string;
}

export default function ContextualAiMentorDrawer({
  isOpen,
  onClose,
  candidateId = "student-demo",
  topic,
  subject,
  moduleTitle = "",
  subtopicTitle = "",
  learningPhase = "understand",
  language = "english",
  userCode = "",
  executionStdout = "",
  executionStderr = "",
  weakConcepts = [],
  assessmentScore = null,
  targetRole,
}: ContextualAiMentorDrawerProps) {
  const roleTitle =
    TARGET_ROLE_PROFILES[targetRole as keyof typeof TARGET_ROLE_PROFILES]?.title || targetRole;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const msgCounterRef = useRef(0);

  if (!isOpen) return null;

  const welcomeMessage: ChatMessage = {
    id: `welcome-${topic.id}`,
    topicId: topic.id,
    sender: "mentor",
    text:
      language === "hinglish"
        ? `Namaste! Main aapka AI Mentor hoon **${topic.title}** ke liye (${roleTitle} track).\n\nAap mujhse simple explanation, extra examples, progressive hint, code review, ya viva question pooch sakte hain.`
        : `Hello! I'm your Cognalyze AI Learning Mentor for **${topic.title}** (${roleTitle} track).\n\nAsk me to explain differently, show another example, give a progressive hint, review your code, or quiz you with a quick viva.`,
    timestamp: "Now",
  };

  const visibleMessages: ChatMessage[] = [
    welcomeMessage,
    ...messages.filter((m) => m.topicId === topic.id),
  ];

  const handleSendMessage = async (userPrompt?: string) => {
    const textToSend = (userPrompt || inputText).trim();
    if (!textToSend || isTyping) return;

    const userId = `u-${++msgCounterRef.current}`;
    const userMsg: ChatMessage = {
      id: userId,
      topicId: topic.id,
      sender: "user",
      text: textToSend,
      timestamp: "Now",
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!userPrompt) setInputText("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/skills/ai-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "mentor_chat",
          candidateId,
          targetRole: roleTitle,
          subjectTitle: subject.title,
          moduleTitle: moduleTitle || subject.title,
          topicId: topic.id,
          topicTitle: topic.title,
          subtopicTitle,
          learningPhase,
          language,
          userMessage: textToSend,
          userCode,
          executionStdout,
          executionStderr,
          weakConcepts,
          assessmentScore,
        }),
      });
      const data = await res.json();
      const replyText =
        data?.mentorReply?.reply ||
        data?.error ||
        "Could not generate a response right now. Please try again.";
      const replyId = `m-${++msgCounterRef.current}`;
      setMessages((prev) => [
        ...prev,
        {
          id: replyId,
          topicId: topic.id,
          sender: "mentor",
          text: replyText,
          source: data?.mentorReply?.source,
          timestamp: "Now",
        },
      ]);
    } catch {
      const errId = `m-err-${++msgCounterRef.current}`;
      setMessages((prev) => [
        ...prev,
        {
          id: errId,
          topicId: topic.id,
          sender: "mentor",
          text: "Network error communicating with AI Mentor service.",
          timestamp: "Now",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        right: 0,
        top: 56,
        bottom: 0,
        width: 380,
        maxWidth: "100vw",
        backgroundColor: "#FFFFFF",
        borderLeft: "1px solid #E4E1DA",
        boxShadow: "-4px 0 24px rgba(22, 42, 67, 0.08)",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 18px",
          borderBottom: "1px solid #E4E1DA",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#FAF9F6",
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#162A43" }}>AI Learning Mentor</div>
          <div style={{ fontSize: 10.5, color: "#6D28D9", fontWeight: 700 }}>
            {topic.title.slice(0, 32)} · {language === "hinglish" ? "Hinglish" : "English"}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            color: "#667085",
            fontSize: 16,
            cursor: "pointer",
            padding: "2px 6px",
          }}
        >
          ✕
        </button>
      </div>

      {/* Quick Action Pills */}
      <div
        style={{
          padding: "10px 14px",
          borderBottom: "1px solid #E4E1DA",
          background: "#FFFFFF",
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
        }}
      >
        {[
          { label: "Explain Differently", prompt: "Explain this concept differently with a simpler analogy" },
          { label: "More Examples", prompt: "Show me another concrete small example for this subtopic" },
          { label: "Progressive Hint", prompt: "Give me a progressive hint without spoiling the full solution" },
          { label: "Review My Code", prompt: "Review my current code and explain any bugs or improvements" },
          { label: "Viva Quiz Me", prompt: "Ask me a quick topic-specific viva question to test my understanding" },
        ].map((btn) => (
          <button
            key={btn.label}
            onClick={() => handleSendMessage(btn.prompt)}
            style={{
              padding: "4px 9px",
              borderRadius: 6,
              border: "1px solid #DDD6FE",
              background: "#F5F3FF",
              color: "#5B21B6",
              fontSize: 10.5,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 12 }}>
        {visibleMessages.map((m) => (
          <div
            key={m.id}
            style={{
              alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
              maxWidth: "88%",
              background: m.sender === "user" ? "#162A43" : "#FAF9F6",
              color: m.sender === "user" ? "#FFFFFF" : "#17191C",
              padding: "10px 14px",
              borderRadius: 10,
              fontSize: 12,
              lineHeight: 1.55,
              border: m.sender === "user" ? "none" : "1px solid #E4E1DA",
            }}
          >
            <div style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>
          </div>
        ))}
        {isTyping && (
          <div
            style={{
              alignSelf: "flex-start",
              padding: "8px 12px",
              background: "#F5F3FF",
              border: "1px solid #DDD6FE",
              borderRadius: 8,
              fontSize: 11,
              color: "#5B21B6",
            }}
          >
            Mentor is reviewing your topic &amp; context...
          </div>
        )}
      </div>

      {/* Input Box */}
      <div style={{ padding: "12px 14px", borderTop: "1px solid #E4E1DA", background: "#FFFFFF", display: "flex", gap: 8 }}>
        <input
          type="text"
          placeholder={language === "hinglish" ? "Koi bhi doubt poochein..." : "Ask about this concept or your code..."}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSendMessage();
          }}
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #E4E1DA",
            fontSize: 12,
            outline: "none",
          }}
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={isTyping}
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            border: "none",
            background: "#6D28D9",
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
