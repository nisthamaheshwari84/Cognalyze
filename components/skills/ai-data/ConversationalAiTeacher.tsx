"use client";

import React, { useState, useEffect, useRef } from "react";

interface ConversationalAiTeacherProps {
  topicTitle: string;
  topicSlug?: string;
  subtopicTitle?: string;
  candidateId?: string;
  onNavigateTab?: (tabKey: string) => void;
  initialMessagePrompt?: string;
}

interface Message {
  id: string;
  sender: "teacher" | "student";
  text: string;
  timestamp: string;
  analogy?: string;
  socraticQuestion?: string;
  suggestedQuickReplies?: string[];
  evaluationDiagnosis?: "correct" | "partially_correct" | "misconception" | "guess";
  recommendedAction?: {
    label: string;
    targetTab: string;
  };
}

export default function ConversationalAiTeacher({
  topicTitle,
  topicSlug = "python-foundations",
  subtopicTitle,
  candidateId = "student-demo",
  onNavigateTab,
  initialMessagePrompt
}: ConversationalAiTeacherProps) {
  const [language, setLanguage] = useState<"english" | "hinglish">("english");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial Socratic Welcome
  useEffect(() => {
    const welcomeText = language === "english"
      ? `Hello! I am your AI Mentor for **${topicTitle}** ${subtopicTitle ? `(${subtopicTitle})` : ""}. Rather than having you memorize definitions, let's explore how this actually works under the hood.`
      : `Namaste! Main aapka AI Mentor hoon for **${topicTitle}**. Yahan hum concepts ko sirf rattne ki jagah unke internal mechanics aur real execution ko samajhenge.`;

    const initialQuestion = language === "english"
      ? `To get started: What do you think happens in memory when you execute \`a = [1, 2]\` followed by \`b = a\`? Does \`b\` get its own copy of the list, or something else?`
      : `Shuru karne ke liye: Jab aap Python mein \`a = [1, 2]\` aur fir \`b = a\` run karte hain, toh memory mein kya hota hai? Kya \`b\` ko naya copy milta hai, ya dono same jagah point karte hain?`;

    setMessages([
      {
        id: "msg-1",
        sender: "teacher",
        text: welcomeText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        analogy: language === "english"
          ? "Think of Python variables like sticky note labels attached to boxes on a shelf, not the boxes themselves."
          : "Python variables ko ek cupboard ke boxes pe lage sticky note labels ki tarah samjho, na ki actual storage box.",
        socraticQuestion: initialQuestion,
        suggestedQuickReplies: [
          language === "english" ? "They both point to the same list" : "Dono same list ko point karte hain",
          language === "english" ? "b gets a new independent copy" : "b ko nayi copy milti hai",
          language === "english" ? "Show me visually in the diagram" : "Mujhe diagram mein visually dikhao"
        ]
      }
    ]);
  }, [topicTitle, subtopicTitle, language]);

  useEffect(() => {
    if (initialMessagePrompt) {
      handleSendMessage(initialMessagePrompt);
    }
  }, [initialMessagePrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    const studentMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: "student",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages(prev => [...prev, studentMsg]);
    if (!textToSend) setInputText("");
    setIsTyping(true);

    // AI Socratic Logic evaluation
    setTimeout(() => {
      const lower = query.toLowerCase();
      let teacherResponse = "";
      let diagnosis: Message["evaluationDiagnosis"] = "correct";
      let nextQuestion = "";
      let quickReplies: string[] = [];
      let recommendedAction: Message["recommendedAction"] | undefined = undefined;

      if (lower.includes("visually") || lower.includes("diagram") || lower.includes("dikhao")) {
        teacherResponse = language === "english"
          ? "Great intuition! Let's examine the memory pointers in our Visual Studio. You will see both 'a' and 'b' pointing to address `0x10A`."
          : "Bilkul sahi! Chalo humare Visual Studio mein memory pointers ko dekhte hain jahan 'a' aur 'b' dono address `0x10A` ko point kar rahe hain.";
        nextQuestion = language === "english"
          ? "If you mutate `b.append(3)`, what will `print(a)` output?"
          : "Agar hum `b.append(3)` execute karenge, toh `print(a)` kya print karega?";
        quickReplies = ["[1, 2, 3]", "[1, 2]", "Error"];
        recommendedAction = { label: "Open Visual Diagram Studio ➔", targetTab: "visual" };
      } else if (lower.includes("copy") || lower.includes("independent") || lower.includes("nayi")) {
        diagnosis = "misconception";
        teacherResponse = language === "english"
          ? "That's a very common trap! In Python, assignment `=` NEVER copies the object. It only copies the 64-bit memory pointer address."
          : "Ye sabse common mistake hai! Python mein `=` operator kabhi bhi object ki copy nahi banata; ye sirf pointer address copy karta hai.";
        nextQuestion = language === "english"
          ? "How would you create a genuine independent shallow copy if you actually needed one?"
          : "Agar aapko sach mein ek independent copy chahiye ho, toh aap kaunsa method use karenge?";
        quickReplies = ["a.copy() or a[:]", "b = copy.deepcopy(a)", "Show code example"];
      } else if (lower.includes("same") || lower.includes("pointer") || lower.includes("dono")) {
        diagnosis = "correct";
        teacherResponse = language === "english"
          ? "Spot on! That is exactly correct. Both 'a' and 'b' hold the identical heap address. This is called **aliasing**."
          : "Shabash! Bilkul sahi answer. Dono 'a' aur 'b' ke paas ek hi memory address hota hai. Isko **Aliasing** kehte hain.";
        nextQuestion = language === "english"
          ? "Now, what happens if we write `a = a + [4]`? Does `b` change too?"
          : "Ab socho agar hum `a = a + [4]` likhein, toh kya `b` bhi change hoga ya nahi?";
        quickReplies = ["No, + creates a new list", "Yes, b changes too", "Let's test in Practice"];
      } else if (lower.includes("simpler") || lower.includes("aasan")) {
        teacherResponse = language === "english"
          ? "Let's simplify: Imagine you have a Google Doc. Sharing the link with a friend doesn't duplicate the document. Both of you edit the exact same page live."
          : "Aasan bhasha mein: Maan lo ek Google Doc hai. Dost ko link bhejne se doc duplicate nahi hota. Dono ek hi page pe live changes karte hain.";
        nextQuestion = language === "english"
          ? "Does this mental model make sense?"
          : "Kya ye Google Doc wala analogy clear laga?";
        quickReplies = ["Yes, crystal clear!", "Give another example", "Let's write code"];
      } else {
        teacherResponse = language === "english"
          ? `You raised an interesting point: "${query}". In production systems, understanding object lifecycle prevents silent memory bugs.`
          : `Aapne achha point raise kiya: "${query}". Production code mein memory mutability aur reference lifecycle samajhna bohot zaroori hota hai.`;
        nextQuestion = language === "english"
          ? "Would you like to try solving an authentic placement coding challenge on this topic?"
          : "Kya aap is concept par ek real coding practice challenge solve karna chahenge?";
        quickReplies = ["Yes, let's practice!", "Explain more first", "Show interview questions"];
        recommendedAction = { label: "Go to Coding Practice ➔", targetTab: "practice" };
      }

      const teacherMsg: Message = {
        id: `msg-${Date.now()}`,
        sender: "teacher",
        text: teacherResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        socraticQuestion: nextQuestion,
        suggestedQuickReplies: quickReplies,
        evaluationDiagnosis: diagnosis,
        recommendedAction
      };

      setMessages(prev => [...prev, teacherMsg]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <div style={{ background: "#FFFFFF", borderRadius: 12, border: "1px solid #E4E1DA", display: "flex", flexDirection: "column", height: "640px", overflow: "hidden" }}>
      {/* Teacher Top Bar */}
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #E4E1DA", background: "#FBFBFA", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#EFF4FE", border: "1px solid #D2E0FB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
            🤖
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#162A43" }}>
              Cognalyze Conversational AI Teacher
            </div>
            <div style={{ fontSize: 11, color: "#667085" }}>
              Socratic Dialogue • 16-Step Explanatory Loop • {topicTitle}
            </div>
          </div>
        </div>

        {/* Bilingual Language Switcher */}
        <div style={{ display: "flex", background: "#F1EFE9", borderRadius: 6, padding: 2 }}>
          <button
            onClick={() => setLanguage("english")}
            style={{
              padding: "4px 10px",
              fontSize: 11,
              fontWeight: 700,
              border: "none",
              borderRadius: 5,
              cursor: "pointer",
              background: language === "english" ? "#FFFFFF" : "transparent",
              color: language === "english" ? "#162A43" : "#667085"
            }}
          >
            English
          </button>
          <button
            onClick={() => setLanguage("hinglish")}
            style={{
              padding: "4px 10px",
              fontSize: 11,
              fontWeight: 700,
              border: "none",
              borderRadius: 5,
              cursor: "pointer",
              background: language === "hinglish" ? "#FFFFFF" : "transparent",
              color: language === "hinglish" ? "#162A43" : "#667085"
            }}
          >
            Hinglish
          </button>
        </div>
      </div>

      {/* Message Stream */}
      <div style={{ flex: 1, padding: 20, overflowY: "auto", background: "#FAF9F5", display: "flex", flexDirection: "column", gap: 16 }}>
        {messages.map(msg => (
          <div
            key={msg.id}
            style={{
              display: "flex",
              justifyContent: msg.sender === "student" ? "flex-end" : "flex-start"
            }}
          >
            <div
              style={{
                maxWidth: "75%",
                background: msg.sender === "student" ? "#162A43" : "#FFFFFF",
                color: msg.sender === "student" ? "#FFFFFF" : "#17191C",
                padding: "12px 16px",
                borderRadius: msg.sender === "student" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                border: msg.sender === "student" ? "none" : "1px solid #E4E1DA",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
              }}
            >
              {/* Header / Diagnosis tag */}
              {msg.evaluationDiagnosis && (
                <div style={{ marginBottom: 6 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      padding: "2px 6px",
                      borderRadius: 4,
                      background: msg.evaluationDiagnosis === "correct" ? "#EAF4EE" : "#FEF2F2",
                      color: msg.evaluationDiagnosis === "correct" ? "#2E7D5B" : "#991B1B"
                    }}
                  >
                    {msg.evaluationDiagnosis === "correct" ? "✓ Accurate Understanding" : "⚠️ Misconception Detected"}
                  </span>
                </div>
              )}

              {/* Message Text */}
              <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                {msg.text}
              </div>

              {/* Analogy Card */}
              {msg.analogy && (
                <div style={{ marginTop: 10, padding: "8px 12px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 6, fontSize: 11, color: "#92400E" }}>
                  💡 <strong>Intuitive Analogy:</strong> {msg.analogy}
                </div>
              )}

              {/* Socratic Question */}
              {msg.socraticQuestion && (
                <div style={{ marginTop: 10, padding: "8px 12px", background: "#EFF4FE", border: "1px solid #D2E0FB", borderRadius: 6, fontSize: 12, fontWeight: 700, color: "#1E40AF" }}>
                  ❓ <strong>Socratic Question:</strong> {msg.socraticQuestion}
                </div>
              )}

              {/* Recommended Action Bridge Button */}
              {msg.recommendedAction && onNavigateTab && (
                <div style={{ marginTop: 10 }}>
                  <button
                    onClick={() => onNavigateTab(msg.recommendedAction!.targetTab)}
                    style={{
                      padding: "6px 12px",
                      background: "#356AE6",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    {msg.recommendedAction.label}
                  </button>
                </div>
              )}

              {/* Suggested Quick Replies */}
              {msg.suggestedQuickReplies && msg.suggestedQuickReplies.length > 0 && (
                <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {msg.suggestedQuickReplies.map((r, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(r)}
                      style={{
                        padding: "4px 10px",
                        background: "#F6F5F1",
                        border: "1px solid #E4E1DA",
                        borderRadius: 14,
                        fontSize: 11,
                        color: "#162A43",
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}

              <div style={{ fontSize: 9, color: msg.sender === "student" ? "#94A3B8" : "#98A2B3", marginTop: 6, textAlign: "right" }}>
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div style={{ display: "flex", gap: 6, alignItems: "center", color: "#667085", fontSize: 11, fontStyle: "italic" }}>
            <span>🤖 AI Teacher is contemplating...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Intent Bar */}
      <div style={{ padding: "8px 16px", background: "#FBFBFA", borderTop: "1px solid #E4E1DA", display: "flex", gap: 6, overflowX: "auto" }}>
        {[
          "Make it simpler",
          "Show visually",
          "Give another example",
          "Let me try code",
          "Ask me a question",
          "Go deeper into CPython",
          "Why does this matter for interviews?"
        ].map((action, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(action)}
            style={{
              padding: "4px 8px",
              background: "#FFFFFF",
              border: "1px solid #E4E1DA",
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 700,
              color: "#667085",
              cursor: "pointer",
              whiteSpace: "nowrap"
            }}
          >
            {action}
          </button>
        ))}
      </div>

      {/* Message Input Box */}
      <div style={{ padding: "12px 16px", background: "#FFFFFF", borderTop: "1px solid #E4E1DA", display: "flex", gap: 10 }}>
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSendMessage()}
          placeholder={language === "english" ? "Type your thoughts, doubts, or answers..." : "Apna answer ya doubt yahan likhein..."}
          style={{
            flex: 1,
            padding: "8px 12px",
            fontSize: 12,
            borderRadius: 6,
            border: "1px solid #E4E1DA",
            outline: "none"
          }}
        />
        <button
          onClick={() => handleSendMessage()}
          style={{
            padding: "8px 16px",
            background: "#162A43",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

