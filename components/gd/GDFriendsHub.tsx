"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, ShieldCheck, ArrowRight, KeyRound, PlusCircle, AlertCircle } from "lucide-react";
import { GDThemeTokens } from "./gd-theme";
import { GDTopicItem } from "@/lib/group-discussion-data";

interface GDFriendsHubProps {
  T: GDThemeTokens;
  topicsPool: GDTopicItem[];
  simulationFormat: "collaborative" | "competitive" | "corporate" | "technical_business";
  setSimulationFormat: (val: "collaborative" | "competitive" | "corporate" | "technical_business") => void;
  difficultyTier: "beginner" | "intermediate" | "advanced" | "expert";
  setDifficultyTier: (val: "beginner" | "intermediate" | "advanced" | "expert") => void;
}

export default function GDFriendsHub({
  T,
  topicsPool,
  simulationFormat,
  setSimulationFormat,
  difficultyTier,
  setDifficultyTier
}: GDFriendsHubProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"join" | "create">("create");
  const [roomCode, setRoomCode] = useState("");
  const [topicInput, setTopicInput] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<number>(15);
  const [maxParticipants, setMaxParticipants] = useState<number>(6);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    if (!roomCode.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/gd/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join_room",
          roomCodeOrId: roomCode.trim()
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Unable to join room.");
      }
      router.push(`/student/gd-practice?room=${encodeURIComponent(data.room.roomCode)}`);
    } catch (err: any) {
      setError(err.message || "Failed to join Friends GD room.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    try {
      const topicToUse = topicInput.trim() || topicsPool[0]?.title || "Campus Placement Group Discussion";
      const res = await fetch("/api/gd/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_room",
          topicTitle: topicToUse,
          format: simulationFormat,
          difficulty: difficultyTier,
          durationMinutes,
          maxParticipants
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Unable to create private room.");
      }
      router.push(`/student/gd-practice?room=${encodeURIComponent(data.room.roomCode)}`);
    } catch (err: any) {
      setError(err.message || "Failed to create Friends GD room.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))", gap: 18 }}>
      {/* Main Room Host/Join Panel */}
      <div
        style={{
          backgroundColor: T.bgCard,
          border: `1px solid ${T.border}`,
          borderRadius: 12,
          padding: 24,
          boxShadow: T.shadowCard
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Users size={18} style={{ color: T.accent }} />
          <h2 style={{ fontSize: 17, fontWeight: 800, color: T.textPrimary, margin: 0 }}>
            Friends Multiplayer GD Rooms
          </h2>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          <button
            type="button"
            onClick={() => {
              setMode("create");
              setError(null);
            }}
            style={{
              flex: 1,
              padding: "9px 12px",
              borderRadius: 8,
              border: `1px solid ${mode === "create" ? T.accent : T.border}`,
              backgroundColor: mode === "create" ? T.accentSoft : T.bgSubtle,
              color: mode === "create" ? T.accent : T.textSecondary,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6
            }}
          >
            <PlusCircle size={14} />
            <span>Host Private Room</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("join");
              setError(null);
            }}
            style={{
              flex: 1,
              padding: "9px 12px",
              borderRadius: 8,
              border: `1px solid ${mode === "join" ? T.accent : T.border}`,
              backgroundColor: mode === "join" ? T.accentSoft : T.bgSubtle,
              color: mode === "join" ? T.accent : T.textSecondary,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6
            }}
          >
            <KeyRound size={14} />
            <span>Join with Room Code</span>
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              backgroundColor: T.dangerSoft,
              color: T.danger,
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 14,
              display: "flex",
              alignItems: "center",
              gap: 7
            }}
          >
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {mode === "create" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", marginBottom: 6 }}>
                Topic Title (Leave blank to use top curated prompt)
              </label>
              <input
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder={topicsPool[0]?.title || "Enter discussion topic..."}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  backgroundColor: T.bgSubtle,
                  border: `1px solid ${T.borderStrong}`,
                  color: T.textPrimary,
                  fontSize: 12,
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", marginBottom: 4 }}>
                  Format
                </label>
                <select
                  value={simulationFormat}
                  onChange={(e: any) => setSimulationFormat(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 7,
                    backgroundColor: T.bgSubtle,
                    border: `1px solid ${T.border}`,
                    color: T.textPrimary,
                    fontSize: 12
                  }}
                >
                  <option value="competitive">Competitive Placement</option>
                  <option value="collaborative">Collaborative</option>
                  <option value="corporate">Corporate Boardroom</option>
                  <option value="technical_business">Technical & Business</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", marginBottom: 4 }}>
                  Difficulty
                </label>
                <select
                  value={difficultyTier}
                  onChange={(e: any) => setDifficultyTier(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 7,
                    backgroundColor: T.bgSubtle,
                    border: `1px solid ${T.border}`,
                    color: T.textPrimary,
                    fontSize: 12
                  }}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", marginBottom: 4 }}>
                  Duration (Mins)
                </label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 7,
                    backgroundColor: T.bgSubtle,
                    border: `1px solid ${T.border}`,
                    color: T.textPrimary,
                    fontSize: 12
                  }}
                >
                  <option value={10}>10 mins</option>
                  <option value={15}>15 mins</option>
                  <option value={20}>20 mins</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", marginBottom: 4 }}>
                  Max Peers
                </label>
                <select
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(Number(e.target.value))}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 7,
                    backgroundColor: T.bgSubtle,
                    border: `1px solid ${T.border}`,
                    color: T.textPrimary,
                    fontSize: 12
                  }}
                >
                  <option value={4}>4 Peers</option>
                  <option value={6}>6 Peers</option>
                  <option value={8}>8 Peers</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleCreate}
              style={{
                width: "100%",
                padding: "11px 16px",
                borderRadius: 8,
                background: `linear-gradient(135deg, ${T.accent}, ${T.accentSecondary})`,
                color: "#FFFFFF",
                border: "none",
                fontSize: 13,
                fontWeight: 700,
                cursor: loading ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6
              }}
            >
              <span>{loading ? "Generating Room..." : "Create Private Friends Room"}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", marginBottom: 6 }}>
                6-Character Invite Code
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="E.g. X7K9PQ"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 8,
                  backgroundColor: T.bgSubtle,
                  border: `1px solid ${T.borderStrong}`,
                  color: T.textPrimary,
                  fontSize: 16,
                  fontWeight: 800,
                  letterSpacing: 3,
                  textAlign: "center",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <button
              type="button"
              disabled={loading || !roomCode.trim()}
              onClick={handleJoin}
              style={{
                width: "100%",
                padding: "11px 16px",
                borderRadius: 8,
                background: `linear-gradient(135deg, ${T.accent}, ${T.accentSecondary})`,
                color: "#FFFFFF",
                border: "none",
                fontSize: 13,
                fontWeight: 700,
                cursor: loading ? "wait" : "pointer"
              }}
            >
              {loading ? "Connecting..." : "Join Friends GD Room"}
            </button>
          </div>
        )}
      </div>

      {/* Right Rules & Evaluation Parity Card */}
      <div
        style={{
          backgroundColor: T.bgCard,
          border: `1px solid ${T.border}`,
          borderRadius: 12,
          padding: 24,
          boxShadow: T.shadowCard,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: 14
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <ShieldCheck size={17} style={{ color: T.success }} />
            <h3 style={{ fontSize: 15, fontWeight: 800, color: T.textPrimary, margin: 0 }}>
              How Multiplayer Student Rooms Work
            </h3>
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: T.textSecondary, lineHeight: 1.65 }}>
            <li>
              <strong>Private Access:</strong> Only students holding the host room code can join an open session.
            </li>
            <li>
              <strong>AI Moderator Protection:</strong> All rooms are monitored by Cognalyze's 3-Warning conduct guard to
              prevent harassment while protecting vigorous technical disagreement.
            </li>
            <li>
              <strong>Individual Reports:</strong> Every participant is evaluated independently on their own spoken and
              typed interventions at the end of the session.
            </li>
          </ul>
        </div>

        <div
          style={{
            padding: 12,
            borderRadius: 8,
            backgroundColor: T.infoSoft,
            border: `1px solid ${T.infoBorder}`,
            fontSize: 11,
            color: T.textSecondary,
            lineHeight: 1.5
          }}
        >
          <strong>Architecture Note:</strong> Room persistence, Supabase Realtime state streaming, and peer-to-peer
          WebRTC live audio transport are being upgraded in Phases 2 & 8 so multi-client rooms stay synchronized across
          serverless instances.
        </div>
      </div>
    </div>
  );
}
