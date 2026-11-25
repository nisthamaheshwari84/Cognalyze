"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { GDFriendsRoom, GDTranscriptItem } from "@/lib/gd/types";

interface UseFriendsRealtimeRoomOptions {
  room: GDFriendsRoom | null;
  selfUserId: string | null;
  micActive: boolean;
  onRemoteRoomSync: (payload: {
    room: GDFriendsRoom;
    sessionId: string | null;
    transcripts: GDTranscriptItem[];
    currentStage?: string;
  }) => void;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

/**
 * Manages live multiplayer synchronization for Friends GD rooms:
 * - Supabase Realtime Broadcast & Presence channel (instant updates + WebRTC signaling)
 * - Peer-to-peer WebRTC live audio streams when mic is enabled (browser permission safe)
 * - Automatic HTTP poll fallback (`poll_room`) ensuring resilient cross-browser sync
 */
export function useFriendsRealtimeRoom({
  room,
  selfUserId,
  micActive,
  onRemoteRoomSync
}: UseFriendsRealtimeRoomOptions) {
  const [realtimeStatus, setRealtimeStatus] = useState<"connecting" | "realtime_active" | "poll_fallback">("connecting");
  const [connectedVoicePeers, setConnectedVoicePeers] = useState<number>(0);

  const channelRef = useRef<any>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudiosRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const onSyncRef = useRef(onRemoteRoomSync);
  onSyncRef.current = onRemoteRoomSync;

  const roomId = room?.roomId || null;
  const roomCode = room?.roomCode || null;

  const pollRoomNow = useCallback(async () => {
    if (!roomId) return;
    try {
      const res = await fetch("/api/gd/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "poll_room", roomId })
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && data.room) {
        onSyncRef.current({
          room: data.room,
          sessionId: data.sessionId || null,
          transcripts: Array.isArray(data.transcripts) ? data.transcripts : [],
          currentStage: data.currentStage
        });
      }
    } catch {}
  }, [roomId]);

  const broadcastEvent = useCallback((event: string, payload: Record<string, any>) => {
    if (!channelRef.current) return;
    try {
      channelRef.current.send({
        type: "broadcast",
        event,
        payload: { ...payload, senderId: selfUserId }
      });
    } catch {}
  }, [selfUserId]);

  // Cleanup WebRTC streams on unmount
  const cleanupAudio = useCallback(() => {
    peerConnectionsRef.current.forEach((pc) => {
      try {
        pc.close();
      } catch {}
    });
    peerConnectionsRef.current.clear();

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }

    remoteAudiosRef.current.forEach((audioEl) => {
      try {
        audioEl.pause();
        audioEl.srcObject = null;
      } catch {}
    });
    remoteAudiosRef.current.clear();
    setConnectedVoicePeers(0);
  }, []);

