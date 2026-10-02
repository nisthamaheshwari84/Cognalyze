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
        return { label: "Calendar", color: "#356AE6", bg: "#EFF4FE", border: "#D2E0FB", icon: "🗓️" };
      case "matching":
        return { label: "Matching", color: "#2E7D5B", bg: "#EAF4EE", border: "#C8E4D3", icon: "🎯" };
      case "question_bank":
        return { label: "Question Bank", color: "#356AE6", bg: "#EFF4FE", border: "#D2E0FB", icon: "💡" };
      case "company_brief":
        return { label: "Company Brief", color: "#B7791F", bg: "#FEF7ED", border: "#F8D8A7", icon: "🏢" };
      case "dsa_tracker":
        return { label: "DSA Tracker", color: "#2E7D5B", bg: "#EAF4EE", border: "#C8E4D3", icon: "⚡" };
      case "application_tracker":
        return { label: "Pipeline", color: "#162A43", bg: "#F6F5F1", border: "#E4E1DA", icon: "📋" };
      default:
        return { label: src.replace("_", " "), color: "#667085", bg: "#F6F5F1", border: "#E4E1DA", icon: "🔔" };
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
          borderRadius: 8,
          background: isOpen ? "#EFF4FE" : "#FFFFFF",
          border: isOpen ? "1px solid #356AE6" : "1px solid #E4E1DA",
          color: unreadCount > 0 ? "#162A43" : "#667085",
          cursor: "pointer",
          fontSize: 16,
          transition: "all 0.15s ease"
        }}
      >
        <span>🔔</span>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -3,
              right: -3,
              minWidth: 18,
              height: 18,
              borderRadius: 999,
              background: "#C24141",
              color: "#ffffff",
              fontSize: 10,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
              boxShadow: "0 2px 4px rgba(194, 65, 65, 0.25)",
              border: "1.5px solid #FFFFFF"
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
            background: "#FFFFFF",
            border: "1px solid #E4E1DA",
            borderRadius: 12,
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.12)",
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
              borderBottom: "1px solid #E4E1DA",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#FAFAF8"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#17191C", letterSpacing: "-0.3px" }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 7px",
                    borderRadius: 999,
                    background: "#EFF4FE",
                    color: "#356AE6",
                    border: "1px solid #D2E0FB"
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
                  color: "#667085",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "4px 8px",
                  borderRadius: 6,
                  transition: "all 0.15s"
                }}
                onMouseEnter={e => (e.currentTarget.style.color = "#356AE6")}
                onMouseLeave={e => (e.currentTarget.style.color = "#667085")}
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
                <div style={{ fontSize: 14, fontWeight: 700, color: "#17191C" }}>You&apos;re all caught up</div>
                <div style={{ fontSize: 12, color: "#667085", maxWidth: 240, lineHeight: 1.5 }}>
                  No new alerts. Your deadlines, prep reviews, and high-fit matches are in order!
                </div>
              </div>
            ) : (
              notifications.map(n => {
                const srcMeta = formatSourceLabel(n.source_feature);
                const isHigh = n.priority === "high";

                return (
                  <div
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    style={{
                      padding: "13px 16px",
                      borderBottom: "1px solid #E4E1DA",
                      cursor: "pointer",
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                      background: !n.is_read
                        ? isHigh
                          ? "#FEF7ED"
                          : "#EFF4FE"
                        : "#FFFFFF",
                      borderLeft: !n.is_read
                        ? isHigh
                          ? "3px solid #B7791F"
                          : "3px solid #356AE6"
                        : "3px solid transparent",
                      transition: "background 0.15s ease"
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#F6F5F1")}
                    onMouseLeave={e =>
                      (e.currentTarget.style.background = !n.is_read
                        ? isHigh
                          ? "#FEF7ED"
                          : "#EFF4FE"
                        : "#FFFFFF")
                    }
                  >
                    {/* Feature Icon */}
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: srcMeta.bg,
                        border: `1px solid ${srcMeta.border}`,
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
                              padding: "2px 6px",
                              borderRadius: 4,
                              background: srcMeta.bg,
                              color: srcMeta.color,
                              border: `1px solid ${srcMeta.border}`,
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
                                padding: "2px 6px",
                                borderRadius: 4,
                                background: "#FEF7ED",
                                color: "#B7791F",
                                border: "1px solid #F8D8A7"
                              }}
                            >
                              ⚡ High Priority
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: 10, color: "#98A2B3", whiteSpace: "nowrap" }}>
                          {formatRelativeTime(n.created_at)}
                        </span>
                      </div>

                      <div
                        style={{
                          fontSize: 12.5,
                          fontWeight: n.is_read ? 500 : 700,
                          color: n.is_read ? "#667085" : "#17191C",
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
                            color: "#667085",
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
                          color: "#98A2B3",
                          cursor: "pointer",
                          padding: "2px 4px",
                          fontSize: 12,
                          flexShrink: 0
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#356AE6")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#98A2B3")}
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
