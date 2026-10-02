/**
 * COGNALYZE GLOBAL ERROR-RESILIENCE LAYER
 * 
 * Maps technical, network, API, and parsing errors into graceful, 
 * human-readable states without leaking raw stack traces to users.
 */

export interface FriendlyError {
  title: string;
  message: string;
  actionText: string;
  retryable: boolean;
  category: "network" | "rate_limit" | "timeout" | "parsing" | "auth" | "validation" | "server" | "unknown";
}

export function toFriendlyError(err: any): FriendlyError {
  if (!err) {
    return {
      title: "Something unexpected happened",
      message: "I couldn't process this right now. Your data is safe. Try again.",
      actionText: "Try Again",
      retryable: true,
      category: "unknown"
    };
  }

  const rawMsg = (typeof err === "string" ? err : err?.message || err?.error || "").toLowerCase();
  const status = err?.status || err?.statusCode || 0;

  // 1. Rate Limit (429)
  if (status === 429 || rawMsg.includes("429") || rawMsg.includes("rate limit") || rawMsg.includes("too many requests") || rawMsg.includes("quota")) {
    return {
      title: "High Demand Notice",
      message: "The AI analysis capacity is temporarily constrained under high campus traffic. Reconnecting with backup engine momentarily.",
      actionText: "Retry Analysis",
      retryable: true,
      category: "rate_limit"
    };
  }

  // 2. Timeout / Abort
  if (rawMsg.includes("timeout") || rawMsg.includes("aborted") || rawMsg.includes("etimedout") || rawMsg.includes("took too long")) {
    return {
      title: "Operation Timed Out",
      message: "The analysis took longer than expected. Your inputs were preserved and no data was lost.",
      actionText: "Retry Operation",
      retryable: true,
      category: "timeout"
    };
  }

  // 3. Network Disconnect
  if (rawMsg.includes("network") || rawMsg.includes("fetch failed") || rawMsg.includes("failed to fetch") || rawMsg.includes("offline") || rawMsg.includes("econnrefused")) {
    return {
      title: "Connection Interrupted",
      message: "Unable to reach the server. Please check your internet connection. Your current progress is saved locally.",
      actionText: "Reconnect",
      retryable: true,
      category: "network"
    };
  }

  // 4. Authentication / Session Expiry
  if (status === 401 || status === 403 || rawMsg.includes("unauthorized") || rawMsg.includes("forbidden") || rawMsg.includes("session expired") || rawMsg.includes("token expired")) {
    return {
      title: "Session Expired",
      message: "Your secure session has expired. Please sign in again to continue without losing your work.",
      actionText: "Sign In",
      retryable: true,
      category: "auth"
    };
  }

  // 5. File / Parsing Issues
  if (rawMsg.includes("parse") || rawMsg.includes("json") || rawMsg.includes("corrupt") || rawMsg.includes("unsupported file")) {
    return {
      title: "Document Parsing Alert",
      message: "We couldn't reliably extract structured content from this file. You can retry with a standard PDF, text file, or copy-paste directly.",
      actionText: "Select Another File",
      retryable: true,
      category: "parsing"
    };
  }

  // 6. Validation / Bad Request
  if (status === 400 || status === 422 || rawMsg.includes("validation") || rawMsg.includes("invalid input") || rawMsg.includes("too short")) {
    return {
      title: "Incomplete Information",
      message: err?.userMessage || err?.message || "Some required details are missing or need adjustment before we can process.",
      actionText: "Review Fields",
      retryable: true,
      category: "validation"
    };
  }

  // 7. General Fallback
  return {
    title: "Action Paused Gracefully",
    message: "I couldn't process this right now. Your data is safe. Try again.",
    actionText: "Try Again",
    retryable: true,
    category: "server"
  };
}
