/**
 * COGNALYZE UNIVERSAL RESPONSE CONTRACT
 * 
 * Guarantees that every AI and analytical feature in Cognalyze produces a 
 * predictable, normalized envelope for the frontend.
 * 
 * Frontends NEVER crash because of missing fields or unexpected shapes.
 */

export type ResponseStatus =
  | "success"
  | "partial_success"
  | "fallback"
  | "insufficient_evidence"
  | "not_found"
  | "needs_verification"
  | "error";

export interface EvidenceItem {
  id?: string;
  source: string;
  sourceType?: "resume" | "github" | "linkedin" | "assessment" | "project" | "interview" | "manual";
  claim: string;
  level?: number; // 0.0 to 1.0 or 0 to 5
  status: "verified" | "partially_verified" | "not_found" | "needs_verification" | "insufficient_evidence" | "conflicting";
  snippet?: string;
  verifiedAt?: string;
}

export interface NextAction {
  label: string;
  href: string;
  category?: "practice" | "verification" | "review" | "navigation";
}

export interface UniversalError {
  code: string;
  message: string;
  userMessage: string;
  retryable: boolean;
  field?: string;
}

export interface UniversalResponse<T = any> {
  status: ResponseStatus;
  result: T;
  evidence: EvidenceItem[];
  warnings: string[];
  missing_information: string[];
  confidence: number; // 0.0 to 1.0 (defensible)
  sources: string[];
  next_action?: NextAction;
  error?: UniversalError;
  timestamp: string;
}

/**
 * Creates a standard success response conforming to the contract.
 */
export function createSuccessResponse<T>(
  result: T,
  options: {
    evidence?: EvidenceItem[];
    warnings?: string[];
    missing_information?: string[];
    confidence?: number;
    sources?: string[];
    next_action?: NextAction;
    status?: ResponseStatus;
  } = {}
): UniversalResponse<T> {
  return {
    status: options.status || "success",
    result,
    evidence: options.evidence || [],
    warnings: options.warnings || [],
    missing_information: options.missing_information || [],
    confidence: typeof options.confidence === "number" ? Math.min(1.0, Math.max(0.0, options.confidence)) : 0.85,
    sources: options.sources || [],
    next_action: options.next_action,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a defensive fallback response when AI or upstream API fails or returns partial data.
 */
export function createFallbackResponse<T>(
  fallbackResult: T,
  options: {
    userMessage?: string;
    internalError?: string;
    evidence?: EvidenceItem[];
    missing_information?: string[];
    next_action?: NextAction;
  } = {}
): UniversalResponse<T> {
  return {
    status: "fallback",
    result: fallbackResult,
    evidence: options.evidence || [],
    warnings: [
      "Generated using deterministic reasoning engine while real-time AI provider is reconnecting."
    ],
    missing_information: options.missing_information || [
      "Real-time live model synthesis was unavailable; grounded fallback applied."
    ],
    confidence: 0.65,
    sources: ["Cognalyze Deterministic Evidence Engine"],
    next_action: options.next_action,
    error: options.userMessage ? {
      code: "AI_PROVIDER_FALLBACK",
      message: options.internalError || "Provider unavailable",
      userMessage: options.userMessage,
      retryable: true
    } : undefined,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates an evidence-gap response when data is insufficient rather than hallucinating.
 */
export function createInsufficientEvidenceResponse<T>(
  partialResult: T,
  missing: string[],
  options: {
    evidence?: EvidenceItem[];
    next_action?: NextAction;
    explanation?: string;
  } = {}
): UniversalResponse<T> {
  return {
    status: "insufficient_evidence",
    result: partialResult,
    evidence: options.evidence || [],
    warnings: [
      "Evidence threshold not met to assert high confidence."
    ],
    missing_information: missing,
    confidence: 0.25,
    sources: (options.evidence || []).map(e => e.source).filter(Boolean),
    next_action: options.next_action,
    error: {
      code: "INSUFFICIENT_EVIDENCE",
      message: "Required corroboration missing",
      userMessage: options.explanation || "I don't have enough verified evidence to determine this with certainty. Here is what is currently provable.",
      retryable: false
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates an error response that is safe for user consumption without raw stack traces.
 */
export function createErrorResponse(
  userMessage: string,
  options: {
    code?: string;
    internalError?: string;
    retryable?: boolean;
    next_action?: NextAction;
  } = {}
): UniversalResponse<null> {
  return {
    status: "error",
    result: null,
    evidence: [],
    warnings: [],
    missing_information: [],
    confidence: 0.0,
    sources: [],
    next_action: options.next_action,
    error: {
      code: options.code || "UNKNOWN_ERROR",
      message: options.internalError || userMessage,
      userMessage: userMessage || "I couldn't process this right now. Your data is safe. Try again.",
      retryable: options.retryable !== false
    },
    timestamp: new Date().toISOString(),
  };
}
