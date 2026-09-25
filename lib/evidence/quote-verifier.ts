/**
 * DETERMINISTIC QUOTE VERIFIER (Truth Contract T4)
 * 
 * Part 2.1 T4:
 * "Every LLM-extracted evidence item carries a verbatim quote and source offsets.
 *  A deterministic verifier confirms the quote exists in the source text
 *  (whitespace/Unicode-normalized). Failure = discard and log.
 *  Unverified extractions are never shown as evidence."
 */

export interface SourceVerificationResult {
  verified: boolean;
  verbatimQuote: string;
  sourceOffsets?: {
    startChar: number;
    endChar: number;
  };
  rejectionReason?: string;
}

/**
 * Unicode-normalizes (NFKC) and cleans punctuation/quotes for robust matching.
 */
export function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .normalize("NFKC")
    // Normalize smart single/double quotes to standard ASCII
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    // Normalize em-dash, en-dash, minus to standard hyphen
    .replace(/[\u2013\u2014\u2212]/g, "-")
    // Normalize non-breaking spaces and diverse whitespace to single space
    .replace(/[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Deterministically verifies if a candidate quote exists in the raw source text.
 * 
 * 1. Checks exact match in raw source text.
 * 2. If not directly found, checks whitespace- and Unicode-normalized source text.
 * 3. Returns exact offsets and verified status.
 * 4. Discards unverified claims.
 */
export function verifyQuoteInSource(
  rawSourceText: string,
  candidateQuote: string
): SourceVerificationResult {
  if (!rawSourceText || !rawSourceText.trim()) {
    return {
      verified: false,
      verbatimQuote: candidateQuote,
      rejectionReason: "Source text is empty or missing.",
    };
  }

  if (!candidateQuote || !candidateQuote.trim()) {
    return {
      verified: false,
      verbatimQuote: "",
      rejectionReason: "Quote is empty.",
    };
  }

  const trimmedQuote = candidateQuote.trim();

  // 1. Check exact raw substring match
  const rawIndex = rawSourceText.indexOf(trimmedQuote);
  if (rawIndex !== -1) {
    return {
      verified: true,
      verbatimQuote: trimmedQuote,
      sourceOffsets: {
        startChar: rawIndex,
        endChar: rawIndex + trimmedQuote.length,
      },
    };
  }

  // 2. Try normalized matching
  const normalizedSource = normalizeText(rawSourceText);
  const normalizedQuote = normalizeText(trimmedQuote);

  if (!normalizedQuote) {
    return {
      verified: false,
      verbatimQuote: candidateQuote,
      rejectionReason: "Normalized quote yielded empty string.",
    };
  }

  const normIndex = normalizedSource.indexOf(normalizedQuote);
  if (normIndex !== -1) {
    // Quote is verified in normalized source text.
    return {
      verified: true,
      verbatimQuote: normalizedQuote,
      sourceOffsets: {
        startChar: normIndex,
        endChar: normIndex + normalizedQuote.length,
      },
    };
  }

  // 3. Unverified — strictly discard and return failure per T4
  return {
    verified: false,
    verbatimQuote: candidateQuote,
    rejectionReason: "Quote could not be located in source text via exact or normalized verification.",
  };
}

/**
 * Batch verifies an array of extracted evidence items against a source document.
 * Automatically filters out any unverified items and logs rejection details.
 */
export function filterAndVerifyEvidenceItems<
  T extends { quote: string; [key: string]: any }
>(
  rawSourceText: string,
  items: T[]
): {
  verifiedItems: (T & { verifiedQuote: string; sourceOffsets: { startChar: number; endChar: number } })[];
  discardedCount: number;
  rejectionLogs: { quote: string; reason: string }[];
} {
  const verifiedItems: (T & { verifiedQuote: string; sourceOffsets: { startChar: number; endChar: number } })[] = [];
  const rejectionLogs: { quote: string; reason: string }[] = [];

  for (const item of items) {
    const result = verifyQuoteInSource(rawSourceText, item.quote);
    if (result.verified && result.sourceOffsets) {
      verifiedItems.push({
        ...item,
        verifiedQuote: result.verbatimQuote,
        sourceOffsets: result.sourceOffsets,
      });
    } else {
      rejectionLogs.push({
        quote: item.quote,
        reason: result.rejectionReason || "Verification failed.",
      });
    }
  }

  return {
    verifiedItems,
    discardedCount: rejectionLogs.length,
    rejectionLogs,
  };
}
