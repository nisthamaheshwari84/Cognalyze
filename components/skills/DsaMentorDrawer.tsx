"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  X,
  Send,
  Mic,
  MicOff,
  Image as ImageIcon,
  Volume2,
  VolumeX,
  Code2,
  AlertCircle,
  FileText,
  CornerDownLeft,
  ChevronRight
} from "lucide-react";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";

export interface DsaMentorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeProblemTitle?: string;
  activeProblemId?: string;
  currentCode?: string;
  currentLanguage?: "cpp" | "python" | "javascript" | "java";
}

interface MessageItem {
  id: string;
  sender: "user" | "mentor";
  text: string;
  spokenSummary?: string;
  diagram?: string;
  imagePreview?: string;
  timestamp: string;
}

export function DsaMentorDrawer({
  isOpen,
  onClose,
  activeProblemTitle = "DSA & Problem Solving",
  activeProblemId,
  currentCode = "",
  currentLanguage = "python"
}: DsaMentorDrawerProps) {
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: "welcome-1",
      sender: "mentor",
      text: `Hello! I am your **Cognalyze DSA Mentor**.\n\nI can help you understand algorithms from first principles, debug failing test cases, trace pointer movements, and optimize Big-O complexity.\n\nYou can ask in **English** or **Hinglish**, upload whiteboard/code screenshots, or speak by voice!`,
      spokenSummary: "Hello! I am your Cognalyze DSA Mentor. How can I help you master algorithms today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [includeCode, setIncludeCode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);

  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Voice Recognition setup
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRec) {
        const rec = new SpeechRec();
        rec.continuous = false;
        rec.interimResults = true;
        rec.lang = "en-IN"; // Good for English and Hinglish

        rec.onresult = (event: any) => {
          let transcript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setInputMessage(transcript);
        };

        rec.onerror = () => setIsRecording(false);
        rec.onend = () => setIsRecording(false);

        recognitionRef.current = rec;
      }
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please type your query.");
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        setIsRecording(false);
      }
    }
  };

  const handleSpeakText = (msgId: string, text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speakingId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      alert("File size exceeds 4MB. Please upload a smaller image.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const finalMsg = (textToSend || inputMessage).trim();
    if ((!finalMsg && !attachedImage) || loading) return;

    const userMsgId = `user-${Date.now()}`;
    const newMsg: MessageItem = {
      id: userMsgId,
      sender: "user",
      text: finalMsg || "Please analyze this image:",
      imagePreview: attachedImage || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages(prev => [...prev, newMsg]);
    setInputMessage("");
    const imgToSend = attachedImage;
    setAttachedImage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/skills/dsa/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: finalMsg,
          problemId: activeProblemId,
          code: includeCode ? currentCode : undefined,
          language: currentLanguage,
          imageBase64: imgToSend,
          history: messages.slice(-4).map(m => ({
            role: m.sender === "user" ? "user" : "assistant",
            content: m.text
          }))
        })
      });

      const data = await res.json();
      if (data.reply) {
        setMessages(prev => [
          ...prev,
          {
            id: `mentor-${Date.now()}`,
            sender: "mentor",
            text: data.reply,
            spokenSummary: data.spokenSummary,
            diagram: data.diagram,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          }
        ]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "mentor",
          text: "I had a temporary network glitch reaching the reasoning service. In the meantime, verify your search boundaries and invariant checks!",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: 480,
        maxWidth: "100vw",
        background: "#0F172A",
        borderLeft: "1px solid #334155",
        boxShadow: "-8px 0 25px rgba(0,0,0,0.4)",
        display: "flex",
        flexDirection: "column",
        zIndex: 99999,
        color: "#F8FAFC",
        fontFamily: "inherit"
      }}
    >
      {/* Drawer Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid #1E293B",
          background: "#1E293B/80",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: "linear-gradient(135deg, #6366F1, #38BDF8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF"
            }}
          >
            <Sparkles size={18} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF" }}>DSA Mentor AI</div>
            <div style={{ fontSize: 11, color: "#94A3B8" }}>Socratic • Vision • Voice • Hinglish</div>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            color: "#94A3B8",
            cursor: "pointer",
            padding: 4,
            borderRadius: 6
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Context Badge */}
      <div
        style={{
          padding: "8px 20px",
          background: "#1E293B",
          borderBottom: "1px solid #334155",
          fontSize: 11,
          color: "#94A3B8",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          <span style={{ color: "#38BDF8", fontWeight: 700 }}>📍 Context:</span>
          <span style={{ color: "#F1F5F9", fontWeight: 600 }}>{activeProblemTitle}</span>
        </div>
        {currentCode && (
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", color: includeCode ? "#38BDF8" : "#64748B" }}>
            <input
              type="checkbox"
              checked={includeCode}
              onChange={e => setIncludeCode(e.target.checked)}
              style={{ cursor: "pointer" }}
            />
            <span>Include Code</span>
          </label>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
        {messages.map(m => (
          <div
            key={m.id}
            style={{
              alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
              maxWidth: "88%",
              display: "flex",
              flexDirection: "column",
              gap: 4
            }}
          >
            <div
              style={{
                background: m.sender === "user" ? "#4F46E5" : "#1E293B",
                color: "#F8FAFC",
                padding: "12px 16px",
                borderRadius: m.sender === "user" ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                border: m.sender === "user" ? "none" : "1px solid #334155",
                fontSize: 13,
                lineHeight: 1.5
              }}
            >
              {m.imagePreview && (
                <div style={{ marginBottom: 8, borderRadius: 8, overflow: "hidden", maxHeight: 180 }}>
                  <img src={m.imagePreview} alt="Attached Diagram" style={{ width: "100%", objectFit: "cover" }} />
                </div>
              )}
              <MarkdownRenderer content={m.text} isDark={true} />

              {/* Spoken Audio Button for Mentor Messages */}
              {m.sender === "mentor" && m.spokenSummary && (
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, borderTop: "1px solid #334155", paddingTop: 6 }}>
                  <button
                    onClick={() => handleSpeakText(m.id, m.spokenSummary!)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: speakingId === m.id ? "#38BDF8" : "#94A3B8",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 11
                    }}
                  >
                    {speakingId === m.id ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    <span>{speakingId === m.id ? "Stop Speech" : "Listen Summary"}</span>
                  </button>
                </div>
              )}
            </div>
            <div style={{ fontSize: 10, color: "#64748B", alignSelf: m.sender === "user" ? "flex-end" : "flex-start", padding: "0 4px" }}>
              {m.timestamp}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ alignSelf: "flex-start", background: "#1E293B", border: "1px solid #334155", padding: "10px 16px", borderRadius: 12, fontSize: 12, color: "#38BDF8", display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={16} />
            <span>Mentor is analyzing algorithmic invariants...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div style={{ padding: "0 20px 8px 20px", display: "flex", gap: 6, overflowX: "auto" }}>
        {["Explain Invariant", "Dry Run", "Edge Cases", "Hinglish m samjhao"].map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(chip)}
            disabled={loading}
            style={{
              background: "#1E293B",
              border: "1px solid #334155",
              color: "#94A3B8",
              padding: "4px 10px",
              borderRadius: 14,
              fontSize: 11,
              whiteSpace: "nowrap",
              cursor: "pointer"
            }}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Image Preview Thumbnail if attached */}
      {attachedImage && (
        <div style={{ padding: "0 20px 8px 20px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ position: "relative", width: 50, height: 50, borderRadius: 6, overflow: "hidden", border: "1px solid #38BDF8" }}>
            <img src={attachedImage} alt="Attachment" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <button
              onClick={() => setAttachedImage(null)}
              style={{ position: "absolute", top: 0, right: 0, background: "rgba(0,0,0,0.6)", color: "#FFF", border: "none", cursor: "pointer", padding: 2 }}
            >
              <X size={12} />
            </button>
          </div>
          <span style={{ fontSize: 11, color: "#38BDF8" }}>Image attached for vision inspection</span>
        </div>
      )}

      {/* Input Box Footer */}
      <div style={{ padding: "12px 20px", borderTop: "1px solid #1E293B", background: "#0F172A", display: "flex", gap: 8, alignItems: "center" }}>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/png, image/jpeg, image/webp"
          style={{ display: "none" }}
          onChange={handleImageSelect}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Upload code screenshot or diagram"
          style={{
            background: attachedImage ? "#38BDF8" : "#1E293B",
            color: attachedImage ? "#0F172A" : "#94A3B8",
            border: "1px solid #334155",
            borderRadius: 8,
            padding: 8,
            cursor: "pointer"
          }}
        >
          <ImageIcon size={18} />
        </button>

        <button
          onClick={toggleRecording}
          title={isRecording ? "Stop voice recording" : "Speak question"}
          style={{
            background: isRecording ? "#EF4444" : "#1E293B",
            color: isRecording ? "#FFFFFF" : "#94A3B8",
            border: isRecording ? "1px solid #EF4444" : "1px solid #334155",
            borderRadius: 8,
            padding: 8,
            cursor: "pointer"
          }}
        >
          {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
        </button>

        <input
          type="text"
          value={inputMessage}
          disabled={loading}
          onChange={e => setInputMessage(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !loading && handleSendMessage()}
          placeholder="Ask a question or explain code..."
          style={{
            flex: 1,
            background: "#1E293B",
            border: "1px solid #334155",
            borderRadius: 8,
            padding: "10px 14px",
            color: "#FFFFFF",
            fontSize: 12,
            outline: "none"
          }}
        />

        <button
          onClick={() => handleSendMessage()}
          disabled={loading || (!inputMessage.trim() && !attachedImage)}
          style={{
            background: (!inputMessage.trim() && !attachedImage) ? "#334155" : "#4F46E5",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 8,
            padding: "10px 14px",
            cursor: (!inputMessage.trim() && !attachedImage) ? "not-allowed" : "pointer"
          }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
