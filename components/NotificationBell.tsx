"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export interface NotificationItem {
  id: string;
  student_id: string;
  source_feature: string;
  notification_type: string;
  title: string;
  body: string;
  link_url: string;
  priority: "low" | "normal" | "high";
  is_read: boolean;
  created_at: string;
}

interface NotificationBellProps {
  candidateId?: string;
  className?: string;
}

export default function NotificationBell({ candidateId = "student-demo", className = "" }: NotificationBellProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`/api/student/notifications?candidateId=${candidateId}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 25000);
    return () => clearInterval(interval);
  }, [candidateId]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(`/api/student/notifications/${id}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId })
      });
      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/student/notifications/mark-all-read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId })
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = async (notif: NotificationItem) => {
    if (!notif.is_read) {
      await handleMarkAsRead(notif.id);
    }
    setIsOpen(false);
    if (notif.link_url) {
      router.push(notif.link_url);
    }
  };

  const formatSourceLabel = (src: string) => {
    switch (src) {
      case "calendar":
        return { label: "Calendar", color: "#38bdf8", icon: "🗓️" };
      case "matching":
        return { label: "Matching", color: "#a855f7", icon: "🎯" };
      case "question_bank":
        return { label: "Question Bank", color: "#ec4899", icon: "💡" };
      case "company_brief":
        return { label: "Company Brief", color: "#f59e0b", icon: "🏢" };
      case "dsa_tracker":
        return { label: "DSA Tracker", color: "#10b981", icon: "⚡" };
      case "application_tracker":
        return { label: "Pipeline", color: "#6366f1", icon: "📋" };
      default:
        return { label: src.replace("_", " "), color: "#94a3b8", icon: "🔔" };
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return "Just now";
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      const days = Math.floor(hrs / 24);
      return `${days}d ago`;
    } catch {
      return "Recent";
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative", display: "inline-block" }} className={className}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        aria-label="Notifications"
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 38,
          height: 38,
          borderRadius: 10,
          background: isOpen ? "rgba(99, 102, 241, 0.2)" : "rgba(255, 255, 255, 0.04)",
          border: isOpen ? "1px solid rgba(99, 102, 241, 0.5)" : "1px solid rgba(255, 255, 255, 0.1)",
          color: unreadCount > 0 ? "#ffffff" : "rgba(255, 255, 255, 0.7)",
          cursor: "pointer",
          fontSize: 16,
          transition: "all 0.2s ease"
        }}
      >
        <span>🔔</span>

        {/* Glowing unread badge */}
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -3,
              right: -3,
              minWidth: 18,
              height: 18,
              borderRadius: 999,
              background: "linear-gradient(135deg, #ef4444, #f59e0b)",
              color: "#ffffff",
              fontSize: 10,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
              boxShadow: "0 0 10px rgba(239, 68, 68, 0.7)",
              border: "1.5px solid #090d16",
              animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: 46,
            right: 0,
            width: 380,
            maxHeight: 520,
            background: "#0c101d",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            borderRadius: 16,
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(99, 102, 241, 0.15)",
            backdropFilter: "blur(20px)",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "fadeIn 0.15s ease-out"
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "rgba(255, 255, 255, 0.02)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#ffffff", letterSpacing: "-0.3px" }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 7px",
                    borderRadius: 999,
                    background: "rgba(99, 102, 241, 0.2)",
                    color: "#818cf8",
                    border: "1px solid rgba(99, 102, 241, 0.4)"
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={loading}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "4px 8px",
                  borderRadius: 6,
                  transition: "all 0.15s"
                }}
                onMouseEnter={e => (e.currentTarget.style.color = "#38bdf8")}
                onMouseLeave={e => (e.currentTarget.style.color = "#94a3b8")}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification Items List */}
          <div
            style={{
              overflowY: "auto",
              flex: 1,
              maxHeight: 440,
              display: "flex",
              flexDirection: "column"
            }}
          >
            {notifications.length === 0 ? (
              // Empty State
              <div
                style={{
                  padding: "48px 24px",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10
                }}
              >
                <div style={{ fontSize: 32 }}>✨</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>You&apos;re all caught up</div>
                <div style={{ fontSize: 12, color: "#94a3b8", maxWidth: 240, lineHeight: 1.5 }}>
                  No new alerts. Your deadlines, prep reviews, and high-fit matches are in order!
                </div>
              </div>
            ) : (
              notifications.map(n => {
                const srcMeta = formatSourceLabel(n.source_feature);
                const isHigh = n.priority === "high";
                const isLow = n.priority === "low";

                return (
                  <div
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    style={{
                      padding: "13px 16px",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                      cursor: "pointer",
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                      background: !n.is_read
                        ? isHigh
                          ? "rgba(239, 68, 68, 0.07)"
                          : "rgba(99, 102, 241, 0.06)"
                        : "transparent",
                      borderLeft: !n.is_read
                        ? isHigh
                          ? "3px solid #f59e0b"
                          : "3px solid #6366f1"
                        : "3px solid transparent",
                      transition: "background 0.15s ease"
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)")}
                    onMouseLeave={e =>
                      (e.currentTarget.style.background = !n.is_read
                        ? isHigh
                          ? "rgba(239, 68, 68, 0.07)"
                          : "rgba(99, 102, 241, 0.06)"
                        : "transparent")
                    }
                  >
                    {/* Feature Icon */}
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: "rgba(255, 255, 255, 0.04)",
                        border: `1px solid ${srcMeta.color}33`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        flexShrink: 0
                      }}
                    >
                      {srcMeta.icon}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 3,
                          gap: 6
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              textTransform: "uppercase",
                              padding: "1px 6px",
                              borderRadius: 4,
                              background: `${srcMeta.color}18`,
                              color: srcMeta.color,
                              letterSpacing: "0.5px"
                            }}
                          >
                            {srcMeta.label}
                          </span>
                          {isHigh && (
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 700,
                                padding: "1px 6px",
                                borderRadius: 4,
                                background: "rgba(245, 158, 11, 0.2)",
                                color: "#fbbf24",
                                border: "1px solid rgba(245, 158, 11, 0.4)"
                              }}
                            >
                              ⚡ High Priority
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: 10, color: "rgba(255, 255, 255, 0.35)", whiteSpace: "nowrap" }}>
                          {formatRelativeTime(n.created_at)}
                        </span>
                      </div>

                      <div
                        style={{
                          fontSize: 12.5,
                          fontWeight: n.is_read ? 500 : 700,
                          color: n.is_read ? "rgba(255, 255, 255, 0.8)" : "#ffffff",
                          lineHeight: 1.4,
                          marginBottom: 3
                        }}
                      >
                        {n.title}
                      </div>

                      {n.body && (
                        <div
                          style={{
                            fontSize: 11.5,
                            color: "rgba(255, 255, 255, 0.5)",
                            lineHeight: 1.4,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical"
                          }}
                        >
                          {n.body}
                        </div>
                      )}
                    </div>

                    {/* Unread indicator / mark read action */}
                    {!n.is_read && (
                      <button
                        type="button"
                        onClick={e => handleMarkAsRead(n.id, e)}
                        title="Mark as read"
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "rgba(255, 255, 255, 0.3)",
                          cursor: "pointer",
                          padding: "2px 4px",
                          fontSize: 12,
                          flexShrink: 0
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#38bdf8")}
                        onMouseLeave={e => (e.currentTarget.style.color = "rgba(255, 255, 255, 0.3)")}
                      >
                        ✓
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