  // Setup Supabase Realtime channel + WebRTC signaling + resilient poll interval
  useEffect(() => {
    if (!roomId || !roomCode) return;

    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const canUseSupabaseRealtime =
      typeof supabase?.channel === "function" &&
      rawUrl.startsWith("http") &&
      !rawUrl.includes("placeholder");

    let channel: any = null;

    const getOrCreatePeer = (remoteId: string): RTCPeerConnection => {
      const existing = peerConnectionsRef.current.get(remoteId);
      if (existing) return existing;

      const pc = new RTCPeerConnection(ICE_SERVERS);
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      pc.onicecandidate = (e) => {
        if (e.candidate && channelRef.current) {
          channelRef.current.send({
            type: "broadcast",
            event: "webrtc_signal",
            payload: { targetId: remoteId, senderId: selfUserId, candidate: e.candidate }
          });
        }
      };

      pc.ontrack = (e) => {
        const stream = e.streams?.[0];
        if (!stream || typeof Audio === "undefined") return;
        let audioEl = remoteAudiosRef.current.get(remoteId);
        if (!audioEl) {
          audioEl = new Audio();
          audioEl.autoplay = true;
          remoteAudiosRef.current.set(remoteId, audioEl);
        }
        audioEl.srcObject = stream;
        audioEl.play().catch(() => {});
        setConnectedVoicePeers(peerConnectionsRef.current.size);
      };

      peerConnectionsRef.current.set(remoteId, pc);
      setConnectedVoicePeers(peerConnectionsRef.current.size);
      return pc;
    };

    if (canUseSupabaseRealtime) {
      try {
        channel = supabase.channel(`gd-friends-room:${roomCode}`);
        channel
          .on("broadcast", { event: "room_sync_nudge" }, () => {
            void pollRoomNow();
          })
          .on("broadcast", { event: "webrtc_signal" }, async ({ payload }: any) => {
            if (!payload || payload.senderId === selfUserId) return;
            if (payload.targetId && payload.targetId !== selfUserId) return;
            try {
              const pc = getOrCreatePeer(payload.senderId);
              if (payload.sdp) {
                await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
                if (payload.sdp.type === "offer") {
                  const answer = await pc.createAnswer();
                  await pc.setLocalDescription(answer);
                  channel.send({
                    type: "broadcast",
                    event: "webrtc_signal",
                    payload: {
                      targetId: payload.senderId,
                      senderId: selfUserId,
                      sdp: answer
                    }
                  });
                }
              } else if (payload.candidate) {
                await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
              }
            } catch {}
          })
          .subscribe((status: string) => {
            if (status === "SUBSCRIBED") {
              setRealtimeStatus("realtime_active");
            } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
              setRealtimeStatus("poll_fallback");
            }
          });
        channelRef.current = channel;
      } catch {
        setRealtimeStatus("poll_fallback");
      }
    } else {
      setRealtimeStatus("poll_fallback");
    }

    const pollInterval = setInterval(() => {
      void pollRoomNow();
    }, 2500);

    return () => {
      clearInterval(pollInterval);
      if (channel && typeof supabase?.removeChannel === "function") {
        try {
          supabase.removeChannel(channel);
        } catch {}
      }
      channelRef.current = null;
      cleanupAudio();
    };
  }, [roomId, roomCode, selfUserId, pollRoomNow, cleanupAudio]);

  // Toggle WebRTC local audio stream cleanly when mic toggles in a Friends Room
  useEffect(() => {
    if (!roomId || !selfUserId || typeof navigator === "undefined") return;

    if (!micActive) {
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((t) => {
          t.enabled = false;
        });
      }
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof RTCPeerConnection === "undefined") {
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        if (!localStreamRef.current) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          if (cancelled) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          localStreamRef.current = stream;
        } else {
          localStreamRef.current.getAudioTracks().forEach((t) => {
            t.enabled = true;
          });
        }

        // Initiate WebRTC audio offers to other participants if Realtime signaling is connected
        if (channelRef.current && room?.participants) {
          for (const member of room.participants) {
            if (member.userId === selfUserId) continue;
            if (!peerConnectionsRef.current.has(member.userId)) {
              const pc = new RTCPeerConnection(ICE_SERVERS);
              localStreamRef.current.getAudioTracks().forEach((track) => {
                pc.addTrack(track, localStreamRef.current!);
              });
              pc.onicecandidate = (e) => {
                if (e.candidate && channelRef.current) {
                  channelRef.current.send({
                    type: "broadcast",
                    event: "webrtc_signal",
                    payload: { targetId: member.userId, senderId: selfUserId, candidate: e.candidate }
                  });
                }
              };
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              peerConnectionsRef.current.set(member.userId, pc);
              channelRef.current.send({
                type: "broadcast",
                event: "webrtc_signal",
                payload: { targetId: member.userId, senderId: selfUserId, sdp: offer }
              });
            }
          }
        }
      } catch {}
    })();

    return () => {
      cancelled = true;
    };
  }, [micActive, roomId, selfUserId, room?.participants]);

  return {
    realtimeStatus,
    connectedVoicePeers,
    pollRoomNow,
    broadcastRoomNudge: () => broadcastEvent("room_sync_nudge", { roomId })
  };
}
